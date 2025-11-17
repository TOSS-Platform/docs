# TOSS.sol

## Overview

The TOSS token is the core ERC20 governance and utility token of the TOSS Protocol. It serves as the economic security mechanism through staking, enables decentralized governance, and implements deflationary mechanics through slashing-based burns.

## Purpose

TOSS.sol provides:
- **Governance Rights**: Token holders vote on protocol parameters
- **Economic Security**: Fund Managers stake TOSS as collateral
- **Investor Benefits**: Staking unlocks fund access and fee discounts
- **Deflationary Supply**: Burns from slashing reduce total supply over time
- **Gas Sponsorship**: Funds Paymaster operations

## Core Responsibilities

- ✅ Implement ERC20 standard with extensions
- ✅ Track token balances and allowances
- ✅ Enable snapshot-based voting (historical balances)
- ✅ Support gasless approvals via EIP-2612 (Permit)
- ✅ Implement controlled burn mechanism (slashing only)
- ✅ Emit comprehensive events for indexing

## State Variables

```solidity
// ===== ERC20 Core =====
string public constant name = "TOSS Protocol Token";
string public constant symbol = "TOSS";
uint8 public constant decimals = 18;
uint256 public totalSupply = 1_000_000_000 * 10**18;  // Fixed 1B supply

mapping(address => uint256) private _balances;
mapping(address => mapping(address => uint256)) private _allowances;

// ===== Snapshot System (for governance) =====
mapping(uint256 => uint256) private _totalSupplySnapshots;
mapping(address => mapping(uint256 => uint256)) private _accountBalanceSnapshots;
uint256 private _currentSnapshotId;

// ===== Governance =====
address public governance;  // DAO governance contract address

// ===== Authorized Burners =====
mapping(address => bool) public authorizedBurners;  // Only SlashingEngine can burn

// ===== EIP-2612 Permit =====
mapping(address => uint256) public nonces;
bytes32 public DOMAIN_SEPARATOR;
```

## Functions

### Constructor

```solidity
constructor(
    address initialHolder,      // Address to receive initial supply
    address _governance        // DAO governance address
) ERC20("TOSS Protocol Token", "TOSS")
```

**Parameters**:
- `initialHolder`: Receives 1B TOSS tokens at deployment (typically treasury/vesting contract)
- `_governance`: Governance contract address for parameter changes

**Initialization**:
1. Mints entire 1B supply to `initialHolder`
2. Sets governance address
3. Initializes EIP-2612 domain separator
4. Creates initial snapshot (ID: 0)

**Post-Deployment**:
- Transfer initial supply to vesting contracts
- Grant SlashingEngine burner role
- Renounce unnecessary admin roles

### ERC20 Core Functions

#### `transfer`

```solidity
function transfer(
    address to,
    uint256 amount
) external returns (bool)
```

**Purpose**: Transfer TOSS tokens to another address

**Parameters**:
- `to`: Recipient address
- `amount`: Amount in wei (18 decimals)

**Returns**: `bool` - success status

**Behavior**:
- Validates `to != address(0)`
- Checks sender has sufficient balance
- Updates balances
- Emits `Transfer` event
- Updates snapshots for governance

**Events**: `Transfer(from, to, amount)`

#### `approve`

```solidity
function approve(
    address spender,
    uint256 amount
) external returns (bool)
```

**Purpose**: Approve spender to transfer tokens on behalf of caller

**Parameters**:
- `spender`: Address authorized to spend
- `amount`: Maximum amount spender can transfer

**Returns**: `bool` - success status

**Events**: `Approval(owner, spender, amount)`

#### `transferFrom`

```solidity
function transferFrom(
    address from,
    address to,
    uint256 amount
) external returns (bool)
```

**Purpose**: Transfer tokens from one address to another using allowance

**Parameters**:
- `from`: Source address
- `to`: Destination address
- `amount`: Amount to transfer

**Returns**: `bool` - success status

**Behavior**:
- Checks allowance sufficient
- Decreases allowance (unless infinite approval)
- Performs transfer
- Updates snapshots

### Snapshot Functions (Governance)

#### `snapshot`

```solidity
function snapshot() external onlyGovernance returns (uint256)
```

**Purpose**: Create a new balance snapshot for governance voting

**Returns**: `uint256` - snapshot ID

**Access Control**: Only DAO governance

**Behavior**:
- Increments `_currentSnapshotId`
- Stores current `totalSupply`
- Used by governance to determine voting power at specific block

**Events**: `Snapshot(snapshotId)`

#### `balanceOfAt`

```solidity
function balanceOfAt(
    address account,
    uint256 snapshotId
) external view returns (uint256)
```

**Purpose**: Get historical balance at specific snapshot

**Parameters**:
- `account`: Address to query
- `snapshotId`: Snapshot identifier

**Returns**: `uint256` - balance at that snapshot

**Use Case**: Governance voting power calculation

### EIP-2612 Permit Functions

#### `permit`

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

**Purpose**: Gasless approval via off-chain signature

**Parameters**:
- `owner`: Token holder granting approval
- `spender`: Address receiving approval
- `value`: Amount approved
- `deadline`: Signature expiration timestamp
- `v, r, s`: ECDSA signature components

**Behavior**:
- Validates signature and deadline
- Increments nonce (replay protection)
- Sets allowance
- Enables meta-transactions

**Use Case**: Users can approve contracts without spending gas

### Burn Function

#### `burn`

```solidity
function burn(
    address account,
    uint256 amount
) external onlyAuthorizedBurner
```

**Purpose**: Burn tokens (reduce total supply)

**Parameters**:
- `account`: Address to burn from
- `amount`: Amount to burn

**Returns**: None

**Access Control**: Only authorized burners (SlashingEngine)

**Behavior**:
- Reduces `account` balance
- Reduces `totalSupply`
- Updates snapshots
- Emits `Transfer` to `address(0)`

**Critical**: Cannot mint - supply only decreases

### Administrative Functions

#### `setGovernance`

```solidity
function setGovernance(address newGovernance) external onlyGovernance
```

**Purpose**: Update governance contract address

**Access Control**: Only current governance

**Events**: `GovernanceUpdated(oldGovernance, newGovernance)`

#### `setAuthorizedBurner`

```solidity
function setAuthorizedBurner(
    address burner,
    bool authorized
) external onlyGovernance
```

**Purpose**: Grant/revoke burn permission

**Access Control**: Only governance

**Events**: `BurnerAuthorized(burner, authorized)`

## DAO-Configurable Parameters

| Parameter | Initial Value | Governance Level | Change Limit |
|-----------|---------------|------------------|--------------|
| `governance` | DAO address | Protocol | Admin only |
| `authorizedBurners` | [SlashingEngine] | Protocol | Admin only |

**Note**: Token economics (supply, decimals) are immutable by design.

## Deployment

### Deployment Order

1. **First**: Deploy TOSS.sol
2. Deploy treasury/vesting contracts
3. Deploy SlashingEngine
4. Configure authorized burners
5. Transfer initial supply to distribution contracts

### Constructor Arguments

```typescript
const deployArgs = {
  initialHolder: treasuryAddress,  // or vesting contract
  governance: daoGovernanceAddress // or temporary admin (transfer later)
};

const TOSS = await ethers.deployContract("TOSS", [
  deployArgs.initialHolder,
  deployArgs.governance
]);
```

### Post-Deployment Setup

```solidity
// 1. Authorize SlashingEngine to burn
await TOSS.setAuthorizedBurner(slashingEngine.address, true);

// 2. Transfer supply to vesting contracts
await TOSS.transfer(teamVesting.address, teamAllocation);
await TOSS.transfer(investorVesting.address, investorAllocation);
// ... etc

// 3. Transfer governance to DAO
await TOSS.setGovernance(daoMultisig.address);
```

### Verification

```bash
# Verify on block explorer
npx hardhat verify --network zkSyncMainnet \
  CONTRACT_ADDRESS \
  "INITIAL_HOLDER_ADDRESS" \
  "GOVERNANCE_ADDRESS"
```

## Access Control

### Roles

| Role | Addresses | Permissions |
|------|-----------|-------------|
| **Token Holders** | Anyone | Transfer, approve, delegate |
| **Governance** | DAO | Change governance, authorize burners, snapshot |
| **Authorized Burners** | SlashingEngine | Burn tokens |

### Modifiers

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
}

modifier onlyAuthorizedBurner() {
    require(authorizedBurners[msg.sender], "Not authorized burner");
    _;
}
```

### Permission Matrix

| Function | Anyone | Governance | Burner |
|----------|---------|------------|--------|
| `transfer` | ✅ | ✅ | ✅ |
| `approve` | ✅ | ✅ | ✅ |
| `transferFrom` | ✅ | ✅ | ✅ |
| `snapshot` | ❌ | ✅ | ❌ |
| `burn` | ❌ | ❌ | ✅ |
| `setGovernance` | ❌ | ✅ | ❌ |
| `setAuthorizedBurner` | ❌ | ✅ | ❌ |

## Security Considerations

### Attack Vectors

#### 1. Unauthorized Minting

**Risk**: If minting possible, supply inflation could devalue token

**Mitigation**:
- ✅ No mint function exists
- ✅ Supply fixed at deployment
- ✅ Constructor mints once and only once
- ✅ Cannot add minting capability (no upgradeable logic)

**Severity**: N/A (impossible by design)

#### 2. Unauthorized Burning

**Risk**: Malicious burning could reduce supply unintentionally

**Mitigation**:
- ✅ Only `authorizedBurners` can burn
- ✅ Governance controls burner list
- ✅ SlashingEngine is the only expected burner
- ✅ All burns emit events (auditable)

**Severity**: Low (governance-controlled)

#### 3. Governance Capture

**Risk**: Attacker gains control of governance address

**Mitigation**:
- ✅ Governance transfer requires current governance
- ✅ Timelock delays on governance changes
- ✅ Multi-sig or DAO governance (not EOA)
- ✅ Guardian veto on critical changes

**Severity**: Medium (mitigated by timelock)

#### 4. Snapshot Manipulation

**Risk**: Flash loan to manipulate voting power

**Mitigation**:
- ✅ Snapshots taken before voting starts
- ✅ Historical balances, not current
- ✅ Cannot retroactively change past snapshots
- ✅ Flash loans cannot affect past blocks

**Severity**: Low (design prevents this)

#### 5. EIP-2612 Permit Replay

**Risk**: Reuse permit signature on different chain or after approval change

**Mitigation**:
- ✅ DOMAIN_SEPARATOR includes chainId
- ✅ Nonce increments with each permit
- ✅ Deadline enforcement
- ✅ Standard EIP-2612 implementation

**Severity**: Low (standard implementation)

### Audit Focus Areas

1. **Snapshot Mechanism**: Ensure correct historical balance tracking
2. **Burn Authorization**: Verify only SlashingEngine can burn
3. **EIP-2612 Implementation**: Check domain separator and nonce handling
4. **Supply Integrity**: Confirm no minting possible
5. **Governance Controls**: Validate governance change process

## Events

```solidity
// ERC20 Standard
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);

// Snapshot
event Snapshot(uint256 indexed snapshotId);

// Governance
event GovernanceUpdated(address indexed oldGovernance, address indexed newGovernance);
event BurnerAuthorized(address indexed burner, bool authorized);

// Burn (uses Transfer to address(0))
// Transfer(from, address(0), amount) indicates burn
```

## Integration Points

### Incoming Interactions

| Contract | Function Called | Purpose |
|----------|----------------|---------|
| FundFactory | `transferFrom` | FM stakes TOSS when creating fund |
| SlashingEngine | `burn` | Burns slashed TOSS |
| Staking | `transferFrom` | Investors stake TOSS |
| Governance | `snapshot` | Creates voting snapshots |
| Governance | `balanceOfAt` | Calculates voting power |

### Outgoing Interactions

TOSS.sol does not call external contracts (pure token logic).

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Transfer tokens | User transfers 1000 tokens to a valid recipient address | Recipient balance increases by 1000, sender balance decreases by 1000, Transfer event emitted |
| Approve spender | User approves spender to transfer 1000 tokens on their behalf | Allowance for spender increases to 1000, Approval event emitted |
| TransferFrom with allowance | Spender transfers 1000 tokens from owner to recipient using valid allowance | Tokens transferred successfully, allowance decreased by 1000 (unless infinite), recipient balance increases |
| Create snapshot | Governance creates a new snapshot when protocol needs historical balance for voting | New snapshot ID generated, current total supply and all balances captured at that moment, Snapshot event emitted |
| Query historical balance | Query balance of an address at a specific snapshot ID | Returns balance at that snapshot moment, unaffected by subsequent transfers |
| Permit gasless approval | User signs EIP-2612 permit off-chain, relayer submits permit with valid signature before deadline | Allowance set without user paying gas, nonce incremented, Approval event emitted |
| Burn tokens (authorized) | Authorized burner (SlashingEngine) burns 1000 tokens from an account | Account balance decreases by 1000, total supply decreases by 1000, Transfer event to zero address emitted |
| Set authorized burner | Governance authorizes SlashingEngine as a burner | Burner added to authorizedBurners mapping, BurnerAuthorized event emitted |
| Set governance address | Governance updates the governance contract address | New governance address set, GovernanceUpdated event emitted |
| Transfer entire balance | User transfers their entire token balance to recipient | All tokens transferred, sender balance becomes zero, recipient balance equals full amount |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Zero amount transfer | User attempts to transfer 0 tokens | Transaction succeeds (zero is valid ERC20 amount), no state change, event still emitted |
| Max uint256 allowance | User approves max uint256 (infinite approval) and spender transfers tokens | Allowance remains max uint256 after transfer, no need to re-approve |
| Transfer to self | User transfers tokens to their own address | Transaction succeeds, balance unchanged, Transfer event still emitted |
| Snapshot at deployment | Query balance at snapshot ID 0 (initial snapshot) | Returns initial balance at deployment |
| Query non-existent snapshot | Query balance at snapshot ID that doesn't exist | Transaction reverts with "Invalid snapshot" error |
| Permit at deadline boundary | User submits permit exactly at deadline timestamp | Transaction succeeds if submitted in same block, fails if deadline passed |
| Burn zero amount | Authorized burner attempts to burn 0 tokens | Transaction succeeds, no state change |
| Transfer max uint256 amount | User attempts to transfer max uint256 tokens (boundary test) | Transaction succeeds if balance sufficient, otherwise reverts with insufficient balance |
| Multiple snapshots | Governance creates multiple snapshots, query different IDs | Each snapshot correctly returns balance at that specific moment |
| Permit with zero allowance | User permits 0 allowance | Transaction succeeds, allowance set to 0, nonce incremented |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Transfer to zero address | User attempts to transfer tokens to address(0) | Transaction reverts with "ERC20: transfer to the zero address" error |
| Transfer exceeds balance | User attempts to transfer more tokens than they own | Transaction reverts with "ERC20: transfer amount exceeds balance" error |
| TransferFrom exceeds allowance | Spender attempts to transfer more than approved allowance | Transaction reverts with "ERC20: insufficient allowance" error |
| TransferFrom insufficient balance | Spender has sufficient allowance but owner has insufficient balance | Transaction reverts with "ERC20: transfer amount exceeds balance" error |
| Snapshot from non-governance | Non-governance address attempts to create snapshot | Transaction reverts with "Not governance" error |
| Burn from unauthorized address | Unauthorized address attempts to burn tokens | Transaction reverts with "Not authorized burner" error |
| Burn exceeds balance | Authorized burner attempts to burn more than account owns | Transaction reverts with "ERC20: burn amount exceeds balance" error |
| Expired permit | User submits permit with deadline that has already passed | Transaction reverts with "ERC20Permit: expired deadline" error |
| Invalid permit signature | User submits permit with invalid ECDSA signature | Transaction reverts with signature validation error |
| Set governance from non-governance | Non-governance address attempts to change governance | Transaction reverts with "Not governance" error |
| Permit wrong owner | User submits permit with signature for different owner address | Transaction reverts with signature validation error |
| Permit wrong spender | User submits permit with signature for different spender address | Transaction reverts with signature validation error |
| Permit wrong amount | User submits permit with signature for different amount | Transaction reverts with signature validation error |
| Permit wrong nonce | User submits permit with signature using wrong nonce | Transaction reverts with signature validation error |
| Set burner from non-governance | Non-governance address attempts to authorize/deauthorize burner | Transaction reverts with "Not governance" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| No mint function | Verify that contract has no mint function to prevent supply inflation | Contract interface shows no mint function exists, no way to increase supply |
| Only SlashingEngine can burn | Verify only authorized burners in mapping can burn tokens | Unauthorized addresses cannot burn, only SlashingEngine (after authorization) can burn |
| Total supply decreases on burn | After burning tokens, verify total supply is correctly reduced | Total supply decreases by burn amount, accounting remains accurate |
| Prevent permit replay attacks | User attempts to reuse same permit signature twice | First permit succeeds, second attempt reverts (nonce prevents replay) |
| Prevent cross-chain permit replay | User attempts to use permit signature on different chain | Transaction reverts (DOMAIN_SEPARATOR includes chainId, prevents cross-chain replay) |
| Snapshot immutability | After snapshot created, verify historical balances cannot change | Historical balances at snapshot remain constant even after new transfers |
| Governance transfer requires current governance | Attempt to change governance without being current governance | Transaction reverts, governance can only be changed by current governance |
| Burner list controlled by governance | Verify only governance can modify authorizedBurners mapping | Unauthorized modifications to burner list revert, governance maintains control |
| Supply cap enforcement | Verify total supply cannot exceed initial 1B tokens | All burns reduce supply, no mint function exists, supply only decreases |
| Nonce increment on permit | Verify nonce increments after each permit to prevent replay | Nonce increases by 1 after permit, prevents signature reuse |
| Domain separator includes chainId | Verify DOMAIN_SEPARATOR includes chainId to prevent cross-chain attacks | Permit signatures are chain-specific, cannot be reused on different chain |
| Snapshot prevents flash loan manipulation | Verify snapshots taken before voting prevent flash loan voting power manipulation | Voting uses historical snapshot, flash loans cannot affect past snapshots |
| Burn event emission | Verify all burns emit Transfer event for transparency | Every burn emits Transfer(from, address(0), amount) for full audit trail |
| Permit signature includes all parameters | Verify permit signature validation includes all parameters to prevent parameter substitution | Changing any parameter (owner, spender, value, deadline, nonce) invalidates signature |
| Reentrancy protection on transfers | Verify contract is protected against reentrancy attacks during transfers | Reentrancy guards prevent recursive calls, safe from external callback attacks |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Transfer from any address | Any token holder attempts to transfer their tokens | Transaction succeeds, no access control restriction |
| Approve from any address | Any token holder attempts to approve spender | Transaction succeeds, token holder controls their allowances |
| Snapshot only by governance | Various addresses attempt to create snapshot | Only governance address succeeds, all others revert |
| Burn only by authorized burners | Various addresses attempt to burn tokens | Only authorized burners succeed, all others revert |
| Set governance only by governance | Various addresses attempt to change governance | Only current governance succeeds, all others revert |
| Set burner only by governance | Various addresses attempt to authorize/deauthorize burners | Only governance succeeds, all others revert |
| Permit from any address | Any address attempts to submit permit (as relayer) | Transaction succeeds if signature valid, permit is permissionless (anyone can relay) |
| TransferFrom by approved spender | Spender attempts to transferFrom after receiving approval | Transaction succeeds if allowance sufficient |
| TransferFrom by non-approved spender | Spender attempts to transferFrom without approval | Transaction reverts with insufficient allowance |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| FundFactory stakes TOSS | FundManager approves FundFactory and creates fund requiring stake | TOSS transferred from FM to FundFactory, stake locked successfully |
| SlashingEngine burns TOSS | SlashingEngine burns slashed TOSS after slashing event | TOSS burned from FM's balance, total supply decreases, event emitted |
| Governance uses snapshot for voting | Governance creates snapshot, calculates voting power from snapshot | Voting power calculated from historical balances, prevents manipulation |
| RewardDistributor transfers rewards | RewardDistributor transfers TOSS rewards to stakers | Tokens transferred successfully, balances updated correctly |
| Multiple contracts interact | FundFactory, SlashingEngine, and Governance all interact with TOSS | All interactions succeed, state remains consistent across all contracts |
| Permit integration with FundFactory | User permits FundFactory to stake TOSS, relayer executes fund creation | Gasless approval enables seamless fund creation flow |
| Snapshot integration with voting | Multiple snapshots created for different governance proposals | Each proposal uses correct snapshot, voting power calculated accurately |
| Burn integration with slashing | Multiple slashing events trigger multiple burns | Each burn reduces supply correctly, accounting remains accurate |
| Cross-contract allowance checks | FundFactory checks allowance before pulling stake | Pull operation succeeds only if allowance sufficient |
| Event indexing integration | Off-chain indexer listens to Transfer, Approval, Snapshot events | All events captured correctly, blockchain state matches indexed state |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Standard transfer gas usage | User performs standard ERC20 transfer | Gas usage remains below 65,000 gas (typical ERC20 transfer) |
| Approve gas usage | User performs standard ERC20 approve | Gas usage remains below 50,000 gas (typical approve operation) |
| Batch transfers efficiency | User performs batch transfers via multicall | Total gas for batch transfer less than sum of individual transfers |
| Snapshot creation gas usage | Governance creates snapshot with many token holders | Gas usage scales efficiently, snapshot creation remains cost-effective |
| Permit gas savings | User uses permit instead of approve + separate transaction | Permit saves gas compared to two separate transactions |
| TransferFrom gas usage | Spender performs transferFrom with sufficient allowance | Gas usage comparable to standard transfer |
| Burn gas usage | Authorized burner performs burn operation | Gas usage remains reasonable, burn operation efficient |
| Zero balance transfer gas | User transfers 0 tokens (edge case) | Gas usage similar to non-zero transfer (state changes minimal) |
| Infinite approval efficiency | User approves max uint256 once, uses multiple times | Subsequent transfers don't require re-approval, gas saved |
| Query operations gas usage | Multiple view function calls (balanceOf, allowance, balanceOfAt) | View functions consume no gas (read-only operations) |

## Upgrade Strategy

**TOSS.sol is NOT upgradeable** - This is intentional.

**Rationale**:
- Token contract should be immutable for trust
- No proxy pattern - direct implementation
- Supply rules cannot change
- Governance changes only via explicit function

**If critical bug found**:
1. Deploy new TOSS v2 contract
2. Create migration contract (1:1 swap)
3. DAO votes on migration
4. Users opt-in to migration
5. Old contract deprecated but still functional

## Example Usage

### Staking TOSS for Fund Creation

```typescript
// FM stakes TOSS to create fund
const stakeAmount = ethers.utils.parseEther("10000");

// Approve FundFactory
await toss.connect(fm).approve(fundFactory.address, stakeAmount);

// Create fund (FundFactory pulls TOSS)
await fundFactory.connect(fm).createFund(config, stakeAmount);
```

### Using Permit for Gasless Approval

```typescript
// Generate permit signature off-chain
const deadline = Math.floor(Date.now() / 1000) + 3600;  // 1 hour
const { v, r, s } = await signERC2612Permit(
  wallet,
  toss.address,
  wallet.address,
  fundFactory.address,
  stakeAmount.toString(),
  deadline
);

// User signs permit (free)
// Relayer submits permit + createFund in one transaction (gasless for user)
await fundFactory.createFundWithPermit(
  config,
  stakeAmount,
  deadline,
  v, r, s
);
```

### Governance Voting with Snapshot

```typescript
// 1. DAO creates proposal
await governance.createProposal(...);

// 2. DAO takes snapshot
const snapshotId = await toss.snapshot();

// 3. Voting power calculated from snapshot
const votingPower = await toss.balanceOfAt(voter.address, snapshotId);

// 4. Vote cast (in governance contract)
await governance.castVote(proposalId, support, votingPower);
```

## Related Contracts

- **[SlashingEngine](/docs/protocol/contracts/risk/SlashingEngine)**: Only authorized burner
- **[FundFactory](/docs/protocol/contracts/fund/FundFactory)**: Requires TOSS staking
- **[ProtocolGovernance](/docs/protocol/contracts/governance/ProtocolGovernance)**: Uses snapshots for voting
- **[InvestorRegistry](/docs/protocol/contracts/investor/InvestorRegistry)**: Tracks TOSS staking for classes

## References

- **ERC20 Standard**: [EIP-20](https://eips.ethereum.org/EIPS/eip-20)
- **EIP-2612 Permit**: [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612)
- **Snapshot Pattern**: OpenZeppelin ERC20Snapshot
- **zkSync Considerations**: [zkSync ERC20](https://era.zksync.io/docs/dev/building-on-zksync/contracts/differences-with-ethereum.html)

---

**Next Contract**: [TOSSTreasury](/docs/protocol/contracts/core/TOSSTreasury)

**Back**: [Smart Contracts Overview](/docs/protocol/contracts/overview)
