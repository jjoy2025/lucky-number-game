// Firebase Init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const adminUID = "dfAI8a7DfMRxgeymYJlGwuruxz63"; // আপনার এডমিন UID

// লগইন চেক
auth.onAuthStateChanged(user => {
    if (!user || user.uid !== adminUID) {
        window.location.href = "index.html"; // লগইন পেজে ফেরত পাঠাবে
    } else {
        document.getElementById("adminEmail").textContent = user.email;
        loadTodayResults();
        loadDealers();
    }
});

// লগআউট ফাংশন
function logout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// আজকের রেজাল্ট লোড
function loadTodayResults() {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    const times = [
        "সকাল ১১টা", "দুপুর ১টা", "দুপুর আড়াইটে", "বিকেল ৩:৩০",
        "বিকেল ৪:৩০", "সন্ধ্যা ৬টা", "সন্ধ্যা ৭:৩০", "রাত ৯টা"
    ];

    times.forEach((time, index) => {
        const div = document.createElement("div");
        div.classList.add("resultRow");
        div.innerHTML = `
            <label>${time}:</label>
            <input type="number" min="0" max="9" id="result_${index}" placeholder="0-9">
        `;
        container.appendChild(div);
    });
}

// রেজাল্ট সেভ
function saveResults() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const results = {};

    for (let i = 0; i < 8; i++) {
        const val = document.getElementById(`result_${i}`).value;
        if (val === "" || val < 0 || val > 9) {
            alert("সব রেজাল্ট 0-9 এর মধ্যে দিন");
            return;
        }
        results[`game_${i + 1}`] = parseInt(val);
    }

    db.collection("results").doc(today).set({
        date: today,
        results: results,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("✅ আজকের রেজাল্ট সেভ হয়েছে");
    }).catch(err => {
        console.error(err);
        alert("❌ রেজাল্ট সেভ ব্যর্থ");
    });
}

// ডিলারের লিস্ট লোড
function loadDealers() {
    const container = document.getElementById("dealersContainer");
    container.innerHTML = "";

    db.collection("wallets").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement("li");
            li.textContent = `${data.email} - ব্যালেন্স: ${data.balance || 0} টোকেন`;
            container.appendChild(li);
        });
    });
}
