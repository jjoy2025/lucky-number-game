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
    serverTimestamp,
    setDoc,
    increment,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ADMIN_UID } from './firebase-config.js';

// Firebase অ্যাপ ইনিশিয়ালাইজ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// সমস্ত ডিলার এবং নির্বাচিত ডিলার ট্র্যাক করার জন্য ভেরিয়েবল
let allDealers = [];
let selectedDealer = null; 

// HTML উপাদানগুলো নির্বাচন
const dealerSearchInput = document.getElementById('dealerSearchInput');
const dealerListDropdown = document.getElementById('dealerListDropdown');
const currentDealerBalanceEl = document.getElementById('currentDealerBalance');
const tokenAmountInput = document.getElementById('tokenAmountInput');
const logoutBtn = document.getElementById('logoutBtn');
const creditBtn = document.getElementById('creditBtn');
const debitBtn = document.getElementById('debitBtn');
const addDealerForm = document.getElementById('addDealerForm');

// এডমিন লগইন চেক এবং ডেটা লোড করা
onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        alert("আপনি এডমিন নন!");
        window.location.href = "./index.html";
    } else {
        loadAllDealersRealTime();
        loadBettingGraphs();
    }
});

// লগআউট ফাংশন
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            alert("সফলভাবে লগআউট হয়েছে।");
            window.location.href = "./index.html";
        } catch (error) {
            alert("লগআউট করতে ব্যর্থ: " + error.message);
            console.error("লগআউট করতে ব্যর্থ:", error);
        }
    });
}

// সমস্ত ডিলার রিয়েল-টাইমে লোড
function loadAllDealersRealTime() {
    const q = query(collection(db, "wallets"));
    onSnapshot(q, (snapshot) => {
        allDealers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // যদি কোনো ডিলার আগে থেকে নির্বাচিত থাকে, তবে তার ব্যালেন্স রিয়েল-টাইমে আপডেট করা হবে
        if (selectedDealer) {
            const updatedDealer = allDealers.find(d => d.id === selectedDealer.id);
            if (updatedDealer) {
                currentDealerBalanceEl.textContent = updatedDealer.tokens || 0;
            }
        }
    });
}

// ডিলার সার্চ এবং অটোকমপ্লিট
if (dealerSearchInput) {
    dealerSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        dealerListDropdown.innerHTML = '';
        selectedDealer = null; 
        currentDealerBalanceEl.textContent = '0';
        
        if (query.length > 0) {
            const filteredDealers = allDealers.filter(dealer => 
                dealer.email && dealer.email.toLowerCase().includes(query)
            );
            if (filteredDealers.length > 0) {
                filteredDealers.forEach(dealer => {
                    const li = document.createElement('li');
                    li.textContent = dealer.email;
                    li.addEventListener('click', () => {
                        selectedDealer = dealer;
                        dealerSearchInput.value = dealer.email;
                        currentDealerBalanceEl.textContent = dealer.tokens || 0;
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

// ক্রেডিট টোকেন ফাংশন (পরিবর্তিত)
if (creditBtn) {
    creditBtn.addEventListener('click', async () => {
        let dealerToUpdate = selectedDealer;
        if (!dealerToUpdate) {
            const dealerEmail = dealerSearchInput.value.trim().toLowerCase();
            dealerToUpdate = allDealers.find(d => d.email && d.email.toLowerCase() === dealerEmail);
        }

        if (!dealerToUpdate) {
            alert("দয়া করে একজন বৈধ ডিলার নির্বাচন করুন অথবা সঠিক ইমেল লিখুন।");
            return;
        }

        const amount = parseInt(tokenAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert("সঠিক টোকেন সংখ্যা দিন।");
            return;
        }

        try {
            await addDoc(collection(db, "transactions"), {
                userId: dealerToUpdate.id,
                amount: amount,
                type: 'credit',
                adminId: auth.currentUser.uid,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert(`${amount} টোকেন ক্রেডিট করার অনুরোধ পাঠানো হয়েছে!`);
            tokenAmountInput.value = '';
            dealerSearchInput.value = '';
            selectedDealer = null;
        } catch (error) {
            console.error("টোকেন ক্রেডিট করতে ব্যর্থ:", error);
            alert("টোকেন ক্রেডিট করতে ব্যর্থ।");
        }
    });
}

// ডেবিট টোকেন ফাংশন (পরিবর্তিত)
if (debitBtn) {
    debitBtn.addEventListener('click', async () => {
        let dealerToUpdate = selectedDealer;
        if (!dealerToUpdate) {
            const dealerEmail = dealerSearchInput.value.trim().toLowerCase();
            dealerToUpdate = allDealers.find(d => d.email && d.email.toLowerCase() === dealerEmail);
        }

        if (!dealerToUpdate) {
            alert("দয়া করে একজন বৈধ ডিলার নির্বাচন করুন অথবা সঠিক ইমেল লিখুন।");
            return;
        }

        const amount = parseInt(tokenAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert("সঠিক টোকেন সংখ্যা দিন।");
            return;
        }

        if (dealerToUpdate.tokens < amount) {
            alert("ডিলারের অ্যাকাউন্টে পর্যাপ্ত টোকেন নেই।");
            return;
        }

        try {
            await addDoc(collection(db, "transactions"), {
                userId: dealerToUpdate.id,
                amount: amount,
                type: 'debit',
                adminId: auth.currentUser.uid,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert(`${amount} টোকেন ডেবিট করার অনুরোধ পাঠানো হয়েছে!`);
            tokenAmountInput.value = '';
            dealerSearchInput.value = '';
            selectedDealer = null;
        } catch (error) {
            console.error("টোকেন ডেবিট করতে ব্যর্থ:", error);
            alert("টোকেন ডেবিট করতে ব্যর্থ।");
        }
    });
}

// নতুন ডিলার অ্যাড
if (addDealerForm) {
    addDealerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('dealerEmailInput').value.trim();
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
            createdAt: serverTimestamp()
        });

        alert(`গেম ${slot} রেজাল্ট সফলভাবে সেভ হয়েছে!`);
        loadBettingGraphs();
    });
});

// বেটিং গ্রাফ লোড
async function loadBettingGraphs() {
    const gameSlots = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const slot of gameSlots) {
        const q = query(collection(db, "bets"), where("gameSlot", "==", slot));
        const snapshot = await getDocs(q);

        const bettingData = {
            '0': 0, '1': 0, '2': 0, '3': 0, '4': 0,
            '5': 0, '6': 0, '7': 0, '8': 0, '9': 0
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            if (bettingData[data.number] !== undefined) {
                bettingData[data.number] += data.tokens;
            }
        });

        const ctx = document.getElementById(`chart-slot-${slot}`);
        if (ctx) {
            if (window.myCharts && window.myCharts[`chart-slot-${slot}`]) {
                window.myCharts[`chart-slot-${slot}`].data.datasets[0].data = Object.values(bettingData);
                window.myCharts[`chart-slot-${slot}`].update();
            } else {
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
                            y: { beginAtZero: true, title: { display: true, text: 'টোকেন' } },
                            x: { title: { display: true, text: 'নাম্বার' } }
                        }
                    }
                });
                if (!window.myCharts) window.myCharts = {};
                window.myCharts[`chart-slot-${slot}`] = newChart;
            }
        }
    }
}
