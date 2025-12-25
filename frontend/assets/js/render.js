const Render = {
    paymentMap: {
        'visa': '3459-visa.png',
        'mastercard': '30410-mastercard.png',
        'paypal': '54735-paypal.png',
        'bitcoin': '1425-bitcoin.png',
        'ethereum': '3031-ethereum.png',
        'tether': '6121-tether.png',
        'usdt': '6121-tether.png',
        'paysafe': '3459-paysafecard.png',
        'googlepay': '46992-googlepay.png',
        'applepay': '97263-applepay.png',
        'litecoin': '74062-ltc.png',
        'solana': '19845-solana.png',
        'cashapp': '511601-cashapp.png',
        'venmo': '29806-venmo.png',
        'stripe': '71388-stripe.png',
        'binance': '797078-binance.png'
    },

    // Renders the "Affiliate Top List" style row
    platformListItem: (platform, index) => {
        const logo = platform.logo || (platform.images && platform.images[0]) || '/assets/img/default-provider.png';

        // Badges Logic
        const isNew = (Date.now() - new Date(platform.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const isBeta = platform.tags && (platform.tags.includes('beta') || platform.tags.includes('fixing'));

        const newBadge = isNew ? `<img src="/assets/img/494995-new.png" style="position:absolute; top:-10px; right:-10px; height:40px; z-index:10;" alt="New">` : '';
        const betaBadge = isBeta ? `<img src="/assets/img/18502-beta-pogo-os.png" style="position:absolute; top:-10px; left:-10px; height:40px; z-index:10;" alt="Beta">` : '';


        // Features list parsing
        let featuresHtml = '';
        if (platform.features && Array.isArray(platform.features) && platform.features.length > 0) {
            featuresHtml = `<ul class="aff-features">
                ${platform.features.map(f => `<li>${f}</li>`).join('')}
            </ul>`;
        } else {
            featuresHtml = `<ul class="aff-features">
                <li>Instant Payouts</li>
                <li>Exclusive Bonuses</li>
                <li>Verified License</li>
            </ul>`;
        }

        // Payments parsing
        let paymentsHtml = '';
        if (platform.payment_methods && Array.isArray(platform.payment_methods) && platform.payment_methods.length > 0) {
            paymentsHtml = `<div class="aff-payments">
                ${platform.payment_methods.map(pm => {
                const key = pm.toLowerCase().replace(/\s+/g, '');
                const filename = Render.paymentMap[key] || (key + '.png'); // Fallback
                return `<img src="/assets/img/${filename}" alt="${pm}" title="${pm}" class="pay-icon" style="height:25px; width:auto; margin-right:8px; object-fit:contain;">`;
            }).join('')}
             </div>`;
        } else {
            paymentsHtml = `<div class="aff-payments"></div>`;
        }

        return `
            <div class="affiliate-card" style="position: relative;">
                ${newBadge}
                ${betaBadge}
                <div class="aff-card-header">
                     <img src="${logo}" class="aff-card-logo" alt="${platform.name}">
                </div>
                <div class="aff-card-body">
                    <h3 class="aff-card-title">${platform.name}</h3>
                    <div class="aff-bonus">${(platform.short_description || 'Welcome Bonus').substring(0, 100) + (platform.short_description?.length > 100 ? '...' : '')}</div>
                    
                    ${featuresHtml}
                    ${paymentsHtml}

                    <div class="aff-actions">
                        <a href="${platform.affiliate_link || '#'}" target="_blank" class="btn-green">PLAY NOW ></a>
                         <a href="/casinos/${platform.slug || platform.id}" class="link-review">Read Review</a>
                    </div>
                </div>
            </div>
        `;
    },

    articleCard: (article) => {
        const isNew = (Date.now() - new Date(article.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const newBadge = isNew ? `<div style="position:absolute; top:10px; right:10px; background:var(--primary); color:black; padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold; z-index:5;">NEW</div>` : '';

        // Fallback Logic
        const isFallback = !article.thumbnail || article.thumbnail.includes('logo.webp');
        const imgUrl = article.thumbnail || '/assets/img/logo.webp';
        const bgSize = isFallback ? 'contain' : 'cover';
        const bgResult = `url('${imgUrl}')`;

        return `
            <div class="card article-card" style="position:relative; overflow:hidden; display:flex; flex-direction:column; height:100%; border:1px solid var(--border); background:var(--card-bg);">
                 ${newBadge}
                 <div class="card-img" style="background-image: ${bgResult}; background-size: ${bgSize}; background-repeat: no-repeat; background-position: center; height: 200px; width: 100%; flex-shrink: 0; background-color: ${isFallback ? '#111' : 'transparent'};"></div>
                 <div class="card-body" style="flex:1; display:flex; flex-direction:column; padding:20px;">
                    <h3 style="margin:0 0 15px 0; font-size:1.2rem; line-height:1.4; color:white;">${article.title}</h3>
                    <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">
                            ${new Date(article.created_at).toLocaleDateString()}
                        </span>
                        <a href="/articles.html?id=${article.id}" style="color: var(--primary); font-weight:600; text-decoration:none;">Read More &rarr;</a>
                    </div>
                 </div>
            </div>
        `;
    }
};
