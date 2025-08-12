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
const database = firebase.database();

const todayResultsGrid = document.getElementById('today-results-grid');
const oldResultsContainer = document.getElementById('old-results-container');

function displayResults(container, results) {
    container.innerHTML = '';
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';

    for (let i = 1; i <= 8; i++) {
        const resultBox = document.createElement('div');
        resultBox.className = 'result-box';
        const pattyNumber = results[i] ? results[i].patty : '---';
        const singleNumber = results[i] ? results[i].single : '---';
        
        resultBox.innerHTML = `<div class="patty">${pattyNumber}</div>
                               <div class="single">${singleNumber}</div>`;
        resultsGrid.appendChild(resultBox);
    }
    container.appendChild(resultsGrid);
}

function loadResults() {
    // আজকের রেজাল্ট লোড
    const today = new Date().toISOString().slice(0, 10);
    const todayRef = database.ref('results/today/' + today);

    todayRef.on('value', (snapshot) => {
        const results = snapshot.val() || {};
        const emptyResults = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null };
        todayResultsGrid.innerHTML = '';
        displayResults(todayResultsGrid, { ...emptyResults, ...results });
    });

    // পুরোনো রেজাল্ট লোড
    const oldResultsRef = database.ref('results/old').orderByKey().limitToLast(10);
    oldResultsRef.on('value', (snapshot) => {
        oldResultsContainer.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const date = childSnapshot.key;
            const results = childSnapshot.val();
            const dateSection = document.createElement('div');
            dateSection.className = 'results-section';
            dateSection.innerHTML = `
                <div class="old-results-date">${date}</div>
            `;
            const resultsGrid = document.createElement('div');
            resultsGrid.className = 'results-grid';

            for (let i = 1; i <= 8; i++) {
                const resultBox = document.createElement('div');
                resultBox.className = 'result-box';
                const pattyNumber = results[i] ? results[i].patty : '---';
                const singleNumber = results[i] ? results[i].single : '---';
                
                resultBox.innerHTML = `<div class="patty">${pattyNumber}</div>
                                       <div class="single">${singleNumber}</div>`;
                resultsGrid.appendChild(resultBox);
            }
            dateSection.appendChild(resultsGrid);
            oldResultsContainer.prepend(dateSection);
        });
    });
}

// প্রতি মিনিটে ডেটা রিফ্রেশ করুন
setInterval(loadResults, 60000);
loadResults();
