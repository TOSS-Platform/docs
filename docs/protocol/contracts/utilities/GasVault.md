# GasVault.sol

## Overview

Manages gas funds for Paymaster operations, enabling gas-sponsored transactions for FMs and investors.

## Purpose

- Hold gas reserves (ETH/USDC)
- Fund Paymaster operations
- Track gas usage per domain
- Auto-refill from protocol fees
- Enable gasless UX

## Functions

### `fundPaymaster`

```solidity
function fundPaymaster(
    uint256 amount
) external onlyGovernance
```

**Purpose**: Transfer funds to Paymaster

**Parameters**:
- `amount`: ETH amount to transfer

**Access Control**: Only governance

### `trackGasUsage`

```solidity
function trackGasUsage(
    address user,
    uint256 gasUsed
) external onlyPaymaster
```

**Purpose**: Track gas consumption

**Use Case**: Analytics, refill scheduling

## Test Scenarios

```typescript
it("should fund paymaster correctly", async () => {
  await gasVault.connect(governance).fundPaymaster(ethers.utils.parseEther("10"));
  expect(await ethers.provider.getBalance(paymaster.address)).to.equal(ethers.utils.parseEther("10"));
});
```

---

**All Utility Contracts Complete!**

