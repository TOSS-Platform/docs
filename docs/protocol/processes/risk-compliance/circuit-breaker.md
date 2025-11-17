# Circuit Breaker Process

## Overview

Automatic protocol/fund pause when extreme conditions detected.

## Trigger Conditions

| Condition | Action |
|-----------|--------|
| Oracle deviation > 10% | Pause new trades |
| Fund loss > 50% in 24h | Pause fund |
| Withdrawal surge > 80% TVL | Rate limit |
| Multiple oracle failures | Emergency mode |

## Process

```
Condition Detected → Circuit Breaker Triggered → Pause Operations → Alert Sent → Manual Review → Gradual Resume
```

## Auto-Recovery

If conditions normalize within 1 hour:
- Automatic unpause
- Resume operations
- Log incident

If conditions persist:
- Requires DAO vote to unpause
- Manual investigation
- Potential parameter changes

---

**Related**: [Emergency Procedures](/docs/protocol/processes/system/emergency-procedures)

