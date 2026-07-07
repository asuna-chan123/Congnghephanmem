/* ============================================================
   Bento Grid Layout Component
   ============================================================ */

class BentoGrid extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupSpotlight();
    }

    render() {
        this.innerHTML = `
            <div class="bento-grid bento-section">
                <!-- Laptop -->
                <div class="bento-item wide bento-item--text-autohide bento-item--border-glow reveal" data-link="/products.html?category=laptop">
                    <img src="https://www.apple.com/v/home/images/macbook-air-m5/a/hero_macbook_air_m5__eb1idggd120y_large.jpg?w=800&auto=format&fit=crop" alt="Laptop" loading="lazy">
                    <div class="bento-info">
                        <h3>Laptop</h3>
                        <p>Power your workflow.</p>
                    </div>
                </div>
                <!-- SkyPods Max -->
                <div class="bento-item tall bento-item--text-autohide bento-item--border-glow reveal" data-link="/products.html">
                    <img src="https://www.apple.com/v/airpods/ae/images/overview/consider/card_noise_cancellation__bcl69t06noci_large_2x.jpg?w=800&auto=format&fit=crop" alt="SkyPods Max" loading="lazy">
                    <div class="bento-info">
                        <h3>SkyPods Max</h3>
                        <p>Elevate your audio experience.</p>
                    </div>
                </div>
                <!-- Tablet -->
                <div class="bento-item bento-item--text-autohide bento-item--border-glow reveal" data-link="/products.html">
                    <img src="https://www.apple.com/v/home/images/ipad-air-m4/a/hero_ipad_air_m4__gc1zddfs5tiu_large.jpg?w=800&auto=format&fit=crop" alt="Tablet" loading="lazy">
                    <div class="bento-info">
                        <h3>Tablet</h3>
                        <p>Creativity on the go.</p>
                    </div>
                </div>
                <!-- Camera -->
                <div class="bento-item bento-item--text-autohide bento-item--border-glow reveal" data-link="/products.html?category=may-anh">
                    <img src="https://www.apple.com/v/home/images/iphone-family/a/hero_iphone_family__be5jkzxszb1e_large.jpg?w=800&auto=format&fit=crop" alt="Camera" loading="lazy">
                    <div class="bento-info">
                        <h3>Camera</h3>
                        <p>Cinema quality gear.</p>
                    </div>
                </div>
            </div>
        `;

        // Add redirection to items
        this.querySelectorAll('.bento-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = item.getAttribute('data-link');
            });
        });
    }

    setupSpotlight() {
        const bentoGrid = this.querySelector('.bento-grid');
        if (!bentoGrid || !window.gsap) return;

        let spotlight = document.querySelector('.global-spotlight');
        if (!spotlight) {
            spotlight = document.createElement('div');
            spotlight.className = 'global-spotlight';
            spotlight.style.cssText = `
                position: fixed;
                width: 600px;
                height: 600px;
                border-radius: 50%;
                pointer-events: none;
                background: radial-gradient(circle,
                    rgba(0, 102, 204, 0.15) 0%,
                    rgba(0, 102, 204, 0.08) 15%,
                    rgba(0, 102, 204, 0.04) 25%,
                    rgba(0, 102, 204, 0.02) 40%,
                    rgba(0, 102, 204, 0.01) 65%,
                    transparent 70%
                );
                z-index: 200;
                opacity: 0;
                transform: translate(-50%, -50%);
                mix-blend-mode: screen;
            `;
            document.body.appendChild(spotlight);
        }

        const handleMouseMove = (e) => {
            const rect = bentoGrid.getBoundingClientRect();
            const mouseInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
            const items = bentoGrid.querySelectorAll('.bento-item');

            if (!mouseInside) {
                gsap.to(spotlight, { opacity: 0, duration: 0.3 });
                items.forEach(card => {
                    card.style.setProperty('--glow-intensity', '0');
                });
                return;
            }

            const radius = 300;
            const proximity = radius * 0.5;
            const fadeDistance = radius * 0.75;
            let minDistance = Infinity;

            items.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const centerX = cardRect.left + cardRect.width / 2;
                const centerY = cardRect.top + cardRect.height / 2;
                const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
                const effectiveDistance = Math.max(0, distance);

                minDistance = Math.min(minDistance, effectiveDistance);

                let glowIntensity = 0;
                if (effectiveDistance <= proximity) {
                    glowIntensity = 1;
                } else if (effectiveDistance <= fadeDistance) {
                    glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
                }

                const relX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
                const relY = ((e.clientY - cardRect.top) / cardRect.height) * 100;
                card.style.setProperty('--glow-x', `${relX}%`);
                card.style.setProperty('--glow-y', `${relY}%`);
                card.style.setProperty('--glow-intensity', glowIntensity.toString());
                card.style.setProperty('--glow-radius', `${radius}px`);
            });

            gsap.to(spotlight, {
                left: e.clientX,
                top: e.clientY,
                duration: 0.1,
                ease: 'power2.out'
            });

            const targetOpacity = minDistance <= proximity
                ? 0.8
                : minDistance <= fadeDistance
                    ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
                    : 0;

            gsap.to(spotlight, {
                opacity: targetOpacity,
                duration: targetOpacity > 0 ? 0.2 : 0.5,
                ease: 'power2.out'
            });
        };

        const handleMouseLeave = () => {
            bentoGrid.querySelectorAll('.bento-item').forEach(card => {
                card.style.setProperty('--glow-intensity', '0');
            });
            gsap.to(spotlight, { opacity: 0, duration: 0.3 });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
    }
}

customElements.define('bento-grid', BentoGrid);
