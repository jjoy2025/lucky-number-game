import { 
  db, 
  auth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  collection,
  addDoc
} from './firebase-config.js';

// DOM এলিমেন্ট
const app = document.getElementById('app');
let currentUser = null;

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
    // লগআউট
    await signOut(auth);
    currentUser = null;
    document.getElementById('authBtn').textContent = 'ডিলার লগইন';
    document.getElementById('gamePanel').style.display = 'none';
    alert('সফলভাবে লগআউট হয়েছে');
  } else {
    // লগইন
    const email = prompt("ডিলার ইমেইল দিন:");
    const password = prompt("পাসওয়ার্ড দিন:");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      currentUser = userCredential.user;
      renderGamePanel();
      document.getElementById('authBtn').textContent = 'লগআউট';
      alert("লগইন সফল!");
    } catch (error) {
      alert("লগইন ত্রুটি: " + error.message);
    }
  }
}

// গেম প্যানেল রেন্ডার
function renderGamePanel() {
  const gamePanel = document.getElementById('gamePanel');
  gamePanel.style.display = 'block';
  gamePanel.innerHTML = `
    <h2>বাজি ধরুন</h2>
    <div class="numberPad"></div>
    <div id="wallet">টোকেন: 0</div>
    <div id="betHistory"></div>
  `;
  
  generateNumberPad();
}

// নাম্বার প্যাড জেনারেট
function generateNumberPad() {
  const pad = document.querySelector('.numberPad');
  pad.innerHTML = '';
  
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'numberBtn';
    btn.textContent = i;
    btn.addEventListener('click', () => placeBet(i));
    pad.appendChild(btn);
  }
}

// বাজি ধরার ফাংশন
async function placeBet(number) {
  const tokens = parseInt(prompt(`কত টোকেন বাজি ধরবেন? (${number} নম্বর)`));
  
  if (tokens > 0) {
    try {
      await addDoc(collection(db, 'bets'), {
        userId: currentUser.uid,
        number: number,
        tokens: tokens,
        timestamp: new Date()
      });
      alert(`${number} নম্বরে ${tokens} টোকেন বাজি ধরা হয়েছে`);
      addToBetHistory(number, tokens);
    } catch (error) {
      alert("বাজি সংরক্ষণে ত্রুটি: " + error.message);
    }
  }
}

// বাজি হিস্ট্রি যোগ করুন
function addToBetHistory(number, tokens) {
  const history = document.getElementById('betHistory');
  const betEntry = document.createElement('div');
  betEntry.className = 'bet-entry';
  betEntry.innerHTML = `
    <span>${new Date().toLocaleTimeString()}</span>
    <strong>${number} নম্বর:</strong> ${tokens} টোকেন
  `;
  history.appendChild(betEntry);
}

// অ্যাপ ইনিশিয়ালাইজ
renderHome();

// Auth স্টেট লিসেনার
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    renderGamePanel();
    document.getElementById('authBtn').textContent = 'লগআউট';
  }
});
