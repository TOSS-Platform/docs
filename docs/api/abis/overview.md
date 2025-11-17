# Smart Contract ABIs

:::info Coming Soon
Contract ABIs will be published after mainnet deployment.
:::

## Available Contracts (Planned)

- TOSS Token
- FundFactory
- FundManagerVault
- RiskEngine
- DAOGovernance
- And more...

## Usage Example

```typescript
import { ethers } from 'ethers';
import TOSS_ABI from '@toss/abis/TOSS.json';

const contract = new ethers.Contract(
  TOSS_ADDRESS,
  TOSS_ABI,
  signer
);

const balance = await contract.balanceOf(address);
```

---

[Back to API Overview](/docs/api/overview)

