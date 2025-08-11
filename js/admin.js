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
let allDealers = [];
let selectedDealerId = null;

// লগইন চেক
onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        alert("আপনি এডমিন নন!");
        window.location.href = "./index.html";
    } else {
        loadAllDealers();
        loadBettingGraphs();
    }
});

// লগআউট
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = "./index.html";
});

// সমস্ত ডিলার ডেটা লোড করা
async function loadAllDealers() {
    const q = query(collection(db, "wallets"));
    const snap = await getDocs(q);
    allDealers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// ডিলার সার্চ ইনপুট এবং অটোকমপ্লিট লজিক
const dealerSearchInput = document.getElementById('dealerSearchInput');
const dealerListDropdown = document.getElementById('dealerListDropdown');
const currentDealerBalanceEl = document.getElementById('currentDealerBalance');
const tokenAmountInput = document.getElementById('tokenAmountInput');

if (dealerSearchInput) {
    dealerSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        dealerListDropdown.innerHTML = '';
        
        if (query.length > 0) {
            const filteredDealers = allDealers.filter(dealer => dealer.email.toLowerCase().includes(query));
            if (filteredDealers.length > 0) {
                filteredDealers.forEach(dealer => {
                    const li = document.createElement('li');
                    li.textContent = dealer.email;
                    li.addEventListener('click', () => {
                        selectedDealerId = dealer.id;
                        dealerSearchInput.value = dealer.email;
                        currentDealerBalanceEl.textContent = dealer.tokens;
                        dealerListDropdown.style.display = 'none';
                    });
                    dealerListDropdown.appendChild(li);
                });
                dealerListDropdown.style.display = 'block';
            } else {
                dealerListDropdown.style.display = 'none';
            }
        } else {
            dealerListDropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#dealerManagementForm')) {
            dealerListDropdown.style.display = 'none';
        }
    });
}

// ক্রেডিট টোকেন ফাংশন
document.getElementById('creditBtn').addEventListener('click', async () => {
    if (!selectedDealerId) {
        alert("দয়া করে একজন ডিলার নির্বাচন করুন।");
        return;
    }
    const amount = parseInt(tokenAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("সঠিক টোকেন সংখ্যা দিন।");
        return;
    }

    try {
        const dealerDocRef = doc(db, "wallets", selectedDealerId);
        await updateDoc(dealerDocRef, {
            tokens: currentDealerBalanceEl.textContent + amount
        });
        alert("টোকেন সফলভাবে ক্রেডিট করা হয়েছে!");
        tokenAmountInput.value = '';
        loadAllDealers();
    } catch (error) {
        console.error("টোকেন ক্রেডিট করতে ব্যর্থ:", error);
        alert("টোকেন ক্রেডিট করতে ব্যর্থ।");
    }
});

// ডেবিট টোকেন ফাংশন
document.getElementById('debitBtn').addEventListener('click', async () => {
    if (!selectedDealerId) {
        alert("দয়া করে একজন ডিলার নির্বাচন করুন।");
        return;
    }
    const amount = parseInt(tokenAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("সঠিক টোকেন সংখ্যা দিন।");
        return;
    }

    try {
        const dealerDocRef = doc(db, "wallets", selectedDealerId);
        const currentBalance = parseInt(currentDealerBalanceEl.textContent);
        if (currentBalance < amount) {
            alert("ডিলারের অ্যাকাউন্টে পর্যাপ্ত টোকেন নেই।");
            return;
        }

        await updateDoc(dealerDocRef, {
            tokens: currentBalance - amount
        });
        alert("টোকেন সফলভাবে ডেবিট করা হয়েছে!");
        tokenAmountInput.value = '';
        loadAllDealers();
    } catch (error) {
        console.error("টোকেন ডেবিট করতে ব্যর্থ:", error);
        alert("টোকেন ডেবিট করতে ব্যর্থ।");
    }
});

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
            loadAllDealers();
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
