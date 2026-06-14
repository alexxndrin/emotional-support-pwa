document.addEventListener('DOMContentLoaded', () => {

    // 1. ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return; // прерываем дальнейшее выполнение скрипта
    }

    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.1, 
        rootMargin: "0px 0px -50px 0px" 
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });


    //  ЛОГИКА ДЛЯ РАБОТЫ МОДАЛКИ 
    const openAuthBtn = document.getElementById('openAuthBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const authModal = document.getElementById('authModal');
    
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const toRegisterBtn = document.getElementById('toRegister');
    const toLoginBtn = document.getElementById('toLogin');

    // Открытие bottom sheet
    openAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modalOverlay.classList.add('active');
        setTimeout(() => authModal.classList.add('active'), 10);
    });

    // Закрытие при клике на свободную область, оверлей
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            authModal.classList.remove('active');
            setTimeout(() => modalOverlay.classList.remove('active'), 300);
        }
    });

    // вход -> регистрация
    toRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    });

    // регистрация -> вход
    toLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });


    // LOCALSTORAGE

    // регистрация нового пользователя
    document.getElementById('btnRegister').addEventListener('click', () => {
        const user = document.getElementById('regUser').value.trim();
        const pass = document.getElementById('regPass').value.trim();

        if (user && pass) {
            // Сохраняем учетную запись локально на устройстве
            localStorage.setItem('localAppUser', JSON.stringify({ user, pass }));
            // текущая активная сессия
            localStorage.setItem('currentUser', user);
            
            // Перенаправление
            window.location.href = 'dashboard.html';
        } else {
            alert('Пожалуйста, придумайте логин и пароль.');
        }
    });

    // Вход под существующими данными
    document.getElementById('btnLogin').addEventListener('click', () => {
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        
        const savedData = localStorage.getItem('localAppUser');
        
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.user === user && parsed.pass === pass) {
                // Если совпало — логиним
                localStorage.setItem('currentUser', user);
                window.location.href = 'dashboard.html';
            } else {
                alert('Неверный логин или пароль.');
            }
        } else {
            alert('Пользователь не найден. Пожалуйста, зарегистрируйтесь.');
        }
    });
});