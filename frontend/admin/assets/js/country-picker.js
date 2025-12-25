class CountryPicker {
    constructor(selector, options = {}) {
        this.container = document.querySelector(selector);
        this.options = options;
        this.selectedCountries = new Set();
        this.countries = [
            { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'CA', name: 'Canada' },
            { code: 'AU', name: 'Australia' }, { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
            { code: 'ES', name: 'Spain' }, { code: 'IT', name: 'Italy' }, { code: 'NL', name: 'Netherlands' },
            { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' }, { code: 'DK', name: 'Denmark' },
            { code: 'FI', name: 'Finland' }, { code: 'IE', name: 'Ireland' }, { code: 'NZ', name: 'New Zealand' },
            { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' }, { code: 'BR', name: 'Brazil' },
            { code: 'MX', name: 'Mexico' }, { code: 'IN', name: 'India' }, { code: 'RU', name: 'Russia' },
            { code: 'CN', name: 'China' }, { code: 'SG', name: 'Singapore' }, { code: 'ZA', name: 'South Africa' },
            { code: 'TR', name: 'Turkey' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
            { code: 'CH', name: 'Switzerland' }, { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
            { code: 'PL', name: 'Poland' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'HU', name: 'Hungary' },
            { code: 'RO', name: 'Romania' }, { code: 'GR', name: 'Greece' }, { code: 'PT', name: 'Portugal' },
            { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
            { code: 'PE', name: 'Peru' }, { code: 'ID', name: 'Indonesia' }, { code: 'MY', name: 'Malaysia' },
            { code: 'PH', name: 'Philippines' }, { code: 'TH', name: 'Thailand' }, { code: 'VN', name: 'Vietnam' }
        ].sort((a, b) => a.name.localeCompare(b.name));

        // SVG or PNG? Assuming PNG based on standard libs, but will use onerror to fallback
        this.flagPath = '/assets/img/flags/';

        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="cp-wrapper" style="position:relative;">
                <div class="cp-selected" style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; min-height:30px;"></div>
                
                <div class="cp-controls" style="display:flex; gap:10px;">
                    <input type="text" class="cp-search" placeholder="Search Country..." 
                        style="flex:1; background:#0a0a0a; border:1px solid #333; color:white; padding:8px; border-radius:4px;">
                    <button type="button" onclick="picker.selectAll()" style="padding:0 10px; background:#333; color:white; border:none; border-radius:4px; cursor:pointer;">All</button>
                    <button type="button" onclick="picker.clearAll()" style="padding:0 10px; background:#333; color:white; border:none; border-radius:4px; cursor:pointer;">Clear</button>
                </div>

                <div class="cp-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:300px; overflow-y:auto; background:#111; border:1px solid #333; z-index:1000; border-radius:4px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                    <!-- List Items -->
                </div>
                
                <!-- Hidden Input for Form Submission -->
                <input type="hidden" name="countries_visible" id="countries-hidden-input">
            </div>
            <style>
                .cp-item { padding: 8px 12px; cursor: pointer; display:flex; align-items:center; gap:10px; color:#ccc; }
                .cp-item:hover { background: #222; color:white; }
                .cp-item img { width: 24px; border-radius:2px; }
                .cp-chip { background: var(--accent-gold, #f39c12); color: black; padding: 4px 10px; border-radius: 12px; font-size: 0.9rem; font-weight:bold; display:flex; align-items:center; gap:5px; }
                .cp-chip span { cursor: pointer; font-weight:900; opacity:0.6; }
                .cp-chip span:hover { opacity: 1; }
            </style>
        `;

        this.els = {
            search: this.container.querySelector('.cp-search'),
            dropdown: this.container.querySelector('.cp-dropdown'),
            selected: this.container.querySelector('.cp-selected'),
            hiddenPkg: this.container.querySelector('#countries-hidden-input')
        };

        this.bindEvents();
    }

    bindEvents() {
        this.els.search.addEventListener('focus', () => {
            this.renderList();
            this.els.dropdown.style.display = 'block';
        });

        // Click Outside to Close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.els.dropdown.style.display = 'none';
            }
        });

        this.els.search.addEventListener('input', (e) => {
            this.renderList(e.target.value);
            this.els.dropdown.style.display = 'block';
        });
    }

    renderList(filter = '') {
        const q = filter.toLowerCase();
        // Filter matches AND exclude already selected
        const matches = this.countries.filter(c => {
            const isMatch = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
            const isSelected = this.selectedCountries.has(c.code);
            return isMatch && !isSelected;
        });

        this.els.dropdown.innerHTML = matches.map(c => `
            <div class="cp-item" onclick="picker.select('${c.code}')">
                <img src="${this.flagPath}${c.code.toLowerCase()}.png" onerror="this.src='/assets/img/2666-casino-chip.png'">
                ${c.name} (${c.code})
            </div>
        `).join('');

        if (matches.length === 0) {
            this.els.dropdown.innerHTML = '<div style="padding:10px; color:#666;">No matches found</div>';
        }
    }

    select(code) {
        if (this.selectedCountries.has(code)) return;
        this.selectedCountries.add(code);
        this.updateUI();

        // Re-render list to remove selected item immediately without closing if searching
        // Or simply close. Better UX to keep open if user is multi-selecting?
        // Let's keep input focus and re-render.
        this.renderList(this.els.search.value);
        this.els.search.focus();
    }

    remove(code) {
        this.selectedCountries.delete(code);
        this.updateUI();
        if (this.els.dropdown.style.display === 'block') {
            this.renderList(this.els.search.value);
        }
    }

    selectAll() {
        this.countries.forEach(c => this.selectedCountries.add(c.code));
        this.updateUI();
        this.els.dropdown.style.display = 'none';
    }

    clearAll() {
        this.selectedCountries.clear();
        this.updateUI();
    }

    updateUI() {
        this.els.selected.innerHTML = Array.from(this.selectedCountries).map(code => {
            const country = this.countries.find(c => c.code === code) || { name: code };
            return `
                <div class="cp-chip">
                    <img src="${this.flagPath}${code.toLowerCase()}.png" style="width:16px; height:auto;" onerror="this.style.display='none'">
                    ${country.name}
                    <span onclick="picker.remove('${code}')">×</span>
                </div>
            `;
        }).join('');
        this.els.hiddenPkg.value = Array.from(this.selectedCountries).join(', ');
    }

    set(codes) {
        if (!codes) return;
        const list = Array.isArray(codes) ? codes : codes.split(',').map(s => s.trim());
        this.selectedCountries = new Set();
        list.forEach(c => {
            if (c && c !== 'global') this.selectedCountries.add(c);
        });
        this.updateUI();
    }
}
