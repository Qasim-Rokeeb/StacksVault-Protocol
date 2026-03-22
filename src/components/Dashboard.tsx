import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Lock, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from './StatCard';
import Button from './Button';
import TransactionHistory from './TransactionHistory';
import { useVault } from '../hooks/useVault';
import { useTransactionForm } from '../hooks/useTransactionForm';
import CopyableAddress from './CopyableAddress';

interface DashboardProps {
  userAddress: string;
  onNavigateToVault: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userAddress, onNavigateToVault }) => {
  const { status, userBalance, totalLiquidity, accruedYield, isFetching } = useVault();
  const { amount: quickAmount, handleAmountChange, validationError, submitTransaction } = useTransactionForm('deposit');



  // Dynamic stats
  const stats = {
    totalLiquidity: isFetching ? "..." : `${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })} STX`,
    userBalance: isFetching ? "..." : `${userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} STX`,
    accruedYield: isFetching ? "..." : `${accruedYield.toFixed(4)} STX`,
    apy: "5.00%",
  };

  return (
    <section className="container" style={{ paddingTop: '4rem', paddingBottom: '8rem' }} aria-labelledby="dashboard-title">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="dash-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                background: 'rgba(255, 90, 0, 0.1)', 
                color: 'var(--primary)', 
                borderRadius: '100px', 
                fontSize: '0.75rem', 
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}>DASHBOARD OVERVIEW</span>
            </div>
            <h2 id="dashboard-title" style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1' }}>Protocol Analytics</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Connected Wallet</p>
            <CopyableAddress address={userAddress} />
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <StatCard 
            label="Total Vault Liquidity" 
            value={stats.totalLiquidity} 
            icon={<ShieldCheck size={24} />} 
            trend="+12% YoY"
            delay={0.1}
          />
          <StatCard 
            label="Your Deposit Balance" 
            value={stats.userBalance} 
            icon={<Wallet size={24} />} 
            delay={0.2}
          />
          <StatCard 
            label="Accrued Yield" 
            value={stats.accruedYield} 
            icon={<TrendingUp size={24} />} 
            trend="+4.5% APY"
            delay={0.3}
          />
        </div>

        {/* Secondary Info Grid */}
        <div className="dash-secondary-grid">
          <section style={{ 
            background: 'linear-gradient(135deg, var(--secondary) 0%, rgba(255, 90, 0, 0.05) 100%)', 
            padding: '2.5rem', 
            borderRadius: '32px', 
            border: '1px solid var(--border)' 
          }} aria-labelledby="quick-deposit-title">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={24} style={{ color: 'var(--primary)' }} /> <span id="quick-deposit-title">Quick Deposit</span>
            </h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Instantly add liquidity to the vault. Minimum deposit is 1 STX.
            </p>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTransaction();
              }}
              aria-describedby={validationError ? 'quick-deposit-error' : undefined}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="quick-deposit-amount" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  Deposit amount in STX
                </label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="quick-deposit-amount"
                  type="text" 
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  placeholder="1.00"
                  value={quickAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? 'quick-deposit-error' : undefined}
                  style={{ 
                    width: '100%', 
                    padding: '1rem 1.25rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: validationError ? '2px solid #ef4444' : '1px solid var(--border)', 
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    outline: 'none'
                  }} 
                />
                <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--muted)' }}>STX</span>
              </div>
              {validationError && (
                <div id="quick-deposit-error" role="alert" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: '500' }}>
                  {validationError}
                </div>
              )}
              </div>

              <Button 
                type="submit"
                isLoading={status === 'pending'}
                disabled={!!validationError || !quickAmount}
                variant="primary" 
                size="lg"
                fullWidth
                aria-label="Submit quick deposit"
              >
                Deposit Now <ArrowRight size={18} />
              </Button>
            </form>

            {status !== 'idle' && (
              <div role="status" aria-live="polite" style={{ 
                marginTop: '1rem', 
                fontSize: '0.8rem', 
                color: status === 'success' ? '#10b981' : (status === 'error' ? '#ef4444' : 'var(--muted)'),
                textAlign: 'center'
              }}>
                {status === 'success' ? 'Deposit successful!' : (status === 'error' ? 'Deposit failed' : 'Waiting for confirmation...')}
              </div>
            )}

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button 
                onClick={onNavigateToVault}
                aria-label="Go to Vault Manager"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
              >
                Go to Vault Manager →
              </button>
            </div>
          </section>

          <section style={{ 
            background: 'var(--secondary)', 
            padding: '2.5rem', 
            borderRadius: '32px', 
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }} aria-label="Protocol security summary">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Lock size={24} style={{ color: 'var(--primary)' }} /> Protocol Security
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Audit Status</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>VERIFIED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Bitcoin Finality</span>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>ACTIVE</span>
              </div>
            </div>
            {/* Decorative background element */}
            <div style={{ 
              position: 'absolute', 
              bottom: '-20px', 
              right: '-20px', 
              width: '120px', 
              height: '120px', 
              background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', 
              opacity: 0.1,
              filter: 'blur(20px)'
            }}></div>
          </section>
        </div>

        {/* Transaction History Section */}
        <TransactionHistory userAddress={userAddress} />
      </motion.div>
    </section>
  );
};

export default Dashboard;
