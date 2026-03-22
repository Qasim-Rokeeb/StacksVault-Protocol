import { useState, useEffect } from 'react';
import { useVault } from './useVault';

export type TransactionMode = 'deposit' | 'withdraw';

export const useTransactionForm = (initialMode: TransactionMode = 'deposit') => {
  const [mode, setMode] = useState<TransactionMode>(initialMode);
  const [amount, setAmount] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { depositSTX, withdrawSTX, userBalance } = useVault();

  useEffect(() => {
    if (!amount) {
      setValidationError(null);
      return;
    }
    
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setValidationError("Please enter a valid amount");
      return;
    }

    if (mode === 'deposit') {
      if (val < 1) {
        setValidationError("Minimum deposit is 1 STX");
      } else {
        setValidationError(null);
      }
    } else {
      if (val > userBalance) {
        setValidationError(`Insufficient balance. You have ${userBalance} STX.`);
      } else {
        setValidationError(null);
      }
    }
  }, [amount, mode, userBalance]);

  const handleAmountChange = (newVal: string) => {
    const val = newVal.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    if (val.split('.').length > 2) return;
    if (val.includes('.') && val.split('.')[1].length > 6) return;
    setAmount(val);
  };

  const submitTransaction = async () => {
    if (validationError || !amount) return false;
    const val = parseFloat(amount);
    
    if (mode === 'deposit') {
      await depositSTX(val);
    } else {
      await withdrawSTX(val);
    }
    setAmount('');
    return true;
  };

  return {
    mode,
    setMode,
    amount,
    setAmount,
    handleAmountChange,
    validationError,
    submitTransaction
  };
};
