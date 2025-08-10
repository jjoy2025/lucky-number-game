import { 
  db, 
  auth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs
} from './firebase-config.js';

// DOM এলিমেন্ট
const app = document.getElementById('app');
let currentUser = null;
const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63"; // আপনার অ্যাডমিন UID

// প্রাথমিক UI
function renderHome() {
  app.innerHTML = `
    <header>
      <h1>লাকি নাম্বার গেম</h1>
      <button id="authBtn">ডিলার/এডমিন লগইন</button>
    </header>
    <main>
      <section id="results">
        <h2>আজকের রেজাল্ট</h2>
        <div id="todayResults">রেজাল্ট লোড হচ্ছে...</div>
      </section>
      <div id="gamePanel" style="display:none;"></div>
    </main>
  `;
  document.getElementById('authBtn').addEventListener('click', handleAuth);
}

// লগইন/লগআউট
async function handleAuth() {
  if (currentUser) {
    await signOut(auth);
    currentUser = null;
    alert('লগআউট হয়েছে');
    renderHome();
  } else {
    const email = prompt("ইমেইল দিন:");
    const password = prompt("পাসওয়ার্ড দিন:");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      currentUser = userCredential.user;
      alert("লগইন সফল!");
      renderGamePanel();
    } catch (error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// অ্যাডমিন চেক
function isAdmin() {
  return currentUser && currentUser.uid === ADMIN_UID;
}

// গেম প্যানেল
async function renderGamePanel() {
  const gamePanel = document.getElementById('gamePanel');
  gamePanel.style.display = 'block';
  
  const adminPanelHTML = isAdmin() ? `
    <section class="admin-panel">
      <h3>🔒 এডমিন কন্ট্রোল</h3>
      <div class="admin-actions">
        <button id="declareResultBtn">রেজাল্ট ঘোষণা</button>
        <button id="addTokensBtn">টোকেন অ্যাড</button>
        <button id="deductTokensBtn">টোকেন ডেবিট</button>
        <button id="viewAllTxnsBtn">সব লেনদেন দেখুন</button>
      </div>
    </section>
  ` : `
    <button id="viewMyTxnsBtn">আমার লেনদেন</button>
  `;

  gamePanel.innerHTML = `
    <div class="game-container">
      <section id="gameSection">
        <h2>বাজি ধরুন (0-9)</h2>
        <div class="numberPad"></div>
        <div id="wallet">টোকেন: লোড হচ্ছে...</div>
        <div id="betHistory"></div>
      </section>
      ${adminPanelHTML}
      <div id="txnHistory"></div>
    </div>
  `;

  generateNumberPad();
  loadWallet();
  loadBetHistory();

  if (isAdmin()) {
    document.getElementById('declareResultBtn').addEventListener('click', declareResult);
    document.getElementById('addTokensBtn').addEventListener('click', addTokens);
    document.getElementById('deductTokensBtn').addEventListener('click', deductTokens);
    document.getElementById('viewAllTxnsBtn').addEventListener('click', () => loadTransactions(true));
  } else {
    document.getElementById('viewMyTxnsBtn').addEventListener('click', () => loadTransactions(false));
  }
}

// নাম্বার প্যাড
function generateNumberPad() {
  const pad = document.querySelector('.numberPad');
  pad.innerHTML = '';
  for (let i = 0; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'numberBtn';
    btn.textContent = i;
    btn.addEventListener('click', () => placeBet(i));
    pad.appendChild(btn);
  }
}

// ওয়ালেট
async function loadWallet() {
  if (!currentUser) return;
  const walletRef = doc(db, 'wallets', currentUser.uid);
  const snap = await getDoc(walletRef);
  const balance = snap.exists() ? snap.data().balance || 0 : 0;
  document.getElementById('wallet').textContent = `টোকেন: ${balance}`;
}

// বেট হিস্ট্রি
async function loadBetHistory() {
  if (!currentUser) return;
  const q = query(collection(db, 'bets'), where('userId', '==', currentUser.uid));
  const snap = await getDocs(q);
  let html = '<h3>বেট হিস্ট্রি</h3>';
  snap.forEach(docSnap => {
    const data = docSnap.data();
    html += `<div class="bet-entry">
      <span>${data.number} নম্বর</span>
      <span>${data.tokens} টোকেন</span>
    </div>`;
  });
  document.getElementById('betHistory').innerHTML = html;
}

// বাজি ধরা
async function placeBet(number) {
  if (!canPlaceBet()) {
    alert("এখন বেটিং বন্ধ!");
    return;
  }
  const tokens = parseInt(prompt(`কত টোকেন বাজি ধরবেন? (${number} নম্বর)`));
  if (tokens > 0) {
    await addDoc(collection(db, 'bets'), {
      userId: currentUser.uid,
      number,
      tokens,
      timestamp: serverTimestamp()
    });
    alert(`${number} নম্বরে ${tokens} টোকেন বাজি ধরা হয়েছে`);
    loadBetHistory();
  }
}

// বেট টাইম চেক
function canPlaceBet() {
  return true; // আপাতত সবসময় চালু
}

// রেজাল্ট ঘোষণা
async function declareResult() {
  const winningNumber = parseInt(prompt("জয়ী নাম্বার (0-9):"));
  if (winningNumber >= 0 && winningNumber <= 9) {
    await addDoc(collection(db, 'results'), {
      number: winningNumber,
      declaredBy: currentUser.email,
      timestamp: serverTimestamp()
    });
    alert(`রেজাল্ট: ${winningNumber}`);
  }
}

// টোকেন অ্যাড
async function addTokens() {
  const userId = prompt("ইউজার UID:");
  const amount = parseInt(prompt("কত টোকেন অ্যাড?"));
  const reason = prompt("কারণ:");
  const walletRef = doc(db, 'wallets', userId);
  await setDoc(walletRef, { balance: increment(amount) }, { merge: true });
  await addDoc(collection(db, 'transactions'), {
    userId, type: 'credit', amount, reason,
    adminId: currentUser.uid, timestamp: serverTimestamp()
  });
  alert("টোকেন অ্যাড হয়েছে");
}

// টোকেন ডেবিট
async function deductTokens() {
  const userId = prompt("ইউজার UID:");
  const amount = parseInt(prompt("কত টোকেন ডেবিট?"));
  const reason = prompt("কারণ:");
  const walletRef = doc(db, 'wallets', userId);
  await setDoc(walletRef, { balance: increment(-amount) }, { merge: true });
  await addDoc(collection(db, 'transactions'), {
    userId, type: 'debit', amount, reason,
    adminId: currentUser.uid, timestamp: serverTimestamp()
  });
  alert("টোকেন ডেবিট হয়েছে");
}

// লেনদেন হিস্ট্রি
async function loadTransactions(all = false) {
  let q;
  if (all && isAdmin()) {
    q = collection(db, 'transactions');
  } else {
    q = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
  }
  const snap = await getDocs(q);
  let html = `<h3>লেনদেন হিস্ট্রি</h3>
    <table border="1">
      <tr><th>তারিখ</th><th>টাইপ</th><th>টোকেন</th><th>কারণ</th></tr>`;
  snap.forEach(docSnap => {
    const d = docSnap.data();
    html += `<tr>
      <td>${d.timestamp?.toDate().toLocaleString() || ''}</td>
      <td>${d.type}</td>
      <td>${d.amount}</td>
      <td>${d.reason || ''}</td>
    </tr>`;
  });
  html += `</table>`;
  if (isAdmin() && all) {
    html += `<button id="downloadCSV">CSV ডাউনলোড</button>`;
  }
  document.getElementById('txnHistory').innerHTML = html;

  if (isAdmin() && all) {
    document.getElementById('downloadCSV').addEventListener('click', () => downloadCSV(snap));
  }
}

// CSV ডাউনলোড
function downloadCSV(snap) {
  let csv = "তারিখ,টাইপ,টোকেন,কারণ\n";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    csv += `${d.timestamp?.toDate().toLocaleString() || ''},${d.type},${d.amount},${d.reason || ''}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
}

// ইনিশিয়াল রেন্ডার
renderHome();

// Auth স্টেট
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    renderGamePanel();
  } else {
    renderHome();
  }
});
