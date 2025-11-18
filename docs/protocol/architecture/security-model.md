# Security Model

The TOSS Protocol implements a multi-layered security model combining cryptographic security, economic incentives, smart contract best practices, and operational safeguards.

## Security Philosophy

TOSS security is built on three pillars:

1. **Cryptographic Security**: Validity proofs and Ethereum L1 finality
2. **Economic Security**: Staking and slashing mechanisms
3. **Operational Security**: Monitoring, access controls, and emergency procedures

## Layer 0: Ethereum L1 Security

### Security Guarantees

- **Consensus Security**: Protected by Ethereum's proof-of-stake consensus
- **Finality**: State roots achieve Ethereum-grade finality
- **Censorship Resistance**: Cannot be censored at L1 level
- **Recovery Mechanisms**: L1 can override L2 in emergencies

### Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| 51% Attack on Ethereum | Requires compromising Ethereum itself |
| Bridge Exploit | Audited contracts, formal verification, timelocks |
| State Root Manipulation | Impossible due to validity proofs |

## Layer 1: zkSync L2 Security

### Validity Proofs

- **Cryptographic Guarantees**: Zero-knowledge proofs ensure execution correctness
- **No Fraud Window**: Unlike optimistic rollups, instant finality once proven
- **Prover Soundness**: Impossible to prove invalid state transitions

### Security Properties

```
Security = min(zkSync_Security, Ethereum_L1_Security)
```

Since zkSync uses validity proofs, security equals Ethereum L1 security.

### zkSync-Specific Protections

- **Sequencer Failure**: L1 can force transactions if sequencer censors
- **Prover Failure**: Multiple provers can generate proofs
- **Bootloader Security**: System contracts audited and immutable

## Layer 2: Smart Contract Security

### Contract Architecture Security

#### Domain Isolation

```solidity
// Core contracts cannot access Fund contracts directly
CoreDomain ✗→ FundDomain

// All cross-domain access through controlled interfaces
CoreDomain →[Interface]→ FundDomain
```

#### Access Control

```solidity
// Role-based access control
modifier onlyFundManager(uint256 fundId) {
    require(msg.sender == funds[fundId].manager, "Not FM");
    _;
}

modifier onlyRiskEngine() {
    require(msg.sender == riskEngine, "Not RiskEngine");
    _;
}

modifier onlyDAO() {
    require(msg.sender == daoGovernance, "Not DAO");
    _;
}
```

#### Reentrancy Protection

```solidity
// All external calls protected
function withdraw(uint256 amount) external nonReentrant {
    // State changes before external call
    balances[msg.sender] -= amount;
    
    // External call last
    IERC20(asset).transfer(msg.sender, amount);
}
```

### Smart Contract Best Practices

- **Checks-Effects-Interactions**: State changes before external calls
- **SafeMath**: Overflow protection (Solidity 0.8+)
- **Pull over Push**: Users withdraw rather than protocol pushing
- **Circuit Breakers**: Emergency pause functionality
- **Upgradability**: Proxy patterns with timelock delays

### Audit Requirements

- **Pre-Launch**: 2+ independent audits
- **Critical Upgrades**: Re-audit required
- **Continuous**: Bug bounty program
- **Formal Verification**: For critical contracts (RiskEngine, SlashingEngine)

## Economic Security Model

### Fund Manager Staking

#### Staking Requirements

```
Minimum Stake = BaseStake + (AUM × StakeRatio)

Example:
- BaseStake = 10,000 TOSS
- StakeRatio = 0.001 (0.1% of AUM)
- For $1M fund: 10,000 + (1,000,000 × 0.001) = 11,000 TOSS
```

#### Slashing Mechanics

```
Slash Amount = min(
    stake × SlashRatio(FaultIndex),
    LossCap,
    TotalStake
)

Where:
- SlashRatio(FI) = 0.01 to 1.0 based on FaultIndex
- LossCap = Maximum based on fund loss
- TotalStake = Total FM stake
```

### Economic Attack Vectors

#### Attack: FM Drains Fund

- **Cost**: Entire FM stake (slashed and burned)
- **Gain**: Stolen fund assets
- **Profitability**: Only if stolen assets > stake value
- **Mitigation**: Stake must exceed maximum single-trade impact

#### Attack: Governance Capture

- **Cost**: Acquire >51% of TOSS voting power
- **Gain**: Control protocol parameters
- **Profitability**: Extremely expensive for marginal gains
- **Mitigation**: Timelock delays, parameter limits, guardian veto

#### Attack: Oracle Manipulation

- **Cost**: Manipulate multiple price feeds
- **Gain**: Profit from incorrect NAV
- **Profitability**: Requires manipulating multiple independent sources
- **Mitigation**: Multi-source oracles, deviation thresholds, circuit breakers

## Investor Protection Mechanisms

### Risk Tiers

Funds assigned risk tiers based on strategy:

| Tier | Description | Max Leverage | Max Volatility |
|------|-------------|--------------|----------------|
| 1 | Low Risk | 1x | 20% annualized |
| 2 | Medium Risk | 2x | 40% annualized |
| 3 | High Risk | 3x | 80% annualized |
| 4 | Extreme Risk | 5x | Unlimited |

### Investor Classes

Investors assigned classes based on staking and behavior:

| Class | Min TOSS Stake | Access |
|-------|----------------|--------|
| Retail | 100 | Tier 1-2 funds |
| Premium | 1,000 | Tier 1-3 funds |
| Institutional | 10,000 | All tiers |
| Strategic | 100,000 | All tiers + voting power |

### Withdrawal Protections

```solidity
// Prevents bank run scenarios
function withdraw(uint256 shares) external {
    require(
        totalWithdrawals24h + amount < maxDaily,
        "Daily limit exceeded"
    );
    
    // Apply time-weighted fee for early withdrawal
    uint256 fee = calculateWithdrawalFee(shares, investTime);
    
    // Execute withdrawal
    _burn(msg.sender, shares);
    _transfer(msg.sender, amount - fee);
}
```

## Oracle Security

### Multi-Source Price Feeds

```
Final Price = median([
    Chainlink_Price,
    Binance_Price,
    Coinbase_Price,
    Uniswap_TWAP
])
```

### Deviation Detection

```solidity
function getPriceWithValidation(address asset) 
    external 
    view 
    returns (uint256) 
{
    uint256[] memory prices = _getAllPrices(asset);
    uint256 median = _calculateMedian(prices);
    
    // Check deviation
    for (uint i = 0; i < prices.length; i++) {
        uint256 deviation = abs(prices[i] - median) * 1e18 / median;
        require(deviation < maxDeviation, "Price deviation too high");
    }
    
    return median;
}
```

### Oracle Failure Modes

- **Single Source Failure**: Use median of remaining sources
- **Multiple Source Failure**: Enter safe mode, halt trading
- **Manipulation Detected**: Automatic circuit breaker activation

## Operational Security (OpSec)

### Key Management

- **Hot Wallets**: For routine operations, limited funds
- **Cold Wallets**: For treasury, multisig required
- **Session Keys**: For FM automated trading, rotated daily
- **Hardware Security Modules**: For critical operations

### Monitoring & Alerting

```yaml
Critical Alerts:
  - Large unexpected transfers
  - Slashing events
  - Oracle deviation > threshold
  - Governance proposals with short timelock
  - Emergency pause triggered
  
Warning Alerts:
  - Gas price spike
  - High withdrawal volume
  - Unusual trading patterns
  - RiskEngine warnings
```

### Emergency Procedures

#### Emergency Pause

```solidity
// Guardian can pause in emergency
function emergencyPause() external onlyGuardian {
    _pause();
    emit EmergencyPause(msg.sender, block.timestamp);
}

// DAO can unpause after investigation
function unpause() external onlyDAO {
    require(timelock > minimumPauseTime, "Too soon");
    _unpause();
}
```

#### Circuit Breakers

Automatic triggers:
- Oracle deviation > 10%
- Fund loss > 50% in 24 hours
- Withdrawal volume > 80% of TVL in 24 hours
- Sequencer downtime > 1 hour

## Incident Response Plan

### Phase 1: Detection (0-5 minutes)

- Automated monitoring detects anomaly
- Alert sent to on-call team
- Initial assessment begins

### Phase 2: Containment (5-30 minutes)

- Trigger emergency pause if needed
- Isolate affected contracts/funds
- Prevent further damage

### Phase 3: Analysis (30 minutes - 4 hours)

- Root cause analysis
- Impact assessment
- Develop remediation plan

### Phase 4: Recovery (4 hours - 7 days)

- Implement fixes
- Deploy patches
- Resume operations gradually
- Monitor closely

### Phase 5: Post-Mortem (7-30 days)

- Detailed incident report
- Process improvements
- Additional safeguards
- Community communication

## Security Audits

### Completed Audits

*To be updated with actual audit reports*

- Pre-launch Audit 1: [Pending]
- Pre-launch Audit 2: [Pending]
- zkSync Integration Audit: [Pending]

### Bug Bounty Program

- **Critical**: Up to $500,000
- **High**: Up to $100,000
- **Medium**: Up to $10,000
- **Low**: Up to $1,000

## Security Assumptions

### Trust Assumptions

1. **Ethereum L1**: Assumed to be secure and censorship-resistant
2. **zkSync**: Assumed to correctly implement validity proofs
3. **Price Oracles**: Majority of sources are honest
4. **Governance**: Sufficient honest voting power

### Known Limitations

1. **Smart Contract Bugs**: Possible despite audits
2. **0-day Vulnerabilities**: Unknown unknowns
3. **Economic Attacks**: If attacker stake > system security budget
4. **Regulatory Risk**: External legal/regulatory actions

## Next Steps

- **[Smart Contracts](/protocol/contracts/overview)**: Review contract specifications
- **[Security Deep Dive](/protocol/security/overview)**: Detailed security analysis
- **[Governance](/protocol/governance/overview)**: Governance security model

---

*For operational security procedures, see [Technical Documentation](/technical/intro).*

