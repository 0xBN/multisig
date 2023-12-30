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
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { tableHeaders } from "~~/config/transactionTable";
import { MultisigTransaction } from "~~/types/multisigTransaction";
import { MultisigWallet } from "~~/types/multisigWallet";

interface MultisigTransactionsListProps {
  walletData: MultisigWallet;
}

const MultisigTransactionsList: FC<MultisigTransactionsListProps> = () => {
  const router = useRouter();
  const { address: multisigWalletAddress } = router.query;
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [transactions, setTransactions] = useState<MultisigTransaction[]>([]);
  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const fetchTransactions = async () => {
      const transactionsCollectionRef = collection(db, "multisigTransactions");
      const q = query(
        transactionsCollectionRef,
        where("walletAddress", "==", multisigWalletAddress),
        orderBy("created", sortDirection),
      );
      const querySnapshot = await getDocs(q);

      const fetchedTransactions: MultisigTransaction[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        fetchedTransactions.push({ ...(doc.data() as MultisigTransaction), id: doc.id });
      });
      setTransactions(fetchedTransactions);
    };

    fetchTransactions();
  }, [db, multisigWalletAddress, sortDirection]);

  // TODO: Create button for different statuses: Proposed, Executed

  return (
    <div className="flex items-center flex-col flex-grow max-w-full p-4">
      <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 max-w-full overflow-x-auto">
        <div className={`flex items-center justify-between w-full`}>
          <div className="text-xl font-bold">Transaction List</div>
          <button
            className={`btn btn-secondary text-xs`}
            onClick={() => {
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            Created: {sortDirection === "asc" ? "oldest" : "newest"}
          </button>
        </div>
        <div className="flex flex-col mt-8 gap-4">
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
