# Testing & QA Overview

Comprehensive testing strategy for TOSS Protocol ensuring security, correctness, and reliability across all components.

## Testing Philosophy

### Testing Pyramid

```
        /\
       /E2E\          10% - Full system tests
      /------\
     /Integration\    30% - Component interaction tests
    /------------\
   / Unit Tests   \   60% - Individual function tests
  /----------------\
```

### Key Principles

1. **Test Early, Test Often**: Catch bugs before they reach production
2. **Automate Everything**: CI/CD runs all tests automatically
3. **Test Like Production**: Use realistic data and scenarios
4. **Security First**: Security tests are mandatory, not optional
5. **zkSync-Specific**: Test zkSync constraints and behavior

## Test Layers

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Tools**:
- Jest for TypeScript/JavaScript
- Hardhat for Solidity
- Mocha for integration

**Coverage Target**: 90%+

```typescript
describe('RiskEngine', () => {
  describe('calculateFaultIndex', () => {
    it('should return 0 for no violations', () => {
      const violations = { limitBreach: 0, behavior: 0, damage: 0, intent: 0 };
      const fi = calculateFaultIndex(violations);
      expect(fi).toBe(0);
    });
    
    it('should return 1 for maximum violations', () => {
      const violations = { limitBreach: 1, behavior: 1, damage: 1, intent: 1 };
      const fi = calculateFaultIndex(violations);
      expect(fi).toBe(1);
    });
  });
});
```

### 2. Integration Tests

**Purpose**: Test interactions between components

**Scenarios**:
- Contract-to-contract calls
- Off-chain service communication
- Database operations
- External API calls

```typescript
describe('Fund Deposit Flow', () => {
  it('should complete full deposit', async () => {
    // 1. Investor approves USDC
    await usdc.connect(investor).approve(vault.address, amount);
    
    // 2. Deposit to fund
    await vault.connect(investor).deposit(fundId, amount);
    
    // 3. Verify shares minted
    const shares = await vault.balanceOf(investor.address, fundId);
    expect(shares).to.be.gt(0);
    
    // 4. Verify NAV updated
    const nav = await navEngine.getNAV(fundId);
    expect(nav).to.be.gt(0);
  });
});
```

### 3. zkSync Simulation Tests

**Purpose**: Test zkSync-specific behavior

**Focus Areas**:
- Account Abstraction flows
- Paymaster interactions
- Gas cost validation
- Storage optimizations

```typescript
describe('zkSync Account Abstraction', () => {
  it('should validate transaction via session key', async () => {
    // Create FM wallet with session key
    const fmWallet = await deployFMWallet(fm.address);
    await fmWallet.createSessionKey(sessionKey.address, dailyLimit);
    
    // Execute trade using session key
    const tx = {
      to: tradeExecutor.address,
      data: tradeCalldata,
      from: sessionKey.address
    };
    
    // Should succeed
    await expect(fmWallet.validateAndExecute(tx)).to.not.be.reverted;
  });
});
```

### 4. Fuzzing & Property-Based Tests

**Purpose**: Find edge cases through randomized inputs

**Tools**:
- Foundry's fuzzer
- Echidna
- Hypothesis (Python)

```solidity
// Foundry fuzz test
function testFuzz_SlashingNeverExceedsStake(uint256 faultIndex, uint256 stake) public {
    // Bound inputs to valid ranges
    faultIndex = bound(faultIndex, 0, 1e18);
    stake = bound(stake, 1e18, 1000000e18);
    
    uint256 slash = slashingEngine.calculateSlashing(stake, faultIndex, 0);
    
    // Property: Slashing should never exceed stake
    assertLe(slash, stake);
}
```

### 5. Formal Verification

**Purpose**: Mathematically prove contract properties

**Tools**:
- Certora Prover
- K Framework
- SMT solvers

```solidity
// Invariant: Total shares should equal sum of individual balances
rule totalSharesEqualsSum {
    env e;
    
    uint256 totalShares = vault.totalShares();
    uint256 sumBalances = sumOfBalances();
    
    assert totalShares == sumBalances;
}
```

### 6. End-to-End Tests

**Purpose**: Test complete user journeys

**Scenarios**:
- Complete fund lifecycle
- Investor journey (signup → invest → withdraw)
- FM journey (create fund → trade → earn fees)

```typescript
describe('Complete Fund Lifecycle', () => {
  it('should handle full fund lifecycle', async () => {
    // 1. FM creates fund
    const tx1 = await fundFactory.connect(fm).createFund(config, stake);
    const fundId = await getFundIdFromTx(tx1);
    
    // 2. Investor deposits
    await vault.connect(investor).deposit(fundId, 10000e6);
    
    // 3. FM executes trades
    await tradeExecutor.connect(fm).executeTrade(fundId, tradeParams);
    
    // 4. NAV increases
    await wait(1, 'day');
    const nav = await navEngine.getNAV(fundId);
    expect(nav).to.be.gt(10000e6);
    
    // 5. Investor withdraws with profit
    await vault.connect(investor).withdraw(fundId, shares);
    const balance = await usdc.balanceOf(investor.address);
    expect(balance).to.be.gt(10000e6);
  });
});
```

## Test Organization

### Directory Structure

```
test/
├── unit/
│   ├── contracts/
│   │   ├── RiskEngine.test.ts
│   │   ├── SlashingEngine.test.ts
│   │   └── FundManagerVault.test.ts
│   └── offchain/
│       ├── navEngine.test.ts
│       └── tradeRouter.test.ts
├── integration/
│   ├── fundLifecycle.test.ts
│   ├── investorJourney.test.ts
│   └── governance.test.ts
├── zksync/
│   ├── accountAbstraction.test.ts
│   ├── paymaster.test.ts
│   └── gasOptimization.test.ts
├── fuzzing/
│   ├── RiskEngine.t.sol
│   └── SlashingEngine.t.sol
└── e2e/
    ├── completeJourney.test.ts
    └── stressTest.test.ts
```

## Test Data & Fixtures

### Test Accounts

```typescript
const testAccounts = {
  deployer: accounts[0],
  fm1: accounts[1],
  fm2: accounts[2],
  investor1: accounts[3],
  investor2: accounts[4],
  investor3: accounts[5],
  attacker: accounts[6],
  guardian: accounts[7],
  dao: accounts[8],
};
```

### Test Fixtures

```typescript
async function setupFundEnvironment() {
  // Deploy core contracts
  const toss = await deployTOSS();
  const riskEngine = await deployRiskEngine();
  const fundFactory = await deployFundFactory(riskEngine.address);
  
  // Setup test fund
  await toss.transfer(fm.address, 50000e18);
  await toss.connect(fm).approve(fundFactory.address, 50000e18);
  
  const tx = await fundFactory.connect(fm).createFund(defaultConfig, 50000e18);
  const fundId = await getFundIdFromTx(tx);
  
  return { toss, riskEngine, fundFactory, fundId };
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: yarn install
      - run: yarn test:unit
      - run: yarn coverage
      - uses: codecov/codecov-action@v3
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn test:integration
  
  zksync-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn test:zksync
  
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn slither
      - run: yarn mythril
```

## Quality Gates

### Pre-Commit

```bash
# .husky/pre-commit
yarn lint
yarn format:check
yarn test:unit --bail
```

### Pre-Push

```bash
# .husky/pre-push
yarn test
yarn test:integration
```

### PR Requirements

```yaml
Pull Request Checks:
  ✅ All tests pass
  ✅ Coverage >= 90%
  ✅ No linter errors
  ✅ Security scan clean
  ✅ Performance benchmarks within threshold
  ✅ 2+ approvals from reviewers
```

## Test Execution

### Local Testing

```bash
# Run all tests
yarn test

# Run specific test file
yarn test test/RiskEngine.test.ts

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch

# Run specific suite
yarn test --grep "RiskEngine"
```

### CI Testing

```bash
# Run CI test suite
yarn test:ci

# Includes:
# - Unit tests
# - Integration tests
# - zkSync tests
# - Coverage report
# - Security scans
```

## Test Utilities

### Time Manipulation

```typescript
// Hardhat time helpers
await ethers.provider.send('evm_increaseTime', [86400]); // +1 day
await ethers.provider.send('evm_mine', []); // Mine block
```

### Event Testing

```typescript
// Assert event emission
await expect(tx)
  .to.emit(contract, 'EventName')
  .withArgs(arg1, arg2);
```

### Error Testing

```typescript
// Assert revert with reason
await expect(
  contract.functionName()
).to.be.revertedWith('Error message');

// Assert custom error
await expect(
  contract.functionName()
).to.be.revertedWithCustomError(contract, 'ErrorName');
```

## Performance Testing

### Gas Benchmarks

```typescript
it('should execute trade within gas limit', async () => {
  const tx = await tradeExecutor.executeTrade(fundId, params);
  const receipt = await tx.wait();
  
  expect(receipt.gasUsed).to.be.lt(300000);
});
```

### Load Testing

```typescript
// Simulate high load
describe('Load Test', () => {
  it('should handle 100 concurrent deposits', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        vault.connect(investors[i]).deposit(fundId, 1000e6)
      );
    }
    await Promise.all(promises);
    // All should succeed
  });
});
```

## Next Steps

Explore specific testing topics:

- **[Unit Testing](/technical/testing/unit-testing)**: Detailed unit test guide
- **[Integration Testing](/technical/testing/integration-testing)**: Component interaction tests
- **[zkSync Simulation](/technical/testing/zksync-simulation)**: zkSync-specific testing
- **[Fuzzing](/technical/testing/fuzzing)**: Property-based testing

---

*For deployment testing, see [Deployment Workflow](/technical/deployment/workflow).*

