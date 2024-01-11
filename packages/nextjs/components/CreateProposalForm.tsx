import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MetaMultiSigWallet from "../abis/MetaMultiSigWallet.json";
// import MetaMultiSigWallet from "../../hardhat/artifacts/contracts/MetaMultiSigWallet.sol/MetaMultiSigWallet.json";
import { Contract, ethers } from "ethers";
import { isAddress } from "viem";
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
import { notification } from "~~/utils/scaffold-eth";

export const METHODS: Method[] = ["addSigner", "removeSigner", "openStream", "closeStream"];

interface WalletData {
  address: string;
  nonce: number; // or string, depending on how you handle nonces
}

// TODO: Propose transferFunds transaction

export const DEFAULT_TX_DATA = {
  methodName: METHODS[0],
  signer: "",
  newSignaturesNumber: "",
  amount: "",
  to: "",
  frequency: "",
};

const CreateProposalForm = () => {
  const [walletData, setWalletData] = useState<MultisigWallet | null>(null);
  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();
  const [methodName, setMethodName] = useState<Method>(METHODS[0]);
  const [proposedTransaction, setProposedTransaction] = useState<boolean>(false);

  // Update both methodName and predefinedTxData when select changes
  const handleMethodChange = (newMethod: Method) => {
    setMethodName(newMethod);
    setPredefinedTxData({ ...predefinedTxData, methodName: newMethod });
  };

  const [predefinedTxData, setPredefinedTxData] = useState<PredefinedTxData>(DEFAULT_TX_DATA);

  // Use a single effect to handle router query updates and predefined method changes
  useEffect(() => {
    if (typeof address === "string") {
      fetchMultisigWalletData(address).then(data => {
        if (data) {
          setWalletData(data as MultisigWallet);
        }
      });
    }

    if (predefinedTxData && predefinedTxData.methodName) {
      setMethodName(predefinedTxData.methodName);
    }
  }, [address, predefinedTxData, predefinedTxData.methodName]);

  if (!walletData || !userAddress) {
    return <div>Loading or no wallet found...</div>;
  }

  const cancelTransactionsWithNonce = async (nonce: number, walletAddress: string, transactionId: string) => {
    if (!walletData || !userAddress) {
      console.error("Wallet data or user address is not available");
      return;
    }

    if (typeof window.ethereum === "undefined") return;

    try {
      const transactions = await fetchTransactionsWithNonce(nonce, walletAddress);
      const validTransactionIdsToCancel = transactions.filter(tx => tx.id && tx.id !== transactionId).map(tx => tx.id);

      if (validTransactionIdsToCancel.length > 0) {
        await cancelTransactions(validTransactionIdsToCancel);
      }
    } catch (error) {
      console.error("Error in cancelling transactions:", error);
    }
  };

  const canProposeSignerUpdate = (
    userAddress: string,
    action: string,
    signerAddress: string,
    currentSigners: string[],
    newSignaturesRequired: number,
  ) => {
    const isSignerOrOwner = currentSigners.includes(userAddress);

    // Check for zero address
    if (signerAddress === "0x0000000000000000000000000000000000000000") {
      notification.error("Invalid address: zero address is not allowed.");
      return false;
    }

    // Check threshold is not greater than the number of signers
    if (newSignaturesRequired > currentSigners.length + 1) {
      notification.error("Invalid operation: Signatures required cannot be greater than the number of signers.");
      return false;
    }

    // Check for non-zero signatures required
    if (newSignaturesRequired <= 0) {
      notification.error("Invalid operation: Signatures required must be non-zero.");
      return false;
    }

    // Check if the user is trying to add/remove themselves
    if (userAddress === signerAddress) {
      notification.error("You cannot add/remove yourself as a signer.");
      return false;
    }

    // Check if the user is trying to add/remove an existing signer
    if (action === "addSigner" && currentSigners.includes(signerAddress)) {
      notification.error("The address is already a signer.");
      return false;
    }
    if (action === "removeSigner" && !currentSigners.includes(signerAddress)) {
      notification.error("The address is not a current signer.");
      return false;
    }

    return isSignerOrOwner;
  };

  async function generateTxHash(
    contract: Contract,
    methodName: string,
    methodParams: any[],
    walletData: WalletData,
  ): Promise<string> {
    let callData = "";
    let to: string = walletData.address;
    let value: number | string = 0;

    // Encode the callData based on the methodName and its parameters
    switch (methodName) {
      case "addSigner":
      case "removeSigner":
        callData = contract.interface.encodeFunctionData(methodName, methodParams);
        break;
      case "transferFunds":
        to = methodParams[0] as string;
        value = methodParams[1] as number | string;
        callData = contract.interface.encodeFunctionData(methodName, methodParams.slice(2));
        break;
      case "openStream":
      case "closeStream":
        callData = contract.interface.encodeFunctionData(methodName, methodParams);
        break;
    }

    // Generate the transaction hash
    const generatedTransactionHash = await contract.getTransactionHash(
      BigInt(walletData.nonce),
      String(to),
      BigInt(value),
      callData as `0x${string}`,
    );

    return generatedTransactionHash;
  }

  const transferFunds = async () => {
    console.log("transferFunds");
    // TODO: Can propose transferFunds transaction
  };

  const updateSigner = async () => {
    if (!walletData || !userAddress) {
      notification.error("Wallet data or user address is not available");
      return;
    }

    if (typeof window.ethereum === "undefined") {
      console.log("MetaMask is installed!");
      return;
    }

    if (
      !canProposeSignerUpdate(
        userAddress,
        predefinedTxData.methodName,
        predefinedTxData.signer,
        walletData.signers,
        parseInt(String(predefinedTxData.newSignaturesNumber), 10),
      )
    )
      return;

    try {
      // Correctly initializing the provider with ethers.BrowserProvider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(walletData.address, MetaMultiSigWallet.abi, signer);

      console.log({ signer });

      console.log({
        methodName: predefinedTxData.methodName,
        params: [predefinedTxData.signer, predefinedTxData.newSignaturesNumber],
        address: walletData.address,
        nonce: walletData.nonce as number,
      });

      const generatedTransactionHash = await generateTxHash(
        contract,
        predefinedTxData.methodName,
        [predefinedTxData.signer, predefinedTxData.newSignaturesNumber],
        { address: walletData.address, nonce: walletData.nonce as number },
      );

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
        threshold: parseInt(String(predefinedTxData.newSignaturesNumber), 10),
        action: predefinedTxData.methodName,
        status: "proposed",
        proposedBy: userAddress,
        nonce: walletData.nonce as number,
        signers: [],
        callData: callData,
        signatureRequiredTransactionHash: generatedTransactionHash,
        targetAddress: predefinedTxData.signer,
      };

      // Write to Firebase
      const transactionId = await createNewTransaction(newTransactionData);

      // Proceed with cancellation only if transactionId is defined
      if (transactionId && typeof walletData.nonce === "number") {
        await cancelTransactionsWithNonce(walletData.nonce, walletData.address, transactionId);
      }
      // Notify transaction is proposed, go to sign it at the Transactions section
      notification.success("Transaction proposed.");
      // Clear the predefinedTxData
      setPredefinedTxData(DEFAULT_TX_DATA);
      setProposedTransaction(true);
    } catch (error) {
      notification.error(`Error proposing transaction: ${error}`);
    }
  };

  const isStreamOpen = (action: string) => {
    const streamOpen = walletData?.openStreams?.some(address => address === predefinedTxData.to);

    if ((action === "openStream" && streamOpen) || (action === "closeStream" && !streamOpen)) {
      const errorMessage =
        action === "openStream" ? "User already has an open stream." : "User does not have an open stream.";
      notification.error(errorMessage);
      return false;
    }

    return true;
  };

  const proposeStream = async (action: string) => {
    if (!walletData.signers.includes(userAddress)) {
      notification.error("You are not a signer of this wallet");
      return;
    }

    if (!walletData.signers.includes(predefinedTxData.to)) {
      notification.error("The address is not a signer of this wallet");
      return;
    }

    if (!isStreamOpen(action)) return;

    // Validate input data
    if (!walletData || !userAddress) {
      notification.error("Wallet data or user address is not available");
      return;
    }

    if (!isAddress(predefinedTxData.to)) {
      notification.error("Invalid address provided for the stream");
      return;
    }
    if (typeof window.ethereum === "undefined") return;

    // Prepare parameters for the contract function
    const methodParams = [predefinedTxData.to];
    if (action === "openStream") {
      if (parseInt(String(predefinedTxData.amount), 10) <= 0) {
        notification.error("Invalid amount for opening a stream");
        return;
      }
      methodParams.push(String(predefinedTxData.amount));
      if (parseInt(String(predefinedTxData.frequency), 10) <= 0) {
        notification.error("Invalid frequency for opening a stream");
        return;
      }
      methodParams.push(String(predefinedTxData.frequency));
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(walletData.address, MetaMultiSigWallet.abi, signer);

      // Generate transaction hash
      const generatedTransactionHash = await generateTxHash(contract, action, methodParams, {
        address: walletData.address,
        nonce: walletData.nonce as number,
      });

      const callData = contract.interface.encodeFunctionData(action, methodParams);

      const newTransactionData: MultisigTransaction = {
        walletAddress: walletData.address,
        action: action,
        status: "proposed",
        proposedBy: userAddress,
        nonce: walletData.nonce as number,
        signers: [],
        callData: callData,
        signatureRequiredTransactionHash: generatedTransactionHash,
        targetAddress: predefinedTxData.to,
        amount: parseInt(String(predefinedTxData.amount), 10),
        frequency: parseInt(String(predefinedTxData.frequency), 10),
      };

      // Write to Firebase
      const transactionId = await createNewTransaction(newTransactionData);

      // Proceed with cancellation only if transactionId is defined
      if (transactionId && typeof walletData.nonce === "number") {
        await cancelTransactionsWithNonce(walletData.nonce, walletData.address, transactionId);
      }
      // Notify transaction is proposed, go to sign it at the Transactions section
      notification.success("Stream proposal submitted.");
      // Clear the predefinedTxData
      setPredefinedTxData(DEFAULT_TX_DATA);
      setProposedTransaction(true);
    } catch (error) {
      console.error(`Error in proposing stream: ${error}`);
      notification.error(`Error proposing stream: ${error}`);
    }
  };

  const proposeTransaction = async (methodName: string) => {
    switch (methodName) {
      case "addSigner":
      case "removeSigner":
        updateSigner();
        break;
      case "transferFunds":
        transferFunds();
        break;
      case "openStream":
        proposeStream("openStream");
        break;
      case "closeStream":
        proposeStream("closeStream");
        break;
      default:
        break;
    }
  };

  const transactionsButtonElement = document.querySelector(
    "#__next > div > div.flex.flex-col.min-h-screen.text-primary-content.font-space-grotesk > main > div.flex.gap-2.p-2.flex-col.overflow-auto.sm\\:flex-row.sm\\:gap-4 > button:nth-child(3)",
  ) as HTMLElement | null;

  const submitFormElement = (
    <div className="text-lg font-bold tracking-wide flex flex-col">
      <p>Transaction proposed!</p>
      {transactionsButtonElement && (
        <button className={`btn btn-primary outline`} onClick={() => transactionsButtonElement.click()}>
          Proceed to sign
        </button>
      )}
    </div>
  );
  return proposedTransaction ? (
    <>{submitFormElement}</>
  ) : (
    <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-4 min-w-[340px]">
      <div>Current Sigs Req: {String(walletData.threshold)}</div>

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
            <span className="label-text">Select method: {methodName}</span>
          </label>
          <select
            className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
            value={predefinedTxData.methodName}
            onChange={e => handleMethodChange(e.target.value as Method)}
          >
            {METHODS.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {(methodName === "addSigner" || methodName === "removeSigner") && (
          <>
            <AddressInput
              placeholder="Signer address"
              value={predefinedTxData.signer}
              onChange={s => setPredefinedTxData({ ...predefinedTxData, signer: s })}
            />
            <IntegerInput
              placeholder="New № of signatures required"
              value={String(predefinedTxData.newSignaturesNumber)}
              onChange={s => {
                if (/^\d*$/.test(s as string) || s === "") {
                  setPredefinedTxData({ ...predefinedTxData, newSignaturesNumber: s as string });
                }
              }}
              hideSuffix
            />
            <button
              className="btn btn-secondary btn-sm"
              disabled={!isAddress(predefinedTxData.signer) || !predefinedTxData.newSignaturesNumber}
              onClick={() => proposeTransaction(methodName)}
            >
              Propose Tx
            </button>
          </>
        )}
        {(methodName === "openStream" || methodName === "closeStream") && (
          <>
            <AddressInput
              placeholder="To address"
              value={predefinedTxData?.to}
              onChange={s => setPredefinedTxData({ ...predefinedTxData, to: s })}
            />
            {methodName === "openStream" && (
              <>
                <IntegerInput
                  placeholder="ETH Amount for the stream"
                  value={String(predefinedTxData.amount)}
                  onChange={s => {
                    if (/^\d*$/.test(s as string) || s === "") {
                      setPredefinedTxData({ ...predefinedTxData, amount: s as string });
                    }
                  }}
                  hideSuffix
                />
                <IntegerInput
                  placeholder="Frequency of stream (days)"
                  value={String(predefinedTxData.frequency)}
                  onChange={s => {
                    if (/^\d*$/.test(s as string) || s === "") {
                      setPredefinedTxData({ ...predefinedTxData, frequency: s as string });
                    }
                  }}
                  hideSuffix
                />
              </>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => proposeTransaction(methodName)}>
              {methodName === "openStream" ? "Open Stream" : "Close Stream"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateProposalForm;
