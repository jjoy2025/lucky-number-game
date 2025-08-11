// admin.js

import { auth, db } from './firebase-config.js';
import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// এডমিন UID
const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63";

// লগইন চেক
onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        alert("আপনি এডমিন নন!");
        window.location.href = "./index.html";
    } else {
        loadDealers();
        loadOldResults();
    }
});

// লগআউট
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = "./index.html";
});

// ডিলার লিস্ট লোড
async function loadDealers() {
    const dealerListEl = document.getElementById('dealerList');
    dealerListEl.innerHTML = "";

    const q = query(collection(db, "wallets"));
    const snap = await getDocs(q);

    snap.forEach(docSnap => {
        const data = docSnap.data();
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${data.email || 'N/A'}</td>
            <td>${data.tokens || 0}</td>
            <td><button onclick="creditTokens('${docSnap.id}')">+</button></td>
            <td><button onclick="debitTokens('${docSnap.id}')">-</button></td>
        `;
        dealerListEl.appendChild(tr);
    });
}

// ক্রেডিট টোকেন
window.creditTokens = async function (dealerId) {
    const amount = parseInt(prompt("ক্রেডিট টোকেন সংখ্যা দিন:"));
    if (isNaN(amount) || amount <= 0) return;

    const ref = doc(db, "wallets", dealerId);
    await updateDoc(ref, {
        tokens: amount + (await getTokens(ref))
    });
    loadDealers();
};

// ডেবিট টোকেন
window.debitTokens = async function (dealerId) {
    const amount = parseInt(prompt("ডেবিট টোকেন সংখ্যা দিন:"));
    if (isNaN(amount) || amount <= 0) return;

    const ref = doc(db, "wallets", dealerId);
    await updateDoc(ref, {
        tokens: Math.max((await getTokens(ref)) - amount, 0)
    });
    loadDealers();
};

// হেল্পার: টোকেন পড়া
async function getTokens(ref) {
    const snap = await getDocs(query(collection(db, "wallets")));
    let tokens = 0;
    snap.forEach(docSnap => {
        if (docSnap.ref.path === ref.path) {
            tokens = docSnap.data().tokens || 0;
        }
    });
    return tokens;
}

// রেজাল্ট সেভ
document.querySelectorAll('.saveResultBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const row = btn.closest('.resultRow');
        const slot = row.getAttribute('data-slot');
        const patti = row.querySelector('.pattiInput').value.trim();
        const single = row.querySelector('.singleInput').value.trim();

        if (!patti || !single) {
            alert("দুটো ফিল্ডই পূর্ণ করতে হবে!");
            return;
        }

        await addDoc(collection(db, "results"), {
            slot,
            patti,
            single,
            date: new Date().toLocaleDateString("en-GB"),
            createdAt: serverTimestamp()
        });

        alert(`গেম ${slot} রেজাল্ট সেভ হয়েছে!`);
        loadOldResults();
    });
});

// গত ১০ দিনের রেজাল্ট
async function loadOldResults() {
    const oldResultsEl = document.getElementById('oldResultsList');
    oldResultsEl.innerHTML = "";

    const q = query(collection(db, "results"), orderBy("createdAt", "desc"), limit(80));
    const snap = await getDocs(q);

    let currentDate = "";
    snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.date !== currentDate) {
            currentDate = data.date;
            const h3 = document.createElement('h3');
            h3.textContent = currentDate;
            oldResultsEl.appendChild(h3);
        }
        const p = document.createElement('p');
        p.textContent = `গেম ${data.slot}: ${data.patti} - ${data.single}`;
        oldResultsEl.appendChild(p);
    });
}
