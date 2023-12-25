import { Timestamp } from "firebase/firestore";

export interface Signer {
  address: string;
  signature: string;
}

export interface MultisigTransaction {
  id: string;
  threshold: number;
  signers: Signer[];
  created: Timestamp;
  proposedBy: string;
  nonce: number;
  lastUpdated: Timestamp;
  status: string;
  walletAddress: string;
  callData: string;
  action: string;
  txHash: string;
}
export type Method = "addSigner" | "removeSigner" | "transferFunds";
