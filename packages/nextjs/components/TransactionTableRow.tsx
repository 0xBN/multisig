import React, { FC } from "react";
import { ethers } from "ethers";
// or another web3 library
import { doc, updateDoc } from "firebase/firestore";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { tableHeaders } from "~~/config/transactionTable";
import scaffoldConfig from "~~/scaffold.config";
import { convertFirestoreTimestampToDate } from "~~/services/firebaseService";
import { MultisigTransaction, TableCellKey, TransactionStatus } from "~~/types/multisigTransaction";
import { truncateAddress } from "~~/utils/helper";

// Adjust the import path

interface TransactionTableRowProps {
  transaction: MultisigTransaction;
}

const TransactionTableRow: FC<TransactionTableRowProps> = ({ transaction }) => {
  const { address: userAddress } = useAccount();
  // TODO: Add functionality to handleSignTransaction and handleExecuteTransaction
  const hasUserSigned = transaction.signers?.some(signer => signer.address === userAddress);
  const isPending = transaction.status === "pending";
  const isReadyToExecute =
    transaction.status === "readyToExecute" && transaction.signers.length >= transaction.threshold;

  const handleSignTransaction = async () => {
    try {
      const { id, nonce, walletAddress, callData } = transaction;

      console.log("Signing transaction:", id, nonce, walletAddress, callData);

      if (!window.ethereum) return;
      // Connect to user's Ethereum wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const userAddress = await signer.getAddress();
      console.log(userAddress);

      // CONTINUE HERE:
      return;

      // Prepare data for signing
      const dataToSign = `Data from transaction: ${id}, ${nonce}, etc.`; // Format as needed
      const signature = await signer.signMessage(dataToSign);

      // Update Firestore document
      const transactionDocRef = doc(firestore, "transactions", id); // Adjust your Firestore path
      await updateDoc(transactionDocRef, {
        signers: ethers.utils.arrayify([...transaction.signers, { address: userAddress, signature }]),
        // Update status if needed
      });

      console.log("Transaction signed and updated in Firestore");
    } catch (error) {
      console.error("Error signing transaction:", error);
      // Handle errors appropriately
    }
  };
  const handleExecuteTransaction = () => {
    console.log("Execute transaction clicked");
  };

  const transactionStatusActions: {
    [key in TransactionStatus]: React.ReactNode;
  } = {
    proposed: !hasUserSigned && (
      <button onClick={handleSignTransaction} className={`btn text-xs`}>
        Sign
      </button>
    ),
    pending: hasUserSigned ? (
      "Signed, waiting for others"
    ) : (
      <button onClick={handleSignTransaction} className={`btn text-xs`}>
        Sign
      </button>
    ),
    readyToExecute: isReadyToExecute && (
      <button
        onClick={handleExecuteTransaction}
        disabled={transaction.signers.length < transaction.threshold}
        className={`btn text-xs`}
      >
        Execute
      </button>
    ),
    executed: "Signed & Executed",
    failed: "Failed",
  };

  const renderTableCell = (key: TableCellKey) => {
    switch (key) {
      case "proposedBy":
        return <Address address={transaction.proposedBy} size="base" />;
      case "lastUpdated":
        return convertFirestoreTimestampToDate(transaction.lastUpdated);
      case "created":
        return convertFirestoreTimestampToDate(transaction.created);
      case "signers":
        if (transaction.signers?.length === 0) return <div>No sigs</div>;
        return transaction.signers?.map((signer, i) => <Address key={i} address={signer.address} size="base" />);
      case "txHash":
        if (!transaction.txHash) return <div>None</div>;
        return (
          <a
            href={`${scaffoldConfig.targetNetwork.blockExplorers.default.url}/tx/${transaction.txHash}`}
            target="_blank"
          >
            {truncateAddress(transaction.txHash)}
          </a>
        );
      case "actions":
        const actionUI = transactionStatusActions[transaction.status];
        return <div className={`flex flex-col gap-2`}>{actionUI}</div>;

      // ... other cases
      default:
        return transaction[key];
    }
  };

  return (
    <tr key={transaction.id}>
      {tableHeaders.map(header => (
        <td key={header.key} className="border border-gray-300 p-1 overflow-x-auto text-xs text-center align-middle">
          {renderTableCell(header.key)}
        </td>
      ))}
    </tr>
  );
};

export default TransactionTableRow;
