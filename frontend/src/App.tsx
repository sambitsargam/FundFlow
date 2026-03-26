import { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@onelabs/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import './App.css';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [campaignData, setCampaignData] = useState({
    title: '',
    description: '',
    goalAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createCampaign = async () => {
    if (!campaignData.title || !campaignData.goalAmount) {
      setMessage('Please fill in required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_tracker::create_campaign`,
        arguments: [
          tx.pure.string(campaignData.title),
          tx.pure.string(campaignData.description),
          tx.pure.u64(parseInt(campaignData.goalAmount)),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Campaign created:', result);
            setMessage('✅ Campaign created successfully!');
            setCampaignData({ title: '', description: '', goalAmount: '' });
          },
          onError: (error) => {
            console.error('Error:', error);
            setMessage('❌ Error creating campaign');
          },
        }
      );
    } catch (error) {
      console.error('Transaction error:', error);
      setMessage('❌ Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fundflow-app">
      <div className="wave-bg">
        <svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,300 Q300,100 600,300 T1200,300 L1200,600 L0,600 Z" fill="url(#gradient1)" opacity="0.3"/>
          <path d="M0,350 Q300,150 600,350 T1200,350 L1200,600 L0,600 Z" fill="url(#gradient2)" opacity="0.3"/>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981"/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <header className="fundflow-header">
        <div className="brand">
          <span className="brand-icon">💰</span>
          <span className="brand-name">FundFlow</span>
        </div>
        <ConnectButton />
      </header>

      <main className="fundflow-main">
        <div className="hero">
          <h1>Transparent <span className="accent">Donation Tracking</span></h1>
          <p>Track every donation with AI-powered analytics on OneChain blockchain</p>
        </div>

        {account ? (
          <div className="content">
            <div className="campaign-creator">
              <h2>Create Donation Campaign</h2>
              <div className="form">
                <input
                  type="text"
                  placeholder="Campaign Title *"
                  value={campaignData.title}
                  onChange={(e) => setCampaignData({ ...campaignData, title: e.target.value })}
                  disabled={loading}
                />
                <textarea
                  placeholder="Description"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                  disabled={loading}
                  rows={4}
                />
                <input
                  type="number"
                  placeholder="Goal Amount (in ONE) *"
                  value={campaignData.goalAmount}
                  onChange={(e) => setCampaignData({ ...campaignData, goalAmount: e.target.value })}
                  disabled={loading}
                />
                <button onClick={createCampaign} disabled={loading} className="create-btn">
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
                {message && <div className={`msg ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
              </div>
            </div>

            <div className="features">
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Real-Time Tracking</h3>
                <p>Monitor donations and fund utilization in real-time</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <h3>AI Analytics</h3>
                <p>Detect anomalies and analyze spending patterns</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🔍</div>
                <h3>Full Transparency</h3>
                <p>Every transaction recorded immutably on-chain</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="connect-box">
            <div className="connect-content">
              <div className="connect-icon">🔐</div>
              <h2>Connect Your Wallet</h2>
              <p>Start creating transparent donation campaigns</p>
            </div>
          </div>
        )}
      </main>

      <footer className="fundflow-footer">
        <p>FundFlow • Building Trust Through Transparency</p>
      </footer>
    </div>
  );
}

export default App;
