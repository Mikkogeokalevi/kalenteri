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
    Toni: '#2e8b57',
    Kaisa: '#9370db',
    Oona: '#4682b4',
    perhe: '#f08080'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// --- DOM-elementit (Määritellään muuttujat) ---
let loginOverlay, loginForm, mainContainer, currentUserName, logoutBtn, tulevatTapahtumatLista,
    kalenteriPaivatOtsikot, kalenteriGrid, kuukausiOtsikko, edellinenBtn, seuraavaBtn,
    lisaaLomake, modalOverlay, modalViewContent, modalEditContent, avaaLisaysLomakeBtn,
    sivupalkki, hakuKentta, tehtavatContainer, uusiTehtavaTeksti, lisaaTehtavaNappi,
    tehtavalistaToggle, tehtavalistaSisalto, avoimetTehtavatLaskuri, avaaMenneetModalBtn,
    menneetTapahtumatModal, suljeMenneetModalBtn, menneetHakuKentta, menneetTapahtumatLista,
    edellinenSivuBtn, seuraavaSivuBtn, sivuInfo;

// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();
let unsubscribeFromEvents = null;
let unsubscribeFromTasks = null;
let menneetSivu = 0;
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
}

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

document.addEventListener('DOMContentLoaded', () => {
    alustaElementit();
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
        naytaTulevatTapahtumat();
        korostaHakuOsumatKalenterissa();
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
            lisaaTehtava();
        }
    });
    tehtavalistaToggle.addEventListener('click', () => {
        tehtavalistaSisalto.classList.toggle('hidden');
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
        .then((userCredential) => {
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
    if (nykyinenKayttaja === userName && mainContainer.classList.contains('hidden') === false) return;
    
    nykyinenKayttaja = userName;
    loginOverlay.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    currentUserName.textContent = nykyinenKayttaja;
    applyTheme(nykyinenKayttaja);
    paivitaTanaanBanneri();
    setInterval(paivitaTanaanBanneri, 60000); 
    sivupalkki.classList.add('hidden');
    
    // Nämä rivit siirretään tänne, jotta ne ajetaan vasta kun käyttäjä on varmasti tiedossa
    kuunteleTapahtumia();
    kuunteleTehtavia();
    
    piirraKalenteri();
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
            kalenteriGrid.insertAdjacentHTML('beforeend', `<div class="${paivaLuokat}" data-paivamaara="${pvmString}"><div class="paiva-numero">${paivaIt.getDate()}</div><div class="tapahtumat-container"></div></div>`);
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
    const uusi = {
        otsikko: document.getElementById('tapahtuma-otsikko').value,
        kuvaus: document.getElementById('tapahtuma-kuvaus').value,
        alku: alkuAika, loppu: loppuAika, kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('tapahtuma-linkki').value,
        luoja: nykyinenKayttaja, ketakoskee: koskeeValinnat,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };
    if (!uusi.otsikko || !uusi.alku || !uusi.loppu || koskeeValinnat.length === 0) return alert('Täytä vähintään otsikko, päivämäärä ja ketä tapahtuma koskee.');
    push(ref(database, 'tapahtumat'), uusi).then(() => {
        lisaaLomake.reset();
        sivupalkki.classList.add('hidden');
        toggleLoppuAika(false, 'loppu-aika-lisaa-container');
        naytaIlmoitus('Tapahtuma lisätty onnistuneesti!');
    });
}

function kuunteleTapahtumia() {
    if (unsubscribeFromEvents) unsubscribeFromEvents();
    const tapahtumatRef = ref(database, 'tapahtumat');
    unsubscribeFromEvents = onValue(tapahtumatRef, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((child) => {
            window.kaikkiTapahtumat.push({ key: child.key, ...child.val() });
        });
        naytaTapahtumatKalenterissa();
        naytaTulevatTapahtumat();
        korostaHakuOsumatKalenterissa();
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
    // ... (This function remains unchanged from the previous version)
}

function naytaTulevatTapahtumat() {
    // ... (This function remains unchanged from the previous version)
}

function korostaHakuOsumatKalenterissa() {
    // ... (This function remains unchanged from the previous version)
}

function avaaTapahtumaIkkuna(key) {
    // ... (This function remains unchanged from the previous version)
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
    // ... (This function remains unchanged from the previous version)
}

function poistaTapahtuma() {
    // ... (This function remains unchanged from the previous version)
}

function kopioiTapahtuma() {
    // ... (This function remains unchanged from the previous version)
}

function kuunteleTehtavia() {
    if (unsubscribeFromTasks) unsubscribeFromTasks();
    const tehtavatRef = ref(database, 'tehtavalista');
    unsubscribeFromTasks = onValue(tehtavatRef, (snapshot) => {
        piirraTehtavalista(snapshot);
    });
}

function piirraTehtavalista(snapshot) {
    // ... (This function remains unchanged from the previous version)
}

function lisaaTehtava() {
    // ... (This function remains unchanged from the previous version)
}

function paivitaTehtavanTila(key, onkoTehty) {
    update(ref(database, `tehtavalista/${key}`), { tehty: onkoTehty });
}

function poistaTehtava(key) {
    if (confirm('Haluatko varmasti poistaa tämän tehtävän?')) {
        remove(ref(database, `tehtavalista/${key}`));
    }
}
