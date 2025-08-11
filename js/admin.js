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
    where,
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
        loadBettingGraphs();
    }
});

// লগআউট
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = "./index.html";
});

// ডিলার লিস্ট লোড
async function loadDealers() {
    const dealerListEl = document.getElementById('dealerList').querySelector('tbody');
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

// নতুন ডিলার অ্যাড করার লজিক
const addDealerForm = document.getElementById('addDealerForm');
if (addDealerForm) {
    addDealerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('dealerEmailInput').value;
        const password = document.getElementById('dealerPasswordInput').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, "wallets", userId), {
                email: email,
                tokens: 0,
                createdAt: serverTimestamp()
            });

            alert(`ডিলার ${email} সফলভাবে যোগ করা হয়েছে!`);
            addDealerForm.reset();
            loadDealers(); // ডিলার লিস্ট রিফ্রেশ করুন
        } catch (error) {
            alert("ডিলার যোগ করতে ব্যর্থ: " + error.message);
        }
    });
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
        loadBettingGraphs();
    });
});

// বেটিং গ্রাফ লোড করার ফাংশন
async function loadBettingGraphs() {
    const today = new Date().toLocaleDateString("en-GB");
    const gameSlots = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const slot of gameSlots) {
        const q = query(
            collection(db, "bets"),
            where("gameSlot", "==", slot)
        );
        const snapshot = await getDocs(q);

        const bettingData = {
            '0': 0, '1': 0, '2': 0, '3': 0, '4': 0,
            '5': 0, '6': 0, '7': 0, '8': 0, '9': 0
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            const number = data.number;
            const tokens = data.tokens;
            if (bettingData[number] !== undefined) {
                bettingData[number] += tokens;
            }
        });

        const ctx = document.getElementById(`chart-slot-${slot}`);
        if (ctx) {
            // যদি গ্রাফটি ইতিমধ্যেই বিদ্যমান থাকে, তাহলে আপডেট করা হবে
            if (window.myCharts && window.myCharts[`chart-slot-${slot}`]) {
                window.myCharts[`chart-slot-${slot}`].data.datasets[0].data = Object.values(bettingData);
                window.myCharts[`chart-slot-${slot}`].update();
            } else {
                // নতুন গ্রাফ তৈরি করা হবে
                const newChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(bettingData),
                        datasets: [{
                            label: 'মোট টোকেন',
                            data: Object.values(bettingData),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'টোকেন'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'নাম্বার'
                                }
                            }
                        }
                    }
                });
                if (!window.myCharts) {
                    window.myCharts = {};
                }
                window.myCharts[`chart-slot-${slot}`] = newChart;
            }
        }
    }
}
