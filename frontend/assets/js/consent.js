// Consent handling script
document.addEventListener('DOMContentLoaded', async () => {
    // Check if consent is already given
    const hasConsent = document.cookie.split(';').some(c => c.trim().startsWith('consent='));

    // Also check localStorage for country (primary check for welcome flow)
    const hasCountry = localStorage.getItem('user_country');

    if (!hasConsent || !hasCountry) {
        // Load Welcome Modal
        try {
            const res = await fetch('/components/consentBanner.html'); // This is now the Modal
            const html = await res.text();
            const div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);

            const modal = document.getElementById('welcome-modal');

            // --- Elements ---
            // Step 1: Country
            const stepCountry = document.getElementById('step-country');
            const countrySelect = document.getElementById('welcome-country-select');
            const countryText = document.getElementById('welcome-select-text');
            const countryOptions = document.getElementById('welcome-options');
            const countryList = document.getElementById('welcome-list');
            const countrySearch = document.getElementById('welcome-search');
            const btnNext = document.getElementById('btn-next-step');

            // Step 2: Age
            const stepAge = document.getElementById('step-age');
            const checkAge = document.getElementById('check-age');
            const btnEnter = document.getElementById('consent-accept');

            let selectedCountry = "";

            // --- Data ---
            const countries = [
                "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden",
                "Norway", "Finland", "Denmark", "Ireland", "New Zealand", "Brazil", "India", "China", "Japan",
                "South Korea", "Russia", "Italy", "Spain", "Portugal", "Poland", "Ukraine", "Turkey", "Saudi Arabia",
                "UAE", "South Africa", "Mexico", "Argentina", "Chile", "Colombia", "Peru", "Vietnam", "Thailand",
                "Indonesia", "Malaysia", "Singapore", "Philippines", "Switzerland", "Austria", "Belgium", "Czech Republic",
                "Greece", "Hungary", "Romania", "Other / Global"
            ];

            // --- Country Logic ---
            function renderCountries(filter = "") {
                countryList.innerHTML = '';
                countries.forEach(c => {
                    if (c.toLowerCase().includes(filter.toLowerCase())) {
                        const opt = document.createElement('div');
                        opt.className = 'welcome-option';
                        opt.innerText = c;
                        opt.onclick = () => {
                            selectedCountry = c;
                            countryText.innerText = c;
                            countryText.style.color = 'white';
                            countryOptions.style.display = 'none';

                            // Enable Next
                            btnNext.disabled = false;
                            btnNext.style.background = '#ffd700'; // Gold
                            btnNext.style.color = '#000';
                            btnNext.style.cursor = 'pointer';
                        };
                        countryList.appendChild(opt);
                    }
                });
            }
            renderCountries();

            // Toggle Dropdown
            countrySelect.onclick = (e) => {
                e.stopPropagation();
                const isOpen = countryOptions.style.display === 'block';
                countryOptions.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) countrySearch.focus();
            };

            // Search Filter
            countrySearch.onclick = (e) => e.stopPropagation();
            countrySearch.oninput = (e) => renderCountries(e.target.value);

            // Close on outside click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    // Do nothing? Or blocking? It's a modal, so usually blocking.
                    // Keep it open.
                } else {
                    // close dropdown if clicked outside select
                    if (!countrySelect.contains(e.target) && !countryOptions.contains(e.target)) {
                        countryOptions.style.display = 'none';
                    }
                }
            };

            // --- Next Step ---
            btnNext.onclick = () => {
                if (!selectedCountry) return;
                stepCountry.style.display = 'none';
                stepAge.style.display = 'block';
            };

            // --- Age Logic ---
            checkAge.onchange = () => {
                if (checkAge.checked) {
                    btnEnter.disabled = false;
                    btnEnter.style.background = '#ffd700';
                    btnEnter.style.color = '#000';
                    btnEnter.style.cursor = 'pointer';
                } else {
                    btnEnter.disabled = true;
                    btnEnter.style.background = '#444';
                    btnEnter.style.color = '#888';
                    btnEnter.style.cursor = 'not-allowed';
                }
            };

            btnEnter.onclick = async () => {
                // 1. Send consent to backend
                try {
                    await fetch('/consent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ consent: true, country: selectedCountry })
                    });
                } catch (e) { console.warn('Consent API error', e); }

                // 2. Set Cookie (Consent)
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                document.cookie = `consent=true; expires=${d.toUTCString()}; path=/; SameSite=Lax`;

                // 3. Set LocalStorage (Country)
                localStorage.setItem('user_country', selectedCountry);

                // 4. Remove Modal
                modal.remove();

                // 5. Init i18n
                if (window.i18n) window.i18n.init();
            };

        } catch (e) {
            console.error('Failed to load welcome modal', e);
        }
    } else {
        // Consent given, init i18n
        if (window.i18n) window.i18n.init();
    }
});
