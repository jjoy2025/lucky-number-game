// js/admin.js

// Firebase SDK এবং মডিউলগুলো ইম্পোর্ট করুন
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Firebase অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${data.email || 'N/A'}</td>
            <td>${data.tokens || 0}</td>
            <td><button class="creditBtn" data-id="${docSnap.id}">+</button></td>
            <td><button class="debitBtn" data-id="${docSnap.id}">-</button></td>
        `;
        dealerListEl.appendChild(tr);
    }
    
    // টোকেন ক্রেডিট/ডেবিট বাটনগুলোর জন্য ইভেন্ট লিসেনার
    document.querySelectorAll('.creditBtn').forEach(button => {
        button.addEventListener('click', (e) => creditTokens(e.target.dataset.id));
    });
    document.querySelectorAll('.debitBtn').forEach(button => {
        button.addEventListener('click', (e) => debitTokens(e.target.dataset.id));
    });
}

// ক্রেডিট টোকেন
window.creditTokens = async function (dealerId) {
    const amount = parseInt(prompt("ক্রেডিট টোকেন সংখ্যা দিন:"));
    if (isNaN(amount) || amount <= 0) return;

    const ref = doc(db, "wallets", dealerId);
    const docSnap = await getDoc(ref);
    if(docSnap.exists()){
        await updateDoc(ref, {
            tokens: (docSnap.data().tokens || 0) + amount
        });
        alert(`ডিলারকে ${amount} টোকেন দেওয়া হয়েছে!`);
        loadDealers();
    }
};

// ডেবিট টোকেন
window.debitTokens = async function (dealerId) {
    const amount = parseInt(prompt("ডেবিট টোকেন সংখ্যা দিন:"));
    if (isNaN(amount) || amount <= 0) return;

    const ref = doc(db, "wallets", dealerId);
    const docSnap = await getDoc(ref);
    if(docSnap.exists()){
        await updateDoc(ref, {
            tokens: Math.max((docSnap.data().tokens || 0) - amount, 0)
        });
        alert(`ডিলারের অ্যাকাউন্ট থেকে ${amount} টোকেন ডেবিট করা হয়েছে!`);
        loadDealers();
    }
};

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

        if(single < '0' || single > '9' || single.length > 1) {
            alert("সিঙ্গেল নাম্বারটি অবশ্যই 0-9 এর মধ্যে হতে হবে!");
            return;
        }

        await addDoc(collection(db, "results"), {
            slot,
            patti,
            single: parseInt(single),
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
