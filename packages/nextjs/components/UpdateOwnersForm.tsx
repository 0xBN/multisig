import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useLocalStorage } from "usehooks-ts";
import { useAccount } from "wagmi";
import { Address, AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import useEthereum from "~~/hooks/custom/useEthereum";
import { addFirestoreDocument, createNewTransaction, fetchMultisigWalletData } from "~~/services/firebaseService";

interface MultisigWallet {
  id: string;
  address: string;
  signers: string[];
  threshold: number;
}

export type Method = "addSigner" | "removeSigner" | "transferFunds";
export const METHODS: Method[] = ["addSigner", "removeSigner", "transferFunds"];
export const OWNERS_METHODS = METHODS.filter(m => m !== "transferFunds");

export const DEFAULT_TX_DATA = {
  methodName: OWNERS_METHODS[0],
  signer: "",
  newSignaturesNumber: "",
};

export type PredefinedTxData = {
  methodName: Method;
  signer: string;
  newSignaturesNumber: string;
  to?: string;
  amount?: string;
  callData?: `0x${string}` | "";
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

  if (!walletData || !userAddress) {
    return <div>Loading or no wallet found...</div>;
  }

  const proposeTransaction = async () => {
    if (!walletData || !userAddress) {
      console.error("Wallet data or user address is not available");
      return;
    }

    try {
      const newTransactionData = {
        walletAddress: walletData.address,
        action: predefinedTxData.methodName,
        targetSigner: predefinedTxData.signer,
        newSignaturesRequired: predefinedTxData.newSignaturesNumber,
        status: "pending",
        approvedBy: [userAddress],
      };

      // Write to Firebase
      const transactionId = await createNewTransaction(newTransactionData);
      console.log("Transaction proposed:", transactionId);

      // Optional: Update UI or navigate to another page
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
          value={predefinedTxData.newSignaturesNumber}
          onChange={s => setPredefinedTxData({ ...predefinedTxData, newSignaturesNumber: s as string })}
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
