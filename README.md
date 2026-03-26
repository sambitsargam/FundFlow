# 💰 FundFlow - Transparent Donation Tracking Platform

FundFlow is a decentralized donation tracking platform built on OneChain that ensures transparency and accountability in fund management with AI-powered analytics.

## Features

- **Real-Time Tracking**: Monitor donations and fund utilization in real-time
- **AI Analytics**: Detect anomalies and analyze spending patterns
- **Full Transparency**: Every transaction recorded immutably on-chain
- **Donor Records**: Complete donation history for all contributors

## Project Structure

```
FundFlow/
├── contracts/          # Move smart contracts
│   ├── Move.toml
│   └── sources/
│       └── fundflow.move
└── frontend/           # React TypeScript frontend
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   └── main.tsx
    └── .env
```

## Prerequisites

- Rust (stable)
- Node.js 18+
- OneChain CLI installed
- OneChain wallet with testnet ONE tokens

## Installation & Deployment

### 1. Setup OneChain

```bash
git clone https://github.com/one-chain-labs/onechain.git
cd onechain
cargo install --path crates/one --locked --features tracing
one client new-env --alias testnet --rpc https://rpc-testnet.onelabs.cc:443
one client switch --env testnet
one client faucet
```

### 2. Deploy Contract

```bash
cd FundFlow/contracts
one move build
one client publish --gas-budget 50000000 .
```

### 3. Configure Frontend

Update `frontend/.env`:
```
VITE_PACKAGE_ID=0x<your_package_id>
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Connect your OneChain wallet
2. Create a donation campaign with title, description, and goal
3. Share campaign with potential donors
4. Donors contribute ONE tokens
5. Track donations in real-time
6. Campaign owner can withdraw funds
7. AI analyzes transaction patterns

## Smart Contract Functions

- `create_campaign`: Create a new donation campaign
- `donate`: Make a donation to a campaign
- `withdraw_funds`: Withdraw funds (owner only)
- `get_campaign_info`: View campaign details
- `get_total_donors`: Get donor count

## Technology Stack

- **Blockchain**: OneChain (Move language)
- **Frontend**: React + TypeScript + Vite
- **Styling**: Custom CSS with wave animations
- **Wallet Integration**: @onelabs/dapp-kit

## License

MIT License
