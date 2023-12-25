import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import MultisigTransactionsList from "~~/components/MultisigTransactionsList";
import MultisigWalletDisplay from "~~/components/MultisigWalletDisplay";
import TabButton from "~~/components/TabButton";
import UpdateOwnersForm from "~~/components/UpdateOwnersForm";
import { Address } from "~~/components/scaffold-eth";
import { DashboardTab } from "~~/config/multisigDashboard";
import useWalletOwnership from "~~/hooks/custom/useWalletOwnership";
import { Method } from "~~/types/multisigTransaction";

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
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.Overview);
  const { address: userAddress } = useAccount();
  const multisigWalletAddress = Array.isArray(address) ? address[0] : address;
  const { isWalletOwner, walletData } = useWalletOwnership(multisigWalletAddress, userAddress);

  if (!userAddress) return <div>Connect your wallet to continue.</div>;
  if (!walletData) return <div>Loading...</div>;
  if (!isWalletOwner) return <div>You are not an owner of this wallet.</div>;

  return (
    <>
      <Address address={multisigWalletAddress} />
      {/* Tab Buttons */}
      <div className="flex gap-2 p-2 flex-col  overflow-auto sm:flex-row sm:gap-4">
        {Object.values(DashboardTab).map(tab => (
          <TabButton
            key={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            label={tab.charAt(0).toUpperCase() + tab.slice(1)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col items-center max-w-full">
        {activeTab === DashboardTab.Overview && walletData && (
          <MultisigWalletDisplay wallet={walletData} contractAddress={walletData.address} showEnter={false} />
        )}
        {activeTab === DashboardTab.Owners && <UpdateOwnersForm />}
        {activeTab === DashboardTab.Transactions && walletData && <MultisigTransactionsList walletData={walletData} />}
      </div>
    </>
  );
};

export default MultisigWalletPage;
