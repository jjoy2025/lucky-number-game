// Error display div তৈরি
const errorDiv = document.createElement('div');
errorDiv.style.position = 'fixed';
errorDiv.style.top = '0';
errorDiv.style.left = '0';
errorDiv.style.width = '100%';
errorDiv.style.backgroundColor = 'red';
errorDiv.style.color = 'white';
errorDiv.style.fontSize = '14px';
errorDiv.style.padding = '5px';
errorDiv.style.zIndex = '9999';
errorDiv.style.display = 'none';
document.body.appendChild(errorDiv);

function showError(message) {
    errorDiv.innerText = "❌ " + message;
    errorDiv.style.display = 'block';
}

// Global error catcher
window.onerror = function(message, source, lineno, colno, error) {
    showError(`${message} (Line: ${lineno}, Col: ${colno})`);
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Firebase Init
        const app = firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        console.log("✅ Firebase connected!");
        document.body.insertAdjacentHTML('beforeend', '<p style="color:green;">✅ Firebase connected successfully!</p>');

        // Firestore test read
        db.collection("test").get()
            .then(snapshot => {
                if (snapshot.empty) {
                    document.body.insertAdjacentHTML('beforeend', '<p style="color:orange;">⚠️ No test data found in Firestore collection "test".</p>');
                } else {
                    document.body.insertAdjacentHTML('beforeend', `<p style="color:blue;">📄 Found ${snapshot.size} test record(s) in Firestore.</p>`);
                }
            })
            .catch(err => {
                showError("Firestore read error: " + err.message);
            });

    } catch (err) {
        showError("Firebase init error: " + err.message);
    }
});
