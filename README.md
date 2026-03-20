# Prmission-sdk

[![npm](https://img.shields.io/npm/v/prmission-sdk.svg)](https://www.npmjs.com/package/prmission-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052FF.svg)](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d)

**The economic layer for AI agent commerce.**  
AI agents pay users directly for permission to access data.

The official TypeScript SDK for Prmission — a consent-gated escrow protocol for AI agent commerce, live on Base.

---

## ⚡ Live on Base Mainnet

- **Contract:** https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d  
- **Network:** Base  
- **Settlement:** USDC  
- **Protocol Fee:** 3% (on-chain)  

---

## 🎬 Live Demo

This repo includes a simple UI playground (Vite) under `examples/ui`.

To host it on Netlify, connect the repo in `app.netlify.com` and deploy.
The included `netlify.toml` sets:

- Build command: `npm run ui:build`
- Publish directory: `examples/ui/dist`

## 🖥 Interactive Interface

<img width="523" height="544" alt="Prmission demo interface" src="https://github.com/user-attachments/assets/7154fdfc-8d20-4fae-8a69-bdccb6dffd96" />

### What you're experiencing

An interactive flow of agent-to-user transactions:

1. Agent sends a data access request  
2. User sets their rate and grants or revokes access  
3. If granted, the agent escrows USDC  
4. Outcome is reported on-chain  
5. Settlement executes  

Demonstrates how Prmission enables consent-based, paid data access between AI agents and users.
---

## 🚀 60-Second Quickstart

```bash
npm install prmission-sdk
```

## 🧠 What This Is

Prmission is the economic layer for AI agents.

Instead of scraping or guessing:
- Agents request permission
- Users set terms
- Agents pay in USDC upfront in escrow
- Settlement is enforced on-chain

## 💥 Why This Matters

Prevents unauthorized data access by AI agents, while enabling agents to access high-quality, consented data from real users.

- Replaces ads with direct payments to users  
- Eliminates wasted CAC by paying for guaranteed engagement  
- Converts data access from extraction → explicit permission  
- Ensures compliance by design through on-chain consent  
- Unlocks high-signal data for agents instead of noisy scraped data  
- Built for autonomous agents transacting at scale

## 🧩 Use Cases

Use cases for a world where agents transact directly with users on-chain:

- Autonomous AI agents paying users for on-chain and off-chain data access  
- Wallet-level data licensing for personalization, trading, and recommendations  
- On-chain market research with guaranteed, paid user responses  
- Creator monetization through direct, permissioned audience access  
- Agent-to-user transactions using USDC escrow and on-chain settlement  
- ERC-8004 identity and reputation-gated data access  

- ## Quickstart Example

```ts
import { PrmissionClient, PrmissionNetwork, parseUsdc } from "prmission-sdk";
import { ethers } from "ethers";

// Read-only client (no signer required)
const created = PrmissionClient.create({
  network: PrmissionNetwork.BaseMainnet,
});
if (!created.ok) throw created.error;
const client = created.value;

// Write client (requires a signer)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const write = client.withSigner(signer);

const permissionIdResult = await write.grantPermission({
  dataCategory: "browsing",
  purpose: "consented data access",
  compensationBps: 2000,
  validityPeriod: 86400,
});
if (!permissionIdResult.ok) throw permissionIdResult.error;
const permissionId = permissionIdResult.value;

const escrowIdResult = await write.depositEscrow(permissionId, parseUsdc("1.00"));
if (!escrowIdResult.ok) throw escrowIdResult.error;
const escrowId = escrowIdResult.value;

const reported = await write.reportOutcome({
  escrowId,
  outcomeValue: parseUsdc("1.00"),
  outcomeType: "completed",
  outcomeDescription: "example outcome",
});
if (!reported.ok) throw reported.error;

// Settlement is only possible after the dispute window.
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
npm run examples:smoke
npm run ui:dev
```

## Links

- https://prmission.com
- https://github.com/marcosbenaim-hub/Prmission-Protocol
- https://github.com/marcosbenaim-hub/prmission-ts-sdk
- https://www.npmjs.com/package/prmission-sdk

## License

MIT
