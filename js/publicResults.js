import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// Firebase অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// আজকের রেজাল্ট লোড করুন
async function loadTodayResults() {
    const todayResultsContainer = document.getElementById('todayResults');
    todayResultsContainer.innerHTML = 'লোডিং...';

    const today = new Date().toLocaleDateString("en-GB");
    try {
        const q = query(collection(db, "results"), orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const result = doc.data();
            todayResultsContainer.innerHTML = `
                <div class="result-display">
                    <h3>আজকের রেজাল্ট:</h3>
                    <p>পত্তি: ${result.patti}</p>
                    <p>সিঙ্গেল: ${result.single}</p>
                </div>
            `;
        } else {
            todayResultsContainer.innerHTML = '<p>আজকের জন্য কোনো রেজাল্ট নেই।</p>';
        }
    } catch (error) {
        console.error("আজকের রেজাল্ট লোড করতে ব্যর্থ:", error);
        todayResultsContainer.innerHTML = '<p>রেজাল্ট লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// পুরাতন রেজাল্ট লোড করুন
async function loadOldResults() {
    const oldResultsContainer = document.getElementById('oldResults');
    oldResultsContainer.innerHTML = 'লোডিং...';

    try {
        const q = query(collection(db, "results"), orderBy("createdAt", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            let html = `<h3>পুরাতন রেজাল্ট:</h3><table><tr><th>তারিখ</th><th>স্লট</th><th>পত্তি</th><th>সিঙ্গেল</th></tr>`;
            querySnapshot.forEach((doc) => {
                const result = doc.data();
                const date = result.createdAt ? new Date(result.createdAt.toDate()).toLocaleDateString("en-GB") : 'N/A';
                html += `<tr><td>${date}</td><td>${result.slot}</td><td>${result.patti}</td><td>${result.single}</td></tr>`;
            });
            html += `</table>`;
            oldResultsContainer.innerHTML = html;
        } else {
            oldResultsContainer.innerHTML = '<p>কোনো পুরাতন রেজাল্ট নেই।</p>';
        }
    } catch (error) {
        console.error("পুরাতন রেজাল্ট লোড করতে ব্যর্থ:", error);
        oldResultsContainer.innerHTML = '<p>রেজাল্ট লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// উভয় ফাংশন কল করুন
window.addEventListener('DOMContentLoaded', () => {
    loadTodayResults();
    loadOldResults();
});
