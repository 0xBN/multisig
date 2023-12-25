import React, { useState } from "react";
import { ethers } from "ethers";
import { isAddress } from "viem/utils";
import { useAccount } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
import useEthereum from "~~/hooks/custom/useEthereum";
import useMultisigSigners from "~~/hooks/custom/useMultisigSigners";
import useWalletConnection from "~~/hooks/custom/useWalletConnection";
import { addFirestoreDocument } from "~~/services/firebaseService";
import { MultisigWallet } from "~~/types/multisigWallet";
import { parseErrorMessage } from "~~/utils/helper";
import { notification } from "~~/utils/scaffold-eth";

interface MultisigWalletFormProps {
  signers: string[];
  addSigner: () => void;
  removeSigner: (index: number) => void;
  updateSigner: (value: string, index: number) => void;
  threshold: number;
  setThreshold: (value: number) => void;
  thresholdOptions: number[];
  setMultisigWalletData: (data: MultisigWallet) => void;
}

const NewMultisigWalletForm: React.FC<MultisigWalletFormProps> = ({
  signers,
  addSigner,
  removeSigner,
  updateSigner,
  threshold,
  setThreshold,
  thresholdOptions,
  setMultisigWalletData,
}) => {
  const { setSigners } = useMultisigSigners();
  const { chainId, isConnectedWalletAdded, connectedWallet } = useWalletConnection(signers);
  const { signer } = useEthereum();
  const [isDeploying, setIsDeploying] = useState(false);
  const { address: userAddress } = useAccount();

  // Calculate valid signers count and threshold options
  const validSignersCount = signers.filter(address => isAddress(address)).length;

  const handleAddConnectedWallet = () => {
    if (connectedWallet && !signers.includes(connectedWallet)) {
      setSigners([...signers, connectedWallet]);
    }
  };

  const deployMultisigWallet = async () => {
    setIsDeploying(true);
    if (signers.length !== validSignersCount) {
      notification.error("Error, please fill in all signers with valid addresses.");
      return;
    }

    let deployingToast;
    const walletConfirmToast = notification.loading("Confirm the transaction in your wallet.");

    try {
      // Dynamically import the ABI
      const contractArtifact = await import(
        "../../hardhat/artifacts/contracts/MetaMultiSigWallet.sol/MetaMultiSigWallet.json"
      );

      const contractABI = contractArtifact.default.abi;
      const contractBytecode = contractArtifact.default.bytecode;

      if (!chainId || !window.ethereum) {
        console.error("Network not detected or Ethereum wallet is not available");
        notification.error("Network not detected or Ethereum wallet is not available");
        return;
      }

      const multisigWalletFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);

      // Filter valid signers and pass the constructor arguments
      const validSigners = signers.filter(address => isAddress(address));
      const multisigWallet = await multisigWalletFactory.deploy(chainId, validSigners, threshold);

      if (multisigWallet) {
        notification.remove(walletConfirmToast);
        deployingToast = notification.loading("Deploying Multisig Wallet...");
      }

      // Wait for the deployment to be mined
      await multisigWallet.waitForDeployment();

      const deployedAddress = multisigWallet.target as string;

      // Successful deployment, now update Firebase
      const newMultisigWalletData: MultisigWallet = {
        address: deployedAddress,
        signers: validSigners,
        threshold: threshold,
        txHash: deployedAddress,
      };

      await addFirestoreDocument("multisigWallets", newMultisigWalletData);
      setMultisigWalletData(newMultisigWalletData);

      notification.success(`Multisig Wallet deployed. Contract address: ${deployedAddress}`);
    } catch (error) {
      console.error("Error deploying multisig wallet:", error);
      if (error instanceof Error) {
        notification.error(parseErrorMessage(error.message) || "Error deploying multisig wallet");
      }
      if (walletConfirmToast) {
        notification.remove(walletConfirmToast);
      }
    } finally {
      if (deployingToast) {
        notification.remove(deployingToast);
      }
      setIsDeploying(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Create a Multisig Wallet</h1>
      <div>
        <div className={`mb-4 flex justify-evenly items-center rounded-md p-4 `}>
          {connectedWallet && (
            <button disabled={isConnectedWalletAdded} className="btn btn-outline" onClick={handleAddConnectedWallet}>
              {isConnectedWalletAdded ? "Added Self" : "Add Self"}
            </button>
          )}
          <button className="btn btn-outline" onClick={addSigner}>
            Add Sig
          </button>
          <div className="flex">
            <label className="label">
              <span className="label-text">Sigs Required</span>
            </label>
            <select
              className="select select-bordered select-sm  max-w-xs"
              value={threshold}
              onChange={e => setThreshold(parseInt(e.target.value))}
              disabled={validSignersCount < 1}
            >
              {thresholdOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        {signers.map((address, index) => (
          <div key={index} className="flex justify-between my-4">
            <AddressInput value={address} onChange={value => updateSigner(value, index)} className="flex-grow mr-2" />

            <button onClick={() => removeSigner(index)} className="text-red-600">
              x
            </button>
          </div>
        ))}

        <button
          className="btn btn-primary mt-4"
          disabled={isDeploying || validSignersCount === 0 || userAddress === undefined}
          onClick={deployMultisigWallet}
        >
          {userAddress ? "Deploy Multisig" : "Connect Wallet"}
        </button>
      </div>
    </>
  );
};

export default NewMultisigWalletForm;
