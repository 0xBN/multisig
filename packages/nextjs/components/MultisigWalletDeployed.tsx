import React from "react";
import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { MultisigWallet } from "~~/types/multisigWallet";

interface MultisigWalletDeployedProps {
  multisigWalletData: MultisigWallet;
  resetForm: () => void;
}

const MultisigWalletDeployed: React.FC<MultisigWalletDeployedProps> = ({ multisigWalletData, resetForm }) => {
  return (
    <div className="px-5 text-center">
      <h1 className="text-4xl font-bold mb-4">Successfully Deployed</h1>
      <div className="grid place-content-center">
        <Address address={multisigWalletData.address} />
      </div>
      <div className="mb-4 flex justify-evenly items-center rounded-md p-4 flex-col sm:flex-row gap-4">
        <Link href={`/multisig/${multisigWalletData.address}`}>
          <button className={`btn btn-outline`}>Enter Wallet</button>
        </Link>
        {multisigWalletData && (
          <a
            href={`${scaffoldConfig.targetNetwork.blockExplorers.default.url}/address/${multisigWalletData.address}`}
            target="_blank"
          >
            <button className="btn btn-secondary">Block Explorer</button>
          </a>
        )}
        <button className="btn btn-secondary" onClick={resetForm}>
          Create Another
        </button>
      </div>
    </div>
  );
};

export default MultisigWalletDeployed;
