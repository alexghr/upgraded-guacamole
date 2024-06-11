/**
 * @typedef {Object} BaseAztecMessage
 */
export const AZTEC = '@@AZTEC';

/**
 * @typedef {Object} AztecSimulateMessage
 * @property {typeof AZTEC} to
 * @property {typeof SIMULATE} type
 * @property {string} id
 * @property {Object} call
 */
export const SIMULATE = 'AZTEC_SIMULATE';

/**
 * @typedef {Object} AztecCallMessage
 * @property {typeof AZTEC} to
 * @property {typeof CALL} type
 * @property {string} id
 * @property {Object} call
 */
export const CALL = 'AZTEC_CALL';

/**
 * @typedef {Object} AztecProveMessage
 * @property {typeof AZTEC} to
 * @property {typeof PROVE} type
 * @property {string} id
 * @property {string} txExecutionRequest
 * @property {string} txHash
 */
export const PROVE = 'AZTEC_PROVE';

/**
 * @typedef {Object} AztecSendMessage
 * @property {typeof AZTEC} to
 * @property {typeof SEND} type
 * @property {string} id
 * @property {string} tx
 */
export const SEND = 'AZTEC_SEND';

/**
 * @typedef {Object} AztecTxStatusMessage
 * @property {typeof AZTEC} to
 * @property {typeof TX_STATUS} type
 * @property {string} id
 * @property {string} txHash
 */
export const TX_STATUS = 'AZTEC_TX_STATUS';

/**
 * @typedef {Object} AztecWalletDetailsMessage
 * @property {typeof AZTEC} to
 * @property {typeof WALLET_DETAILS} type
 */
export const WALLET_DETAILS = 'WALLET_DETAILS';

/**
 * @typedef {Object} AztecRegisterRecipientMessage
 * @property {typeof AZTEC} to
 * @property {typeof REGISTER_RECIPIENT} type
 * @property {string} id
 * @property {string} address
 * @property {string} publicKeys
 * @property {string} partialAddress
 */
export const REGISTER_RECIPIENT = 'AZTEC_REG_RECIPIENT';

export const TxStatus = {
  PROVING: 1,
  PENDING: 2,
  MINED: 3,
  DROPPED: 4,
};
