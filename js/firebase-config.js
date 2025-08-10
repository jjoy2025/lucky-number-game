// Firebase ইম্পোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// আপনার Firebase কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyArpsy4tpySdQEEuZzIa0ZWpz5VzdN7i_I",
  authDomain: "the-lucky-number-9f211.firebaseapp.com",
  projectId: "the-lucky-number-9f211",
  storageBucket: "the-lucky-number-9f211.firebasestorage.app",
  messagingSenderId: "988704918151",
  appId: "1:988704918151:web:870a814558135b3c37c622",
  measurementId: "G-5LL375YSZT"
};

// Firebase ইনিশিয়ালাইজ
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// এক্সপোর্ট
export { db, auth };
