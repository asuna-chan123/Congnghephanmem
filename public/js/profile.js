/* ============================================================
   Profile JS logic
   Handling fetching user info, uploading and camera capturing CCCD
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check login status
    const currentUserJson = localStorage.getItem('currentUser');
    if (!currentUserJson) {
        alert('Vui lòng đăng nhập để xem thông tin hồ sơ.');
        window.location.href = '/';
        return;
    }

    const currentUser = JSON.parse(currentUserJson);

    // 2. State
    let cccdFrontData = null;
    let cccdBackData = null;
    let activeCameraSide = null;
    let webcamStream = null;

    // Elements
    const profileForm = document.getElementById('profile-form');
    const emailInput = document.getElementById('profile-email');
    const fullNameInput = document.getElementById('profile-fullName');
    const phoneNumberInput = document.getElementById('profile-phoneNumber');
    const addressInput = document.getElementById('profile-address');
    const identityNumberInput = document.getElementById('profile-identityNumber');
    const bankNameInput = document.getElementById('profile-bankName');
    const bankAccountNumberInput = document.getElementById('profile-bankAccountNumber');

    const frontPreview = document.getElementById('cccd-front-preview');
    const frontPlaceholder = document.getElementById('cccd-front-placeholder');
    const frontCard = document.getElementById('cccd-front-card');

    const backPreview = document.getElementById('cccd-back-preview');
    const backPlaceholder = document.getElementById('cccd-back-placeholder');
    const backCard = document.getElementById('cccd-back-card');

    const cameraModal = document.getElementById('camera-modal');
    const cameraVideo = document.getElementById('webcam-video');
    const cameraCanvas = document.getElementById('webcam-canvas');
    const cameraModalTitle = document.getElementById('camera-modal-title');

    // Lock elements
    const lockCard = document.getElementById('profile-lock-card');
    const lockForm = document.getElementById('lock-form');
    const lockPasswordInput = document.getElementById('lock-password');
    const mainGrid = document.getElementById('profile-main-grid');

    // 3. Load Profile
    async function loadProfile() {
        try {
            const res = await apiFetch('/api/auth/profile');
            if (res.success && res.user) {
                const user = res.user;
                emailInput.value = user.email || '';
                fullNameInput.value = user.fullName || '';
                phoneNumberInput.value = user.phoneNumber || '';
                addressInput.value = user.address || '';
                identityNumberInput.value = user.identityNumber || '';
                bankNameInput.value = user.bankName || '';
                bankAccountNumberInput.value = user.bankAccountNumber || '';

                if (user.identityImageFront) {
                    cccdFrontData = user.identityImageFront;
                    frontPreview.src = user.identityImageFront;
                    frontPreview.style.display = 'block';
                    frontPlaceholder.style.display = 'none';
                    frontCard.classList.add('has-image');
                }

                if (user.identityImageBack) {
                    cccdBackData = user.identityImageBack;
                    backPreview.src = user.identityImageBack;
                    backPreview.style.display = 'block';
                    backPlaceholder.style.display = 'none';
                    backCard.classList.add('has-image');
                }
            } else {
                console.error('Failed to fetch profile:', res.message);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Initialize Lock Screen Form
    lockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = lockPasswordInput.value;
        if (!password) return;

        try {
            const res = await apiFetch('/api/auth/verify-password', {
                method: 'POST',
                body: JSON.stringify({ password })
            });

            if (res.success) {
                lockCard.style.display = 'none';
                mainGrid.style.display = 'grid';
                loadProfile();
            } else {
                alert(res.message || 'Mật khẩu không chính xác.');
                lockPasswordInput.value = '';
            }
        } catch (error) {
            console.error('Verify password error:', error);
            alert('Có lỗi xảy ra trong quá trình xác minh.');
        }
    });

    // 4. File upload handlers
    window.triggerFileInput = function(side) {
        const fileInput = document.getElementById(`${side}-file-input`);
        if (fileInput) {
            fileInput.click();
        }
    };

    window.handleFileChange = function(event, side) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Str = e.target.result;
            updateCCCDPreview(side, base64Str);
        };
        reader.readAsDataURL(file);
    };

    function updateCCCDPreview(side, imageData) {
        if (side === 'front') {
            cccdFrontData = imageData;
            frontPreview.src = imageData;
            frontPreview.style.display = 'block';
            frontPlaceholder.style.display = 'none';
            frontCard.classList.add('has-image');
        } else {
            cccdBackData = imageData;
            backPreview.src = imageData;
            backPreview.style.display = 'block';
            backPlaceholder.style.display = 'none';
            backCard.classList.add('has-image');
        }
    }

    // 5. Camera capture handlers
    window.openCamera = async function(side) {
        activeCameraSide = side;
        cameraModalTitle.innerText = `Chụp ảnh ${side === 'front' ? 'Mặt trước' : 'Mặt sau'} CCCD`;
        cameraModal.style.display = 'flex';

        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // prefer back camera on phones
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraVideo.srcObject = webcamStream;
        } catch (error) {
            console.error('Không thể mở camera:', error);
            // Fallback for laptops/desktops or blocked permissions
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
                cameraVideo.srcObject = webcamStream;
            } catch (err) {
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị hoặc sử dụng tính năng tải lên tệp.');
                closeCamera();
            }
        }
    };

    window.closeCamera = function() {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }
        cameraVideo.srcObject = null;
        cameraModal.style.display = 'none';
    };

    window.capturePhoto = function() {
        if (!webcamStream) return;

        // Draw current frame to canvas
        const width = cameraVideo.videoWidth || 640;
        const height = cameraVideo.videoHeight || 360;
        cameraCanvas.width = width;
        cameraCanvas.height = height;

        const context = cameraCanvas.getContext('2d');
        // Mirror effect fix: if video is mirrored we might want to mirror it back, but usually back camera isn't mirrored.
        context.drawImage(cameraVideo, 0, 0, width, height);

        // Convert canvas to base64 jpeg
        const dataUrl = cameraCanvas.toDataURL('image/jpeg', 0.9);
        updateCCCDPreview(activeCameraSide, dataUrl);
        closeCamera();
    };

    // 6. Submit profile changes
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            fullName: fullNameInput.value.trim(),
            phoneNumber: phoneNumberInput.value.trim(),
            address: addressInput.value.trim(),
            identityNumber: identityNumberInput.value.trim(),
            identityImageFront: cccdFrontData,
            identityImageBack: cccdBackData,
            bankName: bankNameInput.value.trim(),
            bankAccountNumber: bankAccountNumberInput.value.trim()
        };

        try {
            const res = await apiFetch('/api/auth/profile', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                alert('Cập nhật hồ sơ thành công!');
                // Update local storage user details
                const localUser = JSON.parse(localStorage.getItem('currentUser'));
                if (localUser) {
                    localUser.fullName = payload.fullName;
                    localStorage.setItem('currentUser', JSON.stringify(localUser));
                }
                
                // Refresh custom header name
                const customHeader = document.querySelector('custom-header');
                if (customHeader) {
                    customHeader.render();
                }
                
                // Reload profile page to get fresh path URLs from DB instead of base64 preview
                loadProfile();
            } else {
                alert(`Cập nhật thất bại: ${res.message}`);
            }
        } catch (error) {
            console.error('Submit profile error:', error);
            alert('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
        }
    });
});
