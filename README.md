# Prmission TypeScript SDK

TypeScript SDK for integrating consent-gated data access, escrow, and USDC settlement into AI agents and apps on Base.

Official SDK for the Prmission Protocol.

## Why this SDK

Prmission lets apps and autonomous agents request permission, escrow USDC, report outcomes, and settle payments on-chain.

Use this SDK if you are building:
- AI agent payment flows
- consent-gated data transactions
- merchant or marketplace backends
- wallets or frontends on Base
- developer tooling around Prmission Protocol

## Live protocol defaults

- Base Mainnet contract: `0x0c8B16a57524f4009581B748356E01e1a969223d`
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Protocol fee: `3%`
- Dispute window: `24 hours`

## Install

```bash
npm install @prmission/sdk ethers