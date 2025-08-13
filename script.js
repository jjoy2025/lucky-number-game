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
    const today = new Date().toISOString().slice(0, 10);
    const todayRef = database.ref('results/today/' + today);

    todayRef.on('value', (snapshot) => {
        const results = snapshot.val() || {};
        todayResultsContainer.innerHTML = '';

        const todayTable = document.createElement('table');
        todayTable.className = 'today-table';
        const todayRow1 = document.createElement('tr');
        const todayRow2 = document.createElement('tr');
        const todayRow3 = document.createElement('tr');

        for (let i = 1; i <= 8; i++) {
            const resultBox = document.createElement('td');
            const pattyNumber = results[i] ? results[i].patty : '---';
            const singleNumber = results[i] ? results[i].single : '---';
            
            resultBox.innerHTML = `<div class="patty">${pattyNumber}</div>
                                   <div class="single">${singleNumber}</div>`;
            
            if (i <= 3) todayRow1.appendChild(resultBox);
            else if (i <= 6) todayRow2.appendChild(resultBox);
            else todayRow3.appendChild(resultBox);
        }

        todayTable.appendChild(todayRow1);
        if (todayRow2.hasChildNodes()) todayTable.appendChild(todayRow2);
        if (todayRow3.hasChildNodes()) todayTable.appendChild(todayRow3);

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
