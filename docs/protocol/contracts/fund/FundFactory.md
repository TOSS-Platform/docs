# FundFactory.sol

## Overview

FundFactory deploys new fund contracts using minimal proxy pattern, validates FM eligibility, enforces staking requirements, and registers funds in the protocol.

## Purpose

- Deploy fund contracts efficiently (minimal proxies)
- Validate Fund Manager eligibility
- Enforce TOSS staking requirements
- Assign FundClass and RiskTier
- Register funds in FundRegistry
- Emit fund creation events

## Core Responsibilities

- ✅ Validate FM meets requirements (stake, score, compliance)
- ✅ Deploy fund contracts via Clones (EIP-1167)
- ✅ Lock FM stake in escrow
- ✅ Initialize fund with proper configuration
- ✅ Register fund in FundRegistry
- ✅ Assign unique fund ID

## State Variables

```solidity
// ===== Core Dependencies =====
ITOSS public immutable tossToken;
IFundRegistry public immutable fundRegistry;
IRiskEngine public immutable riskEngine;
IFMRegistry public immutable fmRegistry;

// ===== Fund Implementation =====
address public fundImplementation;     // Master copy for clones

// ===== FM Stakes =====
struct FMStake {
    uint256 amount;
    uint256 lockedAt;
    bool active;
}
mapping(address => mapping(uint256 => FMStake)) public fmStakes;  // fm => fundId => stake

// ===== Configuration =====
uint256 public minimumFMStake;         // Base minimum stake
uint256 public stakePerAUMRatio;       // Additional stake per $ AUM (basis points)

// ===== Statistics =====
uint256 public totalFundsCreated;
mapping(address => uint256) public fundsCreatedByFM;
```

## Functions

### Constructor

```solidity
constructor(
    address _tossToken,
    address _fundRegistry,
    address _riskEngine,
    address _fmRegistry,
    address _fundImplementation
)
```

**Parameters**:
- `_tossToken`: TOSS token contract
- `_fundRegistry`: Fund registry for indexing
- `_riskEngine`: RiskEngine for validation
- `_fmRegistry`: FM registry for eligibility
- `_fundImplementation`: Master fund contract (for cloning)

### Main Functions

#### `createFund`

```solidity
function createFund(
    FundConfig memory config,
    uint256 stakeAmount
) external returns (address fundAddress, uint256 fundId)
```

**Purpose**: Create new fund with FM staking

**Parameters**:
- `config`: Fund configuration (fees, risk params, class, tier)
- `stakeAmount`: TOSS to stake as collateral

**Returns**:
- `fundAddress`: Deployed fund contract address
- `fundId`: Unique fund identifier

**Access Control**: Any address (eligibility checked)

**Behavior**:
1. **Validate FM Eligibility**:
   ```solidity
   require(fmRegistry.isEligible(msg.sender), "FM not eligible");
   require(fmRegistry.getScore(msg.sender) >= MIN_FM_SCORE, "Score too low");
   require(!slashingEngine.isBanned(msg.sender), "FM banned");
   ```

2. **Validate Stake Amount**:
   ```solidity
   uint256 requiredStake = minimumFMStake + (config.initialAUM * stakePerAUMRatio / 10000);
   require(stakeAmount >= requiredStake, "Insufficient stake");
   ```

3. **Transfer and Lock Stake**:
   ```solidity
   require(tossToken.transferFrom(msg.sender, address(this), stakeAmount));
   fmStakes[msg.sender][nextFundId] = FMStake({
       amount: stakeAmount,
       lockedAt: block.timestamp,
       active: true
   });
   ```

4. **Deploy Fund Contract**:
   ```solidity
   fundAddress = Clones.clone(fundImplementation);
   IFund(fundAddress).initialize(msg.sender, config);
   ```

5. **Register Fund**:
   ```solidity
   fundId = fundRegistry.registerFund(
       fundAddress,
       msg.sender,
       config.fundClass,
       config.riskTier
   );
   ```

6. **Emit Event**:
   ```solidity
   emit FundCreated(fundId, fundAddress, msg.sender, stakeAmount);
   ```

**Events**: `FundCreated(fundId, fundAddress, manager, stakeAmount)`

#### `closeFund`

```solidity
function closeFund(uint256 fundId) external
```

**Purpose**: Close fund and return stake (minus slashing)

**Parameters**:
- `fundId`: Fund to close

**Access Control**: Only FM of that fund

**Behavior**:
- Validates fund can be closed (no investors, all positions liquidated)
- Calculates remaining stake after slashing
- Transfers stake back to FM
- Marks fund as closed in registry

**Events**: `FundClosed(fundId, manager, returnedStake)`

#### `increaseStake`

```solidity
function increaseStake(
    uint256 fundId,
    uint256 additionalStake
) external
```

**Purpose**: Add more stake to existing fund (for AUM growth)

**Parameters**:
- `fundId`: Fund ID
- `additionalStake`: Additional TOSS to stake

**Access Control**: Only FM of that fund

**Use Case**: Fund AUM grows, needs more collateral

**Events**: `StakeIncreased(fundId, additionalAmount, newTotal)`

### View Functions

#### `getRequiredStake`

```solidity
function getRequiredStake(
    uint256 projectedAUM
) external view returns (uint256)
```

**Purpose**: Calculate required stake for given AUM

**Parameters**:
- `projectedAUM`: Projected Assets Under Management (USD)

**Returns**: Required TOSS stake amount

**Formula**:
```
requiredStake = minimumFMStake + (projectedAUM × stakePerAUMRatio / 10000)
```

#### `getFMStake`

```solidity
function getFMStake(
    address fm,
    uint256 fundId
) external view returns (FMStake memory)
```

**Purpose**: Query FM's stake for specific fund

**Returns**: Stake struct (amount, lockedAt, active)

#### `canCreateFund`

```solidity
function canCreateFund(address fm) external view returns (bool, string memory)
```

**Purpose**: Check if address can create fund

**Returns**:
- `bool`: Eligibility status
- `string`: Reason if not eligible

**Checks**:
- FM registered and active
- FM score ≥ minimum
- No active bans
- No excessive slashing history

## DAO-Configurable Parameters

| Parameter | Initial Value | Governance Level | Change Limit |
|-----------|---------------|------------------|--------------|
| `minimumFMStake` | 10,000 TOSS | FM-Level | 20% per proposal |
| `stakePerAUMRatio` | 10 bps (0.1%) | FM-Level | 50% per proposal |
| `fundImplementation` | [address] | Protocol | Only via upgrade |

## Deployment

### Deploy Order

```
1. Deploy TOSS token
2. Deploy FundRegistry
3. Deploy RiskEngine
4. Deploy FMRegistry
5. Deploy Fund Implementation (master copy)
6. Deploy FundFactory
7. Configure FundFactory
```

### Constructor Arguments

```typescript
const args = {
  tossToken: toss.address,
  fundRegistry: registry.address,
  riskEngine: riskEngine.address,
  fmRegistry: fmRegistry.address,
  fundImplementation: fundImpl.address
};

const factory = await ethers.deployContract("FundFactory", Object.values(args));
```

### Post-Deployment

```solidity
// 1. Set FundFactory in FundRegistry
await fundRegistry.setFundFactory(factory.address);

// 2. Configure parameters
await factory.setMinimumFMStake(ethers.utils.parseEther("10000"));
await factory.setStakePerAUMRatio(10);  // 0.1%

// 3. Transfer ownership to DAO
await factory.transferOwnership(governance.address);
```

## Access Control

### Roles

| Role | Addresses | Permissions |
|------|-----------|-------------|
| **Anyone** | Public | `createFund()` (if eligible) |
| **Fund Managers** | Verified FMs | `closeFund()`, `increaseStake()` for their funds |
| **Governance** | DAO | Change parameters, upgrade implementation |

### Modifiers

```solidity
modifier onlyFMOfFund(uint256 fundId) {
    require(fundRegistry.getFundManager(fundId) == msg.sender, "Not FM");
    _;
}

modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
}
```

## Security Considerations

### Attack Vectors

**1. Unauthorized Fund Creation**
- **Risk**: Unqualified FM creates fund
- **Mitigation**: Multi-check eligibility (score, stake, no ban)
- **Severity**: Medium → Mitigated

**2. Insufficient Stake**
- **Risk**: FM stakes too little for fund size
- **Mitigation**: Formula-based minimum, enforced on-chain
- **Severity**: High → Mitigated

**3. Clone Implementation Exploit**
- **Risk**: Malicious master contract
- **Mitigation**: Audited implementation, immutable once set, governance-only updates
- **Severity**: Critical → Mitigated

**4. Stake Lock Bypass**
- **Risk**: FM withdraws stake while fund active
- **Mitigation**: Stake locked until fund closed, SlashingEngine can reduce
- **Severity**: High → Mitigated

### Audit Focus Areas

1. **Clone Safety**: Verify EIP-1167 implementation correct
2. **Stake Locking**: Ensure stake cannot be withdrawn prematurely
3. **Eligibility Checks**: Verify all validation logic
4. **Reentrancy**: Check createFund for reentrancy risks
5. **Integer Overflow**: Validate stake calculations

## Events

```solidity
event FundCreated(
    uint256 indexed fundId,
    address indexed fundAddress,
    address indexed manager,
    uint256 stakeAmount,
    FundClass fundClass,
    RiskTier riskTier
);

event FundClosed(
    uint256 indexed fundId,
    address indexed manager,
    uint256 returnedStake,
    uint256 slashedAmount
);

event StakeIncreased(
    uint256 indexed fundId,
    address indexed manager,
    uint256 additionalAmount,
    uint256 newTotal
);

event FundImplementationUpdated(
    address indexed oldImplementation,
    address indexed newImplementation
);

event MinimumStakeUpdated(uint256 oldValue, uint256 newValue);
```

## Integration Points

**Incoming**:
- Fund Managers → `createFund()`, `closeFund()`, `increaseStake()`
- Governance → Parameter updates
- SlashingEngine → Reads stake amounts for slashing

**Outgoing**:
- TOSS Token → `transferFrom()` (pull stake)
- FundRegistry → `registerFund()`, `closeFund()`
- FMRegistry → `isEligible()`, `getScore()`
- RiskEngine → Validates initial configuration
- Clones Library → `clone()` (deploy fund)

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create fund with valid parameters | Eligible FM creates fund with valid config and sufficient stake | Fund deployed as minimal proxy, registered in FundRegistry, stake locked, FundCreated event emitted |
| Deploy fund as minimal proxy | FM creates fund, verify deployed contract is minimal proxy | Fund address contains minimal proxy code, points to implementation, gas-efficient deployment |
| Register fund in registry | Fund created, verify registered correctly | Fund ID assigned, fund address registered, manager linked to fund ID |
| Calculate required stake | Query required stake for projected AUM | Returns correct stake amount: minimumFMStake + (AUM × stakePerAUMRatio / 10000) |
| Query FM stake | Query FM's stake for specific fund | Returns FMStake struct with amount, lockedAt timestamp, and active status |
| Check FM eligibility | Query if FM can create fund | Returns bool and reason string indicating eligibility status |
| Increase stake | FM adds more stake to existing fund for AUM growth | Additional stake locked, total stake updated, StakeIncreased event emitted |
| Close fund | FM closes fund, all investors withdrawn, positions liquidated | Stake returned (minus slashing), fund marked as closed, FundClosed event emitted |
| FM creates multiple funds | Same FM creates multiple funds with different configs | Each fund gets unique ID, all tracked correctly, FM can manage multiple funds |
| Query funds created by FM | Query count of funds created by specific FM | Returns correct count, tracks all funds created by FM |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create fund with minimum stake | FM creates fund with exactly required minimum stake | Transaction succeeds, stake locked at minimum threshold |
| Create fund with maximum allowed stake | FM creates fund with very large stake amount | Transaction succeeds, large stake locked successfully |
| Calculate stake for zero AUM | Query required stake for $0 AUM | Returns minimumFMStake (base stake only) |
| Calculate stake for very large AUM | Query required stake for $100M AUM | Returns minimumFMStake + (100M × stakePerAUMRatio / 10000) |
| FM creates fund after previous fund closed | FM closes fund, then creates new fund | New fund created successfully, previous fund state doesn't affect new creation |
| Increase stake to exact requirement | FM increases stake to exactly match new AUM requirement | Transaction succeeds, stake updated correctly |
| Close fund with no slashing history | FM closes fund with perfect record, no slashing occurred | Full stake returned, no deductions |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create fund from ineligible FM | Unregistered or low-score FM attempts to create fund | Transaction reverts with "FM not eligible" error |
| Create fund with insufficient stake | FM attempts to create fund with stake below requirement | Transaction reverts with "Insufficient stake" error |
| Create fund when FM is banned | Banned FM attempts to create fund | Transaction reverts with "FM banned" error |
| Create fund with invalid config | FM attempts to create fund with invalid fee rates or risk parameters | Transaction reverts with validation error (e.g., "Fee exceeds maximum") |
| Create fund without TOSS approval | FM attempts to create fund without approving Factory to spend TOSS | Transaction reverts with "ERC20: insufficient allowance" error |
| Create fund with insufficient TOSS balance | FM attempts to create fund but doesn't have enough TOSS | Transaction reverts with "ERC20: transfer amount exceeds balance" error |
| Close fund from non-FM | Non-FM address attempts to close fund | Transaction reverts with "Not FM" error |
| Close fund with active investors | FM attempts to close fund while investors still have deposits | Transaction reverts with "Fund has active investors" error |
| Close fund with open positions | FM attempts to close fund with unfinalized trades | Transaction reverts with "Fund has open positions" error |
| Increase stake from non-FM | Non-FM attempts to increase stake | Transaction reverts with "Not FM" error |
| Increase stake for non-existent fund | FM attempts to increase stake for fund they don't manage | Transaction reverts with "Fund not found" or "Not FM" error |
| Query stake for non-existent fund | Query stake for fund that doesn't exist | Returns default FMStake struct or reverts |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent reentrancy during fund creation | Malicious contract attempts reentrancy during createFund | Reentrancy guard prevents recursive calls, transaction reverts |
| Stake lock enforcement | FM attempts to withdraw stake while fund is active | Transaction reverts with "Fund still active" or "Stake locked" error |
| Only SlashingEngine can slash stake | Attacker attempts to slash FM stake | Transaction reverts with "Only SlashingEngine" error, only SlashingEngine can reduce stake |
| SlashingEngine slashing works | SlashingEngine slashes FM stake after slashing event | Stake reduced correctly, slashed amount tracked, FM cannot prevent slashing |
| Fund implementation safety | Verify fund implementation cannot be changed maliciously | Implementation address immutable or changeable only by governance |
| Stake calculation accuracy | Verify stake calculation cannot be manipulated | Formula enforced on-chain, calculations deterministic |
| Multiple fund isolation | FM creates multiple funds, verify stake isolation | Each fund's stake tracked separately, no cross-fund stake access |
| Factory authorization | Verify only Factory can register funds in registry | FundRegistry rejects registrations from non-Factory addresses |
| FM score validation | Verify FM score checked before fund creation | Score queried from FMRegistry, minimum score enforced |
| Ban status validation | Verify banned FM cannot create funds | Ban status checked before fund creation, banned FMs rejected |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create fund by eligible FM | Eligible FM creates fund | Transaction succeeds |
| Create fund by ineligible FM | Ineligible FM attempts to create fund | Transaction reverts with "FM not eligible" |
| Close fund by FM | FM closes their fund | Transaction succeeds |
| Close fund by non-FM | Non-FM attempts to close fund | Transaction reverts with "Not FM" |
| Increase stake by FM | FM increases stake for their fund | Transaction succeeds |
| Increase stake by non-FM | Non-FM attempts to increase stake | Transaction reverts with "Not FM" |
| Query functions by any address | Any address queries stake, eligibility, required stake | Queries succeed, read-only functions are public |
| Slash stake by SlashingEngine | SlashingEngine slashes FM stake | Transaction succeeds |
| Slash stake by non-SlashingEngine | Non-SlashingEngine attempts to slash stake | Transaction reverts with "Only SlashingEngine" |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| TOSS token approval flow | FM approves Factory, Factory pulls stake during fund creation | TOSS transferred correctly, allowance decreased, stake locked |
| FundRegistry integration | Factory creates fund, registers in FundRegistry | Fund registered correctly, registry state updated |
| FMRegistry eligibility check | Factory queries FM eligibility and score before fund creation | Eligibility and score checked correctly, fund creation respects requirements |
| RiskEngine config validation | Factory validates fund config via RiskEngine | Config validated against risk tier limits, invalid configs rejected |
| SlashingEngine integration | SlashingEngine slashes FM stake after slashing event | Stake reduced in Factory, SlashingEngine has access to stake |
| Fund initialization | Factory deploys proxy, initializes fund with config | Fund initialized correctly, config set, manager assigned |
| Multiple funds by same FM | FM creates multiple funds, all tracked correctly | Each fund independent, stake tracked separately, all funds active |
| Fund closure and stake return | FM closes fund, stake returned after slashing deductions | Remaining stake returned to FM, accounting accurate |
| Stake increase with AUM growth | Fund AUM grows, FM increases stake to meet requirement | New stake locked, total stake updated, requirements met |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund creation gas usage | FM creates fund with minimal proxy | Gas usage reasonable, minimal proxy deployment gas-efficient |
| Stake locking gas | Factory locks FM stake | Gas usage reasonable for stake locking operation |
| Query operations gas | Multiple queries for required stake, FM stake, eligibility | View functions consume no gas (read-only) |
| Batch fund creation gas | FM creates multiple funds in sequence | Each creation uses similar gas, no gas accumulation issues |

## Deployment Example

```typescript
// Complete deployment script
async function deployFundFactory() {
  const FundFactory = await ethers.getContractFactory("FundFactory");
  
  const factory = await FundFactory.deploy(
    toss.address,
    fundRegistry.address,
    riskEngine.address,
    fmRegistry.address,
    fundImplementation.address
  );
  
  await factory.deployed();
  
  // Configure
  await factory.setMinimumFMStake(ethers.utils.parseEther("10000"));
  await factory.setStakePerAUMRatio(10);  // 0.1%
  
  // Grant roles
  await fundRegistry.grantRole(FACTORY_ROLE, factory.address);
  
  return factory;
}
```

---

**Next**: [FundRegistry](/protocol/contracts/fund/FundRegistry)

**Back**: [Smart Contracts Overview](/protocol/contracts/overview)

