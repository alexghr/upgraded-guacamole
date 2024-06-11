import useTxStatus from '@/hooks/useTxStatus';
import css from './style.module.css';
import { useContext, useEffect } from 'react';
import { WalletContext } from '@/providers/Wallet';

export default function CurrentTxStatus() {
  const { currentTxHash, setCurrentTxHash } = useContext(WalletContext);
  const status = useTxStatus(currentTxHash);
  useEffect(() => {
    if (status === 'Mined') {
      setCurrentTxHash(null);
    }
  }, [status, setCurrentTxHash]);
  return (
    <div className={css.txStatus}>
      <div>
        {status}
        {status === 'Mined' && ' 🎉'}
        {status === 'Dropped' && ' 😢'}
        {status === 'Pending' && ' ⏳'}
        {status === 'Proving' && ' 🔒'}
      </div>
      {status !== 'Mined' && status !== 'Dropped' && (
        <div className={css.spinnerWrapper}>
          <div className={css.spinner} />
        </div>
      )}
    </div>
  );
}
