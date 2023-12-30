import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MetaMultiSigWallet from "../../hardhat/artifacts/contracts/MetaMultiSigWallet.sol/MetaMultiSigWallet.json";
import { ethers } from "ethers";
import { Timestamp } from "firebase/firestore";
import { useLocalStorage } from "usehooks-ts";
import { useAccount } from "wagmi";
import { Address, AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import {
  cancelTransactions,
  createNewTransaction,
  fetchMultisigWalletData,
  fetchTransactionsWithNonce,
} from "~~/services/firebaseService";
import { Method, MultisigTransaction, PredefinedTxData } from "~~/types/multisigTransaction";
import { MultisigWallet } from "~~/types/multisigWallet";

export const METHODS: Method[] = ["addSigner", "removeSigner", "transferFunds"];
export const OWNERS_METHODS = METHODS.filter(m => m !== "transferFunds");

export const DEFAULT_TX_DATA = {
  methodName: OWNERS_METHODS[0],
  signer: "",
  newSignaturesNumber: 0,
};

const UpdateOwnersForm = () => {
  const [walletData, setWalletData] = useState<MultisigWallet | null>(null);
  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();

  const [predefinedTxData, setPredefinedTxData] = useLocalStorage<PredefinedTxData>(
    "predefined-tx-data",
    DEFAULT_TX_DATA,
  );

  useEffect(() => {
    if (typeof address === "string") {
      fetchMultisigWalletData(address).then(data => {
        if (data) {
          setWalletData(data as MultisigWallet);
        }
      });
    }
  }, [address]);

  useEffect(() => {
    const initializeContract = async () => {
      if (typeof window.ethereum === "undefined" || !walletData) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(walletData.address, MetaMultiSigWallet.abi, signer);
      } catch (error) {
        console.error("An error occurred while initializing the contract:", error);
      }
    };

    initializeContract();
  }, [address, walletData]);

  if (!walletData || !userAddress) {
    return <div>Loading or no wallet found...</div>;
  }

  const cancelTransactionsWithNonce = async (nonce: number, walletAddress: string, transactionId: string) => {
    if (!walletData || !userAddress) {
      console.error("Wallet data or user address is not available");
      return;
    }

    if (typeof window.ethereum === "undefined") {
      console.log("MetaMask is installed!");
      return;
    }

    try {
      const transactions = await fetchTransactionsWithNonce(nonce, walletAddress);
      const validTransactionIdsToCancel = transactions.filter(tx => tx.id && tx.id !== transactionId).map(tx => tx.id);

      if (validTransactionIdsToCancel.length > 0) {
        await cancelTransactions(validTransactionIdsToCancel);
        console.log("Cancelled transactions with nonce:", nonce);
      } else {
        console.log("No transactions to cancel with nonce:", nonce);
      }

      console.log("Cancelled transactions with nonce:", nonce);
    } catch (error) {
      console.error("Error in cancelling transactions:", error);
    }
  };

  const canProposeTransaction = (
    userAddress: string,
    action: string,
    signerAddress: string,
    currentSigners: string[],
  ) => {
    const isSignerOrOwner = currentSigners.includes(userAddress);

    // Check if the user is trying to add/remove themselves
    if (userAddress === signerAddress) {
      console.error("You cannot add/remove yourself as a signer.");
      return false;
    }

    // Check if the user is trying to add/remove an existing signer
    if (action === "addSigner" && currentSigners.includes(signerAddress)) {
      console.error("The address is already a signer.");
      return false;
    }
    if (action === "removeSigner" && !currentSigners.includes(signerAddress)) {
      console.error("The address is not a current signer.");
      return false;
    }

    return isSignerOrOwner;
  };

  const proposeTransaction = async () => {
    if (!canProposeTransaction(userAddress, predefinedTxData.methodName, predefinedTxData.signer, walletData.signers))
      return;

    if (!walletData || !userAddress) {
      console.error("Wallet data or user address is not available");
      return;
    }

    if (typeof window.ethereum === "undefined") {
      console.log("MetaMask is installed!");
      return;
    }

    try {
      // Correctly initializing the provider with ethers.BrowserProvider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(walletData.address, MetaMultiSigWallet.abi, signer);

      // Dynamically encode the callData based on predefinedTxData.methodName
      let callData = "";
      if (predefinedTxData.methodName === "addSigner" || predefinedTxData.methodName === "removeSigner") {
        callData = contract.interface.encodeFunctionData(predefinedTxData.methodName, [
          predefinedTxData.signer,
          predefinedTxData.newSignaturesNumber,
        ]);
      }

      const newTransactionData: MultisigTransaction = {
        walletAddress: walletData.address,
        threshold: predefinedTxData.newSignaturesNumber,
        action: predefinedTxData.methodName,
        status: "proposed",
        proposedBy: userAddress,
        nonce: walletData.nonce as number,
        signers: [],
        created: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        callData: callData,
        txHash: "",
      };

      // Write to Firebase
      const transactionId = await createNewTransaction(newTransactionData);

      // Proceed with cancellation only if transactionId is defined
      if (transactionId && typeof walletData.nonce === "number") {
        await cancelTransactionsWithNonce(walletData.nonce, walletData.address, transactionId);
      }
    } catch (error) {
      console.error("Error proposing transaction:", error);
    }
  };
  return (
    <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full">
      <div className="max-w-full">Current Sigs Req: {String(walletData.threshold)}</div>

      <div className="mt-6 w-full space-y-3">
        {walletData.signers?.map((event, i) => {
          return (
            <div key={i} className="flex justify-between">
              <Address address={event} />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 form-control w-full">
        <div className="w-full">
          <label className="label">
            <span className="label-text">Select method</span>
          </label>
          <select
            className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
            value={predefinedTxData.methodName}
            onChange={e =>
              setPredefinedTxData({ ...predefinedTxData, methodName: e.target.value as Method, callData: "" })
            }
          >
            {OWNERS_METHODS.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <AddressInput
          placeholder="Signer address"
          value={predefinedTxData.signer}
          onChange={s => setPredefinedTxData({ ...predefinedTxData, signer: s })}
        />

        <IntegerInput
          placeholder="New № of signatures required"
          value={String(predefinedTxData.newSignaturesNumber)}
          onChange={s => {
            const stringValue = String(s);
            const value = parseInt(stringValue, 10);
            if (!isNaN(value)) {
              setPredefinedTxData({ ...predefinedTxData, newSignaturesNumber: value });
            } else {
              setPredefinedTxData({ ...predefinedTxData, newSignaturesNumber: 0 });
            }
          }}
          hideSuffix
        />

        <button
          className="btn btn-secondary btn-sm"
          disabled={!predefinedTxData.signer || !predefinedTxData.newSignaturesNumber}
          onClick={proposeTransaction}
        >
          Propose Tx
        </button>
      </div>
    </div>
  );
};

export default UpdateOwnersForm;
