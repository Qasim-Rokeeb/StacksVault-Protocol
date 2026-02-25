import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ArrowRight,
  Cpu,
  Globe,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStacksWallet } from './hooks/useStacksWallet';
import Vault from './components/Vault';
import Dashboard from './components/Dashboard';

interface NavbarProps {
  onConnect: () => void;
  userAddress: string | null;
  onLogout: () => void;
  isConnecting: boolean;
  activeView: 'dashboard' | 'vault' | 'landing';
  onNavigate: (view: 'dashboard' | 'vault') => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onConnect, 
  userAddress, 
  onLogout, 
  isConnecting, 
  activeView, 
  onNavigate 
}) => (
  <header className="header">
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div className="logo" onClick={() => userAddress ? onNavigate('dashboard') : null} style={{ cursor: userAddress ? 'pointer' : 'default' }}>
        <Shield size={24} fill="var(--primary)" />
        Stack<span>Vault</span>
      </div>
      <nav className="nav-links">
        {userAddress ? (
          <>
            <button 
              onClick={() => onNavigate('dashboard')} 
              className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeView === 'dashboard' ? 'var(--primary)' : 'inherit' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('vault')} 
              className={`nav-link ${activeView === 'vault' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeView === 'vault' ? 'var(--primary)' : 'inherit' }}
            >
              Vault Manager
            </button>
          </>
        ) : (
          <>
            <a href="#about" className="nav-link">Protocol</a>
            <a href="#security" className="nav-link">Security</a>
            <a href="#stats" className="nav-link">Stats</a>
          </>
        )}
      </nav>
      {userAddress ? (
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem' }} onClick={onLogout}>
          Disconnect
        </button>
      ) : (
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.5rem 1.5rem', opacity: isConnecting ? 0.7 : 1 }} 
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  </header>
);

interface LandingPageProps {
  onConnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onConnect, isConnecting, error }) => (
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
            <button 
              className="btn btn-primary" 
              onClick={onConnect}
              disabled={isConnecting}
              style={{ opacity: isConnecting ? 0.7 : 1 }}
            >
              {isConnecting ? 'Connecting...' : 'Launch Protocol'} 
              {!isConnecting && <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />}
            </button>
            <button className="btn btn-secondary">
              View Whitepaper
            </button>
          </div>
          {error && (
            <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>
              Error: {error}
            </p>
          )}
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
  const { 
    userAddress, 
    handleConnect, 
    handleDisconnect, 
    isConnecting, 
    error 
  } = useStacksWallet();

  const [activeView, setActiveView] = useState<'dashboard' | 'vault'>('dashboard');

  // Protection logic: if disconnected, reset active view
  useEffect(() => {
    if (!userAddress) {
      setActiveView('dashboard'); // Default for next login
    }
  }, [userAddress]);

  const renderContent = () => {
    if (!userAddress) {
      return <LandingPage onConnect={handleConnect} isConnecting={isConnecting} error={error} />;
    }

    if (activeView === 'vault') {
      return <Vault userAddress={userAddress} onLogout={handleDisconnect} />;
    }

    return (
      <Dashboard 
        userAddress={userAddress} 
        onNavigateToVault={() => setActiveView('vault')} 
      />
    );
  };

  return (
    <div className="app">
      <Navbar 
        onConnect={handleConnect} 
        userAddress={userAddress} 
        onLogout={handleDisconnect} 
        isConnecting={isConnecting}
        activeView={userAddress ? activeView : 'landing'}
        onNavigate={(view) => setActiveView(view)}
      />
      
      {renderContent()}

      <footer>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
          <p>© 2026 StackVault Protocol. Built on Stacks (Bitcoin L2).</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
