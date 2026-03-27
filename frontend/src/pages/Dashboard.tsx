import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@onelabs/dapp-kit';
import { Transaction } from '@onelabs/sui/transactions';
import { motion, AnimatePresence } from 'framer-motion';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

function Dashboard() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [activeTab, setActiveTab] = useState<'create' | 'my-campaigns' | 'donate'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiChecking, setAiChecking] = useState(false);
  const [campaignData, setCampaignData] = useState({ title: '', description: '', goalAmount: '' });
  const [donateData, setDonateData] = useState({ campaignId: '', amount: '', donateMessage: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Fetch ALL campaigns for donate tab
  const { data: allCampaignEvents, isLoading: campaignsLoading } = useSuiClientQuery('queryEvents', {
    query: { MoveEventType: `${PACKAGE_ID}::donation_tracker::CampaignCreated` },
    limit: 50,
  });

  const allCampaigns = allCampaignEvents?.data || [];
  const myCampaigns = allCampaigns.filter((e: any) => e.parsedJson?.owner === account?.address);

  // AI genuineness check — returns score 0-100
  const checkWithAI = async () => {
    if (!campaignData.title || !campaignData.description || !campaignData.goalAmount) {
      setMessage('Please fill in all fields before AI check');
      return;
    }
    setAiChecking(true);
    setAiScore(null);
    setAiAnalysis('');
    setMessage('');
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
            content: `You are a crowdfunding fraud detection AI. Analyze this campaign for genuineness and legitimacy. Return ONLY a JSON object with two fields: "score" (integer 0-100, where 100 is completely genuine) and "reason" (one sentence explanation). Campaign Title: "${campaignData.title}", Description: "${campaignData.description}", Goal Amount: ${campaignData.goalAmount} OTC tokens.`,
          }],
          max_tokens: 150,
        }),
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const score = parseInt(parsed.score) || 0;
      setAiScore(score);
      setAiAnalysis(parsed.reason || '');
    } catch {
      setAiScore(50);
      setAiAnalysis('Could not complete AI analysis. Proceeding with caution.');
    } finally {
      setAiChecking(false);
    }
  };

  const createCampaign = async () => {
    if (aiScore === null) { setMessage('Please run AI verification first'); return; }
    if (aiScore < 75) { setMessage(`❌ AI score ${aiScore}/100 — below 75. Campaign blocked as potentially fraudulent.`); return; }
    setLoading(true);
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
        onSuccess: () => {
          setMessage('✅ Campaign created successfully!');
          setCampaignData({ title: '', description: '', goalAmount: '' });
          setAiScore(null);
          setAiAnalysis('');
        },
        onError: () => setMessage('❌ Error creating campaign'),
      });
    } catch { setMessage('❌ Transaction failed'); }
    finally { setLoading(false); }
  };

  const selectCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDonateData({ ...donateData, campaignId: campaign.parsedJson?.campaign_id || '' });
  };

  const donate = async () => {
    if (!donateData.campaignId || !donateData.amount) { setMessage('Please select a campaign and enter amount'); return; }
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
          tx.pure.string(donateData.donateMessage || 'Supporting this campaign!'),
        ],
      });
      signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          setMessage('✅ Donation successful! Thank you!');
          setDonateData({ campaignId: '', amount: '', donateMessage: '' });
          setSelectedCampaign(null);
        },
        onError: () => setMessage('❌ Donation failed'),
      });
    } catch { setMessage('❌ Transaction failed'); }
    finally { setLoading(false); }
  };

  const scoreColor = aiScore === null ? '' : aiScore >= 75 ? 'text-emerald-400' : aiScore >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = aiScore === null ? '' : aiScore >= 75 ? 'bg-emerald-500/10 border-emerald-500/30' : aiScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30';

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Campaign Dashboard</h1>
          <p className="text-gray-400 text-sm font-mono">{account.address.slice(0, 24)}...</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 glass rounded-xl p-1 w-fit">
          {(['create', 'my-campaigns', 'donate'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage(''); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* ── CREATE CAMPAIGN ── */}
        {activeTab === 'create' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Create New Campaign</h2>
            <p className="text-sm text-gray-400 mb-6">AI must score your campaign ≥ 75/100 before it can go live.</p>

            {/* AI Score Result */}
            <AnimatePresence>
              {aiScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mb-6 p-4 rounded-xl border ${scoreBg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">🤖 AI Genuineness Score</span>
                    <span className={`text-2xl font-bold ${scoreColor}`}>{aiScore}/100</span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${aiScore >= 75 ? 'bg-emerald-500' : aiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${aiScore}%` }}
                    />
                  </div>
                  <p className={`text-xs ${scoreColor}`}>{aiAnalysis}</p>
                  {aiScore >= 75
                    ? <p className="text-xs text-emerald-400 mt-1 font-semibold">✅ Passed — you can create this campaign</p>
                    : <p className="text-xs text-red-400 mt-1 font-semibold">❌ Failed — score must be 75+ to proceed</p>
                  }
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-4">
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Campaign Title *"
                value={campaignData.title}
                onChange={(e) => { setCampaignData({ ...campaignData, title: e.target.value }); setAiScore(null); }}
                disabled={loading}
              />
              <textarea
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder="Campaign Description — be detailed and honest *"
                rows={4}
                value={campaignData.description}
                onChange={(e) => { setCampaignData({ ...campaignData, description: e.target.value }); setAiScore(null); }}
                disabled={loading}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Goal Amount (OTC) *"
                type="number"
                value={campaignData.goalAmount}
                onChange={(e) => { setCampaignData({ ...campaignData, goalAmount: e.target.value }); setAiScore(null); }}
                disabled={loading}
              />

              {/* Step 1: AI Check */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkWithAI}
                disabled={aiChecking || loading}
                className="py-3 glass border border-emerald-500/40 rounded-xl font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
              >
                {aiChecking ? '🤖 Analyzing...' : '🤖 Step 1: Run AI Verification'}
              </motion.button>

              {/* Step 2: Create (only enabled if score >= 75) */}
              <motion.button
                whileHover={{ scale: aiScore !== null && aiScore >= 75 ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={createCampaign}
                disabled={loading || aiScore === null || aiScore < 75}
                className="py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Creating...' : aiScore === null ? '🔒 Step 2: Create Campaign (verify first)' : aiScore < 75 ? `🔒 Blocked — Score ${aiScore}/100 < 75` : '🚀 Step 2: Create Campaign'}
              </motion.button>

              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' : message.includes('❌') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {message}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── MY CAMPAIGNS ── */}
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
                    <p className="text-sm text-gray-400 mb-2">Goal: {(e.parsedJson?.goal_amount / 1e9 || 0).toFixed(2)} OTC</p>
                    <p className="text-xs text-gray-500 font-mono break-all">Campaign ID: {e.parsedJson?.campaign_id}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── DONATE ── */}
        {activeTab === 'donate' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-2">Donate to a Campaign</h2>
            <p className="text-sm text-gray-400 mb-6">Select a campaign below, then enter your donation amount.</p>

            {/* Campaign List */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Available Campaigns</h3>
              {campaignsLoading ? (
                <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">Loading campaigns...</div>
              ) : allCampaigns.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">No campaigns found on-chain yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {allCampaigns.map((e: any, i: number) => {
                    const isSelected = selectedCampaign === e;
                    return (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => selectCampaign(e)}
                        className={`rounded-xl p-4 cursor-pointer border transition-all ${isSelected ? 'bg-emerald-500/15 border-emerald-500/60' : 'glass border-white/10 hover:border-emerald-500/30'}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-sm">{e.parsedJson?.title || 'Untitled Campaign'}</h4>
                          {isSelected && <span className="text-emerald-400 text-xs font-bold">✓ Selected</span>}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Goal: {(e.parsedJson?.goal_amount / 1e9 || 0).toFixed(1)} OTC</p>
                        <p className="text-xs text-gray-500 font-mono break-all">{e.parsedJson?.owner}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Donate Form */}
            <div className="glass rounded-2xl p-6">
              {selectedCampaign && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="text-emerald-400 font-semibold">Donating to: </span>
                  <span className="text-white">{selectedCampaign.parsedJson?.title}</span>
                </div>
              )}
              <div className="flex flex-col gap-4">
                <input
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Amount (OTC) *"
                  type="number"
                  value={donateData.amount}
                  onChange={(e) => setDonateData({ ...donateData, amount: e.target.value })}
                  disabled={loading}
                />
                <input
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Message (optional)"
                  value={donateData.donateMessage}
                  onChange={(e) => setDonateData({ ...donateData, donateMessage: e.target.value })}
                  disabled={loading}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={donate}
                  disabled={loading || !selectedCampaign}
                  className="py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Processing...' : !selectedCampaign ? '👆 Select a campaign above' : '💸 Donate Now'}
                </motion.button>
                {message && (
                  <div className={`p-3 rounded-xl text-sm text-center ${message.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' : message.includes('❌') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
