# AMLGuard.sol

## Overview

Compliance screening contract that checks addresses against sanctions lists, implements transaction limits, and flags suspicious activity.

## Purpose

- Screen against OFAC/sanctions lists
- Implement transaction limits
- Detect suspicious patterns
- Enable compliance reporting
- Jurisdictional restrictions

## Functions

### `checkAddress`

```solidity
function checkAddress(
    address addr
) external view returns (bool allowed, string memory reason)
```

**Purpose**: Check if address is sanctioned

**Returns**:
- `allowed`: Whether address can interact
- `reason`: Reason if blocked

### `reportSuspicious`

```solidity
function reportSuspicious(
    address addr,
    string calldata reason
) external onlyGuardian
```

**Purpose**: Flag address for review

## Test Scenarios

```typescript
it("should block sanctioned addresses", async () => {
  await amlGuard.addToSanctionsList(sanctionedAddress);
  
  await expect(
    vault.connect(sanctionedUser).deposit(1000, usdc.address)
  ).to.be.revertedWith("Address sanctioned");
});
```

---

**Next**: [GasVault](/docs/protocol/contracts/utilities/GasVault)

