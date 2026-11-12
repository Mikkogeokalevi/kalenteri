# AI Rules - Kauppisen perhekalenteri (v2.0 "Premium")

## Sovelluksen yleiskuvaus

**Kauppisen perhekalenteri** on suomenkielinen, tuotantokäytössä oleva web-pohjainen kalenteri- ja tehtävienhallintasovellus perheen yhteiskäyttöön. iOS-tyylinen premium-ulkoasu (v2.0, marraskuu 2026).

## Perheenjäsenet ja värit

| Henkilö | CSS-muuttuja | Vaalea | Tumma |
|---------|--------------|--------|-------|
| Toni | `--c-toni` | `#16a34a` | `#4ade80` |
| Kaisa | `--c-kaisa` | `#9333ea` | `#c084fc` |
| Oona | `--c-oona` | `#2563eb` | `#60a5fa` |
| Perhe | `--c-perhe` | `#e11d48` | `#fb7185` |

Käyttäjän oma aksenttiteema: `body.theme-toni/kaisa/oona` muuttaa `--accent`-värin.
Vaalea/tumma teema: `document.documentElement[data-teema]` (`vaalea`/`tumma`), valinta localStorage `kalenteri-teema` (auto/vaalea/tumma).

## Tekninen stack

- **Frontend**: Vanilla JavaScript (ES6), HTML5, CSS3 — ei build-työkaluja
- **Backend**: Firebase Realtime Database + Authentication (email/salasana), CDN-importit
- **PWA**: manifest.json + sw.js (cache `kalenteri-v11`)

## Tiedostorakenne

| Tiedosto | Kuvaus |
|----------|--------|
| `index.html` | Koko UI: login, appbar, näkymät, sivuraita, tab bar, FAB, 6 sheetiä |
| `script.js` | Koko sovelluslogiikka (~1650 r.) — pidä yhtenä tiedostona! |
| `style.css` | Design system, molemmat teemat, responsiivisuus |
| `sw.js` | Service Worker (v11): fontit cache-first, app-tiedostot network-first, Firebase ohitetaan |
| `manifest.json` | PWA + shortcut "Uusi tapahtuma" (`?uusi=1`) |
| `backup.bat` / `update_github.bat` | Varmuuskopio / Git-push |
| `logo.png` | Logo/ikoni |

## Keskeiset ominaisuudet

1. **Näkymät**: Agenda (oletus mobiilissa), Päivä, Viikko, Kuukausi — segmented control + pyyhkäisy. Viikko/päivä = aikahila (6–24), kaistalaskenta päällekkäisille.
2. **Kategoriat**: tyo/harrastus/juhlat/terveys/koulu/ostokset/matka/muu — ikonit `KATEGORIAT`-mapissa, kenttä `tapahtuma.kategoria`.
3. **Toistuvat tapahtumat**: max 100 instanssia `sarjaId`+`sarjaIndeksi`-tunnisteilla. Muokkaus JA poisto kysyvät laajuuden (yksittäinen/tulevat/koko sarja) yhteisestä `sheet-laajuus`-dialogista. Sarjamuokkauksessa metakentät (`SARJA_META_KENTAT`) levitetään, ajat vain valittuun instanssiin.
4. **Muistutukset**: sovelluksen-sisäiset, `localStorage['kalenteri-muistutukset']`, 30s tarkistus, Notification API jos sallittu, toast fallback. Dedupe sessionStorage.
5. **Tehtävät**: `/tehtavalista`, kohdistus, määräpäivä, tilavärit, arkisto, **swipe-to-complete**.
6. **Mobiili**: tab bar (kalenteri/tehtävät/asetukset), FAB, bottom sheetit + alasveto, pull-to-refresh, safe-areat, 16px inputit (iOS zoom-esto), haptiikka.

## Firebase-polut

- Tapahtumat: `/tapahtumat` — kentät: otsikko, kuvaus, alku, loppu, kokoPaiva, linkki, kategoria, luoja, ketakoskee[], nakyvyys{}, toistuminen{tyyppi,paattyy} (vain lisäysdata), sarjaId, sarjaIndeksi, onToistuva
- Tehtävät: `/tehtavalista`

## Kehityssäännöt

- Suomenkieliset muuttuja-/funktionimet, noudata tyyliä
- **ÄLÄ refaktoroi script.js:ää moduuleihin** — yritettiin, meni rikki
- **NOSTA VERSIONUMEROA jokaisessa päivityksessä**: `VERSIO` script.js:n alussa (näkyy yläbannerissa + asetuksissa) JA `CACHE_NAME` sw.js:ssä — pidä ne samoina (nyt `2.1.0`)
- Testaa kirjautuminen ennen pushia; sovellus on tuotannossa
- `esc()` kaikkiin innerHTML-injektioihin käyttäjädatan kanssa
- Käyttäjävärin luetaan aina `cssVari()`/`henkiloVari()`-funktiolla (teemat vaihtuvat)

## Tulevat ideat

- Push-ilmoitukset: FCM + Cloud Functions (vaatii Blaze; rakenne valmis muistutusmoduulissa)
- Raporttinäkymä / viikkoyhteenveto
- Liitteet tapahtumiin (Firebase Storage)
