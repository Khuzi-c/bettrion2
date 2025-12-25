class Translator {
    constructor() {
        this.currentLang = localStorage.getItem('app_lang') || 'en';
        this.translations = {};
    }

    async init() {
        // 1. If language not manually set, try to auto-detect from IP
        if (!localStorage.getItem('app_lang')) {
            try {
                const res = await fetch('/api/auth/my-ip');
                const data = await res.json();
                if (data.country === 'Spain' || data.country === 'Mexico' || data.country === 'Colombia' || data.country === 'Argentina') {
                    this.currentLang = 'es';
                }
                // Add more mappings here
            } catch (e) {
                console.warn('Auto-detect language failed:', e);
            }
        }

        await this.loadLanguage(this.currentLang);
    }

    async loadLanguage(lang) {
        try {
            const res = await fetch(`/assets/i18n/${lang}.json`);
            if (!res.ok) throw new Error('Lang file not found');
            this.translations = await res.json();
            this.currentLang = lang;
            localStorage.setItem('app_lang', lang);
            this.translatePage();
            console.log(`Language loaded: ${lang}`);
        } catch (e) {
            console.error(e);
            // Fallback to EN if failed
            if (lang !== 'en') this.loadLanguage('en');
        }
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                if (el.tagName === 'INPUT') {
                    el.placeholder = this.translations[key];
                } else {
                    el.innerText = this.translations[key];
                }
            }
        });
    }

    changeLanguage(lang) {
        this.loadLanguage(lang);
    }
}

const translator = new Translator();
document.addEventListener('DOMContentLoaded', () => {
    translator.init();
});
