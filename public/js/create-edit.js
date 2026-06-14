document.addEventListener('DOMContentLoaded', () => {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // DOM элементы
    const titleInput = document.getElementById('situationTitle');
    const catBtns = document.querySelectorAll('.cat-btn');
    const stepsListDiv = document.getElementById('stepsList');
    const addStepBtn = document.getElementById('addStepBtn');
    const saveBtn = document.getElementById('saveBtn');
    const backBtn = document.getElementById('backBtn');
    const formTitle = document.getElementById('formTitle');

    // Элементы для звука ситуации
    const situationSoundSelect = document.getElementById('situationSound');
    const customSoundUpload = document.getElementById('customSoundUpload');
    const previewSoundBtn = document.getElementById('previewSoundBtn');
    let customSoundBase64 = null;
    let currentPreviewAudio = null;

    // Модалки
    const stepTypeOverlay = document.getElementById('stepTypeOverlay');
    const stepTypeSheet = document.getElementById('stepTypeSheet');
    const stepEditOverlay = document.getElementById('stepEditOverlay');
    const stepEditSheet = document.getElementById('stepEditSheet');
    const stepEditForm = document.getElementById('stepEditForm');
    const saveStepBtn = document.getElementById('saveStepBtn');
    const cancelStepEdit = document.getElementById('cancelStepEdit');
    const cancelStepType = document.getElementById('cancelStepType');

    // Данные
    let currentSteps = [];
    let selectedCategory = 'critical';
    let editingStepIndex = null;
    let pendingStepType = null;
    let editMode = false;
    let situationId = null;
    let situationBackgroundSound = null;

    // Получение id из URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    if (editId) {
        editMode = true;
        formTitle.textContent = 'Редактирование ситуации';
        loadSituationForEdit(editId);
    } else {
        situationId = Date.now().toString();
    }

    function loadSituationForEdit(id) {
        // Используем Storage.getSituation вместо прямого обращения к localStorage
        const situation = Storage.getSituation(id);
        if (situation) {
            situationId = situation.id;
            titleInput.value = situation.title;
            selectedCategory = situation.category;
            currentSteps = situation.steps ? [...situation.steps] : [];
            situationBackgroundSound = situation.backgroundSound || null;
            updateCategoryUI();
            renderStepsList();
            loadSoundForEdit();
        } else {
            showToast('Ситуация не найдена', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    }

    function loadSoundForEdit() {
        if (!situationBackgroundSound) return;
        
        if (situationBackgroundSound.startsWith('data:audio/')) {
            customSoundBase64 = situationBackgroundSound;
            if (situationSoundSelect) {
                situationSoundSelect.value = 'custom';
                if (customSoundUpload) customSoundUpload.classList.remove('hidden');
                if (previewSoundBtn) previewSoundBtn.classList.remove('hidden');
            }
        } else if (situationSoundSelect) {
            const optionExists = Array.from(situationSoundSelect.options).some(opt => opt.value === situationBackgroundSound);
            if (optionExists) {
                situationSoundSelect.value = situationBackgroundSound;
                if (customSoundUpload) customSoundUpload.classList.add('hidden');
                if (previewSoundBtn) previewSoundBtn.classList.remove('hidden');
            }
        }
    }

    function updateCategoryUI() {
        catBtns.forEach(btn => {
            if (btn.dataset.cat === selectedCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    if (situationSoundSelect) {
        situationSoundSelect.addEventListener('change', (e) => {
            if (currentPreviewAudio) {
                currentPreviewAudio.pause();
                if (previewSoundBtn) previewSoundBtn.textContent = '▶ Слушать';
            }
            
            if (e.target.value === 'custom') {
                if (customSoundUpload) customSoundUpload.classList.remove('hidden');
                if (previewSoundBtn) previewSoundBtn.classList.add('hidden');
            } else {
                if (customSoundUpload) customSoundUpload.classList.add('hidden');
                customSoundBase64 = null;
                if (e.target.value) {
                    if (previewSoundBtn) previewSoundBtn.classList.remove('hidden');
                } else {
                    if (previewSoundBtn) previewSoundBtn.classList.add('hidden');
                }
            }
        });
    }

    if (customSoundUpload) {
        customSoundUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { 
                    showToast('Файл слишком большой. Выберите звук до 2 МБ', 'error');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    customSoundBase64 = ev.target.result;
                    if (previewSoundBtn) previewSoundBtn.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (previewSoundBtn) {
        previewSoundBtn.addEventListener('click', () => {
            if (currentPreviewAudio && !currentPreviewAudio.paused) {
                currentPreviewAudio.pause();
                previewSoundBtn.textContent = '▶ Слушать';
                return;
            }
            let src = null;
            if (situationSoundSelect && situationSoundSelect.value === 'custom') {
                src = customSoundBase64;
            } else if (situationSoundSelect && situationSoundSelect.value) {
                src = situationSoundSelect.value;
            }
            if (src) {
                currentPreviewAudio = new Audio(src);
                currentPreviewAudio.play();
                previewSoundBtn.textContent = '⏸ Пауза';
                currentPreviewAudio.onended = () => {
                    if (previewSoundBtn) previewSoundBtn.textContent = '▶ Слушать';
                };
            }
        });
    }

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCategory = btn.dataset.cat;
            updateCategoryUI();
        });
    });

    function renderStepsList() {
        stepsListDiv.innerHTML = '';
        if (currentSteps.length === 0) {
            stepsListDiv.innerHTML = '<div class="empty-steps">Нет шагов. Нажмите "+ Добавить шаг"</div>';
            return;
        }
        currentSteps.forEach((step, idx) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.innerHTML = `
    <div class="step-info">
        <div class="step-type-name">${getStepTypeName(step.type)}</div>
        <div class="step-preview">${getStepPreview(step)}</div>
    </div>
    <div class="step-actions">
        <button class="edit-step" data-index="${idx}">
            <img src="images/icon-edit.png" class="ui-icon" alt="редактировать">
        </button>
        <button class="delete-step" data-index="${idx}">
            <img src="images/icon-delete.png" class="ui-icon" alt="удалить">
        </button>
    </div>
`;
            stepsListDiv.appendChild(stepDiv);
        });

        document.querySelectorAll('.edit-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                openStepEditModal(index);
            });
        });
        document.querySelectorAll('.delete-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                currentSteps.splice(index, 1);
                renderStepsList();
            });
        });
    }

    function getStepTypeName(type) {
        const names = {
            grounding: 'Заземление 5-4-3-2-1',
            breathing: 'Дыхание',
            anchor: 'Фраза-якорь',
            action: 'Действие в реальности',
            simple: 'Простое задание'
        };
        return names[type] || type;
    }

    function getStepPreview(step) {
        switch (step.type) {
            case 'grounding': return 'Упражнение "5-4-3-2-1" (вижу, слышу, осязаю...)';
            case 'breathing': return `Дыхание: ${step.data.pattern === 'square' ? 'Квадрат' : step.data.pattern === '4-7-8' ? '4-7-8' : 'Треугольник'}`;
            case 'anchor': return `Фраза: "${step.data.text || ''}"`;
            case 'action': return `Действие: ${step.data.text || ''}`;
            case 'simple': return `Задание: ${step.data.text || ''}`;
            default: return '';
        }
    }

    function openStepTypeModal() {
        stepTypeOverlay.classList.add('active');
        setTimeout(() => stepTypeSheet.classList.add('active'), 10);
    }

    function closeStepTypeModal() {
        stepTypeSheet.classList.remove('active');
        setTimeout(() => stepTypeOverlay.classList.remove('active'), 300);
        pendingStepType = null;
    }

    function openStepEditModal(index) {
        editingStepIndex = index;
        const step = currentSteps[index];
        if (!step) return;
        stepEditForm.innerHTML = '';
        const stepEditTitle = document.getElementById('stepEditTitle');
        if (stepEditTitle) stepEditTitle.textContent = `Редактировать: ${getStepTypeName(step.type)}`;

        switch (step.type) {
            case 'grounding':
                stepEditForm.innerHTML = `
                    <div class="step-guide">
                        <h4>Заземление 5-4-3-2-1</h4>
                        <p class="step-desc">Упражнение не требует дополнительных настроек. Пользователь будет отмечать 5 вещей, которые видит вокруг.</p>
                    </div>
                    <p>Заземление не требует дополнительных настроек. Просто сохраните.</p>
                `;
                break;
            case 'breathing':
                stepEditForm.innerHTML = `
                    <div class="step-guide">
                        <h4>Дыхательное упражнение</h4>
                        <p class="step-desc">Выберите паттерн дыхания, который лучше всего подходит для этого состояния.</p>
                    </div>
                    <label>Выберите паттерн дыхания:</label>
                    <select id="breathingPattern">
                        <option value="square" ${step.data.pattern === 'square' ? 'selected' : ''}>Квадрат (вдох-задержка-выдох-задержка)</option>
                        <option value="4-7-8" ${step.data.pattern === '4-7-8' ? 'selected' : ''}>4-7-8 (вдох 4с, задержка 7с, выдох 8с)</option>
                        <option value="triangle" ${step.data.pattern === 'triangle' ? 'selected' : ''}>Треугольник (вдох-выдох-пауза)</option>
                    </select>
                `;
                break;
            case 'anchor':
                stepEditForm.innerHTML = `
                    <div class="step-guide">
                        <h4>Фраза-якорь</h4>
                        <p class="step-desc">Короткая фраза, которая возвращает в реальность. Повторите её про себя или вслух.</p>
                    </div>
                    <label>Ваша фраза:</label>
                    <textarea id="stepText" rows="3" placeholder="Например: 'Я в безопасности, это паника, она скоро пройдет'">${escapeHtml(step.data.text || '')}</textarea>
                `;
                break;
            case 'action':
                stepEditForm.innerHTML = `
                    <div class="step-guide">
                        <h4>Действие в реальности</h4>
                        <p class="step-desc">Физическое действие для сброса телесного напряжения.</p>
                    </div>
                    <label>Какое действие выполнить?</label>
                    <textarea id="stepText" rows="3" placeholder="Например: 'Умойся ледяной водой', 'Сделай 10 глубоких приседаний'">${escapeHtml(step.data.text || '')}</textarea>
                `;
                break;
            case 'simple':
                stepEditForm.innerHTML = `
                    <div class="step-guide">
                        <h4>Простое задание</h4>
                        <p class="step-desc">Когнитивная задача для переключения фокуса внимания.</p>
                    </div>
                    <label>Задача:</label>
                    <textarea id="stepText" rows="3" placeholder="Например: 'Посчитай от 100 до 1, отнимая по 7', 'Вспомни 5 пород собак'">${escapeHtml(step.data.text || '')}</textarea>
                `;
                break;
        }
        stepEditOverlay.classList.add('active');
        setTimeout(() => stepEditSheet.classList.add('active'), 10);
    }

    function closeStepEditModal() {
        stepEditSheet.classList.remove('active');
        setTimeout(() => stepEditOverlay.classList.remove('active'), 300);
        editingStepIndex = null;
    }

    function saveCurrentStepEdit() {
        if (editingStepIndex === null) return;
        const step = currentSteps[editingStepIndex];
        if (!step) return;

        switch (step.type) {
            case 'breathing':
                const pattern = document.getElementById('breathingPattern').value;
                step.data = { pattern };
                break;
            case 'anchor':
            case 'action':
            case 'simple':
                const text = document.getElementById('stepText').value.trim();
                step.data = { text };
                break;
        }
        renderStepsList();
        closeStepEditModal();
    }

    function addStepOfType(type) {
        let newStep = { type, data: null };
        switch (type) {
            case 'grounding':
                newStep.data = {};
                break;
            case 'breathing':
                newStep.data = { pattern: 'square' };
                break;
            case 'anchor':
            case 'action':
            case 'simple':
                newStep.data = { text: '' };
                break;
        }
        currentSteps.push(newStep);
        renderStepsList();
        closeStepTypeModal();
        if (type === 'anchor' || type === 'action' || type === 'simple') {
            openStepEditModal(currentSteps.length - 1);
        }
    }

    function saveSituation() {
        const title = titleInput.value.trim();
        if (!title) {
            showToast('Введите название ситуации', 'error');
            return;
        }
        if (currentSteps.length === 0) {
            showToast('Добавьте хотя бы один шаг помощи', 'error');
            return;
        }

        let backgroundSound = null;
        if (situationSoundSelect) {
            if (situationSoundSelect.value === 'custom') {
                backgroundSound = customSoundBase64;
            } else if (situationSoundSelect.value) {
                backgroundSound = situationSoundSelect.value;
            }
        }

        const newSituation = {
            id: editMode ? editId : situationId,
            title: title,
            category: selectedCategory,
            backgroundSound: backgroundSound,
            steps: currentSteps
        };

        // Используем Storage.updateSituation и Storage.addSituation
        if (editMode) {
            Storage.updateSituation(newSituation);
            showToast('Ситуация обновлена', 'success');
        } else {
            Storage.addSituation(newSituation);
            showToast('Ситуация создана', 'success');
        }
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }

    if (addStepBtn) addStepBtn.addEventListener('click', openStepTypeModal);
    if (saveBtn) saveBtn.addEventListener('click', saveSituation);
    if (backBtn) backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    if (cancelStepType) cancelStepType.addEventListener('click', closeStepTypeModal);
    if (cancelStepEdit) cancelStepEdit.addEventListener('click', closeStepEditModal);
    if (saveStepBtn) saveStepBtn.addEventListener('click', saveCurrentStepEdit);

    document.querySelectorAll('.step-type').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            addStepOfType(type);
        });
    });

    if (stepTypeOverlay) {
        stepTypeOverlay.addEventListener('click', (e) => {
            if (e.target === stepTypeOverlay) closeStepTypeModal();
        });
    }
    if (stepEditOverlay) {
        stepEditOverlay.addEventListener('click', (e) => {
            if (e.target === stepEditOverlay) closeStepEditModal();
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

    if (!editMode) {
        renderStepsList();
        updateCategoryUI();
    }
});