# L1-L2 Communication

Detailed specification of the communication protocols between Ethereum L1 and zkSync L2 in the TOSS Protocol, including deposit flows, withdrawal flows, and message passing.

## Overview

TOSS operates primarily on zkSync L2 but relies on Ethereum L1 for final settlement and security. Understanding the L1-L2 communication is crucial for:

- **Fund deposits and withdrawals**
- **State root finalization**
- **Emergency pause mechanisms**
- **Cross-chain governance**

## Deposit Flow (L1 → L2)

### Step-by-Step Process

#### 1. User Initiates Deposit on L1

```solidity
// User approves USDC to L1 Bridge
USDC.approve(L1Bridge, amount);

// User calls deposit
L1Bridge.deposit{value: 0}(
    l2Receiver,      // zkSync L2 address
    l1Token,         // USDC address on L1
    amount,          // Amount to deposit
    l2GasLimit,      // Gas limit for L2 transaction
    l2GasPerPubdata  // Gas per pubdata byte
);
```

#### 2. L1 Bridge Locks Funds

- Bridge contract locks USDC on L1
- Emits `DepositInitiated` event
- Adds deposit request to zkSync queue

#### 3. zkSync Sequencer Processes Deposit

- Sequencer picks up deposit from L1 queue
- Includes deposit in next L2 batch
- Executes deposit transaction on L2

#### 4. L2 Token Minted

```solidity
// L2 Bridge mints equivalent tokens
L2USDC.mint(l2Receiver, amount);

// TOSS contracts can now interact with tokens
FundManagerVault.deposit(fundId, amount);
```

### Deposit Timeline

- **L1 Confirmation**: 12-15 seconds (1-2 Ethereum blocks)
- **zkSync Processing**: 1-5 minutes (batch inclusion)
- **Total Time**: ~5-10 minutes for full confirmation

### Deposit Security

- **L1 Finality Required**: Deposits only processed after L1 finalization
- **Reorg Protection**: zkSync waits for sufficient L1 confirmations
- **Amount Verification**: L1 and L2 balances must match

## Withdrawal Flow (L2 → L1)

### Step-by-Step Process

#### 1. User Initiates Withdrawal on L2

```solidity
// Burn fund shares
FundManagerVault.withdraw(fundId, shares);

// Initiate L2 → L1 transfer
L2Bridge.withdraw(
    l1Receiver,      // Ethereum L1 address
    l2Token,         // USDC on L2
    amount           // Amount to withdraw
);
```

#### 2. L2 Bridge Burns Tokens

- L2 bridge burns USDC on zkSync
- Emits `WithdrawalInitiated` event
- Withdrawal added to L2 state

#### 3. zkSync Generates Proof

- Withdrawal included in next batch
- Batch proven on L1
- Merkle proof generated for withdrawal

#### 4. User Claims on L1

```solidity
// After proof is available
L1Bridge.finalizeWithdrawal(
    l2BatchNumber,
    l2MessageIndex,
    l2TxNumberInBatch,
    message,
    merkleProof
);
```

#### 5. L1 Bridge Releases Funds

- Verifies Merkle proof against state root
- Transfers USDC to user on L1
- Emits `WithdrawalFinalized` event

### Withdrawal Timeline

- **L2 Confirmation**: Instant (< 1 second)
- **Batch Proving**: 1-4 hours (proof generation + L1 submission)
- **L1 Finalization**: 12-15 seconds (L1 block confirmation)
- **Total Time**: ~1-4 hours for funds on L1

### Fast Withdrawals (Future)

For users who need faster withdrawals:

```solidity
// Liquidity provider can fulfill withdrawal immediately
FastWithdrawalService.fulfill(
    withdrawalId,
    user,
    amount
);

// LP is repaid when proof finalizes on L1
```

**Fast Withdrawal Time**: 1-5 minutes (with small fee to LP)

## State Root Commitment

### State Root Flow

```
L2 State → Batch Creation → Proof Generation → L1 Commitment → Finalization
```

#### 1. Batch Creation

- zkSync sequencer creates batch from L2 transactions
- Batch includes state transitions
- State root computed from new state

#### 2. Proof Generation

- ZK prover generates validity proof
- Proves correct execution of all transactions
- Proof compresses ~1000s of transactions into ~200KB

#### 3. L1 Commitment

```solidity
// zkSync commits state root to L1
StateRootVerifier.commitBatches(
    batchesData,
    proofData
);
```

#### 4. L1 Verification

- L1 contract verifies ZK proof
- State root stored on-chain
- Withdrawals become claimable

### State Root Security

- **Validity Proofs**: Impossible to commit invalid state
- **No Fraud Window**: Instant finality (unlike optimistic rollups)
- **Ethereum Security**: Secured by L1 consensus

## Message Passing

### L1 → L2 Messages

Used for:
- Governance proposals from L1 DAO
- Emergency pause commands
- Configuration updates

```solidity
// Send message from L1 to L2
L1Messenger.sendToL2(
    l2ContractAddress,
    l2Calldata,
    l2GasLimit,
    refundRecipient
);
```

### L2 → L1 Messages

Used for:
- Emergency stop notifications
- Critical parameter change alerts
- Slashing event reports

```solidity
// Send message from L2 to L1
L2Messenger.sendToL1(
    l1ContractAddress,
    l1Calldata
);
```

## Bridge Security Model

### Security Guarantees

1. **Validity Proofs**: All L2 state transitions are cryptographically proven
2. **Atomic Execution**: Deposits/withdrawals cannot be partially executed
3. **No Trusted Relayers**: Bridge operates trustlessly
4. **Censorship Resistance**: Users can force transactions through L1

### Emergency Mechanisms

#### L1 Emergency Pause

```solidity
// Emergency pause triggered from L1
L1Bridge.emergencyPause();

// Propagates to L2 via priority queue
L2Protocol.pause();
```

#### Forced Transaction Inclusion

If zkSync sequencer censors a transaction:

```solidity
// User can force transaction via L1
L1Bridge.requestL2Transaction{value: fee}(
    l2ContractAddress,
    l2Calldata,
    l2GasLimit,
    factoryDeps
);
```

zkSync must include within 24 hours or enter recovery mode.

## Gas Considerations

### L1 Deposit Gas Cost

- **Approval**: ~45,000 gas
- **Deposit Call**: ~150,000 gas
- **Total**: ~195,000 gas (~$5-20 depending on L1 gas price)

### L2 Operation Gas Cost

- **Simple Transfer**: ~200 gas (~$0.01)
- **Fund Deposit**: ~500-1000 gas (~$0.02-0.05)
- **Trade Execution**: ~2000-5000 gas (~$0.10-0.25)

### Withdrawal Gas Cost

- **L2 Withdrawal**: ~1000 gas (~$0.05)
- **L1 Claim**: ~200,000 gas (~$5-20 depending on L1 gas price)

## Bridge Monitoring

### Key Metrics

- **Deposit Processing Time**: Target < 5 minutes
- **Withdrawal Proof Time**: Target < 4 hours
- **Bridge TVL**: Total value locked in bridge
- **Pending Deposits/Withdrawals**: Queue sizes

### Alerts

- Deposit processing delay > 10 minutes
- Withdrawal proof delay > 6 hours
- Bridge balance mismatch detected
- Abnormal withdrawal volume

## Next Steps

- **[Security Model](/protocol/architecture/security-model)**: Comprehensive security analysis
- **[zkSync Integration](/protocol/zksync/overview)**: Deep dive into zkSync specifics
- **[Smart Contracts - Bridge](/protocol/contracts/core/BridgeGateway)**: Bridge contract specifications

---

*For bridge implementation details, see [Technical Documentation - Off-Chain Services](/technical/offchain/overview).*

