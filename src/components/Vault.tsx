import React, { useState, useEffect } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../hooks/useVault';

interface VaultProps {
  userAddress: string;
  onLogout: () => void;
}

const Vault: React.FC<VaultProps> = ({ userAddress, onLogout }) => {
  const [amount, setAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(true);
  
  const { 
    depositSTX, 
    withdrawSTX, 
    fetchBalance, 
    fetchTotalLiquidity, 
    status, 
    txId, 
    userBalance, 
    totalLiquidity, 
    resetStatus 
  } = useVault();

  useEffect(() => {
    fetchBalance(userAddress);
    fetchTotalLiquidity();
  }, [userAddress, fetchBalance, fetchTotalLiquidity]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        resetStatus();
        setAmount('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, resetStatus]);

  const handleAction = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    if (isDepositing) {
      if (val < 1) {
        alert("Minimum deposit is 1 STX");
        return;
      }
      await depositSTX(val);
    } else {
      if (val > userBalance) {
        alert("Insufficient balance");
        return;
      }
      await withdrawSTX(val);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '8rem' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Upper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', 
                borderRadius: '100px', 
                fontSize: '0.75rem', 
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}>PROTOCOL ACTIVE</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Mainnet Beta</span>
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1' }}>Vault Manager</h2>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={onLogout}>
              Disconnect
            </button>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Connected Wallet</p>
              <p style={{ fontFamily: 'monospace', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--secondary)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {userAddress.slice(0, 6)}...{userAddress.slice(-6)}
                <ExternalLink size={14} className="text-muted" />
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
          {/* Action Card */}
          <div>
            <div style={{ background: 'var(--secondary)', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setIsDepositing(true)}
                  style={{ 
                    flex: 1, 
                    padding: '1.5rem', 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: isDepositing ? 'var(--primary)' : 'var(--muted)',
                    borderBottom: isDepositing ? '2px solid var(--primary)' : 'none',
                    transition: '0.2s'
                  }}
                >
                  Deposit
                </button>
                <button 
                  onClick={() => setIsDepositing(false)}
                  style={{ 
                    flex: 1, 
                    padding: '1.5rem', 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: !isDepositing ? 'var(--primary)' : 'var(--muted)',
                    borderBottom: !isDepositing ? '2px solid var(--primary)' : 'none',
                    transition: '0.2s'
                  }}
                >
                  Withdraw
                </button>
              </div>

              <div style={{ padding: '3rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Input Amount</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      Available: <span style={{ color: 'var(--foreground)', fontWeight: '600' }}>{isDepositing ? 'Unlimited' : `${userBalance.toLocaleString()} STX`}</span>
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '2rem', 
                        background: 'rgba(0,0,0,0.3)', 
                        border: '2px solid var(--border)', 
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: '800',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }} 
                    />
                    <div style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        onClick={() => !isDepositing && setAmount(userBalance.toString())}
                        style={{ padding: '0.4rem 0.825rem', background: 'rgba(255, 90, 0, 0.1)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        MAX
                      </button>
                      <span style={{ fontWeight: '800', fontSize: '1.25rem' }}>STX</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Protocol Fee</span>
                    <span style={{ fontWeight: '600' }}>0.00%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Estimated Yield (Yearly)</span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>+{(parseFloat(amount || '0') * 0.045).toFixed(2)} STX</span>
                  </div>
                </div>

                <button 
                  onClick={handleAction}
                  disabled={status === 'pending'}
                  className="btn btn-primary" 
                  style={{ 
                    width: '100%', 
                    padding: '1.5rem', 
                    fontSize: '1.25rem', 
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    opacity: status === 'pending' ? 0.7 : 1
                  }}
                >
                  {status === 'pending' ? <Loader2 className="animate-spin" /> : (isDepositing ? <ArrowDownCircle /> : <ArrowUpCircle />)}
                  {status === 'pending' ? 'Processing...' : (isDepositing ? 'Confirm Deposit' : 'Confirm Withdrawal')}
                </button>

                <AnimatePresence>
                  {status !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ 
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : (status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
                        border: '1px solid',
                        borderColor: status === 'success' ? '#10b981' : (status === 'error' ? '#ef4444' : 'var(--border)'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      {status === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
                      {status === 'error' && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
                      {status === 'pending' && <Loader2 size={18} className="animate-spin" />}
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', color: status === 'success' ? '#10b981' : (status === 'error' ? '#ef4444' : 'white') }}>
                          {status === 'success' ? 'Transaction Success!' : (status === 'error' ? 'Transaction Failed' : 'Transaction Pending')}
                        </p>
                        {txId && (
                          <a 
                            href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}
                          >
                            View in Explorer
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stats Pane */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'var(--secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><Zap size={24} /></div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current APY</p>
                <h4 style={{ fontSize: '2rem', fontWeight: '800' }}>4.52%</h4>
              </div>
              <div style={{ background: 'var(--secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#10b981', marginBottom: '1rem' }}><Clock size={24} /></div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Lock Period</p>
                <h4 style={{ fontSize: '2rem', fontWeight: '800' }}>None</h4>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} className="text-primary" /> Protocol Health
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Total Liquidity</span>
                    <span>{totalLiquidity.toLocaleString()} STX</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '10px' }}>
                    <div style={{ width: '65%', height: '100%', background: 'var(--primary)', borderRadius: '10px' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  <ShieldCheck size={18} style={{ color: '#10b981' }} />
                  Secured by 100% Bitcoin Hashrate
                </div>
              </div>
              {/* Decorative radial gradient */}
              <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255, 90, 0, 0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px dotted var(--border)' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Position</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '900' }}>{userBalance.toLocaleString()}</span>
                <span style={{ color: 'var(--muted)', fontWeight: '600' }}>STX</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                ≈ ${(userBalance * 2.15).toLocaleString()} USD
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Vault;
