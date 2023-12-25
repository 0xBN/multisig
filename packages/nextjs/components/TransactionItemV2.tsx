import React, { FC } from "react";
import { Timestamp } from "firebase/firestore";
import { Address } from "~~/components/scaffold-eth";
import { convertFirestoreTimestampToDate } from "~~/services/firebaseService";

interface TransactionProps {
  transaction: {
    id: string;
    action: string;
    status: string;
    signers: string[];
    proposedBy: string;
    callData: string;
    created: Timestamp;
    nonce: number;
    threshold: number;
    lastUpdated: Timestamp;
    walletAddress: string;
  };
}

const TransactionItemV2: FC<TransactionProps> = ({ transaction }) => {
  const dateCreated = convertFirestoreTimestampToDate(transaction.created);
  const dateUpdated = convertFirestoreTimestampToDate(transaction.lastUpdated);

  return (
    <>
      <div>
        <strong>Action:</strong> {transaction.action}
      </div>
      <div>
        <strong>Status:</strong> {transaction.status}
      </div>
      <div>
        <strong>Proposed By:</strong> <Address address={transaction.proposedBy} />
      </div>
      <div>
        <strong>Nonce:</strong> {transaction.nonce}
      </div>
      <div>
        <strong>Threshold:</strong> {transaction.threshold}
      </div>
      <div>
        <strong>Last Updated:</strong> {dateUpdated}
      </div>
      <div>
        <strong>Signers:</strong>{" "}
        {transaction.signers.map((signer, index) => (
          <div key={index}>
            <Address address={signer} />
          </div>
        ))}
      </div>
      {/* If you need to display the callData or other fields, add them here */}
    </>
  );
};

export default TransactionItemV2;
