import firebaseApp from "../firebaseConfig";
import { format } from "date-fns";
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { MultisigWallet } from "~~/types/multisigWallet";

// A popular library for handling dates

// Assuming 'timestamp' is the Firestore timestamp you retrieved
export const convertFirestoreTimestampToDate = (timestamp: Timestamp) => {
  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate();
  return format(date, "MM/dd/yy, HH:mm"); // Example format: 'Jan 1, 2020, 12:00 AM'
};

export const fetchFirestoreCollection = async (collectionName: string, userAddress: string) => {
  try {
    const db = getFirestore(firebaseApp);
    let q;

    if (userAddress && collectionName === "multisigWallets") {
      const dataCollection = collection(db, collectionName);
      // Query for documents where the 'signers' array contains the userAddress
      q = query(dataCollection, where("signers", "array-contains", userAddress));
    } else {
      const dataCollection = collection(db, collectionName);
      q = query(dataCollection);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error(`Error fetching data from ${collectionName}:`, error);
    throw new Error(`Failed to fetch data from ${collectionName}`);
  }
};

export const addFirestoreDocument = async (collectionName: string, data: object) => {
  const db = getFirestore(firebaseApp);
  const dataCollection = collection(db, collectionName);
  const timestamp = serverTimestamp(); // Current server timestamp

  const documentData = {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
    nonce: 0,
  };
  try {
    const docRef = await addDoc(dataCollection, documentData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error adding document: ", error.message);
      throw error;
    } else {
      throw new Error("An unknown error occurred while adding document");
    }
  }
};

export const fetchMultisigWalletData = async (walletAddress: string): Promise<MultisigWallet | null> => {
  try {
    const db = getFirestore(firebaseApp);
    const walletCollectionRef = collection(db, "multisigWallets");
    const q = query(walletCollectionRef, where("address", "==", walletAddress));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Assuming each address will have only one corresponding document
      const walletDoc = querySnapshot.docs[0];
      return { id: walletDoc.id, ...walletDoc.data() };
    } else {
      console.error("No such wallet found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching multisig wallet data:", error);
    throw new Error("Failed to fetch multisig wallet data");
  }
};
