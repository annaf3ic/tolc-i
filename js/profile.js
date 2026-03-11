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

    const { username, data } = user;
    const stats = data.stats;
    const global = stats.global || { total: 0, correct: 0, wrong: 0 };
    const pct = global.total > 0 ? Math.round((global.correct / global.total) * 100) : 0;

    // Info utente
    $('profile-username').textContent = username;
    $('profile-created').textContent = data.createdAt ? new Date(data.createdAt).toLocaleDateString('it-IT') : '—';

    // Statistiche globali
    $('stat-total').textContent = global.total;
    $('stat-correct').textContent = global.correct;
    $('stat-wrong').textContent = global.wrong;
    $('stat-pct').textContent = pct + '%';
    $('stat-pct-label').textContent = pct + '%';
    $('stat-progress-bar').style.width = pct + '%';
    
    // Calcolo errori totali (somma wrongAnswers di tutte le materie)
    const subjects = ['logica', 'matematica1', 'matematica2', 'scienze'];
    const totalErrors = subjects.reduce((acc, sub) => {
        return acc + (stats[sub]?.wrongAnswers?.length || 0);
    }, 0);
    $('stat-errors').textContent = totalErrors;

    renderErrorCategories(stats);
    renderHistory(data.history || []);
}

function renderErrorCategories(stats) {
    const el = $('error-categories');
    if (!el) return;

    const subjects = ['logica', 'matematica1', 'matematica2', 'scienze'];
    let totalErrors = 0;
    
    const html = subjects.map(sub => {
        const subStats = stats[sub] || { wrongAnswers: [] };
        const wrongAnswers = Array.isArray(subStats.wrongAnswers) ? subStats.wrongAnswers : [];
        const count = wrongAnswers.length;
        totalErrors += count;
        
        // Nome visualizzato per la materia
        const subNames = {
            logica: 'Logica',
            matematica1: 'Matematica 1',
            matematica2: 'Matematica 2',
            scienze: 'Scienze'
        };
        
        return `
            <div class="flex-between mb-sm">
                <span class="text-sm text-mono">${subNames[sub] || sub}</span>
                <span class="badge badge-danger">${count}</span>
            </div>
        `;
    }).join('');

    if (totalErrors === 0) {
        el.innerHTML = '<p class="text-sm text-muted text-center" style="padding:1rem">Nessun errore attivo 🎉</p>';
    } else {
        el.innerHTML = `
            <div class="flex-between mb-md">
                <span class="text-sm text-mono text-muted">Errori per materia</span>
                <span class="badge badge-danger">${totalErrors}</span>
            </div>
            ${html}
        `;
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
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const typeLabel = s.type === 'simulation' ? '⏱ Simulazione' : '📖 Allenamento';
        const pctColor = s.pct >= 70 ? 'var(--success)' : s.pct >= 50 ? 'var(--warn)' : 'var(--danger)';
        
        // Nome visualizzato per la materia
        const subNames = {
            logica: 'Logica',
            matematica1: 'Matematica 1',
            matematica2: 'Matematica 2',
            scienze: 'Scienze'
        };
        const subjectName = subNames[s.subject] || s.subject || 'generale';
        
        return `
            <div class="card mt-sm" style="padding:0.8rem 1rem">
                <div class="flex-between gap-sm">
                    <div>
                        <span class="text-sm text-mono">${typeLabel} · ${subjectName}</span>
                        <p class="text-sm text-muted mt-sm">${date}</p>
                    </div>
                    <div class="text-center">
                        <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:${pctColor}">${s.pct}%</div>
                        <div class="text-sm text-muted">${s.correct}✓ ${s.wrong}✗ ${s.skipped || 0}—</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initProfileEvents() {
    // Reset progresso
    $('btn-reset-progress')?.addEventListener('click', () => openModal('modal-reset-progress'));
    
    $('btn-confirm-reset-progress')?.addEventListener('click', () => {
        const success = Auth.resetProgress();
        closeModal('modal-reset-progress');
        if (success) {
            showMsg('profile-alert', 'Progresso resettato con successo.');
            renderProfile();
        } else {
            showMsg('profile-alert', 'Errore durante il reset.', 'error');
        }
    });
    
    $('btn-cancel-reset-progress')?.addEventListener('click', () => closeModal('modal-reset-progress'));

    // Reset errori
    $('btn-reset-errors')?.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler resettare tutti gli errori?')) {
            const success = Auth.resetWrongAnswers();
            if (success) {
                showMsg('profile-alert', 'Lista errori azzerata.');
                renderProfile();
            } else {
                showMsg('profile-alert', 'Errore durante il reset.', 'error');
            }
        }
    });

    // Cambia password
    $('btn-change-password')?.addEventListener('click', () => {
        // Pulisci i campi
        $('input-old-pwd').value = '';
        $('input-new-pwd').value = '';
        $('input-conf-pwd').value = '';
        $('pwd-alert').className = 'alert';
        $('pwd-alert').textContent = '';
        openModal('modal-change-password');
    });
    
    $('btn-confirm-change-pwd')?.addEventListener('click', async () => {
        const oldPwd = $('input-old-pwd')?.value || '';
        const newPwd = $('input-new-pwd')?.value || '';
        const confPwd = $('input-conf-pwd')?.value || '';
        
        // Validazioni
        if (!oldPwd || !newPwd || !confPwd) {
            showMsg('pwd-alert', 'Tutti i campi sono obbligatori.', 'error');
            return;
        }
        
        if (newPwd !== confPwd) {
            showMsg('pwd-alert', 'Le nuove password non coincidono.', 'error');
            return;
        }
        
        if (newPwd.length < 6) {
            showMsg('pwd-alert', 'La password deve avere almeno 6 caratteri.', 'error');
            return;
        }
        
        // Chiamata a changePassword (async)
        const result = await Auth.changePassword(oldPwd, newPwd);
        
        if (result.ok) {
            closeModal('modal-change-password');
            $('input-old-pwd').value = '';
            $('input-new-pwd').value = '';
            $('input-conf-pwd').value = '';
            showMsg('profile-alert', 'Password aggiornata con successo!');
        } else {
            showMsg('pwd-alert', result.error || 'Errore durante il cambio password.', 'error');
        }
    });
    
    $('btn-cancel-change-pwd')?.addEventListener('click', () => closeModal('modal-change-password'));

    // Elimina account
    $('btn-delete-account')?.addEventListener('click', () => {
        $('input-delete-pwd').value = '';
        $('delete-alert').className = 'alert';
        $('delete-alert').textContent = '';
        openModal('modal-delete-account');
    });
    
    $('btn-confirm-delete')?.addEventListener('click', async () => {
        const pwd = $('input-delete-pwd')?.value || '';
        
        if (!pwd) {
            showMsg('delete-alert', 'Inserisci la password.', 'error');
            return;
        }
        
        // Chiamata a deleteAccount (async)
        const result = await Auth.deleteAccount(pwd);
        
        if (result.ok) {
            // Redirect alla home page
            window.location.href = 'index.html';
        } else {
            showMsg('delete-alert', result.error || 'Password errata', 'error');
        }
    });
    
    $('btn-cancel-delete')?.addEventListener('click', () => closeModal('modal-delete-account'));

    // Chiudi modali cliccando fuori
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => { 
            if (e.target === overlay) overlay.classList.remove('open'); 
        });
    });

    // Logout
    $('btn-logout')?.addEventListener('click', () => Auth.logout());
    
    // Toggle tema
    $('theme-toggle')?.addEventListener('click', () => {
        Auth.toggleTheme();
        // Aggiorna icona
        const toggle = $('theme-toggle');
        if (toggle) toggle.textContent = document.body.classList.contains('light') ? '☾' : '☀';
    });
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // Applica tema
    Auth.applyTheme();
    
    // Verifica autenticazione
    if (!Auth.requireAuth()) return;
    
    // Mostra username
    const user = Auth.getCurrentUser();
    $('nav-username').textContent = user.username;
    
    // Imposta icona tema iniziale
    const toggle = $('theme-toggle');
    if (toggle) toggle.textContent = document.body.classList.contains('light') ? '☾' : '☀';
    
    // Renderizza profilo
    renderProfile();
    
    // Inizializza eventi
    initProfileEvents();
});