// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * archiveTodayResults
 * - scheduled to run at 00:00 IST daily
 * - reads all docs from 'results' collection
 * - writes one doc to 'archivedResults' with id = YYYY-MM-DD and fields { date, items, archivedAt }
 * - deletes original docs from 'results' (batch)
 *
 * CAUTION: This function deletes docs from 'results' after archiving.
 * Use archiveTodayResultsDryRun() to test without deleting.
 */
exports.archiveTodayResults = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      const resultsRef = db.collection("results");
      const snapshot = await resultsRef.get();
      if (snapshot.empty) {
        console.log("No results to archive.");
        return null;
      }

      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // Determine archive date (yesterday in IST; function runs at 00:00 IST)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yyyy = yesterday.getFullYear();
      const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
      const dd = String(yesterday.getDate()).padStart(2, "0");
      const archiveDate = `${yyyy}-${mm}-${dd}`;

      // Save archived doc (id = archiveDate)
      const archivedRef = db.collection("archivedResults").doc(archiveDate);
      await archivedRef.set({
        date: archiveDate,
        items: items,
        archivedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`Archived ${items.length} results to archivedResults/${archiveDate}`);

      // Delete original results
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(resultsRef.doc(doc.id));
      });
      await batch.commit();

      console.log("Original results deleted from 'results' collection.");
      return null;
    } catch (err) {
      console.error("Archive function error:", err);
      throw err;
    }
  });

/**
 * archiveTodayResultsDryRun
 * - For testing only: archives results but does NOT delete originals.
 * - You can run this manually from Firebase Console to verify archive output.
 */
exports.archiveTodayResultsDryRun = functions.pubsub
  .schedule("0 1 * * *") // schedule time irrelevant; you'll Run it manually for testing
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      const resultsRef = db.collection("results");
      const snapshot = await resultsRef.get();
      if (snapshot.empty) {
        console.log("No results to archive (dry run).");
        return null;
      }

      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yyyy = yesterday.getFullYear();
      const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
      const dd = String(yesterday.getDate()).padStart(2, "0");
      const archiveDate = `${yyyy}-${mm}-${dd}`;

      const archivedRef = db.collection("archivedResults").doc(archiveDate);
      await archivedRef.set({
        date: archiveDate,
        items: items,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        dryRun: true
      }, { merge: true });

      console.log(`(dry) Archived ${items.length} results to archivedResults/${archiveDate}`);
      // Notice: DO NOT delete originals in dry run.
      return null;
    } catch (err) {
      console.error("Archive dry run error:", err);
      throw err;
    }
  });
  
/**
 * processTokenTransaction
 * - Triggers when a new document is added to the 'transactions' collection.
 * - Updates the user's wallet balance securely.
 */
exports.processTokenTransaction = functions.firestore
    .document('transactions/{transactionId}')
    .onCreate(async (snapshot, context) => {
        const transaction = snapshot.data();

        if (transaction.status !== 'pending') {
            return null;
        }

        const userId = transaction.userId;
        const amount = transaction.amount;
        const type = transaction.type;

        const walletRef = db.collection('wallets').doc(userId);

        try {
            await db.runTransaction(async (t) => {
                const walletDoc = await t.get(walletRef);
                
                if (!walletDoc.exists) {
                    throw new Error("Wallet document does not exist!");
                }

                const currentBalance = walletDoc.data().tokens || 0;
                let newBalance;

                if (type === 'credit') {
                    newBalance = currentBalance + amount;
                } else if (type === 'debit') {
                    if (currentBalance < amount) {
                        throw new Error("Insufficient tokens for debit!");
                    }
                    newBalance = currentBalance - amount;
                } else {
                    throw new Error("Invalid transaction type!");
                }
                
                t.update(walletRef, { tokens: newBalance });
                
                t.update(snapshot.ref, { status: 'processed', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            });
            
            console.log(`Transaction ${context.params.transactionId} processed successfully.`);
            return null;
            
        } catch (e) {
            console.error(`Error processing transaction ${context.params.transactionId}:`, e);
            await snapshot.ref.update({ status: 'failed', error: e.message, processedAt: admin.firestore.FieldValue.serverTimestamp() });
            return null;
        }
    });

