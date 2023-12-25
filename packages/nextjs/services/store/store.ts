import { fetchFirestoreCollection } from "../firebaseService";
import { create } from "zustand";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

type TGlobalState = {
  nativeCurrencyPrice: number;
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  multisigWallets: any[]; // Define the type according to your data structure
  fetchMultisigWallets: (userAddress: string) => Promise<void>;
};

export const useGlobalState = create<TGlobalState>(set => ({
  nativeCurrencyPrice: 0,
  setNativeCurrencyPrice: (newValue: number): void => set(() => ({ nativeCurrencyPrice: newValue })),
  multisigWallets: [],
  fetchMultisigWallets: async userAddress => {
    const multisigWallets = await fetchFirestoreCollection("multisigWallets", userAddress);
    set({ multisigWallets });
  },
}));
