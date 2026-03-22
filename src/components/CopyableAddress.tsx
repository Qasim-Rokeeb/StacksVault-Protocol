import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CopyableAddressProps {
  address: string;
}

const CopyableAddress: React.FC<CopyableAddressProps> = ({ address }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      background: 'var(--secondary)', 
      padding: '0.35rem 0.75rem', 
      borderRadius: '8px', 
      border: '1px solid var(--border)',
      fontFamily: 'monospace', 
      fontWeight: '600',
      fontSize: '0.85rem'
    }} aria-label="Connected wallet address">
      <span aria-label={`Wallet address ${address}`}>{address.slice(0, 6)}...{address.slice(-6)}</span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.4rem' }}>
        <button 
          type="button"
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', color: copied ? '#10b981' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.1rem' }}
          title="Copy Address"
          aria-label="Copy wallet address"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <a 
          href={`https://explorer.hiro.so/address/${address}?chain=testnet`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: '0.1rem' }}
          title="View on Explorer"
          aria-label="View wallet address in explorer (opens in a new tab)"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default CopyableAddress;
