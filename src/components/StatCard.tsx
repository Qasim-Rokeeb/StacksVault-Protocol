import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  trend, 
  trendPositive = true,
  delay = 0 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ 
        background: 'var(--secondary)', 
        padding: '1.5rem', 
        borderRadius: '20px', 
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ 
          color: 'var(--primary)', 
          background: 'rgba(255, 90, 0, 0.1)', 
          padding: '0.75rem', 
          borderRadius: '14px' 
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: trendPositive ? '#10b981' : '#ef4444',
            background: trendPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px'
          }}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
