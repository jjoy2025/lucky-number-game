// Firebase কম্প্যাটিবিলিটি মোড ব্যবহার করুন (GitHub Pages-এর জন্য উপযুক্ত)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  addDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js";

const firebaseConfig = {
  apiKey: "AIzaSyArpsy4tpySdQEEuZzIa0ZWpz5VzdN7i_I",
  authDomain: "the-lucky-number-9f211.firebaseapp.com",
  projectId: "the-lucky-number-9f211",
  storageBucket: "the-lucky-number-9f211.appbasestorage.app",
  messagingSenderId: "988704918151",
  appId: "1:988704918151:web:870a814558135b3c37c622",
  measurementId: "G-5LL375YSZT"
};

// Firebase অ্যাপ ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);

// Firebase সার্ভিসেস ইনিশিয়ালাইজেশন
const db = getFirestore(app);
const auth = getAuth(app);

// এক্সপোর্ট করা ফাংশনগুলো
export { 
  db, 
  auth, 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
