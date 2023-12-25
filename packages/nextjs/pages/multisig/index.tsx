import { type FC, useEffect } from "react";
import { useAccount } from "wagmi";
import MultisigWalletDisplay from "~~/components/MultisigWalletDisplay";
import { useGlobalState } from "~~/services/store/store";

const Multisig: FC = () => {
  const { multisigWallets, fetchMultisigWallets } = useGlobalState();

  const { address: userAddress } = useAccount();

  useEffect(() => {
    if (userAddress) {
      fetchMultisigWallets(userAddress);
    }
  }, [userAddress, fetchMultisigWallets]);

  if (!userAddress || multisigWallets.length === 0) {
    return <div>No multisig wallets found.</div>;
  }

  return (
    <>
      <h1 className="text-4xl font-bold ">Your Multisig{multisigWallets.length === 1 ? "" : "s"}</h1>
      <div>
        {multisigWallets.map(wallet => (
          <MultisigWalletDisplay wallet={wallet} contractAddress={wallet.address} key={wallet.id} showEnter={true} />
        ))}
      </div>
    </>
  );
};

export default Multisig;
