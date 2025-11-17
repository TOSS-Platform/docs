# Risk Validation Process

## Overview

Every trade passes through RiskEngine, which coordinates three risk domains to calculate FaultIndex and approve/reject trades.

## Flow

```mermaid
sequenceDiagram
    FM->>RiskEngine: validateTrade(fundId, params)
    RiskEngine->>ProtocolDomain: validate()
    ProtocolDomain-->>RiskEngine: (healthy, FI_protocol)
    RiskEngine->>FundDomain: validate(fundId, params)
    FundDomain-->>RiskEngine: (passed, FI_fund)
    RiskEngine->>InvestorDomain: validate(fundId)
    InvestorDomain-->>RiskEngine: (ok, FI_investor)
    RiskEngine->>RiskEngine: FI = max(FI_protocol, FI_fund, FI_investor)
    alt FI < 30
        RiskEngine-->>FM: APPROVED + signature
    else FI ≥ 30
        RiskEngine->>SlashingEngine: executeSlashing(fundId, FI)
        RiskEngine-->>FM: REJECTED
    end
```

## FaultIndex Calculation

```
FI = 0.45×L + 0.25×B + 0.20×D + 0.10×I

L = Limit Breach (0-100)
B = Behavior Anomaly (0-100)
D = Damage Ratio (0-100)
I = Intent Probability (0-100)
```

## Decision Matrix

| FI Range | Action | Slash % |
|----------|--------|---------|
| 0-10 | Approve, no warning | 0% |
| 10-30 | Approve with warning | 0% |
| 30-60 | Reject + Slash | 1-10% |
| 60-85 | Reject + Slash | 10-50% |
| 85-100 | Reject + Slash + Ban | 50-100% |

---

**Related**: [Slashing Process](/docs/protocol/processes/risk-compliance/slashing-execution)

