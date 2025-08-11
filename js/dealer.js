import { auth, db } from './firebase-config.js';
import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let currentGameSlot = null;

// লগইন চেক
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        currentUser = user;
        document.getElementById("dealerEmail").textContent = user.email;
        loadDealerBalance();
        loadCurrentGameSlot();
        loadBetHistory();
    }
});

// লগআউট
window.logout = async function () {
    await signOut(auth);
    window.location.href = "index.html";
};

// ব্যালেন্স লোড
function loadDealerBalance() {
    onSnapshot(doc(db, "wallets", currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
            document.getElementById("dealerBalance").textContent = docSnap.data().tokens || 0;
        }
    });
}

// বর্তমান গেম টাইম স্লট নির্ধারণ
function loadCurrentGameSlot() {
    const times = [
        { label: "সকাল ১১টা", hour: 11, minute: 0 },
        { label: "দুপুর ১টা", hour: 13, minute: 0 },
        { label: "দুপুর আড়াইটে", hour: 14, minute: 30 },
        { label: "বিকেল ৩:৩০", hour: 15, minute: 30 },
        { label: "বিকেল ৪:৩০", hour: 16, minute: 30 },
        { label: "সন্ধ্যা ৬টা", hour: 18, minute: 0 },
        { label: "সন্ধ্যা ৭:৩০", hour: 19, minute: 30 },
        { label: "রাত ৯টা", hour: 21, minute: 0 }
    ];

    const now = new Date();
    for (let i = 0; i < times.length; i++) {
        let gameTime = new Date();
        gameTime.setHours(times[i].hour);
        gameTime.setMinutes(times[i].minute);
        gameTime.setSeconds(0);

        let diff = gameTime - now;
        if (diff > 20 * 60 * 1000) { // ২০ মিনিট আগে বেট বন্ধ
            currentGameSlot = i + 1;
            document.getElementById("currentGameTime").textContent = times[i].label;
            return;
        }
    }
    document.getElementById("currentGameTime").textContent = "এই মুহূর্তে কোন বেটিং খোলা নেই";
}

// বেট প্লেস করা
window.placeBet = async function () {
    const number = parseInt(document.getElementById("betNumber").value);
    const tokens = parseInt(document.getElementById("betTokens").value);

    if (!currentGameSlot) {
        alert("❌ এখন বেটিং টাইম নয়");
        return;
    }
    if (isNaN(number) || number < 0 || number > 9) {
        alert("❌ নাম্বার 0-9 এর মধ্যে দিন");
        return;
    }
    if (isNaN(tokens) || tokens <= 0) {
        alert("❌ টোকেনের সংখ্যা সঠিকভাবে দিন");
        return;
    }

    const walletRef = doc(db, "wallets", currentUser.uid);
    const walletSnap = await getDoc(walletRef);

    if (!walletSnap.exists() || (walletSnap.data().tokens || 0) < tokens) {
        alert("❌ পর্যাপ্ত টোকেন নেই");
        return;
    }

    // বেট সেভ
    await addDoc(collection(db, "bets"), {
        userId: currentUser.uid,
        email: currentUser.email,
        gameSlot: currentGameSlot,
        number: number,
        tokens: tokens,
        timestamp: serverTimestamp()
    });

    // ব্যালেন্স আপডেট
    await updateDoc(walletRef, {
        tokens: (walletSnap.data().tokens || 0) - tokens
    });

    alert("✅ বেট দেওয়া হয়েছে");
    document.getElementById("betNumber").value = "";
    document.getElementById("betTokens").value = "";
};

// নিজের বেট হিস্ট্রি লোড
function loadBetHistory() {
    const q = query(
        collection(db, "bets"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(20)
    );

    onSnapshot(q, (snapshot) => {
        const list = document.getElementById("betList");
        list.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const li = document.createElement("li");
            li.textContent = `গেম ${data.gameSlot} - নাম্বার ${data.number} - ${data.tokens} টোকেন`;
            list.appendChild(li);
        });
    });
}
