# InvestorRiskDomain.sol

## Overview

Monitors investor behavior patterns to detect manipulation, panic selling, and systemic risk from coordinated investor actions.

## Purpose

- Track withdrawal patterns (WBR)
- Monitor deposit velocity (DVR)
- Detect coordinated attacks
- Prevent bank run scenarios
- Flag suspicious investor behavior

## State Variables

```solidity
IInvestorRegistry public investorRegistry;
IInvestorStateMachine public stateMachine;

struct InvestorBehavior {
    uint256 totalDeposits;
    uint256 totalWithdrawals;
    uint256 lastDepositTime;
    uint256 lastWithdrawalTime;
    uint256 panicWithdrawals;  // Withdrawals during fund loss
    uint256 rapidCycles;       // Deposit-withdraw cycles < 24h
}

mapping(address => mapping(uint256 => InvestorBehavior)) public behavior;  // investor => fundId => behavior
```

## Functions

### `validate`

```solidity
function validate(
    uint256 fundId
) external view returns (bool passed, uint256 faultIndex)
```

**Purpose**: Check fund's investor behavior health

**Returns**:
- `passed`: Whether investor patterns normal
- `faultIndex`: Risk score from investor behavior

**Checks**:
1. **WBR** (Withdrawal Behavior Ratio)
2. **DVR** (Deposit Velocity Ratio)
3. **Panic Selling** Detection
4. **Coordinated Withdrawals**

### `recordInvestorAction`

```solidity
function recordInvestorAction(
    address investor,
    uint256 fundId,
    ActionType action,
    uint256 amount
) external onlyVault
```

**Purpose**: Record investor action for pattern analysis

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID
- `action`: DEPOSIT or WITHDRAWAL
- `amount`: Action amount

## Test Scenarios

```typescript
it("should detect panic selling", async () => {
  // Fund loses 20%
  await fundVault.updateNAV(800000);  // Was 1M
  
  // Investor immediately withdraws
  await fundVault.requestWithdrawal(allShares);
  
  const { passed, faultIndex } = await investorDomain.validate(fundId);
  expect(faultIndex).to.be.gt(0);  // Panic detected
});
```

---

**Next**: [SlashingEngine](/docs/protocol/contracts/risk/SlashingEngine)

