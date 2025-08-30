import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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

const tehtavatContainer = document.getElementById('tehtavat-container');
const uusiTehtavaTeksti = document.getElementById('uusi-tehtava-teksti');
const lisaaTehtavaNappi = document.getElementById('lisaa-tehtava-nappi');
const tehtavalistaToggle = document.getElementById('tehtavalista-toggle');
const tehtavalistaSisalto = document.getElementById('tehtavalista-sisalto');
const avoimetTehtavatLaskuri = document.getElementById('avoimet-tehtavat-laskuri');


// --- Sovelluksen tila ---
let nykyinenKayttaja = null;
let nykyinenPaiva = new Date();
let unsubscribeFromEvents = null;
let unsubscribeFromTasks = null; 

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

    // MUUTETTU HAKUKENTÄN KUUNTELIJA
    hakuKentta.addEventListener('input', () => {
        naytaTulevatTapahtumat(); // Päivittää edelleen tulevien listan
        korostaHakuOsumatKalenterissa(); // UUSI: Korostaa osumat kalenterista
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
    if (unsubscribeFromEvents) unsubscribeFromEvents();
    if (unsubscribeFromTasks) unsubscribeFromTasks(); 
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
    kuunteleTehtavia();
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
    korostaHakuOsumatKalenterissa(); // UUSI KUTSU
}

function lisaaTapahtuma() {
    const kokoPaivaCheckbox = document.getElementById('tapahtuma-koko-paiva');
    const alkuInput = document.getElementById('tapahtuma-alku');
    let alkuAika, loppuAika;

    if (kokoPaivaCheckbox.checked) {
        const paivamaara = alkuInput.value.substring(0, 10);
        if(!paivamaara) return alert('Valitse päivämäärä ensin, tai poista "Koko päivän" valinta.');
        alkuAika = `${paivamaara}T00:00`;
        loppuAika = `${paivamaara}T23:59`;
    } else {
        alkuAika = alkuInput.value;
        loppuAika = document.getElementById('tapahtuma-loppu').value;
    }

    const uusi = {
        otsikko: document.getElementById('tapahtuma-otsikko').value,
        kuvaus: document.getElementById('tapahtuma-kuvaus').value,
        alku: alkuAika,
        loppu: loppuAika,
        kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('tapahtuma-linkki').value,
        luoja: nykyinenKayttaja,
        ketakoskee: document.querySelector('input[name="ketakoskee"]:checked').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {})
    };
    if (!uusi.otsikko || !uusi.alku || !uusi.loppu) return alert('Täytä vähintään otsikko ja päivämäärä.');
    
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
        const paiva = alku.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' });
        
        let aikaTeksti;
        if (tapahtuma.kokoPaiva) {
            aikaTeksti = "Koko päivän";
        } else {
            const loppu = new Date(tapahtuma.loppu);
            const alkuAika = alku.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            const loppuAika = loppu.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
            aikaTeksti = `${alkuAika} - ${loppuAika}`;
        }
        
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

// UUSI FUNKTIO
function korostaHakuOsumatKalenterissa() {
    // Poistetaan ensin vanhat korostukset
    document.querySelectorAll('.paiva.haku-osuma').forEach(el => el.classList.remove('haku-osuma'));

    const hakutermi = hakuKentta.value.toLowerCase().trim();
    if (hakutermi === '' || !window.kaikkiTapahtumat) {
        return;
    }

    const osumat = window.kaikkiTapahtumat.filter(tapahtuma => {
        // Etsitään kaikista tapahtumista, riippumatta päivämäärästä
        if (!tapahtuma.nakyvyys?.[nykyinenKayttaja]) return false;
        
        const otsikko = (tapahtuma.otsikko || '').toLowerCase();
        const kuvaus = (tapahtuma.kuvaus || '').toLowerCase();
        return otsikko.includes(hakutermi) || kuvaus.includes(hakutermi);
    });

    osumat.forEach(tapahtuma => {
        const pvmString = tapahtuma.alku.substring(0, 10);
        const paivaEl = document.querySelector(`.paiva[data-paivamaara="${pvmString}"]`);
        if (paivaEl) {
            paivaEl.classList.add('haku-osuma');
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

    if (tapahtuma.kokoPaiva) {
        const pvm = new Date(tapahtuma.alku).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('view-aika').textContent = `${pvm} (Koko päivän)`;
    } else {
        const alkuPvm = new Date(tapahtuma.alku);
        const loppuPvm = new Date(tapahtuma.loppu);
        const options = { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        document.getElementById('view-aika').textContent = `${alkuPvm.toLocaleString('fi-FI', options)} - ${loppuPvm.toLocaleString('fi-FI', options)}`;
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
    
    const kokoPaivaCheckbox = document.getElementById('muokkaa-tapahtuma-koko-paiva');
    const alkuInput = document.getElementById('muokkaa-tapahtuma-alku');
    let alkuAika, loppuAika;

    if (kokoPaivaCheckbox.checked) {
        const paivamaara = alkuInput.value.substring(0, 10);
        alkuAika = `${paivamaara}T00:00`;
        loppuAika = `${paivamaara}T23:59`;
    } else {
        alkuAika = alkuInput.value;
        loppuAika = document.getElementById('muokkaa-tapahtuma-loppu').value;
    }

    const paivitys = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: alkuAika,
        loppu: loppuAika,
        kokoPaiva: kokoPaivaCheckbox.checked,
        linkki: document.getElementById('muokkaa-tapahtuma-linkki').value,
        nakyvyys: Array.from(document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked')).reduce((a, c) => ({ ...a, [c.value]: true }), {}),
        ketakoskee: document.querySelector('input[name="muokkaa-ketakoskee"]:checked').value,
        luoja: vanhaTapahtuma.luoja
    };
    update(ref(database, `tapahtumat/${key}`), paivitys).then(() => {
        const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
        if (tapahtuma) {
            Object.assign(tapahtuma, paivitys);
        }
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


// --- TEHTÄVÄLISTAN FUNKTIOT ---

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
        if (tehtava.tehty) {
            item.classList.add('tehty');
        }

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
        if (tehtava.luoja) {
            metaTeksti += `Lisännyt ${tehtava.luoja}`;
        }
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
    update(ref(database, `tehtavalista/${key}`), {
        tehty: onkoTehty
    });
}

function poistaTehtava(key) {
    if (confirm('Haluatko varmasti poistaa tämän tehtävän?')) {
        remove(ref(database, `tehtavalista/${key}`));
    }
}
