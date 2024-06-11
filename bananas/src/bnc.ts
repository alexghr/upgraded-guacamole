// importing "things" from aztec.js at the top level breaks the app because of top-level await
import { type Contract } from '@aztec/aztec.js';
// pin the contract bytecode
import * as token from '../public/token_contract-Token.json';

export const BNC =
  '0x02e4b894e1c4f2b285a83bc10094215638c6d517d0dc39337eef3654020bace0';

export async function callWallet(msg: object): Promise<any> {
  // JSON-RPC style communication
  const id = Math.random().toString(36).slice(2);
  return new Promise((res) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id === id && e.data.from === '@@AZTEC') {
        window.removeEventListener('message', handleMessage);
        res(e.data);
      }
    };

    window.addEventListener('message', handleMessage);

    postMessage({
      to: '@@AZTEC',
      id,
      ...msg,
    });
  });
}

const getBNC = (() => {
  let cached: Contract | undefined;
  return async () => {
    if (cached) {
      return cached;
    }

    const { AztecAddress, Contract, loadContractArtifact } = await import(
      '@aztec/aztec.js'
    );
    const BNC = AztecAddress.fromString(
      '0x02e4b894e1c4f2b285a83bc10094215638c6d517d0dc39337eef3654020bace0'
    );
    const artifact = loadContractArtifact(token as any);

    cached = await Contract.at(BNC, artifact, {
      // trust me bro! the contract exists in the PXE
      // I just want the contract to encode function call requests, I shouldn't need a PXE instance for this
      // and yet it requires something that `implements PXE`
      getContractInstance() {
        return Promise.resolve({
          address: BNC,
        });
      },
    } as any);

    return cached;
  };
})();

export async function callTokenMethod(method: string, args: any[]) {
  const bnc = await getBNC();
  const call = bnc.methods[method](...args).request();
  // call requests should be easily serializable 
  return {
    name: call.name,
    to: call.to.toString(),
    selector: call.selector.toString(),
    type: call.type,
    isStatic: call.isStatic,
    args: call.args.map((arg) => arg.toString()),
    returnTypes: call.returnTypes,
  };
}

export async function getPrivateBalance(address: string) {
  const { AztecAddress } = await import('@aztec/aztec.js');
  const addr = AztecAddress.fromString(address);
  const call = await callTokenMethod('balance_of_private', [addr]);
  return callWallet({
    type: 'AZTEC_CALL',
    call,
  });
}

export async function getPublicBalance(address: string) {
  const { AztecAddress } = await import('@aztec/aztec.js');
  const addr = AztecAddress.fromString(address);
  const call = await callTokenMethod('balance_of_public', [addr]);
  return callWallet({
    type: 'AZTEC_CALL',
    call,
  });
}

export async function registerRecipient(
  address: string,
  publicKeys: string,
  partialAddress: string
) {
  const { AztecAddress } = await import('@aztec/aztec.js');
  return callWallet({
    type: 'AZTEC_REG_RECIPIENT',
    address,
    publicKeys,
    partialAddress,
  });
}

async function sendTx(call: any) {
  // simulate first to get a tx hash - this should be quick
  const { txHash, txExecutionRequest } = await callWallet({
    type: 'AZTEC_SIMULATE',
    call,
  });

  // after simulating, prove the tx but don't wait for a response
  // once proving is finished, send it to a node
  callWallet({
    type: 'AZTEC_PROVE',
    txExecutionRequest,
    txHash,
  }).then(({ tx }) =>
    callWallet({
      type: 'AZTEC_SEND',
      tx,
    })
  );

  return txHash;
}

export async function transferPublic(from: string, to: string, amount: number) {
  const { AztecAddress } = await import('@aztec/aztec.js');
  const fromAddr = AztecAddress.fromString(from);
  const toAddr = AztecAddress.fromString(to);
  const call = await callTokenMethod('transfer_public', [
    fromAddr,
    toAddr,
    amount,
    0,
  ]);

  return sendTx(call);
}

export async function transferPrivate(
  from: string,
  to: string,
  amount: number
) {
  const { AztecAddress } = await import('@aztec/aztec.js');
  const fromAddr = AztecAddress.fromString(from);
  const toAddr = AztecAddress.fromString(to);
  const call = await callTokenMethod('transfer', [fromAddr, toAddr, amount, 0]);

  return sendTx(call);
}
