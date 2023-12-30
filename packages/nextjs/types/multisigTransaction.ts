import { Timestamp } from "firebase/firestore";

export interface Signer {
  address: string;
  signature: string;
}

export type PredefinedTxData = {
  methodName: Method;
  signer: string;
  newSignaturesNumber: number;
  to?: string;
  amount?: string;
  callData?: `0x${string}` | "";
};

export type TransactionStatus = "proposed" | "pending" | "readyToExecute" | "executed" | "failed";

export type TableCellKey = keyof MultisigTransaction | "actions";

export type Method = "addSigner" | "removeSigner" | "transferFunds";

export interface MultisigTransaction {
  id?: string;
  threshold: number;
  signers: Signer[];
  created: Timestamp;
  proposedBy: string;
  nonce: number;
  lastUpdated: Timestamp;
  status: TransactionStatus;
  walletAddress: string;
  callData: string;
  action: string;
  txHash: string;
}
