import { TableCellKey } from "~~/types/multisigTransaction";

export const tableHeaders: Array<{ key: TableCellKey; title: string }> = [
  { key: "nonce", title: "Nonce" },
  { key: "status", title: "Status" },
  { key: "created", title: "Created" },
  { key: "txHash", title: "Tx Hash" },
  { key: "proposedBy", title: "Proposer" },
  { key: "signers", title: "Signed By" },
  { key: "actions", title: "Actions" },

  // Good Above
  // { key: "lastUpdated", title: "Last Updated" },
  // { key: "callData", title: "Call Data" },
  // { key: "threshold", title: "Threshold" },
  // { key: "action", title: "Action" },
  // { key: "walletAddress", title: "Wallet Address" },
  // { key: "id", title: "ID" },
];
