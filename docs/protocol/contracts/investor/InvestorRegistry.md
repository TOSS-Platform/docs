# InvestorRegistry.sol

## Overview

Central registry for all investors, tracking identity, class, reputation score, and investment history across funds.

## Purpose

- Maintain investor identity database
- Track investor class (Retail, Premium, Institutional, Strategic)
- Calculate and store Investor Composite Score (ICS)
- Monitor investor status and history
- Enable investor queries and filtering

## State Variables

```solidity
struct InvestorProfile {
    address wallet;
    InvestorClass class;
    uint256 icsScore;           // Investor Composite Score (0-100)
    InvestorState state;        // ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED
    uint256 registeredAt;
    uint256 totalInvested;      // Lifetime USD invested
    uint256 tossStaked;         // Current TOSS stake
    uint256 fundsInvested;      // Number of funds invested in
}

mapping(address => InvestorProfile) public investors;
address[] public investorList;

enum InvestorClass { RETAIL, PREMIUM, INSTITUTIONAL, STRATEGIC }
enum InvestorState { ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED }
```

## Functions

### `registerInvestor`

```solidity
function registerInvestor(
    address investor
) external returns (bool)
```

**Purpose**: Register new investor (auto-called on first deposit)

**Returns**: Success status

**Behavior**:
- Creates investor profile
- Assigns RETAIL class initially
- Sets state to ACTIVE
- Calculates initial ICS

### `upgradeClass`

```solidity
function upgradeClass(
    address investor,
    InvestorClass newClass
) external
```

**Purpose**: Upgrade investor to higher class

**Requirements**:
- TOSS stake meets threshold
- ICS score meets minimum
- No violations

**Class Thresholds**:
```
RETAIL → PREMIUM: 1,000 TOSS + ICS 50
PREMIUM → INSTITUTIONAL: 10,000 TOSS + ICS 70
INSTITUTIONAL → STRATEGIC: 100,000 TOSS + ICS 85
```

### `updateICS`

```solidity
function updateICS(
    address investor,
    uint256 newScore
) external onlyScoreCalculator
```

**Purpose**: Update Investor Composite Score

**Access Control**: Only InvestorScoreCalculator

## Test Scenarios

```typescript
describe("InvestorRegistry", () => {
  it("should register investor on first deposit", async () => {
    await fundVault.connect(newInvestor).deposit(1000, usdc.address);
    
    const profile = await investorRegistry.investors(newInvestor.address);
    expect(profile.class).to.equal(InvestorClass.RETAIL);
    expect(profile.state).to.equal(InvestorState.ACTIVE);
  });
  
  it("should upgrade class when requirements met", async () => {
    await toss.connect(investor).stake(ethers.utils.parseEther("1000"));
    await investorScoreCalculator.updateScore(investor.address);  // Gets ICS 55
    
    await investorRegistry.upgradeClass(investor.address, InvestorClass.PREMIUM);
    
    const profile = await investorRegistry.investors(investor.address);
    expect(profile.class).to.equal(InvestorClass.PREMIUM);
  });
});
```

---

**Next**: [InvestorScoreCalculator](/docs/protocol/contracts/investor/InvestorScoreCalculator)

