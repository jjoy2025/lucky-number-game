// js/reports.js

// Firebase SDK এবং মডিউলগুলো ইম্পোর্ট করুন
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where
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
        alert("আপনার এই পেজ দেখার অনুমতি নেই!");
        window.location.href = "./index.html";
    } else {
        loadDealerSummary();
    }
});

// ডিলারদের সারাংশ লোড
async function loadDealerSummary() {
    const dealerSummaryTableBody = document.querySelector('#dealerSummaryTable tbody');
    dealerSummaryTableBody.innerHTML = '';
    
    const walletsSnapshot = await getDocs(collection(db, "wallets"));
    const resultsSnapshot = await getDocs(collection(db, "results"));
    const betsSnapshot = await getDocs(collection(db, "bets"));
    
    const results = {};
    resultsSnapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.date}_${data.slot}`;
        results[key] = data.single;
    });

    const dealerData = {};
    walletsSnapshot.forEach(doc => {
        const data = doc.data();
        dealerData[doc.id] = {
            email: data.email,
            tokens: data.tokens,
            totalWinning: 0
        };
    });
    
    betsSnapshot.forEach(doc => {
        const bet = doc.data();
        const resultKey = `${new Date(bet.timestamp.seconds * 1000).toLocaleDateString("en-GB")}_${bet.gameSlot}`;
        
        if (results[resultKey] !== undefined && results[resultKey] === bet.number) {
            if (dealerData[bet.userId]) {
                dealerData[bet.userId].totalWinning += (bet.tokens * 9);
            }
        }
    });

    for (const userId in dealerData) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dealerData[userId].email}</td>
            <td>${dealerData[userId].tokens}</td>
            <td>${dealerData[userId].totalWinning}</td>
            <td><button onclick="showDetailedReport('${userId}', '${dealerData[userId].email}')">দেখুন</button></td>
        `;
        dealerSummaryTableBody.appendChild(tr);
    }
}

// বিস্তারিত রিপোর্ট লোড
window.showDetailedReport = async function(userId, email) {
    const detailedReportSection = document.getElementById('dealerDetailedReport');
    const bettingHistoryTableBody = document.querySelector('#bettingHistoryTable tbody');
    const detailedReportTitle = document.getElementById('detailedReportTitle');
    
    detailedReportTitle.textContent = email;
    bettingHistoryTableBody.innerHTML = '';
    
    const resultsSnapshot = await getDocs(collection(db, "results"));
    const results = {};
    resultsSnapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.date}_${data.slot}`;
        results[key] = data;
    });

    const q = query(collection(db, "bets"), where("userId", "==", userId));
    const betsSnapshot = await getDocs(q);

    betsSnapshot.forEach(doc => {
        const bet = doc.data();
        const date = new Date(bet.timestamp.seconds * 1000).toLocaleDateString("en-GB");
        const resultKey = `${date}_${bet.gameSlot}`;
        const result = results[resultKey];
        
        let status = "রেজাল্ট আসেনি";
        let winnings = 0;
        let resultNumber = "N/A";
        
        if (result) {
            resultNumber = result.single;
            if (result.single === bet.number) {
                winnings = bet.tokens * 9;
                status = `জিত: +${winnings}`;
            } else {
                status = `হার: -${bet.tokens}`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${date}</td>
            <td>${bet.gameSlot}</td>
            <td>${bet.number}</td>
            <td>${bet.tokens}</td>
            <td>${resultNumber}</td>
            <td>${status}</td>
        `;
        bettingHistoryTableBody.appendChild(tr);
    });
    
    detailedReportSection.style.display = 'block';
    detailedReportSection.scrollIntoView({ behavior: 'smooth' });
};
