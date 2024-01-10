import { FC } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Address, Balance } from "~~/components/scaffold-eth";
import { MultisigWallet } from "~~/types/multisigWallet";

const MultisigWalletDisplay: FC<{ contractAddress: string; wallet: MultisigWallet; showEnter: boolean }> = ({
  contractAddress,
  wallet,
  showEnter = true,
}) => {
  return (
    <div className="flex items-center flex-col flex-grow w-full ">
      <div className="flex flex-col gap-4 items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-4 w-full max-w-lg">
        <div className={`text-sm flex flex-col items-start w-full`}></div>
        <div className={`flex flex-col items-center justify-center text-sm w-full`}>
          <>
            Multisig Address:
            <Address address={contractAddress} />
            <Balance address={contractAddress} />
          </>
        </div>
        <QRCodeSVG value={contractAddress || ""} size={125} />

        <div className={`flex flex-col items-start justify-center text-sm`}>
          Signer{wallet.signers.length === 1 ? "" : "s"}: {wallet.signers.length} | Required Sigs: {wallet.threshold}
          <div className={`mt-2`}>
            {wallet.signers.map(signer => (
              <Address key={signer} address={signer} />
            ))}
          </div>
        </div>

        {showEnter && (
          <Link className="btn btn-primary" href={`/multisig/${contractAddress}`}>
            Enter
          </Link>
        )}
      </div>
    </div>
  );
};

export default MultisigWalletDisplay;
