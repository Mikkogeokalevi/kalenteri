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
    edellinenSivuBtn, seuraavaSivuBtn, sivuInfo, koskeeSuodatin;

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
    koskeeSuodatin = document.getElementById('koskee-suodatin');
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
    
    hakuKentta.addEventListener('input', naytaTulevatTapahtumat);
    koskeeSuodatin.addEventListener('change', naytaTulevatTapahtumat);

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
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;
    const hakutermi = hakuKentta.value.toLowerCase();
    const suodatinValue = koskeeSuodatin.value;
    const nyt = new Date();
    const tulevat = window.kaikkiTapahtumat.filter(t => {
        const nakyvyysJaAikaOk = t.nakyvyys?.[nykyinenKayttaja] && new Date(t.loppu) >= nyt;
        if (!nakyvyysJaAikaOk) return false;
        if (suodatinValue !== 'kaikki') {
            const ketakoskee = Array.isArray(t.ketakoskee) ? t.ketakoskee.sort() : [String(t.ketakoskee)];
            const suodatinNimet = suodatinValue.split('-').sort();
            if (ketakoskee.join('-') !== suodatinNimet.join('-')) {
                 return false;
            }
        }
        if (hakutermi) {
            const otsikko = (t.otsikko || '').toLowerCase();
            const kuvaus = (t.kuvaus || '').toLowerCase();
            if (!otsikko.includes(hakutermi) && !kuvaus.includes(hakutermi)) {
                return false;
            }
        }
        return true;
    }).sort((a, b) => new Date(a.alku) - new Date(b.alku));
    tulevatTapahtumatLista.innerHTML = '';
    if (tulevat.length === 0) {
        tulevatTapahtumatLista.innerHTML = `<p style="text-align:center; opacity:0.7;">Ei hakua vastaavia tulevia tapahtumia.</p>`;
        return;
    }
    tulevat.slice(0, 10).forEach(tapahtuma => {
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
    document.getElementById('view-kuvaus').textContent = tapahtuma.kuvaus || 'Ei lisätietoja.';
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
    const paivitys = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: alkuAika, loppu: loppuAika, kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('muokkaa-tapahtuma-linkki').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {}),
        ketakoskee: koskeeValinnat, luoja: vanhaTapahtuma.luoja
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
    if (confirm('Haluatko varmasti poistaa tämän tehtävän?')) {
        remove(ref(database, `tapahtumat/${key}`));
    }
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
        alert("Tapahtui virhe kopioinnissa.");
        console.error("Kopiointivirhe:", error);
    });
}

function kuunteleTehtavia() {
    if (unsubscribeFromTasks) unsubscribeFromTasks();
    const tehtavatRef = ref(database, 'tehtavalista');
    unsubscribeFromTasks = onValue(tehtavatRef, (snapshot) => {
        piirraTehtavalista(snapshot);
    });
}

function piirraTehtavalista(snapshot) {
    tehtavatContainer.innerHTML = '';
    const tehtavat = [];
    snapshot.forEach(child => {
        tehtavat.push({ key: child.key, ...child.val() });
    });
    const avoimet = tehtavat.filter(t => !t.tehty);
    avoimetTehtavatLaskuri.textContent = `${avoimet.length} avointa`;
    tehtavat.sort((a, b) => a.tehty - b.tehty);
    if (tehtavat.length === 0) {
        tehtavatContainer.innerHTML = '<p style="text-align:center; opacity:0.7;">Lista on tyhjä.</p>';
        return;
    }
    tehtavat.forEach(tehtava => {
        const item = document.createElement('div');
        item.className = 'tehtava-item';
        if (tehtava.tehty) item.classList.add('tehty');
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
        if (tehtava.luoja) metaTeksti += `Lisännyt ${tehtava.luoja}`;
        if (tehtava.lisattyAika) {
            const pvm = new Date(tehtava.lisattyAika).toLocaleDateString('fi-FI');
            const aika = new Date(tehtava.lisattyAika).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            metaTeksti += ` - ${pvm} klo ${aika}`;
        }
        meta.textContent = metaTeksti;
        tiedotContainer.appendChild(teksti);
        tiedotContainer.appendChild(meta);
        const poistaNappi = document.createElement('button');
        poistaNappi.className = 'poista-tehtava-nappi';
        poistaNappi.textContent = 'X';
        poistaNappi.addEventListener('click', () => poistaTehtava(tehtava.key));
        item.appendChild(checkbox);
        item.appendChild(tiedotContainer);
        item.appendChild(poistaNappi);
        tehtavatContainer.appendChild(item);
    });
}

function lisaaTehtava() {
    const teksti = uusiTehtavaTeksti.value.trim();
    if (teksti === '') return;
    const uusiTehtava = {
        teksti: teksti,
        tehty: false,
        luoja: nykyinenKayttaja,
        lisattyAika: serverTimestamp()
    };
    push(ref(database, 'tehtavalista'), uusiTehtava).then(() => {
        uusiTehtavaTeksti.value = '';
    });
}

function paivitaTehtavanTila(key, onkoTehty) {
    update(ref(database, `tehtavalista/${key}`), { tehty: onkoTehty });
}

function poistaTehtava(key) {
    if (confirm('Haluatko varmasti poistaa tämän tehtävän?')) {
        remove(ref(database, `tehtavalista/${key}`));
    }
}
