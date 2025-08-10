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

// Error ধরার সিস্টেম
window.onerror = function(message, source, lineno, colno, error) {
    errorDiv.innerText = `❌ Error: ${message} (Line: ${lineno}, Col: ${colno})`;
    errorDiv.style.display = 'block';
};

// Firebase লোড করা
try {
    import('./firebase-config.js').then(module => {
        const { initializeApp } = window.firebase;
        const { getFirestore } = window.firebase;
        
        const firebaseConfig = module.firebaseConfig;
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        console.log("✅ Firebase connected successfully!");
        document.body.insertAdjacentHTML('beforeend', '<p style="color:green;">Firebase connected successfully!</p>');
    }).catch(err => {
        throw new Error("Firebase config load failed: " + err.message);
    });
} catch (err) {
    throw new Error("Firebase initialization error: " + err.message);
}

// DOM লোড চেক
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Page loaded successfully!");
});
