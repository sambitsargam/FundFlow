import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@onelabs/dapp-kit';
import '@onelabs/dapp-kit/dist/index.css';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

const networks = {
  testnet: { url: import.meta.env.VITE_RPC_URL || 'https://rpc-testnet.onelabs.cc:443' },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
