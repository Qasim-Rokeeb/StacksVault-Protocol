import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Shield, 
  ArrowRight,
  Cpu,
  Globe,
  Lock,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStacksWallet } from './hooks/useStacksWallet';
import { VaultProvider } from './hooks/useVault';

const Vault = lazy(() => import('./components/Vault'));
const Dashboard = lazy(() => import('./components/Dashboard'));
import Button from './components/Button';
import { Toaster } from 'react-hot-toast';

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
  <header className="header" role="banner">
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <button
        type="button"
        className="logo"
        onClick={() => userAddress ? onNavigate('dashboard') : null}
        style={{ cursor: userAddress ? 'pointer' : 'default' }}
        disabled={!userAddress}
        aria-label={userAddress ? 'Go to dashboard' : 'StackVault'}
      >
        <Shield size={24} fill="var(--primary)" />
        Stack<span>Vault</span>
      </button>
      <nav className="nav-links" style={{ alignItems: 'center' }} aria-label="Primary navigation">
        {userAddress && (userAddress.startsWith('SP') || userAddress.startsWith('SM')) && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(239,68,68,0.3)' }}>
            ⚠️ Unsupported Network (Switch to Testnet)
          </div>
        )}
        <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)', marginRight: '1rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }}></div>
          Testnet
        </div>
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
        <Button variant="secondary" onClick={onLogout}>
          Disconnect
        </Button>
      ) : (
        <Button 
          variant="primary" 
          onClick={onConnect}
          isLoading={isConnecting}
        >
          Connect Wallet
        </Button>
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
  <>
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
            <Button 
              variant="primary" 
              size="lg"
              onClick={onConnect}
              isLoading={isConnecting}
              aria-label="Connect wallet and launch protocol"
            >
              Launch Protocol {!isConnecting && <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />}
            </Button>
            <Button variant="secondary" size="lg" aria-label="View protocol whitepaper">
              View Whitepaper
            </Button>
          </div>
          {error && (
            <p role="alert" style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>
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
  </>
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
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <VaultProvider>
        <Navbar 
          onConnect={handleConnect} 
          userAddress={userAddress} 
          onLogout={handleDisconnect} 
          isConnecting={isConnecting}
          activeView={userAddress ? activeView : 'landing'}
          onNavigate={(view) => setActiveView(view)}
        />
        
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
          },
        }} />
        
        <Suspense fallback={
          <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p style={{ color: 'var(--muted)', fontWeight: '600', letterSpacing: '0.05em' }}>Loading modules...</p>
          </div>
        }>
          <main id="main-content" tabIndex={-1}>
            {renderContent()}
          </main>
        </Suspense>

        <footer role="contentinfo">
          <div className="container" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
            <p>© 2026 StackVault Protocol. Built on Stacks (Bitcoin L2).</p>
          </div>
        </footer>
      </VaultProvider>
    </div>
  );
};

export default App;
