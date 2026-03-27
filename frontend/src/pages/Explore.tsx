import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@onelabs/dapp-kit';
import { motion } from 'framer-motion';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

function Explore() {
  const navigate = useNavigate();
  const account = useCurrentAccount();

  const { data: campaignEvents, isLoading } = useSuiClientQuery('queryEvents', {
    query: { MoveEventType: `${PACKAGE_ID}::donation_tracker::CampaignCreated` },
    limit: 50,
  });

  const campaigns = campaignEvents?.data || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }} onClick={() => navigate('/')}>
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-gradient-green">FundFlow</span>
          </motion.div>
          <div className="flex items-center gap-4">
            {account && <button onClick={() => navigate('/app')} className="text-sm text-gray-300 hover:text-white transition-colors">Dashboard</button>}
            <ConnectButton />
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore <span className="text-gradient-green">Campaigns</span></h1>
          <p className="text-gray-400">Discover and support transparent campaigns on OneChain</p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-gray-400 mb-4">No campaigns yet. Be the first!</p>
            <button onClick={() => navigate('/app')} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-semibold">
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {campaigns.map((e: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="glass rounded-2xl p-6 cursor-pointer"
              >
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-bold mb-2">{e.parsedJson?.title || 'Campaign'}</h3>
                <p className="text-xs text-gray-400 mb-4 font-mono">{e.parsedJson?.owner?.slice(0, 16)}...</p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>Goal: {(e.parsedJson?.goal_amount / 1e9 || 0).toFixed(1)} OTC</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <p className="text-xs text-gray-500 font-mono break-all mb-3">{e.parsedJson?.owner}</p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium hover:from-emerald-500/30 hover:to-blue-500/30 transition-all"
                >
                  Donate Now
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
