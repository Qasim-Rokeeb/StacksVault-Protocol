import React from 'react';
import { Loader2 } from 'lucide-react';


export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    isLoading = false, 
    size = 'md', 
    fullWidth = false,
    className = '', 
    disabled, 
    style,
    ...props 
  }, ref) => {
    
    // Base styles map to the existing .btn class styling from standard css but via styled object for now or just composing classes
    const getVariantClass = () => {
      if (variant === 'primary') return 'btn-primary';
      if (variant === 'secondary') return 'btn-secondary';
      return `btn-${variant}`;
    };

    let padding = '0.75rem 1.5rem';
    let fontSize = '1rem';

    if (size === 'sm') {
      padding = '0.4rem 1rem';
      fontSize = '0.8rem';
    } else if (size === 'lg') {
      padding = '1.5rem 2rem';
      fontSize = '1.25rem';
    }

    const mergedStyle: React.CSSProperties = {
      padding,
      fontSize,
      width: fullWidth ? '100%' : undefined,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      opacity: (disabled || isLoading) ? 0.7 : 1,
      cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
      ...style,
    };

    return (
      <button
        ref={ref}
        className={`btn ${getVariantClass()} ${className}`}
        disabled={disabled || isLoading}
        style={mergedStyle}
        {...props}
      >
        {isLoading && <Loader2 size={18} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
