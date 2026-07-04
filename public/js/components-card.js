/* ============================================================
   Minimal Product Card Web Component
   E-Tech Store — Dynamic & Sleek
   ============================================================ */

class ProductCard extends HTMLElement {
    static get observedAttributes() {
        return ['product-id', 'name', 'price', 'image-url', 'tags'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupGlowEffect();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const id = this.getAttribute('product-id') || '';
        const name = this.getAttribute('name') || 'Sản phẩm';
        const price = this.getAttribute('price') || '0';
        const imageUrl = this.getAttribute('image-url') || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop';
        const tags = this.getAttribute('tags') || '';

        // Formatted Price
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

        this.innerHTML = `
            <article class="product-card reveal" data-product-tags="${tags}" aria-label="${name}">
                <div class="product-image-container" onclick="window.location.href='/product.html?id=${id}'" style="cursor:pointer;">
                    <img src="${imageUrl}" alt="${name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h4 class="product-name" onclick="window.location.href='/product.html?id=${id}'" style="cursor:pointer;" title="${name}">
                        ${name}
                    </h4>
                    <div class="product-pricing">
                        <div class="price-row">${formattedPrice}</div>
                    </div>
                </div>
            </article>
        `;
    }

    setupGlowEffect() {
        const card = this.querySelector('.product-card');
        if (!card) return;

        // Spotlight Follower logic locally on each card
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--glow-x', `${x}px`);
            card.style.setProperty('--glow-y', `${y}px`);
            card.style.setProperty('--glow-intensity', '1');
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--glow-intensity', '0');
        });
    }
}

customElements.define('product-card', ProductCard);
