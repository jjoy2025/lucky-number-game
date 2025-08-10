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
  serverTimestamp
} from './firebase-config.js';

// DOM এলিমেন্ট
const app = document.getElementById('app');
let currentUser = null;
const ADMIN_UID = "dfAI8a7DfMRxgeymYJlGwuruxz63"; // আপনার অ্যাডমিন UID

// প্রাথমিক UI রেন্ডার
function renderHome() {
  app.innerHTML = `
    <header>
      <h1>লাকি নাম্বার গেম</h1>
      <button id="authBtn">ডিলার লগইন</button>
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

// লগইন/লগআউট হ্যান্ডলার
async function handleAuth() {
  if (currentUser) {
    await signOut(auth);
    currentUser = null;
    alert('সফলভাবে লগআউট হয়েছে');
    renderHome();
  } else {
    const email = prompt("ডিলার ইমেইল দিন:");
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

// এডমিন চেক ফাংশন (আপডেটেড)
async function isAdmin() {
  if (!currentUser) return false;
  return currentUser.uid === ADMIN_UID; // সরাসরি UID চেক
}

// গেম প্যানেল রেন্ডার
async function renderGamePanel() {
  const gamePanel = document.getElementById('gamePanel');
  gamePanel.style.display = 'block';
  
  const adminPanelHTML = await isAdmin() ? `
    <section class="admin-panel">
      <h3>🔒 এডমিন কন্ট্রোল</h3>
      <div class="admin-actions">
        <button id="declareResultBtn">রেজাল্ট ঘোষণা করুন</button>
        <button id="addTokensBtn">টোকেন অ্যাড করুন</button>
      </div>
    </section>
  ` : '';

  gamePanel.innerHTML = `
    <div class="game-container">
      <section id="gameSection">
        <h2>বাজি ধরুন (1-9)</h2>
        <div class="numberPad"></div>
        <div id="wallet">টোকেন: 0</div>
      </section>
      ${adminPanelHTML}
    </div>
  `;

  generateNumberPad();
  if (await isAdmin()) {
    document.getElementById('declareResultBtn').addEventListener('click', declareResult);
    document.getElementById('addTokensBtn').addEventListener('click', addTokens);
  }
}

// নাম্বার প্যাড জেনারেট
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

// বাজি ধরার ফাংশন
async function placeBet(number) {
  if (!canPlaceBet()) {
    alert("এই মুহূর্তে বেটিং বন্ধ!");
    return;
  }

  const tokens = parseInt(prompt(`কত টোকেন বাজি ধরবেন? (${number} নম্বর)`));
  if (tokens > 0) {
    try {
      await addDoc(collection(db, 'bets'), {
        userId: currentUser.uid,
        number: number,
        tokens: tokens,
        timestamp: serverTimestamp()
      });
      alert(`${number} নম্বরে ${tokens} টোকেন বাজি ধরা হয়েছে!`);
    } catch (error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// টাইম ভ্যালিডেশন
function canPlaceBet() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const gameTimes = [11, 13, 14.5, 15.5, 16.5, 18, 19.5, 21]; // [11AM, 1PM, 2:30PM...]
  
  for (const time of gameTimes) {
    const [hour, min] = [Math.floor(time), (time % 1) * 60];
    if (
      currentHour === hour && 
      currentMin >= min - 20 && 
      currentMin < min
    ) return true;
  }
  return false;
}

// এডমিন ফাংশন: রেজাল্ট ঘোষণা
async function declareResult() {
  const winningNumber = parseInt(prompt("জয়ী নাম্বার লিখুন (0-9):"));
  if (winningNumber >= 0 && winningNumber <= 9) {
    try {
      await addDoc(collection(db, 'results'), {
        number: winningNumber,
        declaredBy: currentUser.email,
        timestamp: serverTimestamp()
      });
      alert(`রেজাল্ট সেট করা হয়েছে: ${winningNumber}`);
    } catch (error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// এডমিন ফাংশন: টোকেন অ্যাড
async function addTokens() {
  const userId = prompt("ইউজার UID দিন:");
  const amount = parseInt(prompt("কত টোকেন অ্যাড করতে চান?"));
  
  if (userId && amount) {
    try {
      const walletRef = doc(db, 'wallets', userId);
      await setDoc(walletRef, {
        balance: increment(amount),
        lastUpdated: serverTimestamp()
      }, { merge: true });
      alert(`${amount} টোকেন অ্যাড করা হয়েছে!`);
    } catch (error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// অ্যাপ ইনিশিয়ালাইজ
renderHome();

// Auth স্টেট লিসেনার
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    renderGamePanel();
  } else {
    renderHome();
  }
});
