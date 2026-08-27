import { initializeApp } from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "stars-fabric-library-e2d2c.firebaseapp.com",
  projectId: "stars-fabric-library-e2d2c",
  storageBucket: "stars-fabric-library-e2d2c.firebasestorage.app",
  messagingSenderId: "570705618004",
  appId: "1:570705618004:web:ed5b202ab3eefd669379c1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
