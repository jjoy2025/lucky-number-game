import { 
  db, 
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from './firebase-config.js';

// DOM এলিমেন্ট
const app = document.getElementById('app');

// প্রাথমিক UI রেন্ডার
function renderHome() {
  app.innerHTML = `
    <header>
      <h1>লাকি নাম্বার গেম</h1>
      <button id="loginBtn">ডিলার লগইন</button>
    </header>
    <main>
      <section id="results">
        <h2>আজকের রেজাল্ট</h2>
        <div id="todayResults"></div>
      </section>
    </main>
  `;
  
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
}

// লগইন হ্যান্ডলার
async function handleLogin() {
  const email = prompt("ডিলার ইমেইল দিন:");
  const password = prompt("পাসওয়ার্ড দিন:");
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    renderGamePanel();
  } catch (error) {
    alert("লগইন ত্রুটি: " + error.message);
  }
}

// গেম প্যানেল রেন্ডার
function renderGamePanel() {
  app.innerHTML += `
    <section id="gamePanel">
      <h2>বাজি ধরুন</h2>
      <div class="numberPad"></div>
      <div id="wallet">টোকেন: 0</div>
    </section>
  `;
  
  generateNumberPad();
}

// নাম্বার প্যাড জেনারেট
function generateNumberPad() {
  const pad = document.querySelector('.numberPad');
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'numberBtn';
    btn.textContent = i;
    btn.addEventListener('click', () => placeBet(i));
    pad.appendChild(btn);
  }
}

// বাজি ধরার ফাংশন
function placeBet(number) {
  alert(`${number} নম্বরে বাজি ধরেছেন`);
  // এখানে Firebase-এ ডাটা সেভ করবেন
}

// অ্যাপ ইনিশিয়ালাইজ
renderHome();
