import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import firebaseApp from "../firebaseConfig";
import TransactionTableHeader from "./TransactionTableHeader";
import TransactionTableRow from "./TransactionTableRow";
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { tableHeaders } from "~~/config/transactionTable";
import { convertFirestoreTimestampToDate } from "~~/services/firebaseService";
import { MultisigTransaction } from "~~/types/multisigTransaction";
import { MultisigWallet } from "~~/types/multisigWallet";

interface MultisigTransactionsListProps {
  walletData: MultisigWallet;
}

const MultisigTransactionsList: FC<MultisigTransactionsListProps> = ({ walletData }) => {
  const router = useRouter();
  const { address: multisigWalletAddress } = router.query;

  const { address: userAddress } = useAccount();
  const [transactions, setTransactions] = useState<MultisigTransaction[]>([]);
  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const fetchTransactions = async () => {
      const transactionsCollectionRef = collection(db, "multisigTransactions");
      const q = query(transactionsCollectionRef, where("walletAddress", "==", multisigWalletAddress));
      const querySnapshot = await getDocs(q);

      const fetchedTransactions: MultisigTransaction[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        fetchedTransactions.push({ ...(doc.data() as MultisigTransaction), id: doc.id });
      });
      setTransactions(fetchedTransactions);
    };

    fetchTransactions();
  }, [db, multisigWalletAddress]);

  // TODO: Create button for different statuses: Proposed, Executed

  return (
    <div className="flex items-center flex-col flex-grow max-w-full p-4">
      <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 max-w-full">
        <div className="text-xl font-bold">Transaction List</div>
        <div className="flex flex-col mt-8 gap-4 overflow-x-auto">
          {transactions.length === 0 ? (
            "No transactions found."
          ) : (
            <table className="table-fixed border-collapse border border-gray-300 max-w-full">
              <TransactionTableHeader headers={tableHeaders} />
              <tbody>
                {transactions.map(tx => (
                  <TransactionTableRow key={tx.id} transaction={tx} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultisigTransactionsList;
