'use client';

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';

export type WalletContext = {
  txs: Array<{
    txHash: string;
    type: string;
    meta: Record<string, string>;
  }>;
  currentTxHash: string | null;
  address: string | null;
  setAddress: (addr: string) => void;
  setCurrentTxHash: (txHash: string | null) => void;
  pushTx: (tx: WalletContext['txs'][0]) => void;
};

export const WalletContext = createContext<WalletContext>({
  txs: [],
  currentTxHash: null,
  address: null,
  setAddress: () => {},
  setCurrentTxHash: () => {},
  pushTx: () => {},
});

export default function WalletProvider({ children }: PropsWithChildren) {
  const [txs, setTxs] = useState<WalletContext['txs']>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);

  useEffect(() => {
    const rawTxs = localStorage.getItem('txs');
    const txs = rawTxs ? JSON.parse(rawTxs) : [];
    setTxs(txs);
  }, [address]);

  const pushTx = useCallback((tx: WalletContext['txs'][0]) => {
    setTxs((txs) => {
      const newTxs = [...txs, tx];
      localStorage.setItem('txs', JSON.stringify(newTxs));
      return newTxs;
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        setAddress,
        txs,
        pushTx,
        currentTxHash,
        setCurrentTxHash,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
