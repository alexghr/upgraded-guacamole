import { callWallet, getPrivateBalance, getPublicBalance } from '@/bnc';
import { WalletContext } from '@/providers/Wallet';
import { useContext, useEffect, useState } from 'react';

export default function WalletStatus() {
  const { address, setAddress, currentTxHash } = useContext(WalletContext);
  const [privateBalance, setPrivateBalance] = useState<number | null>(null);
  const [publicBalance, setPublicBalance] = useState<number | null>(null);

  const handleConnect = async () => {
    const resp = await callWallet({
      type: 'WALLET_DETAILS',
    });

    setAddress(resp.address);
  };

  useEffect(() => {
    if (!address) {
      return;
    }

    Promise.all([getPrivateBalance(address), getPublicBalance(address)]).then(
      ([privateBalance, publicBalance]) => {
        setPrivateBalance(privateBalance.values);
        setPublicBalance(publicBalance.values);
      }
    );
  }, [address, currentTxHash]);

  return (
    <div>
      {address && (
        <>
          Connected to <code>{address}</code>
          {privateBalance === null || publicBalance === null ? (
            <p>Loading balances...</p>
          ) : (
            <>
              <p>Private balance: 🔐🍌{String(privateBalance)}</p>
              <p>Public balance: 🍌{String(publicBalance)}</p>
            </>
          )}
        </>
      )}
      {!address && (
        <>
          <button onClick={handleConnect}>Connect wallet</button>
        </>
      )}
    </div>
  );
}
