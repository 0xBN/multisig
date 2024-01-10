import { Timestamp } from "firebase/firestore";

export interface Signer {
  address: string;
  signature: string;
}

export type PredefinedTxData = {
  methodName: Method;
  signer: string;
  newSignaturesNumber: string;
  to: string;
  amount?: string;
  callData?: `0x${string}` | "";
  frequency: string;
};

export type TransactionStatus = "proposed" | "pending" | "readyToExecute" | "executed" | "failed";

export type TableCellKey = keyof MultisigTransaction | "description" | "actionRequired";

export type Method = "addSigner" | "removeSigner" | "transferFunds" | "proposeStream" | "openStream" | "closeStream";

export interface MultisigTransaction {
  id?: string;
  threshold?: number;
  signers: Signer[];
  createdAt?: Timestamp | undefined;
  updatedAt?: Timestamp | undefined;
  proposedBy: string;
  nonce: number;
  status: TransactionStatus;
  walletAddress: string;
  callData: string;
  action: string;
  signatureRequiredTransactionHash: string;
  targetAddress?: string;
  frequency?: number;
  amount?: number;
}
