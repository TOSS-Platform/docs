# TOSSTreasury.sol

## Overview

The protocol treasury contract manages protocol-owned assets, collects fees, and funds protocol operations through DAO-controlled allocation.

## Purpose

TOSSTreasury serves as the financial hub of the TOSS Protocol:
- Collects protocol fees from all funds
- Manages protocol-owned reserves
- Funds development, audits, grants
- Provides emergency liquidity
- Controlled entirely by DAO governance

## Core Responsibilities

- ✅ Receive and store protocol fees (TOSS, USDC, other tokens)
- ✅ Execute DAO-approved fund transfers
- ✅ Track income and expenses
- ✅ Provide reserve ratios and health metrics
- ✅ Emergency fund management

## State Variables

```solidity
// ===== Governance =====
address public governance;          // DAO governance address
address public guardian;            // Emergency guardian

// ===== Asset Tracking =====
mapping(address => uint256) public reserves;  // token => amount
address[] public supportedAssets;             // List of held assets

// ===== Allocation Tracking =====
struct Allocation {
    address recipient;
    uint256 amount;
    address asset;
    uint256 timestamp;
    string purpose;
    bool executed;
}
mapping(uint256 => Allocation) public allocations;
uint256 public allocationCount;

// ===== Limits =====
uint256 public dailySpendLimit;     // Max daily spending
uint256 public emergencyReserve;    // Min reserve to maintain
mapping(uint256 => uint256) public dailySpent;  // day => amount spent

// ===== Fee Collection =====
mapping(address => uint256) public collectedFees;  // Lifetime fees per asset
uint256 public totalFeesCollectedUSD;              // Total in USD equivalent
```

## Functions

### Constructor

```solidity
constructor(
    address _governance,
    address _guardian,
    uint256 _dailySpendLimit,
    uint256 _emergencyReserve
)
```

**Parameters**:
- `_governance`: DAO governance contract
- `_guardian`: Emergency guardian address
- `_dailySpendLimit`: Maximum daily spending (in USD equivalent)
- `_emergencyReserve`: Minimum reserve to maintain

### Fee Collection Functions

#### `collectProtocolFee`

```solidity
function collectProtocolFee(
    address asset,
    uint256 amount
) external onlyFundVault
```

**Purpose**: Receive protocol fees from fund operations

**Parameters**:
- `asset`: Token address (USDC, TOSS, etc.)
- `amount`: Fee amount

**Access Control**: Only registered FundManagerVaults

**Behavior**:
- Transfers tokens from vault to treasury
- Updates `reserves[asset]`
- Updates `collectedFees[asset]`
- Emits `FeeCollected` event

**Events**: `FeeCollected(asset, amount, fundId, timestamp)`

#### `receiveFunds`

```solidity
function receiveFunds(
    address asset,
    uint256 amount,
    string calldata source
) external
```

**Purpose**: Receive funds from external sources (donations, partnerships)

**Parameters**:
- `asset`: Token address
- `amount`: Amount received
- `source`: Description of fund source

**Events**: `FundsReceived(asset, amount, sender, source)`

### Fund Allocation Functions

#### `proposeAllocation`

```solidity
function proposeAllocation(
    address recipient,
    uint256 amount,
    address asset,
    string calldata purpose
) external onlyGovernance returns (uint256 allocationId)
```

**Purpose**: DAO proposes fund allocation

**Parameters**:
- `recipient`: Address to receive funds
- `amount`: Amount to allocate
- `asset`: Token to send
- `purpose`: Description (dev, audit, grant, etc.)

**Returns**: `allocationId` - unique allocation identifier

**Access Control**: Only governance

**Behavior**:
- Creates pending allocation
- Checks daily spend limit
- Checks emergency reserve not violated
- Requires separate execution call

**Events**: `AllocationProposed(allocationId, recipient, amount, asset, purpose)`

#### `executeAllocation`

```solidity
function executeAllocation(
    uint256 allocationId
) external onlyGovernance
```

**Purpose**: Execute approved allocation after timelock

**Parameters**:
- `allocationId`: Allocation to execute

**Access Control**: Only governance (after timelock)

**Behavior**:
- Validates allocation exists and not executed
- Checks daily limit not exceeded
- Transfers tokens to recipient
- Updates tracking

**Events**: `AllocationExecuted(allocationId, recipient, amount, asset)`

#### `batchAllocate`

```solidity
function batchAllocate(
    address[] calldata recipients,
    uint256[] calldata amounts,
    address asset,
    string calldata purpose
) external onlyGovernance
```

**Purpose**: Execute multiple allocations at once (e.g., salary payments)

**Parameters**:
- `recipients`: Array of recipient addresses
- `amounts`: Corresponding amounts
- `asset`: Token to distribute
- `purpose`: Batch description

**Access Control**: Only governance

**Use Case**: Monthly team payments, multiple grants

### Emergency Functions

#### `emergencyWithdraw`

```solidity
function emergencyWithdraw(
    address asset,
    uint256 amount,
    address destination
) external onlyGuardian
```

**Purpose**: Emergency withdrawal if treasury compromised

**Parameters**:
- `asset`: Token to withdraw
- `amount`: Amount to withdraw
- `destination`: Safe destination address

**Access Control**: Only guardian (3-of-5 multisig)

**Conditions**:
- Only usable if protocol paused
- Limited to emergency reserve amount
- Requires guardian consensus

**Events**: `EmergencyWithdrawal(asset, amount, destination, guardian)`

### Query Functions

#### `getReserveRatio`

```solidity
function getReserveRatio() external view returns (uint256)
```

**Purpose**: Calculate reserve health ratio

**Returns**: `uint256` - ratio as percentage (100 = 100%)

**Calculation**:
```
ratio = (currentReserves / targetReserves) × 100
```

#### `getAssetBalance`

```solidity
function getAssetBalance(address asset) external view returns (uint256)
```

**Purpose**: Query balance of specific asset

**Returns**: Current balance of asset in treasury

#### `getTotalValueUSD`

```solidity
function getTotalValueUSD() external view returns (uint256)
```

**Purpose**: Get total treasury value in USD

**Returns**: USD value of all assets using oracle prices

### Administrative Functions

#### `setDailySpendLimit`

```solidity
function setDailySpendLimit(uint256 newLimit) external onlyGovernance
```

**Purpose**: Update daily spending limit

**Access Control**: Only governance

**Events**: `DailySpendLimitUpdated(oldLimit, newLimit)`

#### `setEmergencyReserve`

```solidity
function setEmergencyReserve(uint256 newReserve) external onlyGovernance
```

**Purpose**: Update minimum emergency reserve

**Access Control**: Only governance

## DAO-Configurable Parameters

| Parameter | Initial Value | Governance Level | Update Frequency |
|-----------|---------------|------------------|------------------|
| `dailySpendLimit` | $100,000 | Protocol | Monthly |
| `emergencyReserve` | $500,000 | Protocol | Quarterly |
| `governance` | DAO address | Protocol | As needed |
| `guardian` | Multisig | Protocol | Annually |

## Deployment

### Dependencies

Must deploy after:
- TOSS.sol
- DAO Governance contracts

### Constructor Arguments

```typescript
const args = {
  governance: daoGovernance.address,
  guardian: guardianMultisig.address,
  dailySpendLimit: ethers.utils.parseUnits("100000", 6), // $100k USDC
  emergencyReserve: ethers.utils.parseUnits("500000", 6), // $500k USDC
};
```

### Post-Deployment

```solidity
// 1. Grant treasury access to fund vaults
await fundRegistry.authorizeTreasury(treasury.address);

// 2. Seed initial reserves (optional)
await usdc.transfer(treasury.address, initialReserve);

// 3. Verify access controls
assert(await treasury.governance() == daoGovernance.address);
```

## Access Control

### Roles

| Role | Address | Permissions |
|------|---------|-------------|
| **Governance** | DAO | Propose/execute allocations, change parameters |
| **Guardian** | Multisig | Emergency withdrawal (paused state only) |
| **Fund Vaults** | Registered vaults | Deposit protocol fees |

### Modifiers

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
}

modifier onlyGuardian() {
    require(msg.sender == guardian, "Not guardian");
    _;
}

modifier onlyFundVault() {
    require(fundRegistry.isRegisteredVault(msg.sender), "Not registered vault");
    _;
}
```

## Security Considerations

### Attack Vectors

**1. Unauthorized Withdrawal**
- **Risk**: Attacker drains treasury
- **Mitigation**: All withdrawals via DAO with timelock
- **Severity**: Critical → Mitigated

**2. Daily Limit Bypass**
- **Risk**: Drain via multiple transactions
- **Mitigation**: Daily tracking, resets at midnight UTC
- **Severity**: Medium → Mitigated

**3. Emergency Reserve Violation**
- **Risk**: Treasury depleted, cannot handle emergencies
- **Mitigation**: Enforced minimum reserve, allocation rejections
- **Severity**: Medium → Mitigated

**4. Guardian Abuse**
- **Risk**: Guardian withdraws inappropriately
- **Mitigation**: Only during pause, limited to emergency reserve, 3-of-5 consensus
- **Severity**: Low → Mitigated

### Audit Focus Areas

1. **Access Controls**: Verify only governance can allocate
2. **Daily Limits**: Check limit tracking and reset logic
3. **Emergency Reserve**: Ensure minimum maintained
4. **Asset Tracking**: Verify accurate balance tracking
5. **Batch Operations**: Check for reentrancy in batch allocations

## Events

```solidity
event FeeCollected(
    address indexed asset,
    uint256 amount,
    uint256 indexed fundId,
    uint256 timestamp
);

event AllocationProposed(
    uint256 indexed allocationId,
    address indexed recipient,
    uint256 amount,
    address asset,
    string purpose
);

event AllocationExecuted(
    uint256 indexed allocationId,
    address indexed recipient,
    uint256 amount,
    address asset
);

event EmergencyWithdrawal(
    address indexed asset,
    uint256 amount,
    address indexed destination,
    address guardian
);

event DailySpendLimitUpdated(uint256 oldLimit, uint256 newLimit);
event EmergencyReserveUpdated(uint256 oldReserve, uint256 newReserve);
event FundsReceived(address indexed asset, uint256 amount, address indexed sender, string source);
```

## Integration Points

**Incoming**:
- FundManagerVault → `collectProtocolFee()`
- Governance → `proposeAllocation()`, `executeAllocation()`
- Guardian → `emergencyWithdraw()` (emergency only)
- External → `receiveFunds()` (donations)

**Outgoing**:
- None (treasury doesn't call other contracts)

## Test Scenarios

```typescript
describe("TOSSTreasury", () => {
  describe("Fee Collection", () => {
    it("should collect fees from fund vaults", async () => {
      const feeAmount = ethers.utils.parseUnits("100", 6);
      await usdc.mint(vault.address, feeAmount);
      await usdc.connect(vault).approve(treasury.address, feeAmount);
      
      await treasury.connect(vault).collectProtocolFee(usdc.address, feeAmount);
      
      expect(await usdc.balanceOf(treasury.address)).to.equal(feeAmount);
      expect(await treasury.collectedFees(usdc.address)).to.equal(feeAmount);
    });
    
    it("should reject fee collection from unauthorized source", async () => {
      await expect(
        treasury.connect(attacker).collectProtocolFee(usdc.address, 1000)
      ).to.be.revertedWith("Not registered vault");
    });
  });
  
  describe("Allocation", () => {
    it("should propose and execute allocation", async () => {
      const allocationId = await treasury.connect(governance).proposeAllocation(
        developer.address,
        ethers.utils.parseUnits("10000", 6),
        usdc.address,
        "Developer grant"
      );
      
      // Wait for timelock
      await time.increase(48 * 3600);
      
      await treasury.connect(governance).executeAllocation(allocationId);
      
      expect(await usdc.balanceOf(developer.address)).to.equal(
        ethers.utils.parseUnits("10000", 6)
      );
    });
    
    it("should enforce daily spend limit", async () => {
      const limit = await treasury.dailySpendLimit();
      
      // Spend up to limit
      await treasury.connect(governance).proposeAllocation(...);
      await treasury.connect(governance).executeAllocation(0);
      
      // Second allocation exceeding limit should fail
      await expect(
        treasury.connect(governance).proposeAllocation(...)
      ).to.be.revertedWith("Daily limit exceeded");
    });
    
    it("should maintain emergency reserve", async () => {
      const currentReserves = await usdc.balanceOf(treasury.address);
      const emergencyReserve = await treasury.emergencyReserve();
      const maxAllocation = currentReserves.sub(emergencyReserve);
      
      await expect(
        treasury.connect(governance).proposeAllocation(
          recipient.address,
          maxAllocation.add(1),
          usdc.address,
          "Test"
        )
      ).to.be.revertedWith("Would violate emergency reserve");
    });
  });
  
  describe("Emergency", () => {
    it("should allow guardian emergency withdrawal when paused", async () => {
      await protocol.pause();  // Protocol must be paused
      
      await treasury.connect(guardian).emergencyWithdraw(
        usdc.address,
        ethers.utils.parseUnits("100000", 6),
        safeAddress.address
      );
      
      expect(await usdc.balanceOf(safeAddress.address)).to.be.gt(0);
    });
    
    it("should reject emergency withdrawal when not paused", async () => {
      await expect(
        treasury.connect(guardian).emergencyWithdraw(...)
      ).to.be.revertedWith("Protocol not paused");
    });
  });
});
```

## Upgrade Strategy

**Upgradeable via Transparent Proxy**

```
TransparentUpgradeableProxy
├── Implementation: TOSSTreasury
├── Admin: ProxyAdmin (DAO-controlled)
└── Upgrade Process: DAO proposal → Timelock → Execute
```

**Upgrade Considerations**:
- Storage layout must be preserved
- New variables append only
- Test upgrade on testnet first

## Example Usage

```typescript
// Collect fee from fund vault
await usdc.approve(treasury.address, feeAmount);
await treasury.collectProtocolFee(usdc.address, feeAmount);

// DAO allocates funds for development
const allocationId = await treasury.connect(dao).proposeAllocation(
  devTeam.address,
  ethers.utils.parseUnits("50000", 6),
  usdc.address,
  "Q1 2025 Development Budget"
);

// After 48h timelock
await treasury.connect(dao).executeAllocation(allocationId);
```

---

**Next**: [RewardDistributor](/docs/protocol/contracts/core/RewardDistributor)
