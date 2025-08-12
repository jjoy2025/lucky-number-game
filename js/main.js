import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, ADMIN_UID } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.uid === ADMIN_UID) {
                alert("সফলভাবে এডমিন প্যানেলে লগইন হয়েছে!");
                window.location.href = "./admin.html";
            } else {
                alert("আপনি এডমিন নন।");
                await auth.signOut();
            }
        } catch (error) {
            alert("লগইন করতে ব্যর্থ: " + error.message);
            console.error("লগইন করতে ব্যর্থ:", error);
        }
    });
}
