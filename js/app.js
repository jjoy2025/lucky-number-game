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
  increment
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
    await signOut(auth);
    currentUser = null;
    document.getElementById('authBtn').textContent = 'ডিলার লগইন';
    document.getElementById('gamePanel').style.display = 'none';
    alert('সফলভাবে লগআউট হয়েছে');
  } else {
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
async function renderGamePanel() {
  const gamePanel = document.getElementById('gamePanel');
  gamePanel.style.display = 'block';
  
  const adminPanelHTML = await renderAdminPanel();
  
  gamePanel.innerHTML = `
    <div class="game-container">
      <section id="gameSection">
        <h2>বাজি ধরুন</h2>
        <div class="numberPad"></div>
        <div id="wallet">টোকেন: 0</div>
        <div id="betHistory"></div>
      </section>
      ${adminPanelHTML}
    </div>
  `;
  
  generateNumberPad();
  setupAdminEventListeners();
}

// এডমিন প্যানেল রেন্ডার
async function renderAdminPanel() {
  if(await isAdmin()) {
    return `
      <section class="admin-panel">
        <h3>🔒 এডমিন কন্ট্রোল</h3>
        <div class="admin-actions">
          <button id="declareResultBtn">রেজাল্ট ঘোষণা করুন</button>
          <button id="manageTokensBtn">টোকেন ম্যানেজ করুন</button>
          <button id="viewAllBetsBtn">সকল বাজি দেখুন</button>
        </div>
      </section>
    `;
  }
  return '';
}

// এডমিন ইভেন্ট লিসেনার সেটআপ
function setupAdminEventListeners() {
  if(document.getElementById('declareResultBtn')) {
    document.getElementById('declareResultBtn').addEventListener('click', declareResult);
  }
  if(document.getElementById('manageTokensBtn')) {
    document.getElementById('manageTokensBtn').addEventListener('click', manageTokens);
  }
  if(document.getElementById('viewAllBetsBtn')) {
    document.getElementById('viewAllBetsBtn').addEventListener('click', viewAllBets);
  }
}

// এডমিন চেক ফাংশন
async function isAdmin() {
  if(!auth.currentUser) return false;
  const adminRef = doc(db, 'admins', auth.currentUser.uid);
  const adminSnap = await getDoc(adminRef);
  return adminSnap.exists();
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

// রেজাল্ট ঘোষণা করুন
async function declareResult() {
  const winningNumber = parseInt(prompt("জয়ী নাম্বার লিখুন (1-9):"));
  
  if(winningNumber >= 1 && winningNumber <= 9) {
    try {
      await addDoc(collection(db, 'results'), {
        number: winningNumber,
        declaredBy: currentUser.email,
        timestamp: new Date()
      });
      alert(`${winningNumber} নম্বর জয়ী হিসেবে ঘোষণা করা হয়েছে!`);
    } catch(error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// টোকেন ম্যানেজমেন্ট
async function manageTokens() {
  const userId = prompt("ডিলার ইউজার আইডি দিন:");
  const amount = parseInt(prompt("কত টোকেন যোগ/বিয়োগ করতে চান? (+/-)"));
  
  if(userId && amount) {
    try {
      await updateDoc(doc(db, 'wallets', userId), {
        balance: increment(amount),
        lastUpdated: new Date()
      });
      alert(`${amount} টোকেন সফলভাবে আপডেট করা হয়েছে!`);
    } catch(error) {
      alert("ত্রুটি: " + error.message);
    }
  }
}

// সকল বাজি দেখুন
async function viewAllBets() {
  try {
    const querySnapshot = await getDocs(collection(db, 'bets'));
    let allBets = "<h4>সকল বাজি:</h4><ul>";
    
    querySnapshot.forEach((doc) => {
      const bet = doc.data();
      allBets += `<li>${bet.number} নম্বরে ${bet.tokens} টোকেন (${new Date(bet.timestamp?.toDate()).toLocaleString()})</li>`;
    });
    
    allBets += "</ul>";
    document.querySelector('.admin-panel').innerHTML += allBets;
  } catch(error) {
    alert("বাজি লোড করতে ত্রুটি: " + error.message);
  }
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
