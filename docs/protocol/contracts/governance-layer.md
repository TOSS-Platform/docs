# Governance Layer Contracts

Complete smart contract specifications for the TOSS multi-level governance system, including FundGovernance, FMGovernance, ProtocolGovernance, and supporting contracts.

## Overview

The governance layer implements three independent governance systems, each with specialized contracts for their specific contexts:

```
Governance Layer
├── FundGovernance.sol         (fund-specific proposals)
├── FMGovernance.sol           (FM-wide proposals)
├── ProtocolGovernance.sol     (protocol-wide proposals)
├── VoterRegistry.sol          (tracks eligibility)
├── GovernanceTimelock.sol     (delayed execution)
└── GovernanceRewards.sol      (reward distribution)
```

## FundGovernance.sol

### Purpose

Enables fund-level governance where Fund Managers and investors propose and vote on fund-specific parameters.

### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FundGovernance
 * @notice Handles governance for individual funds
 * @dev Voting power based on share ownership, not TOSS staking
 */
contract FundGovernance {
    
    // ============ State Variables ============
    
    IFundRegistry public immutable fundRegistry;
    IFundManagerVault public immutable vault;
    IVoterRegistry public immutable voterRegistry;
    
    uint256 public proposalCount;
    mapping(uint256 => FundProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint8)) public voteChoice;
    
    // ============ Structs ============
    
    struct FundProposal {
        uint256 fundId;
        address proposer;
        ProposerType proposerType;  // FM or INVESTOR
        ProposalType proposalType;
        bytes proposalData;
        string title;
        string description;
        
        uint256 snapshot;           // Block number for share balances
        uint256 votingStarts;
        uint256 votingEnds;
        
        uint256 forVotes;           // Shares voting for
        uint256 againstVotes;       // Shares voting against
        uint256 abstainVotes;       // Shares abstaining
        
        ProposalState state;
        uint256 eta;                // Execution timestamp
        bool fmApproved;            // If investor proposal, did FM approve?
    }
    
    enum ProposerType {
        FUND_MANAGER,
        INVESTOR
    }
    
    enum ProposalType {
        FEE_CHANGE,              // Management or performance fee
        RISK_PARAMETER,          // Drawdown, volatility, etc.
        STRATEGY_UPDATE,         // Strategy description change
        ASSET_LIST_UPDATE,       // Add/remove allowed assets
        LOCKUP_CHANGE,           // Change lockup period
        FM_REPLACEMENT           // Replace Fund Manager
    }
    
    enum ProposalState {
        PENDING,                 // Created, waiting for voting
        ACTIVE,                  // Voting in progress
        SUCCEEDED,               // Passed quorum & approval
        DEFEATED,                // Failed quorum or approval
        QUEUED,                  // In timelock
        EXECUTED,                // Changes applied
        CANCELED,                // Canceled by proposer or emergency
        EXPIRED                  // Not executed in time
    }
    
    // ============ Events ============
    
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed fundId,
        address indexed proposer,
        ProposerType proposerType,
        ProposalType proposalType,
        string title
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,              // 0=against, 1=for, 2=abstain
        uint256 votingPower         // Shares
    );
    
    event ProposalQueued(
        uint256 indexed proposalId,
        uint256 eta
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor
    );
    
    event ProposalCanceled(
        uint256 indexed proposalId,
        address indexed canceler
    );
    
    // ============ FM Proposal Functions ============
    
    /**
     * @notice FM creates proposal for their fund
     * @param fundId The fund ID
     * @param proposalType Type of proposal
     * @param proposalData Encoded proposal data
     * @param title Short title
     * @param description Detailed description
     */
    function createFMProposal(
        uint256 fundId,
        ProposalType proposalType,
        bytes calldata proposalData,
        string calldata title,
        string calldata description
    ) external returns (uint256 proposalId) {
        // Validate FM
        require(
            fundRegistry.getFundManager(fundId) == msg.sender,
            "Not fund manager"
        );
        require(!fundRegistry.isFundPaused(fundId), "Fund paused");
        
        // Validate proposal data
        _validateProposalData(fundId, proposalType, proposalData);
        
        // Create proposal
        proposalId = proposalCount++;
        FundProposal storage proposal = proposals[proposalId];
        
        proposal.fundId = fundId;
        proposal.proposer = msg.sender;
        proposal.proposerType = ProposerType.FUND_MANAGER;
        proposal.proposalType = proposalType;
        proposal.proposalData = proposalData;
        proposal.title = title;
        proposal.description = description;
        proposal.snapshot = block.number;
        proposal.votingStarts = block.timestamp + 1 days;
        proposal.votingEnds = block.timestamp + 6 days;
        proposal.state = ProposalState.PENDING;
        
        emit ProposalCreated(
            proposalId,
            fundId,
            msg.sender,
            ProposerType.FUND_MANAGER,
            proposalType,
            title
        );
    }
    
    // ============ Investor Proposal Functions ============
    
    /**
     * @notice Investor creates proposal for fund they're invested in
     * @param fundId The fund ID
     * @param proposalType Type of proposal
     * @param proposalData Encoded proposal data
     */
    function createInvestorProposal(
        uint256 fundId,
        ProposalType proposalType,
        bytes calldata proposalData,
        string calldata title,
        string calldata description
    ) external returns (uint256 proposalId) {
        // Validate investor eligibility
        uint256 shares = vault.balanceOf(msg.sender, fundId);
        uint256 totalShares = vault.totalShares(fundId);
        uint256 ownershipPct = (shares * 100) / totalShares;
        
        require(ownershipPct >= 1, "Need >= 1% ownership to propose");
        require(
            _holdsSharesFor(msg.sender, fundId) >= 7 days,
            "Must hold shares for 7 days"
        );
        
        // Create proposal
        proposalId = proposalCount++;
        FundProposal storage proposal = proposals[proposalId];
        
        proposal.fundId = fundId;
        proposal.proposer = msg.sender;
        proposal.proposerType = ProposerType.INVESTOR;
        proposal.proposalType = proposalType;
        proposal.proposalData = proposalData;
        proposal.title = title;
        proposal.description = description;
        proposal.snapshot = block.number;
        proposal.votingStarts = block.timestamp + 1 days;
        proposal.votingEnds = block.timestamp + 6 days;
        proposal.state = ProposalState.PENDING;
        proposal.fmApproved = false;  // FM must review
        
        emit ProposalCreated(
            proposalId,
            fundId,
            msg.sender,
            ProposerType.INVESTOR,
            proposalType,
            title
        );
    }
    
    // ============ Voting Functions ============
    
    /**
     * @notice Cast vote on fund proposal
     * @param proposalId The proposal ID
     * @param support 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) external {
        FundProposal storage proposal = proposals[proposalId];
        
        // Validate timing
        require(
            block.timestamp >= proposal.votingStarts,
            "Voting not started"
        );
        require(
            block.timestamp <= proposal.votingEnds,
            "Voting ended"
        );
        require(proposal.state == ProposalState.ACTIVE, "Not active");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        // Get voting power (shares at snapshot)
        uint256 shares = vault.balanceOfAt(
            msg.sender,
            proposal.fundId,
            proposal.snapshot
        );
        require(shares > 0, "No shares at snapshot");
        
        // Record vote
        hasVoted[proposalId][msg.sender] = true;
        voteChoice[proposalId][msg.sender] = support;
        
        if (support == 0) {
            proposal.againstVotes += shares;
        } else if (support == 1) {
            proposal.forVotes += shares;
        } else if (support == 2) {
            proposal.abstainVotes += shares;
        }
        
        emit VoteCast(proposalId, msg.sender, support, shares);
    }
    
    // ============ State Functions ============
    
    /**
     * @notice Get current proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        FundProposal storage proposal = proposals[proposalId];
        
        if (proposal.state == ProposalState.EXECUTED) return ProposalState.EXECUTED;
        if (proposal.state == ProposalState.CANCELED) return ProposalState.CANCELED;
        if (proposal.state == ProposalState.QUEUED) {
            if (block.timestamp > proposal.eta + 14 days) {
                return ProposalState.EXPIRED;
            }
            return ProposalState.QUEUED;
        }
        
        if (block.timestamp < proposal.votingStarts) return ProposalState.PENDING;
        if (block.timestamp <= proposal.votingEnds) return ProposalState.ACTIVE;
        
        // Voting ended - check results
        return _calculateProposalState(proposalId);
    }
    
    function _calculateProposalState(uint256 proposalId) 
        internal 
        view 
        returns (ProposalState) 
    {
        FundProposal storage proposal = proposals[proposalId];
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalShares = vault.totalSharesAt(proposal.fundId, proposal.snapshot);
        
        // Check quorum
        uint256 quorumPct = (totalVotes * 100) / totalShares;
        uint256 requiredQuorum = _getRequiredQuorum(proposal.proposalType);
        
        if (quorumPct < requiredQuorum) {
            return ProposalState.DEFEATED;
        }
        
        // Check approval
        uint256 approvalPct = (proposal.forVotes * 100) / (proposal.forVotes + proposal.againstVotes);
        uint256 requiredApproval = _getRequiredApproval(proposal.proposalType);
        
        if (approvalPct >= requiredApproval) {
            return ProposalState.SUCCEEDED;
        }
        
        return ProposalState.DEFEATED;
    }
    
    // ============ Execution Functions ============
    
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.SUCCEEDED, "Not succeeded");
        
        FundProposal storage proposal = proposals[proposalId];
        uint256 delay = _getTimelockDelay(proposal.proposalType);
        
        proposal.eta = block.timestamp + delay;
        proposal.state = ProposalState.QUEUED;
        
        emit ProposalQueued(proposalId, proposal.eta);
    }
    
    function execute(uint256 proposalId) external {
        FundProposal storage proposal = proposals[proposalId];
        
        require(proposal.state == ProposalState.QUEUED, "Not queued");
        require(block.timestamp >= proposal.eta, "Timelock not passed");
        require(block.timestamp < proposal.eta + 14 days, "Expired");
        
        // Execute based on type
        _executeProposal(proposal);
        
        proposal.state = ProposalState.EXECUTED;
        emit ProposalExecuted(proposalId, msg.sender);
    }
}
```

## FMGovernance.sol

### Purpose

Enables Fund Managers to collectively govern standards and parameters affecting all FMs.

### Contract Specification

```solidity
/**
 * @title FMGovernance
 * @notice Governance system for Fund Manager community
 * @dev Voting power based on AUM managed + reputation
 */
contract FMGovernance {
    
    // ============ State Variables ============
    
    IFundRegistry public immutable fundRegistry;
    IFMScoreCalculator public immutable fmScoreCalculator;
    IStaking public immutable staking;
    
    uint256 public proposalCount;
    mapping(uint256 => FMProposal) public fmProposals;
    mapping(uint256 => mapping(address => bool)) public hasVotedFM;
    
    // ============ Structs ============
    
    struct FMProposal {
        address proposer;
        ProposalType proposalType;
        bytes proposalData;
        string title;
        string description;
        
        uint256 snapshot;
        uint256 votingStarts;
        uint256 votingEnds;
        
        uint256 forVotes;            // Weighted by AUM+reputation
        uint256 againstVotes;
        uint256 totalVotingPower;    // Total FM voting power at snapshot
        
        ProposalState state;
        uint256 eta;
    }
    
    enum ProposalType {
        FM_STAKE_REQUIREMENT,     // Change minimum FM stake
        FUNDCLASS_TEMPLATE,       // Modify FundClass definition
        RISKTIER_DEFINITION,      // Update RiskTier parameters
        CERTIFICATION_STANDARD,   // FM certification requirements
        DISPUTE_PROCEDURE,        // FM-to-FM dispute resolution
        FEE_GUIDELINES,           // Recommended fee ranges
        REPORTING_STANDARD        // Reporting requirements
    }
    
    enum ProposalState {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        QUEUED,
        EXECUTED,
        CANCELED,
        EXPIRED
    }
    
    // ============ Proposal Creation ============
    
    /**
     * @notice Create FM-level proposal
     * @dev Only active FMs can propose
     */
    function createProposal(
        ProposalType proposalType,
        bytes calldata proposalData,
        string calldata title,
        string calldata description
    ) external onlyActiveFM returns (uint256 proposalId) {
        // Validate proposer eligibility
        require(_canFMPropose(msg.sender), "Not eligible to propose");
        
        // Validate proposal data
        _validateFMProposalData(proposalType, proposalData);
        
        // Create proposal
        proposalId = proposalCount++;
        FMProposal storage proposal = fmProposals[proposalId];
        
        proposal.proposer = msg.sender;
        proposal.proposalType = proposalType;
        proposal.proposalData = proposalData;
        proposal.title = title;
        proposal.description = description;
        proposal.snapshot = block.number;
        proposal.votingStarts = block.timestamp + 3 days;  // Discussion period
        proposal.votingEnds = block.timestamp + 10 days;   // 7-day voting
        proposal.totalVotingPower = _getTotalFMVotingPower(block.number);
        proposal.state = ProposalState.PENDING;
        
        emit FMProposalCreated(proposalId, msg.sender, proposalType, title);
    }
    
    // ============ Voting Functions ============
    
    /**
     * @notice Cast vote on FM proposal
     * @param proposalId The proposal ID
     * @param support 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) 
        external 
        onlyActiveFM 
    {
        FMProposal storage proposal = fmProposals[proposalId];
        
        require(block.timestamp >= proposal.votingStarts, "Voting not started");
        require(block.timestamp <= proposal.votingEnds, "Voting ended");
        require(!hasVotedFM[proposalId][msg.sender], "Already voted");
        require(support <= 2, "Invalid support value");
        
        // Calculate voting power (AUM + reputation)
        uint256 votingPower = _getFMVotingPower(msg.sender, proposal.snapshot);
        require(votingPower > 0, "No voting power");
        
        // Record vote
        hasVotedFM[proposalId][msg.sender] = true;
        
        if (support == 0) {
            proposal.againstVotes += votingPower;
        } else if (support == 1) {
            proposal.forVotes += votingPower;
        }
        // Note: abstain not counted in FM governance
        
        emit FMVoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    // ============ Voting Power Calculation ============
    
    /**
     * @notice Calculate FM voting power
     * @dev VP = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)
     */
    function _getFMVotingPower(address fm, uint256 snapshot) 
        internal 
        view 
        returns (uint256) 
    {
        // Get total AUM managed at snapshot
        uint256 totalAUM = fundRegistry.getTotalAUMAt(fm, snapshot);
        if (totalAUM == 0) return 0;
        
        // Get reputation score (0-100)
        uint256 reputation = fmScoreCalculator.getScore(fm);
        
        // Calculate components
        uint256 aumComponent = totalAUM * 60 / 100;
        uint256 repComponent = (totalAUM * reputation * 40) / 10000;
        
        return aumComponent + repComponent;
    }
    
    // ============ Helper Functions ============
    
    function _canFMPropose(address fm) internal view returns (bool) {
        uint256[] memory funds = fundRegistry.getFundsManaged(fm);
        if (funds.length == 0) return false;
        
        uint256 activeSince = fundRegistry.fmActiveSince(fm);
        if (block.timestamp < activeSince + 30 days) return false;
        
        uint256 daysSinceSlash = slashingEngine.daysSinceLastSlash(fm);
        if (daysSinceSlash < 90) return false;
        
        return true;
    }
    
    modifier onlyActiveFM() {
        require(fundRegistry.isActiveFM(msg.sender), "Not active FM");
        _;
    }
}
```

## ProtocolGovernance.sol

### Purpose

Handles protocol-wide proposals with flexible voter groups specified by admin.

### Contract Specification

```solidity
/**
 * @title ProtocolGovernance
 * @notice Protocol-wide governance with admin-specified voter groups
 * @dev Most secure governance layer with Guardian oversight
 */
contract ProtocolGovernance {
    
    // ============ State Variables ============
    
    IAdminCommittee public adminCommittee;
    IGuardianCommittee public guardianCommittee;
    IFundRegistry public fundRegistry;
    IInvestorRegistry public investorRegistry;
    IStaking public staking;
    
    uint256 public proposalCount;
    mapping(uint256 => ProtocolProposal) public protocolProposals;
    mapping(uint256 => mapping(address => bool)) public hasVotedProtocol;
    
    // ============ Structs ============
    
    struct ProtocolProposal {
        address proposer;
        ProposalType proposalType;
        VoterGroup voterGroup;       // Admin specifies voter group
        
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string title;
        string description;
        
        uint256 snapshot;
        uint256 votingStarts;
        uint256 votingEnds;
        
        uint256 forVotes;            // Weighted by TOSS+bonuses
        uint256 againstVotes;
        uint256 totalVotingPower;
        
        ProposalState state;
        uint256 eta;
        bool guardianReviewed;
        bool guardianApproved;
    }
    
    enum VoterGroup {
        FM_ONLY,                     // Only FMs vote
        INVESTOR_ONLY,               // Only non-FM investors vote
        BOTH,                        // FMs and Investors vote
        GUARDIAN_ONLY                // Guardian committee only
    }
    
    enum ProposalType {
        ORACLE_CONFIG,               // Oracle configuration
        SLASHING_FORMULA,            // Slashing parameters
        PROTOCOL_FEE,                // Protocol fee changes
        INVESTOR_CLASS,              // Investor class definitions
        ZKSYNC_INTEGRATION,          // zkSync parameters
        EMERGENCY_ACTION,            // Emergency procedures
        CONTRACT_UPGRADE,            // Proxy upgrades
        TREASURY_OPERATION           // Treasury fund usage
    }
    
    // ============ Proposal Creation ============
    
    /**
     * @notice Admin creates protocol proposal
     * @param proposalType Type of proposal
     * @param voterGroup Who can vote on this proposal
     * @param targets Contract addresses to call
     * @param values ETH values for calls
     * @param calldatas Encoded function calls
     */
    function createProposal(
        ProposalType proposalType,
        VoterGroup voterGroup,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata title,
        string calldata description
    ) external onlyAdmin returns (uint256 proposalId) {
        // Validate inputs
        require(targets.length == values.length, "Length mismatch");
        require(targets.length == calldatas.length, "Length mismatch");
        require(targets.length > 0, "Empty proposal");
        
        // Create proposal
        proposalId = proposalCount++;
        ProtocolProposal storage proposal = protocolProposals[proposalId];
        
        proposal.proposer = msg.sender;
        proposal.proposalType = proposalType;
        proposal.voterGroup = voterGroup;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.title = title;
        proposal.description = description;
        proposal.snapshot = block.number;
        proposal.votingStarts = block.timestamp + 7 days;   // Discussion
        proposal.votingEnds = block.timestamp + 21 days;    // 14-day voting
        proposal.totalVotingPower = _getTotalProtocolVotingPower(
            voterGroup,
            block.number
        );
        proposal.state = ProposalState.PENDING;
        proposal.guardianReviewed = false;
        
        emit ProtocolProposalCreated(
            proposalId,
            msg.sender,
            proposalType,
            voterGroup,
            title
        );
    }
    
    // ============ Voting Functions ============
    
    function castVote(uint256 proposalId, uint8 support) external {
        ProtocolProposal storage proposal = protocolProposals[proposalId];
        
        // Validate timing and eligibility
        require(block.timestamp >= proposal.votingStarts, "Not started");
        require(block.timestamp <= proposal.votingEnds, "Ended");
        require(!hasVotedProtocol[proposalId][msg.sender], "Already voted");
        require(_isEligibleVoter(msg.sender, proposal.voterGroup), "Not eligible");
        
        // Calculate voting power based on group
        uint256 votingPower = _getProtocolVotingPower(
            msg.sender,
            proposal.voterGroup,
            proposal.snapshot
        );
        require(votingPower > 0, "No voting power");
        
        // Record vote
        hasVotedProtocol[proposalId][msg.sender] = true;
        
        if (support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit ProtocolVoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    // ============ Guardian Functions ============
    
    /**
     * @notice Guardian committee vetoes proposal
     * @dev Only during 24-hour review window after voting
     */
    function guardianVeto(uint256 proposalId, string calldata reason) 
        external 
        onlyGuardian 
    {
        ProtocolProposal storage proposal = protocolProposals[proposalId];
        
        require(state(proposalId) == ProposalState.SUCCEEDED, "Not succeeded");
        require(
            block.timestamp < proposal.votingEnds + 24 hours,
            "Veto period expired"
        );
        require(!proposal.guardianReviewed, "Already reviewed");
        
        proposal.guardianReviewed = true;
        proposal.guardianApproved = false;
        proposal.state = ProposalState.DEFEATED;
        
        emit GuardianVeto(proposalId, msg.sender, reason);
    }
    
    function guardianApprove(uint256 proposalId) external onlyGuardian {
        ProtocolProposal storage proposal = protocolProposals[proposalId];
        
        require(state(proposalId) == ProposalState.SUCCEEDED);
        require(!proposal.guardianReviewed, "Already reviewed");
        
        proposal.guardianReviewed = true;
        proposal.guardianApproved = true;
        
        emit GuardianApproved(proposalId, msg.sender);
    }
    
    // ============ Voting Power Calculation ============
    
    function _getProtocolVotingPower(
        address voter,
        VoterGroup group,
        uint256 snapshot
    ) internal view returns (uint256) {
        // Get staked TOSS at snapshot
        uint256 stakedTOSS = staking.balanceOfAt(voter, snapshot);
        if (stakedTOSS == 0) return 0;
        
        // Get lock bonus (0-2.0x)
        uint256 lockBonus = staking.getLockBonus(voter);
        
        // Get role multiplier based on voter group
        uint256 roleMultiplier = _getRoleMultiplier(voter, group);
        
        // Calculate: TOSS × (1 + lock) × role
        return (stakedTOSS * (1e18 + lockBonus) * roleMultiplier) / 1e36;
    }
    
    function _getRoleMultiplier(address voter, VoterGroup group) 
        internal 
        view 
        returns (uint256) 
    {
        if (group == VoterGroup.FM_ONLY) {
            return 15 * 1e17;  // 1.5x
        }
        
        if (group == VoterGroup.INVESTOR_ONLY) {
            InvestorClass class = investorRegistry.getClass(voter);
            if (class == InvestorClass.STRATEGIC) return 20 * 1e17;     // 2.0x
            if (class == InvestorClass.INSTITUTIONAL) return 15 * 1e17; // 1.5x
            if (class == InvestorClass.PREMIUM) return 12 * 1e17;       // 1.2x
            return 10 * 1e17;  // 1.0x Retail
        }
        
        if (group == VoterGroup.BOTH) {
            bool isFM = fundRegistry.isActiveFM(voter);
            if (isFM) return 15 * 1e17;  // 1.5x
            
            InvestorClass class = investorRegistry.getClass(voter);
            if (class == InvestorClass.STRATEGIC) return 20 * 1e17;  // 2.0x
            if (class == InvestorClass.INSTITUTIONAL) return 13 * 1e17;  // 1.3x
            return 10 * 1e17;  // 1.0x
        }
        
        return 10 * 1e17;  // 1.0x default
    }
    
    modifier onlyAdmin() {
        require(
            adminCommittee.isMember(msg.sender),
            "Not admin"
        );
        _;
    }
    
    modifier onlyGuardian() {
        require(
            guardianCommittee.isMember(msg.sender),
            "Not guardian"
        );
        _;
    }
}
```

## VoterRegistry.sol

### Purpose

Central registry tracking voter eligibility and voting power across all governance levels.

### Contract Specification

```solidity
/**
 * @title VoterRegistry
 * @notice Tracks voter eligibility across governance levels
 */
contract VoterRegistry {
    
    IFundRegistry public fundRegistry;
    IFundManagerVault public vault;
    IStaking public staking;
    IInvestorRegistry public investorRegistry;
    
    /**
     * @notice Check if address can vote on fund proposal
     */
    function isFundVoter(address voter, uint256 fundId) 
        external 
        view 
        returns (bool) 
    {
        return vault.balanceOf(voter, fundId) > 0;
    }
    
    /**
     * @notice Check if address can vote on FM proposal
     */
    function isFMVoter(address voter) 
        external 
        view 
        returns (bool) 
    {
        return fundRegistry.isActiveFM(voter) &&
               fundRegistry.getFundsManaged(voter).length > 0;
    }
    
    /**
     * @notice Check if address can vote on protocol proposal
     */
    function isProtocolVoter(address voter, VoterGroup group) 
        external 
        view 
        returns (bool) 
    {
        if (group == VoterGroup.FM_ONLY) {
            return fundRegistry.isActiveFM(voter);
        }
        
        if (group == VoterGroup.INVESTOR_ONLY) {
            return staking.getStake(voter) > 0 &&
                   !fundRegistry.isActiveFM(voter);
        }
        
        if (group == VoterGroup.BOTH) {
            return staking.getStake(voter) > 0;
        }
        
        if (group == VoterGroup.GUARDIAN_ONLY) {
            return guardianCommittee.isMember(voter);
        }
        
        return false;
    }
    
    /**
     * @notice Get voting power for any governance context
     */
    function getVotingPower(
        address voter,
        GovernanceLevel level,
        uint256 contextId,  // fundId for fund-level, 0 for others
        uint256 snapshot
    ) external view returns (uint256) {
        if (level == GovernanceLevel.FUND) {
            return _getFundVotingPower(voter, contextId, snapshot);
        }
        
        if (level == GovernanceLevel.FM) {
            return _getFMVotingPower(voter, snapshot);
        }
        
        if (level == GovernanceLevel.PROTOCOL) {
            // contextId encodes voterGroup for protocol level
            VoterGroup group = VoterGroup(contextId);
            return _getProtocolVotingPower(voter, group, snapshot);
        }
        
        return 0;
    }
    
    enum GovernanceLevel {
        FUND,
        FM,
        PROTOCOL
    }
    
    enum VoterGroup {
        FM_ONLY,
        INVESTOR_ONLY,
        BOTH,
        GUARDIAN_ONLY
    }
}
```

## GovernanceTimelock.sol

### Purpose

Delays proposal execution to allow for review and prevent rushed malicious changes.

### Specification

```solidity
/**
 * @title GovernanceTimelock
 * @notice Time-delayed execution for governance proposals
 */
contract GovernanceTimelock {
    
    mapping(bytes32 => bool) public queuedTransactions;
    
    uint256 public constant MINIMUM_DELAY = 24 hours;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;
    
    /**
     * @notice Queue transaction for execution
     */
    function queueTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external onlyGovernance returns (bytes32 txHash) {
        require(
            eta >= block.timestamp + MINIMUM_DELAY,
            "ETA too soon"
        );
        require(
            eta <= block.timestamp + MAXIMUM_DELAY,
            "ETA too late"
        );
        
        txHash = keccak256(abi.encode(target, value, data, eta));
        queuedTransactions[txHash] = true;
        
        emit TransactionQueued(txHash, target, value, data, eta);
    }
    
    /**
     * @notice Execute queued transaction
     */
    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external onlyGovernance returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, eta));
        
        require(queuedTransactions[txHash], "Not queued");
        require(block.timestamp >= eta, "ETA not reached");
        require(block.timestamp <= eta + GRACE_PERIOD, "Transaction stale");
        
        queuedTransactions[txHash] = false;
        
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "Transaction execution reverted");
        
        emit TransactionExecuted(txHash, target, value, data, eta);
        
        return returnData;
    }
}
```

## GovernanceRewards.sol

### Purpose

Distributes rewards to governance participants at all levels.

### Specification

```solidity
/**
 * @title GovernanceRewards
 * @notice Reward distribution for governance participation
 */
contract GovernanceRewards {
    
    mapping(uint256 => uint256) public proposalRewardPools;
    mapping(uint256 => mapping(address => uint256)) public votingRewards;
    mapping(uint256 => mapping(address => uint256)) public delegationRewards;
    
    /**
     * @notice Allocate rewards for proposal
     */
    function allocateRewards(uint256 proposalId, GovernanceLevel level) 
        external 
        onlyGovernance 
    {
        uint256 rewardAmount = _calculateRewardPool(proposalId, level);
        proposalRewardPools[proposalId] = rewardAmount;
        
        // Distribute to voters
        _distributeVoterRewards(proposalId);
        
        // Distribute to delegators/delegates
        _distributeDelegationRewards(proposalId);
        
        // Reward proposal author if passed
        _rewardProposalAuthor(proposalId);
    }
    
    function _calculateRewardPool(uint256 proposalId, GovernanceLevel level) 
        internal 
        view 
        returns (uint256) 
    {
        if (level == GovernanceLevel.FUND) {
            // 1% of that fund's contribution to protocol fees (last 30 days)
            uint256 fundId = fundGovernance.getFundId(proposalId);
            return fundFees[fundId] * 1 / 100;
        }
        
        if (level == GovernanceLevel.FM) {
            // 5% of FM-related fees
            return fmFees * 5 / 100;
        }
        
        if (level == GovernanceLevel.PROTOCOL) {
            // 5% of total protocol fees
            return totalFees * 5 / 100;
        }
        
        return 0;
    }
}
```

## Access Control

```solidity
/**
 * @title GovernanceAccessControl
 * @notice Role-based access control for governance
 */
contract GovernanceAccessControl {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant FM_ROLE = keccak256("FM_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    
    mapping(bytes32 => mapping(address => bool)) public hasRole;
    
    function grantRole(bytes32 role, address account) external onlyAdmin {
        hasRole[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
    
    function revokeRole(bytes32 role, address account) external onlyAdmin {
        hasRole[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
    
    modifier onlyRole(bytes32 role) {
        require(hasRole[role][msg.sender], "Missing role");
        _;
    }
}
```

## Next Steps

- **[Governance Overview](/protocol/governance/overview)**: High-level governance model
- **[DAO Structure](/protocol/governance/dao-structure)**: Governance level details
- **[Proposal Lifecycle](/protocol/governance/proposal-lifecycle)**: Proposal flows
- **[Voting Mechanism](/protocol/governance/voting-mechanism)**: Voting power calculations

---

*For implementation guides, see [Technical Documentation - Governance](/technical/smart-contracts/governance).*

