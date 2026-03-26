import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OneChainProvider, WalletProvider } from '@onelabs/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@onelabs/dapp-kit/dist/index.css';
import App from './App';

const queryClient = new QueryClient();

const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OneChainProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider>
          <App />
        </WalletProvider>
      </OneChainProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
