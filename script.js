// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.firebasestorage.app",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// HUOM: Salasanat ovat tässä vain yksinkertaista perhekäyttöä varten.
// Tämä ei ole turvallinen tapa tallentaa salasanoja oikeissa sovelluksissa.
const PASSWORDS = {
    Toni: '26425',
    Kaisa: '050583',
    Oona: '210314'
};

// --- DOM-elementit ---
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const mainContainer = document.getElementById('main-container');
const currentUserName = document.getElementById('current-user-name');
const logoutBtn = document.getElementById('logout-btn');

const kalenteriGrid = document.getElementById('kalenteri-grid');
const kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
const edellinenBtn = document.getElementById('edellinen-kk');
const seuraavaBtn = document.getElementById('seuraava-kk');
const lisaaLomake = document.getElementById('lisaa-tapahtuma-lomake');

const modalOverlay = document.getElementById('tapahtuma-modal-overlay');
const modalViewContent = document.getElementById('modal-view-content');
const modalEditContent = document.getElementById('modal-edit-content');
const muokkaaBtn = document.getElementById('muokkaa-btn');
const suljeBtn = document.getElementById('sulje-btn');
const tallennaBtn = document.getElementById('tallenna-muutokset-btn');
const poistaBtn = document.getElementById('poista-tapahtuma-btn');
const peruutaMuokkausBtn = document.getElementById('peruuta-muokkaus-btn');

// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();

// --- Päälogiikka ---
document.addEventListener('DOMContentLoaded', () => {
    lisaaKuuntelijat();
});

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
    suljeBtn.addEventListener('click', suljeTapahtumaIkkuna);
    peruutaMuokkausBtn.addEventListener('click', () => vaihdaTila('view'));
    muokkaaBtn.addEventListener('click', () => vaihdaTila('edit'));
    tallennaBtn.addEventListener('click', tallennaMuutokset);
    poistaBtn.addEventListener('click', poistaTapahtuma);
}

function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-password').value;

    if (PASSWORDS[user] === pass) {
        nykyinenKayttaja = user;
        loginOverlay.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        loginError.classList.add('hidden');
        document.getElementById('login-password').value = '';
        currentUserName.textContent = nykyinenKayttaja;
        
        applyTheme(nykyinenKayttaja);
        piirraKalenteri();
        kuunteleTapahtumia();
    } else {
        loginError.classList.remove('hidden');
    }
}

function handleLogout() {
    nykyinenKayttaja = null;
    mainContainer.classList.add('hidden');
    loginOverlay.classList.remove('hidden');
    document.body.className = ''; // Poista teemaluokat
}

function applyTheme(user) {
    document.body.className = ''; // Nollaa vanhat teemat
    document.body.classList.add(`theme-${user.toLowerCase()}`);
}

function piirraKalenteri() {
    // ... (Tämä funktio ja muut alla olevat pysyvät lähes ennallaan)
    kalenteriGrid.innerHTML = '';
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();
    kuukausiOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${vuosi}`;
    const kuukaudenEkaPaiva = new Date(vuosi, kuukausi, 1);
    const paiviaKuukaudessa = new Date(vuosi, kuukausi + 1, 0).getDate();
    let viikonpaivaIndeksi = kuukaudenEkaPaiva.getDay() || 7;
    for (let i = 1; i < viikonpaivaIndeksi; i++) kalenteriGrid.insertAdjacentHTML('beforeend', '<div class="paiva tyhja"></div>');
    for (let i = 1; i <= paiviaKuukaudessa; i++) {
        const paivamaara = `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="paiva" data-paivamaara="${paivamaara}"><div class="paiva-numero">${i}</div><div class="tapahtumat-container"></div></div>`);
    }
    naytaTapahtumatKalenterissa();
}

function lisaaTapahtuma() {
    const uusiTapahtuma = {
        otsikko: document.getElementById('tapahtuma-otsikko').value,
        kuvaus: document.getElementById('tapahtuma-kuvaus').value,
        alku: document.getElementById('tapahtuma-alku').value,
        loppu: document.getElementById('tapahtuma-loppu').value,
        luoja: nykyinenKayttaja,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((acc, cb) => ({ ...acc, [cb.value]: true }), {})
    };
    if (!uusiTapahtuma.otsikko || !uusiTapahtuma.alku || !uusiTapahtuma.loppu) return alert('Täytä vähintään otsikko, alkamis- ja loppumisaika.');
    push(ref(database, 'tapahtumat'), uusiTapahtuma).then(() => lisaaLomake.reset());
}

let unsubscribeFromEvents = null;
function kuunteleTapahtumia() {
    if (unsubscribeFromEvents) {
        unsubscribeFromEvents(); // Lopeta vanha kuuntelija, jos sellainen on
    }
    const tapahtumatRef = ref(database, 'tapahtumat');
    unsubscribeFromEvents = onValue(tapahtumatRef, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((child) => window.kaikkiTapahtumat.push({ key: child.key, ...child.val() }));
        naytaTapahtumatKalenterissa();
    });
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    window.kaikkiTapahtumat.forEach(tapahtuma => {
        if (tapahtuma.nakyvyys?.[nykyinenKayttaja] && tapahtuma.alku) {
            const paivaElementti = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
            if (paivaElementti) {
                const tapahtumaEl = document.createElement('div');
                tapahtumaEl.className = `tapahtuma ${tapahtuma.luoja === nykyinenKayttaja ? 'oma' : ''}`;
                tapahtumaEl.textContent = tapahtuma.otsikko;
                tapahtumaEl.addEventListener('click', () => avaaTapahtumaIkkuna(tapahtuma.key));
                paivaElementti.querySelector('.tapahtumat-container').appendChild(tapahtumaEl);
            }
        }
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
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((acc, cb) => ({ ...acc, [cb.value]: true }), {})
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
