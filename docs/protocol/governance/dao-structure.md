# DAO Structure

Detailed specification of the TOSS multi-level governance structure, including fund-level, FM-level, and protocol-level governance systems.

## Overview

TOSS governance is organized into **three independent levels** with **domain-specific DAOs** at the protocol level, each managing only its own parameters:

```
Level 1: Fund-Level Governance
├─ Scope: Individual fund parameters
├─ Proposers: FM or Fund Investors
├─ Voters: Only investors in that fund
└─ Power: Share-based (% of fund ownership)

Level 2: FM DAO (Fund Manager Domain)
├─ Scope: Fund Manager standards and templates
├─ Proposers: Any active Fund Manager
├─ Voters: Only Fund Managers
└─ Power: AUM-weighted with reputation
└─ Manages: FM stake requirements, FundClass templates, FM standards

Level 3: Domain-Specific DAOs
├─ Core DAO (Protocol Domain)
│  ├─ Scope: Protocol infrastructure and security
│  ├─ Proposers: Admin committee
│  ├─ Voters: FM Only or Both (Admin-specified)
│  └─ Manages: Oracles, RiskEngine, Protocol fees, Infrastructure
│
├─ FM DAO (Fund Manager Domain) - Same as Level 2
│  └─ Manages: FM domain parameters only
│
└─ Investor DAO (Investor Domain)
   ├─ Scope: Investor standards and class definitions
   ├─ Proposers: Admin committee
   ├─ Voters: Investors Only (TOSS-staked, class-weighted)
   └─ Manages: Investor classes, upgrade thresholds, investor standards
```

## Level 1: Fund-Level Governance

### Purpose

Enable each fund to self-govern fund-specific parameters while maintaining protocol safety boundaries.

### Governance Scope

#### What Can Be Changed at Fund Level

✅ **Allowed Changes**:
```yaml
Fees:
  - Management fee (within 0-3% range)
  - Performance fee (within 0-30% range)
  - Deposit/withdrawal fees

Risk Parameters (within RiskTier limits):
  - Position size limits
  - Concentration limits
  - Drawdown thresholds
  - Volatility targets

Operational:
  - Lockup periods (can increase, not decrease below minimum)
  - Allowed assets (subset of tier-allowed assets)
  - Investment minimums
  - Strategy description
```

❌ **Cannot Be Changed at Fund Level**:
```yaml
- RiskTier assignment (Core DAO domain)
- FundClass (FM DAO domain)
- Slashing formulas (Core DAO domain)
- RiskEngine rules (Core DAO domain)
- FM stake requirements (FM DAO domain)
```

### Proposer Requirements

#### For Fund Manager Proposals

```solidity
interface IFundGovernance {
    function createFMProposal(
        uint256 fundId,
        ProposalType proposalType,
        bytes calldata proposalData
    ) external returns (uint256 proposalId);
}

// Eligibility check
function canFMPropose(address fm, uint256 fundId) public view returns (bool) {
    return (
        fundRegistry.getFundManager(fundId) == fm &&
        !fundRegistry.isFundPaused(fundId) &&
        !slashingEngine.isFMBanned(fm)
    );
}
```

**Requirements**:
- Must be the verified FM of the fund
- Fund must be in ACTIVE status
- FM must not be banned

#### For Investor Proposals

```solidity
function createInvestorProposal(
    uint256 fundId,
    ProposalType proposalType,
    bytes calldata proposalData
) external returns (uint256 proposalId);

// Eligibility check  
function canInvestorPropose(address investor, uint256 fundId) 
    public 
    view 
    returns (bool) 
{
    uint256 shares = vault.balanceOf(investor, fundId);
    uint256 totalShares = vault.totalShares(fundId);
    uint256 ownershipPct = (shares * 100) / totalShares;
    
    return ownershipPct >= INVESTOR_PROPOSAL_THRESHOLD; // 1%
}
```

**Requirements**:
- Must own ≥1% of fund shares
- Shares must be held for ≥7 days (prevent manipulation)
- Investor not in FROZEN or BANNED status

### Voter Eligibility

**Only investors with shares in the specific fund can vote**:

```solidity
function canVoteOnFundProposal(address voter, uint256 fundId) 
    public 
    view 
    returns (bool) 
{
    return vault.balanceOf(voter, fundId) > 0;
}

function getVotingPower(address voter, uint256 fundId, uint256 proposalId) 
    public 
    view 
    returns (uint256) 
{
    // Snapshot at proposal creation
    uint256 shares = vault.balanceOfAt(voter, fundId, proposals[proposalId].snapshot);
    uint256 totalShares = vault.totalSharesAt(fundId, proposals[proposalId].snapshot);
    
    return (shares * 1e18) / totalShares; // Returns percentage as fixed point
}
```

### Quorum & Approval

```yaml
Standard Proposals (fees, minor changes):
  Quorum: 30% of shares must vote
  Approval: >50% of votes cast

Important Proposals (risk parameters):
  Quorum: 40% of shares must vote
  Approval: >60% of votes cast

Critical Proposals (FM replacement, fund closure):
  Quorum: 50% of shares must vote
  Approval: >75% of votes cast
```

### Timelock

```solidity
Fund-Level Timelock:
- Standard: 24 hours
- Important: 48 hours
- Critical: 72 hours

// FM can cancel proposal during timelock if:
// - Technical issue discovered
// - Investor concerns raised
// - Market conditions changed significantly
```

## Level 2: FM-Level Governance

### Purpose

Enable Fund Managers to collectively govern their professional standards and operational parameters.

### Governance Scope

#### What FMs Can Change

✅ **FM-Level Parameters**:
```yaml
Stake Requirements:
  - Minimum FM stake (within 5k-100k TOSS range)
  - Stake scaling with AUM ratios

FundClass Templates:
  - Alpha, Balanced, Stable fund definitions
  - Default risk parameters per class
  - Fee guidelines per class

FM Standards:
  - Certification requirements
  - Experience thresholds
  - Compliance standards
  - Reporting requirements

Risk Tier Adjustments:
  - Fine-tune tier parameters (within protocol bounds)
  - Add new tier definitions
  - Modify tier eligibility criteria

Dispute Resolution:
  - FM-to-FM dispute procedures
  - Arbitration mechanisms
  - Community standards
```

❌ **Cannot Change**:
```yaml
- Core RiskEngine algorithms (Core DAO domain)
- Global slashing formulas (Core DAO domain)
- Protocol fees (Core DAO domain)
- Investor class definitions (Investor DAO domain)
```

### Proposer Requirements

```solidity
function createFMProposal(
    ProposalType proposalType,
    bytes calldata proposalData
) external returns (uint256 proposalId);

// Eligibility check
function canFMPropose(address fm) public view returns (bool) {
    return (
        fundRegistry.isActiveFM(fm) &&
        fundRegistry.getFundsManaged(fm).length >= 1 &&
        block.timestamp >= fmRegistry.activeSince(fm) + 30 days &&
        slashingEngine.daysSinceLastSlash(fm) >= 90
    );
}
```

**Requirements**:
- Active FM with at least 1 fund
- Managed funds for ≥30 days
- No slashing in last 90 days
- Good standing in community

### Voter Eligibility

**Only Fund Managers can vote on FM-level proposals**:

```solidity
function getVotingPower(address fm, uint256 proposalId) 
    public 
    view 
    returns (uint256) 
{
    // AUM component (60% weight)
    uint256 totalAUM = fundRegistry.getTotalAUMManaged(fm);
    uint256 aumComponent = totalAUM * 6 / 10;
    
    // Reputation component (40% weight)
    uint256 repScore = fmScoreCalculator.getScore(fm); // 0-100
    uint256 repComponent = (totalAUM * repScore * 4) / 1000; // scaled
    
    return aumComponent + repComponent;
}
```

**Voting Power Formula**:
```
VP_FM = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)

Example 1: FM with $10M AUM, reputation 80
VP = (10M × 0.6) + (10M × 0.8 × 0.4) = 6M + 3.2M = 9.2M

Example 2: FM with $5M AUM, reputation 95
VP = (5M × 0.6) + (5M × 0.95 × 0.4) = 3M + 1.9M = 4.9M

Note: Higher reputation can partially offset lower AUM
```

### Quorum & Approval

```yaml
Standard Proposals:
  Quorum: 20% of total FM voting power
  Approval: >60% of votes cast
  Timelock: 48 hours

Critical Proposals:
  Quorum: 40% of total FM voting power
  Approval: >75% of votes cast
  Timelock: 72 hours
```

### FM Reputation Scoring

```typescript
interface FMReputationScore {
  performance: number;      // 0-30 points (Sharpe ratio, consistency)
  compliance: number;       // 0-25 points (no slashing = max)
  longevity: number;        // 0-20 points (years active)
  communityStanding: number;// 0-15 points (proposals, forum participation)
  governance: number;       // 0-10 points (voting participation)
  
  total: number;            // 0-100 total score
}

// Score calculation
const score = 
  Math.min(sharpeRatio * 10, 30) +
  (slashingEvents === 0 ? 25 : Math.max(0, 25 - slashingEvents * 10)) +
  Math.min(yearsActive * 5, 20) +
  Math.min(forumReputation / 10, 15) +
  Math.min(votingParticipation * 10, 10);
```

## Level 3: Domain-Specific DAOs

Protocol governance is split into **three domain-specific DAOs**, each managing only its own parameters to prevent cross-domain control:

### Core DAO (Protocol Domain)

#### Purpose

Maintain protocol infrastructure, security, and core systems through carefully controlled proposals.

#### Governance Scope

✅ **Core DAO Manages**:
```yaml
Infrastructure:
  - Oracle configuration
  - zkSync integration settings
  - L1-L2 bridge parameters
  - Paymaster rules

Risk & Security:
  - RiskEngine core algorithms
  - Emergency pause thresholds
  - Circuit breaker triggers

Economics (Core DAO):
  - Protocol fee structure
  - Treasury management

Governance Infrastructure:
  - Voting rules
  - Quorum requirements
  - Timelock durations
  - Admin committee composition
```

❌ **Core DAO Cannot Manage**:
```yaml
- FM stake requirements (FM DAO domain)
- FundClass templates (FM DAO domain)
- Investor class definitions (Investor DAO domain)
- Investor upgrade thresholds (Investor DAO domain)
- Investor penalties/rewards (Investor DAO domain)
```

### Investor DAO (Investor Domain)

#### Purpose

Manage investor standards, class definitions, and investor-specific parameters.

#### Governance Scope

✅ **Investor DAO Manages**:
```yaml
Investor Classes:
  - Class definitions (Retail, Premium, Institutional, Strategic)
  - Class upgrade thresholds (TOSS stake, ICS requirements)
  - Class access rules (which tiers each class can access)

Investor Standards:
  - Penalty parameters
  - Reward parameters
  - Behavior standards
  - Compliance requirements
```

❌ **Investor DAO Cannot Manage**:
```yaml
- FM stake requirements (FM DAO domain)
- FundClass templates (FM DAO domain)
- Protocol infrastructure (Core DAO domain)
- Oracle configuration (Core DAO domain)
- RiskEngine algorithms (Core DAO domain)
```

**Key Principle**: Investor DAO manages investor domain parameters only.

#### Proposer Requirements

**Core DAO**: Admin Committee Only
**Investor DAO**: Admin Committee Only (for now, may evolve)

```solidity
// Core DAO proposals
function createCoreDAOProposal(
    ProposalType proposalType,
    VoterGroup voterGroup,  // FM_ONLY or BOTH
    bytes calldata proposalData
) external onlyAdmin returns (uint256 proposalId);

// Investor DAO proposals
function createInvestorDAOProposal(
    ProposalType proposalType,
    bytes calldata proposalData
) external onlyAdmin returns (uint256 proposalId) {
    // Always INVESTOR_ONLY voter group
    return protocolGovernance.createProposal(
        proposalType,
        VoterGroup.INVESTOR_ONLY,
        proposalData
    );
}

// Admin committee (initially core team, later elected)
modifier onlyAdmin() {
    require(
        adminCommittee.isMember(msg.sender) ||
        msg.sender == daoElectedAdmin,
        "Not admin"
    );
    _;
}
```

**Transition Plan**:
```
Phase 1 (Current): Core team = Admin for both DAOs
Phase 2 (Q2 2025): 5-member elected admin committee
Phase 3 (Q4 2025): Fully DAO-elected rotating committee
Phase 4 (2026+): Investor DAO may open proposal creation to investors (high threshold)
```

#### Voter Group Specification

**Core DAO**:
- Admin specifies voter group per proposal (FM_ONLY or BOTH)
- Infrastructure changes: Usually BOTH (affects everyone)
- RiskEngine/FM-focused changes: Usually FM_ONLY

**Investor DAO**:
- Always INVESTOR_ONLY (investors manage their own domain)

```solidity
enum VoterGroup {
    FM_ONLY,           // Only Fund Managers can vote (Core DAO only)
    INVESTOR_ONLY,     // Only Investors can vote (Investor DAO only)
    BOTH,              // Both FMs and Investors can vote (Core DAO only)
    GUARDIAN_ONLY      // Only Guardian committee (emergency)
}

// Example: Core DAO - Oracle change affects everyone
protocolGovernance.createProposal(
    proposalType: ProposalType.ORACLE_CONFIG,
    voterGroup: VoterGroup.BOTH,  // Core DAO: Both vote
    data: encodeOracleConfig(newOracleAddress)
);

// Example: Investor DAO - Class definition affects investors
protocolGovernance.createProposal(
    proposalType: ProposalType.INVESTOR_CLASS,
    voterGroup: VoterGroup.INVESTOR_ONLY,  // Investor DAO: Investors only
    data: encodeInvestorClassParams(newParams)
);
```

### Voter Eligibility by DAO

#### Core DAO: FM_ONLY Proposals

For Core DAO proposals that primarily affect Fund Managers:

```solidity
function canVote(address voter) public view returns (bool) {
    return fundRegistry.isActiveFM(voter);
}

function getVotingPower(address fm) public view returns (uint256) {
    uint256 tossStaked = staking.getStake(fm);
    uint256 lockBonus = staking.getLockBonus(fm);
    uint256 roleMultiplier = 15; // 1.5x for FMs
    
    return (tossStaked * (10 + lockBonus) * roleMultiplier) / 100;
}
```

#### Core DAO: BOTH Proposals

For Core DAO proposals affecting the entire ecosystem:

```solidity
function canVote(address voter) public view returns (bool) {
    return staking.getStake(voter) > 0;  // Any TOSS staker (FM or Investor)
}

function getVotingPower(address voter) public view returns (uint256) {
    uint256 tossStaked = staking.getStake(voter);
    uint256 lockBonus = staking.getLockBonus(voter);
    
    // Role multiplier
    uint256 roleMultiplier = 10; // 1.0x base
    if (fundRegistry.isActiveFM(voter)) {
        roleMultiplier = 15; // 1.5x for FMs
    } else if (investorRegistry.getClass(voter) == InvestorClass.STRATEGIC) {
        roleMultiplier = 20; // 2.0x for strategic investors
    }
    
    return (tossStaked * (10 + lockBonus) * roleMultiplier) / 100;
}
```

#### Investor DAO: INVESTOR_ONLY Proposals

**All Investor DAO proposals use INVESTOR_ONLY voter group**:

```solidity
function canVote(address voter) public view returns (bool) {
    // Only investors (non-FMs) can vote in Investor DAO
    return staking.getStake(voter) > 0 && !fundRegistry.isActiveFM(voter);
}

function getVotingPower(address investor) public view returns (uint256) {
    uint256 tossStaked = staking.getStake(investor);
    uint256 lockBonus = staking.getLockBonus(investor);
    uint256 classMultiplier = investorRegistry.getClassMultiplier(investor);
    
    // Investor class multipliers:
    // RETAIL: 1.0x, PREMIUM: 1.2x, INSTITUTIONAL: 1.5x, STRATEGIC: 2.0x
    
    return (tossStaked * (10 + lockBonus) * classMultiplier) / 10;
}
```

**Key Principle**: Investor DAO proposals always use INVESTOR_ONLY—investors manage their own domain.

#### BOTH Proposals

```solidity
function canVote(address voter) public view returns (bool) {
    return staking.getStake(voter) > 0;  // Any TOSS staker
}

function getVotingPower(address voter) public view returns (uint256) {
    uint256 tossStaked = staking.getStake(voter);
    uint256 lockBonus = staking.getLockBonus(voter);
    
    // Role multiplier
    uint256 roleMultiplier = 10; // 1.0x base
    if (fundRegistry.isActiveFM(voter)) {
        roleMultiplier = 15; // 1.5x for FMs
    } else if (investorRegistry.getClass(voter) == InvestorClass.STRATEGIC) {
        roleMultiplier = 20; // 2.0x for strategic investors
    }
    
    return (tossStaked * (10 + lockBonus) * roleMultiplier) / 100;
}
```

### Quorum & Approval Thresholds

| DAO | Voter Group | Quorum | Standard Approval | Critical Approval |
|-----|-------------|--------|-------------------|-------------------|
| **Core DAO** | FM_ONLY | 15% of FM VP | >50% | >75% |
| **Core DAO** | BOTH | 10% of Combined VP | >50% | >75% |
| **Investor DAO** | INVESTOR_ONLY | 10% of Investor VP | >50% | >66% |
| **FM DAO** | FM Only | 20% of FM VP | >60% | >75% |

## Governance Contracts

### FundGovernance.sol

```solidity
/**
 * @title FundGovernance
 * @notice Handles fund-level proposals and voting
 */
contract FundGovernance {
    struct FundProposal {
        uint256 fundId;
        address proposer;
        ProposalType proposalType;
        bytes proposalData;
        uint256 snapshot;        // Block number for voting power
        uint256 votingStarts;
        uint256 votingEnds;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        uint256 eta;            // Execution timestamp
    }
    
    enum ProposalType {
        FEE_CHANGE,
        RISK_PARAMETER,
        STRATEGY_UPDATE,
        ASSET_LIST_UPDATE,
        LOCKUP_CHANGE,
        FM_REPLACEMENT
    }
    
    // Proposal creation
    function createProposal(
        uint256 fundId,
        ProposalType proposalType,
        bytes calldata data
    ) external returns (uint256);
    
    // Voting
    function castVote(uint256 proposalId, uint8 support) external;
    
    // Execution
    function execute(uint256 proposalId) external;
}
```

### FMGovernance.sol

```solidity
/**
 * @title FMGovernance
 * @notice Handles FM-level proposals affecting all Fund Managers
 */
contract FMGovernance {
    struct FMProposal {
        address proposer;
        ProposalType proposalType;
        bytes proposalData;
        uint256 snapshot;
        uint256 votingStarts;
        uint256 votingEnds;
        uint256 forVotes;        // Weighted by AUM + reputation
        uint256 againstVotes;
        uint256 totalVotingPower;
        ProposalState state;
        uint256 eta;
    }
    
    enum ProposalType {
        FM_STAKE_REQUIREMENT,
        FUNDCLASS_TEMPLATE,
        RISKTIER_DEFINITION,
        CERTIFICATION_STANDARD,
        DISPUTE_PROCEDURE
    }
    
    // Only FMs can propose
    function createProposal(
        ProposalType proposalType,
        bytes calldata data
    ) external onlyActiveFM returns (uint256);
    
    // Only FMs can vote
    function castVote(uint256 proposalId, uint8 support) 
        external 
        onlyActiveFM;
}
```

### ProtocolGovernance.sol

```solidity
/**
 * @title ProtocolGovernance
 * @notice Handles protocol-wide proposals with flexible voter groups
 */
contract ProtocolGovernance {
    struct ProtocolProposal {
        address proposer;
        ProposalType proposalType;
        VoterGroup voterGroup;   // Admin specifies
        bytes proposalData;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 snapshot;
        uint256 votingStarts;
        uint256 votingEnds;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalState state;
        uint256 eta;
        bool guardianReviewed;
    }
    
    enum VoterGroup {
        FM_ONLY,
        INVESTOR_ONLY,
        BOTH,
        GUARDIAN_ONLY
    }
    
    enum ProposalType {
        ORACLE_CONFIG,
        SLASHING_FORMULA,
        PROTOCOL_FEE,
        INVESTOR_CLASS,
        ZKSYNC_INTEGRATION,
        EMERGENCY_ACTION,
        CONTRACT_UPGRADE
    }
    
    // Only admin can propose
    function createProposal(
        ProposalType proposalType,
        VoterGroup voterGroup,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external onlyAdmin returns (uint256);
    
    // Voting eligibility determined by voter group
    function castVote(uint256 proposalId, uint8 support) external;
}
```

### VoterRegistry.sol

```solidity
/**
 * @title VoterRegistry
 * @notice Tracks voter eligibility across all governance levels
 */
contract VoterRegistry {
    // Fund-level eligibility
    function isFundVoter(address voter, uint256 fundId) 
        external 
        view 
        returns (bool);
    
    // FM-level eligibility
    function isFMVoter(address voter) 
        external 
        view 
        returns (bool);
    
    // Core DAO eligibility
    function isCoreDAOVoter(address voter, VoterGroup group) 
        external 
        view 
        returns (bool);
    
    // Investor DAO eligibility
    function isInvestorDAOVoter(address voter) 
        external 
        view 
        returns (bool);
    
    // Get voting power for specific context
    function getVotingPower(
        address voter,
        GovernanceLevel level,
        uint256 contextId  // fundId for fund-level, 0 for others
    ) external view returns (uint256);
}
```

## Proposal Types Matrix

| Proposal Type | Level | Proposer | Voters | Example |
|--------------|-------|----------|--------|---------|
| Fee Change | Fund | FM | Fund Investors | Reduce management fee |
| Risk Parameter | Fund | FM or Investor | Fund Investors | Tighten drawdown limit |
| Strategy Update | Fund | FM | Fund Investors | Change trading approach |
| FM Replacement | Fund | Investor | Fund Investors | Vote out underperforming FM |
| Minimum Stake | FM DAO | Any FM | All FMs | Increase FM collateral |
| FundClass Template | FM DAO | Any FM | All FMs | Modify Balanced fund definition |
| Oracle Config | Core DAO | Admin | Both | Add new oracle source |
| Slashing Formula | Core DAO | Admin | FM Only | Adjust slashing severity |
| Protocol Fee | Core DAO | Admin | Both | Change protocol fee rate |
| Investor Class | Investor DAO | Admin | Investors Only | Modify class definitions |
| Investor Upgrade | Investor DAO | Admin | Investors Only | Adjust upgrade thresholds |
| Emergency Pause | Core DAO | Admin/Guardian | Guardian | Pause in crisis |

## Governance Interactions

### Cross-Level Constraints

```solidity
// Fund-level changes must respect protocol-level limits
function validateFundProposal(uint256 fundId, ProposalType pType, bytes data) 
    internal 
    view 
    returns (bool) 
{
    if (pType == ProposalType.FEE_CHANGE) {
        uint256 newFee = abi.decode(data, (uint256));
        FundClass class = fundRegistry.getFundClass(fundId);
        
        // Check against FundClass template (set by FM governance)
        require(newFee >= fmGovernance.getMinFee(class), "Below minimum");
        require(newFee <= fmGovernance.getMaxFee(class), "Above maximum");
        
        // Check against protocol limits (set by Core DAO)
        require(newFee <= coreDAO.getGlobalMaxFee(), "Above global max");
        
        return true;
    }
    // ... other validations
}
```

### Escalation Mechanism

If fund investors and FM cannot agree:

```solidity
// Investors can escalate to FM governance
function escalateToFMGovernance(uint256 fundId, bytes calldata dispute) 
    external 
{
    // Requires 30%+ of fund investors to sign
    require(getEscalationSignatures(fundId, dispute) >= 30, "Not enough support");
    
    // Create FM-level arbitration proposal
    fmGovernance.createArbitrationProposal(fundId, dispute);
}
```

## Admin Committee Structure

### Current Composition (Phase 1)

```yaml
Members:
  - Core Team Lead (1 vote)
  - Technical Lead (1 vote)
  - Risk Lead (1 vote)
  - Operations Lead (1 vote)
  - Community Representative (1 vote)

Threshold: 3-of-5 for proposal creation
```

### Future Evolution (Phase 2-3)

```yaml
Election Process:
  - Nominations: Any TOSS holder with >10k staked
  - Voting: All TOSS holders
  - Term: 6 months
  - Staggered: 2-3 members rotate per cycle

Compensation:
  - Base: 5,000 TOSS per term
  - Performance bonus: Based on proposal quality
```

## Next Steps

- **[Proposal Lifecycle](/protocol/governance/proposal-lifecycle)**: Detailed proposal flows
- **[Voting Mechanism](/protocol/governance/voting-mechanism)**: Voting power calculations
- **[Governance Contracts](/protocol/contracts/governance-layer)**: Contract specifications

---

*Back to [Governance Overview](/protocol/governance/overview)*

