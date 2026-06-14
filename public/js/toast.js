
// Автоматическое создание контейнера для уведомлений
(function createToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener('DOMContentLoaded', () => document.body.appendChild(container));
        }
    }
})();

// Глобальная функция уведомлений
window.showToast = function(message, type = 'info') {
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
};

// окно подтверждения
window.showConfirm = function(message, onConfirm, confirmText = 'Да') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    
    overlay.innerHTML = `
        <div class="bottom-sheet small-sheet active">
            <div class="modal-drag-handle"></div>
            <p style="margin: 20px 0 25px; font-size: 1rem; font-family: var(--font-body); color: var(--text-color); line-height: 1.5; font-weight: 500; text-align: center;">${message}</p>
            <div style="display: flex; gap: 12px; width: 100%;">
                <button id="confirmNo" class="btn-secondary" style="flex: 1; margin: 0; padding: 12px; border-radius: 40px;">Отмена</button>
                <button id="confirmYes" class="btn-submit" style="flex: 1; margin: 0; padding: 12px; border-radius: 40px; background-color: var(--accent-color); color: white; font-weight: bold; border: none; font-family: var(--font-body); font-size: 0.95rem; cursor: pointer;">${confirmText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.body.style.overflow = 'hidden';

    const sheet = overlay.querySelector('.bottom-sheet');
    setTimeout(() => {
        if (sheet) sheet.classList.add('active');
    }, 10);

    function closeConfirm() {
        if (sheet) sheet.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
    }

    document.getElementById('confirmYes').onclick = () => {
        closeConfirm();
        onConfirm(); // Выполняем переданное действие
    };
    
    document.getElementById('confirmNo').onclick = closeConfirm;
    
    // Закрытие при клике мимо шторки
    overlay.onclick = (e) => {
        if (e.target === overlay) closeConfirm();
    };
};


window.showActionToast = function(message, onConfirm) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast warning';
    
    toast.innerHTML = `
        <div style="margin-bottom: 12px; line-height: 1.4; font-family: sans-serif;">${message}</div>
        <div style="display: flex; gap: 8px; justify-content: center;">
            <button id="actionToastNo" style="background: rgba(255,255,255,0.15); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">Отмена</button>
            <button id="actionToastYes" style="background: white; color: #333; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">Да</button>
        </div>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    function removeToast() {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }

    toast.querySelector('#actionToastYes').onclick = () => {
        removeToast();
        onConfirm();
    };

    toast.querySelector('#actionToastNo').onclick = () => {
        removeToast();
    };
};
