/* JNP Banquet – Inquiry Form Validation */

const form = document.getElementById('inquiry-form');
const formCard = document.querySelector('.form-card');
const formSuccess = document.querySelector('.form-success');

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

        // Validate email (optional but must be valid if provided)
        const email = document.getElementById('email');
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.value.trim() && !emailRe.test(email.value.trim())) {
            showError(email, 'Please enter a valid email address.');
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

        // Validate date (optional but must be future if provided)
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
        if (guests.value && guests.value < 1) {
            showError(guests, 'Please enter a valid guest count.');
            valid = false;
        }

        if (valid) {
            const btn = form.querySelector('button[type="submit"]');
            const origText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
            btn.disabled = true;

            const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysGcuUK2vWqWXuDJaI0jCndqNeZghnnP7SRcOgx-a2VmVFtIrkGIoaYY5qrwD0zR1URw/exec';
            const payload = {
                name      : document.getElementById('name').value.trim(),
                email     : document.getElementById('email').value.trim(),
                phone     : document.getElementById('phone').value.trim(),
                eventType : document.getElementById('event-type').value,
                eventDate : document.getElementById('event-date').value,
                message   : document.getElementById('message').value.trim()
            };
            const formData = new URLSearchParams();
            formData.append('action', 'addContact');
            formData.append('data', JSON.stringify(payload));

            try {
                await fetch(APPS_SCRIPT_URL, {
                    method : 'POST',
                    body   : formData,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
            } catch(err) { /* silently proceed – don't block success UX */ }

            form.style.display = 'none';
            document.getElementById('form-success').style.display = 'block';
        }

    });

    // Live validation: clear error on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => {
            const group = field.closest('.form-group');
            if (group) group.classList.remove('error');
        });
    });
}

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
