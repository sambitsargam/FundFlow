import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@onelabs/dapp-kit';
import { Transaction } from '@onelabs/sui/transactions';
import { motion } from 'framer-motion';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

function Dashboard() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [activeTab, setActiveTab] = useState<'create' | 'my-campaigns' | 'donate'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [campaignData, setCampaignData] = useState({ title: '', description: '', goalAmount: '' });
  const [donateData, setDonateData] = useState({ campaignId: '', amount: '', message: '' });

  // Fetch user's campaigns
  const { data: campaignEvents } = useSuiClientQuery('queryEvents', {
    query: { MoveEventType: `${PACKAGE_ID}::donation_tracker::CampaignCreated` },
    limit: 20,
  });

  const analyzeWithAI = async (title: string, description: string, goal: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: `Analyze this crowdfunding campaign and give a brief 2-sentence assessment of its viability and trustworthiness. Title: "${title}", Description: "${description}", Goal: $${goal}`,
          }],
          max_tokens: 100,
        }),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch { return ''; }
  };

  const createCampaign = async () => {
    if (!campaignData.title || !campaignData.goalAmount) { setMessage('Please fill in required fields'); return; }
    setLoading(true);
    setMessage('🤖 AI analyzing campaign...');
    const analysis = await analyzeWithAI(campaignData.title, campaignData.description, campaignData.goalAmount);
    if (analysis) setAiAnalysis(analysis);
    setMessage('Creating campaign on-chain...');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_tracker::create_campaign`,
        arguments: [
          tx.pure.string(campaignData.title),
          tx.pure.string(campaignData.description),
          tx.pure.u64(parseInt(campaignData.goalAmount) * 1_000_000_000),
        ],
      });
      signAndExecute({ transaction: tx }, {
        onSuccess: () => { setMessage('✅ Campaign created successfully!'); setCampaignData({ title: '', description: '', goalAmount: '' }); },
        onError: () => setMessage('❌ Error creating campaign'),
      });
    } catch { setMessage('❌ Transaction failed'); }
    finally { setLoading(false); }
  };

  const donate = async () => {
    if (!donateData.campaignId || !donateData.amount) { setMessage('Please fill in required fields'); return; }
    setLoading(true);
    setMessage('Processing donation...');
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(parseInt(donateData.amount) * 1_000_000_000)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_tracker::donate`,
        arguments: [
          tx.object(donateData.campaignId),
          coin,
          tx.pure.string(donateData.message || 'Supporting this campaign!'),
        ],
      });
      signAndExecute({ transaction: tx }, {
        onSuccess: () => { setMessage('✅ Donation successful! Thank you!'); setDonateData({ campaignId: '', amount: '', message: '' }); },
        onError: () => setMessage('❌ Donation failed'),
      });
    } catch { setMessage('❌ Transaction failed'); }
    finally { setLoading(false); }
  };

  const myCampaigns = campaignEvents?.data?.filter(
    (e: any) => e.parsedJson?.owner === account?.address
  ) || [];

  if (!account) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center glass rounded-3xl p-12">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect to create and manage campaigns</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }} onClick={() => navigate('/')}>
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-gradient-green">FundFlow</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/explore')} className="text-sm text-gray-300 hover:text-white transition-colors">Explore</button>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Campaign Dashboard</h1>
          <p className="text-gray-400 text-sm font-mono">{account.address.slice(0, 20)}...</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 glass rounded-xl p-1 w-fit">
          {(['create', 'my-campaigns', 'donate'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage(''); setAiAnalysis(''); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Create Campaign */}
        {activeTab === 'create' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Campaign</h2>
            {aiAnalysis && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300">
                🤖 AI Analysis: {aiAnalysis}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Campaign Title *"
                value={campaignData.title}
                onChange={(e) => setCampaignData({ ...campaignData, title: e.target.value })}
                disabled={loading}
              />
              <textarea
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder="Campaign Description"
                rows={4}
                value={campaignData.description}
                onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                disabled={loading}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Goal Amount (ONE) *"
                type="number"
                value={campaignData.goalAmount}
                onChange={(e) => setCampaignData({ ...campaignData, goalAmount: e.target.value })}
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createCampaign}
                disabled={loading}
                className="py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {loading ? '⏳ Processing...' : '🚀 Create Campaign'}
              </motion.button>
              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' : message.includes('❌') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {message}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* My Campaigns */}
        {activeTab === 'my-campaigns' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">My Campaigns</h2>
            {myCampaigns.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🚀</div>
                <p className="text-gray-400 mb-4">No campaigns yet</p>
                <button onClick={() => setActiveTab('create')} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-semibold">
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {myCampaigns.map((e: any, i: number) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-2">{e.parsedJson?.title}</h3>
                    <p className="text-sm text-gray-400 mb-3">Goal: {(e.parsedJson?.goal_amount / 1e9).toFixed(2)} ONE</p>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">45% funded</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Donate */}
        {activeTab === 'donate' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Donate to Campaign</h2>
            <div className="flex flex-col gap-4">
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                placeholder="Campaign Object ID *"
                value={donateData.campaignId}
                onChange={(e) => setDonateData({ ...donateData, campaignId: e.target.value })}
                disabled={loading}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Amount (ONE) *"
                type="number"
                value={donateData.amount}
                onChange={(e) => setDonateData({ ...donateData, amount: e.target.value })}
                disabled={loading}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Message (optional)"
                value={donateData.message}
                onChange={(e) => setDonateData({ ...donateData, message: e.target.value })}
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={donate}
                disabled={loading}
                className="py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {loading ? '⏳ Processing...' : '💸 Donate Now'}
              </motion.button>
              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' : message.includes('❌') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {message}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
