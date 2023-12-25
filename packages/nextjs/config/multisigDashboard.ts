import { Method } from "~~/types/multisigTransaction";

export const METHODS: Method[] = ["addSigner", "removeSigner", "transferFunds"];
export const OWNERS_METHODS = METHODS.filter(m => m !== "transferFunds");

export const DEFAULT_TX_DATA = {
  methodName: OWNERS_METHODS[0],
  signer: "",
  newSignaturesNumber: "",
};

// Enum for Tab Values
export enum DashboardTab {
  Overview = "overview",
  Owners = "owners",
  Transactions = "transactions",
}
