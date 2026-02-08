import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.appspot.com",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

const KAYTTAJA_VARIT = {
    Toni: '#4ade80',
    Kaisa: '#c084fc',
    Oona: '#60a5fa',
    perhe: '#fb7185'
};

// Suomalaiset pyhäpäivät (kiinteät päivämäärät)
const SUOMALAISET_PYHAPAIVAT = {
    // Uudenvuodenpäivä
    '1-1': 'Uudenvuodenpäivä',
    // Loppiainen
    '1-6': 'Loppiainen',
    // Joulupäivä ja itsenäisyyspäivä siirtyvät
    // Helatorstai
    // Vappu
    '5-1': 'Vappu',
    // Juhannus (lasketaan dynaamisesti)
    // Itsenäisyyspäivä
    '12-6': 'Itsenäisyyspäivä',
    // Jouluaika
    '12-24': 'Jouluaatto',
    '12-25': 'Joulupäivä',
    '12-26': 'Tapaninpäivä'
};

// Liikkuvat pyhäpäivät (lasketaan vuosittain)
function getLiikkuvatPyhat(vuosi) {
    const pyhat = [];
    
    // Pääsiäinen (liikkuva)
    const paasiainen = getPaasiainen(vuosi);
    pyhat.push({
        pvm: `${paasiainen.getMonth() + 1}-${paasiainen.getDate()}`,
        nimi: 'Pääsiäinen'
    });
    
    // Pitkäperjantai (pääsiäistä edeltävä perjantai)
    const pitkaperjantai = new Date(paasiainen);
    pitkaperjantai.setDate(pitkaperjantai.getDate() - 2);
    pyhat.push({
        pvm: `${pitkaperjantai.getMonth() + 1}-${pitkaperjantai.getDate()}`,
        nimi: 'Pitkäperjantai'
    });
    
    // 2. pääsiäispäivä (pääsiäistä seuraava maanantai)
    const toinenPaasiainen = new Date(paasiainen);
    toinenPaasiainen.setDate(toinenPaasiainen.getDate() + 1);
    while (toinenPaasiainen.getDay() !== 1) { // Etsi seuraava maanantai
        toinenPaasiainen.setDate(toinenPaasiainen.getDate() + 1);
    }
    pyhat.push({
        pvm: `${toinenPaasiainen.getMonth() + 1}-${toinenPaasiainen.getDate()}`,
        nimi: '2. pääsiäispäivä'
    });
    
    // Helatorstai (helatorstai on 39 päivää pääsiäisen jälkeen)
    const helatorstai = new Date(paasiainen);
    helatorstai.setDate(helatorstai.getDate() + 39);
    pyhat.push({
        pvm: `${helatorstai.getMonth() + 1}-${helatorstai.getDate()}`,
        nimi: 'Helatorstai'
    });
    
    // Juhannus (kesäkuun 20.-26. päivä lauantaina)
    const juhannus = getJuhannus(vuosi);
    pyhat.push({
        pvm: `${juhannus.getMonth() + 1}-${juhannus.getDate()}`,
        nimi: 'Juhannus'
    });
    
    return pyhat;
}

function getPaasiainen(vuosi) {
    // Oikea pääsiäisen laskenta (Gaussin algoritmi)
    const a = vuosi % 19;
    const b = Math.floor(vuosi / 100);
    const c = vuosi % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = (h + l - 7 * m + 114) % 31;
    const p = Math.floor((h + l - 7 * m + 114) / 31);
    
    // Pääsiäissunnuntai
    const paiva = n + 1;
    const kuukausi = p;
    
    return new Date(vuosi, kuukausi - 1, paiva);
}

function getJuhannus(vuosi) {
    // Kesäkuun 20.-26. päivä lauantaina
    for (let paiva = 20; paiva <= 26; paiva++) {
        const date = new Date(vuosi, 5, paiva);
        if (date.getDay() === 6) { // Lauantai
            return date;
        }
    }
    return new Date(vuosi, 5, 20); // Fallback
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// --- DOM-elementit (Määritellään muuttujat) ---
let loginOverlay, loginForm, mainContainer, currentUserName, logoutBtn, tulevatTapahtumatLista,
    kalenteriPaivatOtsikot, kalenteriGrid, kuukausiOtsikko, edellinenBtn, seuraavaBtn, tanaanBtn,
    lisaaLomake, modalOverlay, modalViewContent, modalEditContent, avaaLisaysLomakeBtn,
    sivupalkki, hakuKentta, tehtavatContainer, uusiTehtavaTeksti, lisaaTehtavaNappi,
    tehtavalistaToggle, tehtavalistaSisalto, avoimetTehtavatLaskuri, avaaMenneetModalBtn,
    menneetTapahtumatModal, suljeMenneetModalBtn, menneetHakuKentta, menneetTapahtumatLista,
    edellinenSivuBtn, seuraavaSivuBtn, sivuInfo, tulevatSuodatin, tulevatPaginationControls,
    tulevatEdellinenSivuBtn, tulevatSeuraavaSivuBtn, tulevatSivuInfo, lisaaTehtavaHenkilot,
    avaaArkistoBtn, tehtavaArkistoModal, suljeArkistoModalBtn, arkistoidutTehtavatLista,
    lisaaMaarapaivaToggle, uusiTehtavaMaarapaiva;

// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();
let nykyinenNakyma = 'kuukausi'; // kuukausi, viikko, paiva
let unsubscribeFromEvents = null;
let unsubscribeFromTasks = null;
let menneetSivu = 0;
let tulevatSivu = 0;
let kaikkiTehtavat = [];
const TAPAHTUMIA_PER_SIVU = 10;

function alustaElementit() {
    loginOverlay = document.getElementById('login-overlay');
    loginForm = document.getElementById('login-form');
    mainContainer = document.getElementById('main-container');
    currentUserName = document.getElementById('current-user-name');
    logoutBtn = document.getElementById('logout-btn');
    tulevatTapahtumatLista = document.getElementById('tulevat-tapahtumat-lista');
    kalenteriPaivatOtsikot = document.getElementById('kalenteri-paivat-otsikot');
    kalenteriGrid = document.getElementById('kalenteri-grid');
    kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
    edellinenBtn = document.getElementById('edellinen-kk');
    seuraavaBtn = document.getElementById('seuraava-kk');
    tanaanBtn = document.getElementById('tanaan-btn');
    lisaaLomake = document.getElementById('lisaa-tapahtuma-lomake');
    modalOverlay = document.getElementById('tapahtuma-modal-overlay');
    modalViewContent = document.getElementById('modal-view-content');
    modalEditContent = document.getElementById('modal-edit-content');
    avaaLisaysLomakeBtn = document.getElementById('avaa-lisays-lomake-btn');
    sivupalkki = document.querySelector('.sivupalkki');
    hakuKentta = document.getElementById('haku-kentta');
    tehtavatContainer = document.getElementById('tehtavat-container');
    uusiTehtavaTeksti = document.getElementById('uusi-tehtava-teksti');
    lisaaTehtavaNappi = document.getElementById('lisaa-tehtava-nappi');
    tehtavalistaToggle = document.getElementById('tehtavalista-toggle');
    tehtavalistaSisalto = document.getElementById('tehtavalista-sisalto');
    avoimetTehtavatLaskuri = document.getElementById('avoimet-tehtavat-laskuri');
    avaaMenneetModalBtn = document.getElementById('avaa-menneet-modal-btn');
    menneetTapahtumatModal = document.getElementById('menneet-tapahtumat-modal');
    suljeMenneetModalBtn = document.getElementById('sulje-menneet-modal-btn');
    menneetHakuKentta = document.getElementById('menneet-haku-kentta');
    menneetTapahtumatLista = document.getElementById('menneet-tapahtumat-lista');
    edellinenSivuBtn = document.getElementById('edellinen-sivu-btn');
    seuraavaSivuBtn = document.getElementById('seuraava-sivu-btn');
    sivuInfo = document.getElementById('sivu-info');
    tulevatSuodatin = document.getElementById('tulevat-suodatin');
    tulevatPaginationControls = document.getElementById('tulevat-pagination-controls');
    tulevatEdellinenSivuBtn = document.getElementById('tulevat-edellinen-sivu-btn');
    tulevatSeuraavaSivuBtn = document.getElementById('tulevat-seuraava-sivu-btn');
    tulevatSivuInfo = document.getElementById('tulevat-sivu-info');
    lisaaTehtavaHenkilot = document.getElementById('lisaa-tehtava-henkilot');
    avaaArkistoBtn = document.getElementById('avaa-arkisto-btn');
    tehtavaArkistoModal = document.getElementById('tehtava-arkisto-modal');
    suljeArkistoModalBtn = document.getElementById('sulje-arkisto-modal-btn');
    arkistoidutTehtavatLista = document.getElementById('arkistoidut-tehtavat-lista');
    lisaaMaarapaivaToggle = document.getElementById('lisaa-maarapaiva-toggle');
    uusiTehtavaMaarapaiva = document.getElementById('uusi-tehtava-maarapaiva');
}

document.addEventListener('DOMContentLoaded', () => {
    alustaElementit();
    lisaaKuuntelijat();
    onAuthStateChanged(auth, user => {
        if (user) {
            let userName = user.displayName;
            if (!userName && user.email) {
                const emailName = user.email.split('@')[0];
                userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
            if (userName) {
                startAppForUser(userName);
            } else {
                handleLogout();
            }
        } else {
            nykyinenKayttaja = null;
            if (unsubscribeFromEvents) unsubscribeFromEvents();
            if (unsubscribeFromTasks) unsubscribeFromTasks();
            mainContainer.classList.add('hidden');
            loginOverlay.classList.remove('hidden');
            document.body.className = '';
        }
    });
});

function linkify(text) {
    if (!text) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])|(\bwww\.[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        let fullUrl = url;
        if (!fullUrl.startsWith('http')) {
            fullUrl = 'https://' + fullUrl;
        }
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
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
    tanaanBtn.addEventListener('click', () => {
        nykyinenPaiva = new Date();
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
    document.getElementById('kopioi-btn').addEventListener('click', kopioiTapahtuma);
    document.getElementById('tallenna-muutokset-btn').addEventListener('click', tallennaMuutokset);
    document.getElementById('poista-tapahtuma-btn').addEventListener('click', poistaTapahtuma);
    avaaLisaysLomakeBtn.addEventListener('click', () => {
        sivupalkki.classList.toggle('hidden');
    });
    document.getElementById('tapahtuma-alku').addEventListener('input', function() {
        const loppuInput = document.getElementById('tapahtuma-loppu');
        if (!loppuInput.value || loppuInput.value < this.value) {
            loppuInput.value = this.value;
        }
        loppuInput.min = this.value;
    });
    kalenteriGrid.addEventListener('click', handlePaivaClick);
    hakuKentta.addEventListener('input', () => {
        tulevatSivu = 0;
        naytaTulevatTapahtumat();
        korostaHakuOsumatKalenterissa();
    });
    tulevatSuodatin.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('filter-btn')) return;
        tulevatSivu = 0;
        const suodatin = target.dataset.filter;
        const kaikkiBtn = tulevatSuodatin.querySelector('[data-filter="kaikki"]');
        const perheBtn = tulevatSuodatin.querySelector('[data-filter="perhe"]');
        const personBtns = tulevatSuodatin.querySelectorAll('.filter-btn:not([data-filter="kaikki"]):not([data-filter="perhe"])');
        if (suodatin === 'kaikki') {
            personBtns.forEach(btn => btn.classList.remove('active'));
            perheBtn.classList.remove('active');
            kaikkiBtn.classList.add('active');
        } else if (suodatin === 'perhe') {
            personBtns.forEach(btn => btn.classList.remove('active'));
            kaikkiBtn.classList.remove('active');
            perheBtn.classList.toggle('active');
        } else {
            kaikkiBtn.classList.remove('active');
            perheBtn.classList.remove('active');
            target.classList.toggle('active');
        }
        if (!tulevatSuodatin.querySelector('.filter-btn.active')) {
            kaikkiBtn.classList.add('active');
        }
        naytaTulevatTapahtumat();
    });
    tulevatEdellinenSivuBtn.addEventListener('click', () => {
        if (tulevatSivu > 0) {
            tulevatSivu--;
            naytaTulevatTapahtumat();
        }
    });
    tulevatSeuraavaSivuBtn.addEventListener('click', () => {
        tulevatSivu++;
        naytaTulevatTapahtumat();
    });
    document.getElementById('tapahtuma-koko-paiva').addEventListener('change', (e) => {
        toggleLoppuAika(e.target.checked, 'loppu-aika-lisaa-container');
    });
    document.getElementById('muokkaa-tapahtuma-koko-paiva').addEventListener('change', (e) => {
        toggleLoppuAika(e.target.checked, 'loppu-aika-muokkaa-container');
    });
    lisaaTehtavaNappi.addEventListener('click', lisaaTehtava);
    uusiTehtavaTeksti.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lisaaTehtava();
        }
    });
    tehtavalistaToggle.addEventListener('click', () => {
        tehtavalistaSisalto.classList.toggle('hidden');
    });
    lisaaTehtavaHenkilot.addEventListener('click', (e) => {
        if (e.target.classList.contains('assign-btn')) {
            e.target.classList.toggle('active');
        }
    });
    document.querySelectorAll('input[name="lisaa-ketakoskee"], input[name="muokkaa-ketakoskee"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const form = e.target.closest('form');
            const name = e.target.name;
            const perheBox = form.querySelector(`input[name="${name}"][value="perhe"]`);
            const personBoxes = Array.from(form.querySelectorAll(`input[name="${name}"]:not([value="perhe"])`));
            if (e.target.value === 'perhe') {
                personBoxes.forEach(box => box.checked = e.target.checked);
            } else {
                perheBox.checked = personBoxes.every(box => box.checked);
            }
        });
    });
    avaaMenneetModalBtn.addEventListener('click', avaaMenneetModal);
    suljeMenneetModalBtn.addEventListener('click', suljeMenneetModal);
    menneetTapahtumatModal.addEventListener('click', (e) => { if(e.target === menneetTapahtumatModal) suljeMenneetModal() });
    menneetHakuKentta.addEventListener('input', () => {
        menneetSivu = 0;
        naytaMenneetTapahtumat();
    });
    edellinenSivuBtn.addEventListener('click', () => {
        if (menneetSivu > 0) {
            menneetSivu--;
            naytaMenneetTapahtumat();
        }
    });
    seuraavaSivuBtn.addEventListener('click', () => {
        menneetSivu++;
        naytaMenneetTapahtumat();
    });
    avaaArkistoBtn.addEventListener('click', avaaArkisto);
    suljeArkistoModalBtn.addEventListener('click', () => tehtavaArkistoModal.classList.add('hidden'));
    tehtavaArkistoModal.addEventListener('click', (e) => { if(e.target === tehtavaArkistoModal) tehtavaArkistoModal.classList.add('hidden') });
    lisaaMaarapaivaToggle.addEventListener('change', (e) => {
        uusiTehtavaMaarapaiva.classList.toggle('hidden', !e.target.checked);
    });
    
    // Poistodialogin event listenerit
    document.getElementById('sulje-poista-toistuva-btn').addEventListener('click', suljePoistaToistuvaDialogi);
    document.getElementById('peruuta-poista-toistuva-btn').addEventListener('click', suljePoistaToistuvaDialogi);
    document.getElementById('vahvista-poista-toistuva-btn').addEventListener('click', vahvistaPoistaToistuva);
    document.getElementById('poista-toistuva-modal').addEventListener('click', (e) => {
        if (e.target.id === 'poista-toistuva-modal') {
            suljePoistaToistuvaDialogi();
        }
    });
    
    // Näkymänvaihtopainikkeet
    document.querySelectorAll('.nakyman-nappi').forEach(btn => {
        btn.addEventListener('click', () => {
            vaihdaNakyma(btn.dataset.nakyma);
        });
    });
}

function avaaMenneetModal() {
    menneetSivu = 0;
    menneetHakuKentta.value = '';
    naytaMenneetTapahtumat();
    menneetTapahtumatModal.classList.remove('hidden');
}

function suljeMenneetModal() {
    menneetTapahtumatModal.classList.add('hidden');
}

function naytaMenneetTapahtumat() {
    if (!window.kaikkiTapahtumat) return;
    const hakutermi = menneetHakuKentta.value.toLowerCase().trim();
    const nyt = new Date();
    const kaikkiMenneet = window.kaikkiTapahtumat
        .filter(t => {
            const onMennossa = new Date(t.loppu) < nyt;
            if (!onMennossa || !t.nakyvyys?.[nykyinenKayttaja]) return false;
            if (hakutermi) {
                const otsikko = (t.otsikko || '').toLowerCase();
                const kuvaus = (t.kuvaus || '').toLowerCase();
                return otsikko.includes(hakutermi) || kuvaus.includes(hakutermi);
            }
            return true;
        })
        .sort((a, b) => new Date(b.alku) - new Date(a.alku));
    const sivujaYhteensa = Math.ceil(kaikkiMenneet.length / TAPAHTUMIA_PER_SIVU);
    const alkuIndeksi = menneetSivu * TAPAHTUMIA_PER_SIVU;
    const sivunTapahtumat = kaikkiMenneet.slice(alkuIndeksi, alkuIndeksi + TAPAHTUMIA_PER_SIVU);
    sivuInfo.textContent = `Sivu ${menneetSivu + 1} / ${sivujaYhteensa || 1}`;
    edellinenSivuBtn.disabled = menneetSivu === 0;
    seuraavaSivuBtn.disabled = menneetSivu + 1 >= sivujaYhteensa;
    menneetTapahtumatLista.innerHTML = '';
    if (sivunTapahtumat.length === 0) {
        menneetTapahtumatLista.innerHTML = `<p style="text-align:center; opacity:0.7;">${hakutermi ? 'Haulla ei löytynyt' : 'Ei'} menneitä tapahtumia.</p>`;
        return;
    }
    sivunTapahtumat.forEach(tapahtuma => {
        const alku = new Date(tapahtuma.alku);
        const loppu = new Date(tapahtuma.loppu);
        let aikaTeksti;
        const alkuPvmStr = alku.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
        if (alku.toLocaleDateString() !== loppu.toLocaleDateString()) {
            const loppuPvmStr = loppu.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });
            aikaTeksti = `${alkuPvmStr} - ${loppuPvmStr}`;
        } else if (tapahtuma.kokoPaiva) {
            aikaTeksti = `${alkuPvmStr}, Koko päivän`;
        } else {
            const alkuAika = alku.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            const loppuAika = loppu.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            aikaTeksti = `${alkuPvmStr} ${alkuAika} - ${loppuAika}`;
        }
        const item = document.createElement('div');
        item.className = 'tuleva-tapahtuma-item';
        const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
        if (tiedot.type === 'class') {
            item.classList.add(tiedot.value);
        } else {
            item.style.background = tiedot.value;
        }
        item.innerHTML = `
            <div class="tapahtuma-item-luoja">${tiedot.initialit}</div>
            <div class="tapahtuma-item-tiedot">
                <div class="tapahtuma-item-aika">${aikaTeksti}</div>
                <div class="tapahtuma-item-otsikko">${tapahtuma.otsikko}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            suljeMenneetModal();
            avaaTapahtumaIkkuna(tapahtuma.key);
        });
        menneetTapahtumatLista.appendChild(item);
    });
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            loginError.classList.add('hidden');
            loginForm.reset();
        })
        .catch((error) => {
            console.error("Kirjautumisvirhe:", error.message);
            loginError.classList.remove('hidden');
        });
}

function handleLogout() {
    signOut(auth).catch(error => console.error("Uloskirjautumisvirhe:", error));
}

function startAppForUser(userName) {
    if (nykyinenKayttaja === userName && !mainContainer.classList.contains('hidden')) return;
    nykyinenKayttaja = userName;
    mainContainer.classList.remove('hidden');
    loginOverlay.classList.add('hidden');
    currentUserName.textContent = nykyinenKayttaja;
    applyTheme(nykyinenKayttaja);
    paivitaTanaanBanneri();
    setInterval(paivitaTanaanBanneri, 60000); 
    sivupalkki.classList.add('hidden');
    kuunteleTapahtumia();
    kuunteleTehtavia();
}

function kuunteleTapahtumia() {
    if (unsubscribeFromEvents) unsubscribeFromEvents();
    const tapahtumatRef = ref(database, 'tapahtumat');
    unsubscribeFromEvents = onValue(tapahtumatRef, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((child) => {
            window.kaikkiTapahtumat.push({ key: child.key, ...child.val() });
        });
        piirraKalenteri();
        naytaTulevatTapahtumat();
    });
}

function toggleLoppuAika(isChecked, containerId) {
    const container = document.getElementById(containerId);
    const input = container.querySelector('input[type="datetime-local"]');
    if (isChecked) {
        container.classList.add('hidden');
        input.required = false;
    } else {
        container.classList.remove('hidden');
        input.required = true;
    }
}

function handlePaivaClick(event) {
    const paivaEl = event.target.closest('.paiva');
    if (!paivaEl || paivaEl.classList.contains('tyhja') || event.target.closest('.tapahtuma-kuvake') || event.target.closest('.tapahtuma-palkki')) {
        return;
    }
    const pvmString = paivaEl.dataset.paivamaara;
    if (!pvmString) return;
    sivupalkki.classList.remove('hidden');
    const alkuInput = document.getElementById('tapahtuma-alku');
    const loppuInput = document.getElementById('tapahtuma-loppu');
    const oletusAika = "T09:00";
    alkuInput.value = pvmString + oletusAika;
    loppuInput.value = pvmString + oletusAika;
    loppuInput.min = alkuInput.value;
    document.getElementById('tapahtuma-otsikko').focus();
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

function paivitaTanaanBanneri() {
    const tanaanBanneri = document.getElementById('tanaan-banneri');
    if (tanaanBanneri) {
        const nyt = new Date();
        const viikonpaiva = nyt.toLocaleDateString('fi-FI', { weekday: 'long' });
        const paivamaara = nyt.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long' });
        const aika = nyt.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        tanaanBanneri.innerHTML = `Tänään on ${viikonpaiva} ${paivamaara}, kello on ${aika}`;
    }
}

function naytaIlmoitus(viesti) {
    const ilmoitus = document.getElementById('ilmoitus');
    ilmoitus.textContent = viesti;
    ilmoitus.classList.add('nayta');
    setTimeout(() => {
        ilmoitus.classList.remove('nayta');
    }, 3000);
}

function vaihdaNakyma(uusiNakyma) {
    if (nykyinenNakyma === uusiNakyma) return;
    
    // Päivitä active-tila painikkeissa
    document.querySelectorAll('.nakyman-nappi').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.nakyma === uusiNakyma) {
            btn.classList.add('active');
        }
    });
    
    nykyinenNakyma = uusiNakyma;
    
    // Piirrä uusi näkymä
    switch (uusiNakyma) {
        case 'kuukausi':
            piirraKalenteri();
            break;
        case 'viikko':
            piirraViikkonakyma();
            break;
        case 'paiva':
            piirraPaivanakyma();
            break;
    }
}

function piirraViikkonakyma() {
    kalenteriGrid.innerHTML = '';
    kalenteriPaivatOtsikot.innerHTML = '';
    
    // Näytä viikonpäivät
    ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].forEach(p => {
        kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', `<div class="viikonpaiva">${p}</div>`);
    });
    
    // Laske viikon alku (maanantai)
    const viikonAlku = new Date(nykyinenPaiva);
    const paivaViikossa = viikonAlku.getDay() || 7; // Sunnuntai = 7
    viikonAlku.setDate(viikonAlku.getDate() - (paivaViikossa - 1));
    
    // Päivitä otsikko
    const viikonLoppu = new Date(viikonAlku);
    viikonLoppu.setDate(viikonLoppu.getDate() + 6);
    kuukausiOtsikko.textContent = `Viikko ${getWeekNumber(viikonAlku)}: ${viikonAlku.toLocaleDateString('fi-FI', {day: 'numeric', month: 'short'})} - ${viikonLoppu.toLocaleDateString('fi-FI', {day: 'numeric', month: 'short'})}`;
    
    // Luo viikon päivät
    for (let i = 0; i < 7; i++) {
        const paiva = new Date(viikonAlku);
        paiva.setDate(viikonAlku.getDate() + i);
        
        const pvmString = `${paiva.getFullYear()}-${String(paiva.getMonth() + 1).padStart(2, '0')}-${String(paiva.getDate()).padStart(2, '0')}`;
        const tanaanString = new Date().toISOString().split('T')[0];
        
        let paivaLuokat = "paiva viikko-paiva";
        if (pvmString === tanaanString) paivaLuokat += " tanaan";
        
        // Tarkista pyhäpäivä
        const pyhanNimi = onkoPyhapäiva(paiva);
        let paivaSisalto = `<div class="paiva-numero">${paiva.getDate()}</div>`;
        
        if (pyhanNimi) {
            paivaLuokat += " pyhapaiva";
            paivaSisalto += `<div class="pyha-merkki">🎅</div>`;
        }
        
        paivaSisalto += `<div class="tapahtumat-container"></div>`;
        
        kalenteriGrid.insertAdjacentHTML('beforeend', 
            `<div class="${paivaLuokat}" data-paivamaara="${pvmString}" title="${pyhanNimi || ''}">${paivaSisalto}</div>`
        );
    }
    
    naytaTapahtumatKalenterissa();
}

function piirraPaivanakyma() {
    kalenteriGrid.innerHTML = '';
    kalenteriPaivatOtsikot.innerHTML = '';
    
    // Päivitä otsikko
    kuukausiOtsikko.textContent = nykyinenPaiva.toLocaleDateString('fi-FI', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const pvmString = `${nykyinenPaiva.getFullYear()}-${String(nykyinenPaiva.getMonth() + 1).padStart(2, '0')}-${String(nykyinenPaiva.getDate()).padStart(2, '0')}`;
    
    // Tarkista pyhäpäivä
    const pyhanNimi = onkoPyhapäiva(nykyinenPaiva);
    
    let paivaLuokat = "paiva paiva-nakyma";
    if (pvmString === new Date().toISOString().split('T')[0]) paivaLuokat += " tanaan";
    if (pyhanNimi) paivaLuokat += " pyhapaiva";
    
    let paivaSisalto = `
        <div class="paiva-otsikko">
            <div class="paiva-numero">${nykyinenPaiva.getDate()}</div>
            <div class="paiva-kuukausi">${nykyinenPaiva.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })}</div>
            ${pyhanNimi ? `<div class="pyha-nimi">${pyhanNimi}</div>` : ''}
        </div>
        <div class="tapahtumat-container"></div>
    `;
    
    kalenteriGrid.insertAdjacentHTML('beforeend', 
        `<div class="${paivaLuokat}" data-paivamaara="${pvmString}">${paivaSisalto}</div>`
    );
    
    naytaTapahtumatKalenterissa();
}

function onkoPyhapäiva(pvm) {
    const kuukausi = pvm.getMonth() + 1;
    const paiva = pvm.getDate();
    const avain = `${kuukausi}-${paiva}`;
    
    // Tarkista kiinteät pyhäpäivät
    if (SUOMALAISET_PYHAPAIVAT[avain]) {
        return SUOMALAISET_PYHAPAIVAT[avain];
    }
    
    // Tarkista liikkuvat pyhäpäivät
    const vuosi = pvm.getFullYear();
    const liikkuvat = getLiikkuvatPyhat(vuosi);
    const liikuva = liikkuvat.find(p => p.pvm === avain);
    
    return liikuva ? liikuva.nimi : null;
}

function piirraKalenteri() {
    kalenteriGrid.innerHTML = '';
    kalenteriPaivatOtsikot.innerHTML = '';
    kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', '<div class="viikonpaiva"></div>');
    ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].forEach(p => kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', `<div class="viikonpaiva">${p}</div>`));
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();
    kuukausiOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${vuosi}`;
    const ekaKuunPaiva = new Date(vuosi, kuukausi, 1);
    const nyt = new Date();
    const tanaanString = `${nyt.getFullYear()}-${String(nyt.getMonth() + 1).padStart(2, '0')}-${String(nyt.getDate()).padStart(2, '0')}`;
    const paivaViikossa = ekaKuunPaiva.getDay() === 0 ? 7 : ekaKuunPaiva.getDay();
    const kalenterinAloitus = new Date(ekaKuunPaiva);
    kalenterinAloitus.setDate(ekaKuunPaiva.getDate() - (paivaViikossa - 1));
    let paivaIt = new Date(kalenterinAloitus);
    for (let i = 0; i < 6; i++) {
        kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="viikko-nro">${getWeekNumber(paivaIt)}</div>`);
        for (let j = 0; j < 7; j++) {
            const pvmString = `${paivaIt.getFullYear()}-${String(paivaIt.getMonth() + 1).padStart(2, '0')}-${String(paivaIt.getDate()).padStart(2, '0')}`;
            let paivaLuokat = "paiva";
            if (paivaIt.getMonth() !== kuukausi) paivaLuokat += " tyhja";
            if (pvmString === tanaanString) paivaLuokat += " tanaan";
            
            // Tarkista onko pyhäpäivä
            const pyhanNimi = onkoPyhapäiva(paivaIt);
            if (pyhanNimi) {
                paivaLuokat += " pyhapaiva";
                kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="${paivaLuokat}" data-paivamaara="${pvmString}" title="${pyhanNimi}"><div class="paiva-numero">${paivaIt.getDate()}</div><div class="pyha-merkki">🎅</div><div class="tapahtumat-container"></div></div>`);
            } else {
                kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="${paivaLuokat}" data-paivamaara="${pvmString}"><div class="paiva-numero">${paivaIt.getDate()}</div><div class="tapahtumat-container"></div></div>`);
            }
            paivaIt.setDate(paivaIt.getDate() + 1);
        }
        if (paivaIt.getMonth() !== kuukausi && paivaIt.getDay() === 1) break;
    }
    naytaTapahtumatKalenterissa();
    korostaHakuOsumatKalenterissa();
}

function lisaaTapahtuma() {
    const kokoPaivaCheckbox = document.getElementById('tapahtuma-koko-paiva');
    const alkuInput = document.getElementById('tapahtuma-alku');
    let alkuAika, loppuAika;
    if (kokoPaivaCheckbox.checked) {
        const paivamaara = alkuInput.value.substring(0, 10);
        if(!paivamaara) return alert('Valitse päivämäärä ensin, tai poista "Koko päivän" valinta.');
        alkuAika = `${paivamaara}T00:00`;
        loppuAika = `${document.getElementById('tapahtuma-loppu').value.substring(0,10)}T23:59`;
    } else {
        alkuAika = alkuInput.value;
        loppuAika = document.getElementById('tapahtuma-loppu').value;
    }
    const koskeeValinnat = Array.from(document.querySelectorAll('input[name="lisaa-ketakoskee"]:checked')).map(cb => cb.value).filter(value => value !== 'perhe');
    if (koskeeValinnat.length === 0 && document.querySelector('input[name="lisaa-ketakoskee"][value="perhe"]:checked')) {
        koskeeValinnat.push('perhe');
    }
    // Kerää toistumisasetukset
    const toistuminen = {
        tyyppi: document.getElementById('toistuminen-tyyppi').value,
        paattyy: document.getElementById('toistuminen-paattyy').value || null
    };
    const uusi = {
        otsikko: document.getElementById('tapahtuma-otsikko').value,
        kuvaus: document.getElementById('tapahtuma-kuvaus').value,
        alku: alkuAika, loppu: loppuAika, kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('tapahtuma-linkki').value,
        luoja: nykyinenKayttaja, ketakoskee: koskeeValinnat,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {}),
        toistuminen: toistuminen
    };
    if (!uusi.otsikko || !uusi.alku || !uusi.loppu || koskeeValinnat.length === 0) return alert('Täytä vähintään otsikko, päivämäärä ja ketä tapahtuma koskee.');
    // Luo toistuvat tapahtumat
    if (toistuminen.tyyppi !== 'ei') {
        luoToistuvatTapahtumat(uusi);
    } else {
        push(ref(database, 'tapahtumat'), uusi).then(() => {
            lisaaLomake.reset();
            sivupalkki.classList.add('hidden');
            toggleLoppuAika(false, 'loppu-aika-lisaa-container');
            naytaIlmoitus('Tapahtuma lisätty onnistuneesti!');
        });
    }
}

// Luo toistuvat tapahtumat
function luoToistuvatTapahtumat(perusTapahtuma) {
    const toistuminen = perusTapahtuma.toistuminen;
    const alkuPvm = new Date(perusTapahtuma.alku);
    const loppuPvm = new Date(perusTapahtuma.loppu);
    const paattyyPvm = toistuminen.paattyy ? new Date(toistuminen.paattyy) : null;
    
    // Luo uniikki sarja-ID
    const sarjaId = 'sarja_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const tapahtumat = [];
    let nykyinenPvm = new Date(alkuPvm);
    let sarjaIndeksi = 0;
    
    while ((!paattyyPvm || nykyinenPvm <= paattyyPvm) && tapahtumat.length < 100) { // Rajoitus 100 tapahtumaan
        const tapahtuma = { ...perusTapahtuma };
        
        // Laske uudet aikaleimat
        const kestoMs = loppuPvm.getTime() - alkuPvm.getTime();
        tapahtuma.alku = nykyinenPvm.toISOString();
        tapahtuma.loppu = new Date(nykyinenPvm.getTime() + kestoMs).toISOString();
        
        // Lisää sarjatunnisteet
        tapahtuma.sarjaId = sarjaId;
        tapahtuma.sarjaIndeksi = sarjaIndeksi;
        tapahtuma.onToistuva = true;
        
        // Poista toistumistiedot (ei tarvita yksittäisissä tapahtumissa)
        delete tapahtuma.toistuminen;
        
        tapahtumat.push(tapahtuma);
        sarjaIndeksi++;
        
        // Siirry seuraavaan toistumiseen
        switch (toistuminen.tyyppi) {
            case 'paivittain':
                nykyinenPvm.setDate(nykyinenPvm.getDate() + 1);
                break;
            case 'viikoittain':
                nykyinenPvm.setDate(nykyinenPvm.getDate() + 7);
                break;
            case 'kuukausittain':
                nykyinenPvm.setMonth(nykyinenPvm.getMonth() + 1);
                break;
        }
    }
    
    // Tallenna kaikki tapahtumat kerralla
    const tallennusPromises = tapahtumat.map(tapahtuma => 
        push(ref(database, 'tapahtumat'), tapahtuma)
    );
    
    Promise.all(tallennusPromises).then(() => {
        lisaaLomake.reset();
        sivupalkki.classList.add('hidden');
        toggleLoppuAika(false, 'loppu-aika-lisaa-container');
        naytaIlmoitus(`Luotu ${tapahtumat.length} toistuvaa tapahtumaa!`);
    }).catch(error => {
        console.error('Toistuvien tapahtumien luonti epäonnistui:', error);
        naytaIlmoitus('Virhe toistuvien tapahtumien luonnissa!');
    });
}

function luoKoskeeTiedot(ketakoskee) {
    if (!Array.isArray(ketakoskee) || ketakoskee.length === 0) {
        const nimi = typeof ketakoskee === 'string' ? ketakoskee : 'perhe';
        return { initialit: nimi.charAt(0).toUpperCase(), type: 'class', value: `koskee-${nimi.toLowerCase()}` };
    }
    if (ketakoskee.includes('perhe') || ketakoskee.length >= 3) {
        return { initialit: 'P', type: 'class', value: 'koskee-perhe' };
    }
    if (ketakoskee.length === 1) {
        const nimi = ketakoskee[0];
        return { initialit: nimi.charAt(0).toUpperCase(), type: 'class', value: `koskee-${nimi.toLowerCase()}` };
    }
    const sortedNames = ketakoskee.sort();
    const initialit = sortedNames.map(nimi => nimi.charAt(0).toUpperCase()).join('');
    const varit = sortedNames.map(nimi => KAYTTAJA_VARIT[nimi] || '#333');
    return { initialit: initialit, type: 'style', value: `linear-gradient(45deg, ${varit.join(', ')})` };
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    const nakyvatTapahtumat = window.kaikkiTapahtumat.filter(t => t.nakyvyys?.[nykyinenKayttaja] && t.alku);
    nakyvatTapahtumat.forEach(tapahtuma => {
        const alkuPvm = new Date(tapahtuma.alku);
        const loppuPvm = new Date(tapahtuma.loppu);
        const alkuAikaNolla = new Date(alkuPvm).setHours(0,0,0,0);
        const loppuAikaNolla = new Date(loppuPvm).setHours(0,0,0,0);
        const onMonipaivainenTaiKokoPaiva = alkuAikaNolla !== loppuAikaNolla || tapahtuma.kokoPaiva;
        if (onMonipaivainenTaiKokoPaiva) {
            let currentDate = new Date(alkuAikaNolla);
            const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
            while (currentDate <= loppuAikaNolla) {
                const pvmString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                const paivaEl = document.querySelector(`.paiva[data-paivamaara="${pvmString}"]`);
                if (paivaEl) {
                    const palkki = document.createElement('div');
                    palkki.className = 'tapahtuma-palkki';
                    palkki.title = tapahtuma.otsikko;
                    if (tiedot.type === 'class') {
                        const key = tiedot.value.replace('koskee-', '');
                        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                        palkki.style.backgroundColor = KAYTTAJA_VARIT[capitalizedKey] || KAYTTAJA_VARIT.perhe;
                    } else {
                        palkki.style.background = tiedot.value;
                    }
                    if (currentDate.getTime() === alkuAikaNolla) {
                         palkki.textContent = tiedot.initialit;
                    } else {
                        palkki.innerHTML = '&gt;';
                    }
                    palkki.addEventListener('click', (e) => {
                        e.stopPropagation();
                        avaaTapahtumaIkkuna(tapahtuma.key);
                    });
                    paivaEl.querySelector('.tapahtumat-container').appendChild(palkki);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    });
    nakyvatTapahtumat.forEach(tapahtuma => {
        const alkuPvm = new Date(tapahtuma.alku);
        const loppuPvm = new Date(tapahtuma.loppu);
        const alkuAikaNolla = new Date(alkuPvm).setHours(0,0,0,0);
        const loppuAikaNolla = new Date(loppuPvm).setHours(0,0,0,0);
        const onYksittainenJaAjastettu = alkuAikaNolla === loppuAikaNolla && !tapahtuma.kokoPaiva;
        if (onYksittainenJaAjastettu) {
            const paivaEl = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
            if (paivaEl) {
                const kuvake = document.createElement('div');
                kuvake.title = tapahtuma.otsikko;
                const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
                kuvake.textContent = tiedot.initialit;
                kuvake.className = 'tapahtuma-kuvake';
                if (tiedot.type === 'class') {
                    kuvake.classList.add(tiedot.value);
                } else {
                    kuvake.style.background = tiedot.value;
                }
                kuvake.addEventListener('click', (e) => {
                    e.stopPropagation();
                    avaaTapahtumaIkkuna(tapahtuma.key);
                });
                paivaEl.querySelector('.tapahtumat-container').appendChild(kuvake);
            }
        }
    });
}

function naytaTulevatTapahtumat() {
    tulevatTapahtumatLista.innerHTML = '';
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    const hakutermi = hakuKentta.value.toLowerCase();
    const nyt = new Date();
    const aktiivisetSuotimet = Array.from(tulevatSuodatin.querySelectorAll('.filter-btn.active')).map(btn => btn.dataset.filter);
    const suodatetutTulevat = window.kaikkiTapahtumat.filter(t => {
        const nakyvyysJaAikaOk = t.nakyvyys?.[nykyinenKayttaja] && new Date(t.loppu) >= nyt;
        if (!nakyvyysJaAikaOk) return false;
        if (hakutermi) {
            const otsikko = (t.otsikko || '').toLowerCase();
            const kuvaus = (t.kuvaus || '').toLowerCase();
            if (!otsikko.includes(hakutermi) && !kuvaus.includes(hakutermi)) {
                return false;
            }
        }
        if (aktiivisetSuotimet.includes('kaikki')) {
            return true;
        }
        const ketakoskee = Array.isArray(t.ketakoskee) ? t.ketakoskee : [String(t.ketakoskee)];
        return aktiivisetSuotimet.every(suodin => ketakoskee.includes(suodin));
    }).sort((a, b) => new Date(a.alku) - new Date(b.alku));
    const sivujaYhteensa = Math.ceil(suodatetutTulevat.length / TAPAHTUMIA_PER_SIVU);
    if (sivujaYhteensa > 1) {
        tulevatPaginationControls.classList.remove('hidden');
        tulevatSivuInfo.textContent = `Sivu ${tulevatSivu + 1} / ${sivujaYhteensa}`;
        tulevatEdellinenSivuBtn.disabled = tulevatSivu === 0;
        tulevatSeuraavaSivuBtn.disabled = tulevatSivu + 1 >= sivujaYhteensa;
    } else {
        tulevatPaginationControls.classList.add('hidden');
    }
    const alkuIndeksi = tulevatSivu * TAPAHTUMIA_PER_SIVU;
    const sivunTapahtumat = suodatetutTulevat.slice(alkuIndeksi, alkuIndeksi + TAPAHTUMIA_PER_SIVU);
    if (sivunTapahtumat.length === 0) {
        tulevatTapahtumatLista.innerHTML = `<p>Valinnoilla ei löytynyt tulevia tapahtumia.</p>`;
        return;
    }
    sivunTapahtumat.forEach(tapahtuma => {
        const alku = new Date(tapahtuma.alku);
        const loppu = new Date(tapahtuma.loppu);
        let aikaTeksti;
        const alkuPvmStr = alku.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
        if (alku.toLocaleDateString() !== loppu.toLocaleDateString()) {
            const loppuPvmStr = loppu.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
            aikaTeksti = `${alkuPvmStr} - ${loppuPvmStr}`;
        } else if (tapahtuma.kokoPaiva) {
            aikaTeksti = `${alkuPvmStr}, Koko päivän`;
        } else {
            const alkuAika = alku.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            const loppuAika = loppu.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            aikaTeksti = `${alkuPvmStr} ${alkuAika} - ${loppuAika}`;
        }
        const item = document.createElement('div');
        item.className = 'tuleva-tapahtuma-item';
        const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
        if (tiedot.type === 'class') {
            item.classList.add(tiedot.value);
        } else {
            item.style.background = tiedot.value;
        }
        item.innerHTML = `<div class="tapahtuma-item-luoja">${tiedot.initialit}</div><div class="tapahtuma-item-tiedot"><div class="tapahtuma-item-aika">${aikaTeksti}</div><div class="tapahtuma-item-otsikko">${tapahtuma.otsikko}</div></div>`;
        item.addEventListener('click', () => avaaTapahtumaIkkuna(tapahtuma.key));
        tulevatTapahtumatLista.appendChild(item);
    });
}

function korostaHakuOsumatKalenterissa() {
    document.querySelectorAll('.paiva.haku-osuma').forEach(el => el.classList.remove('haku-osuma'));
    const hakutermi = hakuKentta.value.toLowerCase().trim();
    if (hakutermi === '' || !window.kaikkiTapahtumat) return;
    const osumat = window.kaikkiTapahtumat.filter(t => {
        if (!t.nakyvyys?.[nykyinenKayttaja]) return false;
        const otsikko = (t.otsikko || '').toLowerCase();
        const kuvaus = (t.kuvaus || '').toLowerCase();
        return otsikko.includes(hakutermi) || kuvaus.includes(hakutermi);
    });
    osumat.forEach(tapahtuma => {
        const paivaEl = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
        if (paivaEl) paivaEl.classList.add('haku-osuma');
    });
}

function avaaTapahtumaIkkuna(key) {
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    if (!tapahtuma) return;
    modalOverlay.dataset.tapahtumaId = key;
    document.getElementById('view-otsikko').textContent = tapahtuma.otsikko;
    const kuvausElementti = document.getElementById('view-kuvaus');
    const kuvausTeksti = tapahtuma.kuvaus || 'Ei lisätietoja.';
    kuvausElementti.innerHTML = linkify(kuvausTeksti);
    document.getElementById('view-luoja').textContent = tapahtuma.luoja;
    document.getElementById('view-nakyvyys').textContent = Object.keys(tapahtuma.nakyvyys || {}).filter(k => tapahtuma.nakyvyys[k]).join(', ');
    const koskeeSpan = document.getElementById('view-koskee');
    const koskeeTieto = Array.isArray(tapahtuma.ketakoskee) ? tapahtuma.ketakoskee : [String(tapahtuma.ketakoskee)];
    koskeeSpan.textContent = (koskeeTieto.includes('perhe') || koskeeTieto.length >= 3) ? 'Koko perhe' : koskeeTieto.join(', ');
    const alkuPvm = new Date(tapahtuma.alku);
    const loppuPvm = new Date(tapahtuma.loppu);
    const onMonipaivainenTaiKokoPaiva = tapahtuma.kokoPaiva || (new Date(loppuPvm).setHours(0,0,0,0) > new Date(alkuPvm).setHours(0,0,0,0));
    if (onMonipaivainenTaiKokoPaiva) {
        const alkuPvmStr = new Date(tapahtuma.alku).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long' });
        const loppuPvmStr = new Date(tapahtuma.loppu).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('view-aika').textContent = `${alkuPvmStr} - ${loppuPvmStr}`;
    } else {
        const options = { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        document.getElementById('view-aika').textContent = `${new Date(tapahtuma.alku).toLocaleString('fi-FI', options)} - ${new Date(tapahtuma.loppu).toLocaleString('fi-FI', options)}`;
    }
    const linkkiContainer = document.getElementById('view-linkki-container');
    if (tapahtuma.linkki) {
        document.getElementById('view-linkki').href = tapahtuma.linkki;
        linkkiContainer.classList.remove('hidden');
    } else {
        linkkiContainer.classList.add('hidden');
    }
    document.getElementById('muokkaa-tapahtuma-id').value = key;
    document.getElementById('muokkaa-tapahtuma-otsikko').value = tapahtuma.otsikko;
    document.getElementById('muokkaa-tapahtuma-kuvaus').value = tapahtuma.kuvaus || '';
    document.getElementById('muokkaa-tapahtuma-alku').value = tapahtuma.alku;
    document.getElementById('muokkaa-tapahtuma-loppu').value = tapahtuma.loppu;
    document.getElementById('muokkaa-tapahtuma-linkki').value = tapahtuma.linkki || '';
    const muokkaaKokoPaivaCheckbox = document.getElementById('muokkaa-tapahtuma-koko-paiva');
    muokkaaKokoPaivaCheckbox.checked = !!tapahtuma.kokoPaiva;
    toggleLoppuAika(muokkaaKokoPaivaCheckbox.checked, 'loppu-aika-muokkaa-container');
    document.querySelectorAll('input[name="muokkaa-nakyvyys"]').forEach(cb => {
       cb.checked = !!tapahtuma.nakyvyys?.[cb.value];
    });
    const ketakoskee = Array.isArray(tapahtuma.ketakoskee) ? tapahtuma.ketakoskee : [String(tapahtuma.ketakoskee)];
    document.querySelectorAll('input[name="muokkaa-ketakoskee"]').forEach(cb => {
        cb.checked = ketakoskee.includes(cb.value);
    });
    const perheBox = document.querySelector('input[name="muokkaa-ketakoskee"][value="perhe"]');
    const personBoxes = Array.from(document.querySelectorAll('input[name="muokkaa-ketakoskee"]:not([value="perhe"])'));
    if (ketakoskee.includes('perhe')) {
        perheBox.checked = true;
        personBoxes.forEach(box => box.checked = true);
    } else {
        perheBox.checked = personBoxes.every(box => box.checked);
    }
    
    // Täytä toistumisasetukset
    const toistuminen = tapahtuma.toistuminen || {};
    document.getElementById('muokkaa-toistuminen-tyyppi').value = toistuminen.tyyppi || 'ei';
    document.getElementById('muokkaa-toistuminen-paattyy').value = toistuminen.paattyy || '';
    
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
    const vanhaTapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    const kokoPaivaCheckbox = document.getElementById('muokkaa-tapahtuma-koko-paiva');
    const alkuInput = document.getElementById('muokkaa-tapahtuma-alku');
    let alkuAika, loppuAika;
    if (kokoPaivaCheckbox.checked) {
        const paivamaara = alkuInput.value.substring(0, 10);
        alkuAika = `${paivamaara}T00:00`;
        loppuAika = `${document.getElementById('muokkaa-tapahtuma-loppu').value.substring(0,10)}T23:59`;
    } else {
        alkuAika = alkuInput.value;
        loppuAika = document.getElementById('muokkaa-tapahtuma-loppu').value;
    }
    const koskeeValinnat = Array.from(document.querySelectorAll('input[name="muokkaa-ketakoskee"]:checked')).map(cb => cb.value).filter(value => value !== 'perhe');
    if (koskeeValinnat.length === 0 && document.querySelector('input[name="muokkaa-ketakoskee"][value="perhe"]:checked')) {
        koskeeValinnat.push('perhe');
    }
    // Kerää toistumisasetukset
    const toistuminen = {
        tyyppi: document.getElementById('muokkaa-toistuminen-tyyppi').value,
        paattyy: document.getElementById('muokkaa-toistuminen-paattyy').value || null
    };
    
    const paivitys = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: alkuAika, loppu: loppuAika, kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('muokkaa-tapahtuma-linkki').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {}),
        ketakoskee: koskeeValinnat, luoja: vanhaTapahtuma.luoja,
        toistuminen: toistuminen
    };
    update(ref(database, `tapahtumat/${key}`), paivitys).then(() => {
        const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
        if (tapahtuma) Object.assign(tapahtuma, paivitys);
        avaaTapahtumaIkkuna(key);
        vaihdaTila('view');
    });
}

function poistaTapahtuma() {
    const key = modalOverlay.dataset.tapahtumaId;
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    
    if (!tapahtuma) return;
    
    // Jos tapahtuma on osa toistuvaa sarjaa, näytä poistodialogi
    if (tapahtuma.onToistuva && tapahtuma.sarjaId) {
        avaaPoistaToistuvaDialogi(tapahtuma);
    } else {
        // Normaali poisto
        if (confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
            remove(ref(database, `tapahtumat/${key}`)).then(() => {
                suljeTapahtumaIkkuna();
                naytaIlmoitus("Tapahtuma poistettu.");
            });
        }
    }
}

// Toistuvan tapahtuman poistodialogi
function avaaPoistaToistuvaDialogi(tapahtuma) {
    const modal = document.getElementById('poista-toistuva-modal');
    modal.dataset.tapahtumaId = tapahtuma.key;
    modal.dataset.sarjaId = tapahtuma.sarjaId;
    modal.dataset.sarjaIndeksi = tapahtuma.sarjaIndeksi;
    
    // Sulje tapahtumanäkymä
    suljeTapahtumaIkkuna();
    
    // Näytä poistodialogi
    modal.classList.remove('hidden');
}

function suljePoistaToistuvaDialogi() {
    const modal = document.getElementById('poista-toistuva-modal');
    modal.classList.add('hidden');
    
    // Tyhjennä dataset
    delete modal.dataset.tapahtumaId;
    delete modal.dataset.sarjaId;
    delete modal.dataset.sarjaIndeksi;
}

function vahvistaPoistaToistuva() {
    const modal = document.getElementById('poista-toistuva-modal');
    const tapahtumaId = modal.dataset.tapahtumaId;
    const sarjaId = modal.dataset.sarjaId;
    const sarjaIndeksi = parseInt(modal.dataset.sarjaIndeksi);
    
    const valittuTapa = document.querySelector('input[name="poista-tapa"]:checked').value;
    
    switch (valittuTapa) {
        case 'yksittainen':
            poistaYksittainenTapahtuma(tapahtumaId);
            break;
        case 'tulevat':
            poistaTulevatSarjasta(sarjaId, sarjaIndeksi);
            break;
        case 'koko-sarja':
            poistaKokoSarja(sarjaId);
            break;
    }
    
    suljePoistaToistuvaDialogi();
}

function poistaYksittainenTapahtuma(tapahtumaId) {
    remove(ref(database, `tapahtumat/${tapahtumaId}`)).then(() => {
        naytaIlmoitus("Tapahtuma poistettu.");
    });
}

function poistaTulevatSarjasta(sarjaId, indeksi) {
    // Hae kaikki saman sarjan tapahtumat
    const sarjanTapahtumat = window.kaikkiTapahtumat.filter(t => t.sarjaId === sarjaId);
    
    // Suodata tapahtumat joiden indeksi on >= nykyinen indeksi
    const poistettavat = sarjanTapahtumat.filter(t => t.sarjaIndeksi >= indeksi);
    
    // Poista kaikki tapahtumat
    const poistoPromises = poistettavat.map(tapahtuma => 
        remove(ref(database, `tapahtumat/${tapahtuma.key}`))
    );
    
    Promise.all(poistoPromises).then(() => {
        naytaIlmoitus(`Poistettu ${poistettavat.length} tapahtumaa sarjasta.`);
    });
}

function poistaKokoSarja(sarjaId) {
    // Hae kaikki saman sarjan tapahtumat
    const sarjanTapahtumat = window.kaikkiTapahtumat.filter(t => t.sarjaId === sarjaId);
    
    // Poista kaikki tapahtumat
    const poistoPromises = sarjanTapahtumat.map(tapahtuma => 
        remove(ref(database, `tapahtumat/${tapahtuma.key}`))
    );
    
    Promise.all(poistoPromises).then(() => {
        naytaIlmoitus(`Poistettu koko sarja (${sarjanTapahtumat.length} tapahtumaa).`);
    });
}

function kopioiTapahtuma() {
    const key = modalOverlay.dataset.tapahtumaId;
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    if (!tapahtuma) return;
    const uusiPvm = prompt("Anna uusi päivämäärä muodossa VVVV-KK-PP:", tapahtuma.alku.substring(0, 10));
    if (!uusiPvm || !/^\d{4}-\d{2}-\d{2}$/.test(uusiPvm)) {
        if (uusiPvm !== null) alert("Päivämäärä oli virheellinen. Kopiointia ei tehty.");
        return;
    }
    const uusiTapahtuma = { ...tapahtuma };
    delete uusiTapahtuma.key; 
    uusiTapahtuma.alku = `${uusiPvm}${tapahtuma.alku.substring(10)}`;
    uusiTapahtuma.loppu = `${uusiPvm}${tapahtuma.loppu.substring(10)}`;
    push(ref(database, 'tapahtumat'), uusiTapahtuma).then(() => {
        naytaIlmoitus(`Tapahtuma kopioitu päivälle ${uusiPvm}.`);
        suljeTapahtumaIkkuna();
    }).catch(error => {
        console.error("Kopiointivirhe:", error);
    });
}

function kuunteleTehtavia() {
    if (unsubscribeFromTasks) unsubscribeFromTasks();
    const tehtavatRef = ref(database, 'tehtavalista');
    unsubscribeFromTasks = onValue(tehtavatRef, (snapshot) => {
        kaikkiTehtavat = [];
        snapshot.forEach(child => {
            kaikkiTehtavat.push({ key: child.key, ...child.val() });
        });
        piirraTehtavalista();
        if (!tehtavaArkistoModal.classList.contains('hidden')) {
            avaaArkisto();
        }
    });
}

function piirraTehtavalista() {
    tehtavatContainer.innerHTML = '';
    const nakyvatTehtavat = kaikkiTehtavat
        .filter(t => t.tila !== 'arkistoitu')
        .sort((a, b) => a.tehty - b.tehty);
    const avoimet = nakyvatTehtavat.filter(t => !t.tehty);
    avoimetTehtavatLaskuri.textContent = `${avoimet.length} avointa`;
    if (nakyvatTehtavat.length === 0) {
        tehtavatContainer.innerHTML = '<p style="text-align:center; opacity:0.7;">Lista on tyhjä.</p>';
        return;
    }
    nakyvatTehtavat.forEach(tehtava => {
        const item = document.createElement('div');
        item.className = 'tehtava-item';
        const tila = maaritaTehtavanTila(tehtava);
        if (tila) {
            item.classList.add(`status-${tila}`);
        }
        rakennaTehtavaItemView(item, tehtava);
        tehtavatContainer.appendChild(item);
    });
}

function rakennaTehtavaItemView(itemElement, tehtava) {
    itemElement.classList.remove('is-editing');
    itemElement.innerHTML = '';
    const vasen = document.createElement('div');
    vasen.className = 'tehtava-vasen';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tehtava.tehty;
    checkbox.addEventListener('change', () => paivitaTehtavanTila(tehtava.key, checkbox.checked));
    const tiedotContainer = document.createElement('div');
    tiedotContainer.className = 'tehtava-tiedot';
    const teksti = document.createElement('p');
    teksti.className = 'tehtava-teksti';
    teksti.textContent = tehtava.teksti;
    const meta = document.createElement('small');
    meta.className = 'tehtava-meta';
    
    let metaTeksti = '';
    if (tehtava.maarapaiva) {
        const pvm = new Date(tehtava.maarapaiva).toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
        metaTeksti += `Määräpäivä: ${pvm} | `;
    }
    metaTeksti += `Lisännyt ${tehtava.luoja}`;
    if (tehtava.muokattuAika) {
        metaTeksti += ` (muokattu ${new Date(tehtava.muokattuAika).toLocaleDateString('fi-FI')})`;
    }

    meta.textContent = metaTeksti;
    tiedotContainer.appendChild(teksti);
    tiedotContainer.appendChild(meta);
    vasen.appendChild(checkbox);
    vasen.appendChild(tiedotContainer);
    const oikea = document.createElement('div');
    oikea.className = 'tehtava-oikea';
    if (tehtava.kohdistettu && tehtava.kohdistettu.length > 0) {
        const kohdistusContainer = document.createElement('div');
        kohdistusContainer.className = 'tehtava-kohdistus';
        tehtava.kohdistettu.forEach(nimi => {
            const pallo = document.createElement('div');
            pallo.className = 'kohdistus-pallo';
            pallo.textContent = nimi.charAt(0).toUpperCase();
            pallo.style.backgroundColor = KAYTTAJA_VARIT[nimi] || '#888';
            pallo.title = nimi;
            kohdistusContainer.appendChild(pallo);
        });
        oikea.appendChild(kohdistusContainer);
    }
    const muokkaaNappi = document.createElement('button');
    muokkaaNappi.className = 'muokkaa-tehtava-nappi';
    muokkaaNappi.innerHTML = '✏️';
    muokkaaNappi.addEventListener('click', () => siirryMuokkaustilaan(itemElement, tehtava));
    const arkistoiNappi = document.createElement('button');
    arkistoiNappi.className = 'arkistoi-tehtava-nappi';
    arkistoiNappi.innerHTML = '📥';
    arkistoiNappi.title = 'Arkistoi';
    arkistoiNappi.addEventListener('click', () => arkistoiTehtava(tehtava.key));
    oikea.appendChild(muokkaaNappi);
    oikea.appendChild(arkistoiNappi);
    itemElement.appendChild(vasen);
    itemElement.appendChild(oikea);
}

function siirryMuokkaustilaan(itemElement, tehtava) {
    itemElement.classList.add('is-editing');
    itemElement.innerHTML = '';
    const vasen = document.createElement('div');
    vasen.className = 'tehtava-vasen';
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = tehtava.teksti;
    editInput.className = 'edit-input';
    const editMaarapaiva = document.createElement('input');
    editMaarapaiva.type = 'datetime-local';
    editMaarapaiva.value = tehtava.maarapaiva || '';
    vasen.appendChild(editInput);
    vasen.appendChild(editMaarapaiva);
    const oikea = document.createElement('div');
    oikea.className = 'tehtava-oikea edit-controls';
    const assignContainer = document.createElement('div');
    assignContainer.className = 'assign-buttons';
    ['Toni', 'Kaisa', 'Oona'].forEach(nimi => {
        const btn = document.createElement('button');
        btn.className = 'assign-btn';
        btn.dataset.assignee = nimi;
        btn.textContent = nimi.charAt(0);
        if (tehtava.kohdistettu && tehtava.kohdistettu.includes(nimi)) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => btn.classList.toggle('active'));
        assignContainer.appendChild(btn);
    });
    const tallennaNappi = document.createElement('button');
    tallennaNappi.textContent = 'Tallenna';
    tallennaNappi.addEventListener('click', () => {
        const uusiTeksti = editInput.value.trim();
        if (uusiTeksti) {
            const uudetKohdistukset = Array.from(assignContainer.querySelectorAll('.assign-btn.active')).map(b => b.dataset.assignee);
            const paivitys = {
                teksti: uusiTeksti,
                kohdistettu: uudetKohdistukset,
                maarapaiva: editMaarapaiva.value || null, // Poistaa kentän, jos se on tyhjä
                muokannut: nykyinenKayttaja,
                muokattuAika: serverTimestamp()
            };
            update(ref(database, `tehtavalista/${tehtava.key}`), paivitys);
        }
    });
    const peruutaNappi = document.createElement('button');
    peruutaNappi.textContent = 'Peruuta';
    peruutaNappi.className = 'cancel-btn';
    peruutaNappi.addEventListener('click', () => rakennaTehtavaItemView(itemElement, tehtava));
    oikea.appendChild(assignContainer);
    oikea.appendChild(tallennaNappi);
    oikea.appendChild(peruutaNappi);
    itemElement.appendChild(vasen);
    itemElement.appendChild(oikea);
    editInput.focus();
}

function lisaaTehtava() {
    const teksti = uusiTehtavaTeksti.value.trim();
    if (teksti === '') return;
    const kohdistetutHenkilot = Array.from(lisaaTehtavaHenkilot.querySelectorAll('.assign-btn.active'))
                                     .map(btn => btn.dataset.assignee);
    const uusiTehtava = {
        teksti: teksti,
        tehty: false,
        luoja: nykyinenKayttaja,
        lisattyAika: serverTimestamp(),
        tila: 'aktiivinen'
    };
    if (kohdistetutHenkilot.length > 0) {
        uusiTehtava.kohdistettu = kohdistetutHenkilot;
    }
    if (lisaaMaarapaivaToggle.checked && uusiTehtavaMaarapaiva.value) {
        uusiTehtava.maarapaiva = uusiTehtavaMaarapaiva.value;
    }
    push(ref(database, 'tehtavalista'), uusiTehtava).then(() => {
        uusiTehtavaTeksti.value = '';
        lisaaTehtavaHenkilot.querySelectorAll('.assign-btn').forEach(btn => btn.classList.remove('active'));
        lisaaMaarapaivaToggle.checked = false;
        uusiTehtavaMaarapaiva.classList.add('hidden');
        uusiTehtavaMaarapaiva.value = '';
    });
}

function paivitaTehtavanTila(key, onkoTehty) {
    update(ref(database, `tehtavalista/${key}`), { tehty: onkoTehty });
}

function arkistoiTehtava(key) {
    update(ref(database, `tehtavalista/${key}`), { tila: 'arkistoitu' });
}

function palautaTehtava(key) {
    update(ref(database, `tehtavalista/${key}`), { tila: 'aktiivinen' });
}

function poistaTehtava(key) {
    if (confirm('Haluatko varmasti poistaa tämän tehtävän lopullisesti? Tätä ei voi perua.')) {
        remove(ref(database, `tehtavalista/${key}`));
    }
}

function avaaArkisto() {
    arkistoidutTehtavatLista.innerHTML = '';
    const arkistoidut = kaikkiTehtavat
        .filter(t => t.tila === 'arkistoitu')
        .sort((a, b) => (a.lisattyAika > b.lisattyAika) ? -1 : 1);
    if (arkistoidut.length === 0) {
        arkistoidutTehtavatLista.innerHTML = '<p style="text-align:center; opacity:0.7;">Arkisto on tyhjä.</p>';
    } else {
        arkistoidut.forEach(tehtava => {
            const item = document.createElement('div');
            item.className = 'arkisto-item';
            
            const teksti = document.createElement('span');
            teksti.className = 'arkisto-item-teksti';
            teksti.textContent = tehtava.teksti;

            const nappulat = document.createElement('div');
            nappulat.className = 'arkisto-item-nappulat';

            const palautaNappi = document.createElement('button');
            palautaNappi.textContent = 'Palauta';
            palautaNappi.className = 'pieni-nappi';
            palautaNappi.addEventListener('click', () => palautaTehtava(tehtava.key));

            const poistaNappi = document.createElement('button');
            poistaNappi.textContent = 'Poista pysyvästi';
            poistaNappi.className = 'delete-btn pieni-nappi';
            poistaNappi.addEventListener('click', () => poistaTehtava(tehtava.key));

            nappulat.appendChild(palautaNappi);
            nappulat.appendChild(poistaNappi);
            item.appendChild(teksti);
            item.appendChild(nappulat);
            arkistoidutTehtavatLista.appendChild(item);
        });
    }

    tehtavaArkistoModal.classList.remove('hidden');
}

function maaritaTehtavanTila(tehtava) {
    if (tehtava.tehty) {
        return 'tehty';
    }
    if (tehtava.maarapaiva) {
        const nyt = new Date();
        const maarapaiva = new Date(tehtava.maarapaiva);
        if (nyt > maarapaiva) {
            return 'myohassa';
        }
        if (maarapaiva - nyt < 86400000) { // 24 tuntia millisekunteina
            return 'kiireellinen';
        }
        return 'ok';
    }
    return ''; // Ei erityistä tilaa
}
