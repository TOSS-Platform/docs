# AMLGuard.sol

## Overview

Compliance screening contract that checks addresses against sanctions lists, implements transaction limits, and flags suspicious activity. Uses ReentrancyGuard for security.

## Purpose

- Screen against OFAC/sanctions lists
- Detect suspicious patterns
- Enable compliance reporting

**Note**: Transaction limits and jurisdictional restrictions are planned for future implementation.

## Inheritance

- `ReentrancyGuard`: OpenZeppelin's ReentrancyGuard for protection against reentrancy attacks
- `IAMLGuard`: Implements the AMLGuard interface

## Constructor

```solidity
constructor(
    address _governance,
    address _guardianCommittee
)
```

**Purpose**: Initialize AMLGuard contract

**Parameters**:

- `_governance`: Governance address (cannot be zero address)
- `_guardianCommittee`: Guardian committee contract address (cannot be zero address)

**Reverts**: If any parameter is zero address (`InvalidAddress`)

## Constants

```solidity
string private constant REASON_SANCTIONED = "Address is on sanctions list";
string private constant REASON_CLEAN = "Address is clean";
```

Used for consistent reason messages in address checks.

## State Variables

```solidity
mapping(address => bool) public sanctionedAddresses;  // Addresses on sanctions list

struct SuspiciousReport {
    address reporter;
    string reason;
    uint256 timestamp;
}

mapping(address => SuspiciousReport) public suspiciousReports;  // Suspicious activity reports

// Access Control
address public governance;
IGuardianCommittee public guardianCommittee;
```

## Functions

### `checkAddress`

```solidity
function checkAddress(
    address addr
) external view returns (bool allowed, string memory reason)
```

**Purpose**: Check if address is sanctioned

**Parameters**:

- `addr`: Address to check

**Returns**:

- `allowed`: Whether address can interact (true if clean, false if sanctioned)
- `reason`: Reason if blocked ("Address is on sanctions list" or "Address is clean")

**Note**: This is a view function, so events cannot be emitted. The `AddressChecked` event is defined in the interface for potential future use or for contracts that wrap this function in a state-changing function.

### `addToSanctions`

```solidity
function addToSanctions(address addr) external onlyGovernance
```

**Purpose**: Add address to sanctions list

**Parameters**:

- `addr`: Address to sanction (cannot be zero address)

**Access Control**: Only Governance

**Reverts**:

- If `addr` is zero address (`InvalidAddress`)
- If address is already sanctioned (`AlreadySanctioned`)
- If caller is not governance (`NotGovernance`)

**Events**: Emits `AddressSanctioned` event

### `removeFromSanctions`

```solidity
function removeFromSanctions(address addr) external onlyGovernance
```

**Purpose**: Remove address from sanctions list

**Parameters**:

- `addr`: Address to unsanction (cannot be zero address)

**Access Control**: Only Governance

**Reverts**:

- If `addr` is zero address (`InvalidAddress`)
- If address is not sanctioned (`NotSanctioned`)
- If caller is not governance (`NotGovernance`)

**Events**: Emits `AddressUnsanctioned` event

### `batchCheckAddresses`

```solidity
function batchCheckAddresses(
    address[] calldata addresses
) external view returns (bool[] memory allowed, string[] memory reasons)
```

**Purpose**: Batch check multiple addresses for sanctions

**Parameters**:

- `addresses`: Array of addresses to check

**Returns**:

- `allowed`: Array of allowed statuses (true if clean, false if sanctioned)
- `reasons`: Array of reasons for each address

**Gas Optimization**: More efficient than calling `checkAddress` multiple times

### `isSanctioned`

```solidity
function isSanctioned(address addr) external view returns (bool)
```

**Purpose**: Query whether address is on sanctions list

**Parameters**:

- `addr`: Address to query

**Returns**: `true` if address is sanctioned, `false` otherwise

### `getSuspiciousReport`

```solidity
function getSuspiciousReport(
    address addr
) external view returns (SuspiciousReport memory report)
```

**Purpose**: Get suspicious report for an address

**Parameters**:

- `addr`: Address to query

**Returns**: `SuspiciousReport` struct containing:
- `reporter`: Address that reported the suspicious activity
- `reason`: Reason for the report
- `timestamp`: Timestamp when the report was made

**Note**: Returns empty struct (zero values) if no report exists for the address

### `reportSuspicious`

```solidity
function reportSuspicious(
    address addr,
    string calldata reason
) external onlyGuardian
```

**Purpose**: Flag address for review

**Parameters**:

- `addr`: Address to flag (cannot be zero address)
- `reason`: Reason for flagging (cannot be empty)

**Access Control**: Only Guardian (via GuardianCommittee)

**Reverts**:

- If `addr` is zero address (`InvalidAddress`)
- If `reason` is empty (`EmptyReason`)
- If caller is not a guardian (`NotGuardian`)

**Events**: Emits `SuspiciousAddressReported` event

**Note**: Multiple reports for the same address will overwrite the previous report

### Administrative Functions

#### `setGovernance`

```solidity
function setGovernance(address newGovernance) external onlyGovernance
```

**Purpose**: Update governance address

**Parameters**:

- `newGovernance`: New governance address (cannot be zero address)

**Access Control**: Only Governance

**Reverts**: If `newGovernance` is zero address (`InvalidAddress`)

**Events**: Emits `GovernanceUpdated` event

#### `setGuardianCommittee`

```solidity
function setGuardianCommittee(address newGuardianCommittee) external onlyGovernance
```

**Purpose**: Update guardian committee address

**Parameters**:

- `newGuardianCommittee`: New guardian committee contract address (cannot be zero address)

**Access Control**: Only Governance

**Reverts**: If `newGuardianCommittee` is zero address (`InvalidAddress`)

**Events**: Emits `GuardianCommitteeUpdated` event

## Events

### `AddressChecked`

```solidity
event AddressChecked(
    address indexed addr,
    bool allowed,
    string reason
);
```

**Note**: This event is defined in the interface but cannot be emitted by `checkAddress` since it is a view function. It may be used by contracts that wrap `checkAddress` in a state-changing function.

### `AddressSanctioned`

```solidity
event AddressSanctioned(
    address indexed addr,
    address indexed by,
    uint256 timestamp
);
```

Emitted when an address is added to the sanctions list.

### `AddressUnsanctioned`

```solidity
event AddressUnsanctioned(
    address indexed addr,
    address indexed by,
    uint256 timestamp
);
```

Emitted when an address is removed from the sanctions list.

### `SuspiciousAddressReported`

```solidity
event SuspiciousAddressReported(
    address indexed addr,
    string reason,
    address indexed reporter,
    uint256 timestamp
);
```

Emitted when a guardian reports a suspicious address.

### `GovernanceUpdated`

```solidity
event GovernanceUpdated(
    address indexed oldGovernance,
    address indexed newGovernance
);
```

Emitted when the governance address is updated.

### `GuardianCommitteeUpdated`

```solidity
event GuardianCommitteeUpdated(
    address indexed oldGuardianCommittee,
    address indexed newGuardianCommittee
);
```

Emitted when the guardian committee address is updated.

## Custom Errors

### `NotGovernance`

```solidity
error NotGovernance();
```

Reverted when a function requiring governance access is called by a non-governance address.

### `NotGuardian`

```solidity
error NotGuardian();
```

Reverted when a function requiring guardian access is called by a non-guardian address.

### `InvalidAddress`

```solidity
error InvalidAddress();
```

Reverted when a zero address is provided where a valid address is required.

### `AlreadySanctioned`

```solidity
error AlreadySanctioned();
```

Reverted when attempting to add an address that is already on the sanctions list.

### `NotSanctioned`

```solidity
error NotSanctioned();
```

Reverted when attempting to remove an address that is not on the sanctions list.

### `EmptyReason`

```solidity
error EmptyReason();
```

Reverted when an empty reason string is provided to `reportSuspicious`.

## Access Control

### Roles

| Role | Addresses | Permissions |
|------|-----------|-------------|
| **Governance** | DAO | Add/remove sanctions, update governance and guardian committee |
| **Guardian** | Guardian Committee Members | Report suspicious addresses |

### Modifiers

- `onlyGovernance`: Ensures caller is the governance address
- `onlyGuardian`: Ensures caller is a member of the guardian committee (via `IGuardianCommittee.isMember()`)

### Permission Matrix

| Function | Anyone | Governance | Guardian |
|----------|--------|------------|----------|
| `checkAddress` | ✅ | ✅ | ✅ |
| `batchCheckAddresses` | ✅ | ✅ | ✅ |
| `isSanctioned` | ✅ | ✅ | ✅ |
| `getSuspiciousReport` | ✅ | ✅ | ✅ |
| `addToSanctions` | ❌ | ✅ | ❌ |
| `removeFromSanctions` | ❌ | ✅ | ❌ |
| `reportSuspicious` | ❌ | ❌ | ✅ |
| `setGovernance` | ❌ | ✅ | ❌ |
| `setGuardianCommittee` | ❌ | ✅ | ❌ |

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Check clean address | AMLGuard checks address not on sanctions list | Check passes, address allowed (note: AddressChecked event cannot be emitted in view functions) |
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
| Check zero address | Check if zero address (address(0)) is sanctioned | Zero address is allowed (returns true, "Address is clean"). Cannot be added to sanctions (reverts with `InvalidAddress`) |
| Check contract address | Check if contract address is on sanctions list | Contract addresses handled correctly, sanctions apply equally |
| Add duplicate address | Attempt to add address already on sanctions list | Transaction reverts with `AlreadySanctioned` error |
| Remove non-sanctioned address | Attempt to remove address not on sanctions list | Transaction reverts with `NotSanctioned` error |
| Query non-existent address | Query sanctions status for address never checked | Returns false (not sanctioned) |
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

**Next**: [GasVault](/protocol/contracts/utilities/GasVault)

