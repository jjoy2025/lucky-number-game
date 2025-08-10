import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  addDoc 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyArpsy4tpySdQEEuZzIa0ZWpz5VzdN7i_I",
  authDomain: "the-lucky-number-9f211.firebaseapp.com",
  projectId: "the-lucky-number-9f211",
  storageBucket: "the-lucky-number-9f211.appbasestorage.app",
  messagingSenderId: "988704918151",
  appId: "1:988704918151:web:870a814558135b3c37c622",
  measurementId: "G-5LL375YSZT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
  db, 
  auth, 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
