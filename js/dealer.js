import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

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
    console.log("ব্যবহারকারী লগইন করেছে:", user.email);
    loadCurrentGameSlot();
    fetchDealerData(user.uid);
  } else {
    console.log("কোনো ব্যবহারকারী লগইন করা নেই।");
    window.location.href = "index.html";
  }
});

// ডিলারের ডেটা, হিস্টরি এবং উইনিং ভাউচার লোড করা
async function fetchDealerData(dealerId) {
  try {
    const dealerDocRef = doc(db, "dealers", dealerId);
    const dealerDoc = await getDoc(dealerDocRef);

    if (dealerDoc.exists()) {
      const dealerData = dealerDoc.data();
      document.getElementById("currentBalance").textContent = dealerData.balance;

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
    const q = query(betsCollectionRef, where("dealerId", "==", dealerId), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    const bettingHistoryDiv = document.getElementById("bettingHistory");
    const winningVouchersDiv = document.getElementById("winningVouchers");
    bettingHistoryDiv.innerHTML = '';
    winningVouchersDiv.innerHTML = '';

    const hasWinningVouchers = false;
    const hasBettingHistory = false;

    for (const doc of querySnapshot.docs) {
      const bet = doc.data();

      // বেটিং হিস্টরি আইটেম তৈরি করা
      const historyItem = document.createElement('div');
      historyItem.classList.add('result-item');
      historyItem.innerHTML = `
                <p><strong>গেম স্লট:</strong> ${times[bet.gameSlot - 1].label}</p>
                <p><strong>আপনার নাম্বার:</strong> ${bet.betNumber}</p>
                <p><strong>টোকেন:</strong> ${bet.betAmount}</p>
                <p><strong>সময়:</strong> ${new Date(bet.timestamp).toLocaleString('bn-BD')}</p>
            `;
      bettingHistoryDiv.appendChild(historyItem);
      hasBettingHistory = true;

      // উইনিং ভাউচার চেক করা
      if (bet.winningNumber === bet.betNumber && bet.winningNumber !== null) {
        const winningAmount = bet.betAmount * 9;
        const voucherItem = document.createElement('div');
        voucherItem.classList.add('voucher-item');
        voucherItem.innerHTML = `
                    <h4>উইনিং ভাউচার</h4>
                    <p><strong>গেম:</strong> ${times[bet.gameSlot - 1].label}</p>
                    <p><strong>জয়ী নাম্বার:</strong> ${bet.winningNumber}</p>
                    <p><strong>আপনার বেট:</strong> ${bet.betNumber} (${bet.betAmount} টোকেন)</p>
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
    const dealerDocRef = doc(db, "dealers", user.uid);
    const dealerDoc = await getDoc(dealerDocRef);
    const currentBalance = dealerDoc.data().balance;

    if (currentBalance < betAmount) {
      alert("আপনার অ্যাকাউন্টে পর্যাপ্ত টোকেন নেই।");
      return;
    }

    // নতুন বেট যোগ করা
    const newBetRef = doc(collection(db, "bets"));
    await setDoc(newBetRef, {
      dealerId: user.uid,
      gameSlot: currentGameSlot,
      betNumber: betNumber,
      betAmount: betAmount,
      winningNumber: null, // ডিফল্ট হিসেবে null
      timestamp: new Date().getTime(),
    });

    // ব্যালেন্স আপডেট করা
    await setDoc(dealerDocRef, {
      balance: currentBalance - betAmount
    }, {
      merge: true
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
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("লগআউট করতে ব্যর্থ:", error);
  });
});
