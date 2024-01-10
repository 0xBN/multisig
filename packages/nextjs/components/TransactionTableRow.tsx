import React, { FC, useEffect, useState } from "react";
import firebaseApp from "../firebaseConfig";
import { ethers } from "ethers";
// or another web3 library
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { tableHeaders } from "~~/config/transactionTable";
import { convertFirestoreTimestampToDate, fetchMultisigWalletData } from "~~/services/firebaseService";
import { MultisigTransaction, TableCellKey, TransactionStatus } from "~~/types/multisigTransaction";
import { MultisigWallet } from "~~/types/multisigWallet";
import { notification } from "~~/utils/scaffold-eth";

// Adjust the import path

interface TransactionTableRowProps {
  transaction: MultisigTransaction;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

const TransactionTableRow: FC<TransactionTableRowProps> = ({ transaction, setRefreshKey }) => {
  const { address: userAddress } = useAccount();
  const [walletData, setWalletData] = useState<MultisigWallet>();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const getWalletData = async () => {
      const wallet = await fetchMultisigWalletData(transaction.walletAddress);
      if (!wallet) return;

      setWalletData(wallet);
    };
    getWalletData();
  }, [transaction.walletAddress]);

  if (!walletData) return null;

  const hasUserSigned = transaction.signers?.some(signer => signer.address === userAddress);
  const isPending = transaction.status === "pending";
  const isReadyToExecute =
    transaction.status === "readyToExecute" && transaction.signers.length >= walletData.threshold;

  const updateWalletAfterTransaction = async () => {
    const db = getFirestore(firebaseApp);

    try {
      // Query the Wallet to get the current nonce
      const multisigWalletCollection = collection(db, "multisigWallets");
      const walletQuery = query(multisigWalletCollection, where("address", "==", walletData.address));
      const walletQuerySnapshot = await getDocs(walletQuery);
      if (walletQuerySnapshot.empty) {
        console.log("No matching documents.");
        return;
      }
      const walletDocRef = walletQuerySnapshot.docs[0].ref;
      const wallet = walletQuerySnapshot.docs[0].data() as MultisigWallet;

      // Prepare wallet update object
      const walletUpdate: Partial<MultisigWallet> = {
        nonce: wallet.nonce ? wallet.nonce + 1 : 1, // increment nonce
        updatedAt: Timestamp.fromDate(new Date()),
        // TODO: Update all the fields necessary based on the type of transaction: threshold, signers, openStreams, closeStreams, balance
      };

      // Update the wallet document
      // TODO: Uncomment the line below to update the wallet document
      // await updateDoc(walletDocRef, walletUpdate);
      console.log("Updated wallet data:", walletUpdate);
    } catch (error) {
      console.error("Error updating wallet:", error);
    }
  };

  // Function to update Firebase with transaction result
  const updateTransactionAfterExecution = async transactionReceipt => {
    const db = getFirestore(firebaseApp);

    try {
      // Transaction - Mark the Transaction as Executed
      const multisigTransactionCollection = collection(db, "multisigTransactions");
      const transactionQuery = query(
        multisigTransactionCollection,
        where("walletAddress", "==", walletData.address),
        where("status", "==", "readyToExecute"),
      );

      // Query the 'multisigTransactions' collection for the transaction that matches
      const querySnapshot2 = await getDocs(transactionQuery);
      if (querySnapshot2.empty) {
        console.log("No matching documents.");
        return;
      }
      const transactionToExecute = querySnapshot2.docs[0];
      const transactionData = transactionToExecute.data() as MultisigTransaction;

      // CONTINUE HERE:
      // TODO: Transaction - Mark the Transaction as Executed
      // TODO: Transaction Receipt - Selectively Save Relevant Data from txReceipt
      // 1. Save 'blockNumber' from txReceipt for reference
      // 2. Save 'transactionHash' for easy reference and tracking
      console.log(transactionData.status);
    } catch (error) {}
  };

  const handleSignTransaction = async () => {
    try {
      if (!walletData || !walletClient) return;

      const isUserASigner = walletData.signers.some((signer: string) => signer === userAddress);

      if (!isUserASigner) {
        notification.error("You are not a signer on this wallet.");
        return;
      }

      const { walletAddress, status, signatureRequiredTransactionHash } = transaction;
      if (status !== "proposed" && status !== "pending") {
        notification.error("Transaction is not in a signable state.");
        return;
      }

      // Connect to user's Ethereum wallet
      if (!window.ethereum) {
        notification.error("Please connect wallet.");
        return;
      }

      const dataToSign = signatureRequiredTransactionHash;

      const signature = await walletClient.signMessage({
        message: { raw: dataToSign as `0x${string}` },
      });

      // Query the most recent 'proposed' or 'pending' transaction
      const db = getFirestore(firebaseApp);
      const transactionQuery = query(
        collection(db, "multisigTransactions"),
        where("walletAddress", "==", walletAddress),
        where("status", "in", ["proposed", "pending"]),
        orderBy("createdAt", "desc"),
        limit(1),
      );

      const querySnapshot = await getDocs(transactionQuery);
      if (querySnapshot.empty) {
        // No transaction found to sign
        notification.error("No signable transaction found.");
        return;
      }

      // Assuming we only get one document back due to our query constraints
      const transactionToSign = querySnapshot.docs[0];
      const transactionData = transactionToSign.data() as MultisigTransaction;

      // Update the transaction with the new signer
      await updateDoc(transactionToSign.ref, {
        signers: [...transactionData.signers, { address: userAddress, signature }],
        status: transactionData.signers.length + 1 >= walletData.threshold ? "readyToExecute" : "pending",
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log("Transaction signed and updated in Firestore");
      if (transactionData.signers.length >= walletData.threshold) {
        // if (walletData.signers.length + 1 >= transactionData.threshold) {
        notification.success("Transaction signed and ready to execute.");
      } else {
        notification.success("Transaction signed.");
      }
    } catch (error) {
      console.error("Error signing transaction:", error);
      // Handle errors appropriately
    } finally {
      // Refresh the table
      setRefreshKey(prev => prev + 1);
    }
  };

  // TODO: Handle execute transaction
  const handleExecuteTransaction = async () => {
    if (!userAddress || !transaction || !walletData) {
      notification.error("Signer, transaction data, or wallet data is missing.");
      return;
    }

    // Testing code
    // await updateWalletAfterTransaction();
    // await updateTransactionAfterExecution();
    // return;

    try {
      // Dynamically import the ABI
      const contractArtifact = await import(
        "../../hardhat/artifacts/contracts/MetaMultiSigWallet.sol/MetaMultiSigWallet.json"
      );

      const contractABI = contractArtifact.default.abi;

      // Check if Ethereum object is available
      if (!window.ethereum) {
        notification.error("Ethereum object not found, make sure you have a web3 provider");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(walletData.address, contractABI, signer);

      const newSignerAddress = transaction.targetAddress;
      const newSignaturesRequired = transaction.threshold;

      const toAddress = walletData.address;
      const value = 0;
      const data = contract.interface.encodeFunctionData("addSigner", [newSignerAddress, newSignaturesRequired]);
      const sortedSigners = transaction.signers.sort((a, b) => a.address.localeCompare(b.address));
      const signatures = sortedSigners.map(signer => signer.signature);

      const txResponse = await contract.executeTransaction(toAddress, value, data, signatures);
      notification.info("Transaction sent. Waiting for confirmation...");

      const txReceipt = await txResponse.wait();

      if (txReceipt.status === 1) {
        notification.success(`Transaction executed successfully: ${txReceipt.hash}`);
        // Firebase with the result
        await updateWalletAfterTransaction();
        await updateTransactionAfterExecution(txReceipt);
      } else {
        notification.error("Transaction execution failed.");
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error("An unknown error occurred.");
        notification.error("An unknown error occurred.");
        return;
      }
      console.error("Error executing transaction:", error);
      notification.error(`Error executing transaction: ${error.message}`);
    } finally {
      setRefreshKey(prev => prev + 1);
    }
  };

  const transactionStatusActions: {
    [key in TransactionStatus]: React.ReactNode;
  } = {
    proposed: !hasUserSigned && (
      <button onClick={handleSignTransaction} className={`btn text-xs btn-secondary`}>
        Sign
      </button>
    ),
    pending:
      hasUserSigned && isPending ? (
        `Signed, awaiting approvals`
      ) : (
        <button onClick={handleSignTransaction} className={`btn text-xs btn-secondary`}>
          Sign
        </button>
      ),
    readyToExecute: isReadyToExecute && (
      <button
        onClick={handleExecuteTransaction}
        disabled={walletData.signers.length < walletData.threshold}
        className={`btn text-xs btn-secondary`}
      >
        Execute
      </button>
    ),
    executed: "Signed & Executed",
    failed: "Failed",
  };

  const renderTableCell = (key: TableCellKey) => {
    switch (key) {
      case "description":
        return (
          <div className={`flex flex-col gap-2`}>
            <Address address={transaction.targetAddress} size="base" />
            New Signatures Required: {transaction.threshold}
          </div>
        );

      case "targetAddress":
        return <Address address={transaction.targetAddress} size="base" />;

      case "threshold":
        if (!transaction.threshold) return <div>-</div>;
        return <div>{transaction.threshold}</div>;

      case "proposedBy":
        return <Address address={transaction.proposedBy} size="base" />;

      case "createdAt":
        const date = convertFirestoreTimestampToDate(transaction[key]);
        return date ? date.toLocaleString() : "";

      case "amount":
        if (!transaction.amount) return <div>-</div>;
        return <div>{transaction.amount}</div>;

      case "frequency":
        if (!transaction.frequency) return <div>-</div>;
        return <div>{transaction.frequency}</div>;

      case "signers":
        if (transaction.signers?.length === 0)
          return (
            <div>
              {transaction.signers.length}/{walletData.threshold} Approvals
            </div>
          );
        const count = (
          <>
            {transaction.signers.length}/{walletData.threshold} Approvals
          </>
        );
        const signers = transaction.signers?.map((signer, i) => (
          <React.Fragment key={i}>
            <Address address={signer.address} size="base" />
          </React.Fragment>
        ));

        return (
          <>
            {count}
            <div className={`flex flex-col gap-2`}>{signers}</div>
          </>
        );

      case "actionRequired":
        const actionUI = transactionStatusActions[transaction.status];
        if (actionUI === undefined) return <div>none</div>;
        return <div className={`flex flex-col gap-2`}>{actionUI}</div>;

      case "action":
        return <div>{transaction.action}</div>;

      default:
        const value = String(transaction[key]);
        return value ? value.toString() : "";
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
