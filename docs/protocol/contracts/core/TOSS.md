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

```typescript
describe("TOSS Token - Happy Path", () => {
  it("should transfer tokens correctly", async () => {
    await toss.transfer(recipient.address, 1000);
    expect(await toss.balanceOf(recipient.address)).to.equal(1000);
  });
  
  it("should approve and transferFrom correctly", async () => {
    await toss.approve(spender.address, 1000);
    await toss.connect(spender).transferFrom(owner.address, recipient.address, 1000);
    expect(await toss.balanceOf(recipient.address)).to.equal(1000);
  });
  
  it("should create snapshots correctly", async () => {
    await toss.transfer(account1.address, 1000);
    const snapshotId = await toss.connect(governance).snapshot();
    await toss.transfer(account2.address, 500);
    
    expect(await toss.balanceOfAt(account1.address, snapshotId)).to.equal(1000);
    expect(await toss.balanceOfAt(account2.address, snapshotId)).to.equal(0);
  });
  
  it("should permit gasless approval", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const { v, r, s } = await signPermit(owner, spender.address, 1000, deadline);
    
    await toss.permit(owner.address, spender.address, 1000, deadline, v, r, s);
    expect(await toss.allowance(owner.address, spender.address)).to.equal(1000);
  });
});
```

### Edge Cases

```typescript
describe("TOSS Token - Edge Cases", () => {
  it("should handle zero transfers", async () => {
    await expect(toss.transfer(recipient.address, 0)).to.not.be.reverted;
  });
  
  it("should handle max uint256 allowance (infinite approval)", async () => {
    const maxUint = ethers.constants.MaxUint256;
    await toss.approve(spender.address, maxUint);
    await toss.connect(spender).transferFrom(owner.address, recipient.address, 1000);
    
    // Allowance should remain MaxUint256
    expect(await toss.allowance(owner.address, spender.address)).to.equal(maxUint);
  });
  
  it("should handle snapshot queries for non-existent IDs", async () => {
    await expect(toss.balanceOfAt(account.address, 999)).to.be.revertedWith("Invalid snapshot");
  });
});
```

### Failure Cases

```typescript
describe("TOSS Token - Failure Cases", () => {
  it("should reject transfer to zero address", async () => {
    await expect(
      toss.transfer(ethers.constants.AddressZero, 1000)
    ).to.be.revertedWith("ERC20: transfer to the zero address");
  });
  
  it("should reject transfer exceeding balance", async () => {
    const balance = await toss.balanceOf(owner.address);
    await expect(
      toss.transfer(recipient.address, balance.add(1))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
  
  it("should reject transferFrom exceeding allowance", async () => {
    await toss.approve(spender.address, 1000);
    await expect(
      toss.connect(spender).transferFrom(owner.address, recipient.address, 1001)
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });
  
  it("should reject snapshot from non-governance", async () => {
    await expect(
      toss.connect(attacker).snapshot()
    ).to.be.revertedWith("Not governance");
  });
  
  it("should reject burn from unauthorized address", async () => {
    await expect(
      toss.connect(attacker).burn(victim.address, 1000)
    ).to.be.revertedWith("Not authorized burner");
  });
  
  it("should reject expired permit", async () => {
    const deadline = Math.floor(Date.now() / 1000) - 3600;  // 1 hour ago
    const { v, r, s } = await signPermit(owner, spender.address, 1000, deadline);
    
    await expect(
      toss.permit(owner.address, spender.address, 1000, deadline, v, r, s)
    ).to.be.revertedWith("ERC20Permit: expired deadline");
  });
});
```

### Security Tests

```typescript
describe("TOSS Token - Security", () => {
  it("should prevent unauthorized minting", async () => {
    // Verify no mint function exists
    expect(toss.mint).to.be.undefined;
  });
  
  it("should only allow SlashingEngine to burn", async () => {
    // Authorize SlashingEngine
    await toss.connect(governance).setAuthorizedBurner(slashingEngine.address, true);
    
    // SlashingEngine can burn
    await toss.connect(slashingEngine).burn(fmAddress, 1000);
    
    // Others cannot
    await expect(
      toss.connect(attacker).burn(victim.address, 1000)
    ).to.be.reverted;
  });
  
  it("should track total supply correctly after burns", async () => {
    const initialSupply = await toss.totalSupply();
    const burnAmount = 1000;
    
    await toss.connect(slashingEngine).burn(account.address, burnAmount);
    
    const finalSupply = await toss.totalSupply();
    expect(finalSupply).to.equal(initialSupply.sub(burnAmount));
  });
  
  it("should prevent replay attacks on permit", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const { v, r, s } = await signPermit(owner, spender.address, 1000, deadline);
    
    // First permit succeeds
    await toss.permit(owner.address, spender.address, 1000, deadline, v, r, s);
    
    // Second permit with same signature fails (nonce incremented)
    await expect(
      toss.permit(owner.address, spender.address, 1000, deadline, v, r, s)
    ).to.be.reverted;
  });
});
```

### Gas Optimization Tests

```typescript
describe("TOSS Token - Gas Optimization", () => {
  it("should use reasonable gas for transfer", async () => {
    const tx = await toss.transfer(recipient.address, 1000);
    const receipt = await tx.wait();
    expect(receipt.gasUsed).to.be.lt(65000);  // Typical ERC20 transfer
  });
  
  it("should use reasonable gas for approve", async () => {
    const tx = await toss.approve(spender.address, 1000);
    const receipt = await tx.wait();
    expect(receipt.gasUsed).to.be.lt(50000);
  });
  
  it("should batch transfers efficiently", async () => {
    // Single transaction with multiple transfers via multicall
    const tx = await toss.multicall([
      toss.interface.encodeFunctionData("transfer", [addr1, 100]),
      toss.interface.encodeFunctionData("transfer", [addr2, 200]),
      toss.interface.encodeFunctionData("transfer", [addr3, 300]),
    ]);
    const receipt = await tx.wait();
    
    // Should be cheaper than 3 separate transactions
    expect(receipt.gasUsed).to.be.lt(180000);
  });
});
```

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
