# Proposal Execution Process

## Overview

After proposal passes and timelock expires, execution applies changes to protocol.

## Steps

1. **Proposal Passes**: Quorum met, approval threshold exceeded
2. **Queue**: Added to timelock
3. **Wait**: Timelock delay (24h-72h depending on level)
4. **Execute**: Apply changes to target contracts
5. **Verify**: Confirm changes applied correctly

## Execution Flow

```solidity
// After timelock expires
function execute(uint256 proposalId) external {
    require(state == QUEUED);
    require(block.timestamp >= eta);
    require(block.timestamp < eta + GRACE_PERIOD);
    
    // Execute all actions
    for (uint i = 0; i < targets.length; i++) {
        target[i].call(calldata[i]);
    }
    
    state = EXECUTED;
}
```

## Grace Period

If not executed within 14 days after timelock, proposal expires.

---

**Governance Processes Complete!**

