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

// --- DOM-elementit ---
const kayttajaValitsin = document.getElementById('kayttaja');
const kalenteriGrid = document.getElementById('kalenteri-grid');
const kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
const edellinenBtn = document.getElementById('edellinen-kk');
const seuraavaBtn = document.getElementById('seuraava-kk');
const lomake = document.getElementById('lisaa-tapahtuma-lomake');

// Muokkausikkunan elementit
const modalOverlay = document.getElementById('muokkaus-modal-overlay');
const muokkausLomake = document.getElementById('muokkaa-tapahtuma-lomake');
const tallennaBtn = document.getElementById('tallenna-muutokset-btn');
const poistaBtn = document.getElementById('poista-tapahtuma-btn');
const peruutaBtn = document.getElementById('peruuta-btn');

// --- Sovelluksen tila ---
let nykyinenKayttaja = kayttajaValitsin.value;
let nykyinenPaiva = new Date();

document.addEventListener('DOMContentLoaded', () => {
    piirraKalenteri();
    lisaaKuuntelijat();
    kuunteleTapahtumia();
});

function lisaaKuuntelijat() {
    kayttajaValitsin.addEventListener('change', (e) => {
        nykyinenKayttaja = e.target.value;
        piirraKalenteri();
    });

    edellinenBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() - 1);
        piirraKalenteri();
    });
    seuraavaBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() + 1);
        piirraKalenteri();
    });

    lomake.addEventListener('submit', (e) => {
        e.preventDefault();
        lisaaTapahtuma();
    });

    // Muokkausikkunan kuuntelijat
    peruutaBtn.addEventListener('click', suljeMuokkausIkkuna);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            suljeMuokkausIkkuna();
        }
    });
    tallennaBtn.addEventListener('click', tallennaMuutokset);
    poistaBtn.addEventListener('click', poistaTapahtuma);
}

function piirraKalenteri() {
    kalenteriGrid.innerHTML = '';
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();
    kuukausiOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${vuosi}`;

    const kuukaudenEkaPaiva = new Date(vuosi, kuukausi, 1);
    const kuukaudenVikaPaiva = new Date(vuosi, kuukausi + 1, 0);
    const paiviaKuukaudessa = kuukaudenVikaPaiva.getDate();
    
    let viikonpaivaIndeksi = kuukaudenEkaPaiva.getDay();
    if (viikonpaivaIndeksi === 0) viikonpaivaIndeksi = 7;
    
    for (let i = 1; i < viikonpaivaIndeksi; i++) {
        kalenteriGrid.insertAdjacentHTML('beforeend', '<div class="paiva tyhja"></div>');
    }

    for (let i = 1; i <= paiviaKuukaudessa; i++) {
        const paivamaara = `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const paivaElementti = `
            <div class="paiva" data-paivamaara="${paivamaara}">
                <div class="paiva-numero">${i}</div>
                <div class="tapahtumat-container"></div>
            </div>`;
        kalenteriGrid.insertAdjacentHTML('beforeend', paivaElementti);
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
        nakyvyys: {}
    };

    document.querySelectorAll('input[name="nakyvyys"]:checked').forEach(checkbox => {
        uusiTapahtuma.nakyvyys[checkbox.value] = true;
    });

    if (!uusiTapahtuma.otsikko || !uusiTapahtuma.alku || !uusiTapahtuma.loppu) {
        alert('Täytä vähintään otsikko, alkamis- ja loppumisaika.');
        return;
    }

    const tapahtumatRef = ref(database, 'tapahtumat');
    push(tapahtumatRef, uusiTapahtuma).then(() => lomake.reset());
}

function kuunteleTapahtumia() {
    const tapahtumatRef = ref(database, 'tapahtumat');
    onValue(tapahtumatRef, (snapshot) => {
        window.kaikkiTapahtumat = [];
        snapshot.forEach((childSnapshot) => {
            window.kaikkiTapahtumat.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        naytaTapahtumatKalenterissa();
    });
}

function naytaTapahtumatKalenterissa() {
    document.querySelectorAll('.tapahtumat-container').forEach(c => c.innerHTML = '');

    if (!window.kaikkiTapahtumat) return;

    window.kaikkiTapahtumat.forEach(tapahtuma => {
        if (tapahtuma.nakyvyys && tapahtuma.nakyvyys[nykyinenKayttaja]) {
            const tapahtumanPaiva = tapahtuma.alku.substring(0, 10);
            const paivaElementti = document.querySelector(`.paiva[data-paivamaara="${tapahtumanPaiva}"]`);
            if (paivaElementti) {
                const tapahtumaElementti = document.createElement('div');
                tapahtumaElementti.classList.add('tapahtuma');
                tapahtumaElementti.textContent = tapahtuma.otsikko;
                tapahtumaElementti.dataset.id = tapahtuma.key;
                if (tapahtuma.luoja === nykyinenKayttaja) {
                    tapahtumaElementti.classList.add('oma');
                }
                
                // Lisää kuuntelija, joka avaa muokkausikkunan
                tapahtumaElementti.addEventListener('click', () => avaaMuokkausIkkuna(tapahtuma.key));

                paivaElementti.querySelector('.tapahtumat-container').appendChild(tapahtumaElementti);
            }
        }
    });
}

// --- Muokkausikkunan funktiot ---

function avaaMuokkausIkkuna(key) {
    const tapahtuma = window.kaikkiTapahtumat.find(t => t.key === key);
    if (!tapahtuma) return;

    // Täytä lomakkeen kentät
    document.getElementById('muokkaa-tapahtuma-id').value = key;
    document.getElementById('muokkaa-tapahtuma-otsikko').value = tapahtuma.otsikko;
    document.getElementById('muokkaa-tapahtuma-kuvaus').value = tapahtuma.kuvaus || '';
    document.getElementById('muokkaa-tapahtuma-alku').value = tapahtuma.alku;
    document.getElementById('muokkaa-tapahtuma-loppu').value = tapahtuma.loppu;
    
    // Aseta näkyvyys-checkboxit
    document.querySelectorAll('input[name="muokkaa-nakyvyys"]').forEach(checkbox => {
       checkbox.checked = !!(tapahtuma.nakyvyys && tapahtuma.nakyvyys[checkbox.value]);
    });

    modalOverlay.classList.remove('hidden');
}

function suljeMuokkausIkkuna() {
    modalOverlay.classList.add('hidden');
}

function tallennaMuutokset() {
    const key = document.getElementById('muokkaa-tapahtuma-id').value;
    const paivitettyTapahtuma = {
        otsikko: document.getElementById('muokkaa-tapahtuma-otsikko').value,
        kuvaus: document.getElementById('muokkaa-tapahtuma-kuvaus').value,
        alku: document.getElementById('muokkaa-tapahtuma-alku').value,
        loppu: document.getElementById('muokkaa-tapahtuma-loppu').value,
        nakyvyys: {}
    };

    document.querySelectorAll('input[name="muokkaa-nakyvyys"]:checked').forEach(checkbox => {
        paivitettyTapahtuma.nakyvyys[checkbox.value] = true;
    });

    const tapahtumaRef = ref(database, `tapahtumat/${key}`);
    update(tapahtumaRef, paivitettyTapahtuma).then(() => {
        suljeMuokkausIkkuna();
    });
}

function poistaTapahtuma() {
    const key = document.getElementById('muokkaa-tapahtuma-id').value;
    if (confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
        const tapahtumaRef = ref(database, `tapahtumat/${key}`);
        remove(tapahtumaRef).then(() => {
            suljeMuokkausIkkuna();
        });
    }
}
