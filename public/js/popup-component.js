// popup-component.js — Standalone notification banner overlay
window.showStatusPopup = function(success, message, redirectToCart = false) {
    const existing = document.getElementById('custom-status-popup');
    if (existing) existing.remove();

    const popupHtml = `
        <div id="custom-status-popup" style="
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translate(-50%, -20px);
            width: 90%;
            max-width: 900px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid #e5e5e7;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 99999;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ">
            <div style="display: flex; align-items: center; gap: 16px;">
                ${success 
                    ? `<i class="fa-regular fa-circle-check" style="font-size: 26px; color: #0071e3;"></i>`
                    : `<i class="fa-regular fa-circle-xmark" style="font-size: 26px; color: #ff453a;"></i>`
                }
                <span style="font-size: 15px; font-weight: 500; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${message}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                ${redirectToCart 
                    ? `<button onclick="window.location.href='/cart.html'" style="
                        background-color: #0071e3;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 8px 20px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                       ">Giỏ hàng</button>`
                    : ''
                }
                <button onclick="document.getElementById('custom-status-popup').remove()" style="
                    background-color: transparent;
                    color: #8e8e93;
                    border: none;
                    font-size: 22px;
                    cursor: pointer;
                    padding: 0 4px;
                    line-height: 1;
                ">&times;</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);
    const popup = document.getElementById('custom-status-popup');
    
    // Trigger transition
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, 0)';
    }, 10);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        const currentPopup = document.getElementById('custom-status-popup');
        if (currentPopup) {
            currentPopup.style.opacity = '0';
            currentPopup.style.transform = 'translate(-50%, -20px)';
            setTimeout(() => currentPopup.remove(), 300);
        }
    }, 6000);
};
