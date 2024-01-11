import { initializeApp } from "firebase/app";
import "firebase/auth";
// Import other Firebase modules as needed
import "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyB-VTtT6hrifIt1VIObwlJcW5FrzzwNoJ4",
  authDomain: "multisig-e2c7a.firebaseapp.com",
  projectId: "multisig-e2c7a",
  storageBucket: "multisig-e2c7a.appspot.com",
  messagingSenderId: "994767099408",
  appId: "1:994767099408:web:72a7e2991b198b1dffdc95",
};
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
