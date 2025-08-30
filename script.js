// script.js

// Tuo tarvittavat funktiot Firebase-kirjastoista
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Sinun web-sovelluksesi Firebase-konfiguraatio
const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.firebasestorage.app",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

// Alusta Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const tapahtumatRef = ref(database, 'tapahtumat');

// --- DOM-elementit ---
const kayttajaValitsin = document.getElementById('kayttaja');
const kalenteriGrid = document.getElementById('kalenteri-grid');
const kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
const edellinenBtn = document.getElementById('edellinen-kk');
const seuraavaBtn = document.getElementById('seuraava-kk');
const lomake = document.getElementById('lisaa-tapahtuma-lomake');

// --- Sovelluksen tila ---
let nykyinenKayttaja = kayttajaValitsin.value;
let nykyinenPaiva = new Date(); // Käytetään tätä kuukauden ja vuoden seuraamiseen

// --- Pääfunktio, joka käynnistyy latauksessa ---
document.addEventListener('DOMContentLoaded', () => {
    piirraKalenteri();
    lisaaKuuntelijat();
    kuunteleTapahtumia();
});


function lisaaKuuntelijat() {
    // Vaihda käyttäjää
    kayttajaValitsin.addEventListener('change', (e) => {
        nykyinenKayttaja = e.target.value;
        piirraKalenteri(); // Piirrä kalenteri uudelleen uudelle käyttäjälle
    });

    // Selaa kuukausia
    edellinenBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() - 1);
        piirraKalenteri();
    });
    seuraavaBtn.addEventListener('click', () => {
        nykyinenPaiva.setMonth(nykyinenPaiva.getMonth() + 1);
        piirraKalenteri();
    });

    // Lisää uusi tapahtuma
    lomake.addEventListener('submit', (e) => {
        e.preventDefault();
        lisaaTapahtuma();
    });
}

function piirraKalenteri() {
    kalenteriGrid.innerHTML = ''; // Tyhjennä vanha kalenteri
    const vuosi = nykyinenPaiva.getFullYear();
    const kuukausi = nykyinenPaiva.getMonth();

    kuukausiOtsikko.textContent = `${nykyinenPaiva.toLocaleString('fi-FI', { month: 'long' })} ${vuosi}`;

    const kuukaudenEkaPaiva = new Date(vuosi, kuukausi, 1);
    const kuukaudenVikaPaiva = new Date(vuosi, kuukausi + 1, 0);
    const paiviaKuukaudessa = kuukaudenVikaPaiva.getDate();
    
    // Viikonpäivä (0=su, 1=ma, ..., 6=la). Muutetaan suomalaisittain.
    let viikonpaivaIndeksi = kuukaudenEkaPaiva.getDay();
    if (viikonpaivaIndeksi === 0) viikonpaivaIndeksi = 7; // Su -> 7
    
    // Lisää tyhjät päivät ennen kuukauden ensimmäistä päivää
    for (let i = 1; i < viikonpaivaIndeksi; i++) {
        const tyhjaPaiva = document.createElement('div');
        tyhjaPaiva.classList.add('paiva', 'tyhja');
        kalenteriGrid.appendChild(tyhjaPaiva);
    }

    // Lisää kaikki kuukauden päivät
    for (let i = 1; i <= paiviaKuukaudessa; i++) {
        const paivaElementti = document.createElement('div');
        paivaElementti.classList.add('paiva');
        paivaElementti.dataset.paivamaara = `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const numeroElementti = document.createElement('div');
        numeroElementti.classList.add('paiva-numero');
        numeroElementti.textContent = i;
        paivaElementti.appendChild(numeroElementti);
        
        const tapahtumatContainer = document.createElement('div');
        tapahtumatContainer.classList.add('tapahtumat-container');
        paivaElementti.appendChild(tapahtumatContainer);

        kalenteriGrid.appendChild(paivaElementti);
    }

    naytaTapahtumatKalenterissa();
}

function lisaaTapahtuma() {
    const otsikko = document.getElementById('tapahtuma-otsikko').value;
    const paivamaara = document.getElementById('tapahtuma-pvm').value;
    const aika = document.getElementById('tapahtuma-aika').value;

    if (!otsikko || !paivamaara) {
        alert('Tapahtuman nimi ja päivämäärä vaaditaan!');
        return;
    }
    
    const nakyvyysValinnat = document.querySelectorAll('input[name="nakyvyys"]:checked');
    const nakyvyys = {};
    ['Toni', 'Kaisa', 'Oona'].forEach(nimi => {
        nakyvyys[nimi] = Array.from(nakyvyysValinnat).some(checkbox => checkbox.value === nimi);
    });

    const uusiTapahtuma = {
        otsikko: otsikko,
        paivamaara: paivamaara,
        aika: aika,
        luoja: nykyinenKayttaja,
        nakyvyys: nakyvyys
    };

    push(tapahtumatRef, uusiTapahtuma)
        .then(() => {
            lomake.reset();
            // Aseta checkboxit takaisin valituiksi
             document.querySelectorAll('input[name="nakyvyys"]').forEach(cb => cb.checked = true);
        })
        .catch((error) => {
            console.error("Virhe tallennuksessa: ", error);
            alert("Tapahtuman lisääminen epäonnistui.");
        });
}

function kuunteleTapahtumia() {
    onValue(tapahtumatRef, (snapshot) => {
        // Tallenna kaikki tapahtumat välimuistiin, jotta emme hae niitä jatkuvasti
        window.kaikkiTapahtumat = [];
        snapshot.forEach((childSnapshot) => {
            window.kaikkiTapahtumat.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        // Päivitä näkymä heti kun data muuttuu
        naytaTapahtumatKalenterissa();
    });
}

function naytaTapahtumatKalenterissa() {
    // Poista vanhat tapahtumat näkyvistä
    document.querySelectorAll('.tapahtuma').forEach(el => el.remove());

    if (!window.kaikkiTapahtumat) return;

    window.kaikkiTapahtumat.forEach(tapahtuma => {
        // Tarkista näkyvyys nykyiselle käyttäjälle
        if (tapahtuma.nakyvyys && tapahtuma.nakyvyys[nykyinenKayttaja]) {
            const paivaElementti = document.querySelector(`.paiva[data-paivamaara="${tapahtuma.paivamaara}"]`);
            if (paivaElementti) {
                const tapahtumaElementti = document.createElement('div');
                tapahtumaElementti.classList.add('tapahtuma');
                tapahtumaElementti.textContent = tapahtuma.otsikko;

                // Korosta tapahtumia, jotka käyttäjä on itse luonut
                if (tapahtuma.luoja === nykyinenKayttaja) {
                    tapahtumaElementti.classList.add('oma');
                }

                paivaElementti.querySelector('.tapahtumat-container').appendChild(tapahtumaElementti);
            }
        }
    });
}
