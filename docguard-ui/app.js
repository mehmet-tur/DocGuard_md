/* ═══════════════════════════════════════════════════════════
   DocGuard — Interactive Logic & Mock Data
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMetricCounters();
    initDropzone();
    populateRecentTable();
    populateTriageTable();
    initFilterChips();
    initTriageSearch();
    initDisposition();
    initReviewTimer();
    initTriageActions();

    // Show initial toast
    setTimeout(() => showToast('Sisteme hoş geldiniz, Ahmet Bey.', 'info'), 800);
});

/* ══════════════════════════════════════════════════════════
   NAVIGATION (SPA Hash Routing)
   ══════════════════════════════════════════════════════════ */
function initNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const screens = document.querySelectorAll('.screen');

    function navigate(target) {
        screens.forEach(s => s.classList.remove('active'));
        links.forEach(l => l.classList.remove('active'));

        const screen = document.getElementById(`screen-${target}`);
        const link = document.querySelector(`.nav-link[data-screen="${target}"]`);
        if (screen) screen.classList.add('active');
        if (link) link.classList.add('active');

        // Re-trigger counter animation if dashboard
        if (target === 'dashboard') initMetricCounters();
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.screen;
            window.location.hash = target;
            navigate(target);
        });
    });

    // Logo click → dashboard
    document.getElementById('logo').addEventListener('click', () => {
        window.location.hash = 'dashboard';
        navigate('dashboard');
    });

    // Handle initial hash
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(hash);

    window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '') || 'dashboard';
        navigate(h);
    });
}

/* ══════════════════════════════════════════════════════════
   METRIC COUNTER ANIMATION
   ══════════════════════════════════════════════════════════ */
function initMetricCounters() {
    const counters = document.querySelectorAll('.metric-value');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const isCurrency = counter.classList.contains('currency');
        const duration = 1500;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * eased);

            if (isCurrency) {
                counter.textContent = '₺ ' + current.toLocaleString('tr-TR') + ',00';
            } else {
                counter.textContent = current.toLocaleString('tr-TR');
            }

            if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    });
}

/* ══════════════════════════════════════════════════════════
   DRAG & DROP UPLOAD
   ══════════════════════════════════════════════════════════ */
function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const browseBtn = document.getElementById('browseBtn');

    ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', () => simulateUpload());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        simulateUpload();
    });
}

function simulateUpload() {
    const dropzone = document.getElementById('dropzone');
    const inner = dropzone.querySelector('.dropzone-inner');
    const progress = document.getElementById('uploadProgress');
    const fill = document.getElementById('progressFill');
    const percent = document.getElementById('progressPercent');
    const status = document.getElementById('progressStatus');
    const filename = document.getElementById('progressFilename');

    const names = ['faturalar_2026.zip', 'e-fatura_batch_227.xml', 'satis_faturaları.zip', 'UBL-TR_paket.zip'];
    filename.textContent = names[Math.floor(Math.random() * names.length)];

    inner.style.display = 'none';
    progress.classList.remove('hidden');
    fill.style.width = '0%';

    let p = 0;
    const interval = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 100) {
            p = 100;
            clearInterval(interval);
            status.textContent = '✅ 248 fatura başarıyla işlendi, 3 adet triyaja yönlendirildi.';
            status.style.color = '#22c55e';
            showToast('248 fatura başarıyla işlendi!', 'success');

            setTimeout(() => {
                inner.style.display = '';
                progress.classList.add('hidden');
                status.style.color = '';
                fill.style.width = '0%';
            }, 3000);
        }
        fill.style.width = p + '%';
        percent.textContent = Math.floor(p) + '%';

        if (p < 40) status.textContent = 'Yükleniyor...';
        else if (p < 70) status.textContent = 'XML ayrıştırılıyor...';
        else if (p < 95) status.textContent = 'Kural motoru çalıştırılıyor...';
    }, 200);
}

/* ══════════════════════════════════════════════════════════
   RECENT ACTIVITY TABLE
   ══════════════════════════════════════════════════════════ */
function populateRecentTable() {
    const tbody = document.querySelector('#recentTable tbody');
    const data = [
        { status: 'green', id: 'DOC-2026-9881', time: '09:42:01', file: 'satis_fatura_881.xml', result: 'clean', label: 'Temiz' },
        { status: 'red', id: 'DOC-2026-9912', time: '10:14:22', file: 'alis_fatura_912.xml', result: 'risk', label: 'Riskli (RPS: 95)' },
        { status: 'red', id: 'DOC-2026-9908', time: '10:11:05', file: 'alis_fatura_908.xml', result: 'risk', label: 'Riskli (RPS: 88)' },
        { status: 'amber', id: 'DOC-2026-9884', time: '09:45:10', file: 'satis_fatura_884.xml', result: 'pending', label: 'Beklemede' },
        { status: 'green', id: 'DOC-2026-9879', time: '09:38:55', file: 'satis_fatura_879.xml', result: 'clean', label: 'Temiz' },
        { status: 'green', id: 'DOC-2026-9876', time: '09:35:12', file: 'alis_fatura_876.xml', result: 'clean', label: 'Temiz' },
        { status: 'green', id: 'DOC-2026-9870', time: '09:30:44', file: 'satis_fatura_870.xml', result: 'clean', label: 'Temiz' },
    ];

    tbody.innerHTML = data.map((d, i) => `
        <tr style="animation: fadeInUp 0.4s ${i * 0.06}s both">
            <td><span class="status-dot ${d.status}"></span></td>
            <td><code>${d.id}</code></td>
            <td>${d.time}</td>
            <td>${d.file}</td>
            <td><span class="result-badge ${d.result}">${d.label}</span></td>
        </tr>
    `).join('');
}

/* ══════════════════════════════════════════════════════════
   TRIAGE TABLE
   ══════════════════════════════════════════════════════════ */
const triageData = [
    {
        status: 'red', rps: 95, rpsLabel: 'Kritik', rpsClass: 'rps-critical',
        id: 'DOC-2026-9912', time: '10:14:22',
        signals: [{ code: 'H002', label: 'Tutar Hatası' }, { code: 'G001', label: 'Ortak IBAN' }],
        actionType: 'review'
    },
    {
        status: 'red', rps: 88, rpsLabel: 'Yüksek', rpsClass: 'rps-high',
        id: 'DOC-2026-9908', time: '10:11:05',
        signals: [{ code: 'G003', label: 'Döngüsel Ticaret Şüphesi' }],
        actionType: 'review'
    },
    {
        status: 'red', rps: 82, rpsLabel: 'Yüksek', rpsClass: 'rps-high',
        id: 'DOC-2026-9905', time: '10:08:33',
        signals: [{ code: 'H001', label: 'KDV Hesaplama Hatası' }, { code: 'W005', label: 'Yeni Tedarikçi' }],
        actionType: 'review'
    },
    {
        status: 'red', rps: 76, rpsLabel: 'Yüksek', rpsClass: 'rps-high',
        id: 'DOC-2026-9901', time: '10:02:17',
        signals: [{ code: 'G002', label: 'Anomali Fatura Frekansı' }],
        actionType: 'review'
    },
    {
        status: 'amber', rps: 62, rpsLabel: 'Orta', rpsClass: 'rps-medium',
        id: 'DOC-2026-9897', time: '09:55:41',
        signals: [{ code: 'W008', label: 'Tutar Eşik Aşımı (>100K)' }],
        actionType: 'review'
    },
    {
        status: 'amber', rps: 55, rpsLabel: 'Orta', rpsClass: 'rps-medium',
        id: 'DOC-2026-9893', time: '09:50:28',
        signals: [{ code: 'W011', label: 'Seri Fatura Numarası Atlaması' }],
        actionType: 'review'
    },
    {
        status: 'amber', rps: 45, rpsLabel: 'Orta', rpsClass: 'rps-medium',
        id: 'DOC-2026-9884', time: '09:45:10',
        signals: [{ code: 'W012', label: 'Vergi Yuvarlama Farkı (0.05 TL)' }],
        actionType: 'review'
    },
    {
        status: 'green', rps: 0, rpsLabel: 'Temiz', rpsClass: 'rps-low',
        id: 'DOC-2026-9881', time: '09:42:01',
        signals: [{ code: '—', label: 'Otonom Onaylandı' }],
        actionType: 'archive'
    },
    {
        status: 'green', rps: 0, rpsLabel: 'Temiz', rpsClass: 'rps-low',
        id: 'DOC-2026-9879', time: '09:38:55',
        signals: [{ code: '—', label: 'Otonom Onaylandı' }],
        actionType: 'archive'
    },
    {
        status: 'green', rps: 0, rpsLabel: 'Temiz', rpsClass: 'rps-low',
        id: 'DOC-2026-9876', time: '09:35:12',
        signals: [{ code: '—', label: 'Otonom Onaylandı' }],
        actionType: 'archive'
    },
];

function populateTriageTable(filteredData = null) {
    const tbody = document.getElementById('triageBody');
    const data = filteredData || triageData;

    tbody.innerHTML = data.map((d, i) => `
        <tr style="animation: fadeInUp 0.4s ${i * 0.05}s both" data-id="${d.id}">
            <td><span class="status-dot ${d.status}"></span></td>
            <td><span class="rps-badge ${d.rpsClass}">${d.rps} (${d.rpsLabel})</span></td>
            <td><code>${d.id}</code></td>
            <td>${d.time}</td>
            <td>
                ${d.signals.map(s => `<span class="signal-tag">${s.code} ${s.label}</span>`).join(' ')}
            </td>
            <td>
                ${d.actionType === 'review'
                    ? `<button class="btn-action triage-review-btn" data-id="${d.id}">İncele ➔</button>`
                    : `<button class="btn-action archive">Arşive Git</button>`
                }
            </td>
        </tr>
    `).join('');

    // Attach event listeners for review buttons
    document.querySelectorAll('.triage-review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = 'review';
            const links = document.querySelectorAll('.nav-link');
            const screens = document.querySelectorAll('.screen');
            screens.forEach(s => s.classList.remove('active'));
            links.forEach(l => l.classList.remove('active'));
            document.getElementById('screen-review').classList.add('active');
            document.querySelector('.nav-link[data-screen="review"]').classList.add('active');
            showToast(`${btn.dataset.id} inceleme ekranına yüklendi.`, 'info');
        });
    });
}

/* ══════════════════════════════════════════════════════════
   TRIAGE FILTERS & SEARCH
   ══════════════════════════════════════════════════════════ */
function initFilterChips() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const filter = chip.dataset.filter;
            let filtered;
            switch(filter) {
                case 'pending':
                    filtered = triageData.filter(d => d.rps > 0);
                    break;
                case 'critical':
                    filtered = triageData.filter(d => d.rps > 70);
                    break;
                case 'today':
                    filtered = triageData; // All mock data is "today"
                    break;
                default:
                    filtered = triageData;
            }
            populateTriageTable(filtered);
        });
    });
}

function initTriageSearch() {
    const input = document.getElementById('triageSearch');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        if (!q) {
            populateTriageTable();
            return;
        }
        const filtered = triageData.filter(d =>
            d.id.toLowerCase().includes(q) ||
            d.signals.some(s => s.code.toLowerCase().includes(q) || s.label.toLowerCase().includes(q))
        );
        populateTriageTable(filtered);
    });
}

function initTriageActions() {
    // handled in populateTriageTable
}

/* ══════════════════════════════════════════════════════════
   DISPOSITION (Review Screen)
   ══════════════════════════════════════════════════════════ */
function initDisposition() {
    const btns = document.querySelectorAll('.dispo-btn');
    const modal = document.getElementById('successModal');
    const modalMsg = document.getElementById('modalMessage');
    const modalNext = document.getElementById('modalNextBtn');
    const modalQueue = document.getElementById('modalQueueBtn');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle selection
            btns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Determine action label
            let action = '';
            if (btn.id === 'btnReject') action = 'Gerçek Pozitif — Reddedildi';
            if (btn.id === 'btnApprove') action = 'Yanlış Pozitif — Onaylandı';
            if (btn.id === 'btnBenign') action = 'Zararsız Anomali — İstisnai Onay';

            // Show modal after brief delay
            setTimeout(() => {
                modalMsg.textContent = `DOC-2026-9912 → ${action}`;
                modal.classList.remove('hidden');
                showToast(`Karar kaydedildi: ${action}`, 'success');
            }, 400);
        });
    });

    // Modal buttons
    modalNext.addEventListener('click', () => {
        modal.classList.add('hidden');
        btns.forEach(b => b.classList.remove('selected'));
        showToast('Sonraki belge yükleniyor...', 'info');
    });

    modalQueue.addEventListener('click', () => {
        modal.classList.add('hidden');
        btns.forEach(b => b.classList.remove('selected'));
        window.location.hash = 'triage';
        const links = document.querySelectorAll('.nav-link');
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));
        links.forEach(l => l.classList.remove('active'));
        document.getElementById('screen-triage').classList.add('active');
        document.querySelector('.nav-link[data-screen="triage"]').classList.add('active');
    });

    // LLM Feedback button
    const feedbackBtn = document.getElementById('btnLLMFeedback');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
            showToast('🚩 Geri bildirim Veri Bilimi ekibine iletildi.', 'info');
        });
    }

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            btns.forEach(b => b.classList.remove('selected'));
        }
    });
}

/* ══════════════════════════════════════════════════════════
   REVIEW TIMER
   ══════════════════════════════════════════════════════════ */
function initReviewTimer() {
    const timerEl = document.querySelector('.review-time');
    if (!timerEl) return;

    let seconds = 0;
    setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        timerEl.textContent = `⏱ Oturum: ${m}:${s}`;
    }, 1000);
}

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3200);
}
