# Protocol-Level Proposal Process

## Overview

Admin creates protocol-wide proposal and specifies voter group (FM_ONLY, INVESTOR_ONLY, BOTH, or GUARDIAN).

## Process

```mermaid
sequenceDiagram
    Admin->>ProtocolGov: createProposal(type, voterGroup, targets, calls)
    ProtocolGov->>Voters: Notify eligible voters
    Note over Voters: Discussion 7 days
    loop Voting 14 days
        Voters->>ProtocolGov: castVote(proposalId, support)
    end
    ProtocolGov->>ProtocolGov: Check quorum & approval
    ProtocolGov->>Guardian: 24h review window
    alt Guardian approves or timeout
        ProtocolGov->>Timelock: Queue (48-72h)
        Timelock->>Executor: Execute changes
    else Guardian vetoes
        ProtocolGov->>ProtocolGov: Mark VETOED
    end
```

## Voter Group Selection

Admin decides who votes based on proposal impact:

```typescript
if (affects === 'FMs primarily') voterGroup = VoterGroup.FM_ONLY;
if (affects === 'Investors primarily') voterGroup = VoterGroup.INVESTOR_ONLY;
if (affects === 'Everyone') voterGroup = VoterGroup.BOTH;
if (emergency) voterGroup = VoterGroup.GUARDIAN_ONLY;
```

## Examples

**Oracle Config** → BOTH (affects everyone)
**Slashing Formula** → FM_ONLY (affects FMs)
**Protocol Fee** → INVESTOR_ONLY (investors pay fees)

---

**Related**: [ProtocolGovernance](/protocol/contracts/governance/ProtocolGovernance)

