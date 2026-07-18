document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập (Nếu chưa đăng nhập, đá về auth.html)
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    // Thiết lập hàm fetch riêng cho Customer có gắn Auth Bearer Token
    async function authFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401 || res.status === 403) {
            // Token hết hạn hoặc không hợp lệ -> Logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth.html';
        }
        return res.json();
    }

    // 2. Logic Tab Menu Sidebar
    const menuItems = document.querySelectorAll('.sidebar-item[data-target]');
    const sections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        });
    });

    // 3. Logic Đăng xuất
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
    });

    // ==========================================
    // DATA FETCHING & RENDER
    // ==========================================

    // Format tiền tệ VNĐ
    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    try {
        // TẢI THÔNG TIN HỒ SƠ
        const profileData = await authFetch('/api/customer/profile');
        if (profileData && profileData.id) {
            document.getElementById('display-phone').textContent = profileData.phone;
            document.getElementById('display-role').textContent = profileData.role === 'customer' ? 'Khách hàng' : 'Nhân viên';
            
            // Đổ dữ liệu vào form
            document.getElementById('hoTen').value = profileData.hoTen || '';
            document.getElementById('cccd').value = profileData.cccd || '';
            document.getElementById('diaChi').value = profileData.diaChi || '';
            document.getElementById('tenNganHang').value = profileData.tenNganHang || '';
            document.getElementById('soTaiKhoan').value = profileData.soTaiKhoan || '';
        }

        // TẢI THÔNG TIN VÍ (Tùy chọn: Chạy mượt dù API chưa code xong)
        try {
            const walletData = await authFetch('/api/customer/wallet');
            document.getElementById('wallet-balance').textContent = formatCurrency(walletData.balance || 0);
            
            const txnList = document.getElementById('txn-list');
            if (walletData.transactions && walletData.transactions.length > 0) {
                txnList.innerHTML = walletData.transactions.map(txn => `
                    <tr>
                        <td>${new Date(txn.created_at).toLocaleDateString('vi-VN')}</td>
                        <td class="txn-type ${txn.type.toLowerCase()}">${txn.type === 'DEPOSIT' ? '+ Nạp tiền' : '- Rút tiền'}</td>
                        <td>${formatCurrency(txn.amount)}</td>
                        <td><span class="badge" style="background:var(--bg-secondary); color:var(--text-secondary)">${txn.status}</span></td>
                    </tr>
                `).join('');
            } else {
                txnList.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary)">Chưa có giao dịch nào</td></tr>`;
            }
        } catch (e) {
            console.log("API Ví có thể chưa sẵn sàng, bỏ qua lỗi hiển thị.");
        }

    } catch (error) {
        console.error("Lỗi tải trang cá nhân:", error);
    }

    // ==========================================
    // ACTION: CẬP NHẬT HỒ SƠ
    // ==========================================
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.textContent = 'Đang lưu...';
        
        const updateData = {
            hoTen: document.getElementById('hoTen').value,
            cccd: document.getElementById('cccd').value,
            diaChi: document.getElementById('diaChi').value,
            tenNganHang: document.getElementById('tenNganHang').value,
            soTaiKhoan: document.getElementById('soTaiKhoan').value
        };

        try {
            const res = await authFetch('/api/customer/profile', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            alert(res.message || "Đã lưu thông tin thành công!");
        } catch (err) {
            alert("Lỗi khi lưu thông tin!");
        } finally {
            btn.textContent = 'Lưu thông tin';
        }
    });
});