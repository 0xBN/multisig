import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import { Address } from "viem";
import { isAddress } from "viem/utils";
import { useAccount, useNetwork } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { AddressInput } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const [signers, setSigners] = useLocalStorage<Address[]>(`multisigSigners`, [""]);
  const [threshold, setThreshold] = useLocalStorage<number>(`multisigThreshold`, 1);
  const [isConnectedWalletAdded, setIsConnectedWalletAdded] = useState(false);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const network = useNetwork();
  const { address: connectedWallet } = useAccount();

  useEffect(() => {
    if (network.chain) {
      setChainId(network.chain.id);
    }
  }, [network.chain]);

  // Calculate valid signers count and threshold options
  const validSignersCount = signers.filter(address => isAddress(address)).length;
  const thresholdOptions = Array.from({ length: validSignersCount }, (_, i) => i + 1);

  useEffect(() => {
    if (threshold > validSignersCount) {
      setThreshold(validSignersCount || 1);
    }
  }, [setThreshold, threshold, validSignersCount]);

  // Check if the connected wallet is already a signer
  useEffect(() => {
    if (connectedWallet) {
      setIsConnectedWalletAdded(signers.includes(connectedWallet));
    }
  }, [signers, connectedWallet]);

  const handleAddSigner = () => setSigners([...signers, ""]);
  const handleAddConnectedWallet = () => {
    if (connectedWallet && !signers.includes(connectedWallet)) {
      setSigners([...signers, connectedWallet]);
    }
  };

  const handleChangeSigner = (value: Address, index: number) => {
    const newSigners = [...signers];
    newSigners[index] = value;
    setSigners(newSigners);
  };
  const handleRemoveSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const deployMultisigWallet = async () => {
    let deployingToast;
    const walletConfirmToast = notification.loading("Confirm the transaction in your wallet.");

    if (signers.length !== validSignersCount) {
      notification.error("Error, please fill in all signers with valid addresses.");
      return;
    }

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

      // Use ethers to get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

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

      notification.success(`Contract address: ${multisigWallet.target}`);

      // Handle post-deployment
      console.log("Multisig Wallet deployed to:", multisigWallet);
      notification.success("Multisig Wallet deployed successfully!");
      console.log("hi");
    } catch (error) {
      console.error("Error deploying multisig wallet:", error);
      notification.error("Deployment failed. See console for details.");
    } finally {
      if (deployingToast) {
        notification.remove(deployingToast);
      }
    }
  };

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 text-center">
          <h1 className="text-4xl font-bold mb-4">Create a Multisig Wallet</h1>
          <div>
            <div className={`mb-4 flex justify-evenly items-center rounded-md p-4 `}>
              {connectedWallet && (
                <button
                  disabled={isConnectedWalletAdded}
                  className="btn btn-outline mt-2"
                  onClick={handleAddConnectedWallet}
                >
                  {isConnectedWalletAdded ? "Added Self" : "Add Self"}
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleAddSigner}>
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
                <AddressInput
                  value={address}
                  onChange={value => handleChangeSigner(value, index)}
                  className="flex-grow mr-2"
                />

                <button onClick={() => handleRemoveSigner(index)} className="text-red-600">
                  x
                </button>
              </div>
            ))}

            <button className="btn btn-primary mt-4" onClick={deployMultisigWallet}>
              Deploy Multisig
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
