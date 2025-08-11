// js/publicResults.js
const db = firebase.firestore();

// Today results (from 'results' collection)
async function loadTodayResultsUI(containerIdToday) {
  const container = document.getElementById(containerIdToday);
  container.innerHTML = "লোড হচ্ছে...";

  try {
    const snaps = await db.collection("results").orderBy("timestamp", "asc").get();
    if (snaps.empty) {
      container.innerHTML = "<div>আজকের রেজাল্ট এখনও নেই</div>";
      return;
    }
    let html = '';
    snaps.forEach(doc => {
      const d = doc.data();
      const label = d.timeslotLabel || d.gameSlot || d.timeslot || "Slot";
      const num = (d.number !== undefined) ? d.number : (d.winningNumber !== undefined ? d.winningNumber : "-");
      html += `<div class="result-row"><strong>${label}</strong> — ${num}</div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="error">রেজাল্ট লোড ত্রুটি: ${err.message}</div>`;
  }
}

// Last 10 days archived results (from 'archivedResults')
async function loadLastTenDaysUI(containerIdOld) {
  const container = document.getElementById(containerIdOld);
  container.innerHTML = "লোড হচ্ছে...";

  try {
    const snaps = await db.collection("archivedResults").orderBy("date", "desc").limit(10).get();
    if (snaps.empty) {
      container.innerHTML = "<div>কোনো পুরানো রেজাল্ট নেই</div>";
      return;
    }
    let html = '';
    snaps.forEach(doc => {
      const d = doc.data();
      html += `<div style="margin-bottom:10px;"><strong>${d.date}</strong><div>`;
      if (Array.isArray(d.items) && d.items.length) {
        d.items.forEach(it => {
          const label = it.timeslotLabel || it.gameSlot || it.timeslot || "Slot";
          const num = (it.number !== undefined) ? it.number : (it.winningNumber !== undefined ? it.winningNumber : "-");
          html += `<div class="result-row"><strong>${label}</strong> — ${num}</div>`;
        });
      } else {
        html += `<div>No details</div>`;
      }
      html += `</div></div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="error">লোড ত্রুটি: ${err.message}</div>`;
  }
}

function initPublicResults(todayContainerId = 'todayResults', oldContainerId = 'oldResults') {
  loadTodayResultsUI(todayContainerId);
  loadLastTenDaysUI(oldContainerId);
  // Optional: auto-refresh today results every 60s
  // setInterval(() => loadTodayResultsUI(todayContainerId), 60*1000);
}
