# Voting Mechanism

Comprehensive specification of voter eligibility, voting power calculations, and delegation systems across all three governance levels.

## Voter Eligibility Matrix

| Governance Level | Who Can Vote | Eligibility Requirement |
|------------------|--------------|------------------------|
| **Fund-Level** | Fund Investors | Hold shares in that specific fund |
| **FM-Level** | Fund Managers | Active FM with ≥1 fund managed |
| **Protocol (FM_ONLY)** | Fund Managers | Active FM + TOSS staked |
| **Protocol (INVESTOR_ONLY)** | Investors | TOSS staked, not an active FM |
| **Protocol (BOTH)** | FMs & Investors | TOSS staked (any amount) |
| **Protocol (GUARDIAN)** | Guardian Committee | Elected guardian member |

## Fund-Level Voting

### Eligibility Check

```solidity
contract FundGovernance {
    function canVote(address voter, uint256 proposalId) 
        public 
        view 
        returns (bool) 
    {
        FundProposal storage proposal = proposals[proposalId];
        uint256 shares = vault.balanceOfAt(
            voter,
            proposal.fundId,
            proposal.snapshot
        );
        
        return shares > 0;  // Any shareholder can vote
    }
}
```

### Voting Power Calculation

**Simple Proportional to Shares**:

```solidity
function getVotingPower(address voter, uint256 proposalId) 
    public 
    view 
    returns (uint256) 
{
    FundProposal storage proposal = proposals[proposalId];
    
    uint256 voterShares = vault.balanceOfAt(
        voter,
        proposal.fundId,
        proposal.snapshot
    );
    
    uint256 totalShares = vault.totalSharesAt(
        proposal.fundId,
        proposal.snapshot
    );
    
    // Return as percentage (18 decimals)
    return (voterShares * 1e18) / totalShares;
}
```

**Example**:
```
Fund Total Shares: 10,000
Investor A: 2,500 shares → 25% voting power
Investor B: 1,000 shares → 10% voting power
Investor C: 500 shares  → 5% voting power
Others: 6,000 shares    → 60% voting power

If only A, B, C vote:
Total voting power used: 40%
A's effective power: 25/40 = 62.5% of votes cast
B's effective power: 10/40 = 25% of votes cast
C's effective power: 5/40 = 12.5% of votes cast
```

### No Additional Bonuses

Unlike protocol-level voting, fund-level voting has **no bonuses** for:
- ❌ Lock time (irrelevant at fund level)
- ❌ TOSS staking (voting power = fund shares only)
- ❌ Reputation (already reflected in investment decision)

**Rationale**: Pure economic alignment—those with capital at risk decide.

### Delegation at Fund Level

```solidity
// Investors can delegate fund voting to others
function delegateFundVotes(uint256 fundId, address delegatee) external {
    require(vault.balanceOf(msg.sender, fundId) > 0, "No shares");
    fundDelegation[fundId][msg.sender] = delegatee;
    
    emit FundVoteDelegated(fundId, msg.sender, delegatee);
}

// Delegated voting power aggregates
function getVotingPowerWithDelegation(address voter, uint256 proposalId) 
    public 
    view 
    returns (uint256) 
{
    FundProposal storage proposal = proposals[proposalId];
    uint256 fundId = proposal.fundId;
    
    // Own shares
    uint256 ownPower = _getDirectVotingPower(voter, proposalId);
    
    // Delegated shares
    address[] memory delegators = _getDelegators(fundId, voter);
    for (uint i = 0; i < delegators.length; i++) {
        ownPower += _getDirectVotingPower(delegators[i], proposalId);
    }
    
    return ownPower;
}
```

## FM-Level Voting

### Eligibility Check

```solidity
contract FMGovernance {
    function canVote(address voter, uint256 proposalId) 
        public 
        view 
        returns (bool) 
    {
        return (
            fundRegistry.isActiveFM(voter) &&
            fundRegistry.getFundsManaged(voter).length > 0
        );
    }
}
```

**Requirements**:
- Must be verified Fund Manager
- Must have at least 1 active fund
- Fund must have been active for >30 days

### Voting Power Calculation

**AUM-Weighted with Reputation**:

```solidity
function getFMVotingPower(address fm, uint256 proposalId) 
    public 
    view 
    returns (uint256) 
{
    FMProposal storage proposal = fmProposals[proposalId];
    
    // Component 1: AUM Managed (60% weight)
    uint256 totalAUM = fundRegistry.getTotalAUMAt(fm, proposal.snapshot);
    uint256 aumComponent = totalAUM * 60 / 100;
    
    // Component 2: Reputation Score (40% weight)
    uint256 reputation = fmScoreCalculator.getScore(fm);  // 0-100
    uint256 repComponent = (totalAUM * reputation * 40) / 10000;
    
    return aumComponent + repComponent;
}
```

**Reputation Score Components**:
```typescript
interface FMReputationFactors {
  performance: {
    sharpeRatio: number;          // Weight: 30%
    consistentReturns: number;    // Weight: 20%
    riskAdjustedReturn: number;   // Weight: 20%
  };
  
  compliance: {
    noSlashingEvents: boolean;    // Weight: 25%
    riskEngineRejections: number; // Weight: 10%
  };
  
  experience: {
    yearsActive: number;          // Weight: 15%
    fundsManaged: number;         // Weight: 10%
  };
  
  community: {
    governanceParticipation: number;  // Weight: 10%
    proposalQuality: number;          // Weight: 5%
  };
}

function calculateFMReputation(address fm): number {
  let score = 0;
  
  // Performance (70 points max)
  score += Math.min(sharpeRatio * 10, 30);
  score += consistencyScore * 0.2;  // 0-100 → 0-20
  score += riskAdjustedScore * 0.2; // 0-100 → 0-20
  
  // Compliance (35 points max)
  score += noSlashing ? 25 : 0;
  score += Math.max(0, 10 - rejectionCount);
  
  // Experience (25 points max)
  score += Math.min(yearsActive * 3, 15);
  score += Math.min(fundsManaged * 2, 10);
  
  // Community (15 points max)
  score += votingParticipation * 0.1;
  score += proposalSuccessRate * 0.05;
  
  return Math.min(score, 100);  // Cap at 100
}
```

**Example Calculations**:
```
FM Alice:
- AUM: $10M
- Reputation: 85/100
- Voting Power = ($10M × 0.6) + ($10M × 0.85 × 0.4)
               = $6M + $3.4M = $9.4M

FM Bob:
- AUM: $20M
- Reputation: 60/100
- Voting Power = ($20M × 0.6) + ($20M × 0.60 × 0.4)
               = $12M + $4.8M = $16.8M

FM Charlie:
- AUM: $5M
- Reputation: 95/100
- Voting Power = ($5M × 0.6) + ($5M × 0.95 × 0.4)
               = $3M + $1.9M = $4.9M

Note: Bob has more voting power despite lower reputation due to higher AUM.
Charlie's excellent reputation partially compensates for lower AUM.
```

### Delegation at FM Level

```solidity
// FMs can delegate to other FMs
function delegateFMVotes(address delegatee) external onlyActiveFM {
    require(fundRegistry.isActiveFM(delegatee), "Delegatee not FM");
    fmDelegation[msg.sender] = delegatee;
    
    emit FMVoteDelegated(msg.sender, delegatee);
}
```

**Common Patterns**:
- Junior FMs delegate to senior FMs in similar strategies
- Regional FMs form delegation groups
- Specialized FMs (Quant, DeFi) delegate within specialization

## Protocol-Level Voting

### Eligibility Check by Voter Group

```solidity
contract ProtocolGovernance {
    function canVote(address voter, uint256 proposalId) 
        public 
        view 
        returns (bool) 
    {
        ProtocolProposal storage proposal = protocolProposals[proposalId];
        VoterGroup group = proposal.voterGroup;
        
        if (group == VoterGroup.FM_ONLY) {
            return fundRegistry.isActiveFM(voter);
        }
        
        if (group == VoterGroup.INVESTOR_ONLY) {
            return (
                staking.getStake(voter) > 0 &&
                !fundRegistry.isActiveFM(voter)  // Not an FM
            );
        }
        
        if (group == VoterGroup.BOTH) {
            return staking.getStake(voter) > 0;  // Any staker
        }
        
        if (group == VoterGroup.GUARDIAN_ONLY) {
            return guardianCommittee.isMember(voter);
        }
        
        return false;
    }
}
```

### Voting Power Calculation

**Base Formula**:
```
VP_Protocol = TOSS_Staked × (1 + LockBonus) × RoleMultiplier
```

#### Component 1: TOSS Staked

```solidity
function getStakedBalance(address voter, uint256 snapshot) 
    internal 
    view 
    returns (uint256) 
{
    return staking.balanceOfAt(voter, snapshot);
}
```

**No voting with unstaked TOSS** - must be actively staked to participate.

#### Component 2: Lock Time Bonus

```solidity
function getLockBonus(address voter) public view returns (uint256) {
    uint256 lockEnd = staking.lockEnd(voter);
    uint256 lockDuration = lockEnd > block.timestamp 
        ? lockEnd - block.timestamp 
        : 0;
    
    // Bonus calculation
    if (lockDuration == 0) return 0;                      // 0% bonus
    if (lockDuration < 90 days) return 0;                 // 0% bonus
    if (lockDuration < 180 days) return 5 * 1e17;        // 50% bonus
    if (lockDuration < 365 days) return 1 * 1e18;        // 100% bonus
    if (lockDuration < 730 days) return 15 * 1e17;       // 150% bonus
    return 2 * 1e18;                                       // 200% bonus (4-year lock)
}
```

**Lock Bonus Table**:
| Lock Duration | Bonus | Multiplier |
|---------------|-------|------------|
| None | 0% | 1.0x |
| 3-6 months | 50% | 1.5x |
| 6-12 months | 100% | 2.0x |
| 1-2 years | 150% | 2.5x |
| 2-4 years | 200% | 3.0x |
| 4+ years | 200% | 3.0x (max) |

#### Component 3: Role Multiplier

```solidity
function getRoleMultiplier(address voter, VoterGroup group) 
    public 
    view 
    returns (uint256) 
{
    if (group == VoterGroup.FM_ONLY) {
        return 15 * 1e17;  // 1.5x for FMs
    }
    
    if (group == VoterGroup.INVESTOR_ONLY) {
        InvestorClass class = investorRegistry.getClass(voter);
        if (class == InvestorClass.STRATEGIC) return 20 * 1e17;  // 2.0x
        if (class == InvestorClass.INSTITUTIONAL) return 15 * 1e17;  // 1.5x
        if (class == InvestorClass.PREMIUM) return 12 * 1e17;  // 1.2x
        return 10 * 1e17;  // 1.0x for Retail
    }
    
    if (group == VoterGroup.BOTH) {
        if (fundRegistry.isActiveFM(voter)) return 15 * 1e17;  // 1.5x for FMs
        
        InvestorClass class = investorRegistry.getClass(voter);
        if (class == InvestorClass.STRATEGIC) return 20 * 1e17;  // 2.0x
        if (class == InvestorClass.INSTITUTIONAL) return 13 * 1e17;  // 1.3x
        return 10 * 1e17;  // 1.0x for others
    }
    
    return 10 * 1e17;  // 1.0x default
}
```

**Rationale for Role Multipliers**:
```
Fund Managers (1.5x):
- Have operational expertise
- Understand technical implications
- Higher stake in protocol success

Strategic Investors (2.0x):
- Large capital commitment (100k+ TOSS)
- Long-term aligned
- Often institutional expertise

Institutional Investors (1.3-1.5x):
- Professional investment approach
- Due diligence capability
- Long-term perspective

Retail Investors (1.0x):
- Base voting power
- Important for decentralization
- Protected by quorum requirements
```

### Complete Voting Power Formula

```solidity
function getProtocolVotingPower(
    address voter,
    uint256 proposalId
) public view returns (uint256) {
    ProtocolProposal storage proposal = protocolProposals[proposalId];
    
    // Check eligibility first
    if (!canVote(voter, proposalId)) return 0;
    
    // Get staked TOSS at snapshot
    uint256 stakedTOSS = staking.balanceOfAt(voter, proposal.snapshot);
    
    // Get lock bonus
    uint256 lockBonus = getLockBonus(voter);  // 0-2.0x as 18 decimals
    
    // Get role multiplier
    uint256 roleMultiplier = getRoleMultiplier(voter, proposal.voterGroup);
    
    // Calculate final voting power
    uint256 votingPower = (stakedTOSS * (1e18 + lockBonus) * roleMultiplier) / 1e36;
    
    return votingPower;
}
```

**Example Calculations**:

```
Scenario 1: Strategic Investor, 4-year lock
- Staked: 100,000 TOSS
- Lock Bonus: 2.0x (200%)
- Role Multiplier: 2.0x
- VP = 100,000 × 3.0 × 2.0 = 600,000

Scenario 2: FM, 1-year lock
- Staked: 50,000 TOSS
- Lock Bonus: 2.0x (100%)
- Role Multiplier: 1.5x
- VP = 50,000 × 2.0 × 1.5 = 150,000

Scenario 3: Retail Investor, no lock
- Staked: 10,000 TOSS
- Lock Bonus: 1.0x (0%)
- Role Multiplier: 1.0x
- VP = 10,000 × 1.0 × 1.0 = 10,000
```

## Delegation System

### Fund-Level Delegation

**Scope**: Per-fund delegation

```solidity
// Delegate votes for specific fund
mapping(uint256 => mapping(address => address)) public fundDelegation;

function delegateFundVotes(uint256 fundId, address delegatee) external {
    require(vault.balanceOf(msg.sender, fundId) > 0, "No shares in fund");
    fundDelegation[fundId][msg.sender] = delegatee;
}

// Can delegate to different addresses for different funds
// Example: Delegate to whale in Fund A, vote directly in Fund B
```

**Use Cases**:
- Passive investors delegate to active community members
- Small investors pool voting power
- Professional investor delegates (fund of funds managers)

### FM-Level Delegation

**Scope**: FM-to-FM delegation

```solidity
mapping(address => address) public fmDelegation;

function delegateFMVotes(address delegatee) external onlyActiveFM {
    require(fundRegistry.isActiveFM(delegatee), "Delegatee not FM");
    fmDelegation[msg.sender] = delegatee;
}
```

**Patterns**:
- Specialized FMs (Quant → Quant, DeFi → DeFi)
- Regional coalitions
- Strategy-based groups (Conservative FMs, Aggressive FMs)

### Protocol-Level Delegation

**Scope**: Global TOSS delegation

```solidity
mapping(address => address) public protocolDelegation;

function delegateProtocolVotes(address delegatee) external {
    require(staking.getStake(msg.sender) > 0, "No TOSS staked");
    protocolDelegation[msg.sender] = delegatee;
}

// Transitive delegation allowed
// A delegates to B, B delegates to C → C votes with A+B+C power
```

### Delegation Rewards

```solidity
function claimDelegationRewards(uint256[] calldata proposalIds) external {
    uint256 totalReward = 0;
    
    for (uint i = 0; i < proposalIds.length; i++) {
        uint256 proposalId = proposalIds[i];
        
        // If voted on proposal
        if (hasVoted[proposalId][msg.sender]) {
            uint256 directReward = _calculateVoterReward(proposalId, msg.sender);
            totalReward += directReward;
        }
        
        // If received delegations
        address[] memory delegators = _getDelegators(msg.sender);
        for (uint j = 0; j < delegators.length; j++) {
            uint256 delegatedReward = _calculateDelegatorReward(
                proposalId,
                delegators[j]
            );
            totalReward += delegatedReward * 50 / 100;  // Delegate gets 50%
        }
    }
    
    TOSS.transfer(msg.sender, totalReward);
    emit DelegationRewardsClaimed(msg.sender, totalReward);
}
```

**Reward Split**:
- **Delegator**: 50% of their voting power's reward
- **Delegate**: 50% of delegated voting power's reward

## Voting Strategies

### Quadratic Voting (Future)

Planned for protocol-level governance:

```
Cost to cast N votes = N²

Example:
- 1 vote costs: 1 TOSS
- 10 votes cost: 100 TOSS
- 100 votes cost: 10,000 TOSS

Prevents whale dominance while rewarding conviction
```

### Conviction Voting (Experimental)

For fund-level decisions, testing conviction-based voting:

```
Voting Power = Shares × sqrt(Days_Conviction)

Example:
Investor with 1,000 shares:
- Vote immediately: 1,000 × sqrt(0) = 0 power
- Vote after 1 day: 1,000 × sqrt(1) = 1,000 power
- Vote after 4 days: 1,000 × sqrt(4) = 2,000 power
- Vote after 9 days: 1,000 × sqrt(9) = 3,000 power

Rewards waiting and conviction vs instant voting
```

## Vote Privacy & Shielded Voting

### Current: Transparent Voting

All votes are public:
```solidity
event VoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    uint8 support,
    uint256 votingPower
);
```

**Pros**: Full transparency, prevents secret deals  
**Cons**: Voting pressure, whale watching

### Future: Shielded Voting (zkProof-based)

Planned for protocol-level:

```solidity
function castShieldedVote(
    uint256 proposalId,
    bytes calldata zkProof  // Proves eligibility without revealing identity
) external {
    require(zkVerifier.verify(zkProof), "Invalid proof");
    // Vote recorded but voter identity hidden until reveal period
}

function revealVote(uint256 proposalId) external {
    // After voting ends, votes are revealed
}
```

**Benefits**:
- Prevents voter coercion
- Reduces strategic voting
- More honest preferences

## Quorum Requirements

### Fund-Level Quorum

```
Standard Proposals:
Quorum = (For + Against + Abstain) / Total_Shares ≥ 30%

Important Proposals:
Quorum ≥ 40%

Critical Proposals:
Quorum ≥ 50%
```

**Dynamic Quorum** (planned):
```
If <30% turnout after 5 days:
→ Extend voting by 2 days
→ Lower quorum to 20% for extended period
→ Notify all investors again
```

### FM-Level Quorum

```
Standard: 20% of FM voting power
Critical: 40% of FM voting power

Voting Power = Σ(AUM_i × Reputation_i)
```

**Example**:
```
Total FM Voting Power: $100M
Quorum (20%): $20M

FMs who voted:
- Alice: $9.4M
- Bob: $16.8M
- Charlie: $4.9M
Total: $31.1M → Quorum MET (31.1% > 20%)
```

### Protocol-Level Quorum

```yaml
FM_ONLY Proposals:
  Quorum: 15% of FM voting power
  
INVESTOR_ONLY Proposals:
  Quorum: 10% of investor voting power
  
BOTH Proposals:
  Quorum: 10% of combined voting power
  
GUARDIAN_ONLY:
  Quorum: 3-of-5 guardians must vote
```

## Approval Thresholds

### Simple Majority (>50%)

Used for:
- Fund-level fee changes
- Standard FM proposals
- Minor protocol tweaks

### Supermajority (>66%)

Used for:
- Fund-level risk parameter changes
- Important FM proposals
- Protocol important changes

### Critical Supermajority (>75%)

Used for:
- Fund Manager replacement
- Critical FM stake changes
- Protocol critical changes (upgrades, security)
- Investor override of FM (fund-level)

## Vote Manipulation Prevention

### Flash Loan Protection

```solidity
// Voting power based on snapshot (historical balance)
uint256 snapshot = block.number - 1;  // 1 block before voting starts

// Flash loan in same block cannot affect vote
uint256 votingPower = staking.balanceOfAt(voter, snapshot);
```

### Sybil Resistance

```yaml
Fund-Level:
  - Sybil has no advantage (voting power = capital invested)
  - Splitting shares across addresses doesn't increase power

FM-Level:
  - Must be verified FM (KYC optional but recommended)
  - Splitting AUM across fake FMs doesn't work (reputation component)

Protocol-Level:
  - Must stake TOSS (expensive to acquire significant voting power)
  - Lock requirements discourage short-term manipulation
```

### Vote Buying Prevention

```yaml
Transparent Voting:
  - All votes public
  - Vote buying detectable
  - Community can punish vote buyers

Reputation Impact:
  - Detected vote buying reduces reputation score
  - Slashing for FMs caught vote buying
  - Investors banned for repeated buying

Future Shielded Voting:
  - Harder to verify vote buying
  - Reduces effectiveness of buying votes
```

## Governance Rewards

### Reward Distribution

```solidity
function distributeVotingRewards(uint256 proposalId) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.state == ProposalState.EXECUTED, "Not executed");
    
    uint256 rewardPool = _getProposalRewardPool(proposalId);
    
    // Reward voters proportionally
    for (uint i = 0; i < voters[proposalId].length; i++) {
        address voter = voters[proposalId][i];
        uint256 voterPower = votingPower[proposalId][voter];
        uint256 reward = (rewardPool * voterPower) / proposal.totalVotingPower;
        
        rewardClaims[voter] += reward;
    }
}
```

**Reward Pool Sources**:
```
Fund-Level: 1% of protocol fees from that fund
FM-Level: 5% of FM-related protocol fees
Protocol-Level: 5% of total protocol fees
```

**Distribution**:
```
Active Voters: 70% (proportional to voting power used)
Proposal Author: 20% (if passed)
Delegates: 10% (proportional to delegated power)
```

## Voting Interface Examples

### Fund-Level Voting UI

```typescript
// Investor sees active proposals for their funds
interface FundProposalCard {
  fundId: number;
  fundName: string;
  proposalId: number;
  title: string;
  proposedBy: 'Fund Manager' | 'Investor';
  proposalType: string;
  currentValue: string;
  proposedValue: string;
  votingDeadline: Date;
  currentResults: {
    for: number;      // % of shares
    against: number;
    abstain: number;
    quorum: number;   // % reached
  };
  yourVotingPower: number;  // % of fund
  yourVote: 'for' | 'against' | 'abstain' | null;
}
```

### FM-Level Voting UI

```typescript
interface FMProposalCard {
  proposalId: number;
  title: string;
  proposedBy: string;  // FM address or ENS
  proposalType: string;
  description: string;
  votingDeadline: Date;
  discussionUrl: string;
  currentResults: {
    for: string;      // $ voting power
    against: string;
    quorumReached: boolean;
  };
  yourVotingPower: string;  // $ value
  yourVote: 'for' | 'against' | null;
  totalFMsVoted: number;
}
```

### Protocol-Level Voting UI

```typescript
interface ProtocolProposalCard {
  proposalId: number;
  title: string;
  proposalType: string;
  voterGroup: 'FM Only' | 'Investor Only' | 'Both' | 'Guardian';
  description: string;
  technicalDetails: string;
  simulationResults: string;
  votingDeadline: Date;
  guardianReviewStatus: 'pending' | 'approved' | 'vetoed';
  currentResults: {
    for: number;      // TOSS voting power
    against: number;
    abstain: number;
    quorum: number;
  };
  yourVotingPower: number;
  canYouVote: boolean;
  yourVote: 'for' | 'against' | 'abstain' | null;
}
```

## Next Steps

- **[DAO Structure](/docs/protocol/governance/dao-structure)**: Governance level specifications
- **[Proposal Lifecycle](/docs/protocol/governance/proposal-lifecycle)**: Detailed flows
- **[Governance Contracts](/docs/protocol/contracts/governance-layer)**: Smart contract specs

---

*Back to [Governance Overview](/docs/protocol/governance/overview)*

