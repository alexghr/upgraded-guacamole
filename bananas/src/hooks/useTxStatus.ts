import { useEffect, useState } from 'react';

export default function useTxStatus(txHash: string | null) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!txHash) {
      return;
    }

    const handler = (e: MessageEvent) => {
      if (e.data.from === '@@AZTEC' && e.data.txHash === txHash) {
        switch (e.data.status) {
          case 1:
            setStatus('Proving');
            break;
          case 2:
            setStatus('Pending');
            break;
          case 3:
            setStatus('Mined');
            break;
          case 4:
            setStatus('Dropped');
            break;
        }
      }
    };

    const interval = setInterval(() => {
      postMessage({
        to: '@@AZTEC',
        type: 'AZTEC_TX_STATUS',
        txHash,
      });
    }, 2000);

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
      clearInterval(interval);
    };
  }, [txHash]);

  return status;
}
