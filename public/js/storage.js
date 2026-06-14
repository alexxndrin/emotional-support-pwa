window.Storage = {
    registerUser: function(login, password) {
        // Сохраняем пользователя в отдельном хранилище
        const users = JSON.parse(localStorage.getItem('app_users') || '[]');
        // Проверяем, не существует ли уже такой пользователь
        const userExists = users.some(u => u.login === login);
        if (userExists) {
            showToast('Пользователь с таким логином уже существует', 'error');
            return false;
        }
        users.push({ login, password });
        localStorage.setItem('app_users', JSON.stringify(users));
        localStorage.setItem('localAppUser', JSON.stringify({ user: login, pass: password }));
        this.loginUser(login);
        return true;
    },
    
    loginUser: function(login) {
        localStorage.setItem('currentUser', login);
    },
    
    getCurrentUser: function() {
        return localStorage.getItem('currentUser');
    },
    
    logout: function() {
        this.clearActiveSession();
        localStorage.removeItem('currentUser');
    },
    
    _getSituationsKey: function() { 
        const user = this.getCurrentUser();
        return user ? `userSituations_${user}` : null; 
    },
    
    getSituations: function() {
        const key = this._getSituationsKey();
        if (!key) return [];
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    },
    
    getSituation: function(id) {
        return this.getSituations().find(s => s.id === id);
    },
    
    addSituation: function(situation) {
        const situations = this.getSituations();
        situations.push(situation);
        localStorage.setItem(this._getSituationsKey(), JSON.stringify(situations));
    },
    
    updateSituation: function(situation) {
        let situations = this.getSituations();
        const index = situations.findIndex(s => s.id === situation.id);
        if (index !== -1) situations[index] = situation;
        else situations.push(situation);
        localStorage.setItem(this._getSituationsKey(), JSON.stringify(situations));
    },
    
    deleteSituation: function(id) {
        const situations = this.getSituations().filter(s => s.id !== id);
        localStorage.setItem(this._getSituationsKey(), JSON.stringify(situations));
    },
    
    _getContactsKey: function() { 
        const user = this.getCurrentUser();
        return user ? `emergencyContacts_${user}` : null; 
    },
    
    getContacts: function() {
        const key = this._getContactsKey();
        if (!key) return [];
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    },
    
    addContact: function(name, phone) {
        const contacts = this.getContacts();
        contacts.push({ name, phone });
        localStorage.setItem(this._getContactsKey(), JSON.stringify(contacts));
    },
    
    updateContact: function(index, name, phone) {
        const contacts = this.getContacts();
        if (contacts[index]) {
            contacts[index] = { name, phone };
            localStorage.setItem(this._getContactsKey(), JSON.stringify(contacts));
        }
    },
    
    deleteContact: function(index) {
        const contacts = this.getContacts();
        contacts.splice(index, 1);
        localStorage.setItem(this._getContactsKey(), JSON.stringify(contacts));
    },
    
    _getAvatarKey: function() { 
        const user = this.getCurrentUser();
        return user ? `userAvatarPhoto_${user}` : null; 
    },
    
    getAvatar: function() {
        const key = this._getAvatarKey();
        return key ? localStorage.getItem(key) : null;
    },
    
    setAvatar: function(base64Image) {
        const key = this._getAvatarKey();
        if (key) localStorage.setItem(key, base64Image);
    },
    
    _getSessionKey: function() { 
        const user = this.getCurrentUser();
        return user ? `activeSession_${user}` : null; 
    },
    
    setActiveSession: function(situationId, currentStepIndex) {
        const key = this._getSessionKey();
        if (key) localStorage.setItem(key, JSON.stringify({ situationId, currentStepIndex }));
    },
    
    getActiveSession: function() {
        const key = this._getSessionKey();
        if (!key) return null;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    },
    
    clearActiveSession: function() {
        const key = this._getSessionKey();
        if (key) localStorage.removeItem(key);
    },
    
    exportData: function() { 
        return JSON.stringify({ 
            user: this.getCurrentUser(),
            situations: this.getSituations(), 
            contacts: this.getContacts() 
        }, null, 2); 
    },
    
    importData: function(data) {
        if (data.situations) {
            localStorage.setItem(this._getSituationsKey(), JSON.stringify(data.situations));
        }
        if (data.contacts) {
            localStorage.setItem(this._getContactsKey(), JSON.stringify(data.contacts));
        }
        return true;
    }
};