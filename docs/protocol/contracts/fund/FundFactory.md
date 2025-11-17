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

### Happy Path

```typescript
describe("FundFactory - Fund Creation", () => {
  it("should create fund with valid parameters", async () => {
    const config = {
      fundClass: FundClass.BALANCED,
      riskTier: RiskTier.TIER_2,
      managementFee: 200,  // 2%
      performanceFee: 2000,  // 20%
      initialAUM: 0,
    };
    
    const stakeAmount = ethers.utils.parseEther("10000");
    await toss.connect(fm).approve(factory.address, stakeAmount);
    
    const tx = await factory.connect(fm).createFund(config, stakeAmount);
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === 'FundCreated');
    expect(event.args.manager).to.equal(fm.address);
    expect(event.args.stakeAmount).to.equal(stakeAmount);
  });
  
  it("should deploy fund as minimal proxy", async () => {
    const { fundAddress } = await factory.connect(fm).createFund(config, stake);
    
    // Verify it's a proxy pointing to implementation
    const code = await ethers.provider.getCode(fundAddress);
    expect(code.length).to.be.lt(100);  // Minimal proxy is tiny
  });
  
  it("should register fund in registry", async () => {
    const { fundId, fundAddress } = await factory.connect(fm).createFund(config, stake);
    
    expect(await fundRegistry.getFundAddress(fundId)).to.equal(fundAddress);
    expect(await fundRegistry.getFundManager(fundId)).to.equal(fm.address);
  });
});
```

### Failure Cases

```typescript
describe("FundFactory - Validations", () => {
  it("should reject creation from ineligible FM", async () => {
    await expect(
      factory.connect(unregisteredFM).createFund(config, stake)
    ).to.be.revertedWith("FM not eligible");
  });
  
  it("should reject insufficient stake", async () => {
    const requiredStake = await factory.getRequiredStake(1000000);  // $1M AUM
    const insufficientStake = requiredStake.sub(1);
    
    await expect(
      factory.connect(fm).createFund(config, insufficientStake)
    ).to.be.revertedWith("Insufficient stake");
  });
  
  it("should reject if FM is banned", async () => {
    await slashingEngine.banFM(fm.address);
    
    await expect(
      factory.connect(fm).createFund(config, stake)
    ).to.be.revertedWith("FM banned");
  });
  
  it("should reject invalid config", async () => {
    const invalidConfig = { ...config, managementFee: 500 };  // 5% > max
    
    await expect(
      factory.connect(fm).createFund(invalidConfig, stake)
    ).to.be.revertedWith("Fee exceeds maximum");
  });
});
```

### Edge Cases

```typescript
describe("FundFactory - Edge Cases", () => {
  it("should handle FM creating multiple funds", async () => {
    const fund1 = await factory.connect(fm).createFund(config1, stake1);
    const fund2 = await factory.connect(fm).createFund(config2, stake2);
    
    expect(fund1.fundId).to.not.equal(fund2.fundId);
    expect(await factory.fundsCreatedByFM(fm.address)).to.equal(2);
  });
  
  it("should calculate stake correctly for large AUM", async () => {
    const largeAUM = ethers.utils.parseUnits("100000000", 6);  // $100M
    const required = await factory.getRequiredStake(largeAUM);
    
    // minimumStake + (AUM × 0.001)
    const expected = ethers.utils.parseEther("10000").add(
      largeAUM.mul(10).div(10000)  // $100M × 0.1% = $100k
    );
    expect(required).to.equal(expected);
  });
});
```

### Security Tests

```typescript
describe("FundFactory - Security", () => {
  it("should prevent reentrancy during fund creation", async () => {
    const maliciousCallback = await deployMaliciousContract();
    
    await expect(
      factory.connect(maliciousCallback).createFund(config, stake)
    ).to.be.reverted;  // Reentrancy guard triggers
  });
  
  it("should lock stake immediately", async () => {
    await factory.connect(fm).createFund(config, stake);
    
    // FM cannot withdraw stake
    await expect(
      factory.connect(fm).withdrawStake(fundId)
    ).to.be.revertedWith("Fund still active");
  });
  
  it("should only allow SlashingEngine to reduce stake", async () => {
    await factory.connect(fm).createFund(config, stake);
    
    await expect(
      factory.connect(attacker).slashStake(fundId, 1000)
    ).to.be.revertedWith("Only SlashingEngine");
    
    // SlashingEngine can slash
    await factory.connect(slashingEngine).slashStake(fundId, 1000);
    const remaining = await factory.getFMStake(fm.address, fundId);
    expect(remaining.amount).to.equal(stake.sub(1000));
  });
});
```

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

**Next**: [FundRegistry](/docs/protocol/contracts/fund/FundRegistry)

**Back**: [Smart Contracts Overview](/docs/protocol/contracts/overview)

