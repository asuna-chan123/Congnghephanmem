document.addEventListener('DOMContentLoaded', async () => {
    async function authFetch(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };
        const res = await fetch(url, { ...options, headers });
        
        // Đọc thẳng text trước để chống lỗi sập hàm khi nhận HTML/Text
        const text = await res.text(); 
        
        try {
            const data = JSON.parse(text); 
            
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = 'auth.html';
            }
            return data;
        } catch (e) {
            console.error("Lỗi từ Server (Không phải JSON):", text);
            throw new Error(text || 'Lỗi phản hồi từ máy chủ');
        }
    }

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

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/';
        });
    }

    let realProfileData = {};
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    // ==========================================
    // TẢI & HIỂN THỊ DỮ LIỆU (Yêu cầu xác thực ngay)
    // ==========================================
    window.executeWithAuth(async () => {
        try {
            // Tải Hồ sơ
            const resProfile = await authFetch('/api/customer/profile');
            if (resProfile.success && resProfile.data) {
                const data = resProfile.data;
                realProfileData = { ...data }; 

                // Hiển thị dữ liệu thật (Không còn che dấu)
                document.getElementById('display-phone').textContent = data.phone || 'Chưa cập nhật';
                document.getElementById('display-role').textContent = data.role === 'customer' ? 'Khách hàng' : 'Nhân viên';
                
                document.getElementById('hoTen').value = data.hoTen || '';
                document.getElementById('cccd').value = data.cccd || '';
                document.getElementById('diaChi').value = data.diaChi || '';
                document.getElementById('tenNganHang').value = data.tenNganHang || '';
                document.getElementById('soTaiKhoan').value = data.soTaiKhoan || '';
                
                if(data.cccdTruoc) {
                    document.getElementById('preview-cccd-truoc').src = data.cccdTruoc;
                }
                if(data.cccdSau) {
                    document.getElementById('preview-cccd-sau').src = data.cccdSau;
                }
            }

            // ==========================================
            // TẢI THÔNG TIN VÍ (TỪ API THẬT)
            // ==========================================
            try {
                // Giả định bạn gắn router này tại url: /api/payment
                const walletRes = await authFetch('/api/payment/info');
                
                if (walletRes.success && walletRes.data) {
                    const walletData = walletRes.data;
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
                }
            } catch (e) {
                console.log("Lỗi tải thông tin Ví:", e);
            }
        } catch (error) {
            console.error("Lỗi tải trang cá nhân:", error);
        }
    });

    // ==========================================
    // ACTION: SỬA & LƯU HỒ SƠ
    // ==========================================
    const formInputs = document.querySelectorAll('#profile-form .auth-input');
    const btnEdit = document.getElementById('btn-edit-profile');
    const btnSave = document.getElementById('btn-save-profile');
    const btnCancel = document.getElementById('btn-cancel-edit');
    
    const inputTruoc = document.getElementById('file-cccd-truoc');
    const inputSau = document.getElementById('file-cccd-sau');
    const labelTruoc = document.getElementById('label-cccd-truoc');
    const labelSau = document.getElementById('label-cccd-sau');

    if(inputTruoc) {
        inputTruoc.addEventListener('change', async (e) => {
            if(e.target.files[0]) {
                const img = document.getElementById('preview-cccd-truoc');
                img.src = await toBase64(e.target.files[0]);
                img.style.filter = 'none';
            }
        });
    }
    if(inputSau) {
        inputSau.addEventListener('change', async (e) => {
            if(e.target.files[0]) {
                const img = document.getElementById('preview-cccd-sau');
                img.src = await toBase64(e.target.files[0]);
                img.style.filter = 'none';
            }
        });
    }

    if(btnEdit) {
        // Nút sửa thông tin giờ sẽ luôn hiện từ đầu do HTML bạn set ban đầu
        btnEdit.style.display = 'inline-block';
        
        btnEdit.addEventListener('click', () => {
            formInputs.forEach(input => input.removeAttribute('disabled'));
            if(labelTruoc) labelTruoc.style.display = 'inline-block';
            if(labelSau) labelSau.style.display = 'inline-block';
            
            btnEdit.style.display = 'none';
            btnSave.style.display = 'inline-block';
            btnCancel.style.display = 'inline-block';
            document.getElementById('hoTen').focus();
        });
    }

    if(btnCancel) {
        btnCancel.addEventListener('click', () => {
            document.getElementById('hoTen').value = realProfileData.hoTen || '';
            document.getElementById('cccd').value = realProfileData.cccd || '';
            document.getElementById('diaChi').value = realProfileData.diaChi || '';
            document.getElementById('tenNganHang').value = realProfileData.tenNganHang || '';
            document.getElementById('soTaiKhoan').value = realProfileData.soTaiKhoan || '';
            
            if(realProfileData.cccdTruoc) document.getElementById('preview-cccd-truoc').src = realProfileData.cccdTruoc;
            if(realProfileData.cccdSau) document.getElementById('preview-cccd-sau').src = realProfileData.cccdSau;

            formInputs.forEach(input => input.setAttribute('disabled', 'true'));
            if(labelTruoc) labelTruoc.style.display = 'none';
            if(labelSau) labelSau.style.display = 'none';

            btnEdit.style.display = 'inline-block';
            btnSave.style.display = 'none';
            btnCancel.style.display = 'none';
        });
    }

    const profileForm = document.getElementById('profile-form');
    if(profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSave.textContent = 'Đang lưu...';
            btnSave.disabled = true;
            
            try {
                let cccdTruoc = realProfileData.cccdTruoc;
                let cccdSau = realProfileData.cccdSau;
                
                if(inputTruoc.files[0]) cccdTruoc = await toBase64(inputTruoc.files[0]);
                if(inputSau.files[0]) cccdSau = await toBase64(inputSau.files[0]);

                const updateData = {
                    hoTen: document.getElementById('hoTen').value,
                    cccd: document.getElementById('cccd').value,
                    diaChi: document.getElementById('diaChi').value,
                    tenNganHang: document.getElementById('tenNganHang').value,
                    soTaiKhoan: document.getElementById('soTaiKhoan').value,
                    cccdTruoc: cccdTruoc,
                    cccdSau: cccdSau
                };

                const res = await authFetch('/api/customer/profile', {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });

                if(res.success) {
                    if(typeof window.showStatusPopup === 'function') {
                        window.showStatusPopup(true, 'Cập nhật hồ sơ thành công!');
                    }
                    realProfileData = { ...updateData }; 
                    
                    formInputs.forEach(input => input.setAttribute('disabled', 'true'));
                    if(labelTruoc) labelTruoc.style.display = 'none';
                    if(labelSau) labelSau.style.display = 'none';
                    btnEdit.style.display = 'inline-block';
                    btnSave.style.display = 'none';
                    btnCancel.style.display = 'none';
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (err) {
                alert("Lỗi khi kết nối đến máy chủ!");
            } finally {
                btnSave.textContent = 'Lưu thông tin';
                btnSave.disabled = false;
            }
        });
    }

    // ==========================================
    // DEMO: LOGIC POPUP NẠP TIỀN TẠM THỜI (Giữ nguyên)
    // ==========================================
    const topupModal = document.getElementById('topup-modal');
    const topupBtn = document.getElementById('topup-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const confirmTopupBtn = document.getElementById('confirm-topup-btn');
    const customAmountInput = document.getElementById('custom-amount-input');
    const presetButtons = document.querySelectorAll('.preset-btn');

    let currentLocalBalance = 0;

    if(topupBtn) {
        topupBtn.addEventListener('click', () => {
            topupModal.style.display = 'flex';
            customAmountInput.value = ''; 
            presetButtons.forEach(b => b.style.borderColor = 'var(--border)'); 
        });
    }

    const closeModal = () => {
        if(topupModal) topupModal.style.display = 'none';
    };
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(topupModal) {
        topupModal.addEventListener('click', (e) => {
            if (e.target === topupModal) closeModal();
        });
    }

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => {
                b.style.borderColor = 'var(--border)';
                b.style.background = 'var(--bg-secondary)';
            });
            btn.style.borderColor = 'var(--accent)';
            btn.style.background = 'var(--accent-light, rgba(0,0,0,0.05))';
            customAmountInput.value = btn.getAttribute('data-value');
        });
    });

    if(customAmountInput) {
        customAmountInput.addEventListener('input', () => {
            presetButtons.forEach(b => {
                b.style.borderColor = 'var(--border)';
                b.style.background = 'var(--bg-secondary)';
            });
        });
    }

    if(confirmTopupBtn) {
        confirmTopupBtn.addEventListener('click', async () => {
            const amountToAdd = parseFloat(customAmountInput.value);
            if (!amountToAdd || amountToAdd <= 0) {
                alert('Vui lòng chọn hoặc nhập số tiền hợp lệ!');
                return;
            }

            confirmTopupBtn.disabled = true;
            confirmTopupBtn.textContent = 'Đang xử lý...';

            try {
                const res = await authFetch('/api/payment/deposit', {
                    method: 'POST',
                    body: JSON.stringify({ amount: amountToAdd })
                });

                if (res.success) {
                    alert('Nạp tiền thành công!');
                    closeModal();
                    window.location.reload();
                } else {
                    alert('Lỗi nạp tiền: ' + res.message);
                }
            } catch (err) {
                alert('Lỗi khi kết nối đến máy chủ thanh toán!');
            } finally {
                confirmTopupBtn.disabled = false;
                confirmTopupBtn.textContent = 'Xác nhận nạp';
            }
        });
    }

    // ==========================================
    // ACTION: SỬA & LƯU TÀI KHOẢN NGÂN HÀNG (Tab Ví)
    // ==========================================
    const bankInputs = document.querySelectorAll('.bank-input');
    const btnEditBank = document.getElementById('btn-edit-bank');
    const btnSaveBank = document.getElementById('btn-save-bank');
    const btnCancelBank = document.getElementById('btn-cancel-bank');
    const bankForm = document.getElementById('bank-form');

    if(btnEditBank) {
        btnEditBank.addEventListener('click', () => {
            bankInputs.forEach(input => input.removeAttribute('disabled'));
            btnEditBank.style.display = 'none';
            btnSaveBank.style.display = 'inline-block';
            btnCancelBank.style.display = 'inline-block';
            document.getElementById('tenNganHang').focus();
        });
    }

    if(btnCancelBank) {
        btnCancelBank.addEventListener('click', () => {
            // Hoàn tác lại dữ liệu cũ nếu bấm hủy
            document.getElementById('tenNganHang').value = realProfileData.tenNganHang || '';
            document.getElementById('soTaiKhoan').value = realProfileData.soTaiKhoan || '';
            
            bankInputs.forEach(input => input.setAttribute('disabled', 'true'));
            btnEditBank.style.display = 'inline-block';
            btnSaveBank.style.display = 'none';
            btnCancelBank.style.display = 'none';
        });
    }

    if(bankForm) {
        bankForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSaveBank.textContent = 'Đang lưu...';
            btnSaveBank.disabled = true;
            
            try {
                // Phải gửi kèm dữ liệu cũ của profile để Database không cập nhật đè thành giá trị Rỗng (NULL)
                const updateData = {
                    hoTen: document.getElementById('hoTen').value,
                    cccd: document.getElementById('cccd').value,
                    diaChi: document.getElementById('diaChi').value,
                    tenNganHang: document.getElementById('tenNganHang').value,
                    soTaiKhoan: document.getElementById('soTaiKhoan').value,
                    cccdTruoc: realProfileData.cccdTruoc, 
                    cccdSau: realProfileData.cccdSau
                };

                const res = await authFetch('/api/customer/profile', {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });

                if(res.success) {
                    if(typeof window.showStatusPopup === 'function') {
                        window.showStatusPopup(true, 'Cập nhật ngân hàng thành công!');
                    }
                    realProfileData = { ...updateData }; 
                    bankInputs.forEach(input => input.setAttribute('disabled', 'true'));
                    
                    btnEditBank.style.display = 'inline-block';
                    btnSaveBank.style.display = 'none';
                    btnCancelBank.style.display = 'none';
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (err) {
                alert("Lỗi kết nối đến máy chủ!");
            } finally {
                btnSaveBank.textContent = 'Lưu tài khoản';
                btnSaveBank.disabled = false;
            }
        });
    }
});