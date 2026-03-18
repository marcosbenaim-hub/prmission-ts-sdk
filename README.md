# Prmission-sdk

**AI agents pay users directly for permission to access data.**  
Built for autonomous AI agents transacting at scale.

The official TypeScript SDK for Prmission — a consent-gated escrow protocol for AI agent commerce, live on Base.

## ⚡ Live on Base Mainnet

- Contract: https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d
- Network: Base
- Settlement: USDC
- Protocol Fee: 3% (on-chain)

## 🎬 Live Demo

👉 https://prmission-demo123.netlify.app

Simulates:
- Permission creation
- USDC escrow deposit
- Outcome reporting
- Settlement

## 🚀 60-Second Quickstart

```bash
npm install prmission-sdk
```

## 🧠 What This Is

Prmission is the economic layer for AI agents.

Instead of scraping or guessing:
- Agents request permission
- Users set terms
- Agents pay in USDC
- Settlement is enforced on-chain

## 💥 Why This Matters

- Replaces ads with direct payments to users
- Eliminates wasted CAC
- Makes data access consensual + priced
- Built for autonomous AI agents transacting at scale.

```ts
import { PrmissionClient, parseUsdc, formatUsdc } from "prmission-sdk";
import { ethers } from "ethers";

const client = new PrmissionClient({
  contractAddress: "0x0c8B16a57524f4009581B748356E01e1a969223d",
  rpcUrl: "https://mainnet.base.org",
});

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
client.connect(signer);

const permissionId = await client.grantPermission({
  dataCategory: "browsing-history",
  purpose: "ad personalisation",
  compensationBps: 2000,
  validityPeriod: 86400,
});

const escrowId = await client.depositEscrow(
  permissionId,
  parseUsdc("50.00"),
);

await client.reportOutcome({
  escrowId,
  outcomeValue: parseUsdc("50.00"),
  outcomeType: "ad-click",
  outcomeDescription: "User clicked sponsored result",
});

await client.settle(escrowId);
```

## Constructor

```ts
new PrmissionClient(config: PrmissionConfig)
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| contractAddress | string | ✅ | Deployed Prmission.sol address |
| rpcUrl | string | optional | Base RPC endpoint |

## Signer Management

```ts
client.connect(signer)
```

## USDC Helpers

```ts
await client.ensureAllowance(amount)
await client.getBalance(address)
```

## Permission Methods

```ts
await client.grantPermission({...})
await client.revokePermission(permissionId)
await client.expirePermission(permissionId)
```

## Permission Reads

```ts
await client.getPermission(permissionId)
await client.getUserPermissions(user)
await client.getActivePermissions(user)
await client.checkAccess(permissionId, agent)
```

## Escrow Methods

```ts
await client.depositEscrow(permissionId, amount)
await client.reportOutcome({...})
await client.disputeSettlement(escrowId, reason)
await client.settle(escrowId)
await client.refundEscrow(escrowId)
```

## Escrow Reads

```ts
await client.getEscrow(escrowId)
await client.previewSettlement(escrowId)
```

## ERC-8004 Trust

```ts
await client.checkAgentTrust(agentId, agentAddress)
await client.getTrustedReviewers()
await client.isIdentityEnforced()
await client.isReputationEnforced()
```

## Protocol Info

```ts
await client.getTotalProtocolFees()
await client.getTreasury()
```

## Static Utility

```ts
PrmissionClient.calculateSettlement(...)
```

## Event Listeners

```ts
client.onPermissionGranted(...)
client.onEscrowDeposited(...)
client.onSettlementCompleted(...)
client.onPermissionRevoked(...)
client.onDisputeFiled(...)
client.removeAllListeners()
```

## Exported Helpers

```ts
import { formatUsdc, parseUsdc } from "prmission-sdk";
```

## Development

```bash
git clone https://github.com/marcosbenaim-hub/prmission-ts-sdk.git
cd prmission-ts-sdk
npm install
npm run build
npm test
```

## Links

- https://prmission.com
- https://github.com/marcosbenaim-hub/Prmission-Protocol
- https://github.com/marcosbenaim-hub/prmission-ts-sdk
- https://www.npmjs.com/package/prmission-sdk

## License

MIT
