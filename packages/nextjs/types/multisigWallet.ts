import { Timestamp } from "firebase/firestore";

export interface MultisigWallet {
  id: string;
  address: string;
  nonce: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  threshold: number;
  signers: string[];
  txHash: string;
}
