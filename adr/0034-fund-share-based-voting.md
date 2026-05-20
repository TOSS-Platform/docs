# ADR-0034: Fund-Level Share-Based Voting

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, fund, voting

## Context and Problem Statement

Each fund needs a mechanism by which its investors can govern fund-specific decisions: fee adjustments within protocol bounds, asset whitelist tweaks, and FM removal where allowed. These decisions affect the holders of that fund's shares directly and almost no one else. The voting mechanism must reflect that economic exposure.

Using protocol-wide TOSS stake as the voting power source at the fund level would let outside parties — TOSS holders with no shares in the fund — influence decisions about that fund. This breaks the principle that decision-makers should bear consequences of the decision. A pure 1-investor-1-vote scheme avoids that problem but creates a new one: a malicious actor can split a small position into many addresses and overwhelm honest large holders.

Share-weighted snapshot voting is the standard solution for fund-level governance because it ties voice to economic exposure at a specific point in time, preventing both outside influence and small-deposit gerrymandering.

## Decision Drivers

- Voting power must reflect economic exposure to the fund.
- Resist Sybil-style splitting of small positions.
- Snapshot must be deterministic and verifiable.
- Execution must be gated by a fund-level timelock.

## Considered Options

1. **TOSS-stake voting for fund decisions** — protocol-wide stake votes on fund issues.
2. **1-investor-1-vote** — each unique investor address counts equally.
3. **Share-weighted snapshot voting** — power equals `sharesHeld(investor)` at snapshot block.

## Decision Outcome

**Chosen option**: *Share-weighted snapshot voting*, because it ties voice to economic exposure and resists trivial Sybil attacks.

### Positive Consequences

- Only investors with capital at risk in the fund can vote.
- Snapshot block prevents same-shares-vote-twice attacks via mid-vote transfers.
- Aligns with EIP-2612 permit and ERC20Votes patterns already in use (ADR-0011).

### Negative Consequences / Trade-offs

- Large shareholders carry proportionally more weight; minority holders depend on quorum and supermajority rules to protect them.
- Snapshots add storage cost per fund per proposal.
- Investors who acquire shares after the snapshot cannot vote on in-flight proposals.

## Pros and Cons of the Options

### Option A — TOSS-stake voting for fund decisions

- ✅ Pro: Reuses an existing voting-power source.
- ❌ Con: Outsiders with no economic interest in the fund can vote.
- ❌ Con: Decouples consequence from decision.

### Option B — 1-investor-1-vote

- ✅ Pro: Egalitarian among unique participants.
- ❌ Con: Trivially Sybil-attackable by splitting deposits across addresses.
- ❌ Con: Ignores magnitude of economic exposure.

### Option C — Share-weighted snapshot voting

- ✅ Pro: Voice scales with capital at risk.
- ✅ Pro: Snapshot block makes outcome deterministic.
- ❌ Con: Whales of the fund have substantial influence; mitigated by quorum and supermajority for impactful changes.

## Implementation Notes

- Per-fund `FundGovernance` contract tracks proposals scoped to that fund.
- Voting power at block `b`: `votingPower(investor) = fundShares.balanceOfAt(investor, b)`.
- Execution gated by fund-level timelock (24h per ADR-0036).
- Proposal scope restricted to fund-bound parameters; protocol bounds enforced by `DAOConfigCore`.
- Snapshot block is recorded at proposal submission; vote counting uses `ERC20Votes`-style checkpoints.
- Quorum and supermajority thresholds for fund-level proposals are defined by the InvestorDAO standards layer (ADR-0032).

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/voting-mechanism.md`, `/home/user/docs/protocol/contracts/governance/FundGovernance.md`
- **Related ADRs**: ADR-0011, ADR-0033, ADR-0036
