# MCP Examples

## Example AI Interactions

### Example 1: Fund Creation

```
User: "I want to create a Bitcoin-focused fund"

AI: "I'll help you create a fund! Let me check your eligibility..."
    [Calls toss_check_fm_eligibility]
    
    "✓ You're eligible (FM Score: 75)
     
     For a BTC fund, I recommend:
     - Fund Class: ALPHA (high-risk, high-reward)
     - Risk Tier: TIER_3
     - Management Fee: 2%
     - Performance Fee: 20%
     
     How much AUM are you targeting?"

User: "$5M"

AI: [Calls toss_calculate_required_stake]
    "You'll need 15,000 TOSS stake for $5M fund.
     
     Here's the code to create it:
     [Provides complete code example]"
```

### Example 2: Trade Validation

```
User: "Can I trade $100k USDC for BTC in my fund?"

AI: [Calls toss_validate_trade]
    "⚠️ This trade would violate position size limit:
     
     - Current BTC: 15% of NAV
     - After trade: 23% of NAV
     - Your PSL: 20%
     - Violation: 3%
     - FaultIndex: ~42
     - Potential Slashing: 5-7% of stake
     
     Recommendation: Reduce to $60k maximum"
```

### Example 3: Governance Help

```
User: "How do I reduce my fund's management fee?"

AI: [Retrieves fund governance docs]
    "To reduce your fund's management fee:
     
     1. Create proposal via FundGovernance
     2. Your fund investors vote (5 days)
     3. Need 30% quorum, >50% approval
     4. 24h timelock
     5. Fee updated
     
     Current fee: 2%
     Minimum allowed: 0%
     Maximum allowed: 3% (Tier 2)
     
     What would you like to propose?"
```

---

More examples in subfolder.

