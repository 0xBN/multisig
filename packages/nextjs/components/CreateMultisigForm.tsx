import React, { useState } from "react";
import MultisigWalletDeployed from "./MultisigWalletDeployed";
import NewMultisigWalletForm from "./NewMultisigWalletForm";
import { useAccount } from "wagmi";
import useMultisigSigners from "~~/hooks/custom/useMultisigSigners";
import { MultisigWallet } from "~~/types/multisigWallet";

const CreateMultisigForm = () => {
  const { signers, addSigner, removeSigner, updateSigner, threshold, setThreshold, thresholdOptions, setSigners } =
    useMultisigSigners();
  const [multisigWalletData, setMultisigWalletData] = useState<MultisigWallet | null>(null);
  const { address: userAddress } = useAccount();

  const resetForm = () => {
    setSigners([]);
    setThreshold(1);
    setMultisigWalletData(null);
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 text-center">
        {multisigWalletData === null ? (
          <NewMultisigWalletForm
            signers={signers}
            addSigner={addSigner}
            removeSigner={removeSigner}
            updateSigner={updateSigner}
            threshold={threshold}
            setThreshold={setThreshold}
            thresholdOptions={thresholdOptions}
            setMultisigWalletData={setMultisigWalletData}
          />
        ) : (
          <MultisigWalletDeployed multisigWalletData={multisigWalletData} resetForm={resetForm} />
        )}
      </div>
    </div>
  );
};

export default CreateMultisigForm;
