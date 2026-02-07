// Ilmoitusten hallinta - eriytetty moduuli
export class NotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window;
        this.permission = 'default';
        this.checkInterval = null;
        this.reminders = new Map(); // Tallennetaan aktiiviset muistutukset
    }

    // Pyydä ilmoituslupa
    async requestPermission() {
        if (!this.isSupported) {
            console.log('Selain ei tue ilmoituksia');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Ilmoitusluvan pyyntö epäonnistui:', error);
            return false;
        }
    }

    // Näytä ilmoitus
    show(title, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            return;
        }

        const defaultOptions = {
            icon: './logo.png',
            badge: './logo.png',
            tag: 'kalenteri-notification',
            renotify: true,
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);
            
            // Sulje ilmoitus automaattisesti 5 sekunnin kuluttua
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Avaa sovellus kun ilmoitusta klikataan
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

        } catch (error) {
            console.error('Ilmoituksen näyttäminen epäonnistui:', error);
        }
    }

    // Tapahtumamuistutus
    showEventReminder(event) {
        const title = `📅 Muistutus: ${event.otsikko}`;
        const options = {
            body: `${this.formatEventTime(event.alku)} - ${event.teksti || 'Ei kuvausta'}`,
            tag: `event-${event.key}`,
            data: { eventKey: event.key }
        };
        
        this.show(title, options);
    }

    // Tehtävämuistutus
    showTaskReminder(task) {
        const title = `✅ Tehtävä muistutus`;
        const options = {
            body: `${task.teksti} - Määräpäivä: ${this.formatDate(task.maarapaiva)}`,
            tag: `task-${task.key}`,
            data: { taskKey: task.key }
        };
        
        this.show(title, options);
    }

    // Muotoile aika
    formatEventTime(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('fi-FI', {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return isoString;
        }
    }

    // Muotoile päivämäärä
    formatDate(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('fi-FI');
        } catch (error) {
            return isoString;
        }
    }

    // Tarkista tulevat tapahtumat ja aseta muistutukset
    checkUpcomingEvents(kaikkiTapahtumat, kaikkiTehtavat) {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Käy läpi kaikki tulevat tapahtumat
        Object.values(kaikkiTapahtumat || {}).forEach(event => {
            if (!event.alku) return;

            const eventTime = new Date(event.alku);
            const muistutukset = event.muistutukset || {};
            
            // 15 minuutin muistutus
            if (muistutukset.min15 && eventTime > now && eventTime <= fifteenMinutesFromNow) {
                const reminderKey = `event-15min-${event.key}`;
                if (!this.reminders.has(reminderKey)) {
                    this.showEventReminder(event);
                    this.reminders.set(reminderKey, true);
                }
            }
            
            // 1 tunnin muistutus
            if (muistutukset.tunti1 && eventTime > now && eventTime <= oneHourFromNow) {
                const reminderKey = `event-1h-${event.key}`;
                if (!this.reminders.has(reminderKey)) {
                    this.showEventReminder(event);
                    this.reminders.set(reminderKey, true);
                }
            }

            // 1 päivän muistutus
            if (muistutukset.paiva1 && eventTime > now && eventTime <= oneDayFromNow) {
                const reminderKey = `event-1d-${event.key}`;
                if (!this.reminders.has(reminderKey)) {
                    this.showEventReminder(event);
                    this.reminders.set(reminderKey, true);
                }
            }
        });

        // Tarkista tehtävien määräpäivät
        Object.values(kaikkiTehtavat || {}).forEach(task => {
            if (!task.maarapaiva || task.tehty || task.tila === 'arkistoitu') return;

            const dueDate = new Date(task.maarapaiva);
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            // Muistutus kun määräpäivä on huomenna
            if (dueDate > now && dueDate <= oneDayFromNow) {
                const reminderKey = `task-due-${task.key}`;
                if (!this.reminders.has(reminderKey)) {
                    this.showTaskReminder(task);
                    this.reminders.set(reminderKey, true);
                }
            }
        });
    }

    // Käynnistä tarkistusväli
    startChecking(intervalMinutes = 5, kaikkiTapahtumat, kaikkiTehtavat) {
        // Tarkista heti
        this.checkUpcomingEvents(kaikkiTapahtumat, kaikkiTehtavat);
        
        // Aseta säännöllinen tarkistus
        this.checkInterval = setInterval(() => {
            this.checkUpcomingEvents(kaikkiTapahtumat, kaikkiTehtavat);
        }, intervalMinutes * 60 * 1000);
    }

    // Pysäytä tarkistus
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Tyhjennä muistutukset (esim. kun käyttäjä kirjautuu ulos)
    clearReminders() {
        this.reminders.clear();
    }
}

// Ilmoitusasetusten hallinta
export class NotificationSettings {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.modal = document.getElementById('notification-settings-modal');
        this.settingsBtn = document.getElementById('notification-settings-btn');
        this.closeBtn = document.getElementById('sulje-notification-modal-btn');
        this.enableCheckbox = document.getElementById('enable-notifications');
        this.eventRemindersCheckbox = document.getElementById('event-reminders');
        this.taskRemindersCheckbox = document.getElementById('task-reminders');
        this.testBtn = document.getElementById('test-notification-btn');
        this.statusDiv = document.getElementById('notification-status');
        
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        this.settingsBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        this.enableCheckbox.addEventListener('change', (e) => {
            this.toggleNotifications(e.target.checked);
        });
        
        this.testBtn.addEventListener('click', () => this.testNotification());
    }

    async openModal() {
        this.modal.classList.remove('hidden');
        await this.updateStatus();
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.saveSettings();
    }

    async updateStatus() {
        const status = this.statusDiv.querySelector('p');
        
        if (!this.notificationManager.isSupported) {
            status.textContent = 'Selaimesi ei tue ilmoituksia';
            this.statusDiv.className = 'notification-status disabled';
            this.enableCheckbox.disabled = true;
            return;
        }

        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            status.textContent = '✅ Ilmoitukset käytössä';
            this.statusDiv.className = 'notification-status enabled';
            this.enableCheckbox.checked = true;
            this.enableCheckbox.disabled = false;
        } else if (permission === 'denied') {
            status.textContent = '❌ Ilmoitukset estetty selaimen asetuksissa';
            this.statusDiv.className = 'notification-status disabled';
            this.enableCheckbox.checked = false;
            this.enableCheckbox.disabled = true;
        } else {
            status.textContent = '⚠️ Ilmoituslupaa ei ole pyydetty';
            this.statusDiv.className = 'notification-status';
            this.enableCheckbox.checked = false;
            this.enableCheckbox.disabled = false;
        }
    }

    async toggleNotifications(enabled) {
        if (enabled) {
            const hasPermission = await this.notificationManager.requestPermission();
            if (hasPermission) {
                this.notificationManager.startChecking(5);
                await this.updateStatus();
            } else {
                this.enableCheckbox.checked = false;
            }
        } else {
            this.notificationManager.stopChecking();
            await this.updateStatus();
        }
    }

    testNotification() {
        if (this.notificationManager.permission === 'granted') {
            this.notificationManager.show('🔔 Testi-ilmoitus', {
                body: 'Tämä on testi-ilmoitus Kauppisen perhekalenterista!',
                tag: 'test-notification'
            });
        } else {
            alert('Ilmoitukset eivät ole käytössä. Salli ilmoitukset selaimen asetuksista.');
        }
    }

    saveSettings() {
        const settings = {
            enabled: this.enableCheckbox.checked,
            eventReminders: this.eventRemindersCheckbox.checked,
            taskReminders: this.taskRemindersCheckbox.checked
        };
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.enableCheckbox.checked = settings.enabled || false;
            this.eventRemindersCheckbox.checked = settings.eventReminders !== false;
            this.taskRemindersCheckbox.checked = settings.taskReminders !== false;
        }
    }
}
