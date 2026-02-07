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
| `auth.js` | Autentikointilogiikka |
| `utils.js` | Apufunktiot (päivämäärät, formatointi) |
| `vakiot.js` | Vakiot ja konfiguraatio |
| `ohjeet.js` | Käyttöohjeet |
| `backup.bat` | Varmuuskopiointiskripti |
| `update_github.bat` | GitHub-päivitysskripti |

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

---

## � NYKYINEN TILANNE (päivitetty 7.2.2026)

### ✅ VALMIIT OMINAISUUDET

**Vaihe 1.1: CSS-modernisointi** ✅
- Moderni tumma väripaletti CSS-muuttujilla
- Google Fonts (Inter, Space Grotesk)
- Korttipohjainen layout
- Responsiivinen mobiililayout
- Animaatiot ja siirtymät
- Päivitetyt käyttäjävärit:
  - Toni: `#4ade80` (vihreä)
  - Kaisa: `#c084fc` (violetti)
  - Oona: `#60a5fa` (sininen)
  - Perhe: `#fb7185` (punainen)

**Vaihe 1.2: Perusilmoitukset** ✅
- NotificationManager-luokka (script.js:ssä)
- Browser Notification API -tuki
- Tapahtumamuistutukset (15min, 1h, 1pv ennen)
- Tehtävämuistutukset (1pv ennen määräpäivää)
- Ilmoitusasetukset-modal (🔔-nappi footerissa)
- Muistutusvalinnat tapahtuman luonnissa ja muokkauksessa
- Tallennus Firebaseen (muistutukset-kenttä)

**PWA-tuki** ✅
- manifest.json
- sw.js (Service Worker, versio v6)
- Offline-välimuisti fonteille ja tiedostoille

### 🔧 TIEDOSTORAKENNE

| Tiedosto | Rivejä | Kuvaus |
|----------|--------|--------|
| `script.js` | ~1455 | Päälogiikka, kaikki toiminnot |
| `style.css` | ~1190 | Kaikki tyylit |
| `index.html` | ~325 | UI-rakenne |
| `sw.js` | ~50 | Service Worker |
| `manifest.json` | ~20 | PWA-manifesti |

### ⚠️ TÄRKEÄÄ MUISTAA

1. **ÄLÄ REFAKTOROI script.js:ää moduuleihin** - yritettiin, meni rikki
2. **Testaa AINA kirjautuminen** ennen pushia
3. **Päivitä sw.js CACHE_NAME** kun teet muutoksia (nyt v6)
4. **Sovellus on tuotantokäytössä** - oikea perhe käyttää

### 🎯 SEURAAVAKSI (Vaihe 2)

1. **Toistuvat tapahtumat** - viikoittaiset/kuukausittaiset
2. **Push-ilmoitukset 2.0** - PWA:n kautta
3. **Raporttinäkymä** - viikkoyhteenveto

---

## �🚀 Kehityssuunnitelma ja parannusehdotukset

### Analyysi nykytilanteesta
**Vahvuudet:**
- Toimiva peruskalenteri – kuukausinäkymä, tapahtumien hallinta
- Hyvä tehtäväjärjestelmä – kohdistus henkilöille, määräpäivät, arkisto
- Perhekeskeinen – värikoodit, näkyvyysasetukset
- Teknisesti siisti – Vanilla JS, Firebase, PWA-tuki
- Suomenkielinen – täysin lokalisoitu

**Kehityskohteet:**
- Käyttöliittymä on hieman vanhanaikainen
- Puuttuvat modernit ominaisuudet (ilmoitukset, synkronointi)
- Mobiilikokemus voisi olla parempi
- Ei raportointia tai tilastoja

---

### 🎯 Parannusehdotukset (prioriteettijärjestyksessä)

#### 1. **Käyttöliittymän modernisointi** (Korkea prioriteetti)
- **Visuaalinen päivitys** – moderni CSS, paremmat värit, animaatiot
- **Mobiiliresponsiivisuus** – parempi puhelinkäyttö
- **Paremmat ikonit** – moderni ikonijärjestelmä
- **Tumma/vaalea teema** – käyttäjän valittavissa

#### 2. **Ilmoitukset ja muistutukset** (Korkea prioriteetti)
- **Push-ilmoitukset** – tapahtumamuistutukset
- **Selaimeen perustuvat ilmoitukset** – PWA:n kautta
- **Muistutusasetukset** – milloin ilmoittaa
- **Tehtävämuistutukset** – määräpäivien lähestyessä

#### 3. **Tapahtumien laajennukset** (Keskipitkä prioriteetti)
- **Toistuvat tapahtumat** – viikoittaiset, kuukausittaiset
- **Tapahtumakategoriat** – työ, vapaa-aika, juhlat jne.
- **Tiedostoliitteet** – kuvat, dokumentit
- **Kutsut ja RSVP** – kutsu muita perheenjäseniä

#### 4. **Raportointi ja tilastot** (Keskipitkä prioriteetti)
- **Viikko/kuukausiraportit** – perheen yhteenveto
- **Tehtävätilastot** – kuka tekee mitä
- **Kiireellisyysnäkymä** – tänään/tämän viikon tapahtumat
- **Tulostettava versio** – paperille tulostus

#### 5. **Käyttökokemuksen parannukset** (Matala prioriteetti)
- **Pikatoiminnot** – drag&drop, näppäinoikotiet
- **Hakutoiminnon parannus** – tarkempi haku, suodattimet
- **Offline-tuen parannus** – enemmän toiminnallisuus offline
- **Tuo/vie** – kalenteritiedostojen tuonti/exportti

---

### 🛠️ Toteutussuunnitelma

#### Vaihe 1 (1-2 viikkoa) – Perusmodernisointi
**Tavoitteet:**
- Käyttöliittymän modernisointi (CSS, värit, layout)
- Mobiiliresponsiivisuuden parannus
- Perusilmoitusten lisääminen

**Konkreettiset tehtävät:**
1. **CSS-uudistus**:
   - Moderni väripaletti ja kontrastit
   - Korttipohjainen layout
   - Parempi animaatiot ja siirtymät
   - Responsiivinen grid/flexbox

2. **Mobiilioptimointi**:
   - Touch-ystävälliset napit
   - Parempi puhelinnäkymä
   - Swipe-temput kalenterissa

3. **Perusilmoitukset**:
   - Browser Notification API
   - Tapahtumamuistutukset (15min, 1h ennen)
   - Tehtävämuistutukset määräpäiville

#### Vaihe 2 (2-3 viikkoa) – Laajennukset
**Tavoitteet:**
- Toistuvat tapahtumat
- Push-ilmoitusten täysversio
- Raporttinäkymän perusversio

**Konkreettiset tehtävät:**
1. **Toistuvat tapahtumat**:
   - Viikoittaiset/kuukausittaiset toistot
   - Poikkeuspäivien hallinta
   - Toistojen muokkaus/poisto

2. **Ilmoitukset 2.0**:
   - Push-ilmoitukset PWA:n kautta
   - Muistutusasetukset käyttäjälle
   - Ilmoitushistoria

3. **Raportointi**:
   - Viikkonäkymä tapahtumista
   - Tehtävätilastot perheenjäsenittäin
   - Tulostettava versio

#### Vaihe 3 (jatkokehitys) – Edistyneet ominaisuudet
**Tavoitteet:**
- Kategoriat ja liitteet
- Tilastot ja analytiikka
- Kutsujärjestelmä

**Konkreettiset tehtävät:**
1. **Kategoriat**:
   - Tapahtumaluokat (työ, vapaa-aika, juhlat)
   - Omat värit kategorioille
   - Suodatus kategorioilla

2. **Liitteet**:
   - Kuvien lisäys tapahtumiin
   - Dokumenttiliitteet
   - Tiedostojen hallinta Firebase Storage

3. **Kutsut**:
   - Kutsu muita perheenjäseniä
   - RSVP-vastaukset
   - Kutsuhistoria

---

### 💡 Teknisiä parannuksia

#### Suorituskyky
- **Lazy loading** – suurten datamäärien käsittely
- **Optimoitu välimuisti** – parempi SW-strategia
- **Kuvien optimointi** – logo ja mahdolliset liitteet

#### Tietoturva
- **Parempi autentikointi** – 2FA, salasanan vaihto
- **Tietojen varmuuskopiointi** – automaattiset varmuuskopiot
- **Lokitietojen hallinta** – kuka teki mitä ja milloin

---

### 📱 Mobiiliparannukset

#### Touch-optimointi
- **Suuremmat napit** – helpompi käyttö puhelimella
- **Swipe-temput** – viikkojen vaihto, tapahtumien selaus
- **Pohjateema** – mobiilinäkymä

#### PWA-parannukset
- **Täysin offline** – kaikki toiminnallisuus ilman verkkoyhteyttä
- **Kotinäytön widget** – pikakatsaus tapahtumiin
- **Jakotoiminnot** – jaa tapahtumia muihin sovelluksiin

---

### 🎨 Visuaaliset parannukset

#### Väriteema
- **Moderni paletti** – parempi kontrasti, esteettömyys
- **Personoitavat teemat** – jokaisen perheenjäsenen oma teema
- **Parempi kontrasti** – esteettömyysstandardien mukainen

#### Layout
- **Korttipohjainen UI** – modernimpi ulkoasu
- **Parempi tilankäyttö** – enemmän tietoa näytöllä
- **Animaatiot** – siirtymät ja palaute

---

### ⏰ Aikataulun selitys

**"1-2 viikkoa"** tarkoittaa:
- **Oikeaa kehitysaikaa** – jos työskentelet aktiivisesti
- **Ei ole sitova** – arvio riippuu kokemuksesta ja käytettävästä ajasta
- **Voi tehdä osissa** – ei tarvitse tehdä kaikkea kerralla
- **Joustava** – voit tehdä yhden ominaisuuden viikossa tai useamman

**Käytännössä:**
- **Vaihe 1**: Aloita CSS-uudistuksella, tee se valmiiksi
- **Vaihe 2**: Kun Vaihe 1 on valmis, siirry seuraavaan
- **Voit tehdä vain osan** – esim. vain CSS-uudistuksen ja pysähtyä siihen

---

### 🎯 Suositus aloitukseen

**Aloita Vaiheella 1**, koska:
1. **Visuaalinen parannus** on heti näkyvissä
2. **Perustaa muutoksille** hyvän pohjan
3. **Antaa motivaatiota** jatkaa kehitystä
4. **Ei riko olemassa olevaa toiminnallisuutta**

**Ensimmäinen konkreettinen tehtävä:**
- Moderni CSS-väripaletti
- Korttipohjainen layout
- Parempi mobiilikokemus

---

<!-- Lisää uudet säännöt tähän -->
