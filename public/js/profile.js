document.addEventListener('DOMContentLoaded', () => {
    let currentUser = Storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Элементы профиля
    const avatarLarge = document.getElementById('avatarLarge');
    const avatarUpload = document.getElementById('avatarUpload');
    const usernameInput = document.getElementById('usernameInput');
    const editNameBtn = document.getElementById('editNameBtn');
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Модальные окна
    const aboutModal = document.getElementById('aboutModal');
    const contactsModal = document.getElementById('contactsModal');
    const exportModal = document.getElementById('exportModal');
    const aboutBtn = document.getElementById('aboutAppBtn');
    const contactsBtn = document.getElementById('emergencyContactsBtn');
    const exportImportBtn = document.getElementById('exportImportBtn');

    function initProfileUI() {
        if (usernameInput) usernameInput.value = currentUser;

        if (avatarLarge) {
            const savedPhoto = Storage.getAvatar();

            if (savedPhoto) {
                avatarLarge.textContent = '';
                avatarLarge.style.backgroundImage = `url(${savedPhoto})`;
                avatarLarge.style.backgroundSize = 'cover';
                avatarLarge.style.backgroundPosition = 'center';
                avatarLarge.style.backgroundRepeat = 'no-repeat';
            } else {
                avatarLarge.style.backgroundImage = 'none';
                const initials = currentUser.trim().substring(0, 2).toUpperCase();
                avatarLarge.textContent = initials || '??';
            }
        }
    }

    initProfileUI();

    if (avatarLarge && avatarUpload) {
        avatarLarge.addEventListener('click', () => avatarUpload.click());

        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 1.5 * 1024 * 1024) {
                showToast('Фотография слишком большая. Выберите изображение до 1.5 МБ', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64Image = ev.target.result;
                Storage.setAvatar(base64Image);
                initProfileUI();
                showToast('Фотография профиля обновлена', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    if (usernameInput && editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            if (usernameInput.hasAttribute('readonly')) {
                usernameInput.removeAttribute('readonly');
                usernameInput.focus();
                usernameInput.select();
                editNameBtn.textContent = '✓';
            } else {
                saveNewName();
            }
        });

        usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNewName();
            }
        });

        function saveNewName() {
            const newName = usernameInput.value.trim();
            
            if (!newName) {
                showToast('Имя не может быть пустым', 'error');
                usernameInput.value = currentUser;
                return;
            }

            if (newName === currentUser) {
                usernameInput.setAttribute('readonly', true);
                editNameBtn.textContent = '✎';
                return;
            }

            // Перенос данных
            const oldSituationsKey = `userSituations_${currentUser}`;
            const oldContactsKey = `emergencyContacts_${currentUser}`;
            const oldPhotoKey = `userAvatarPhoto_${currentUser}`;
            
            const savedSituations = localStorage.getItem(oldSituationsKey);
            const savedContacts = localStorage.getItem(oldContactsKey);
            const savedPhoto = localStorage.getItem(oldPhotoKey);
            
            localStorage.setItem(`userSituations_${newName}`, savedSituations || '[]');
            localStorage.setItem(`emergencyContacts_${newName}`, savedContacts || '[]');
            if (savedPhoto) localStorage.setItem(`userAvatarPhoto_${newName}`, savedPhoto);
            
            localStorage.removeItem(oldSituationsKey);
            localStorage.removeItem(oldContactsKey);
            localStorage.removeItem(oldPhotoKey);

            localStorage.setItem('currentUser', newName);
            currentUser = newName;

            usernameInput.setAttribute('readonly', true);
            editNameBtn.textContent = '✎';
            
            initProfileUI();
            showToast('Имя успешно изменено', 'success');
        }
    }

    function openModal(modal) {
        if (modal) modal.classList.add('active');
    }
    function closeModal(modal) {
        if (modal) modal.classList.remove('active');
    }
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
    });
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal-overlay'));
        });
    });

    if (aboutBtn) aboutBtn.addEventListener('click', () => openModal(aboutModal));
    if (contactsBtn) {
        contactsBtn.addEventListener('click', () => {
            loadContacts();
            openModal(contactsModal);
        });
    }
    if (exportImportBtn) exportImportBtn.addEventListener('click', () => openModal(exportModal));

    const contactsListDiv = document.getElementById('contactsList');
    const addContactBtn = document.getElementById('addContactBtn');
    const newContactName = document.getElementById('newContactName');
    const newContactPhone = document.getElementById('newContactPhone');

    function validatePhoneNumber(phone) {
        const cleanPhone = phone.replace(/[+\s-()]/g, '');
        return /^\d{3,15}$/.test(cleanPhone);
    }

    function loadContacts() {
        // Используем Storage.getContacts
        let contacts = Storage.getContacts();
        if (contacts.length === 0) {
            contacts = [
                { name: 'Служба спасения', phone: '112' },
                { name: 'Мама', phone: '' },
                { name: 'Папа', phone: '' }
            ];
            contacts.forEach(contact => {
                Storage.addContact(contact.name, contact.phone);
            });
            contacts = Storage.getContacts();
        }
        renderContacts(contacts);
    }

    function renderContacts(contacts) {
        if (!contactsListDiv) return;
        contactsListDiv.innerHTML = '';
        
        contacts.forEach((contact, idx) => {
            const div = document.createElement('div');
            div.className = 'contact-item';
            div.innerHTML = `
                <div class="contact-info">
                    <input type="text" class="inline-edit-name" data-index="${idx}" value="${escapeHtml(contact.name)}">
                    <input type="tel" class="inline-edit-phone" data-index="${idx}" value="${escapeHtml(contact.phone || '')}" placeholder="Номер телефона">
                </div>
                <div class="contact-actions">
                    <button class="delete-contact" data-index="${idx}">✖</button>
                </div>
            `;
            contactsListDiv.appendChild(div);
        });

        // Отслеживание изменений в текстовых полях контактов
        contactsListDiv.querySelectorAll('.inline-edit-name, .inline-edit-phone').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                let currentList = Storage.getContacts();
                
                if (e.target.classList.contains('inline-edit-name')) {
                    const val = e.target.value.trim();
                    if (!val) {
                        showToast('Имя контакта не может быть пустым', 'error');
                        renderContacts(currentList);
                        return;
                    }
                    currentList[index].name = val;
                } else {
                    const val = e.target.value.trim();
                    if (val && !validatePhoneNumber(val)) {
                        showToast('Неверный формат номера телефона', 'error');
                        renderContacts(currentList);
                        return;
                    }
                    currentList[index].phone = val;
                }

                Storage.updateContact(index, currentList[index].name, currentList[index].phone);
                showToast('Контакт обновлен', 'success');
            });
        });

        // Удаление контакта
        contactsListDiv.querySelectorAll('.delete-contact').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                Storage.deleteContact(index);
                const updatedContacts = Storage.getContacts();
                renderContacts(updatedContacts);
                showToast('Контакт удален', 'info');
            });
        });
    }

    function addContact(name, phone) {
        if (!name.trim()) {
            showToast('Введите имя контакта', 'error');
            return;
        }
        if (phone.trim() && !validatePhoneNumber(phone.trim())) {
            showToast('Введен некорректный номер телефона', 'error');
            return;
        }
        // Используем Storage.addContact
        Storage.addContact(name.trim(), phone.trim());
        const contacts = Storage.getContacts();
        renderContacts(contacts);
        if (newContactName) newContactName.value = '';
        if (newContactPhone) newContactPhone.value = '';
        showToast('Контакт успешно добавлен', 'success');
    }

    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            if (newContactName && newContactPhone) {
                addContact(newContactName.value, newContactPhone.value);
            }
        });
    }

    // Экспорт / Импорт 
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importFileInput = document.getElementById('importFile');
    const importConfirmBtn = document.getElementById('importConfirmBtn');
    let pendingImportData = null;

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            const exportData = Storage.exportData();
            if (exportData) {
                const dataStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tocka_opory_${currentUser}_backup.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Резервная копия скачана', 'success');
            } else {
                showToast('Ошибка экспорта данных', 'error');
            }
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (imported.user && imported.situations && imported.contacts) {
                        pendingImportData = imported;
                        if (importConfirmBtn) importConfirmBtn.style.display = 'block';
                        showToast('Файл загружен. Подтвердите импорт для замены данных.', 'info');
                    } else {
                        showToast('Неверный формат файла.', 'error');
                    }
                } catch(e) {
                    showToast('Ошибка чтения файла', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    if (importConfirmBtn) {
        importConfirmBtn.addEventListener('click', () => {
            if (pendingImportData) {
                const success = Storage.importData(pendingImportData);
                if (success) {
                    showToast('Данные успешно импортированы', 'success');
                    pendingImportData = null;
                    importConfirmBtn.style.display = 'none';
                    if (importFileInput) importFileInput.value = '';
                    if (contactsModal && contactsModal.classList.contains('active')) {
                        loadContacts();
                    }
                    initProfileUI();
                } else {
                    showToast('Ошибка импорта данных', 'error');
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showConfirm('Вы действительно хотите выйти из профиля?', () => {
                Storage.logout();
                showToast('Выход из профиля...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            }, 'Выйти');
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
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
});