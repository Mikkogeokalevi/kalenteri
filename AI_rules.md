# AI Rules - Kauppisen perhekalenteri

## Sovelluksen yleiskuvaus

**Kauppisen perhekalenteri** on suomenkielinen web-pohjainen kalenteri- ja tehtävienhallintasovellus, joka on suunniteltu perheen yhteiskäyttöön.

## Perheenjäsenet ja värikoodit

| Henkilö | Väri | Hex-koodi |
|---------|------|-----------|
| Toni | Vihreä | `#2e8b57` |
| Kaisa | Violetti | `#9370db` |
| Oona | Sininen | `#4682b4` |
| Perhe (kaikki) | Punainen | `#f08080` |

## Tekninen stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Backend**: Firebase
  - Firebase Realtime Database (tietojen tallennus)
  - Firebase Authentication (kirjautuminen sähköposti/salasana)
- **Ei build-työkaluja** – suora selainlataus

## Tiedostorakenne

| Tiedosto | Kuvaus |
|----------|--------|
| `index.html` | Pääsivu, kaikki UI-elementit |
| `script.js` | Päälogiikka: tapahtumat, tehtävät, kalenteri, Firebase-yhteys |
| `style.css` | Kaikki tyylit |
| `components.js` | UI-komponenttien luontifunktiot |
| `auth.js` | Autentikointilogiikka |
| `utils.js` | Apufunktiot (päivämäärät, formatointi) |
| `vakiot.js` | Vakiot ja konfiguraatio |
| `ohjeet.js` | Käyttöohjeet |
| `firebase.js` | Firebase-konfiguraatio (varakopioitu) |

## Keskeiset ominaisuudet

1. **Tapahtumakalenteri**
   - Kuukausinäkymä
   - Tapahtumien lisäys, muokkaus, poisto
   - Koko päivän tapahtumat tai aikavälillä
   - Linkkien lisäys (esim. Google Maps, Teams)

2. **Tulevat tapahtumat -lista**
   - Suodatus henkilön mukaan (Kaikki, Perhe, Toni, Kaisa, Oona)
   - Hakutoiminto
   - Sivutus (10 tapahtumaa/sivu)

3. **Yhteinen muistilista (tehtävät)**
   - Tehtävien kohdistus henkilöille
   - Määräpäivän asetus
   - Arkistointi

4. **Menneet tapahtumat**
   - Erillinen modal-ikkuna
   - Haku ja sivutus

5. **Käyttäjähallinta**
   - Kirjautuminen/uloskirjautuminen
   - Näkyvyysasetukset tapahtumille

## Kieli ja lokalisointi

- **Kieli**: Suomi
- Kaikki UI-tekstit suomeksi
- Päivämääräformaatti: suomalainen (pp.kk.vvvv)
- Viikonpäivät alkavat maanantaista

## Kehityssäännöt

### Koodityyli
- Käytä suomenkielisiä muuttuja- ja funktionimia (kuten nykyisessä koodissa)
- Noudata olemassa olevaa koodityyliä
- Älä lisää tai poista kommentteja ilman pyyntöä
- ES6 module -syntaksi (import/export)

### UI/UX
- Säilytä nykyinen visuaalinen ilme
- Värikoodit perheenjäsenille pysyvät samoina
- Responsiivinen suunnittelu

### Firebase
- Realtime Database polut:
  - Tapahtumat: `/tapahtumat`
  - Tehtävät: `/tehtavat`
- Käytä `serverTimestamp()` aikaleimoja varten

### Testaus
- Testaa aina kirjautuneena ja kirjautumattomana
- Testaa eri perheenjäsenten näkyvyysasetuksilla

## Muistettavaa

- Sovellus on tuotantokäytössä (oikea perhe käyttää sitä)
- Älä riko olemassa olevia toiminnallisuuksia
- Firebase API-avain on koodissa (normaali käytäntö Firebase web-sovelluksille)

---

## Tulevat säännöt ja muistiinpanot

*Tähän lisätään uudet säännöt sitä mukaa kun niitä tulee:*

<!-- Lisää uudet säännöt tähän -->
