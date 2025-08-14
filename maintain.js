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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const adminPassword = "Probirgsm@10"; // এখানে আপনার পছন্দের একটি পাসওয়ার্ড দিন

const loginSection = document.getElementById('login-section');
const maintenanceSection = document.getElementById('maintenance-section');
const passwordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('login-button');
const runMaintenanceButton = document.getElementById('run-maintenance-button');
const statusMessage = document.getElementById('status-message');

loginButton.addEventListener('click', () => {
    if (passwordInput.value === adminPassword) {
        loginSection.style.display = 'none';
        maintenanceSection.style.display = 'flex';
    } else {
        alert('Incorrect Password!');
    }
});

runMaintenanceButton.addEventListener('click', () => {
    statusMessage.textContent = 'Archiving results... Please wait.';
    runMaintenance();
});

function runMaintenance() {
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
                        yesterdayResultsRef.remove().then(() => {
                            archiveMetadataRef.child('last_archived_date').set(todayDateStr).then(() => {
                                statusMessage.textContent = "Maintenance complete. Results archived!";
                            });
                        });
                    });
                } else {
                    archiveMetadataRef.child('last_archived_date').set(todayDateStr).then(() => {
                        statusMessage.textContent = "No results found for yesterday. Maintenance complete.";
                    });
                }
            });
        } else {
            statusMessage.textContent = "Maintenance already completed for today.";
        }
    }).catch(error => {
        statusMessage.textContent = "Error during maintenance: " + error.message;
        console.error("Maintenance failed: ", error);
    });
}
