'use client';
import { WalletContext } from '@/providers/Wallet';
import { useContext, useState } from 'react';
import css from './style.module.css';
import { registerRecipient, transferPrivate, transferPublic } from '@/bnc';
import CurrentTxStatus from './CurrentTxStatus';

export default function Transfer() {
  const { address, currentTxHash, setCurrentTxHash, pushTx } =
    useContext(WalletContext);
  const [recipient, setRecipient] = useState<string>('');
  const [pubKeys, setPubKeys] = useState<string>('');
  const [partialAddr, setPartialAddr] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<string>('private');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    let txHash: string;
    if (type === 'public') {
      txHash = await transferPublic(address!, recipient, parseInt(amount, 10));
    } else {
      if (pubKeys && partialAddr) {
        await registerRecipient(recipient, pubKeys, partialAddr);
      }
      txHash = await transferPrivate(address!, recipient, parseInt(amount, 10));
    }

    pushTx({
      txHash,
      type,
      meta: {
        recipient,
        amount,
      },
    });

    setCurrentTxHash(txHash);
  };

  return address ? (
    <div className={css.transferForm}>
      <h2>Transfer</h2>
      {currentTxHash && <CurrentTxStatus />}
      {!currentTxHash && (
        <form onSubmit={handleSubmit as any}>
          <div className={css.field}>
            <select onChange={(e) => setType(e.target.value)}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className={css.field}>
            <label htmlFor="recipient">Recipient</label>
            <textarea
              id="recipient"
              name="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          {type === 'private' && (
            <>
              <div className={css.field}>
                <label htmlFor="pub_keys">Public keys</label>
                <textarea
                  id="pub_keys"
                  name="pub_keys"
                  value={pubKeys}
                  onChange={(e) => setPubKeys(e.target.value)}
                />
              </div>
              <div className={css.field}>
                <label htmlFor="partial_addr">Partial address</label>
                <input
                  id="partial_addr"
                  name="partial_addr"
                  type="text"
                  value={partialAddr}
                  onChange={(e) => setPartialAddr(e.target.value)}
                />
              </div>
            </>
          )}
          <div className={css.field}>
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              defaultValue={0}
            />
          </div>
          <button type="submit">Transfer</button>
        </form>
      )}
    </div>
  ) : null;
}
