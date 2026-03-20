'use strict';

function $(id) { return document.getElementById(id); }

function showMsg(id, msg, type = 'success') {
    const el = $(id);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.textContent = msg;
    setTimeout(() => el.classList.remove('show'), 4000);
}

function openModal(id) { $(id)?.classList.add('open'); }
function closeModal(id) { $(id)?.classList.remove('open'); }

function renderProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const { data } = user;
    const stats = data.stats;
    const global = stats.global || { total: 0, correct: 0, wrong: 0 };
    const pct = global.total > 0 ? Math.round((global.correct / global.total) * 100) : 0;

    $('stat-total').textContent = global.total;
    $('stat-correct').textContent = global.correct;
    $('stat-wrong').textContent = global.wrong;
    $('stat-pct').textContent = pct + '%';
    $('stat-pct-label').textContent = pct + '%';
    $('stat-progress-bar').style.width = pct + '%';

    // Errori totali su tutte le materie
    let totalErrors = 0;
    for (const key in stats) {
        if (key !== 'global') totalErrors += stats[key]?.wrongAnswers?.length || 0;
    }
    $('stat-errors').textContent = totalErrors;

    renderErrorCategories(stats);
    renderHistory(data.history || []);
}

function renderErrorCategories(stats) {
    const el = $('error-categories');
    if (!el) return;

    const subjects = [
        { id: 'logica-tutor', label: 'Logica (tutor)' },
        { id: 'matematica1-tutor', label: 'Matematica 1 (tutor)' },
        { id: 'matematica2-tutor', label: 'Matematica 2 (tutor)' },
        { id: 'scienze-tutor', label: 'Scienze (tutor)' },
        { id: 'logica-esempio1', label: 'Logica (Esempio 1)' },
        { id: 'logica-esempio2', label: 'Logica (Esempio 2)' },
        { id: 'matematica-esempio1', label: 'Matematica (Esempio 1)' },
        { id: 'matematica-esempio2', label: 'Matematica (Esempio 2)' },
        { id: 'scienze-esempio1', label: 'Scienze (Esempio 1)' },
        { id: 'fisica-esempio2', label: 'Fisica (Esempio 2)' },
    ];

    let totalErrors = 0;
    const rows = subjects.map(sub => {
        const count = stats[sub.id]?.wrongAnswers?.length || 0;
        totalErrors += count;
        return `<div class="flex-between mb-sm">
            <span class="text-sm text-mono">${sub.label}</span>
            <span class="badge badge-danger">${count}</span>
        </div>`;
    }).join('');

    if (totalErrors === 0) {
        el.innerHTML = '<p class="text-sm text-muted text-center" style="padding:1rem">Nessun errore attivo 🎉</p>';
    } else {
        el.innerHTML = `
            <div class="flex-between mb-md">
                <span class="text-sm text-mono text-muted">Errori per materia</span>
                <span class="badge badge-danger">${totalErrors}</span>
            </div>${rows}`;
    }
}

function renderHistory(history) {
    const el = $('session-history');
    if (!el) return;
    if (!history || history.length === 0) {
        el.innerHTML = '<p class="text-sm text-muted text-center" style="padding:1rem">Nessuna sessione registrata.</p>';
        return;
    }
    el.innerHTML = history.slice(0, 10).map(s => {
        const date = new Date(s.date).toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const typeLabel = s.type === 'simulation' ? '⏱ Simulazione' : '📖 Allenamento';
        const pctColor = s.pct >= 70 ? 'var(--success)' : s.pct >= 50 ? 'var(--warn)' : 'var(--danger)';
        return `
            <div class="card mt-sm" style="padding:0.8rem 1rem">
                <div class="flex-between gap-sm">
                    <div>
                        <span class="text-sm text-mono">${typeLabel} · ${s.subject || 'generale'}</span>
                        <p class="text-sm text-muted mt-sm">${date}</p>
                    </div>
                    <div class="text-center">
                        <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:${pctColor}">${s.pct}%</div>
                        <div class="text-sm text-muted">${s.correct}✓ ${s.wrong}✗ ${s.skipped || 0}—</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function initProfileEvents() {
    $('btn-reset-progress')?.addEventListener('click', () => openModal('modal-reset-progress'));
    $('btn-confirm-reset-progress')?.addEventListener('click', () => {
        const ok = Auth.resetProgress();
        closeModal('modal-reset-progress');
        if (ok) { showMsg('profile-alert', 'Progresso resettato.'); renderProfile(); }
        else showMsg('profile-alert', 'Errore durante il reset.', 'error');
    });
    $('btn-cancel-reset-progress')?.addEventListener('click', () => closeModal('modal-reset-progress'));

    $('btn-reset-errors')?.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler azzerare tutti gli errori?')) {
            const ok = Auth.resetWrongAnswers();
            if (ok) { showMsg('profile-alert', 'Lista errori azzerata.'); renderProfile(); }
            else showMsg('profile-alert', 'Errore.', 'error');
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    $('theme-toggle')?.addEventListener('click', () => {
        Auth.toggleTheme();
        $('theme-toggle').textContent = document.body.classList.contains('light') ? '☾' : '☀';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Auth.applyTheme();
    const toggle = $('theme-toggle');
    if (toggle) toggle.textContent = document.body.classList.contains('light') ? '☾' : '☀';
    renderProfile();
    initProfileEvents();
});