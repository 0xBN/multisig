import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MultisigTransactionsList from "~~/components/MultisigTransactionsList";
import MultisigWalletDisplay from "~~/components/MultisigWalletDisplay";
import UpdateOwnersForm from "~~/components/UpdateOwnersForm";
import { Address } from "~~/components/scaffold-eth";
import { fetchMultisigWalletData } from "~~/services/firebaseService";
import { MultisigWallet } from "~~/types/multisigWallet";

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

const MultisigWalletPage = () => {
  const router = useRouter();
  const { address } = router.query;
  const [walletData, setWalletData] = useState<MultisigWallet | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const multisigWalletAddress = Array.isArray(address) ? address[0] : address;

  const fetchMultisigWalletAndUpdateState = async (multisigWalletAddress: string) => {
    const data = await fetchMultisigWalletData(multisigWalletAddress);
    data ? setWalletData(data as MultisigWallet) : setWalletData(null);
  };

  useEffect(() => {
    if (multisigWalletAddress) {
      fetchMultisigWalletAndUpdateState(multisigWalletAddress);
    }
  }, [multisigWalletAddress]);

  return (
    <>
      <Address address={multisigWalletAddress} />
      {/* Tab Buttons */}
      <div className="flex gap-2 p-2 flex-col  overflow-auto sm:flex-row sm:gap-4">
        <button
          className={`btn btn-secondary ${activeTab === "overview" ? "btn-active underline" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Wallet Overview
        </button>
        <button
          className={`btn btn-secondary ${activeTab === "owners" ? "btn-active underline" : ""}`}
          onClick={() => setActiveTab("owners")}
        >
          Update Owners
        </button>
        {walletData && (
          <button
            className={`btn btn-secondary ${activeTab === "transactions" ? "btn-active underline" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions List
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col items-center max-w-full">
        {walletData && activeTab === "overview" && (
          <MultisigWalletDisplay
            wallet={walletData}
            contractAddress={walletData.address}
            key={walletData.id}
            showEnter={false}
          />
        )}
        {activeTab === "owners" && <UpdateOwnersForm />}
        {activeTab === "transactions" && walletData && <MultisigTransactionsList walletData={walletData} />}
      </div>
    </>
  );
};

export default MultisigWalletPage;
