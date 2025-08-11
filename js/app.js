// Firebase Init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Login Function
function loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const messageEl = document.getElementById("message");

    if (!email || !password) {
        messageEl.textContent = "⚠️ ইমেইল এবং পাসওয়ার্ড দিন";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            // Admin UID
            const adminUID = "dfAI8a7DfMRxgeymYJlGwuruxz63";

            if (user.uid === adminUID) {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "dealer-dashboard.html";
            }
        })
        .catch(error => {
            console.error(error);
            messageEl.textContent = "❌ লগইন ব্যর্থ: " + error.message;
        });
}

// Auto Redirect if already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        const adminUID = "dfAI8a7DfMRxgeymYJlGwuruxz63";
        if (user.uid === adminUID) {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "dealer-dashboard.html";
        }
    }
});
