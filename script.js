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

const todayResultsContainer = document.getElementById('today-results-container');
const oldResultsContainer = document.getElementById('old-results-container');
const todayDateTitle = document.getElementById('today-date-title');

// PWA সার্ভিস ওয়ার্কার রেজিস্টার করুন
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js') // পাথ পরিবর্তন করা হয়েছে
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// রেজাল্ট আর্কাইভ করার ফাংশন
function checkAndArchiveResults() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const yesterdayDateStr = yesterday.toISOString().slice(0, 10);
    const todayDateStr = now.toISOString().slice(0, 10);

    const archiveMetadataRef = database.ref('archive_metadata');

    archiveMetadataRef.child('last_archived_date').once('value').then((snapshot) => {
        const lastArchivedDate = snapshot.val();

        if (lastArchivedDate !== todayDateStr) {
            const yesterdayResultsRef = database.ref('results/today/' + yesterdayDateStr);
            const oldResultsRef = database.ref('results/old/' + yesterdayDateStr);

            yesterdayResultsRef.once('value').then((resultsSnapshot) => {
                const results = resultsSnapshot.val();
                if (results) {
                    oldResultsRef.set(results).then(() => {
                        console.log("আগের দিনের রেজাল্ট সফলভাবে আর্কাইভ করা হয়েছে।");
                        yesterdayResultsRef.remove();
                        archiveMetadataRef.child('last_archived_date').set(todayDateStr);
                    });
                }
            });
        }
    });
}

function loadResults() {
    // আজকের রেজাল্ট লোড
    const today = new Date();
    const todayDateStr = today.toISOString().slice(0, 10);
    todayDateTitle.textContent = todayDateStr;
    const todayRef = database.ref('results/today/' + todayDateStr);

    todayRef.on('value', (snapshot) => {
        const results = snapshot.val() || {};
        todayResultsContainer.innerHTML = '';

        const todayTable = document.createElement('table');
        todayTable.className = 'today-table';

        const tableHead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (let i = 1; i <= 8; i++) {
            const th = document.createElement('th');
            th.textContent = i;
            headerRow.appendChild(th);
        }
        tableHead.appendChild(headerRow);
        todayTable.appendChild(tableHead);

        const tableBody = document.createElement('tbody');
        const pattyRow = document.createElement('tr');
        const singleRow = document.createElement('tr');

        for (let i = 1; i <= 8; i++) {
            const pattyCell = document.createElement('td');
            const singleCell = document.createElement('td');
            
            const pattyNumber = results[i] ? results[i].patty : '---';
            const singleNumber = results[i] ? results[i].single : '---';
            
            pattyCell.innerHTML = `<span class="patty">${pattyNumber}</span>`;
            singleCell.innerHTML = `<span class="single">${singleNumber}</span>`;

            pattyRow.appendChild(pattyCell);
            singleRow.appendChild(singleCell);
        }

        tableBody.appendChild(pattyRow);
        tableBody.appendChild(singleRow);
        todayTable.appendChild(tableBody);
        
        todayResultsContainer.appendChild(todayTable);
    });

    // পুরোনো রেজাল্ট লোড
    const oldResultsRef = database.ref('results/old').orderByKey().limitToLast(10);
    oldResultsRef.on('value', (snapshot) => {
        oldResultsContainer.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const date = childSnapshot.key;
            const results = childSnapshot.val();

            const oldTable = document.createElement('table');
            oldTable.className = 'old-results-table';
            oldTable.innerHTML = `<caption><div class="old-results-date">${date}</div></caption>`;

            const headerRow = document.createElement('tr');
            for (let i = 1; i <= 8; i++) {
                const th = document.createElement('th');
                th.textContent = i;
                headerRow.appendChild(th);
            }
            oldTable.appendChild(headerRow);

            const resultRow = document.createElement('tr');
            for (let i = 1; i <= 8; i++) {
                const td = document.createElement('td');
                const pattyNumber = results[i] ? results[i].patty : '---';
                const singleNumber = results[i] ? results[i].single : '---';
                
                td.innerHTML = `<span class="patty">${pattyNumber}</span>
                                <span class="single">${singleNumber}</span>`;
                resultRow.appendChild(td);
            }
            oldTable.appendChild(resultRow);
            
            oldResultsContainer.prepend(oldTable);
        });
    });
}

// প্রতি মিনিটে আর্কাইভ করার ফাংশনটি কল করা হচ্ছে
setInterval(checkAndArchiveResults, 60000);

// প্রতি মিনিটে ডেটা রিফ্রেশ করুন
setInterval(loadResults, 60000);
loadResults();
