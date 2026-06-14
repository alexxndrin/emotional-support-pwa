document.addEventListener('DOMContentLoaded', () => {

    // ФУНКЦИЯ УВЕДОМЛЕНИЯ
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3500);
    }

    // 1. ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const currentUser = Storage.getCurrentUser();
    
    if (currentUser && !isDashboard) {
        window.location.href = 'dashboard.html';
        return; 
    }

    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.1, 
        rootMargin: "0px 0px -50px 0px" 
    };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, appearOptions);
    faders.forEach(fader => appearOnScroll.observe(fader));

    // ЛОГИКА ДЛЯ РАБОТЫ МОДАЛКИ
    const openAuthBtn = document.getElementById('openAuthBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const authModal = document.getElementById('authModal');
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const toRegisterBtn = document.getElementById('toRegister');
    const toLoginBtn = document.getElementById('toLogin');

    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalOverlay && authModal) {
                modalOverlay.classList.add('active');
                setTimeout(() => authModal.classList.add('active'), 10);
            }
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay && authModal) {
                authModal.classList.remove('active');
                setTimeout(() => modalOverlay.classList.remove('active'), 300);
            }
        });
    }

    if (toRegisterBtn) {
        toRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginView && registerView) {
                loginView.classList.add('hidden');
                registerView.classList.remove('hidden');
            }
        });
    }

    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerView && loginView) {
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
            }
        });
    }

    // РЕГИСТРАЦИЯ через Storage
    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            const userEl = document.getElementById('regUser');
            const passEl = document.getElementById('regPass');
            if (!userEl || !passEl) return;

            const user = userEl.value.trim();
            const pass = passEl.value.trim();

            if (user && pass) {
                Storage.registerUser(user, pass);
                showToast('Регистрация успешна! Перенаправление...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showToast('Пожалуйста, придумайте логин и пароль.', 'error');
            }
        });
    }

    // ВХОД через Storage
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            const userEl = document.getElementById('loginUser');
            const passEl = document.getElementById('loginPass');
            if (!userEl || !passEl) return;

            const user = userEl.value.trim();
            const pass = passEl.value.trim();
            
            // Получаем сохранённого пользователя из localStorage
            const savedData = localStorage.getItem('localAppUser');
            
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.user === user && parsed.pass === pass) {
                    Storage.loginUser(user);
                    showToast('Успешный вход! Загрузка...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showToast('Неверный логин или пароль.', 'error');
                }
            } else {
                showToast('Пользователь не найден. Пожалуйста, зарегистрируйтесь.', 'error');
            }
        });
    }
});