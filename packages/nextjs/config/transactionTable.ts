import { TableCellKey } from "~~/types/multisigTransaction";

export const tableHeaders: Array<{ key: TableCellKey; title: string }> = [
  { key: "action", title: "Action" },
  { key: "targetAddress", title: "Target Address" },
  { key: "threshold", title: "New Threshold" },
  { key: "amount", title: "Amount" },
  { key: "frequency", title: "Frequency" },
  { key: "proposedBy", title: "Proposer" },
  { key: "createdAt", title: "Created At" },
  { key: "status", title: "Status" },
  { key: "signers", title: "Signed By" },
  { key: "actionRequired", title: "Action Required" },

  // Good Above
  // { key: "nonce", title: "Nonce" },
  // { key: "lastUpdated", title: "Last Updated" },
  // { key: "callData", title: "Call Data" },
  // { key: "threshold", title: "Threshold" },
  // { key: "walletAddress", title: "Wallet Address" },
  // { key: "id", title: "ID" },
];
