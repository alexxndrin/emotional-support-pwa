document.addEventListener('DOMContentLoaded', async () => {
    // 1. Проверка авторизации через единое хранилище Storage
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 2. id ситуации из URL
    const urlParams = new URLSearchParams(window.location.search);
    const situationId = urlParams.get('id');
    if (!situationId) {
        showToast('Ошибка: ситуация не найдена', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return;
    }

    function saveSessionProgress(stepIndex) {
        Storage.setActiveSession(situationId, stepIndex);
    }

    function loadSessionProgress() {
        const session = Storage.getActiveSession();
        return (session && session.situationId === situationId) ? session.currentStepIndex : 0;
    }

    // 3. Загружаем данные ситуации 
    const situation = Storage.getSituation(situationId);
    if (!situation) {
        showToast('Ситуация не найдена', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return;
    }

    //  ФОНОВЫЙ ЗВУК ДЛЯ СИТУАЦИИ 
    let ambientAudio = null;
    if (situation.backgroundSound && situation.backgroundSound !== '') {
        ambientAudio = new Audio(situation.backgroundSound);
        ambientAudio.loop = true;
        ambientAudio.volume = 0.4; 
        
        ambientAudio.play().catch((error) => {
            console.log("Автозапуск заблокирован политикой браузера, активируем резервный запуск по первому тачу.");
            
            const playOnInteraction = () => {
                if (ambientAudio && ambientAudio.paused) {
                    ambientAudio.play()
                        .then(() => {
                            document.removeEventListener('click', playOnInteraction);
                            document.removeEventListener('touchstart', playOnInteraction);
                        })
                        .catch(() => {});
                }
            };

            document.addEventListener('click', playOnInteraction);
            document.addEventListener('touchstart', playOnInteraction);
        });
    }

    const steps = situation.steps;
    if (!steps || steps.length === 0) {
        showToast('В этой ситуации нет шагов помощи', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return;
    }

    // Инициализируем индекс текущего шага с учетом сохраненного прогресса
    let currentStepIndex = loadSessionProgress();
    let totalSteps = steps.length;

    // Состояния выполнения шага
    let groundingDoneCount = 0;
    let breathingInterval = null;
    let breathingActive = false;
    let stepCompleted = false;

    // DOM элементы
    const stepContent = document.getElementById('stepContent');
    const nextBtn = document.getElementById('nextBtn');
    const stepCounterSpan = document.getElementById('stepCounter');
    const progressFill = document.getElementById('progressFill');

    // Полноэкранный режим
    function enterFullscreen() {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        }
    }
    enterFullscreen();

    function updateProgress() {
        const percent = (currentStepIndex / totalSteps) * 100;
        progressFill.style.width = percent + '%';
        stepCounterSpan.textContent = `шаг ${currentStepIndex + 1} из ${totalSteps}`;
    }

    function completeStep() {
        if (currentStepIndex + 1 < totalSteps) {
            currentStepIndex++;
            saveSessionProgress(currentStepIndex); // СОХРАНЯЕМ ПРОГРЕСС
            stepCompleted = false;
            
            if (nextBtn) nextBtn.textContent = 'Далее'; 
            
            renderStep();
        } else {
            if (ambientAudio) {
                ambientAudio.pause();
            }
            stopBreathing();

            const emergencyBtn = document.getElementById('emergencyExit') || document.getElementById('emergency-exit');
            if (emergencyBtn) {
                emergencyBtn.style.display = 'none';
            }

            // Очищаем сессию при завершении
            Storage.clearActiveSession();

            stepContent.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 20px; color: var(--accent-color);">✔</div>
                    <h2>Сеанс завершён</h2>
                    <p style="color: #666; max-width: 280px; margin: 0 auto 20px; line-height: 1.5;">
                        Вы справились. Возвращайтесь, когда понадобится помощь.
                    </p>
                </div>
            `;

            if (nextBtn) {
                nextBtn.textContent = 'В главное меню';
                stepCompleted = true;
                nextBtn.classList.remove('hidden'); 

                const finalOutBtn = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(finalOutBtn, nextBtn);

                finalOutBtn.addEventListener('click', () => {
                    Storage.clearActiveSession();
                    window.location.href = 'dashboard.html';
                });
            }
        }
        updateProgress();
    }

    // Очистка анимаций дыхания
    function stopBreathing() {
        if (breathingInterval) {
            clearInterval(breathingInterval);
            breathingInterval = null;
        }
        if (window.breathingTimerInterval) {
            clearInterval(window.breathingTimerInterval);
            window.breathingTimerInterval = null;
        }
    }

    // Рендеринг текущего шага
    function renderStep() {
        stopBreathing();
        const step = steps[currentStepIndex];
        if (!step) return;

        stepContent.innerHTML = '';
        nextBtn.classList.add('hidden');
        stepCompleted = false;

        switch (step.type) {
            case 'grounding':
                renderGrounding(step);
                break;
            case 'breathing':
                renderBreathing(step);
                break;
            case 'anchor':
                renderAnchor(step);
                break;
            case 'action':
                renderAction(step);
                break;
            case 'simple':
                renderSimple(step);
                break;
            default:
                stepContent.innerHTML = '<p>Неизвестный тип шага</p>';
                nextBtn.classList.remove('hidden');
        }
        updateProgress();
        saveSessionProgress(currentStepIndex); // СОХРАНЯЕМ ПРОГРЕСС
    }

    // Заземление
    function renderGrounding(step) {
        groundingDoneCount = 0;
        const maxClicks = 5;
        const container = document.createElement('div');
        container.className = 'grounding-container';
        container.innerHTML = `
            <h2>Упражнение 5-4-3-2-1</h2>
            <p>Назовите 5 вещей, которые вы видите вокруг. Нажимайте на кнопку каждый раз, когда назвали один предмет.</p>
            <div class="grounding-buttons" id="groundingButtons"></div>
            <div class="grounding-count" id="groundingCount">Отмечено: 0 / 5</div>
        `;
        stepContent.appendChild(container);

        const btnContainer = document.getElementById('groundingButtons');
        for (let i = 1; i <= 5; i++) {
            const btn = document.createElement('button');
            btn.textContent = `${i}`;
            btn.className = 'grounding-btn';
            btn.dataset.index = i;
            btn.addEventListener('click', () => {
                if (groundingDoneCount < maxClicks && !btn.classList.contains('done')) {
                    btn.classList.add('done');
                    groundingDoneCount++;
                    document.getElementById('groundingCount').textContent = `Отмечено: ${groundingDoneCount} / 5`;
                    if (groundingDoneCount === maxClicks) {
                        stepCompleted = true;
                        nextBtn.classList.remove('hidden');
                    }
                }
            });
            btnContainer.appendChild(btn);
        }
    }

    //  Дыхание 
    function renderBreathing(step) {
        const pattern = step.data?.pattern || 'square';
        let phases = [];
        
        if (pattern === 'square') {
            phases = [
                { text: 'Вдох', duration: 4, className: 'inhale' },
                { text: 'Задержка', duration: 4, className: 'hold' },
                { text: 'Выдох', duration: 4, className: 'exhale' },
                { text: 'Задержка', duration: 4, className: 'hold' }
            ];
        } else if (pattern === '4-7-8') {
            phases = [
                { text: 'Вдох', duration: 4, className: 'inhale' },
                { text: 'Задержка', duration: 7, className: 'hold' },
                { text: 'Выдох', duration: 8, className: 'exhale' }
            ];
        } else {
            phases = [
                { text: 'Вдох', duration: 4, className: 'inhale' },
                { text: 'Выдох', duration: 4, className: 'exhale' },
                { text: 'Пауза', duration: 4, className: 'hold' }
            ];
        }

        const container = document.createElement('div');
        container.className = 'breathing-container';
        
        const circleDiv = document.createElement('div');
        circleDiv.className = 'breathing-circle';
        
        const textInsideDiv = document.createElement('div');
        textInsideDiv.className = 'breathing-text-inside';
        circleDiv.appendChild(textInsideDiv);
        
        const timerDiv = document.createElement('div');
        timerDiv.className = 'breathing-timer';
        
        container.appendChild(circleDiv);
        container.appendChild(timerDiv);
        stepContent.appendChild(container);

        let currentPhaseIndex = 0;
        let timeLeft = phases[currentPhaseIndex].duration;
        let totalCycles = 0;

        function updatePhase() {
            if (!document.contains(container)) return; 

            const phase = phases[currentPhaseIndex];
            
            textInsideDiv.textContent = phase.text;
            timerDiv.textContent = `${timeLeft} сек`;
            
            circleDiv.className = `breathing-circle ${phase.className}`;
        }

        updatePhase();

        window.breathingTimerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft > 0) {
                timerDiv.textContent = `${timeLeft} сек`;
            } else {
                currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
                timeLeft = phases[currentPhaseIndex].duration;
                
                if (currentPhaseIndex === 0) {
                    totalCycles++;
                    if (totalCycles >= 2) {
                        stepCompleted = true;
                        nextBtn.classList.remove('hidden');
                    }
                }
                
                updatePhase();
            }
        }, 1000);
    }

    //  Фраза-якорь 
    function renderAnchor(step) {
        const phrase = step.data?.text || 'Я спокоен и в безопасности';
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="anchor-phrase">${escapeHtml(phrase)}</div>
            <button id="anchorDoneBtn" class="next-btn" style="margin-top: 30px;">Понял(а)</button>
        `;
        stepContent.appendChild(container);
        document.getElementById('anchorDoneBtn').addEventListener('click', () => {
            stepCompleted = true;
            nextBtn.classList.remove('hidden');
        });
    }

    //  Действие в реальности 
    function renderAction(step) {
        const actionText = step.data?.text || 'Выполните действие';
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="action-text">${escapeHtml(actionText)}</div>
            <button id="actionDoneBtn" class="next-btn" style="margin-top: 40px;">Выполнил(а)</button>
        `;
        stepContent.appendChild(container);
        
        document.getElementById('actionDoneBtn').addEventListener('click', () => {
            stepCompleted = true;
            nextBtn.classList.remove('hidden');
        });
    }

    //  Простое задание 
    function renderSimple(step) {
        const taskText = step.data?.text || 'Подтвердите выполнение';
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="simple-text">${escapeHtml(taskText)}</div>
            <button id="simpleDoneBtn" class="next-btn">Понял(а)</button>
        `;
        stepContent.appendChild(container);
        
        document.getElementById('simpleDoneBtn').addEventListener('click', () => {
            stepCompleted = true;
            completeStep(); 
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (stepCompleted) {
                completeStep();
            } else {
                showToast('Сначала выполните текущее упражнение', 'warning');
            }
        });
    }

    // Экстренный выход
    const emergencyBtn = document.getElementById('emergencyExit') || document.getElementById('emergency-exit');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (typeof window.showActionToast === 'function') {
                window.showActionToast('Завершить сеанс помощи? Вы вернётесь на панель управления.', () => {
                    if (ambientAudio) {
                        ambientAudio.pause();
                    }
                    stopBreathing();
                    Storage.clearActiveSession();
                    window.location.href = 'dashboard.html';
                });
            } else {
                if (confirm('Завершить сеанс помощи? Вы вернётесь на панель управления.')) {
                    Storage.clearActiveSession();
                    window.location.href = 'dashboard.html';
                }
            }
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

    // Начало
    renderStep();
});