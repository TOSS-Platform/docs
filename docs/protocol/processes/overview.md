# Processes & Workflows

Complete documentation of all TOSS Protocol processes, workflows, and lifecycles with step-by-step explanations, permissions, outcomes, and error handling.

## Purpose

This section provides end-to-end process documentation showing how every major operation works in practice. Each process is documented with:

- ✅ Detailed step-by-step flows
- ✅ Participant roles and permissions
- ✅ Contract interactions
- ✅ Sequence diagrams
- ✅ Error scenarios and recovery
- ✅ Timing and gas costs
- ✅ Security considerations
- ✅ Working code examples

## Process Categories

### Fund Manager Processes

Operations performed by Fund Managers:

- **[Create Fund](/docs/protocol/processes/fund-manager/create-fund)**: Complete fund creation lifecycle from staking to deployment
- **[Update Configuration](/docs/protocol/processes/fund-manager/update-config)**: Change fund parameters via governance
- **[Execute Trade](/docs/protocol/processes/fund-manager/execute-trade)**: Trade execution flow with RiskEngine validation
- **[Collect Fees](/docs/protocol/processes/fund-manager/collect-fees)**: Management and performance fee collection
- **[Close Fund](/docs/protocol/processes/fund-manager/close-fund)**: Orderly fund closure and stake return
- **[Manage Stake](/docs/protocol/processes/fund-manager/manage-stake)**: Increase or decrease FM stake

### Investor Processes

Operations performed by Investors:

- **[Investor Onboarding](/docs/protocol/processes/investor/onboarding)**: Registration and initial setup
- **[Deposit to Fund](/docs/protocol/processes/investor/deposit)**: Capital deposit and share minting
- **[Withdraw from Fund](/docs/protocol/processes/investor/withdraw)**: Withdrawal request and processing
- **[Upgrade Class](/docs/protocol/processes/investor/upgrade-class)**: Class upgrade (Retail → Premium → Institutional → Strategic)
- **[Emergency Exit](/docs/protocol/processes/investor/emergency-exit)**: Fast exit during fund emergency

### Risk & Compliance Processes

Risk validation and enforcement workflows:

- **[Risk Validation](/docs/protocol/processes/risk-compliance/risk-validation)**: Trade validation through RiskEngine and domains
- **[Slashing Execution](/docs/protocol/processes/risk-compliance/slashing-execution)**: Slashing calculation and execution with burn/compensation
- **[Penalty Application](/docs/protocol/processes/risk-compliance/penalty-application)**: Non-slashing penalty enforcement
- **[Intent Detection](/docs/protocol/processes/risk-compliance/intent-detection)**: Malicious intent detection and flagging
- **[Circuit Breaker](/docs/protocol/processes/risk-compliance/circuit-breaker)**: Automatic circuit breaker activation

### Governance Processes

All governance workflows at three levels:

- **[Fund-Level Proposal](/docs/protocol/processes/governance/fund-proposal)**: FM or investor proposes fund change
- **[FM-Level Proposal](/docs/protocol/processes/governance/fm-proposal)**: FM proposes standards affecting all FMs
- **[Protocol-Level Proposal](/docs/protocol/processes/governance/protocol-proposal)**: Admin proposes protocol-wide change
- **[Voting Process](/docs/protocol/processes/governance/voting)**: How voting works at each level
- **[Proposal Execution](/docs/protocol/processes/governance/execution)**: Timelock and execution flow

### System Processes

Automated system operations:

- **[NAV Update](/docs/protocol/processes/system/nav-update)**: NAV calculation and on-chain update flow
- **[Daily Settlement](/docs/protocol/processes/system/daily-settlement)**: End-of-day settlement procedures
- **[Fee Distribution](/docs/protocol/processes/system/fee-distribution)**: Protocol fee collection and distribution
- **[Emergency Procedures](/docs/protocol/processes/system/emergency-procedures)**: Emergency pause, recovery, and incident response

### Integration Processes

Cross-layer and external integrations:

- **[L1 to L2 Deposit](/docs/protocol/processes/integration/l1-to-l2-deposit)**: Complete deposit flow from Ethereum to zkSync
- **[L2 to L1 Withdrawal](/docs/protocol/processes/integration/l2-to-l1-withdrawal)**: Withdrawal with proof generation and L1 claim
- **[Off-Chain Sync](/docs/protocol/processes/integration/offchain-sync)**: Event synchronization with off-chain services

## How to Use This Section

### For Developers

Use process documentation to understand:
- Contract interaction sequences
- Required permissions and validations
- Error handling requirements
- Integration test scenarios

### For Auditors

Review processes to identify:
- Security-critical steps
- Access control enforcement points
- State transition validations
- Attack surface during operations

### For Product Managers

Understand:
- User journeys and UX flows
- Timing and latency expectations
- Error messages and recovery
- Edge cases to handle

### For Integrators

Learn:
- How to call contracts correctly
- Required approval flows
- Event listening patterns
- Error recovery strategies

## Process Flow Notation

Throughout this documentation, we use consistent notation:

```
→  Sequential step
⟿  Conditional branch
⊗  Validation check
⚠  Error condition
✓  Success outcome
⏱  Time delay
🔒 Permission required
```

## Example Process Structure

Each process follows this template:

1. **Overview**: What the process does
2. **Participants**: Who/what is involved
3. **Prerequisites**: Starting conditions
4. **Step-by-Step Flow**: Detailed walkthrough
5. **Success Outcome**: End state
6. **Failure Scenarios**: Error handling
7. **Timing & Performance**: Duration, gas costs
8. **Security**: Attack vectors and mitigations
9. **Code Example**: Working implementation
10. **Diagrams**: Visual flow representation

## Quick Navigation

### By Actor

**Fund Managers**: [Create Fund](/docs/protocol/processes/fund-manager/create-fund) | [Execute Trade](/docs/protocol/processes/fund-manager/execute-trade) | [Collect Fees](/docs/protocol/processes/fund-manager/collect-fees)

**Investors**: [Deposit](/docs/protocol/processes/investor/deposit) | [Withdraw](/docs/protocol/processes/investor/withdraw) | [Upgrade Class](/docs/protocol/processes/investor/upgrade-class)

**Governance Participants**: [Fund Proposal](/docs/protocol/processes/governance/fund-proposal) | [FM Proposal](/docs/protocol/processes/governance/fm-proposal) | [Protocol Proposal](/docs/protocol/processes/governance/protocol-proposal)

### By System Component

**Risk System**: [Risk Validation](/docs/protocol/processes/risk-compliance/risk-validation) | [Slashing](/docs/protocol/processes/risk-compliance/slashing-execution)

**Bridge**: [L1→L2 Deposit](/docs/protocol/processes/integration/l1-to-l2-deposit) | [L2→L1 Withdrawal](/docs/protocol/processes/integration/l2-to-l1-withdrawal)

**NAV Engine**: [NAV Update](/docs/protocol/processes/system/nav-update) | [Daily Settlement](/docs/protocol/processes/system/daily-settlement)

## Related Documentation

- **[Smart Contracts](/docs/protocol/contracts/overview)**: Contract specifications
- **[Governance](/docs/protocol/governance/overview)**: Governance system details
- **[Technical Guide](/docs/technical/intro)**: Implementation guides

---

**Start exploring**: [Fund Creation Process](/docs/protocol/processes/fund-manager/create-fund) is a great entry point.

