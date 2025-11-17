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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Check clean address | AMLGuard checks address not on sanctions list | Check passes, address allowed, AddressChecked event emitted |
| Add address to sanctions | Governance adds address to sanctions list | Address added, AddressSanctioned event emitted, future checks will block |
| Remove address from sanctions | Governance removes address from sanctions list | Address removed, AddressUnsanctioned event emitted, address can operate |
| Batch check addresses | Check multiple addresses for sanctions | All addresses checked, results returned, batch check efficient |
| Query sanctions status | Query whether address is on sanctions list | Status returned correctly (true if sanctioned, false otherwise) |
| Check address before deposit | Fund vault checks investor address before deposit | Sanctioned addresses blocked, clean addresses allowed |
| Check address before withdrawal | Fund vault checks investor address before withdrawal | Sanctioned addresses blocked, clean addresses allowed |
| Update sanctions list | Governance updates sanctions list (adds/removes multiple addresses) | List updated correctly, all changes reflected |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Check zero address | Check if zero address (address(0)) is sanctioned | Zero address handled correctly, may be blocked or allowed depending on implementation |
| Check contract address | Check if contract address is on sanctions list | Contract addresses handled correctly, sanctions apply equally |
| Add duplicate address | Attempt to add address already on sanctions list | Transaction may succeed (no-op) or revert depending on implementation |
| Remove non-sanctioned address | Attempt to remove address not on sanctions list | Transaction may succeed (no-op) or revert depending on implementation |
| Query non-existent address | Query sanctions status for address never checked | Returns false (not sanctioned) or reverts depending on implementation |
| Batch check with all clean | Check multiple addresses, all clean | All checks pass, batch check efficient |
| Batch check with all sanctioned | Check multiple addresses, all sanctioned | All checks fail, batch check efficient |
| Batch check with mixed | Check multiple addresses, some sanctioned, some clean | Sanctioned addresses identified, clean addresses allowed |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Add to sanctions from non-authorized | Non-authorized address attempts to add to sanctions list | Transaction reverts with "Not authorized" error |
| Remove from sanctions from non-authorized | Non-authorized address attempts to remove from sanctions list | Transaction reverts with "Not authorized" error |
| Check with invalid address | Attempt to check invalid address format | Transaction reverts with validation error |
| Block sanctioned address | Fund vault checks sanctioned address, deposit/withdrawal blocked | Transaction reverts with "Address sanctioned" error |
| Update sanctions from non-authorized | Non-authorized attempts to update sanctions list | Transaction reverts with "Not authorized" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized sanctions updates | Attacker attempts to add or remove addresses from sanctions list | Transaction reverts, only governance can update sanctions |
| Sanctions list integrity | Verify sanctions list cannot be manipulated | List controlled by governance, unauthorized changes rejected |
| Check enforcement | Verify sanctioned addresses cannot bypass checks | All operations check sanctions, sanctioned addresses blocked |
| List immutability | Verify past sanctions records cannot be deleted | History maintained, past sanctions tracked for audit |
| Zero address handling | Verify zero address handled correctly | Zero address either blocked or explicitly allowed, no ambiguity |
| Contract address handling | Verify contract addresses checked correctly | Contracts checked same as EOA, no special exceptions |
| Time-based sanctions | Verify time-based sanctions (if implemented) enforced correctly | Time-based restrictions enforced, sanctions expire correctly |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Add to sanctions by governance | Governance adds address to sanctions list | Transaction succeeds |
| Add to sanctions by non-authorized | Non-authorized attempts to add to sanctions | Transaction reverts with "Not authorized" |
| Remove from sanctions by governance | Governance removes address from sanctions list | Transaction succeeds |
| Remove from sanctions by non-authorized | Non-authorized attempts to remove from sanctions | Transaction reverts with "Not authorized" |
| Check address by any contract | Any contract checks address for sanctions | Transaction succeeds, checks are public |
| Query sanctions status by any address | Any address queries sanctions status | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund vault deposit integration | Fund vault checks investor address before deposit | Sanctioned addresses blocked, clean addresses can deposit |
| Fund vault withdrawal integration | Fund vault checks investor address before withdrawal | Sanctioned addresses blocked, clean addresses can withdraw |
| FundFactory integration | FundFactory checks fund manager address before fund creation | Sanctioned fund managers blocked, clean FMs can create funds |
| Investor registry integration | InvestorRegistry checks investor address during registration | Sanctioned investors blocked, clean investors can register |
| Multiple operation checks | Various contracts check addresses for multiple operations | All checks enforced correctly, sanctions apply consistently |
| External sanctions source integration | AMLGuard integrates with external sanctions list (if implemented) | External source consulted, sanctions list kept up to date |
| Batch operations integration | Batch deposit/withdrawal operations check all addresses | All addresses checked, batch operations respect sanctions |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Single address check gas | Check single address for sanctions | Gas usage reasonable for check operation |
| Batch address check gas | Check multiple addresses for sanctions | Batch check efficient, gas usage reasonable |
| Add to sanctions gas | Governance adds address to sanctions list | Gas usage reasonable for add operation |
| Remove from sanctions gas | Governance removes address from sanctions list | Gas usage reasonable for remove operation |
| Query operations gas | Multiple queries for sanctions status | View functions consume no gas (read-only) |

---

**Next**: [GasVault](/docs/protocol/contracts/utilities/GasVault)

