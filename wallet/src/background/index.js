import {
  AztecAddress,
  CompleteAddress,
  Fr,
  FunctionSelector,
  PublicKeys,
  deriveKeys,
  deriveSigningKey,
} from '@aztec/circuits.js';
import {
  AccountWallet,
  FunctionCall,
  TxExecutionRequest,
  TxHash,
  createPXEClient,
  TxStatus as AztecTxStatus,
  Tx,
} from '@aztec/aztec.js';
import { SchnorrAccountContract } from '@aztec/accounts/schnorr';
import { decodeReturnValues } from '@aztec/foundation/abi';
import {
  AZTEC,
  CALL,
  PROVE,
  REGISTER_RECIPIENT,
  SEND,
  SIMULATE,
  TX_STATUS,
  TxStatus,
  WALLET_DETAILS,
} from '../message';

// an unimplemented popup
browser.action.onClicked.addListener(() => {
  let createData = {
    active: true,
    url: 'out/index.html',
  };

  browser.tabs.create(createData).then(console.log).catch(console.error);
});

// PXE running locally
const client = createPXEClient(process.env.PXE_URL);
// private key for a schnorr account, read from the env for now
const privateKey = Fr.fromString(process.env.PRIVATE_KEY);
// assume an already deployed account contract
const address = AztecAddress.fromString(process.env.ADDRESS);
const partialAddress = Fr.fromString(process.env.PARTIAL_ADDRESS);

const { publicKeys } = deriveKeys(privateKey);

const completeAddress = new CompleteAddress(
  address,
  publicKeys,
  partialAddress,
);

// this should use my pinned contract bytecode rather than what's in @aztec/accounts.js at the time of npm install
const accountContract = new SchnorrAccountContract(
  deriveSigningKey(privateKey),
);

const wallet = new AccountWallet(
  client,
  accountContract.getInterface(completeAddress, await client.getNodeInfo()),
);

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (message) => {
    try {
      if (message.to !== AZTEC) {
        console.log('not an Aztec message');
        return;
      }

      console.log('Received an Aztec message', message.type);
      console.time(`Message ${message.type} processing time`);
      switch (message.type) {
        case SIMULATE:
          await simulate(port, message);
          break;
        case CALL:
          await call(port, message);
          break;
        case PROVE:
          await prove(port, message);
          break;
        case SEND:
          await send(port, message);
          break;
        case TX_STATUS:
          await getTxStatus(port, message);
          break;
        case REGISTER_RECIPIENT:
          await registerRecipient(port, message);
          break;
        case WALLET_DETAILS:
          await walletDetails(port, message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
          break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      console.timeEnd(`Message ${message.type} processing time`);
    }
  });
});

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecSimulateMessage} message
 */
async function simulate(port, message) {
  const fnCall = decodeFnCall(message.call);
  const txReq = await wallet.createTxExecutionRequest({
    calls: [fnCall],
  });

  const { tx } = await wallet.simulateTx(txReq, true);

  console.log('Simulated tx:', tx.getTxHash().toString());
  port.postMessage({
    from: AZTEC,
    id: message.id,
    txExecutionRequest: txReq.toString(),
    txHash: tx.getTxHash().toString(),
  });
}

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecCallMessage} message
 */
async function call(port, message) {
  const fnCall = decodeFnCall(message.call);
  let values;
  if (fnCall.type === 'unconstrained') {
    values = await wallet.simulateUnconstrained(
      fnCall.name,
      fnCall.args,
      fnCall.to,
    );
  } else {
    const txReq = await wallet.createTxExecutionRequest({
      calls: [fnCall],
    });

    const { privateReturnValues, publicOutput } = await wallet.simulateTx(
      txReq,
      true,
    );

    const rawReturnValues =
      fnCall.type === 'private'
        ? privateReturnValues?.nested?.[0].values
        : publicOutput?.publicReturnValues?.[0].values;

    values = rawReturnValues
      ? decodeReturnValues(fnCall.returnTypes, rawReturnValues)
      : [];
  }
  port.postMessage({
    from: AZTEC,
    id: message.id,
    values,
  });
}

// keep an in-memory map of txs being proven by the PXE so we can report status on
const provingTxs = new Set();

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecProveMessage} message
 */
async function prove(port, message) {
  const txReq = TxExecutionRequest.fromString(message.txExecutionRequest);
  const txHash = TxHash.fromString(message.txHash);
  try {
    provingTxs.add(txHash.toString());
    const txPromise = wallet.proveTx(txReq, true);

    const tx = await txPromise;

    if (!txHash.equals(tx.getTxHash())) {
      console.warn(
        'Tx hash does not match. Expected:',
        txHash.toString(),
        'Got:',
        tx.getTxHash().toString(),
      );
    }
    port.postMessage({
      from: AZTEC,
      id: message.id,
      tx: tx.toBuffer().toString('hex'),
    });
  } finally {
    provingTxs.delete(txHash.toString());
  }
}

async function send(port, message) {
  const tx = Tx.fromBuffer(Buffer.from(message.tx, 'hex'));
  const txHash = await wallet.sendTx(tx);
  port.postMessage({
    from: AZTEC,
    id: message.id,
    txHash: txHash.toString(),
  });
}

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecTxStatusMessage} message
 */
async function getTxStatus(port, message) {
  if (provingTxs.has(message.txHash)) {
    port.postMessage({
      from: AZTEC,
      id: message.id,
      txHash: message.txHash,
      status: TxStatus.PROVING,
    });
  } else {
    const txReceipt = await wallet.getTxReceipt(
      TxHash.fromString(message.txHash),
    );
    if (txReceipt.status === AztecTxStatus.SUCCESS) {
      port.postMessage({
        from: AZTEC,
        id: message.id,
        txHash: message.txHash,
        status: TxStatus.MINED,
      });
    } else if (txReceipt.status === AztecTxStatus.PENDING) {
      port.postMessage({
        from: AZTEC,
        id: message.id,
        txHash: message.txHash,
        status: TxStatus.PENDING,
      });
    } else {
      port.postMessage({
        from: AZTEC,
        id: message.id,
        txHash: message.txHash,
        status: TxStatus.DROPPED,
      });
    }
  }
}

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecWalletDetailsMessage} message
 */
async function walletDetails(port, message) {
  port.postMessage({
    from: AZTEC,
    id: message.id,
    address: wallet.getAddress().toString(),
  });
}

/**
 * @param {MessagePort} port
 * @param {import('../message').AztecRegisterRecipientMessage} message
 */
async function registerRecipient(port, message) {
  await wallet.registerRecipient(
    new CompleteAddress(
      AztecAddress.fromString(message.address),
      PublicKeys.fromString(message.publicKeys),
      Fr.fromString(message.partialAddress),
    ),
  );

  port.postMessage({
    from: AZTEC,
    id: message.id,
  });
}

/**
 * @param {any} call
 * @returns {FunctionCall}
 */
function decodeFnCall(call) {
  return new FunctionCall(
    call.name,
    AztecAddress.fromString(call.to),
    FunctionSelector.fromString(call.selector),
    call.type,
    call.isStatic,
    call.args.map((x) => Fr.fromString(x)),
    call.returnTypes,
  );
}
