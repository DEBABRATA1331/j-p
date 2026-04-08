/* JNP Banquet – Inquiry Form Validation & Submission */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysGcuUK2vWqWXuDJaI0jCndqNeZghnnP7SRcOgx-a2VmVFtIrkGIoaYY5qrwD0zR1URw/exec';

/* ── Dynamic Package Loader ──────────────────────────────── */
(async function loadPackageOptions() {
    const select = document.getElementById('package');
    if (!select) return;

    const FALLBACK = [
        { value: '', label: 'Not sure yet' },
        { value: 'Custom / Need a Quote', label: 'Custom / Need a Quote' },
    ];

    function applyOptions(opts) {
        select.innerHTML = opts.map(o =>
            `<option value="${o.value}">${o.label}</option>`
        ).join('');
    }

    // Show loading state
    select.innerHTML = '<option value="">Loading packages…</option>';
    select.disabled = true;

    try {
        const fd = new URLSearchParams();
        fd.append('action', 'getPackages');
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: fd,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const json = await res.json();
        const packages = (json.data || json);

        if (Array.isArray(packages) && packages.length > 0) {
            const active = packages.filter(p => p.status !== 'inactive');
            const opts = [{ value: '', label: 'Not sure yet' }];
            active.forEach(p => {
                opts.push({
                    value: `${p.name} – ₹${p.price}`,
                    label: `${p.name} – ₹${p.price} ${p.per || '/ event'}`
                });
            });
            opts.push({ value: 'Custom / Need a Quote', label: 'Custom / Need a Quote' });
            applyOptions(opts);
        } else {
            applyOptions(FALLBACK);
        }
    } catch (e) {
        applyOptions(FALLBACK);
    } finally {
        select.disabled = false;
    }
})();

/* ── Form Validation & Submission ────────────────────────── */
const form = document.getElementById('inquiry-form');

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        let valid = true;

        // Clear previous errors
        form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

        // Validate name
        const name = document.getElementById('name');
        if (!name.value.trim()) {
            showError(name, 'Please enter your full name.');
            valid = false;
        }

        // Validate phone
        const phone = document.getElementById('phone');
        const phoneRe = /^[0-9+\-\s]{8,15}$/;
        if (!phone.value.trim()) {
            showError(phone, 'Please enter your phone number.');
            valid = false;
        } else if (!phoneRe.test(phone.value.trim())) {
            showError(phone, 'Please enter a valid phone number.');
            valid = false;
        }

        // Validate event type
        const eventType = document.getElementById('event-type');
        if (!eventType.value) {
            showError(eventType, 'Please select an event type.');
            valid = false;
        }

        // Validate date (optional – must be future if provided)
        const eventDate = document.getElementById('event-date');
        if (eventDate.value) {
            const selected = new Date(eventDate.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selected < today) {
                showError(eventDate, 'Please select a future date.');
                valid = false;
            }
        }

        // Validate guests (optional)
        const guests = document.getElementById('guests');
        if (guests && guests.value && parseInt(guests.value) < 1) {
            showError(guests, 'Please enter a valid guest count.');
            valid = false;
        }

        if (!valid) return;

        // ── Submit ─────────────────────────────────────────
        const btn = form.querySelector('button[type="submit"]');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
        btn.disabled = true;

        const payload = {
            name      : name.value.trim(),
            phone     : phone.value.trim(),
            eventType : eventType.value,
            eventDate : eventDate.value,
            guestCount: guests ? guests.value : '',
            package   : (document.getElementById('package') || {}).value || '',
            message   : (document.getElementById('message') || {}).value.trim()
        };

        const formData = new URLSearchParams();
        formData.append('action', 'addContact');
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method : 'POST',
                body   : formData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const json = await res.json();

            if (json.status === 'error') {
                throw new Error(json.error || 'Server error. Please try again.');
            }

            // Success – hide form-body, show success state
            document.getElementById('form-body').style.display = 'none';
            const successEl = document.getElementById('form-success');
            if (successEl) {
                successEl.style.display = 'block';
                successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

        } catch (err) {
            // Re-enable button and show inline error
            btn.innerHTML = origHTML;
            btn.disabled = false;
            showSubmitError(err.message || 'Failed to send. Please try WhatsApp instead.');
        }
    });

    // Live validation: clear error on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => {
            const group = field.closest('.form-group');
            if (group) group.classList.remove('error');
            const errBox = form.querySelector('.submit-error-msg');
            if (errBox) errBox.remove();
        });
    });
}

/* ── Helpers ─────────────────────────────────────────────── */
function showError(field, message) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('error');
    let msg = group.querySelector('.form-error-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'form-error-msg';
        group.appendChild(msg);
    }
    msg.textContent = message;
}

function showSubmitError(message) {
    let errBox = form.querySelector('.submit-error-msg');
    if (!errBox) {
        errBox = document.createElement('div');
        errBox.className = 'submit-error-msg';
        errBox.style.cssText = 'background:rgba(220,53,69,0.1);border:1px solid rgba(220,53,69,0.4);color:#ff6b6b;padding:0.8rem 1rem;border-radius:8px;font-size:0.9rem;margin-top:0.8rem;text-align:center;';
        form.appendChild(errBox);
    }
    errBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
}
