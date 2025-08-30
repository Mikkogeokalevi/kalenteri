import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.appspot.com",
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
const avaaLisaysLomakeBtn = document.getElementById('avaa-lisays-lomake-btn');
const sivupalkki = document.querySelector('.sivupalkki');
const hakuKentta = document.getElementById('haku-kentta');

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
    });
}

function handlePaivaClick(event) {
    const paivaEl = event.target.closest('.paiva');
    if (!paivaEl || paivaEl.classList.contains('tyhja')) {
        return;
    }
    if (event.target.closest('.tapahtuma-kuvake')) {
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

    paivitaTanaanBanneri();
    setInterval(paivitaTanaanBanneri, 1000); 

    sivupalkki.classList.add('hidden');

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
    const vikaKuunPaiva = new Date(vuosi, kuukausi + 1, 0);
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
            const onkoNykyinenKuukausi = paivaIt.getMonth() === kuukausi;
            
            let paivaLuokat = "paiva";
            if (!onkoNykyinenKuukausi) {
                paivaLuokat += " tyhja";
            }
            if (pvmString === tanaanString) {
                paivaLuokat += " tanaan";
            }

            kalenteriGrid.insertAdjacentHTML('beforeend', `
                <div class="${paivaLuokat}" data-paivamaara="${pvmString}">
                    <div class="paiva-numero">${paivaIt.getDate()}</div>
                    <div class="tapahtumat-container"></div>
                </div>
            `);
            paivaIt.setDate(paivaIt.getDate() + 1);
        }
        
        if (paivaIt > vikaKuunPaiva && paivaIt.getDay() === 1) {
            break;
        }
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
        ketakoskee: document.querySelector('input[name="ketakoskee"]:checked').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };
    if (!uusi.otsikko || !uusi.alku || !uusi.loppu) return alert('Täytä vähintään otsikko, alkamis- ja loppumisaika.');
    
    push(ref(database, 'tapahtumat'), uusi).then(() => {
        lisaaLomake.reset();
        sivupalkki.classList.add('hidden');
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
    });
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');
    if (!window.kaikkiTapahtumat || !nykyinenKayttaja) return;

    window.kaikkiTapahtumat.forEach(tapahtuma => {
        if (tapahtuma.nakyvyys?.[nykyinenKayttaja] && tapahtuma.alku) {
            const paivaEl = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.alku.substring(0, 10)}"]`);
            if (paivaEl) {
                const kuvake = document.createElement('div');
                
                let luokat = 'tapahtuma-kuvake';
                if (tapahtuma.ketakoskee) {
                    luokat += ` koskee-${tapahtuma.ketakoskee.toLowerCase()}`;
                }
                kuvake.className = luokat;
                kuvake.title = tapahtuma.otsikko;

                if (tapahtuma.ketakoskee) {
                    kuvake.textContent = tapahtuma.ketakoskee.charAt(0).toUpperCase();
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
    const today = new Date(nyt.getFullYear(), nyt.getMonth(), nyt.getDate()); 
    
    const tulevat = window.kaikkiTapahtumat
        .filter(t => {
            const nakyvyysJaAikaOk = t.nakyvyys?.[nykyinenKayttaja] && new Date(t.alku) >= today;
            if (!nakyvyysJaAikaOk) return false;

            if (hakutermi) {
                const otsikko = t.otsikko ? t.otsikko.toLowerCase() : '';
                const kuvaus = t.kuvaus ? t.kuvaus.toLowerCase() : '';
                return otsikko.includes(hakutermi) || kuvaus.includes(hakutermi);
            }
            
            return true;
        })
        .sort((a, b) => new Date(a.alku) - new Date(b.alku))
        .slice(0, 10);

    if (tulevat.length === 0) {
        if (hakutermi) {
            tulevatTapahtumatLista.innerHTML = '<p>Hakusanalla ei löytynyt tulevia tapahtumia.</p>';
        } else {
            tulevatTapahtumatLista.innerHTML = '<p>Ei tulevia tapahtumia.</p>';
        }
        return;
    }

    tulevat.forEach(tapahtuma => {
        const alku = new Date(tapahtuma.alku);
        const loppu = new Date(tapahtuma.loppu);

        const paiva = alku.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
        const alkuAika = alku.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
        const loppuAika = loppu.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });

        const aikaTeksti = `${alkuAika} - ${loppuAika}`;
        const item = document.createElement('div');
        
        let luokat = 'tuleva-tapahtuma-item';
        if (tapahtuma.ketakoskee) {
            luokat += ` koskee-${tapahtuma.ketakoskee.toLowerCase()}`;
        }
        item.className = luokat;
        
        let alkukirjain = '?';
        if (tapahtuma.ketakoskee) {
            alkukirjain = tapahtuma.ketakoskee.charAt(0).toUpperCase();
        }
        
        item.innerHTML = `
            <div class="tapahtuma-item-luoja">${alkukirjain}</div>
            <div class="tapahtuma-item-tiedot">
                <div class="tapahtuma-item-aika">${paiva} ${aikaTeksti}</div>
                <div class="tapahtuma-item-otsikko">${tapahtuma.otsikko}</div>
            </div>
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

    const ketakoskeeValue = tapahtuma.ketakoskee || 'perhe';
    document.querySelector(`input[name="muokkaa-ketakoskee"][value="${ketakoskeeValue}"]`).checked = true;

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

    const paivitys = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: document.getElementById('muokkaa-tapahtuma-alku').value,
        loppu: document.getElementById('muokkaa-tapahtuma-loppu').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {}),
        ketakoskee: document.querySelector('input[name="muokkaa-ketakoskee"]:checked').value,
        luoja: vanhaTapahtuma.luoja
    };
    update(ref(database, `tapahtumat/${key}`), paivitys).then(() => {
        vaihdaTila('view');
    });
}

function poistaTapahtuma() {
    const key = modalOverlay.dataset.tapahtumaId;
    if (confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
        remove(ref(database, `tapahtumat/${key}`)).then(() => suljeTapahtumaIkkuna());
    }
}

function kopioiTapahtuma() {
    const key = modalOverlay.dataset.tapahtumaId;
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    if (!tapahtuma) return;

    const uusiPvm = prompt("Anna uusi päivämäärä muodossa VVVV-KK-PP:", tapahtuma.alku.substring(0, 10));
    
    if (!uusiPvm || !/^\d{4}-\d{2}-\d{2}$/.test(uusiPvm)) {
        if (uusiPvm !== null) { 
            alert("Päivämäärä oli virheellinen. Kopiointia ei tehty.");
        }
        return;
    }

    const uusiTapahtuma = { ...tapahtuma };
    delete uusiTapahtuma.key; 

    uusiTapahtuma.alku = `${uusiPvm}T${tapahtuma.alku.substring(11)}`;
    uusiTapahtuma.loppu = `${uusiPvm}T${tapahtuma.loppu.substring(11)}`;

    push(ref(database, 'tapahtumat'), uusiTapahtuma).then(() => {
        naytaIlmoitus(`Tapahtuma kopioitu päivälle ${uusiPvm}.`);
        suljeTapahtumaIkkuna();
    }).catch(error => {
        alert("Tapahtui virhe kopioinnissa.");
        console.error("Kopiointivirhe:", error);
    });
}
