import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp, query, orderByChild, startAt, endAt } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYqAhcMBFeuN6lcXnV9ydP3ltG3zpbFc4",
  authDomain: "kalenteri-pasi.firebaseapp.com",
  databaseURL: "https://kalenteri-pasi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kalenteri-pasi",
  storageBucket: "kalenteri-pasi.firebasestorage.app",
  messagingSenderId: "1054742450874",
  appId: "1:1054742450874:web:67fd5799bb21fc28862883"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// PWA file_handlers: .ics-tiedosto avattu suoraan sovellukseen (esim. c:geo "Lisää kalenteriin")
if ('launchQueue' in window) {
    window.launchQueue.setConsumer((params) => {
        (params.files || []).forEach(async (fh) => {
            try {
                const f = await fh.getFile();
                if (nykyinenKayttaja) tuoIcsTiedosto(f);
                else odottavaIcsTiedosto = f; // kirjautumisen jälkeen
            } catch (e) { console.error('ICS-avaus epäonnistui:', e); }
        });
    });
}

// --- Versio: päivitä AINA kun julkaiset muutoksia (myös sw.js CACHE_NAME!) ---
const VERSIO = '2.8.1';

// --- Vakiot ---
const KAYTTAJA_VARIT = { Toni: '--c-toni', Kaisa: '--c-kaisa', Oona: '--c-oona', perhe: '--c-perhe' };
const HENKILOT = ['Toni', 'Kaisa', 'Oona'];
const KATEGORIAT = {
    tyo:      { nimi: 'Työ',       ikoni: '💼' },
    harrastus:{ nimi: 'Harrastus', ikoni: '🏃' },
    juhlat:   { nimi: 'Juhlat',    ikoni: '🎉' },
    terveys:  { nimi: 'Terveys',   ikoni: '🩺' },
    koulu:    { nimi: 'Koulu',     ikoni: '🏫' },
    ostokset: { nimi: 'Ostokset',  ikoni: '🛒' },
    matka:    { nimi: 'Matka',     ikoni: '✈️' },
    muu:      { nimi: 'Muu',       ikoni: '📌' }
};
const EMOJI_VALINNAT = [
    '🧭','🗺️','📍','🔍','🌲','🏕️','🚗','✈️','⚽','🏀','🎾','🏊','🚴','🎣','🏹','🎯',
    '🎮','🎵','🎨','📚','🍽️','🍕','🎂','☕','💪','🧘','🩺','💊','🦷','👶','🐕','🎁',
    '🎄','🏖️','💰','📝','🔧','🏠','🌳','⛷️'
];
const SYNKKAUS_TAAKSE_PV = 60; // jatkuvaan synkkaan vain ~2 kk taaksepäin — vanhat Historia-välilehdeltä
const TAPAHTUMIA_PER_SIVU = 10;
const AGENDA_PAIVIA_PER_ERÄ = 14;
const AH_ALKU = 6, AH_LOPPU = 24, AH_TPX = 56; // aikahila: tunnit ja pikselikorkeus/tunti
const SARJA_META_KENTAT = ['otsikko', 'kuvaus', 'linkki', 'kategoria', 'ketakoskee', 'nakyvyys', 'kokoPaiva'];

// --- DOM-viittaukset ---
let loginOverlay, loginForm, appShell, appbar, tanaanBanneri, asetuksetBtn, kayttajaPallo,
    nakymaValitsin, navEdellinen, navTanaan, navSeuraava, navOtsikko, nakymat,
    agendaView, agendaLista, agendaLisaaBtn, hakuKentta, tulevatSuodatin, kategoriaSuodatin,
    paivaHila, viikkoHila, kalenteriPaivatOtsikot, kalenteriGrid,
    tulevatTapahtumatLista, tehtavatContainer, uusiTehtavaTeksti, lisaaTehtavaNappi,
    tehtavalistaToggle, tehtavalistaSisalto, avoimetTehtavatLaskuri,
    avaaArkistoBtn, avaaMenneetBtn,
    tabbar, tabTehtavatBadge, fabLisaa, ptrIndikaattori,
    sheetTapahtuma, sheetLomake, sheetLaajuus, sheetArkisto, sheetAsetukset,
    panelHistoria, historiaHaku, historiaSuodatin, historiaKategoria, historiaVuosi,
    historiaSort, historiaLista, historiaLisaaBtn, historiaMaara, historiaTakaisiBtn,
    arkistoidutTehtavatLista, ilmoitusEl;

// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();
let nakymanTyyppi = localStorage.getItem('kalenteri-nakyma') || 'agenda';
let agendaAlkuPvm = paivaNolla(new Date());
let agendaNaytetyt = AGENDA_PAIVIA_PER_ERÄ;
let unsubscribeFromEvents = null;
let unsubscribeFromTasks = null;
let unsubscribeFromCategories = null;
let unsubscribeFromHistory = null;
let historiaVanhat = [];
let odottavaIcsTiedosto = null; // .ics käynnistettiin ennen kirjautumista
let mukautetutKategoriat = {};
let muokattavaKategoriaId = null;
let historiaNaytetyt = 25;
let kaikkiTehtavat = [];
let muistutusAsetukset = { kaytossa: false, ajoitus: 60, tehtavat: false };
let muistutusIntervalli = null;
let banneriIntervalli = null;
let laajuusCallback = null;

function alustaElementit() {
    loginOverlay = document.getElementById('login-overlay');
    loginForm = document.getElementById('login-form');
    appShell = document.getElementById('app-shell');
    tanaanBanneri = document.getElementById('tanaan-banneri');
    asetuksetBtn = document.getElementById('asetukset-btn');
    kayttajaPallo = document.getElementById('kayttaja-pallo');
    nakymaValitsin = document.getElementById('nakyma-valitsin');
    navEdellinen = document.getElementById('nav-edellinen');
    navTanaan = document.getElementById('nav-tanaan');
    navSeuraava = document.getElementById('nav-seuraava');
    navOtsikko = document.getElementById('nav-otsikko');
    nakymat = document.getElementById('nakymat');
    agendaView = document.getElementById('agenda-view');
    agendaLista = document.getElementById('agenda-lista');
    agendaLisaaBtn = document.getElementById('agenda-lisaa-btn');
    hakuKentta = document.getElementById('haku-kentta');
    tulevatSuodatin = document.getElementById('tulevat-suodatin');
    kategoriaSuodatin = document.getElementById('kategoria-suodatin');
    paivaHila = document.getElementById('paiva-aikahila');
    viikkoHila = document.getElementById('viikko-aikahila');
    kalenteriPaivatOtsikot = document.getElementById('kalenteri-paivat-otsikot');
    kalenteriGrid = document.getElementById('kalenteri-grid');
    tulevatTapahtumatLista = document.getElementById('tulevat-tapahtumat-lista');
    tehtavatContainer = document.getElementById('tehtavat-container');
    uusiTehtavaTeksti = document.getElementById('uusi-tehtava-teksti');
    lisaaTehtavaNappi = document.getElementById('lisaa-tehtava-nappi');
    tehtavalistaToggle = document.getElementById('tehtavalista-toggle');
    tehtavalistaSisalto = document.getElementById('tehtavalista-sisalto');
    avoimetTehtavatLaskuri = document.getElementById('avoimet-tehtavat-laskuri');
    avaaArkistoBtn = document.getElementById('avaa-arkisto-btn');
    avaaMenneetBtn = document.getElementById('avaa-menneet-modal-btn');
    tabbar = document.getElementById('tabbar');
    tabTehtavatBadge = document.getElementById('tab-tehtavat-badge');
    fabLisaa = document.getElementById('fab-lisaa');
    ptrIndikaattori = document.getElementById('ptr-indikaattori');
    sheetTapahtuma = document.getElementById('sheet-tapahtuma');
    sheetLomake = document.getElementById('sheet-lomake');
    sheetLaajuus = document.getElementById('sheet-laajuus');
    sheetArkisto = document.getElementById('sheet-arkisto');
    sheetAsetukset = document.getElementById('sheet-asetukset');
    panelHistoria = document.getElementById('panel-historia');
    historiaHaku = document.getElementById('historia-haku');
    historiaSuodatin = document.getElementById('historia-suodatin');
    historiaKategoria = document.getElementById('historia-kategoria');
    historiaVuosi = document.getElementById('historia-vuosi');
    historiaSort = document.getElementById('historia-sort');
    historiaLista = document.getElementById('historia-lista');
    historiaLisaaBtn = document.getElementById('historia-lisaa-btn');
    historiaMaara = document.getElementById('historia-maara');
    historiaTakaisiBtn = document.getElementById('historia-takaisi-btn');
    arkistoidutTehtavatLista = document.getElementById('arkistoidut-tehtavat-lista');
    ilmoitusEl = document.getElementById('ilmoitus');
}

// --- Apufunktiot ---
function paivaNolla(d) { const p = new Date(d); p.setHours(0, 0, 0, 0); return p; }
function pvmMerkkijono(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function kloMerkkijono(d) { return d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }); }
function cssVari(nimi) { return getComputedStyle(document.body).getPropertyValue(nimi).trim() || '#666'; }
function henkiloVari(nimi) { return cssVari(KAYTTAJA_VARIT[nimi] || '--c-perhe'); }
function kontrastiVari(taustavari) {
    if (!taustavari || taustavari[0] !== '#' || taustavari.length < 7) return '#ffffff';
    const r = parseInt(taustavari.substr(1, 2), 16) / 255;
    const g = parseInt(taustavari.substr(3, 2), 16) / 255;
    const b = parseInt(taustavari.substr(5, 2), 16) / 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.55 ? '#0f172a' : '#ffffff';
}
function lyhennaTeksti(teksti, max = 10) {
    if (!teksti) return '';
    return teksti.length > max ? teksti.slice(0, max).trimEnd() + '…' : teksti;
}
function kategoriaInfo(kat) { return KATEGORIAT[kat] || mukautetutKategoriat[kat] || KATEGORIAT.muu; }

// Kaikki kategoriat: valmiit ensin, sitten mukautetut aakkosjärjestyksessä
function kaikkiKategoriat() {
    const omat = Object.entries(mukautetutKategoriat)
        .sort((a, b) => (a[1].nimi || '').localeCompare(b[1].nimi || '', 'fi'));
    return [...Object.entries(KATEGORIAT), ...omat];
}

function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function linkify(text) {
    if (!text) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])|(\bwww\.[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])/ig;
    return esc(text).replace(urlRegex, function (url) {
        let fullUrl = url;
        if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function viikonAlku(d) {
    const p = paivaNolla(d);
    const pv = p.getDay() === 0 ? 7 : p.getDay();
    p.setDate(p.getDate() - (pv - 1));
    return p;
}

function naytaIlmoitus(viesti, kesto = 3000) {
    ilmoitusEl.textContent = viesti;
    ilmoitusEl.classList.add('nayta');
    clearTimeout(naytaIlmoitus._t);
    naytaIlmoitus._t = setTimeout(() => ilmoitusEl.classList.remove('nayta'), kesto);
}

function haptic() { if (navigator.vibrate) navigator.vibrate(8); }

// ============ KÄYNNISTYS ============
document.addEventListener('DOMContentLoaded', () => {
    alustaElementit();
    // Kriittiset ensin: login + auth eivät saa rikkoutua vaikka jokin
    // myöhempi alustus epäonnistuisi (esim. välimuistista tullut vanha HTML)
    loginForm.addEventListener('submit', handleLogin);
    onAuthStateChanged(auth, user => {
        if (user) {
            let userName = user.displayName;
            if (!userName && user.email) {
                const emailName = user.email.split('@')[0];
                userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
            if (userName) startAppForUser(userName);
            else handleLogout();
        } else {
            nykyinenKayttaja = null;
            if (unsubscribeFromEvents) unsubscribeFromEvents();
            if (unsubscribeFromTasks) unsubscribeFromTasks();
            if (unsubscribeFromCategories) unsubscribeFromCategories();
            lopetaHistoriaKuuntelu();
            historiaVanhat = [];
            mukautetutKategoriat = {};
            if (muistutusIntervalli) clearInterval(muistutusIntervalli);
            appShell.classList.add('hidden');
            loginOverlay.classList.remove('hidden');
            document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
        }
    });
    lataaTeema();
    // Työkalupalkin sticky-offset = appbarin todellinen korkeus (safe-area huomioiden)
    const paivitaAppbarKorkeus = () => {
        const a = document.getElementById('appbar');
        if (a) document.documentElement.style.setProperty('--appbar-h', a.offsetHeight + 'px');
    };
    paivitaAppbarKorkeus();
    window.addEventListener('resize', paivitaAppbarKorkeus);
    const loginVersio = document.getElementById('login-versio');
    if (loginVersio) loginVersio.textContent = `v${VERSIO}`;
    taytaEmojiValitsin();
    taytaKategoriavalinnat();
    lisaaKuuntelijat();
});

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => { loginError.classList.add('hidden'); loginForm.reset(); })
        .catch((error) => {
            console.error('Kirjautumisvirhe:', error.code, error.message);
            const viestit = {
                'auth/invalid-credential': 'Väärä sähköposti tai salasana.',
                'auth/wrong-password': 'Väärä sähköposti tai salasana.',
                'auth/user-not-found': 'Tunnusta ei löydy.',
                'auth/invalid-email': 'Virheellinen sähköpostiosoite.',
                'auth/too-many-requests': 'Liian monta yritystä – odota hetki ja yritä uudelleen.',
                'auth/network-request-failed': 'Verkkovirhe – tarkista yhteys ja lataa sivu uudelleen.',
                'auth/user-disabled': 'Tili on poistettu käytöstä.'
            };
            loginError.textContent = viestit[error.code] || `Kirjautuminen epäonnistui (${error.code || 'tuntematon virhe'}).`;
            loginError.classList.remove('hidden');
        });
}

function handleLogout() {
    signOut(auth).catch(error => console.error("Uloskirjautumisvirhe:", error));
}

function startAppForUser(userName) {
    if (nykyinenKayttaja === userName && !appShell.classList.contains('hidden')) return;
    nykyinenKayttaja = userName;
    appShell.classList.remove('hidden');
    loginOverlay.classList.add('hidden');
    document.getElementById('current-user-name').textContent = nykyinenKayttaja;
    document.getElementById('versio-naytto').textContent = `v${VERSIO}`;
    document.getElementById('versio-teksti').textContent = `Kauppisen perhekalenteri · v${VERSIO}`;
    kayttajaPallo.textContent = nykyinenKayttaja.charAt(0).toUpperCase();
    kayttajaPallo.title = `Kirjautunut: ${nykyinenKayttaja}`;
    document.body.classList.remove('theme-toni', 'theme-kaisa', 'theme-oona');
    if (HENKILOT.includes(userName)) document.body.classList.add(`theme-${userName.toLowerCase()}`);
    if (!document.body.dataset.panel) document.body.dataset.panel = 'kalenteri';
    paivitaTanaanBanneri();
    if (banneriIntervalli) clearInterval(banneriIntervalli);
    banneriIntervalli = setInterval(paivitaTanaanBanneri, 60000);
    lataaMuistutusAsetukset();
    alustaMuistutukset();
    asetaNakyma(nakymanTyyppi, false);
    kuunteleTapahtumia();
    kuunteleTehtavia();
    kuunteleKategorioita();
    if (new URLSearchParams(location.search).get('uusi') === '1') {
        avaaLomake('lisaa');
        history.replaceState(null, '', location.pathname);
    }
    if (odottavaIcsTiedosto) {
        const f = odottavaIcsTiedosto;
        odottavaIcsTiedosto = null;
        tuoIcsTiedosto(f);
    }
}

// ============ TEEMA ============
function lataaTeema() {
    const teema = localStorage.getItem('kalenteri-teema') || 'auto';
    asetaTeema(teema);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('kalenteri-teema') || 'auto') === 'auto') asetaTeema('auto');
    });
}

function asetaTeema(teema) {
    const tumma = teema === 'tumma' || (teema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.teema = tumma ? 'tumma' : 'vaalea';
    localStorage.setItem('kalenteri-teema', teema);
    document.querySelectorAll('#teema-valitsin .seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.teema === teema));
    // Inline-lasketut henkilövärit pitää piirtää uudelleen teeman vaihtuessa
    if (nykyinenKayttaja) {
        piirraNakyma();
        naytaTulevat();
        piirraHistoria();
        piirraTehtavalista();
    }
}

function taytaKategoriavalinnat() {
    const fKat = document.getElementById('f-kategoria');
    const fValittu = fKat.value;
    const sValittu = kategoriaSuodatin ? kategoriaSuodatin.value : 'kaikki';
    const hValittu = historiaKategoria ? historiaKategoria.value : 'kaikki';
    const kaikki = kaikkiKategoriat();

    fKat.innerHTML = '';
    kaikki.forEach(([id, k]) => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = `${k.ikoni} ${k.nimi}`;
        fKat.appendChild(o);
    });
    if (kaikki.some(([id]) => id === fValittu)) fKat.value = fValittu;

    [[kategoriaSuodatin, sValittu], [historiaKategoria, hValittu]].forEach(([sel, vanha]) => {
        if (!sel) return;
        sel.innerHTML = '<option value="kaikki">Kaikki kategoriat</option>';
        kaikki.forEach(([id, k]) => {
            const o = document.createElement('option');
            o.value = id;
            o.textContent = `${k.ikoni} ${k.nimi}`;
            sel.appendChild(o);
        });
        sel.value = (vanha === 'kaikki' || kaikki.some(([id]) => id === vanha)) ? vanha : 'kaikki';
    });
}

function paivitaTanaanBanneri() {
    const nyt = new Date();
    const teksti = nyt.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' }) +
        ' · ' + kloMerkkijono(nyt);
    tanaanBanneri.textContent = teksti;
}

// ============ KUUNTELIJAT ============
function lisaaKuuntelijat() {
    document.getElementById('logout-btn').addEventListener('click', () => { suljeSheet(sheetAsetukset); handleLogout(); });
    document.getElementById('sulje-asetukset-btn').addEventListener('click', () => suljeSheet(sheetAsetukset));
    asetuksetBtn.addEventListener('click', () => { avaaSheet(sheetAsetukset); piirraKategoriaHallinta(); });
    kayttajaPallo.addEventListener('click', () => { avaaSheet(sheetAsetukset); piirraKategoriaHallinta(); });

    // Näkymävalitsin
    nakymaValitsin.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (btn) asetaNakyma(btn.dataset.nakyma);
    });
    navEdellinen.addEventListener('click', () => siirryJaksoa(-1));
    navSeuraava.addEventListener('click', () => siirryJaksoa(1));
    navTanaan.addEventListener('click', () => {
        nykyinenPaiva = new Date();
        agendaAlkuPvm = paivaNolla(new Date());
        piirraNakyma();
    });

    // Haku ja suodattimet
    hakuKentta.addEventListener('input', () => { piirraNakyma(); });
    lisaaSuodatinKuuntelija(tulevatSuodatin, () => piirraNakyma());
    kategoriaSuodatin.addEventListener('change', () => piirraNakyma());
    agendaLisaaBtn.addEventListener('click', () => { agendaNaytetyt += AGENDA_PAIVIA_PER_ERÄ; piirraAgenda(); });

    // Historia-paneelin kontrollit (null-suojaus: vanha välimuistiversio ei sisällä näitä)
    if (historiaHaku) {
        historiaHaku.addEventListener('input', () => { historiaNaytetyt = 25; piirraHistoria(); });
        lisaaSuodatinKuuntelija(historiaSuodatin, () => { historiaNaytetyt = 25; piirraHistoria(); });
        historiaKategoria.addEventListener('change', () => { historiaNaytetyt = 25; piirraHistoria(); });
        historiaVuosi.addEventListener('change', () => { historiaNaytetyt = 25; piirraHistoria(); });
        historiaSort.addEventListener('change', () => piirraHistoria());
        historiaLisaaBtn.addEventListener('click', () => { historiaNaytetyt += 25; piirraHistoria(); });
        historiaTakaisiBtn.addEventListener('click', () => vaihdaPaneli('kalenteri'));
    }

    // Omat kategoriat -lomake
    const katTallenna = document.getElementById('tallenna-kategoria-btn');
    if (katTallenna) {
        katTallenna.addEventListener('click', tallennaKategoria);
        document.getElementById('peruuta-kategoria-btn').addEventListener('click', peruutaKategoriaMuokkaus);
        document.getElementById('kategoria-ikoni').addEventListener('input', (e) => merkitseEmojiValinta(e.target.value.trim()));
        document.getElementById('kategoria-nimi').addEventListener('keydown', (e) => { if (e.key === 'Enter') tallennaKategoria(); });
    }

    // Kuukausiruudukon päiväklikki
    kalenteriGrid.addEventListener('click', handlePaivaClick);

    // FAB
    fabLisaa.addEventListener('click', () => avaaLomake('lisaa'));

    // Tapahtumasheet
    sheetTapahtuma.addEventListener('click', (e) => { if (e.target === sheetTapahtuma) suljeSheet(sheetTapahtuma); });
    document.getElementById('sulje-btn').addEventListener('click', () => suljeSheet(sheetTapahtuma));
    document.getElementById('muokkaa-btn').addEventListener('click', () => {
        const t = haeTapahtuma(sheetTapahtuma.dataset.tapahtumaId);
        suljeSheet(sheetTapahtuma);
        avaaLomake('muokkaa', t);
    });
    document.getElementById('kopioi-btn').addEventListener('click', () => {
        const t = haeTapahtuma(sheetTapahtuma.dataset.tapahtumaId);
        suljeSheet(sheetTapahtuma);
        avaaLomake('lisaa', t);
    });
    document.getElementById('vie-ics-btn').addEventListener('click', () => {
        vieTapahtumaICS(sheetTapahtuma.dataset.tapahtumaId);
    });
    document.getElementById('tuo-ics-btn').addEventListener('click', () => {
        document.getElementById('ics-tiedosto').click();
    });
    document.getElementById('ics-tiedosto').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            tuoIcsTiedosto(this.files[0]);
            this.value = '';
        }
    });

    // Lomakesheet
    sheetLomake.addEventListener('click', (e) => { if (e.target === sheetLomake) suljeSheet(sheetLomake); });
    document.getElementById('peruuta-lomake-btn').addEventListener('click', () => suljeSheet(sheetLomake));
    document.getElementById('sulje-lomake-x').addEventListener('click', () => suljeSheet(sheetLomake));
    document.getElementById('tapahtuma-lomake').addEventListener('submit', (e) => { e.preventDefault(); tallennaTapahtuma(); });
    document.getElementById('poista-tapahtuma-btn').addEventListener('click', poistaTapahtuma);
    document.getElementById('f-alku').addEventListener('input', function () {
        const loppuInput = document.getElementById('f-loppu');
        if (!loppuInput.value || loppuInput.value < this.value) loppuInput.value = this.value;
        loppuInput.min = this.value;
        paivitaLomakeAikat();
    });
    document.getElementById('f-loppu').addEventListener('input', paivitaLomakeAikat);
    document.getElementById('f-koko-paiva').addEventListener('change', paivitaLomakeAikat);
    // "Koko perhe" -valinta rastii kaikki
    document.querySelectorAll('input[name="f-ketakoskee"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const form = e.target.closest('form');
            const perheBox = form.querySelector('input[name="f-ketakoskee"][value="perhe"]');
            const personBoxes = Array.from(form.querySelectorAll('input[name="f-ketakoskee"]:not([value="perhe"])'));
            if (e.target.value === 'perhe') {
                personBoxes.forEach(box => box.checked = e.target.checked);
            } else {
                perheBox.checked = personBoxes.every(box => box.checked);
            }
        });
    });

    // Laajuusdialogi
    sheetLaajuus.addEventListener('click', (e) => { if (e.target === sheetLaajuus) suljeSheet(sheetLaajuus); });
    document.getElementById('peruuta-laajuus-btn').addEventListener('click', () => suljeSheet(sheetLaajuus));
    document.getElementById('vahvista-laajuus-btn').addEventListener('click', () => {
        const laajuus = document.querySelector('input[name="laajuus"]:checked').value;
        suljeSheet(sheetLaajuus);
        if (laajuusCallback) { laajuusCallback(laajuus); laajuusCallback = null; }
    });

    // Menneet (sivuraita + asetukset) → historia-paneeli
    avaaMenneetBtn.addEventListener('click', () => vaihdaPaneli('historia'));
    document.getElementById('asetukset-menneet-btn').addEventListener('click', () => { suljeSheet(sheetAsetukset); vaihdaPaneli('historia'); });

    // Tehtävät
    lisaaTehtavaNappi.addEventListener('click', lisaaTehtava);
    uusiTehtavaTeksti.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); lisaaTehtava(); } });
    tehtavalistaToggle.addEventListener('click', () => tehtavalistaSisalto.classList.toggle('hidden'));
    document.getElementById('lisaa-tehtava-henkilot').addEventListener('click', (e) => {
        if (e.target.classList.contains('assign-btn')) e.target.classList.toggle('active');
    });
    document.getElementById('lisaa-maarapaiva-toggle').addEventListener('change', (e) => {
        document.getElementById('uusi-tehtava-maarapaiva').classList.toggle('hidden', !e.target.checked);
    });
    avaaArkistoBtn.addEventListener('click', avaaArkisto);
    document.getElementById('sulje-arkisto-modal-btn').addEventListener('click', () => suljeSheet(sheetArkisto));
    sheetArkisto.addEventListener('click', (e) => { if (e.target === sheetArkisto) suljeSheet(sheetArkisto); });

    // Välilehdet
    tabbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        if (btn.dataset.panel === 'asetukset') { avaaSheet(sheetAsetukset); return; }
        vaihdaPaneli(btn.dataset.panel);
    });

    // Asetukset: teema + muistutukset
    document.getElementById('teema-valitsin').addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (btn) { asetaTeema(btn.dataset.teema); paivitaNakyma(); naytaTulevat(); piirraTehtavalista(); }
    });
    document.getElementById('muistutukset-toggle').addEventListener('change', tallennaMuistutusAsetuksetUI);
    document.getElementById('muistutus-ajoitus').addEventListener('change', tallennaMuistutusAsetuksetUI);
    document.getElementById('tehtava-muistutukset-toggle').addEventListener('change', tallennaMuistutusAsetuksetUI);
    document.getElementById('testaa-muistutus-btn').addEventListener('click', () => {
        lahetaMuistutus('Testimuistutus', 'Näin muistutukset näyttävät. 🔔');
    });

    lisaaEleetJaSheetKahvat();
}

function haeTapahtuma(key) {
    return kaikkiTapahtumatYhdistettyna().find(t => t.key === key) || null;
}

// Synkkauksen raja: tätä vanhemmat tapahtumat eivät kuulu jatkuvaan kuunteluun
function synkkausRajaISO() {
    const d = new Date();
    d.setDate(d.getDate() - SYNKKAUS_TAAKSE_PV);
    return pvmMerkkijono(d);
}

// Yhdistetty joukko: synkattu ikkuna + laiskasti ladatut vanhat (avaimet deduplikoidaan)
function kaikkiTapahtumatYhdistettyna() {
    const yhdistetty = [...(window.kaikkiTapahtumat || [])];
    const keys = new Set(yhdistetty.map(t => t.key));
    historiaVanhat.forEach(t => { if (!keys.has(t.key)) yhdistetty.push(t); });
    return yhdistetty;
}

// ============ FIREBASE-KUUNTELU ============
function kuunteleTapahtumia() {
    if (unsubscribeFromEvents) unsubscribeFromEvents();
    // Vain tuoreet + tulevat jatkuvaan synkkaan (säästää latausta) —
    // vanhat tapahtumat ladataan vain kun Historia-välilehti on auki
    const tapahtumatQ = query(ref(database, 'tapahtumat'), orderByChild('alku'), startAt(synkkausRajaISO()));
    unsubscribeFromEvents = onValue(tapahtumatQ, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((child) => {
            window.kaikkiTapahtumat.push({ key: child.key, ...child.val() });
        });
        piirraNakyma();
        naytaTulevat();
        paivitaHistoriaVuodet();
        piirraHistoria();
    });
}

// Vanhat tapahtumat omaan kuunteluun vain kun Historia on aktiivinen
function kuunteleHistoriaa() {
    if (unsubscribeFromHistory) return;
    unsubscribeFromHistory = onValue(
        query(ref(database, 'tapahtumat'), orderByChild('alku'), endAt(synkkausRajaISO())),
        (snapshot) => {
            historiaVanhat = [];
            snapshot.forEach(child => historiaVanhat.push({ key: child.key, ...child.val() }));
            paivitaHistoriaVuodet();
            piirraHistoria();
        });
}

function lopetaHistoriaKuuntelu() {
    if (unsubscribeFromHistory) { unsubscribeFromHistory(); unsubscribeFromHistory = null; }
}

function kuunteleTehtavia() {
    if (unsubscribeFromTasks) unsubscribeFromTasks();
    const tehtavatRef = ref(database, 'tehtavalista');
    unsubscribeFromTasks = onValue(tehtavatRef, (snapshot) => {
        kaikkiTehtavat = [];
        snapshot.forEach(child => kaikkiTehtavat.push({ key: child.key, ...child.val() }));
        piirraTehtavalista();
        if (!sheetArkisto.classList.contains('hidden')) avaaArkisto();
    });
}

// ============ OMAT KATEGORIAT (Firebase: /kategoriat) ============
function kuunteleKategorioita() {
    if (unsubscribeFromCategories) unsubscribeFromCategories();
    unsubscribeFromCategories = onValue(ref(database, 'kategoriat'), (snapshot) => {
        mukautetutKategoriat = {};
        snapshot.forEach(child => { mukautetutKategoriat[child.key] = child.val(); });
        taytaKategoriavalinnat();
        piirraKategoriaHallinta();
        piirraNakyma();
        piirraHistoria();
    }, (virhe) => {
        console.error('Kategorioiden luku estetty:', virhe.code || virhe.message);
        const lista = document.getElementById('kategoria-lista');
        if (lista) lista.innerHTML = '<p class="kat-ohje">⚠️ Kategorioiden luku estetty tietokannan säännöillä — katso ohje alta.</p>';
    });
}

function piirraKategoriaHallinta() {
    const lista = document.getElementById('kategoria-lista');
    if (!lista) return;
    lista.innerHTML = '';
    const omat = Object.entries(mukautetutKategoriat)
        .sort((a, b) => (a[1].nimi || '').localeCompare(b[1].nimi || '', 'fi'));
    if (omat.length === 0) {
        lista.innerHTML = '<p class="kat-ohje">Ei omia kategorioita vielä. Lisää alta esim. 🧭 Geokätköily — kategoria näkyy heti koko perheelle.</p>';
        return;
    }
    omat.forEach(([id, k]) => {
        const rivi = document.createElement('div');
        rivi.className = 'kategoria-rivi-item';
        rivi.innerHTML = `<span class="kat-ikoni">${k.ikoni || '📌'}</span>
            <span class="kat-nimi">${esc(k.nimi || '')}</span>
            <span class="kat-tekija">${k.luoja ? esc(k.luoja) : ''}</span>
            <button class="icon-btn kat-muokkaa" title="Muokkaa" aria-label="Muokkaa">✏️</button>
            <button class="icon-btn kat-poista" title="Poista" aria-label="Poista">🗑️</button>`;
        rivi.querySelector('.kat-muokkaa').addEventListener('click', () => aloitaKategorianMuokkaus(id));
        rivi.querySelector('.kat-poista').addEventListener('click', () => poistaKategoria(id, k.nimi));
        lista.appendChild(rivi);
    });
}

function aloitaKategorianMuokkaus(id) {
    const k = mukautetutKategoriat[id];
    if (!k) return;
    muokattavaKategoriaId = id;
    document.getElementById('kategoria-nimi').value = k.nimi || '';
    document.getElementById('kategoria-ikoni').value = k.ikoni || '';
    document.getElementById('tallenna-kategoria-btn').textContent = 'Tallenna muutokset';
    document.getElementById('peruuta-kategoria-btn').classList.remove('hidden');
    merkitseEmojiValinta(k.ikoni);
}

function peruutaKategoriaMuokkaus() {
    muokattavaKategoriaId = null;
    document.getElementById('kategoria-nimi').value = '';
    document.getElementById('kategoria-ikoni').value = '';
    document.getElementById('tallenna-kategoria-btn').textContent = 'Lisää kategoria';
    document.getElementById('peruuta-kategoria-btn').classList.add('hidden');
    merkitseEmojiValinta('');
}

function tallennaKategoria() {
    const nimi = document.getElementById('kategoria-nimi').value.trim();
    const ikoni = document.getElementById('kategoria-ikoni').value.trim() || '📌';
    if (!nimi) { naytaIlmoitus('Anna kategorialle nimi'); return; }
    const data = { nimi, ikoni, luoja: nykyinenKayttaja };
    const lupaus = muokattavaKategoriaId
        ? update(ref(database, `kategoriat/${muokattavaKategoriaId}`), data)
        : push(ref(database, 'kategoriat'), data);
    lupaus.then(() => {
        kuunteleKategorioita(); // uudelleenkytkee kuuntelijan jos se oli kuollut (esim. sääntömuutos)
        naytaIlmoitus(muokattavaKategoriaId ? 'Kategoria päivitetty' : `Kategoria "${nimi}" lisätty`);
        peruutaKategoriaMuokkaus();
    }).catch(err => {
        console.error('Kategoriatallennus epäonnistui:', err.code, err.message);
        const syy = (err.code || err.message || '').includes('PERMISSION_DENIED')
            ? ' – tietokannan säännöt estävät (lisää "kategoriat" Firebase-sääntöihin)'
            : ` (${err.code || err.message})`;
        naytaIlmoitus('Tallennus epäonnistui' + syy, 5000);
    });
}

function poistaKategoria(id, nimi) {
    const kaytossa = kaikkiTapahtumatYhdistettyna().filter(t => t.kategoria === id).length;
    const viesti = kaytossa > 0
        ? `Poistetaanko kategoria "${nimi}"? Sen ${kaytossa} tapahtumaa siirtyy kategoriaan "Muu".`
        : `Poistetaanko kategoria "${nimi}"?`;
    if (!confirm(viesti)) return;
    remove(ref(database, `kategoriat/${id}`));
    if (muokattavaKategoriaId === id) peruutaKategoriaMuokkaus();
    naytaIlmoitus('Kategoria poistettu');
}

function taytaEmojiValitsin() {
    const valitsin = document.getElementById('emoji-valitsin');
    if (!valitsin) return;
    EMOJI_VALINNAT.forEach(em => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-nappi';
        b.textContent = em;
        b.addEventListener('click', () => {
            haptic();
            document.getElementById('kategoria-ikoni').value = em;
            merkitseEmojiValinta(em);
        });
        valitsin.appendChild(b);
    });
}

function merkitseEmojiValinta(valittu) {
    document.querySelectorAll('#emoji-valitsin .emoji-nappi').forEach(b =>
        b.classList.toggle('active', b.textContent === valittu));
}

// ============ NÄKYMÄHALLINTA ============
function asetaNakyma(tyyppi, tallenna = true) {
    nakymanTyyppi = tyyppi;
    if (tallenna) localStorage.setItem('kalenteri-nakyma', tyyppi);
    document.querySelectorAll('#nakyma-valitsin .seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.nakyma === tyyppi));
    piirraNakyma();
}

function siirryJaksoa(suunta) {
    switch (nakymanTyyppi) {
        case 'agenda':
            agendaAlkuPvm.setDate(agendaAlkuPvm.getDate() + suunta * AGENDA_PAIVIA_PER_ERÄ);
            break;
        case 'paiva':
            nykyinenPaiva.setDate(nykyinenPaiva.getDate() + suunta);
            break;
        case 'viikko':
            nykyinenPaiva.setDate(nykyinenPaiva.getDate() + suunta * 7);
            break;
        case 'kk':
            nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() + suunta);
            break;
    }
    piirraNakyma();
}

function piirraNakyma() {
    ['agenda-view', 'paiva-view', 'viikko-view', 'kk-view'].forEach(id =>
        document.getElementById(id).classList.add('hidden'));
    switch (nakymanTyyppi) {
        case 'agenda':
            agendaView.classList.remove('hidden');
            piirraAgenda();
            navOtsikko.textContent = `Agenda`;
            break;
        case 'paiva':
            document.getElementById('paiva-view').classList.remove('hidden');
            piirraAikahila([nykyinenPaiva], paivaHila);
            navOtsikko.textContent = nykyinenPaiva.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
            break;
        case 'viikko': {
            document.getElementById('viikko-view').classList.remove('hidden');
            const alku = viikonAlku(nykyinenPaiva);
            const paivat = Array.from({ length: 7 }, (_, i) => { const d = new Date(alku); d.setDate(d.getDate() + i); return d; });
            piirraAikahila(paivat, viikkoHila);
            navOtsikko.textContent = `Viikko ${getWeekNumber(nykyinenPaiva)}`;
            break;
        }
        case 'kk':
            document.getElementById('kk-view').classList.remove('hidden');
            piirraKuukausi();
            navOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${nykyinenPaiva.getFullYear()}`;
            break;
    }
}

// ============ SUODATUSAPU ============
function nakyvatTapahtumat(joukko = null) {
    const lahde = joukko || kaikkiTapahtumatYhdistettyna();
    if (!nykyinenKayttaja) return [];
    return lahde.filter(t => t.nakyvyys?.[nykyinenKayttaja] && t.alku && t.loppu);
}

// Yleinen henkilösuodatin (agenda + historia)
function lisaaSuodatinKuuntelija(container, onChange) {
    container.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('filter-btn')) return;
        const suodatin = target.dataset.filter;
        const kaikkiBtn = container.querySelector('[data-filter="kaikki"]');
        const perheBtn = container.querySelector('[data-filter="perhe"]');
        const personBtns = container.querySelectorAll('.filter-btn:not([data-filter="kaikki"]):not([data-filter="perhe"])');
        if (suodatin === 'kaikki') {
            personBtns.forEach(b => b.classList.remove('active'));
            perheBtn.classList.remove('active');
            kaikkiBtn.classList.add('active');
        } else if (suodatin === 'perhe') {
            personBtns.forEach(b => b.classList.remove('active'));
            kaikkiBtn.classList.remove('active');
            perheBtn.classList.toggle('active');
        } else {
            kaikkiBtn.classList.remove('active');
            perheBtn.classList.remove('active');
            target.classList.toggle('active');
        }
        if (!container.querySelector('.filter-btn.active')) kaikkiBtn.classList.add('active');
        onChange();
    });
}

function suodataLista(tapahtumat, hakuEl, suodatinEl, katEl) {
    const hakutermi = hakuEl.value.toLowerCase().trim();
    const aktiiviset = Array.from(suodatinEl.querySelectorAll('.filter-btn.active')).map(b => b.dataset.filter);
    const katSuodin = katEl.value;
    return tapahtumat.filter(t => {
        if (hakutermi) {
            const teksti = ((t.otsikko || '') + ' ' + (t.kuvaus || '')).toLowerCase();
            if (!teksti.includes(hakutermi)) return false;
        }
        if (katSuodin !== 'kaikki' && (t.kategoria || 'muu') !== katSuodin) return false;
        if (aktiiviset.includes('kaikki')) return true;
        const ketakoskee = Array.isArray(t.ketakoskee) ? t.ketakoskee : [String(t.ketakoskee || 'perhe')];
        const personSuotimet = aktiiviset.filter(s => s !== 'kaikki' && s !== 'perhe');
        if (aktiiviset.includes('perhe') && (ketakoskee.includes('perhe') || ketakoskee.length >= 3)) return true;
        return personSuotimet.length > 0 && personSuotimet.every(s => ketakoskee.includes(s));
    });
}

// Yhteinen lista-elementti (agenda + historia)
function luoListaItem(t) {
    const tiedot = luoKoskeeTiedot(t.ketakoskee);
    const kat = kategoriaInfo(t.kategoria);
    const item = document.createElement('div');
    item.className = 'agenda-item';
    const aika = new Date(t.alku);
    const loppu = new Date(t.loppu);
    const onMonipaivainen = paivaNolla(aika).getTime() !== paivaNolla(loppu).getTime();
    let aikaHtml;
    if (onMonipaivainen) {
        aikaHtml = `${aika.getDate()}.&ndash;${loppu.getDate()}.${loppu.getMonth() + 1}.`;
    } else if (t.kokoPaiva) {
        aikaHtml = 'Koko<br>päivä';
    } else {
        aikaHtml = `${kloMerkkijono(aika)}<small>${kloMerkkijono(loppu)}</small>`;
    }
    item.innerHTML = `
        <div class="agenda-aika">${aikaHtml}</div>
        <div class="agenda-vari"></div>
        <div class="agenda-tiedot">
            <div class="agenda-otsikko">${esc(t.otsikko)}</div>
            <div class="agenda-meta"><span class="kategoria-ikoni">${kat.ikoni}</span>${kat.nimi !== 'Muu' ? ' ' + kat.nimi : ''}</div>
        </div>
        <div class="agenda-initialit">${tiedot.initialit}</div>`;
    asetaVariTaiLuokka(item.querySelector('.agenda-vari'), tiedot);
    asetaVariTaiLuokka(item.querySelector('.agenda-initialit'), tiedot);
    item.addEventListener('click', () => { haptic(); avaaTapahtuma(t.key); });
    return item;
}

function tapahtumaAikaTeksti(t, lyhyt = false) {
    const alku = new Date(t.alku);
    const loppu = new Date(t.loppu);
    const pvmOpt = lyhyt ? { day: 'numeric', month: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'numeric' };
    const alkuPvmStr = alku.toLocaleDateString('fi-FI', pvmOpt);
    if (paivaNolla(alku).getTime() !== paivaNolla(loppu).getTime()) {
        return `${alkuPvmStr} - ${loppu.toLocaleDateString('fi-FI', pvmOpt)}`;
    }
    if (t.kokoPaiva) return `${alkuPvmStr}, koko päivä`;
    return `${alkuPvmStr} ${kloMerkkijono(alku)}–${kloMerkkijono(loppu)}`;
}

function luoKoskeeTiedot(ketakoskee) {
    if (!Array.isArray(ketakoskee) || ketakoskee.length === 0) {
        const nimi = typeof ketakoskee === 'string' ? ketakoskee : 'perhe';
        const kapNimi = nimi.charAt(0).toUpperCase() + nimi.slice(1);
        return { initialit: kapNimi.charAt(0), type: 'class', value: `koskee-${nimi.toLowerCase()}`, vari: henkiloVari(kapNimi) };
    }
    if (ketakoskee.includes('perhe') || ketakoskee.length >= 3) {
        return { initialit: 'P', type: 'class', value: 'koskee-perhe', vari: henkiloVari('perhe') };
    }
    if (ketakoskee.length === 1) {
        const nimi = ketakoskee[0];
        return { initialit: nimi.charAt(0).toUpperCase(), type: 'class', value: `koskee-${nimi.toLowerCase()}`, vari: henkiloVari(nimi) };
    }
    const sortedNames = [...ketakoskee].sort();
    const initialit = sortedNames.map(n => n.charAt(0).toUpperCase()).join('');
    const varit = sortedNames.map(n => henkiloVari(n));
    return { initialit, type: 'style', value: `linear-gradient(45deg, ${varit.join(', ')})`, vari: null };
}

function asetaVariTaiLuokka(el, tiedot) {
    if (el.classList.contains('tapahtuma-kuvake')) {
        // Värirengas + vaalea tausta — emoji erottuu kaikilla taustaväreillä
        el.style.backgroundColor = 'rgba(255,255,255,0.94)';
        el.style.color = '#0f172a';
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        if (tiedot.type === 'class') {
            el.style.border = `2.5px solid ${tiedot.vari || '#666'}`;
        } else {
            const v = tiedot.value.match(/#[0-9a-f]{6}/gi) || ['#666', '#666'];
            el.style.border = `2.5px solid ${v[0]}`;
            el.style.borderRightColor = v[1] || v[0];
            el.style.borderBottomColor = v[1] || v[0];
        }
        return;
    }
    if (tiedot.type === 'class') {
        el.style.backgroundColor = tiedot.vari || '#666';
        el.style.color = kontrastiVari(tiedot.vari);
        el.style.textShadow = 'none';
    } else {
        el.style.background = tiedot.value;
        el.style.color = '#fff';
        el.style.textShadow = '0 1px 2px rgba(0,0,0,0.4)';
    }
}

// ============ AGENDA ============
function piirraAgenda() {
    agendaLista.innerHTML = '';
    const lista = suodataLista(nakyvatTapahtumat()
        .filter(t => new Date(t.loppu) >= agendaAlkuPvm), hakuKentta, tulevatSuodatin, kategoriaSuodatin)
        .sort((a, b) => new Date(a.alku) - new Date(b.alku));

    // Ryhmittele päiville
    const ryhmat = new Map();
    lista.forEach(t => {
        const avain = pvmMerkkijono(paivaNolla(new Date(t.alku)));
        if (!ryhmat.has(avain)) ryhmat.set(avain, []);
        ryhmat.get(avain).push(t);
    });

    const paivakerrat = Array.from(ryhmat.keys()).sort();
    const naytettavat = paivakerrat.slice(0, agendaNaytetyt);
    const tanaanStr = pvmMerkkijono(new Date());

    if (naytettavat.length === 0) {
        agendaLista.innerHTML = '<p class="tyhja-teksti" style="text-align:center;color:var(--text-3);padding:40px 0;">Valinnoilla ei löytynyt tapahtumia.</p>';
        agendaLisaaBtn.classList.add('hidden');
        return;
    }

    naytettavat.forEach(paivaStr => {
        const d = new Date(paivaStr + 'T12:00');
        const ryhmaEl = document.createElement('div');
        ryhmaEl.className = 'agenda-paiva';
        const otsikko = document.createElement('div');
        otsikko.className = 'agenda-paiva-otsikko' + (paivaStr === tanaanStr ? ' tanaan-otsikko' : '');
        const viikonpaiva = d.toLocaleDateString('fi-FI', { weekday: 'long' });
        const pvm = d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
        otsikko.textContent = paivaStr === tanaanStr ? `Tänään · ${viikonpaiva} ${pvm}` : `${viikonpaiva} ${pvm}`;
        ryhmaEl.appendChild(otsikko);

        ryhmat.get(paivaStr).forEach(t => {
            ryhmaEl.appendChild(luoListaItem(t));
        });
        agendaLista.appendChild(ryhmaEl);
    });

    agendaLisaaBtn.classList.toggle('hidden', paivakerrat.length <= agendaNaytetyt);
}

// ============ AIKAHILA (päivä + viikko) ============
function piirraAikahila(paivat, container) {
    container.innerHTML = '';
    const tanaanStr = pvmMerkkijono(new Date());
    const h = (AH_LOPPU - AH_ALKU) * AH_TPX;
    const tapahtumat = nakyvatTapahtumat();

    // Otsikkorivi
    const otsikot = document.createElement('div');
    otsikot.className = 'ah-otsikot';
    otsikot.style.gridTemplateColumns = `48px repeat(${paivat.length}, 1fr)`;
    otsikot.appendChild(document.createElement('div'));
    paivat.forEach(d => {
        const o = document.createElement('div');
        o.className = 'ah-otsikko' + (pvmMerkkijono(d) === tanaanStr ? ' tanaan' : '');
        o.innerHTML = `${d.toLocaleDateString('fi-FI', { weekday: 'short' })}<span class="ah-pvm">${d.getDate()}</span>`;
        if (paivat.length > 1) {
            o.addEventListener('click', () => { nykyinenPaiva = new Date(d); asetaNakyma('paiva'); });
        }
        otsikot.appendChild(o);
    });
    container.appendChild(otsikot);

    // Koko päivän rivi
    const alldayRivi = document.createElement('div');
    alldayRivi.className = 'ah-allday-rivi';
    alldayRivi.style.gridTemplateColumns = `48px repeat(${paivat.length}, 1fr)`;
    const label = document.createElement('div');
    label.className = 'ah-allday-label';
    label.textContent = 'koko pv';
    alldayRivi.appendChild(label);
    let onAllday = false;
    paivat.forEach(d => {
        const solu = document.createElement('div');
        solu.className = 'ah-allday-solu';
        tapahtumat.filter(t => {
            const a0 = paivaNolla(new Date(t.alku)), l0 = paivaNolla(new Date(t.loppu)), d0 = paivaNolla(d);
            return t.kokoPaiva || a0.getTime() !== l0.getTime() ? (d0 >= a0 && d0 <= l0) : false;
        }).forEach(t => {
            onAllday = true;
            const tiedot = luoKoskeeTiedot(t.ketakoskee);
            const palkki = document.createElement('div');
            palkki.className = 'ah-allday-palkki';
            palkki.textContent = `${kategoriaInfo(t.kategoria).ikoni} ${t.otsikko}`;
            asetaVariTaiLuokka(palkki, tiedot);
            palkki.addEventListener('click', () => avaaTapahtuma(t.key));
            solu.appendChild(palkki);
        });
        alldayRivi.appendChild(solu);
    });
    if (onAllday) container.appendChild(alldayRivi);

    // Aikahilan runko
    const scroll = document.createElement('div');
    scroll.className = 'ah-scroll';
    const runko = document.createElement('div');
    runko.className = 'ah-runko';
    runko.style.gridTemplateColumns = `48px 1fr`;
    runko.style.height = h + 'px';

    const aikaSarake = document.createElement('div');
    aikaSarake.className = 'ah-aikasarake';
    for (let t = AH_ALKU; t <= AH_LOPPU; t++) {
        const l = document.createElement('div');
        l.className = 'ah-tunti-label';
        l.style.top = ((t - AH_ALKU) * AH_TPX) + 'px';
        l.textContent = t < AH_LOPPU ? `${String(t).padStart(2, '0')}:00` : '';
        aikaSarake.appendChild(l);
    }
    runko.appendChild(aikaSarake);

    const sarakkeet = document.createElement('div');
    sarakkeet.className = 'ah-sarakkeet';
    sarakkeet.style.gridTemplateColumns = `repeat(${paivat.length}, 1fr)`;

    paivat.forEach(d => {
        const sarake = document.createElement('div');
        sarake.className = 'ah-sarake';
        sarake.dataset.paivamaara = pvmMerkkijono(d);
        for (let t = AH_ALKU + 1; t < AH_LOPPU; t++) {
            const viiva = document.createElement('div');
            viiva.className = 'ah-tunti-viiva';
            viiva.style.top = ((t - AH_ALKU) * AH_TPX) + 'px';
            sarake.appendChild(viiva);
        }
        // Ajastetut yksipäiväiset tapahtumat
        const paivan = tapahtumat.filter(t => {
            const a0 = paivaNolla(new Date(t.alku)), l0 = paivaNolla(new Date(t.loppu));
            return !t.kokoPaiva && a0.getTime() === l0.getTime() && pvmMerkkijono(new Date(t.alku)) === pvmMerkkijono(d);
        }).sort((a, b) => new Date(a.alku) - new Date(b.alku));
        const sijoitellut = asetaKaistat(paivan);
        sijoitellut.forEach(({ t, kaista, kaistoja }) => {
            const alku = new Date(t.alku), loppu = new Date(t.loppu);
            let alkuMin = alku.getHours() * 60 + alku.getMinutes();
            let loppuMin = loppu.getHours() * 60 + loppu.getMinutes();
            if (loppuMin <= alkuMin) loppuMin = alkuMin + 30;
            const top = Math.max(0, (alkuMin - AH_ALKU * 60) / 60 * AH_TPX);
            const korkeus = Math.max(22, (loppuMin - alkuMin) / 60 * AH_TPX);
            const leveys = 100 / kaistoja;
            const tiedot = luoKoskeeTiedot(t.ketakoskee);
            const ev = document.createElement('div');
            ev.className = 'ah-event';
            ev.style.top = top + 'px';
            ev.style.height = korkeus + 'px';
            ev.style.left = `calc(${kaista * leveys}% + 2px)`;
            ev.style.width = `calc(${leveys}% - 4px)`;
            asetaVariTaiLuokka(ev, tiedot);
            ev.innerHTML = `${kategoriaInfo(t.kategoria).ikoni} ${esc(t.otsikko)}<span class="ah-event-aika">${kloMerkkijono(alku)}–${kloMerkkijono(loppu)}</span>`;
            ev.addEventListener('click', (e) => { e.stopPropagation(); avaaTapahtuma(t.key); });
            sarake.appendChild(ev);
        });
        // Nyt-viiva
        if (pvmMerkkijono(d) === tanaanStr) {
            const nyt = new Date();
            const nytMin = nyt.getHours() * 60 + nyt.getMinutes();
            if (nytMin >= AH_ALKU * 60 && nytMin <= AH_LOPPU * 60) {
                const viiva = document.createElement('div');
                viiva.className = 'ah-nyt-viiva';
                viiva.style.top = ((nytMin - AH_ALKU * 60) / 60 * AH_TPX) + 'px';
                sarake.appendChild(viiva);
            }
        }
        // Klikkaus tyhjään → uusi tapahtuma tähän aikaan
        sarake.addEventListener('click', (e) => {
            if (e.target !== sarake && !e.target.classList.contains('ah-tunti-viiva')) return;
            const rect = sarake.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const tunti = Math.floor(AH_ALKU + y / AH_TPX);
            const pvm = sarake.dataset.paivamaara;
            avaaLomake('lisaa', null, { alku: `${pvm}T${String(tunti).padStart(2, '0')}:00`, loppu: `${pvm}T${String(Math.min(tunti + 1, 23)).padStart(2, '0')}:00` });
        });
        sarakkeet.appendChild(sarake);
    });
    runko.appendChild(sarakkeet);
    scroll.appendChild(runko);
    container.appendChild(scroll);

    // Skrollaa nykyhetkeen jos tänään näkyvissä
    const nytMin = new Date().getHours() * 60 + new Date().getMinutes();
    if (paivat.some(d => pvmMerkkijono(d) === tanaanStr) && nytMin > AH_ALKU * 60) {
        scroll.scrollTop = Math.max(0, (nytMin - AH_ALKU * 60) / 60 * AH_TPX - 140);
    }
}

// Pinta-alakaistojen laskenta päällekkäisille tapahtumille
function asetaKaistat(tapahtumat) {
    const kaistat = []; // viimeisin loppumin per kaista
    const tulos = tapahtumat.map(t => {
        const alku = new Date(t.alku).getTime();
        let loppu = new Date(t.loppu).getTime();
        if (loppu <= alku) loppu = alku + 30 * 60000;
        let kaista = kaistat.findIndex(l => l <= alku);
        if (kaista === -1) { kaista = kaistat.length; kaistat.push(loppu); }
        else kaistat[kaista] = loppu;
        return { t, kaista };
    });
    // Laske samanaikaisten ryhmien kaistamäärät
    return tulos.map(({ t, kaista }) => {
        const alku = new Date(t.alku).getTime(), loppu = new Date(t.loppu).getTime();
        const päällekkäiset = tulos.filter(o => {
            const a2 = new Date(o.t.alku).getTime(), l2 = new Date(o.t.loppu).getTime();
            return a2 < loppu && l2 > alku;
        });
        const kaistoja = Math.max(...päällekkäiset.map(o => o.kaista)) + 1;
        return { t, kaista, kaistoja };
    });
}

// ============ KUUKAUSINÄKYMÄ ============
function piirraKuukausi() {
    kalenteriGrid.innerHTML = '';
    kalenteriPaivatOtsikot.innerHTML = '';
    kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', '<div class="viikonpaiva"></div>');
    ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].forEach(p =>
        kalenteriPaivatOtsikot.insertAdjacentHTML('beforeend', `<div class="viikonpaiva">${p}</div>`));
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();
    const ekaKuunPaiva = new Date(vuosi, kuukausi, 1);
    const tanaanString = pvmMerkkijono(new Date());
    const paivaViikossa = ekaKuunPaiva.getDay() === 0 ? 7 : ekaKuunPaiva.getDay();
    const kalenterinAloitus = new Date(ekaKuunPaiva);
    kalenterinAloitus.setDate(ekaKuunPaiva.getDate() - (paivaViikossa - 1));
    let paivaIt = new Date(kalenterinAloitus);
    for (let i = 0; i < 6; i++) {
        kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="viikko-nro">${getWeekNumber(paivaIt)}</div>`);
        for (let j = 0; j < 7; j++) {
            const pvm = pvmMerkkijono(paivaIt);
            let luokat = "paiva";
            if (paivaIt.getMonth() !== kuukausi) luokat += " tyhja";
            if (pvm === tanaanString) luokat += " tanaan";
            kalenteriGrid.insertAdjacentHTML('beforeend',
                `<div class="${luokat}" data-paivamaara="${pvm}"><div class="paiva-numero">${paivaIt.getDate()}</div><div class="tapahtumat-container"></div></div>`);
            paivaIt.setDate(paivaIt.getDate() + 1);
        }
        if (paivaIt.getMonth() !== kuukausi && paivaIt.getDay() === 1) break;
    }
    naytaTapahtumatKalenterissa();
    korostaHakuOsumatKalenterissa();
}

function handlePaivaClick(event) {
    const paivaEl = event.target.closest('.paiva');
    if (!paivaEl || paivaEl.classList.contains('tyhja') ||
        event.target.closest('.tapahtuma-kuvake') || event.target.closest('.tapahtuma-palkki') ||
        event.target.closest('.tapahtuma-viiva')) return;
    const pvm = paivaEl.dataset.paivamaara;
    if (!pvm) return;
    // Päivä jossa on merkintöjä -> päivänäkymä; tyhjä päivä -> uuden merkinnän lomake
    const onMerkintoja = paivaEl.querySelector('.tapahtumat-container').children.length > 0;
    if (onMerkintoja) {
        nykyinenPaiva = new Date(pvm + 'T12:00:00');
        asetaNakyma('paiva');
    } else {
        avaaLomake('lisaa', null, { alku: pvm + 'T09:00', loppu: pvm + 'T10:00' });
    }
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');
    nakyvatTapahtumat().forEach(tapahtuma => {
        const alkuPvm = new Date(tapahtuma.alku);
        const loppuPvm = new Date(tapahtuma.loppu);
        const alkuAikaNolla = paivaNolla(alkuPvm).getTime();
        const loppuAikaNolla = paivaNolla(loppuPvm).getTime();
        const onMonipaivainenTaiKokoPaiva = alkuAikaNolla !== loppuAikaNolla || tapahtuma.kokoPaiva;
        if (onMonipaivainenTaiKokoPaiva) {
            let currentDate = new Date(alkuAikaNolla);
            const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
            const mobiili = !matchMedia('(min-width: 900px)').matches;
            while (currentDate.getTime() <= loppuAikaNolla) {
                const pvm = pvmMerkkijono(currentDate);
                const paivaEl = document.querySelector(`.paiva[data-paivamaara="${pvm}"]`);
                if (paivaEl) {
                    let merkki;
                    if (mobiili && currentDate.getTime() === alkuAikaNolla) {
                        // Alkupäivä: värirenkaallinen pallo + kategoria-emoji
                        merkki = document.createElement('div');
                        merkki.className = 'tapahtuma-kuvake';
                        merkki.textContent = kategoriaInfo(tapahtuma.kategoria).ikoni;
                    } else if (mobiili) {
                        // Jatkopäivä: ohut väriviiva; päätepäivä ei ylitä solureunaa oikealle
                        merkki = document.createElement('div');
                        merkki.className = 'tapahtuma-viiva' +
                            (currentDate.getTime() === loppuAikaNolla ? ' viiva-loppu' : '');
                    } else {
                        merkki = document.createElement('div');
                        merkki.className = 'tapahtuma-palkki';
                        merkki.textContent = currentDate.getTime() === alkuAikaNolla
                            ? `${kategoriaInfo(tapahtuma.kategoria).ikoni} ${lyhennaTeksti(tapahtuma.otsikko, 10)}`
                            : `› ${lyhennaTeksti(tapahtuma.otsikko, 10)}`;
                    }
                    merkki.title = tapahtuma.otsikko;
                    asetaVariTaiLuokka(merkki, tiedot);
                    merkki.addEventListener('click', (e) => { e.stopPropagation(); avaaTapahtuma(tapahtuma.key); });
                    paivaEl.querySelector('.tapahtumat-container').appendChild(merkki);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    });
    nakyvatTapahtumat().forEach(tapahtuma => {
        const alkuAikaNolla = paivaNolla(new Date(tapahtuma.alku)).getTime();
        const loppuAikaNolla = paivaNolla(new Date(tapahtuma.loppu)).getTime();
        if (alkuAikaNolla === loppuAikaNolla && !tapahtuma.kokoPaiva) {
            const paivaEl = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
            if (paivaEl) {
                const tiedot = luoKoskeeTiedot(tapahtuma.ketakoskee);
                let merkki;
                if (matchMedia('(min-width: 900px)').matches) {
                    merkki = document.createElement('div');
                    merkki.className = 'tapahtuma-palkki';
                    merkki.textContent = `${kloMerkkijono(new Date(tapahtuma.alku))} ${lyhennaTeksti(tapahtuma.otsikko, 10)}`;
                } else {
                    merkki = document.createElement('div');
                    merkki.className = 'tapahtuma-kuvake';
                    merkki.textContent = kategoriaInfo(tapahtuma.kategoria).ikoni;
                }
                merkki.title = `${tapahtuma.otsikko} ${kloMerkkijono(new Date(tapahtuma.alku))}`;
                asetaVariTaiLuokka(merkki, tiedot);
                merkki.addEventListener('click', (e) => { e.stopPropagation(); avaaTapahtuma(tapahtuma.key); });
                paivaEl.querySelector('.tapahtumat-container').appendChild(merkki);
            }
        }
    });
    // Rajoita näkyvien merkkien määrä per solu — "+N" avaa päivänäkymän
    const maxNakyvat = matchMedia('(min-width: 900px)').matches ? 3 : 4;
    document.querySelectorAll('#kalenteri-grid .tapahtumat-container').forEach(c => {
        const items = [...c.children];
        if (items.length <= maxNakyvat) return;
        items.slice(maxNakyvat).forEach(el => el.style.display = 'none');
        const lisaa = document.createElement('div');
        lisaa.className = 'lisaa-palkki';
        lisaa.textContent = `+${items.length - maxNakyvat}`;
        lisaa.addEventListener('click', (e) => {
            e.stopPropagation();
            nykyinenPaiva = new Date(c.closest('.paiva').dataset.paivamaara + 'T12:00:00');
            asetaNakyma('paiva');
        });
        c.appendChild(lisaa);
    });
}

function korostaHakuOsumatKalenterissa() {
    document.querySelectorAll('.paiva.haku-osuma').forEach(el => el.classList.remove('haku-osuma'));
    const hakutermi = hakuKentta.value.toLowerCase().trim();
    if (!hakutermi || !window.kaikkiTapahtumat) return;
    nakyvatTapahtumat().filter(t => {
        const teksti = ((t.otsikko || '') + ' ' + (t.kuvaus || '')).toLowerCase();
        return teksti.includes(hakutermi);
    }).forEach(t => {
        const paivaEl = document.querySelector(`.paiva[data-paivamaara="${t.alku.substring(0, 10)}"]`);
        if (paivaEl) paivaEl.classList.add('haku-osuma');
    });
}

// ============ SIVURAITA: TULEVAT ============
function naytaTulevat() {
    tulevatTapahtumatLista.innerHTML = '';
    const nyt = new Date();
    const lista = nakyvatTapahtumat()
        .filter(t => new Date(t.loppu) >= nyt)
        .sort((a, b) => new Date(a.alku) - new Date(b.alku))
        .slice(0, 8);
    if (lista.length === 0) {
        tulevatTapahtumatLista.innerHTML = '<p style="text-align:center;color:var(--text-3);font-size:0.9em;">Ei tulevia tapahtumia.</p>';
        return;
    }
    lista.forEach(t => {
        const tiedot = luoKoskeeTiedot(t.ketakoskee);
        const item = document.createElement('div');
        item.className = 'tuleva-tapahtuma-item';
        item.innerHTML = `
            <div class="tapahtuma-item-luoja">${tiedot.initialit}</div>
            <div class="tapahtuma-item-tiedot">
                <div class="tapahtuma-item-aika">${tapahtumaAikaTeksti(t, true)}</div>
                <div class="tapahtuma-item-otsikko">${esc(t.otsikko)}</div>
                <div class="tapahtuma-item-kategoria">${kategoriaInfo(t.kategoria).ikoni} ${kategoriaInfo(t.kategoria).nimi}</div>
            </div>`;
        asetaVariTaiLuokka(item.querySelector('.tapahtuma-item-luoja'), tiedot);
        item.addEventListener('click', () => avaaTapahtuma(t.key));
        tulevatTapahtumatLista.appendChild(item);
    });
}

// ============ HISTORIA (menneet tapahtumat) ============
function piirraHistoria() {
    if (!historiaLista) return;
    historiaLista.innerHTML = '';
    const nyt = new Date();
    let lista = nakyvatTapahtumat().filter(t => new Date(t.loppu) < nyt);

    const vuosi = historiaVuosi.value;
    if (vuosi !== 'kaikki') lista = lista.filter(t => new Date(t.alku).getFullYear() === parseInt(vuosi));
    lista = suodataLista(lista, historiaHaku, historiaSuodatin, historiaKategoria);

    const sort = historiaSort.value;
    if (sort === 'uusimmat') lista.sort((a, b) => new Date(b.alku) - new Date(a.alku));
    else if (sort === 'vanhimmat') lista.sort((a, b) => new Date(a.alku) - new Date(b.alku));
    else if (sort === 'otsikko') lista.sort((a, b) => (a.otsikko || '').localeCompare(b.otsikko || '', 'fi'));
    else if (sort === 'kategoria') {
        const jarjestys = kaikkiKategoriat().map(([id]) => id);
        lista.sort((a, b) => jarjestys.indexOf(a.kategoria || 'muu') - jarjestys.indexOf(b.kategoria || 'muu')
            || new Date(b.alku) - new Date(a.alku));
    }

    historiaMaara.textContent = `${lista.length} tapahtumaa`;
    const naytettavat = lista.slice(0, historiaNaytetyt);
    historiaLisaaBtn.classList.toggle('hidden', lista.length <= historiaNaytetyt);
    if (naytettavat.length === 0) {
        historiaLista.innerHTML = '<p style="text-align:center;color:var(--text-3);padding:40px 0;">Valinnoilla ei löytynyt menneitä tapahtumia.</p>';
        return;
    }
    naytettavat.forEach(t => historiaLista.appendChild(luoListaItem(t)));
}

function paivitaHistoriaVuodet() {
    if (!historiaVuosi) return;
    const valittu = historiaVuosi.value;
    const vuodet = [...new Set(kaikkiTapahtumatYhdistettyna()
        .map(t => new Date(t.alku).getFullYear())
        .filter(v => !isNaN(v)))].sort((a, b) => b - a);
    historiaVuosi.innerHTML = '<option value="kaikki">Kaikki vuodet</option>' +
        vuodet.map(v => `<option value="${v}">${v}</option>`).join('');
    historiaVuosi.value = vuodet.includes(parseInt(valittu)) ? valittu : 'kaikki';
}

// ============ SHEET-HALLINTA ============
function avaaSheet(overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.remove('sulkeutuu');
    haptic();
}

function suljeSheet(overlay) {
    if (!overlay || overlay.classList.contains('hidden')) return;
    overlay.classList.add('sulkeutuu');
    const sheet = overlay.querySelector('.sheet');
    if (sheet) sheet.style.transform = '';
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('sulkeutuu');
    }, 240);
}

// ============ TAPAHTUMAN TIETO-SHEET ============
function avaaTapahtuma(key) {
    const t = haeTapahtuma(key);
    if (!t) return;
    sheetTapahtuma.dataset.tapahtumaId = key;
    const kat = kategoriaInfo(t.kategoria);
    document.getElementById('view-kategoria-rivi').innerHTML =
        `<span class="kategoria-chip">${kat.ikoni} ${kat.nimi}</span>` +
        (t.onToistuva ? ' <span class="kategoria-chip">🔁 Toistuva</span>' : '');
    document.getElementById('view-otsikko').textContent = t.otsikko;
    document.getElementById('view-aika').textContent = tapahtumaAikaTeksti(t);
    const koskeeTieto = Array.isArray(t.ketakoskee) ? t.ketakoskee : [String(t.ketakoskee)];
    document.getElementById('view-koskee').textContent =
        (koskeeTieto.includes('perhe') || koskeeTieto.length >= 3) ? 'Koko perhe' : koskeeTieto.join(', ');
    document.getElementById('view-nakyvyys').textContent =
        'Näkyy: ' + Object.keys(t.nakyvyys || {}).filter(k => t.nakyvyys[k]).join(', ');
    document.getElementById('view-kuvaus').innerHTML = linkify(t.kuvaus || 'Ei lisätietoja.');
    document.getElementById('view-luoja').textContent = t.luoja;
    const linkkiContainer = document.getElementById('view-linkki-container');
    if (t.linkki) {
        document.getElementById('view-linkki').href = t.linkki;
        linkkiContainer.classList.remove('hidden');
    } else linkkiContainer.classList.add('hidden');
    avaaSheet(sheetTapahtuma);
}

// ============ TAPAHTUMALOMAKE ============
// Aikakentät: "koko päivä" → pelkät päivämäärät ja jaksoloppu;
// ajastettu → kellonajat. Toisto vain yksittäisille ajastetuille tapahtumille.
function paivitaLomakeAikat() {
    const kokoPaiva = document.getElementById('f-koko-paiva').checked;
    const fAlku = document.getElementById('f-alku');
    const fLoppu = document.getElementById('f-loppu');
    const haluttu = kokoPaiva ? 'date' : 'datetime-local';
    if (fAlku.type !== haluttu) {
        const alkuV = fAlku.value, loppuV = fLoppu.value;
        fAlku.type = haluttu;
        fLoppu.type = haluttu;
        if (kokoPaiva) {
            fAlku.value = alkuV.substring(0, 10);
            fLoppu.value = (loppuV || alkuV).substring(0, 10);
        } else {
            const ad = alkuV.substring(0, 10);
            const ld = (loppuV || alkuV).substring(0, 10);
            fAlku.value = ad ? ad + 'T09:00' : '';
            fLoppu.value = ld ? ld + (ld === ad ? 'T10:00' : 'T18:00') : '';
        }
    }
    fLoppu.required = !kokoPaiva;
    fLoppu.min = fAlku.value || '';
    const toistuuRivi = document.getElementById('f-toistuminen-tyyppi').closest('.kentta-rivi');
    const muokkaus = sheetLomake.dataset.tila === 'muokkaa';
    const samapaiva = (fAlku.value || '').substring(0, 10) === ((fLoppu.value || fAlku.value) || '').substring(0, 10);
    toistuuRivi.classList.toggle('hidden', muokkaus || kokoPaiva || !samapaiva);
}

function avaaLomake(tila, tapahtuma = null, esitäyte = null) {
    const lomake = document.getElementById('tapahtuma-lomake');
    lomake.reset();
    const onMuokkaus = tila === 'muokkaa' && tapahtuma;
    document.getElementById('lomake-otsikko').textContent = onMuokkaus ? 'Muokkaa tapahtumaa' : 'Uusi tapahtuma';
    document.getElementById('f-tallenna').textContent = onMuokkaus ? 'Tallenna' : 'Lisää kalenteriin';
    document.getElementById('poista-tapahtuma-btn').classList.toggle('hidden', !onMuokkaus);
    document.getElementById('f-id').value = onMuokkaus ? tapahtuma.key : '';

    const lähde = tapahtuma || {};
    document.getElementById('f-otsikko').value = onMuokkaus || tapahtuma ? (lähde.otsikko || '') : '';
    document.getElementById('f-kuvaus').value = lähde.kuvaus || '';
    document.getElementById('f-kategoria').value = lähde.kategoria || 'muu';
    document.getElementById('f-linkki').value = lähde.linkki || '';
    document.getElementById('f-koko-paiva').checked = !!lähde.kokoPaiva;
    const aikaTyyppi = lähde.kokoPaiva ? 'date' : 'datetime-local';
    const aikaPituus = lähde.kokoPaiva ? 10 : 16;
    document.getElementById('f-alku').type = aikaTyyppi;
    document.getElementById('f-loppu').type = aikaTyyppi;
    document.getElementById('loppu-wrap').classList.remove('hidden');
    document.getElementById('f-loppu').required = !lähde.kokoPaiva;

    if (onMuokkaus || (tapahtuma && !esitäyte)) {
        document.getElementById('f-alku').value = (lähde.alku || '').substring(0, aikaPituus);
        document.getElementById('f-loppu').value = (lähde.loppu || '').substring(0, aikaPituus);
    } else if (esitäyte) {
        document.getElementById('f-alku').value = (esitäyte.alku || '').substring(0, aikaPituus);
        document.getElementById('f-loppu').value = (esitäyte.loppu || '').substring(0, aikaPituus);
    }

    // Ketä koskee
    const ketakoskee = tapahtuma ? (Array.isArray(lähde.ketakoskee) ? lähde.ketakoskee : [String(lähde.ketakoskee)]) : [];
    document.querySelectorAll('input[name="f-ketakoskee"]').forEach(cb => {
        cb.checked = ketakoskee.includes(cb.value) || (ketakoskee.includes('perhe') && tapahtuma);
    });
    const perheBox = document.querySelector('input[name="f-ketakoskee"][value="perhe"]');
    if (ketakoskee.includes('perhe')) {
        perheBox.checked = true;
        document.querySelectorAll('input[name="f-ketakoskee"]:not([value="perhe"])').forEach(cb => cb.checked = true);
    }

    // Näkyvyys
    document.querySelectorAll('input[name="f-nakyvyys"]').forEach(cb => {
        cb.checked = tapahtuma ? !!lähde.nakyvyys?.[cb.value] : true;
    });

    sheetLomake.dataset.tila = tila;
    paivitaLomakeAikat();
    avaaSheet(sheetLomake);
    setTimeout(() => document.getElementById('f-otsikko').focus(), 350);
}

function tallennaTapahtuma() {
    const tila = sheetLomake.dataset.tila;
    const key = document.getElementById('f-id').value;
    const kokoPaiva = document.getElementById('f-koko-paiva').checked;
    const alkuInput = document.getElementById('f-alku').value;
    let alkuAika, loppuAika;
    if (kokoPaiva) {
        const pv = alkuInput.substring(0, 10);
        if (!pv) return alert('Valitse päivämäärä ensin.');
        alkuAika = `${pv}T00:00`;
        loppuAika = `${(document.getElementById('f-loppu').value || alkuInput).substring(0, 10)}T23:59`;
    } else {
        alkuAika = alkuInput;
        loppuAika = document.getElementById('f-loppu').value;
    }
    const koskeeValinnat = Array.from(document.querySelectorAll('input[name="f-ketakoskee"]:checked'))
        .map(cb => cb.value).filter(v => v !== 'perhe');
    if (koskeeValinnat.length === 0 && document.querySelector('input[name="f-ketakoskee"][value="perhe"]:checked')) {
        koskeeValinnat.push('perhe');
    }
    const otsikko = document.getElementById('f-otsikko').value.trim();
    if (!otsikko || !alkuAika || koskeeValinnat.length === 0) {
        return alert('Täytä vähintään otsikko, alkuajankohta ja ketä tapahtuma koskee.');
    }
    const data = {
        otsikko,
        kuvaus: document.getElementById('f-kuvaus').value,
        kategoria: document.getElementById('f-kategoria').value,
        alku: alkuAika, loppu: loppuAika || alkuAika,
        kokoPaiva,
        linkki: document.getElementById('f-linkki').value,
        ketakoskee: koskeeValinnat,
        nakyvyys: Array.from(document.querySelectorAll('input[name="f-nakyvyys"]:checked'))
            .reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };

    if (tila === 'muokkaa' && key) {
        const vanha = haeTapahtuma(key);
        data.luoja = vanha ? vanha.luoja : nykyinenKayttaja;
        if (vanha && vanha.onToistuva && vanha.sarjaId) {
            // Sarjatapahtuma → kysy laajuus
            suljeSheet(sheetLomake);
            kysyLaajuus('Tallenna muutokset', 'Miten haluat tallentaa muutokset toistuvaan tapahtumaan?', true, (laajuus) => {
                paivitaSarja(vanha, data, laajuus);
            });
        } else {
            update(ref(database, `tapahtumat/${key}`), data).then(() => {
                suljeSheet(sheetLomake);
                naytaIlmoitus('Tapahtuma päivitetty.');
            });
        }
    } else {
        data.luoja = nykyinenKayttaja;
        const toistuuSallittu = !document.getElementById('f-toistuminen-tyyppi').closest('.kentta-rivi').classList.contains('hidden');
        data.toistuminen = {
            tyyppi: toistuuSallittu ? document.getElementById('f-toistuminen-tyyppi').value : 'ei',
            paattyy: document.getElementById('f-toistuminen-paattyy').value || null
        };
        if (data.toistuminen.tyyppi !== 'ei') {
            luoToistuvatTapahtumat(data);
        } else {
            delete data.toistuminen;
            push(ref(database, 'tapahtumat'), data).then(() => {
                suljeSheet(sheetLomake);
                naytaIlmoitus('Tapahtuma lisätty!');
            });
        }
    }
}

// ============ TOISTUVAT TAPAHTUMAT ============
function luoToistuvatTapahtumat(perusTapahtuma) {
    const toistuminen = perusTapahtuma.toistuminen;
    delete perusTapahtuma.toistuminen;
    const alkuPvm = new Date(perusTapahtuma.alku);
    const loppuPvm = new Date(perusTapahtuma.loppu);
    const paattyyPvm = toistuminen.paattyy ? new Date(toistuminen.paattyy + 'T23:59') : null;
    const sarjaId = 'sarja_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const tapahtumat = [];
    let nykyinenPvm = new Date(alkuPvm);
    const kestoMs = loppuPvm.getTime() - alkuPvm.getTime();
    let indeksi = 0;
    while ((!paattyyPvm || nykyinenPvm <= paattyyPvm) && tapahtumat.length < 100) {
        const t = { ...perusTapahtuma };
        t.alku = `${pvmMerkkijono(nykyinenPvm)}${perusTapahtuma.alku.substring(10)}`;
        const loppuDate = new Date(nykyinenPvm.getTime() + kestoMs);
        t.loppu = `${pvmMerkkijono(loppuDate)}${perusTapahtuma.loppu.substring(10)}`;
        t.sarjaId = sarjaId;
        t.sarjaIndeksi = indeksi;
        t.onToistuva = true;
        tapahtumat.push(t);
        indeksi++;
        switch (toistuminen.tyyppi) {
            case 'paivittain': nykyinenPvm.setDate(nykyinenPvm.getDate() + 1); break;
            case 'viikoittain': nykyinenPvm.setDate(nykyinenPvm.getDate() + 7); break;
            case 'kuukausittain': nykyinenPvm.setMonth(nykyinenPvm.getMonth() + 1); break;
        }
    }
    Promise.all(tapahtumat.map(t => push(ref(database, 'tapahtumat'), t))).then(() => {
        suljeSheet(sheetLomake);
        naytaIlmoitus(`Luotu ${tapahtumat.length} toistuvaa tapahtumaa!`);
    }).catch(() => naytaIlmoitus('Virhe toistuvien tapahtumien luonnissa!'));
}

function kysyLaajuus(otsikko, kuvaus, onMuokkaus, cb) {
    document.getElementById('laajuus-otsikko').textContent = otsikko;
    document.getElementById('laajuus-kuvaus').textContent = kuvaus;
    document.getElementById('laajuus-huomautus').classList.toggle('hidden', !onMuokkaus);
    document.getElementById('vahvista-laajuus-btn').textContent = onMuokkaus ? 'Tallenna' : 'Poista';
    document.getElementById('vahvista-laajuus-btn').className = onMuokkaus ? 'btn-primary' : 'btn-danger';
    document.querySelector('input[name="laajuus"][value="yksittainen"]').checked = true;
    laajuusCallback = cb;
    avaaSheet(sheetLaajuus);
}

// Sarjan päivitys: metakentät levitetään, ajat vain valittuun
function paivitaSarja(vanha, data, laajuus) {
    const kohteet = sarjanKohteet(vanha, laajuus);
    if (laajuus === 'yksittainen') {
        update(ref(database, `tapahtumat/${vanha.key}`), data).then(() =>
            naytaIlmoitus('Tapahtuma päivitetty.'));
        return;
    }
    const meta = {};
    SARJA_META_KENTAT.forEach(k => { if (data[k] !== undefined) meta[k] = data[k]; });
    const paivitykset = kohteet.map(t => update(ref(database, `tapahtumat/${t.key}`), meta));
    // Aikamuutokset aina vain valittuun instanssiin
    paivitykset.push(update(ref(database, `tapahtumat/${vanha.key}`), { alku: data.alku, loppu: data.loppu }));
    Promise.all(paivitykset).then(() =>
        naytaIlmoitus(`Päivitetty ${kohteet.length} sarjan tapahtumaa.`));
}

function sarjanKohteet(tapahtuma, laajuus) {
    const sarja = kaikkiTapahtumatYhdistettyna().filter(t => t.sarjaId === tapahtuma.sarjaId);
    if (laajuus === 'koko-sarja') return sarja;
    if (laajuus === 'tulevat') return sarja.filter(t => t.sarjaIndeksi >= tapahtuma.sarjaIndeksi);
    return [tapahtuma];
}

function poistaTapahtuma() {
    const key = document.getElementById('f-id').value;
    const t = haeTapahtuma(key);
    if (!t) return;
    suljeSheet(sheetLomake);
    if (t.onToistuva && t.sarjaId) {
        kysyLaajuus('Poista toistuva tapahtuma', 'Valitse poistamisen laajuus:', false, (laajuus) => {
            const kohteet = sarjanKohteet(t, laajuus);
            Promise.all(kohteet.map(k => remove(ref(database, `tapahtumat/${k.key}`)))).then(() =>
                naytaIlmoitus(`Poistettu ${kohteet.length} tapahtumaa.`));
        });
    } else {
        if (confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
            remove(ref(database, `tapahtumat/${key}`)).then(() => naytaIlmoitus('Tapahtuma poistettu.'));
        }
    }
}

// ============ ICS (iCalendar) VIENTI + TUONTI ============
// Vienti: yksi tapahtuma -> .ics-tiedosto (jaa/lataa). Tuonti: .ics -> lomake/eräajona.

function icsEscape(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}
function icsUnescape(s) {
    return String(s || '')
        .replace(/\\n|\\N/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
function icsPvmNro(iso) { return iso.substring(0, 10).replace(/-/g, ''); }
function icsFold(rivi) { // rivita 75 merkkiin, jatko-rivi alkaa välilyönnillä
    const osat = [];
    while (rivi.length > 75) { osat.push(rivi.substring(0, 75)); rivi = ' ' + rivi.substring(75); }
    osat.push(rivi);
    return osat.join('\r\n');
}

function rakennaICS(t) {
    const rivit = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Kauppisen perhekalenteri//FI',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${t.key || Date.now()}@kauppisen-perhekalenteri`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
        `SUMMARY:${icsEscape(t.otsikko)}`
    ];
    if (t.kokoPaiva) {
        // Koko päivä: DTEND on standardissa eksklusiivinen (päivä lopun JÄLKEEN)
        rivit.push(`DTSTART;VALUE=DATE:${icsPvmNro(t.alku)}`);
        const loppuD = new Date(t.loppu.substring(0, 10) + 'T00:00');
        loppuD.setDate(loppuD.getDate() + 1);
        rivit.push(`DTEND;VALUE=DATE:${icsPvmNro(pvmMerkkijono(loppuD))}`);
    } else {
        rivit.push(`DTSTART:${icsPvmNro(t.alku)}T${t.alku.substring(11, 16).replace(':', '')}00`);
        rivit.push(`DTEND:${icsPvmNro(t.loppu)}T${t.loppu.substring(11, 16).replace(':', '')}00`);
    }
    if (t.kuvaus) rivit.push(`DESCRIPTION:${icsEscape(t.kuvaus)}`);
    if (t.linkki) rivit.push(`URL:${t.linkki}`);
    // Toistuva: RRULE vain jos toistumistieto on säilynyt instanssissa
    if (t.onToistuva && t.toistuminen && t.toistuminen.tyyppi && t.toistuminen.tyyppi !== 'ei') {
        const freq = { paivittain: 'DAILY', viikoittain: 'WEEKLY', kuukausittain: 'MONTHLY' }[t.toistuminen.tyyppi];
        if (freq) {
            let rrule = `RRULE:FREQ=${freq}`;
            if (t.toistuminen.paattyy) rrule += `;UNTIL=${icsPvmNro(t.toistuminen.paattyy)}T235959`;
            rivit.push(rrule);
        }
    }
    rivit.push('END:VEVENT', 'END:VCALENDAR');
    return rivit.map(icsFold).join('\r\n');
}

function vieTapahtumaICS(key) {
    const t = haeTapahtuma(key);
    if (!t) return;
    const ics = rakennaICS(t);
    const tiedostonNimi = `${(t.otsikko || 'tapahtuma').replace(/[^\wäöåÄÖÅ \-]/g, '').trim().replace(/\s+/g, '_') || 'tapahtuma'}.ics`;
    const tiedosto = new File([ics], tiedostonNimi, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [tiedosto] })) {
        navigator.share({ files: [tiedosto], title: t.otsikko }).catch(() => {});
    } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(tiedosto);
        a.download = tiedostonNimi;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}

// --- Tuonti: parsitaan VEVENT-lohkot (ics iCalendar 2.0 + vcs vCalendar 1.0) ---
// vCalendar 1.0 käyttää usein quoted-printable-enkoodausta (=E4 -> ä) + CHARSET-määrettä
function qpPurkaa(s, charset) {
    const cleaned = String(s).replace(/=\r?\n/g, '');
    const enc = new TextEncoder();
    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(cleaned.substr(i + 1, 2))) {
            bytes.push(parseInt(cleaned.substr(i + 1, 2), 16));
            i += 2;
        } else {
            enc.encode(cleaned[i]).forEach(b => bytes.push(b));
        }
    }
    try { return new TextDecoder((charset || 'utf-8').toLowerCase()).decode(new Uint8Array(bytes)); }
    catch { return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); }
}

function parsiICSArvo(arvo) {
    // Palauttaa { pvm: 'YYYY-MM-DD'|'YYYY-MM-DDTHH:MM', vainPvm: bool }
    const v = arvo.trim();
    if (/^\d{8}$/.test(v)) {
        return { pvm: `${v.substr(0, 4)}-${v.substr(4, 2)}-${v.substr(6, 2)}`, vainPvm: true };
    }
    const m = v.match(/^(\d{8})T(\d{6})(Z?)$/);
    if (!m) return null;
    const iso = `${m[1].substr(0, 4)}-${m[1].substr(4, 2)}-${m[1].substr(6, 2)}T${m[2].substr(0, 2)}:${m[2].substr(2, 2)}`;
    if (m[3] === 'Z') {
        // UTC -> paikallinen aika
        const d = new Date(`${m[1].substr(0, 4)}-${m[1].substr(4, 2)}-${m[1].substr(6, 2)}T${m[2].substr(0, 2)}:${m[2].substr(2, 2)}:${m[2].substr(4, 2)}Z`);
        return { pvm: `${pvmMerkkijono(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, vainPvm: false };
    }
    return { pvm: iso, vainPvm: false };
}

function parsiiICS(teksti) {
    // Avaa rivitytetyt rivit ja kerää ominaisuudet VEVENT-lohkoista
    const rivit = teksti.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
    const tapahtumat = [];
    let nykyinen = null;
    for (const rivi of rivit) {
        if (rivi === 'BEGIN:VEVENT') { nykyinen = {}; continue; }
        if (rivi === 'END:VEVENT') { if (nykyinen) tapahtumat.push(nykyinen); nykyinen = null; continue; }
        if (!nykyinen) continue;
        const kaksoispiste = rivi.indexOf(':');
        if (kaksoispiste < 0) continue;
        const vasen = rivi.substring(0, kaksoispiste);
        const arvo = rivi.substring(kaksoispiste + 1);
        const [nimi, ...parametrit] = vasen.split(';');
        const params = {};
        parametrit.forEach(p => { const [k, v] = p.split('='); if (k && v) params[k.toUpperCase()] = v; });
        const dekoodattu = params['ENCODING'] === 'QUOTED-PRINTABLE'
            ? qpPurkaa(arvo, params['CHARSET']) : arvo;
        switch (nimi.toUpperCase()) {
            case 'SUMMARY': nykyinen.otsikko = icsUnescape(dekoodattu); break;
            case 'DESCRIPTION': nykyinen.kuvaus = icsUnescape(dekoodattu); break;
            case 'LOCATION': nykyinen.paikka = icsUnescape(dekoodattu); break;
            case 'URL': nykyinen.linkki = dekoodattu.trim(); break;
            case 'CATEGORIES': nykyinen.kategoriat = dekoodattu.split(',').map(c => icsUnescape(c.trim())); break;
            case 'DTSTART': {
                const p = parsiICSArvo(arvo);
                if (p) {
                    nykyinen.alku = p.pvm;
                    nykyinen.vainPvm = p.vainPvm || params['VALUE'] === 'DATE';
                }
                break;
            }
            case 'DTEND': {
                const p = parsiICSArvo(arvo);
                if (p) {
                    nykyinen.loppu = p.pvm;
                    nykyinen.loppuEksklusiivinen = p.vainPvm || params['VALUE'] === 'DATE';
                }
                break;
            }
            case 'RRULE': {
                const r = {};
                arvo.split(';').forEach(os => { const [k, v] = os.split('='); r[k] = v; });
                const tyyppi = { DAILY: 'paivittain', WEEKLY: 'viikoittain', MONTHLY: 'kuukausittain' }[r.FREQ];
                if (tyyppi) {
                    nykyinen.toistuminen = {
                        tyyppi,
                        paattyy: r.UNTIL ? (r.UNTIL.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
                    };
                }
                break;
            }
        }
    }
    // Muunna sovelluksen muotoon
    return tapahtumat.filter(v => v.alku).map(v => {
        let alku, loppu;
        if (v.vainPvm) {
            alku = `${v.alku}T00:00`;
            // DTEND eksklusiivinen -> vähennä yksi päivä; puuttuessa sama päivä
            if (v.loppu) {
                const d = new Date(v.loppu + 'T00:00');
                d.setDate(d.getDate() - 1);
                loppu = `${pvmMerkkijono(d)}T23:59`;
            } else {
                loppu = `${v.alku}T23:59`;
            }
        } else {
            alku = v.alku;
            loppu = v.loppu || v.alku;
        }
        const kuvausOsat = [v.kuvaus, v.paikka ? `Paikka: ${v.paikka}` : null].filter(Boolean);
        // Kategoriamatchi: CATEGORIES vs. tunnetut kategoriat (id tai nimi, kirjainkoolla ei väliä)
        let kategoria = 'muu';
        if (v.kategoriat) {
            const tulos = kaikkiKategoriat().find(([id, k]) =>
                v.kategoriat.some(c => c.toLowerCase() === id.toLowerCase() || c.toLowerCase() === k.nimi.toLowerCase()));
            if (tulos) kategoria = tulos[0];
        }
        const t = {
            otsikko: v.otsikko || 'Tuotu tapahtuma',
            kuvaus: kuvausOsat.join('\n'),
            kategoria,
            linkki: v.linkki || '',
            alku, loppu,
            kokoPaiva: !!v.vainPvm,
            nakyvyys: { Toni: true, Kaisa: true, Oona: true }
        };
        if (v.toistuminen && !v.vainPvm) t.toistuminen = v.toistuminen;
        return t;
    });
}

function tuoIcsTiedosto(file) {
    const lukija = new FileReader();
    lukija.onload = () => {
        // vCalendar 1.0 saattaa olla muussa merkistössä kuin UTF-8 — havaitse CHARSET
        const puskuri = lukija.result;
        let teksti = new TextDecoder('utf-8').decode(puskuri);
        const csMatch = teksti.match(/CHARSET=["']?([^;:\r\n\s"']+)/i);
        if (csMatch && !/^utf-?8$/i.test(csMatch[1])) {
            try { teksti = new TextDecoder(csMatch[1].toLowerCase()).decode(puskuri); } catch { /* jätä utf-8 */ }
        }
        let tapahtumat = [];
        try { tapahtumat = parsiiICS(teksti); } catch (e) { console.error(e); }
        if (tapahtumat.length === 0) {
            naytaIlmoitus('Tiedostosta ei löytynyt tapahtumia.');
            return;
        }
        suljeSheet(sheetAsetukset);
        if (tapahtumat.length === 1) {
            // Yksi -> avaa lomake esitäytettynä (käyttäjä valitsee kenet koskee)
            avaaLomake('lisaa', tapahtumat[0]);
            naytaIlmoitus('Tarkista tiedot ja tallenna.');
        } else {
            // Monta -> erätallennus oletuksilla (toistot tulevat yksittäisinä merkintöinä)
            const lupaukset = tapahtumat.map(t => {
                const data = { ...t, ketakoskee: ['perhe'], luoja: nykyinenKayttaja };
                delete data.toistuminen;
                return push(ref(database, 'tapahtumat'), data);
            });
            Promise.allSettled(lupaukset).then(tulokset => {
                const virheet = tulokset.filter(r => r.status === 'rejected').length;
                naytaIlmoitus(virheet
                    ? `Tuotu ${tapahtumat.length - virheet}/${tapahtumat.length} tapahtumaa.`
                    : `Tuotu ${tapahtumat.length} tapahtumaa.`);
            });
        }
    };
    lukija.readAsArrayBuffer(file);
}

// ============ TEHTÄVÄT ============
function piirraTehtavalista() {
    tehtavatContainer.innerHTML = '';
    const nakyvat = kaikkiTehtavat
        .filter(t => t.tila !== 'arkistoitu')
        .sort((a, b) => a.tehty - b.tehty);
    const avoimet = nakyvat.filter(t => !t.tehty);
    avoimetTehtavatLaskuri.textContent = `${avoimet.length} avointa`;
    if (avoimet.length > 0) {
        tabTehtavatBadge.textContent = avoimet.length;
        tabTehtavatBadge.classList.remove('hidden');
    } else tabTehtavatBadge.classList.add('hidden');
    if (nakyvat.length === 0) {
        tehtavatContainer.innerHTML = '<p style="text-align:center;color:var(--text-3);">Lista on tyhjä. 🎉</p>';
        return;
    }
    nakyvat.forEach(tehtava => {
        const wrap = document.createElement('div');
        wrap.className = 'tehtava-wrap';
        const tausta = document.createElement('div');
        tausta.className = 'swipe-tausta';
        tausta.textContent = tehtava.tehty ? '↩' : '✓';
        const item = document.createElement('div');
        item.className = 'tehtava-item';
        const tila = maaritaTehtavanTila(tehtava);
        if (tila) item.classList.add(`status-${tila}`);
        rakennaTehtavaItemView(item, tehtava);
        wrap.appendChild(tausta);
        wrap.appendChild(item);
        lisaaTehtavaSwipe(item, tehtava);
        tehtavatContainer.appendChild(wrap);
    });
}

function maaritaTehtavanTila(tehtava) {
    if (tehtava.tehty) return 'tehty';
    if (tehtava.maarapaiva) {
        const nyt = new Date();
        const mp = new Date(tehtava.maarapaiva);
        if (nyt > mp) return 'myohassa';
        if (mp - nyt < 86400000) return 'kiireellinen';
        return 'ok';
    }
    return '';
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
    const tiedot = document.createElement('div');
    tiedot.className = 'tehtava-tiedot';
    const teksti = document.createElement('p');
    teksti.className = 'tehtava-teksti';
    teksti.textContent = tehtava.teksti;
    const meta = document.createElement('small');
    meta.className = 'tehtava-meta';
    let metaTeksti = '';
    if (tehtava.maarapaiva) {
        const pvm = new Date(tehtava.maarapaiva);
        metaTeksti += `📅 ${pvm.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })} ${kloMerkkijono(pvm)} · `;
    }
    metaTeksti += `Lisäsi ${tehtava.luoja}`;
    if (tehtava.muokattuAika) metaTeksti += ` (muokattu)`;
    meta.textContent = metaTeksti;
    tiedot.appendChild(teksti);
    tiedot.appendChild(meta);
    vasen.appendChild(checkbox);
    vasen.appendChild(tiedot);
    const oikea = document.createElement('div');
    oikea.className = 'tehtava-oikea';
    if (tehtava.kohdistettu && tehtava.kohdistettu.length > 0) {
        const kohdistus = document.createElement('div');
        kohdistus.className = 'tehtava-kohdistus';
        tehtava.kohdistettu.forEach(nimi => {
            const pallo = document.createElement('div');
            pallo.className = 'kohdistus-pallo';
            pallo.textContent = nimi.charAt(0).toUpperCase();
            pallo.style.backgroundColor = henkiloVari(nimi);
            pallo.title = nimi;
            kohdistus.appendChild(pallo);
        });
        oikea.appendChild(kohdistus);
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
    const editMp = document.createElement('input');
    editMp.type = 'datetime-local';
    editMp.value = tehtava.maarapaiva || '';
    vasen.appendChild(editInput);
    vasen.appendChild(editMp);
    const oikea = document.createElement('div');
    oikea.className = 'tehtava-oikea edit-controls';
    const assignContainer = document.createElement('div');
    assignContainer.className = 'assign-buttons';
    HENKILOT.forEach(nimi => {
        const btn = document.createElement('button');
        btn.className = 'assign-btn';
        btn.dataset.assignee = nimi;
        btn.textContent = nimi.charAt(0);
        if (tehtava.kohdistettu && tehtava.kohdistettu.includes(nimi)) btn.classList.add('active');
        btn.addEventListener('click', () => btn.classList.toggle('active'));
        assignContainer.appendChild(btn);
    });
    const tallennaNappi = document.createElement('button');
    tallennaNappi.textContent = 'Tallenna';
    tallennaNappi.className = 'btn-primary pieni-nappi';
    tallennaNappi.addEventListener('click', () => {
        const uusiTeksti = editInput.value.trim();
        if (uusiTeksti) {
            const kohdistukset = Array.from(assignContainer.querySelectorAll('.assign-btn.active')).map(b => b.dataset.assignee);
            update(ref(database, `tehtavalista/${tehtava.key}`), {
                teksti: uusiTeksti,
                kohdistettu: kohdistukset,
                maarapaiva: editMp.value || null,
                muokannut: nykyinenKayttaja,
                muokattuAika: serverTimestamp()
            });
        }
    });
    const peruutaNappi = document.createElement('button');
    peruutaNappi.textContent = 'Peruuta';
    peruutaNappi.className = 'btn-ghost pieni-nappi';
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
    if (!teksti) return;
    const kohdistetut = Array.from(document.querySelectorAll('#lisaa-tehtava-henkilot .assign-btn.active'))
        .map(b => b.dataset.assignee);
    const uusi = {
        teksti, tehty: false, luoja: nykyinenKayttaja,
        lisattyAika: serverTimestamp(), tila: 'aktiivinen'
    };
    if (kohdistetut.length > 0) uusi.kohdistettu = kohdistetut;
    const mpToggle = document.getElementById('lisaa-maarapaiva-toggle');
    const mpInput = document.getElementById('uusi-tehtava-maarapaiva');
    if (mpToggle.checked && mpInput.value) uusi.maarapaiva = mpInput.value;
    push(ref(database, 'tehtavalista'), uusi).then(() => {
        uusiTehtavaTeksti.value = '';
        document.querySelectorAll('#lisaa-tehtava-henkilot .assign-btn').forEach(b => b.classList.remove('active'));
        mpToggle.checked = false;
        mpInput.classList.add('hidden');
        mpInput.value = '';
        haptic();
    });
}

function paivitaTehtavanTila(key, onkoTehty) {
    update(ref(database, `tehtavalista/${key}`), { tehty: onkoTehty });
    haptic();
}

function arkistoiTehtava(key) { update(ref(database, `tehtavalista/${key}`), { tila: 'arkistoitu' }); }
function palautaTehtava(key) { update(ref(database, `tehtavalista/${key}`), { tila: 'aktiivinen' }); }
function poistaTehtava(key) {
    if (confirm('Poistetaanko tehtävä lopullisesti?')) remove(ref(database, `tehtavalista/${key}`));
}

function avaaArkisto() {
    arkistoidutTehtavatLista.innerHTML = '';
    const arkistoidut = kaikkiTehtavat
        .filter(t => t.tila === 'arkistoitu')
        .sort((a, b) => (a.lisattyAika > b.lisattyAika) ? -1 : 1);
    if (arkistoidut.length === 0) {
        arkistoidutTehtavatLista.innerHTML = '<p style="text-align:center;color:var(--text-3);">Arkisto on tyhjä.</p>';
    } else {
        arkistoidut.forEach(tehtava => {
            const item = document.createElement('div');
            item.className = 'arkisto-item';
            const teksti = document.createElement('span');
            teksti.className = 'arkisto-item-teksti';
            teksti.textContent = tehtava.teksti;
            const nappulat = document.createElement('div');
            nappulat.className = 'arkisto-item-nappulat';
            const palauta = document.createElement('button');
            palauta.textContent = 'Palauta';
            palauta.className = 'pieni-nappi';
            palauta.addEventListener('click', () => palautaTehtava(tehtava.key));
            const poista = document.createElement('button');
            poista.textContent = 'Poista';
            poista.className = 'btn-danger pieni-nappi';
            poista.addEventListener('click', () => poistaTehtava(tehtava.key));
            nappulat.appendChild(palauta);
            nappulat.appendChild(poista);
            item.appendChild(teksti);
            item.appendChild(nappulat);
            arkistoidutTehtavatLista.appendChild(item);
        });
    }
    avaaSheet(sheetArkisto);
}

// ============ VÄLILEHDET ============
function vaihdaPaneli(paneli) {
    document.body.dataset.panel = paneli;
    tabbar.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.panel === paneli));
    if (paneli === 'historia') kuunteleHistoriaa();
    else lopetaHistoriaKuuntelu();
    haptic();
}

// ============ ELEET ============
function lisaaEleetJaSheetKahvat() {
    // Horisontaalinen pyyhkäisy: jakson vaihto näkymissä
    let sx = 0, sy = 0;
    nakymat.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    nakymat.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            siirryJaksoa(dx < 0 ? 1 : -1);
            haptic();
        }
    }, { passive: true });

    // Sheet-kahvasta alasveto → sulje
    document.querySelectorAll('.sheet-kahva').forEach(kahva => {
        const sheet = kahva.closest('.sheet');
        const overlay = kahva.closest('.sheet-overlay');
        let startY = 0, delta = 0;
        kahva.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            sheet.style.transition = 'none';
        }, { passive: true });
        kahva.addEventListener('touchmove', (e) => {
            delta = Math.max(0, e.touches[0].clientY - startY);
            sheet.style.transform = `translateY(${delta}px)`;
        }, { passive: true });
        kahva.addEventListener('touchend', () => {
            sheet.style.transition = '';
            if (delta > 90) suljeSheet(overlay);
            else sheet.style.transform = '';
            delta = 0;
        }, { passive: true });
    });

    // Pull-to-refresh kalenteripaneelissa
    const paneli = document.getElementById('panel-kalenteri');
    let ptrY = 0, ptrEta = 0, ptrOk = false;
    paneli.addEventListener('touchstart', (e) => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const ahScroll = paneli.querySelector('.ah-scroll');
        const ahYlhaalla = !ahScroll || ahScroll.scrollTop <= 0;
        ptrOk = scrollY <= 0 && ahYlhaalla;
        ptrY = e.touches[0].clientY;
        ptrEta = 0;
    }, { passive: true });
    paneli.addEventListener('touchmove', (e) => {
        if (!ptrOk) return;
        ptrEta = Math.max(0, (e.touches[0].clientY - ptrY) * 0.5);
        if (ptrEta > 10) {
            ptrIndikaattori.style.height = Math.min(ptrEta, 56) + 'px';
            ptrIndikaattori.classList.add('ptr-aktiivinen');
        }
    }, { passive: true });
    paneli.addEventListener('touchend', () => {
        if (ptrEta > 60) {
            piirraNakyma();
            naytaTulevat();
            naytaIlmoitus('Päivitetty ✓', 1500);
        }
        setTimeout(() => {
            ptrIndikaattori.classList.remove('ptr-aktiivinen');
            ptrIndikaattori.style.height = '';
        }, ptrEta > 60 ? 700 : 0);
        ptrEta = 0; ptrOk = false;
    }, { passive: true });
}

function lisaaTehtavaSwipe(item, tehtava) {
    let sx = 0, sy = 0, moving = false;
    item.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; moving = false;
        item.style.transition = 'none';
    }, { passive: true });
    item.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - sx;
        const dy = e.touches[0].clientY - sy;
        if (!moving && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) moving = true;
        if (moving) {
            const x = Math.min(Math.max(dx, 0), 110);
            item.style.transform = `translateX(${x}px)`;
            const tausta = item.parentElement.querySelector('.swipe-tausta');
            if (tausta) tausta.style.opacity = Math.min(1, x / 60);
        }
    }, { passive: true });
    item.addEventListener('touchend', (e) => {
        item.style.transition = '';
        const dx = e.changedTouches[0].clientX - sx;
        if (moving && dx > 70) {
            item.style.transform = '';
            paivitaTehtavanTila(tehtava.key, !tehtava.tehty);
            naytaIlmoitus(tehtava.tehty ? 'Tehtävä palautettu' : 'Tehtävä tehty! ✓', 1800);
        } else {
            item.style.transform = '';
            const tausta = item.parentElement.querySelector('.swipe-tausta');
            if (tausta) tausta.style.opacity = 0;
        }
        moving = false;
    }, { passive: true });
}

// ============ MUISTUTUKSET ============
function lataaMuistutusAsetukset() {
    try {
        const tallennettu = JSON.parse(localStorage.getItem('kalenteri-muistutukset'));
        if (tallennettu) muistutusAsetukset = { ...muistutusAsetukset, ...tallennettu };
    } catch (e) { /* käytä oletuksia */ }
    document.getElementById('muistutukset-toggle').checked = muistutusAsetukset.kaytossa;
    document.getElementById('muistutus-ajoitus').value = String(muistutusAsetukset.ajoitus);
    document.getElementById('tehtava-muistutukset-toggle').checked = muistutusAsetukset.tehtavat;
    paivitaMuistutusStatus();
}

function tallennaMuistutusAsetuksetUI() {
    muistutusAsetukset.kaytossa = document.getElementById('muistutukset-toggle').checked;
    muistutusAsetukset.ajoitus = parseInt(document.getElementById('muistutus-ajoitus').value);
    muistutusAsetukset.tehtavat = document.getElementById('tehtava-muistutukset-toggle').checked;
    localStorage.setItem('kalenteri-muistutukset', JSON.stringify(muistutusAsetukset));
    if (muistutusAsetukset.kaytossa && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(() => paivitaMuistutusStatus());
    }
    alustaMuistutukset();
    paivitaMuistutusStatus();
    naytaIlmoitus('Muistutusasetukset tallennettu.');
}

function paivitaMuistutusStatus() {
    const el = document.getElementById('muistutus-status');
    if (!muistutusAsetukset.kaytossa) {
        el.textContent = 'Muistutukset eivät ole käytössä.';
        return;
    }
    let tila = 'Muistutukset näytetään sovelluksen ollessa auki.';
    if ('Notification' in window) {
        if (Notification.permission === 'granted') tila = 'Selaimen ilmoitukset sallittu.';
        else if (Notification.permission === 'denied') tila = 'Selaimen ilmoitukset estetty — muistutukset näytetään sovelluksessa.';
    }
    el.textContent = tila;
}

function alustaMuistutukset() {
    if (muistutusIntervalli) clearInterval(muistutusIntervalli);
    if (!muistutusAsetukset.kaytossa) return;
    muistutusIntervalli = setInterval(() => {
        tarkistaMuistutukset();
        tarkistaTehtavaMuistutukset();
    }, 30000);
    tarkistaMuistutukset();
    tarkistaTehtavaMuistutukset();
}

function muistutettuJo(avain) {
    try {
        const lista = JSON.parse(sessionStorage.getItem('muistutetut') || '[]');
        if (lista.includes(avain)) return true;
        lista.push(avain);
        if (lista.length > 300) lista.shift();
        sessionStorage.setItem('muistutetut', JSON.stringify(lista));
    } catch (e) { /* sessionStorage ei käytettävissä */ }
    return false;
}

function tarkistaMuistutukset() {
    if (!muistutusAsetukset.kaytossa || !window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    const nyt = Date.now();
    const raja = muistutusAsetukset.ajoitus * 60000;
    nakyvatTapahtumat().forEach(t => {
        const alku = new Date(t.alku).getTime();
        const ero = alku - nyt;
        if (ero > 0 && ero <= raja && !muistutettuJo(`${t.key}|${t.alku}`)) {
            const min = Math.round(ero / 60000);
            lahetaMuistutus(`Tapahtuma ${min <= 1 ? 'alkaa pian' : `alkaa ${min} min päästä`}`, t.otsikko);
        }
    });
}

function tarkistaTehtavaMuistutukset() {
    if (!muistutusAsetukset.kaytossa || !muistutusAsetukset.tehtavat) return;
    const tanaan = pvmMerkkijono(new Date());
    if (localStorage.getItem('muistutus-tehtavat-pvm') === tanaan) return;
    const tanaanTehtavat = kaikkiTehtavat.filter(t =>
        !t.tehty && t.tila !== 'arkistoitu' && t.maarapaiva &&
        pvmMerkkijono(new Date(t.maarapaiva)) === tanaan);
    if (tanaanTehtavat.length > 0) {
        lahetaMuistutus('Tänään määräpäivä', `${tanaanTehtavat.length} tehtävää: ${tanaanTehtavat[0].teksti}${tanaanTehtavat.length > 1 ? '…' : ''}`);
        localStorage.setItem('muistutus-tehtavat-pvm', tanaan);
    } else {
        localStorage.setItem('muistutus-tehtavat-pvm', tanaan);
    }
}

function lahetaMuistutus(otsikko, viesti) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(otsikko, { body: viesti, icon: 'logo.png' });
        } catch (e) {
            naytaIlmoitus(`${otsikko}: ${viesti}`, 5000);
        }
    } else {
        naytaIlmoitus(`${otsikko}: ${viesti}`, 5000);
    }
    haptic();
}
