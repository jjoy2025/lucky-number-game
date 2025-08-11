// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Admin UID (Fixed)
const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63";

// Login Function
function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.innerText = "";

    if (!email || !password) {
        errorMsg.innerText = "⚠️ Email এবং Password দিন";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            if (user.uid === ADMIN_UID) {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "dealer-dashboard.html";
            }
        })
        .catch(error => {
            console.error("Login error:", error);
            errorMsg.innerText = "❌ " + error.message;
        });
}

// Auto Redirect if already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        if (user.uid === ADMIN_UID) {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "dealer-dashboard.html";
        }
    }
});
