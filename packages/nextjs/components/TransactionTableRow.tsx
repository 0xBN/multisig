import React, { FC } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { tableHeaders } from "~~/config/transactionTable";
import scaffoldConfig from "~~/scaffold.config";
import { convertFirestoreTimestampToDate } from "~~/services/firebaseService";
import { MultisigTransaction } from "~~/types/multisigTransaction";
import { truncateAddress } from "~~/utils/helper";

interface TransactionTableRowProps {
  transaction: MultisigTransaction;
}

const TransactionTableRow: FC<TransactionTableRowProps> = ({ transaction }) => {
  const { address: userAddress } = useAccount();
  // TODO: Add functionality to handleSignTransaction and handleExecuteTransaction
  const handleSignTransaction = () => {
    console.log("Sign transaction clicked");
  };
  const handleExecuteTransaction = () => {
    console.log("Execute transaction clicked");
  };

  const renderTableCell = (key: string) => {
    switch (key) {
      case "proposedBy":
        return <Address address={transaction.proposedBy} size="base" />;
      case "lastUpdated":
        return convertFirestoreTimestampToDate(transaction.lastUpdated);
      case "created":
        return convertFirestoreTimestampToDate(transaction.created);
      case "signers":
        return transaction.signers.map((signer, i) => <Address key={i} address={signer} size="base" />);
      case "txHash":
        return (
          <a
            href={`${scaffoldConfig.targetNetwork.blockExplorers.default.url}/tx/${transaction.txHash}`}
            target="_blank"
          >
            {truncateAddress(transaction.txHash)}
          </a>
        );
      case "actions":
        const signed = transaction.signers.includes(transaction.proposedBy) || transaction.proposedBy === userAddress;
        const executed = transaction.status === "executed";
        return (
          <div className={`flex flex-col gap-2`}>
            {!signed && (
              <button onClick={handleSignTransaction} disabled={signed} className={`btn text-xs`}>
                {signed ? "signed" : "sign"}
              </button>
            )}
            {!executed && (
              <button
                onClick={handleExecuteTransaction}
                disabled={transaction.signers.length < transaction.threshold}
                className={`btn text-xs`}
              >
                {executed ? "executed" : "execute"}
              </button>
            )}
            {signed && executed && "signed & executed"}
          </div>
        );

      // ... other cases
      default:
        return transaction[key];
    }
  };

  return (
    <tr key={transaction.id}>
      {tableHeaders.map(header => (
        <td key={header.key} className="border border-gray-300 p-1 overflow-x-auto text-xs text-center align-middle">
          {renderTableCell(header.key)}
        </td>
      ))}
    </tr>
  );
};

export default TransactionTableRow;
