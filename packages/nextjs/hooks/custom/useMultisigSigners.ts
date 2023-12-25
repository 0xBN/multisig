import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Address } from "viem";
import { isAddress } from "viem/utils";

const useMultisigSigners = () => {
  const [signers, setSigners] = useLocalStorage<Address[]>("multisigSigners", [""]);
  const [threshold, setThreshold] = useLocalStorage<number>("multisigThreshold", 1);
  const [validSignersCount, setValidSignersCount] = useState(0);
  const [thresholdOptions, setThresholdOptions] = useState<number[]>([]);

  // Validate and count the number of valid signers
  useEffect(() => {
    const validCount = signers.filter(address => isAddress(address)).length;
    setValidSignersCount(validCount);
  }, [signers]);

  // Update threshold options based on the number of valid signers
  useEffect(() => {
    const options = Array.from({ length: validSignersCount }, (_, i) => i + 1);
    setThresholdOptions(options);

    // Adjust threshold if it exceeds the number of valid signers
    if (threshold > validSignersCount) {
      setThreshold(validSignersCount || 1);
    }
  }, [validSignersCount, threshold, setThreshold]);

  // Functions to modify signers
  const addSigner = () => setSigners([...signers, ""]);
  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };
  const updateSigner = (value: Address, index: number) => {
    const newSigners = [...signers];
    newSigners[index] = value;
    setSigners(newSigners);
  };

  return {
    signers,
    setSigners,
    threshold,
    setThreshold,
    validSignersCount,
    thresholdOptions,
    addSigner,
    removeSigner,
    updateSigner,
  };
};

export default useMultisigSigners;
