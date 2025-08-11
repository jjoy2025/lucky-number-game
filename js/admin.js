firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63";

auth.onAuthStateChanged(user => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "index.html";
    } else {
        loadDealers();
        loadBetGraph();
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// ডিলার লিস্ট লোড
function loadDealers() {
    db.collection("wallets").get().then(snapshot => {
        const dealerDiv = document.getElementById("dealerList");
        dealerDiv.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.innerHTML = `
                <p><b>${data.email}</b> - ব্যালেন্স: ${data.balance || 0} টোকেন</p>
                <input type="number" id="amount-${doc.id}" placeholder="টোকেন">
                <button onclick="updateBalance('${doc.id}', true)">➕ ক্রেডিট</button>
                <button onclick="updateBalance('${doc.id}', false)">➖ ডেবিট</button>
                <hr>
            `;
            dealerDiv.appendChild(div);
        });
    });
}

// ব্যালেন্স আপডেট
function updateBalance(uid, isCredit) {
    const amount = parseInt(document.getElementById(`amount-${uid}`).value);
    if (isNaN(amount) || amount <= 0) return alert("❌ সঠিক সংখ্যা দিন");

    db.collection("wallets").doc(uid).update({
        balance: firebase.firestore.FieldValue.increment(isCredit ? amount : -amount)
    });
}

// গ্রাফ লোড
function loadBetGraph() {
    db.collection("bets").get().then(snapshot => {
        let counts = Array(10).fill(0);
        snapshot.forEach(doc => {
            const data = doc.data();
            counts[data.number] += data.tokens;
        });

        const ctx = document.getElementById('betChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 10 }, (_, i) => i.toString()),
                datasets: [{
                    label: 'টোকেন সংখ্যা',
                    data: counts,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)'
                }]
            }
        });
    });
}

// রেজাল্ট ঘোষণা
function declareResult() {
    const slot = parseInt(document.getElementById("resultGameSlot").value);
    const num = parseInt(document.getElementById("winningNumber").value);
    if (isNaN(slot) || isNaN(num)) return alert("❌ সঠিক ডাটা দিন");

    db.collection("results").add({
        gameSlot: slot,
        winningNumber: num,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("✅ রেজাল্ট ঘোষণা হয়েছে");
    });
}

// রিপোর্ট ডাউনলোড
function downloadReport() {
    db.collection("bets").get().then(snapshot => {
        let rows = [["Dealer Email", "Game Slot", "Number", "Tokens", "Time"]];
        snapshot.forEach(doc => {
            const d = doc.data();
            rows.push([d.email, d.gameSlot, d.number, d.tokens, d.timestamp?.toDate()]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bets");
        XLSX.writeFile(wb, "bets_report.xlsx");
    });
}
