// আপনার Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyArpsy4tpySdQEEuZzIa0ZWpz5VzdN7i_I",
    authDomain: "the-lucky-number-9f211.firebaseapp.com",
    databaseURL: "https://the-lucky-number-9f211-default-rtdb.firebaseio.com",
    projectId: "the-lucky-number-9f211",
    storageBucket: "the-lucky-number-9f211.firebasestorage.app",
    messagingSenderId: "988704918151",
    appId: "1:988704918151:web:870a814558135b3c37c622",
    measurementId: "G-5LL375YSZT"
};

// Firebase initialize করুন
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const adminUID = "dfAI8a7DfMRxgeymYJlGwuruxz63"; // আপনার দেওয়া ইউআইডি

const loginSection = document.getElementById('login-section');
const resultFormsContainer = document.getElementById('result-forms-container');
const authForm = document.getElementById('auth-form');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const resultFormsDiv = document.getElementById('result-forms');

// Firebase Authentication অবস্থা নিরীক্ষণ করুন
auth.onAuthStateChanged((user) => {
    if (user && user.uid === adminUID) {
        loginSection.style.display = 'none';
        resultFormsContainer.style.display = 'block';
        loadResultForms();
    } else {
        loginSection.style.display = 'block';
        resultFormsContainer.style.display = 'none';
    }
});

// এডমিন লগইন
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            if (userCredential.user.uid !== adminUID) {
                auth.signOut();
                errorMessage.textContent = "আপনার এই অ্যাকাউন্টটি এডমিন নয়।";
            }
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
});

// এডমিন লগআউট
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        errorMessage.textContent = '';
    }).catch((error) => {
        console.error("লগআউটে ত্রুটি: ", error);
    });
});

// রেজাল্ট আপডেট করার ফর্ম লোড করা
function loadResultForms() {
    const today = new Date().toISOString().slice(0, 10);
    const todayRef = database.ref('results/today/' + today);

    todayRef.on('value', (snapshot) => {
        const results = snapshot.val() || {};
        resultFormsDiv.innerHTML = '';
        
        for (let i = 1; i <= 8; i++) {
            const resultForm = document.createElement('form');
            resultForm.className = 'result-form';
            resultForm.id = `result-form-${i}`;
            
            const pattyValue = results[i] ? results[i].patty : '';
            const singleValue = results[i] ? results[i].single : '';
            
            resultForm.innerHTML = `
                <h3>খেলা ${i}</h3>
                <label for="patty-${i}">পাত্তি নাম্বার:</label>
                <input type="text" id="patty-${i}" value="${pattyValue}" placeholder="তিনটি সংখ্যা লিখুন" required>
                <label for="single-${i}">সিঙ্গেল নাম্বার:</label>
                <input type="text" id="single-${i}" value="${singleValue}" placeholder="একটি সংখ্যা লিখুন" required>
                <button type="submit">আপডেট করুন</button>
            `;
            
            resultFormsDiv.appendChild(resultForm);
            
            resultForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const patty = document.getElementById(`patty-${i}`).value;
                const single = document.getElementById(`single-${i}`).value;

                todayRef.child(i).set({
                    patty: patty,
                    single: single
                }).then(() => {
                    alert(`খেলা ${i} এর রেজাল্ট সফলভাবে আপডেট করা হয়েছে!`);
                }).catch((error) => {
                    alert("আপডেট করার সময় ত্রুটি হয়েছে: " + error.message);
                });
            });
        }
    });
}
