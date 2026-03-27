import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@onelabs/dapp-kit';
import { motion } from 'framer-motion';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

function CampaignCard({ campaign, donationEvents, onDonate }: {
  campaign: any;
  donationEvents: any[];
  onDonate: () => void;
}) {
  const campaignId = campaign.parsedJson?.campaign_id;
  const goalRaw = campaign.parsedJson?.goal_amount || 0;
  const goal = goalRaw / 1e9;

  // Sum all donations for this campaign from DonationMade events
  const raisedRaw = donationEvents
    .filter((d: any) => d.parsedJson?.campaign_id === campaignId)
    .reduce((sum: number, d: any) => sum + (parseInt(d.parsedJson?.amount) || 0), 0);
  const raised = raisedRaw / 1e9;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="glass rounded-2xl p-6 cursor-pointer flex flex-col"
    >
      <div className="text-3xl mb-3">🎯</div>
      <h3 className="text-lg font-bold mb-1">{campaign.parsedJson?.title || 'Campaign'}</h3>
      <p className="text-xs text-gray-500 font-mono break-all mb-3">{campaign.parsedJson?.owner}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-400 font-semibold">{raised.toFixed(2)} OTC raised</span>
          <span className="text-gray-400">Goal: {goal.toFixed(2)} OTC</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct}% funded</p>
      </div>

      <button
        onClick={onDonate}
        className="mt-auto w-full py-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium hover:from-emerald-500/30 hover:to-blue-500/30 transition-all"
      >
        Donate Now
      </button>
    </motion.div>
  );
}

function Explore() {
  const navigate = useNavigate();
  const account = useCurrentAccount();

  const { data: campaignEvents, isLoading: loadingCampaigns } = useSuiClientQuery('queryEvents', {
    query: { MoveEventType: `${PACKAGE_ID}::donation_tracker::CampaignCreated` },
    limit: 50,
  });

  const { data: donationEvents, isLoading: loadingDonations } = useSuiClientQuery('queryEvents', {
    query: { MoveEventType: `${PACKAGE_ID}::donation_tracker::DonationMade` },
    limit: 200,
  });

  const campaigns = campaignEvents?.data || [];
  const donations = donationEvents?.data || [];
  const isLoading = loadingCampaigns || loadingDonations;

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
              <CampaignCard
                key={i}
                campaign={e}
                donationEvents={donations}
                onDonate={() => navigate('/app')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
