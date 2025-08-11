// js/dealer.js

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  firebaseConfig
} from './firebase-config.js';

// Firebase অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// গেমের সময়গুলো লোড করা
const times = [{
  hour: 11,
  minute: 0,
  label: "১১:০০ এ.এম."
}, {
  hour: 13,
  minute: 0,
  label: "০১:০০ পি.এম."
}, {
  hour: 15,
  minute: 0,
  label: "০৩:০০ পি.এম."
}, {
  hour: 17,
  minute: 0,
  label: "০৫:০০ পি.এম."
}, {
  hour: 19,
  minute: 0,
  label: "০৭:০০ পি.এম."
}, {
  hour: 21,
  minute: 0,
  label: "০৯:০০ পি.এম."
}, ];

let currentGameSlot = -1;

function loadCurrentGameSlot() {
  const now = new Date();
  let foundSlot = false;
  for (let i = 0; i < times.length; i++) {
    let gameTime = new Date();
    gameTime.setHours(times[i].hour, times[i].minute, 0, 0);

    let diff = gameTime.getTime() - now.getTime();
    const twentyMinutes = 20 * 60 * 1000;

    if (diff > twentyMinutes) {
      currentGameSlot = i + 1;
      document.getElementById("currentGameTime").textContent = times[i].label;
      foundSlot = true;
      break;
    }
  }

  if (!foundSlot) {
    document.getElementById("currentGameTime").textContent = "আজকের খেলা শেষ";
  }
}

// লগইন চেক করা
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loadCurrentGameSlot();
    fetchDealerData(user.uid);
  } else {
    window.location.href = "index.html";
  }
});

// ডিলারের ডেটা, হিস্টরি এবং উইনিং ভাউচার লোড করা
async function fetchDealerData(dealerId) {
  try {
    const dealerDocRef = doc(db, "wallets", dealerId);
    const dealerDoc = await getDoc(dealerDocRef);

    if (dealerDoc.exists()) {
      const dealerData = dealerDoc.data();
      document.getElementById("currentBalance").textContent = dealerData.tokens;

      // বেটিং হিস্টরি এবং উইনিং ভাউচার লোড করা
      await fetchDealerBets(dealerId);
    } else {
      console.error("ডিলার ডেটা পাওয়া যায়নি!");
    }
  } catch (error) {
    console.error("ডেটা আনার সময় ত্রুটি:", error);
  }
}

// ডিলারের বেটগুলো নিয়ে আসা এবং উইনিং ভাউচার তৈরি করা
async function fetchDealerBets(dealerId) {
  try {
    const betsCollectionRef = collection(db, "bets");
    const q = query(betsCollectionRef, where("userId", "==", dealerId), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const resultsSnapshot = await getDocs(collection(db, "results"));
    const results = {};
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.createdAt.toDate()).toLocaleDateString("en-GB");
      const key = `${date}_${data.slot}`;
      results[key] = data;
    });

    const bettingHistoryDiv = document.getElementById("bettingHistory");
    const winningVouchersDiv = document.getElementById("winningVouchers");
    bettingHistoryDiv.innerHTML = '';
    winningVouchersDiv.innerHTML = '';

    let hasWinningVouchers = false;
    let hasBettingHistory = false;

    for (const doc of querySnapshot.docs) {
      const bet = doc.data();
      const betDate = new Date(bet.timestamp.toDate()).toLocaleDateString("en-GB");
      const resultKey = `${betDate}_${bet.gameSlot}`;
      const result = results[resultKey];

      // বেটিং হিস্টরি আইটেম তৈরি করা
      const historyItem = document.createElement('div');
      historyItem.classList.add('result-item');
      historyItem.innerHTML = `
        <p><strong>গেম স্লট:</strong> ${times[bet.gameSlot - 1].label}</p>
        <p><strong>আপনার নাম্বার:</strong> ${bet.number}</p>
        <p><strong>টোকেন:</strong> ${bet.tokens}</p>
        <p><strong>সময়:</strong> ${new Date(bet.timestamp.toDate()).toLocaleString('bn-BD')}</p>
      `;
      bettingHistoryDiv.appendChild(historyItem);
      hasBettingHistory = true;

      // উইনিং ভাউচার চেক করা
      if (result && result.single === bet.number) {
        const winningAmount = bet.tokens * 9;
        const voucherItem = document.createElement('div');
        voucherItem.classList.add('voucher-item');
        voucherItem.innerHTML = `
          <h4>উইনিং ভাউচার</h4>
          <p><strong>গেম:</strong> ${times[bet.gameSlot - 1].label}</p>
          <p><strong>জয়ী নাম্বার:</strong> ${result.single}</p>
          <p><strong>আপনার বেট:</strong> ${bet.number} (${bet.tokens} টোকেন)</p>
          <div class="winning-amount">আপনি জিতেছেন: ${winningAmount} টোকেন</div>
        `;
        winningVouchersDiv.appendChild(voucherItem);
        hasWinningVouchers = true;
      }
    }

    if (!hasBettingHistory) {
      document.getElementById("noHistoryMessage").style.display = 'block';
    } else {
      document.getElementById("noHistoryMessage").style.display = 'none';
    }

    if (!hasWinningVouchers) {
      document.getElementById("noVouchersMessage").style.display = 'block';
    } else {
      document.getElementById("noVouchersMessage").style.display = 'none';
    }

  } catch (error) {
    console.error("বেট আনার সময় ত্রুটি:", error);
  }
}

// বেট জমা দেওয়ার ফর্ম
document.getElementById("bettingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const betNumber = parseInt(document.getElementById("betNumber").value);
  const betAmount = parseInt(document.getElementById("betAmount").value);
  const user = auth.currentUser;

  if (!user || currentGameSlot === -1) {
    alert("বেট গ্রহণ করার জন্য এখন কোনো খেলা নেই।");
    return;
  }

  if (betNumber < 0 || betNumber > 9 || betAmount <= 0) {
    alert("দয়া করে সঠিক তথ্য দিন।");
    return;
  }

  try {
    const dealerDocRef = doc(db, "wallets", user.uid);
    const dealerDoc = await getDoc(dealerDocRef);
    const currentBalance = dealerDoc.data().tokens;

    if (currentBalance < betAmount) {
      alert("আপনার অ্যাকাউন্টে পর্যাপ্ত টোকেন নেই।");
      return;
    }

    // নতুন বেট যোগ করা
    await addDoc(collection(db, "bets"), {
      userId: user.uid,
      gameSlot: currentGameSlot,
      number: betNumber,
      tokens: betAmount,
      timestamp: serverTimestamp(),
    });

    // ব্যালেন্স আপডেট করা
    await updateDoc(dealerDocRef, {
      tokens: increment(-betAmount)
    });

    alert("আপনার বেট সফলভাবে জমা দেওয়া হয়েছে!");
    document.getElementById("bettingForm").reset();
    fetchDealerData(user.uid); // ডেটা রিফ্রেশ করা
  } catch (error) {
    console.error("বেট জমা দেওয়ার সময় ত্রুটি:", error);
    alert("বেট জমা দেওয়ার সময় একটি সমস্যা হয়েছে।");
  }
});


// লগআউট
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("সফলভাবে লগআউট হয়েছে।");
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("লগআউট করতে ব্যর্থ:", error);
    alert("লগআউট করতে ব্যর্থ: " + error.message);
  });
});
