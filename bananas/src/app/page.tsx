'use client';

import styles from './page.module.css';
import { BNC } from '../bnc';
import WalletStatus from '@/components/WalletStatus';
import WalletProvider from '@/providers/Wallet';
import Transfer from '@/components/Transfer';

export default function Home() {
  return (
    <main className={styles.main}>
      <p>Banana coin</p>
      <code className={styles.bnc}>{BNC}</code>
      <h1 className={styles.title}>🍌</h1>
      <WalletProvider>
        <WalletStatus />
        <Transfer />
      </WalletProvider>
    </main>
  );
}
