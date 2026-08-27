import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-WN1is2qA6dQN4-oMLUPCB6eLFwuo3E",
  authDomain: "stars-fabric-library-e2d2c.firebaseapp.com",
  projectId: "stars-fabric-library-e2d2c",
  storageBucket: "stars-fabric-library-e2d2c.firebasestorage.app",
  messagingSenderId: "570705618004",
  appId: "1:570705618004:web:ed5b202ab3eefd669379c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);
