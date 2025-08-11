// Firebase Init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Selected Number
let selectedNumber = null;

// Create number buttons dynamically
const numberButtonsContainer = document.getElementById("numberButtons");
for (let i = 0; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.className = "number-btn";
    btn.textContent = i;
    btn.onclick = () => selectNumber(i);
    numberButtonsContainer.appendChild(btn);
}

// Select number
function selectNumber(num) {
    selectedNumber = num;
    document.querySelectorAll(".number-btn").forEach(b => b.style.background = "#007bff");
    document.querySelectorAll(".number-btn")[num].style.background = "#28a745";
}

// Load wallet balance
function loadWallet(uid) {
    db.collection("wallets").doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            document.getElementById("walletBalance").textContent = doc.data().balance || 0;
        }
    });
}

// Place bet
function placeBet() {
    const amount = parseInt(document.getElementById("betAmount").value);
    const messageEl = document.getElementById("message");

    if (selectedNumber === null) {
        messageEl.textContent = "⚠️ প্রথমে একটি নাম্বার সিলেক্ট করুন।";
        return;
    }
    if (!amount || amount <= 0) {
        messageEl.textContent = "⚠️ সঠিক টোকেন সংখ্যা লিখুন।";
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        messageEl.textContent = "❌ লগইন সমস্যা।";
        return;
    }

    const gameTime = getNextGameTime();
    if (!gameTime) {
        messageEl.textContent = "⛔ এখন বেটিং বন্ধ আছে।";
        return;
    }

    // Save bet to Firestore
    db.collection("bets").add({
        userId: user.uid,
        number: selectedNumber,
        amount: amount,
        time: firebase.firestore.Timestamp.now(),
        gameTime: gameTime
    }).then(() => {
        messageEl.textContent = `✅ ${selectedNumber} নাম্বারে ${amount} টোকেন বেট হয়েছে।`;
        document.getElementById("betAmount").value = "";
    }).catch(err => {
        console.error(err);
        messageEl.textContent = "❌ বেট করতে সমস্যা হয়েছে।";
    });
}

// Next game time (and 20min cutoff)
function getNextGameTime() {
    const schedule = ["11:00", "13:00", "14:30", "15:30", "16:30", "18:00", "19:30", "21:00"];
    const now = new Date();

    for (let t of schedule) {
        const [h, m] = t.split(":");
        const gameDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m));
        const cutoff = new Date(gameDate.getTime() - 20 * 60000); // 20min before

        if (now < cutoff) {
            return t;
        }
    }
    return null; // No game available
}

// Auth check
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        loadWallet(user.uid);
    }
});
