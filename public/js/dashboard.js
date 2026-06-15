// public/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации через Storage
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Элементы
    const greetingSpan = document.getElementById('greeting');
    const avatarDiv = document.getElementById('avatar');
    let situationsGrid = document.getElementById('situationsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const fabCreate = document.getElementById('fabCreate');
    const cardMenuOverlay = document.getElementById('cardMenuOverlay');
    const cardMenuSheet = document.getElementById('cardMenuSheet');
    const editSituationBtn = document.getElementById('editSituationBtn');
    const deleteSituationBtn = document.getElementById('deleteSituationBtn');

    let currentSituations = [];
    let currentFilter = 'all';
    let selectedCardId = null;

    // Приветствие и аватар
    if (greetingSpan) greetingSpan.textContent = `Здравствуй, ${currentUser}`;
    
    if (avatarDiv) {
        const savedPhoto = Storage.getAvatar();
        if (savedPhoto) {
            avatarDiv.textContent = '';
            avatarDiv.style.backgroundImage = `url(${savedPhoto})`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
            avatarDiv.style.backgroundRepeat = 'no-repeat';
        } else {
            avatarDiv.style.backgroundImage = 'none';
            const initials = currentUser.substring(0, 2).toUpperCase();
            avatarDiv.textContent = initials;
        }
    }

    // ========== ИСПРАВЛЕНО: Переход на profile.html ==========
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    // Загрузка ситуаций через Storage
    function loadSituations() {
        const situations = Storage.getSituations();
        if (situations && situations.length > 0) {
            currentSituations = situations;
        } else {
            // Демо-данные для первого входа
            currentSituations = [
                {
                    id: '1',
                    title: 'Паника в метро',
                    category: 'critical',
                    steps: [
                        { type: 'grounding', data: null },
                        { type: 'breathing', data: { pattern: 'square' } }
                    ]
                },
                {
                    id: '2',
                    title: 'Тревога перед звонком',
                    category: 'hard',
                    steps: [
                        { type: 'anchor', data: { text: 'Я справлюсь, это просто разговор' } }
                    ]
                }
            ];
            currentSituations.forEach(sit => {
                Storage.addSituation(sit);
            });
        }
        renderSituations();
    }

    // Фильтрация
    function getFilteredSituations() {
        if (currentFilter === 'all') return currentSituations;
        return currentSituations.filter(s => s.category === currentFilter);
    }

    // Рендер карточек
    function renderSituations() {
        if (!situationsGrid) return;
        
        const filtered = getFilteredSituations();
        
        situationsGrid.innerHTML = '';

        // Сначала карточки ситуаций
        filtered.forEach(sit => {
            const card = document.createElement('div');
            card.className = 'situation-card fade-in';
            card.dataset.id = sit.id;

            let categoryLabel = '';
            if (sit.category === 'critical') categoryLabel = 'critical';
            else if (sit.category === 'hard') categoryLabel = 'hard';
            else categoryLabel = 'discomfort';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="situation-title">${escapeHtml(sit.title)}</h3>
                    <div class="category-badge ${categoryLabel}"></div>
                </div>
                <div class="card-footer">
                    <button class="run-btn" data-id="${sit.id}">Запустить</button>
                    <button class="menu-btn" data-id="${sit.id}" aria-label="Меню">
                        <span class="menu-dots">•••</span>
                    </button>
                </div>
            `;
            situationsGrid.appendChild(card);
        });

        // "Создать новую"
        const addCard = document.createElement('div');
        addCard.className = 'situation-card add-card fade-in';
        addCard.innerHTML = `
            <span>+</span>
            <span>Создать новую</span>
        `;
        addCard.addEventListener('click', () => {
            window.location.href = 'create-edit.html';
        });
        situationsGrid.appendChild(addCard);

        // Анимация появления
        const newFaders = situationsGrid.querySelectorAll('.fade-in');
        newFaders.forEach(el => {
            el.classList.add('visible');
        });

        // ========== ИСПРАВЛЕНО: Запуск сессии ==========
        situationsGrid.querySelectorAll('.run-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                if (id) {
                    window.location.href = `session.html?id=${id}`;
                }
            });
        });

        situationsGrid.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                selectedCardId = id;
                openCardMenu();
            });
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function openCardMenu() {
        if (cardMenuOverlay && cardMenuSheet) {
            cardMenuOverlay.classList.add('active');
            setTimeout(() => cardMenuSheet.classList.add('active'), 10);
        }
    }

    function closeCardMenu() {
        if (cardMenuOverlay && cardMenuSheet) {
            cardMenuSheet.classList.remove('active');
            setTimeout(() => {
                cardMenuOverlay.classList.remove('active');
                selectedCardId = null;
            }, 300);
        } else {
            selectedCardId = null;
        }
    }

    // ========== ИСПРАВЛЕНО: Редактирование ==========
    if (editSituationBtn) {
        editSituationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (selectedCardId) {
                window.location.href = `create-edit.html?id=${selectedCardId}`;
            }
            closeCardMenu();
        });
    }

    if (deleteSituationBtn) {
        deleteSituationBtn.addEventListener('click', () => {
            if (selectedCardId) {
                const cardIdToDelete = selectedCardId;
                closeCardMenu();
                
                showConfirm('Вы уверены, что хотите удалить эту ситуацию помощи?', () => {
                    Storage.deleteSituation(cardIdToDelete);
                    currentSituations = Storage.getSituations();
                    renderSituations();
                    showToast('Ситуация успешно удалена', 'success');
                });
            }
        });
    }

    // Закрытие модалки по оверлею
    if (cardMenuOverlay) {
        cardMenuOverlay.addEventListener('click', (e) => {
            if (e.target === cardMenuOverlay) closeCardMenu();
        });
    }

    // Фильтры
    if (filterBtns && filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderSituations();
            });
        });
    }

    // Плавающая кнопка создания
    if (fabCreate) {
        fabCreate.addEventListener('click', () => {
            window.location.href = 'create-edit.html';
        });
    }

    // Инициализация
    loadSituations();
});