# Examples

Examples are small, runnable scripts that demonstrate the SDK's public API.

## Setup

Examples default to Base mainnet and the default Prmission contract. You can
override configuration with environment variables:

- `PRMISSION_NETWORK`: `base-mainnet` (default), `base-sepolia`, `custom`
- `PRMISSION_RPC_URL`: Optional for mainnet/sepolia, required for `custom`
- `PRMISSION_CONTRACT_ADDRESS`: Optional for mainnet, required for sepolia/custom
- `PRMISSION_CHAIN_ID`: Optional (custom only)

## Run

From the repo root:

- `npm run examples:smoke`
- `npm run examples:permission` (set `PERMISSION_ID`)
- `npm run examples:escrow` (set `ESCROW_ID`)

## Full Flow (Writes)

The end-to-end write flow requires a funded wallet:

- `npm run examples:flow`
- Requires `PRIVATE_KEY` and `PRMISSION_RPC_URL`

