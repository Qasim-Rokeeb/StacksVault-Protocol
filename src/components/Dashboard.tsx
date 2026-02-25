import React from 'react';
import { 
  User, 
  Wallet, 
  Activity, 
  PlusCircle, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  userAddress: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userAddress, onLogout }) => {
  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Profile Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '3rem',
          background: 'var(--secondary)',
          padding: '2rem',
          borderRadius: '24px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #ffb800 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome Back</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                {userAddress.slice(0, 10)}...{userAddress.slice(-10)}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="btn btn-secondary" 
            style={{ fontSize: '0.9rem' }}
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {[
            { label: 'Current Streak', value: '12 Days', icon: <Activity className="text-primary" /> },
            { label: 'Pending Rewards', value: '450 STX', icon: <Wallet className="text-primary" /> },
            { label: 'Valid PRs (Month)', value: '8 / 20', icon: <PlusCircle className="text-primary" /> },
          ].map((stat, i) => (
            <div key={i} style={{ 
              background: 'var(--secondary)', 
              padding: '1.5rem', 
              borderRadius: '16px', 
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{stat.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'var(--secondary)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Recent Pull Requests</h3>
            <button style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600' }}>View All</button>
          </div>
          <div style={{ padding: '1rem' }}>
            {[
              { title: 'Add Clarity contract for rewards', status: 'In Review', date: '2 hours ago' },
              { title: 'Fix: Responsive layout for dashboard', status: 'Completed', date: 'Yesterday' },
              { title: 'Update documentation for onboarding', status: 'Completed', date: '3 days ago' }
            ].map((pr, i) => (
              <div key={i} style={{ 
                padding: '1rem 1rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: i === 2 ? 'none' : '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ color: pr.status === 'Completed' ? '#10b981' : 'var(--primary)' }}>
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '500' }}>{pr.title}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{pr.date} • {pr.status}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted" style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA for new PR */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
            Submit New PR <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
