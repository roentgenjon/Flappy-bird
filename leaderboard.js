const Leaderboard = (() => {
  let currentTab = 'alltime';
  let currentPlayer = '';

  function setPlayer(name) {
    currentPlayer = name;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  function rankIcon(i) {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  }

  function renderList(entries, playerName) {
    const list = document.getElementById('leaderboard-list');
    if (!entries.length) {
      list.innerHTML = '<div class="lb-empty">Noch keine Einträge</div>';
      return;
    }

    list.innerHTML = entries.slice(0, 50).map((e, i) => {
      const isMe = playerName && e.name === playerName;
      const cls = ['lb-entry', i < 3 ? `top-${i + 1}` : '', isMe ? 'is-me' : ''].filter(Boolean).join(' ');
      return `<div class="${cls}">
        <span class="lb-rank">${rankIcon(i)}</span>
        <span class="lb-name">${escapeHtml(e.name)}${isMe ? ' ★' : ''}</span>
        <span class="lb-score">${e.score}</span>
        <span class="lb-date">${formatDate(e.date)}</span>
      </div>`;
    }).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function refresh() {
    let entries;
    if (currentTab === 'today') {
      entries = Storage.getTodayScores();
    } else if (currentTab === 'personal') {
      entries = currentPlayer
        ? Storage.getScores().filter(s => s.name === currentPlayer)
        : [];
    } else {
      entries = Storage.getScores();
    }
    renderList(entries, currentPlayer);
  }

  function init() {
    document.querySelectorAll('#leaderboard-tabs .tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#leaderboard-tabs .tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        refresh();
      });
    });
  }

  return { init, refresh, setPlayer };
})();
