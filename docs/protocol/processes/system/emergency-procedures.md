# Emergency Procedures

## Overview

Protocol-wide and fund-specific emergency response procedures.

## Emergency Types

### Level 1: Fund Emergency

**Triggers**:
- Fund loss > 50% in 24h
- FM suspicious activity
- Investor panic

**Action**:
```solidity
vault.pauseFund(fundId);
```

**Effect**: Fund trading paused, withdrawals still allowed

### Level 2: Protocol Emergency

**Triggers**:
- Oracle failure
- zkSync sequencer down
- Smart contract vulnerability discovered

**Action**:
```solidity
await chainState.emergencyPause();
```

**Effect**: All trading paused, withdrawals allowed

### Level 3: Critical Emergency

**Triggers**:
- Active exploit
- Multiple simultaneous failures

**Action**:
```solidity
await guardian.activateEmergencyMode();
```

**Effect**: Everything paused, guardian can move funds to safety

## Recovery Process

1. **Pause**: Immediate halt
2. **Assess**: Root cause analysis (1-4 hours)
3. **Fix**: Deploy patch or parameter change
4. **Test**: Verify fix on testnet
5. **Vote**: DAO votes on unpause
6. **Resume**: Gradual resumption

## Guardian Powers

```yaml
Can:
  - Pause protocol
  - Veto critical proposals (24h window)
  - Emergency fund movement (if paused)

Cannot:
  - Approve proposals
  - Change parameters directly
  - Execute without consensus (3-of-5)
```

---

**System Processes Complete!**

