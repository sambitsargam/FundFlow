import { useNavigate } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@onelabs/dapp-kit';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

function Landing() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const connectButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (account && shouldNavigate) { navigate('/app'); setShouldNavigate(false); }
  }, [account, shouldNavigate, navigate]);

  const handleGetStarted = () => {
    if (account) { navigate('/app'); }
    else {
      setShouldNavigate(true);
      setTimeout(() => { connectButtonRef.current?.querySelector('button')?.click(); }, 100);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  const features = [
    { icon: '💰', title: 'Transparent Funding', description: 'Every donation tracked immutably on OneChain blockchain.' },
    { icon: '🤖', title: 'AI Analytics', description: 'AI-powered anomaly detection and spending pattern analysis.' },
    { icon: '📊', title: 'Real-Time Tracking', description: 'Monitor fund utilization and campaign progress live.' },
    { icon: '🔍', title: 'Full Auditability', description: 'Complete on-chain audit trail for every transaction.' },
    { icon: '🌍', title: 'Global Reach', description: 'Accept donations from anywhere in the world instantly.' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately with no intermediaries.' },
  ];

  const steps = [
    { number: '01', title: 'Create Campaign', description: 'Set your goal and story', icon: '🚀' },
    { number: '02', title: 'Share & Promote', description: 'Reach your audience', icon: '📢' },
    { number: '03', title: 'Receive Donations', description: 'Funds flow on-chain', icon: '💸' },
    { number: '04', title: 'Withdraw Funds', description: 'Access your raised funds', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <motion.div
          className="absolute w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          animate={{ x: mousePosition.x - 200, y: mousePosition.y - 200 }}
          transition={{ type: 'spring', damping: 30 }}
        />
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 left-0 right-0 z-[100] glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }} onClick={() => navigate('/')}>
            <span className="text-3xl">💰</span>
            <span className="text-xl font-bold text-gradient-green">FundFlow</span>
          </motion.div>
          <div className="flex items-center gap-6">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/explore')} className="text-sm text-gray-300 hover:text-white transition-colors">
              Explore
            </motion.button>
            <div ref={connectButtonRef}><ConnectButton /></div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 z-0">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full mb-6">
              <span className="text-xl">🤖</span>
              <span className="text-xs font-medium">AI-Powered Donation Tracking</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Fund the Future<br />
              <span className="text-gradient-green">Transparently</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Create transparent donation campaigns on OneChain. Every transaction is tracked, verified, and auditable by anyone, anywhere.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-semibold text-lg flex items-center gap-2"
              >
                Start a Campaign
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/explore')}
                className="px-8 py-4 glass rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Explore Campaigns
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { value: '$2M+', label: 'Total Raised' },
                { value: '500+', label: 'Campaigns' },
                { value: '10K+', label: 'Donors' },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className="glass rounded-2xl p-5">
                  <div className="text-3xl font-bold text-gradient-green mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="relative py-20 px-6 z-0">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">Live <span className="text-gradient-green">Campaign Stats</span></h2>
            <p className="text-lg text-gray-400">Real-time funding transparency</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass rounded-3xl p-6 glow-green">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '💸', value: '$48,250', label: 'Raised Today', color: 'from-emerald-500 to-teal-500' },
                { icon: '👥', value: '1,284', label: 'Active Donors', color: 'from-blue-500 to-cyan-500' },
                { icon: '🎯', value: '94%', label: 'Goal Completion', color: 'from-emerald-600 to-blue-500' },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05, y: -5 }} className="glass rounded-2xl p-5 cursor-pointer text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}>{item.value}</div>
                  <div className="text-sm text-gray-400">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-6 z-0">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">Why <span className="text-gradient-green">FundFlow</span>?</h2>
            <p className="text-lg text-gray-400">Blockchain-powered crowdfunding</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="glass rounded-2xl p-6 cursor-pointer"
              >
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-6 z-0">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-lg text-gray-400">Launch your campaign in minutes</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="glass rounded-2xl p-6 relative"
              >
                <div className="text-5xl font-bold text-white/10 absolute top-3 right-3">{step.number}</div>
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 z-0">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass rounded-3xl p-12 glow-green">
            <h2 className="text-4xl font-bold mb-4">Ready to Fund Change?</h2>
            <p className="text-lg text-gray-400 mb-8">Launch your transparent campaign today</p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(16, 185, 129, 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-lg"
            >
              Launch Campaign →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-10 px-6 z-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💰</span>
                <span className="text-lg font-bold text-gradient-green">FundFlow</span>
              </div>
              <p className="text-gray-400 text-xs">Transparent funding on OneChain blockchain</p>
            </div>
            {[
              { title: 'Product', links: ['Campaigns', 'Analytics', 'Security'] },
              { title: 'Resources', links: ['Documentation', 'API', 'Support'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-3 text-sm">{col.title}</h4>
                {col.links.map((link, j) => (
                  <div key={j} className="text-gray-400 text-xs mb-2 hover:text-white cursor-pointer transition-colors">{link}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs">© 2026 FundFlow. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-400">
              <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
              <span className="hover:text-white cursor-pointer transition-colors">Discord</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
