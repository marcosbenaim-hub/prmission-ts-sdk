cd ~/prmission-ts-sdk
cat > README.md <<'EOF'
# prmission-sdk

The official TypeScript SDK for [Prmission Protocol](https://github.com/marcosbenaim-hub/Prmission-Protocol) — consent-gated escrow and USDC settlement for AI agent commerce on Base.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052FF.svg)](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d)
[![npm](https://img.shields.io/npm/v/prmission-sdk.svg)](https://www.npmjs.com/package/prmission-sdk)

---

## Overview

`PrmissionClient` wraps all `Prmission.sol` contract interactions with typed interfaces, automatic USDC allowance handling, and human-readable formatting.

Fully compatible with ethers v6.

**Protocol Contract:** [`0x0c8B16a57524f4009581B748356E01e1a969223d`](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d#code)  
**Network:** Base Mainnet  
**Payment Token:** USDC (6 decimals)  
**Protocol Fee:** 3% per settlement (`PROTOCOL_FEE_BPS`)  
**Dispute Window:** 24 hours (`DISPUTE_WINDOW_SECONDS`)

---

## Live Demo

Explore the protocol in action:

🔗 https://prmission-demo123.netlify.app

Simulates the full flow:
- Permission creation  
- USDC escrow deposit  
- Outcome reporting  
- Settlement  

---

## Installation

```bash
npm install prmission-sdk
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
new PrmissionClient(config: PrmissionConfig)
| Parameter       | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| contractAddress | string | ✅        | Deployed Prmission.sol address |
| rpcUrl          | string | optional | Base RPC endpoint              |

client.connect(signer)

await client.ensureAllowance(amount)
await client.getBalance(address)

await client.grantPermission({...})
await client.revokePermission(permissionId)
await client.expirePermission(permissionId)

await client.getPermission(permissionId)
await client.getUserPermissions(user)
await client.getActivePermissions(user)
await client.checkAccess(permissionId, agent)

await client.depositEscrow(permissionId, amount)
await client.reportOutcome({...})
await client.disputeSettlement(escrowId, reason)
await client.settle(escrowId)
await client.refundEscrow(escrowId)

await client.getEscrow(escrowId)
await client.previewSettlement(escrowId)

await client.checkAgentTrust(agentId, agentAddress)
await client.getTrustedReviewers()
await client.isIdentityEnforced()
await client.isReputationEnforced()

await client.getTotalProtocolFees()
await client.getTreasury()
PrmissionClient.calculateSettlement(...)
client.onPermissionGranted(...)
client.onEscrowDeposited(...)
client.onSettlementCompleted(...)
client.onPermissionRevoked(...)
client.onDisputeFiled(...)
client.removeAllListeners()
import { formatUsdc, parseUsdc } from "prmission-sdk";
git clone https://github.com/marcosbenaim-hub/prmission-ts-sdk.git
cd prmission-ts-sdk
npm install
npm run build
npm test
## Links

- https://prmission.com  
- https://github.com/marcosbenaim-hub/Prmission-Protocol  
- https://github.com/marcosbenaim-hub/prmission-ts-sdk  
- https://www.npmjs.com/package/prmission-sdk  

---

## License

MIT