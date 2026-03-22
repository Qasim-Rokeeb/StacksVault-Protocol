import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Clock, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';

interface TransactionHistoryProps {
  userAddress: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userAddress }) => {
  const { transactions, isLoading, error } = useTransactionHistory(userAddress);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section style={{ 
      background: 'var(--secondary)', 
      padding: '2.5rem', 
      borderRadius: '32px', 
      border: '1px solid var(--border)',
      marginTop: '2rem'
    }} aria-labelledby="transaction-history-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 id="transaction-history-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} style={{ color: 'var(--primary)' }} /> Activity History
        </h3>
        {isLoading && <Loader2 size={20} className="animate-spin text-muted" aria-hidden="true" />}
      </div>

      {error && (
        <div role="alert" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem' }}>
          Failed to load transactions: {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} role="status" aria-live="polite">
        <AnimatePresence>
          {transactions.length === 0 && !isLoading && !error && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}
            >
              No recent transactions found.
            </motion.div>
          )}

          <ul aria-label="Recent transactions" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transactions.map((tx, idx) => (
              <motion.li
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: tx.type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 90, 0, 0.1)',
                color: tx.type === 'deposit' ? '#10b981' : 'var(--primary)'
              }}>
                {tx.type === 'deposit' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                  {tx.type} STX
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  <span>{formatDate(tx.timestamp)}</span>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    color: tx.status === 'success' ? '#10b981' : (tx.status === 'pending' ? 'var(--primary)' : '#ef4444')
                  }}>
                    {tx.status === 'success' && <CheckCircle2 size={14} />}
                    {tx.status === 'failed' && <XCircle size={14} />}
                    {tx.status === 'pending' && <Loader2 size={14} className="animate-spin" />}
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                  {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} STX
                </div>
                <a 
                  href={tx.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`View ${tx.type} transaction in explorer (opens in a new tab)`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--muted)', textDecoration: 'none' }}
                >
                  Explorer <ExternalLink size={12} />
                </a>
              </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TransactionHistory;
