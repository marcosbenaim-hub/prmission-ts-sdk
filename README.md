# Prmission TypeScript SDK

The official TypeScript SDK for [Prmission Protocol](https://github.com/marcosbenaim-hub/Prmission-Protocol) — consent-gated escrow and USDC settlement for AI agent commerce on Base.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052FF.svg)](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d)

---

## Overview

Prmission SDK gives developers programmatic access to the Prmission Protocol — enabling AI agents to request consent, deposit escrow, and settle payments in USDC on Base mainnet.

**Protocol Contract:** [`0x0c8B16a57524f4009581B748356E01e1a969223d`](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d#code)

---

## Installation

```bash
npm install prmission-sdk
```

---

## Quick Start

```typescript
import { PrmissionSDK } from 'prmission-sdk';

// Initialize
const prmission = new PrmissionSDK({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY,
});

// 1. User grants permission
const permissionId = await prmission.grantPermission({
  agent: '0xAgentAddress',
  dataType: 'browsing-history',
  compensationBps: 2000, // 20% to user
  duration: 86400, // 24 hours
});

// 2. Agent deposits escrow (USDC)
const escrowId = await prmission.depositEscrow({
  permissionId,
  amount: '50.00', // 50 USDC
});

// 3. Agent reports outcome
await prmission.reportOutcome({
  escrowId,
  outcomeValue: '50.00',
});

// 4. Settle after dispute window (24h)
const settlement = await prmission.settle({ escrowId });
// → User receives compensation
// → Protocol takes 3% fee
// → Agent receives remainder
```

---

## Core Functions

### Consent

| Function | Description |
|---|---|
| `grantPermission(params)` | Grant an agent scoped access to data |
| `revokePermission(permissionId)` | Revoke a previously granted permission |
| `getPermission(permissionId)` | Query permission details and status |
| `getUserPermissions(userAddress)` | List all permissions for a user |

### Escrow & Settlement

| Function | Description |
|---|---|
| `depositEscrow(params)` | Lock USDC into escrow for data access |
| `reportOutcome(params)` | Report value generated from data usage |
| `disputeSettlement(escrowId)` | Challenge a reported outcome |
| `settle(params)` | Distribute funds after dispute window |
| `refundEscrow(escrowId)` | Refund escrow after revocation or dispute |

### Queries

| Function | Description |
|---|---|
| `getEscrow(escrowId)` | Get escrow details and status |
| `getProtocolFee()` | Returns the protocol fee (300 bps / 3%) |
| `getDisputeWindow()` | Returns dispute window duration (24h) |

---

## Configuration

```typescript
const prmission = new PrmissionSDK({
  // Required
  rpcUrl: string,          // Base RPC endpoint
  privateKey: string,      // Wallet private key

  // Optional
  contractAddress: string, // Override default contract address
  paymentToken: string,    // Override USDC token address
});
```

### Network Defaults

| Parameter | Value |
|---|---|
| Contract | `0x0c8B16a57524f4009581B748356E01e1a969223d` |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Protocol Fee | 3% |
| Dispute Window | 24 hours |
| Revocation Grace | 60 seconds |

---

## For AI Agent Developers

Prmission SDK is designed to be called as a tool by autonomous AI agents. Here's how an agent framework like CrewAI or LangChain can use it:

```typescript
// Define Prmission as an agent tool
const prmissionTool = {
  name: 'prmission_pay',
  description: 'Pay for data access through consent-gated escrow',
  parameters: {
    permissionId: 'string',
    amount: 'string (USDC)',
  },
  execute: async ({ permissionId, amount }) => {
    const escrow = await prmission.depositEscrow({ permissionId, amount });
    return { escrowId: escrow.id, status: 'escrowed', txHash: escrow.txHash };
  },
};
```

---

## Development

```bash
# Clone
git clone https://github.com/marcosbenaim-hub/prmission-ts-sdk.git
cd prmission-ts-sdk

# Install
npm install

# Build
npm run build

# Test
npm test
```

---

## Protocol Documentation

- **Website:** [prmission.com](https://prmission.com)
- **Smart Contract (Verified):** [BaseScan](https://basescan.org/address/0x0c8B16a57524f4009581B748356E01e1a969223d#code)
- **Protocol Repo:** [Prmission-Protocol](https://github.com/marcosbenaim-hub/Prmission-Protocol)
- **ERC-8004 Spec:** [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

Built by [Marcos Benaim](https://github.com/marcosbenaim-hub) | [Prmission Protocol](https://prmission.com)
