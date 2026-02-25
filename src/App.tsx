import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import Vault from './components/Vault';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const Navbar = ({ onConnect, userAddress, onLogout }: any) => (
  <header className="header">
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div className="logo">
        <Shield size={24} fill="var(--primary)" />
        Stack<span>Vault</span>
      </div>
      <nav className="nav-links">
        <a href="#about" className="nav-link">Protocol</a>
        <a href="#security" className="nav-link">Security</a>
        <a href="#stats" className="nav-link">Stats</a>
      </nav>
      {userAddress ? (
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem' }} onClick={onLogout}>
          Disconnect
        </button>
      ) : (
        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }} onClick={onConnect}>
          Connect Wallet
        </button>
      )}
    </div>
  </header>
);

const LandingPage = ({ onConnect }: any) => (
  <main>
    <section className="hero">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="hero-badge">Bitcoin-Backed Liquidity</span>
          <h1 className="hero-title">
            Secure Your <span>Liquidity</span> on Stacks
          </h1>
          <p className="hero-subtitle">
            StackVault is a next-generation liquidity protocol built on the security of Bitcoin. Deposit STX, provide liquidity, and earn returns in a decentralized vault.
          </p>
          <div className="hero-btns">
            <button className="btn btn-primary" onClick={onConnect}>
              Launch Protocol <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            </button>
            <button className="btn btn-secondary">
              View Whitepaper
            </button>
          </div>
        </motion.div>
      </div>
    </section>

    <section id="security" className="features">
      <div className="container">
        <h2 className="section-title">Built for Resilience</h2>
        <div className="features-grid">
          {[
            {
              icon: <Cpu size={24} />,
              title: "Smart Contract Safety",
              desc: "Engineered with audited Clarity smart contracts for maximum transparency and safety."
            },
            {
              icon: <Globe size={24} />,
              title: "Bitcoin Finality",
              desc: "Every transaction is secured by the computational power of the Bitcoin network."
            },
            {
              icon: <Lock size={24} />,
              title: "Non-Custodial",
              desc: "You always retain full control over your assets. Withdraw your liquidity at any time."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </main>
);

const App: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const handleConnect = () => {
    showConnect({
      appDetails: {
        name: 'StackVault',
        icon: window.location.origin + '/vite.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        setUserData(userSession.loadUserData());
      },
      userSession,
    });
  };

  const handleLogout = () => {
    userSession.signUserOut();
    setUserData(null);
  };

  const userAddress = userData?.profile?.stxAddress?.mainnet || userData?.profile?.stxAddress?.testnet;

  return (
    <div className="app">
      <Navbar 
        onConnect={handleConnect} 
        userAddress={userAddress} 
        onLogout={handleLogout} 
      />
      
      {userAddress ? (
        <Vault userAddress={userAddress} onLogout={handleLogout} />
      ) : (
        <LandingPage onConnect={handleConnect} />
      )}

      <footer>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
          <p>© 2026 StackVault Protocol. Built on Stacks (Bitcoin L2).</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
