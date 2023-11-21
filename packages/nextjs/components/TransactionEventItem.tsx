import { type FC } from "react";
import { Address, BlockieAvatar } from "./scaffold-eth";
import { Address as AddressType, formatEther } from "viem";

type TransactionEventItemProps = {
  hash: string;
  nonce: bigint;
  owner: AddressType;
  to: AddressType;
  value: bigint;
};

export const TransactionEventItem: FC<TransactionEventItemProps> = ({ hash, nonce, owner, to, value }) => {
  return (
    <div className="flex flex-col">
      <div className="flex gap-4">
        <div className=""># {String(nonce)}</div>
        <div className="flex gap-1">
          Tx <BlockieAvatar size={20} address={hash} /> {hash.slice(0, 7)}
        </div>
        <div className="flex gap-1">
          To <Address address={to} />
        </div>
        <div>{formatEther(value)} $</div>
        <div className="flex gap-1">
          Executed by <Address address={owner} />
        </div>
      </div>
    </div>
  );
};
