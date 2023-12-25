import { Timestamp } from "firebase/firestore";

export interface MultisigTransaction {
  id: string;
  threshold: number;
  signers: string[];
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
