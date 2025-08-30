import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Sinun vahvistamasi 1 Firebase-konfiguraatio
const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.firebasestorage.app",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

const PASSWORDS = {
    Toni: '26425',
    Kaisa: '050583',
    Oona: '210314'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- DOM-elementit ---
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const mainContainer = document.getElementById('main-container');
const currentUserName = document.getElementById('current-user-name');
const logoutBtn = document.getElementById('logout-btn');
const tulevatTapahtumatLista = document.getElementById('tulevat-tapahtumat-lista');
const kalenteriPaivatOtsikot = document.getElementById('kalenteri-paivat-otsikot');
const kalenteriGrid = document.getElementById('kalenteri-grid');
const kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
const edellinenBtn = document.getElementById('edellinen-kk');
const seuraavaBtn = document.getElementById('seuraava-kk');
const lisaaLomake = document.getElementById('lisaa-tapahtuma-lomake');
const modalOverlay = document.getElementById('tapahtuma-modal-overlay');
const modalViewContent = document.getElementById('modal-view-content');
const modalEditContent = document.getElementById('modal-edit-content');

// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();
let unsubscribeFromEvents = null;

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    lisaaKuuntelijat();
});

function checkLoginStatus() {
    const rememberedUser = localStorage.getItem('loggedInUser');
    if (rememberedUser && PASSWORDS[rememberedUser]) {
        startAppForUser(rememberedUser);
    }
}

function lisaaKuuntelijat() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    edellinenBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() - 1);
        piirraKalenteri();
    });
    seuraavaBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() + 1);
        piirraKalenteri();
    });
    lisaaLomake.addEventListener('submit', (e) => {
        e.preventDefault();
        lisaaTapahtuma();
    });
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) suljeTapahtumaIkkuna(); });
    document.getElementById('sulje-btn').addEventListener('click', suljeTapahtumaIkkuna);
    document.getElementById('peruuta-muokkaus-btn').addEventListener('click', () => vaihdaTila('view'));
    document.getElementById('muokkaa-btn').addEventListener('click', () => vaihdaTila('edit'));
    document.getElementById('tallenna-muutokset-btn').addEventListener('click', tallennaMuutokset);
    document.getElementById('poista-tapahtuma-btn').addEventListener('click', poistaTapahtuma);
}

function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-password').value;
    if (PASSWORDS[user] === pass) {
        localStorage.setItem('loggedInUser', user);
        startAppForUser(user);
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('loggedInUser');
    if (unsubscribeFromEvents) {
        unsubscribeFromEvents();
    }
    nykyinenKayttaja = null;
    mainContainer.classList.add('hidden');
    loginOverlay.classList.remove('hidden');
    document.body.className = '';
}

function startAppForUser(user) {
    nykyinenKayttaja = user;
    loginOverlay.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('login-password').value = '';
    currentUserName.textContent = nykyinenKayttaja;
    applyTheme(nykyinenKayttaja);
    piirraKalenteri();
    kuunteleTapahtumia();
}

function applyTheme(user) {
    document.body.className = '';
    document.body.classList.add(`theme-${user.toLowerCase()}`);
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function piirraKalenteri() {
    kalenteriGrid.innerHTML = '';
    kalenteriPaivatOtsikot.innerHTML = '';
    kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', '<div class="viikonpaiva"></div>');
    ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].forEach(p => kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', `<div class="viikonpaiva">${p}</div>`));
    
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();
    kuukausiOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${vuosi}`;
    const ekaPaiva = new Date(vuosi, kuukausi, 1);
    const paivia = new Date(vuosi, kuukausi + 1, 0).getDate();
    let viikonpaiva = ekaPaiva.getDay() || 7;
    
    // TÄSSÄ OLI VIRHE, NYT KORJATTU
    for (let i = 1; i < viikonpaiva; i++) {
        kalenteriGrid.insertAdjacentHTML('beforeend', '<div class="paiva tyhja"></div>');
    }
    
    for (let i = 1; i <= paivia; i++) {
        const tamaPaiva = new Date(vuosi, kuukausi, i);
        if (tamaPaiva.getDay() === 1 || i === 1) {
            kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="viikko-nro">${getWeekNumber(tamaPaiva)}</div>`);
        }
        const pvm = `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="paiva" data-paivamaara="${pvm}"><div class="paiva-numero">${i}</div><div class="tapahtumat-container"></div></div>`);
    }
    naytaTapahtumatKalenterissa();
}

function lisaaTapahtuma() {
    const uusi = {
        otsikko: document.getElementById('tapahtuma-otsikko').value,
        kuvaus: document.getElementById('tapahtuma-kuvaus').value,
        alku: document.getElementById('tapahtuma-alku').value,
        loppu: document.getElementById('tapahtuma-loppu').value,
        luoja: nykyinenKayttaja,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };
    if (!uusi.otsikko || !uusi.alku || !uusi.loppu) return alert('Täytä vähintään otsikko, alkamis- ja loppumisaika.');
    push(ref(database, 'tapahtumat'), uusi).then(() => lisaaLomake.reset());
}

function kuunteleTapahtumia() {
    if (unsubscribeFromEvents) unsubscribeFromEvents();
    const tapahtumatRef = ref(database, 'tapahtumat');
    unsubscribeFromEvents = onValue(tapahtumatRef, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((child) => window.kaikkiTapahtumat.push({ key: child.key, ...child.val() }));
        naytaTapahtumatKalenterissa();
        naytaTulevatTapahtumat();
    });
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    window.kaikkiTapahtumat.forEach(tapahtuma => {
        if (tapahtuma.nakyvyys?.[nykyinenKayttaja] && tapahtuma.alku) {
            const paivaEl = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
            if (paivaEl) {
                const tapahtumaEl = document.createElement('div');
                tapahtumaEl.className = `tapahtuma ${tapahtuma.luoja === nykyinenKayttaja ? 'oma' : ''}`;
                tapahtumaEl.textContent = tapahtuma.otsikko;
                tapahtumaEl.addEventListener('click', () => avaaTapahtumaIkkuna(tapahtuma.key));
                paivaEl.querySelector('.tapahtumat-container').appendChild(tapahtumaEl);
            }
        }
    });
}

function naytaTulevatTapahtumat() {
    tulevatTapahtumatLista.innerHTML = '';
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    const nyt = new Date();
    const today = new Date(nyt.getFullYear(), nyt.getMonth(), nyt.getDate());
    const tulevat = window.kaikkiTapahtumat
        .filter(t => t.nakyvyys?.[nykyinenKayttaja] && new Date(t.alku) >= today)
        .sort((a, b) => new Date(a.alku) - new Date(b.alku))
        .slice(0, 5);
    if (tulevat.length === 0) {
        tulevatTapahtumatLista.innerHTML = '<p>Ei tulevia tapahtumia.</p>';
        return;
    }
    tulevat.forEach(tapahtuma => {
        const alku = new Date(tapahtuma.alku);
        const paiva = alku.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
        const aika = alku.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
        const item = document.createElement('div');
        item.className = 'tuleva-tapahtuma-item';
        item.innerHTML = `
            <div class="tapahtuma-item-aika">${paiva} ${aika}</div>
            <div class.tapahtuma-item-otsikko">${tapahtuma.otsikko}</div>
        `;
        item.addEventListener('click', () => avaaTapahtumaIkkuna(tapahtuma.key));
        tulevatTapahtumatLista.appendChild(item);
    });
}

function avaaTapahtumaIkkuna(key) {
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    if (!tapahtuma) return;
    modalOverlay.dataset.tapahtumaId = key;
    document.getElementById('view-otsikko').textContent = tapahtuma.otsikko;
    document.getElementById('view-kuvaus').textContent = tapahtuma.kuvaus || 'Ei lisätietoja.';
    document.getElementById('view-luoja').textContent = tapahtuma.luoja;
    const nakyvatNimet = Object.keys(tapahtuma.nakyvyys || {}).filter(k => tapahtuma.nakyvyys[k]).join(', ');
    document.getElementById('view-nakyvyys').textContent = nakyvatNimet;
    const alkuPvm = new Date(tapahtuma.alku);
    const loppuPvm = new Date(tapahtuma.loppu);
    const options = { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('view-aika').textContent = `${alkuPvm.toLocaleString('fi-FI', options)} - ${loppuPvm.toLocaleString('fi-FI', options)}`;
    document.getElementById('muokkaa-tapahtuma-id').value = key;
    document.getElementById('muokkaa-tapahtuma-otsikko').value = tapahtuma.otsikko;
    document.getElementById('muokkaa-tapahtuma-kuvaus').value = tapahtuma.kuvaus || '';
    document.getElementById('muokkaa-tapahtuma-alku').value = tapahtuma.alku;
    document.getElementById('muokkaa-tapahtuma-loppu').value = tapahtuma.loppu;
    document.querySelectorAll('input[name="muokkaa-nakyvyys"]').forEach(cb => {
       cb.checked = !!tapahtuma.nakyvyys?.[cb.value];
    });
    vaihdaTila('view');
    modalOverlay.classList.remove('hidden');
}

function suljeTapahtumaIkkuna() {
    modalOverlay.classList.add('hidden');
}

function vaihdaTila(tila) {
    if (tila === 'edit') {
        modalViewContent.classList.add('hidden');
        modalEditContent.classList.remove('hidden');
    } else {
        modalEditContent.classList.add('hidden');
        modalViewContent.classList.remove('hidden');
    }
}

function tallennaMuutokset() {
    const key = modalOverlay.dataset.tapahtumaId;
    const paivitys = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: document.getElementById('muokkaa-tapahtuma-alku').value,
        loppu: document.getElementById('muokkaa-tapahtuma-loppu').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };
    update(ref(database, `tapahtumat/${key}`), paivitys).then(() => {
        avaaTapahtumaIkkuna(key);
        vaihdaTila('view');
    });
}

function poistaTapahtuma() {
    const key = modalOverlay.dataset.tapahtumaId;
    if (confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
        remove(ref(database, `tapahtumat/${key}`)).then(() => suljeTapahtumaIkkuna());
    }
}
