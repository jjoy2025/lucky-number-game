// js/app.js

// Firebase SDK এবং মডিউলগুলো ইম্পোর্ট করুন
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js'; // আপনার নতুন কনফিগারেশন ফাইল

// Firebase অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// এডমিন UID (লক করা)
const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63";

// লগইন ফর্ম এলিমেন্ট
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.uid === ADMIN_UID) {
                // এডমিন হলে
                window.location.href = "./admin-dashboard.html";
            } else {
                // ডিলার হলে
                window.location.href = "./dealer-dashboard.html";
            }
        } catch (error) {
            alert("লগইন ব্যর্থ হয়েছে: " + error.message);
        }
    });
}

// যদি কেউ লগইন করা থাকে, সরাসরি রিডিরেক্ট হবে
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (window.location.pathname.endsWith("index-login.html") || window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
            if (user.uid === ADMIN_UID) {
                window.location.href = "./admin-dashboard.html";
            } else {
                window.location.href = "./dealer-dashboard.html";
            }
        }
    }
});
