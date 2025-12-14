// ohjeet.js
// Tämä tiedosto sisältää Lääkemuistion ohjetekstit.
// Voit muokata tekstejä vapaasti tässä tiedostossa.

export const ohjeData = [
  {
    id: 'intro',
    title: 'Tervetuloa Lääkemuistioon!',
    icon: 'Info',
    content: `
      <p class="mb-2">Tämä sovellus on henkilökohtainen apurisi lääkkeiden hallintaan. Se on suunniteltu erityisesti käyttäjille, joilla on:</p>
      <ul class="list-disc list-inside ml-2 mb-2 space-y-1">
        <li>Säännöllinen lääkitys</li>
        <li>Dosetti käytössä</li>
        <li>Tarve seurata lääkkeiden riittävyyttä (varastosaldo)</li>
      </ul>
      <div class="bg-blue-50 p-2 rounded border border-blue-100 text-xs mt-2">
        <strong>Vinkki:</strong> Saat sovelluksen toimimaan parhaiten puhelimessa, kun lisäät sen kotivalikkoon (katso kohta 1).
      </div>
    `
  },
  {
    id: 'install',
    title: '1. Asennus (Tärkeä!)',
    icon: 'PlusSquare',
    content: `
      <p class="mb-3">Tämä on selainpohjainen sovellus. Jotta se toimii koko näytöllä ilman häiritseviä osoiterivejä ja jotta ilmoitukset toimivat luotettavasti, lisää se puhelimesi kotivalikkoon:</p>
      
      <div class="space-y-3">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <h4 class="font-bold text-slate-800 text-sm mb-1"> iPhone / iPad (Safari)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1 ml-1">
            <li>Paina selaimen alareunan <strong>Jaa</strong>-painiketta (neliö, josta lähtee nuoli ylös).</li>
            <li>Rullaa valikkoa alaspäin.</li>
            <li>Valitse <strong>"Lisää Koti-valikkoon"</strong>.</li>
            <li>Paina yläkulmasta "Lisää".</li>
          </ol>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <h4 class="font-bold text-slate-800 text-sm mb-1">🤖 Android (Chrome)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1 ml-1">
            <li>Paina selaimen yläkulman kolmea pistettä.</li>
            <li>Valitse valikosta <strong>"Asenna sovellus"</strong> tai <strong>"Lisää aloitusnäyttöön"</strong>.</li>
            <li>Seuraa ruudun ohjeita.</li>
          </ol>
        </div>
      </div>
    `
  },
  {
    id: 'add',
    title: '2. Lääkkeen lisääminen',
    icon: 'Plus',
    content: `
      <p class="mb-2">Paina oikean alakulman sinistä <strong>+</strong> painiketta. Uudessa versiossa voit valita kahdesta tavasta lisätä lääke:</p>
      
      <div class="space-y-4 mt-3">
        <div class="border-l-4 border-blue-500 pl-3">
          <strong class="block text-sm text-blue-700">A) Yksittäinen lääke</strong>
          <p class="text-xs text-slate-600 mt-1">Käytä tätä, kun lisäät fyysisen lääkepakkauksen (esim. Burana-paketti tai Kalkkipurkki).</p>
          <ul class="list-disc list-inside text-xs text-slate-600 mt-1">
            <li>Voit asettaa <strong>Varastosaldon</strong> (esim. 100 kpl). Sovellus vähentää tätä aina kun kirjaat lääkkeen otetuksi.</li>
            <li>Jos lääke on osa dosettia, ota pois valinta "Näytä etusivulla". Näin se ei ruuhkauta päänäkymää, mutta pysyy tallessa "Lääkeluettelossa".</li>
          </ul>
        </div>

        <div class="border-l-4 border-purple-500 pl-3">
          <strong class="block text-sm text-purple-700">B) Dosetti / Setti</strong>
          <p class="text-xs text-slate-600 mt-1">Käytä tätä, kun haluat luoda valmiin setin (esim. "Aamulääkkeet"), joka sisältää useita lääkkeitä.</p>
          <ul class="list-disc list-inside text-xs text-slate-600 mt-1">
            <li>Anna nimi (esim. Iltasetti).</li>
            <li>Valitse <strong>Koostumus</strong>-kohdasta, mitä lääkkeitä tähän settiin kuuluu.</li>
            <li><strong>Huom:</strong> Lääkkeet pitää olla ensin lisättynä (kohdan A mukaisesti), jotta voit valita ne dosettiin.</li>
            <li>Kun kuittaat dosetin otetuksi, sovellus vähentää automaattisesti saldoa kaikista siihen kuuluvista purkeista!</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'take',
    title: '3. Lääkkeen ottaminen',
    icon: 'CheckCircle',
    content: `
      <ul class="list-disc list-inside text-sm text-slate-600 space-y-3">
        <li>
          <strong>Säännölliset lääkkeet:</strong> Etusivulla näkyy aikataulu (esim. Aurinko). Paina kuvaketta, kun olet ottanut lääkkeen. Se muuttuu vihreäksi.
        </li>
        <li>
          <strong>Tarvittaessa otettavat:</strong> Avaa lääkkeen kortti (nuolesta tai nimeä klikkaamalla) ja paina isoa <strong>OTA NYT</strong> -painiketta.
        </li>
        <li>
          <strong>Pikalisäys (Salama):</strong> Oikeassa alakulmassa on oranssi salama-nappi. Sitä painamalla aukeaa pikavalikko, josta voit:
          <ul class="list-disc list-inside ml-4 mt-1 text-xs">
            <li>Valita listalta minkä tahansa lääkkeen (myös piilotetut).</li>
            <li>Kirjoittaa satunnaisen lääkkeen nimen (esim. "Päänsärkylääke").</li>
            <li><strong>Tärkeää:</strong> Voit muuttaa päivämäärää ja aikaa menneisyyteen, jos unohdit kirjata lääkkeen heti ottohetkellä!</li>
          </ul>
        </li>
      </ul>
    `
  },
  {
    id: 'missing',
    title: '4. Missä lääkkeeni on?',
    icon: 'List',
    content: `
      <p class="mb-2">Jos olet lisännyt lääkkeen, mutta et näe sitä etusivulla, syy on luultavasti jompikumpi näistä:</p>
      <ol class="list-decimal list-inside text-sm text-slate-600 space-y-2">
        <li>
          Olet ottanut pois valinnan <strong>"Näytä etusivulla"</strong>. (Tämä on yleistä varastolääkkeille, jotka ovat osa dosettia).
        </li>
        <li>
          Lääkkeelle on asetettu <strong>viikonpäivät</strong>, eikä tänään ole kyseinen päivä (esim. lääke otetaan vain perjantaisin).
        </li>
      </ol>
      <div class="mt-3 bg-slate-100 p-3 rounded-lg">
        <p class="text-sm font-bold text-slate-800">Mistä löydän ne?</p>
        <p class="text-xs text-slate-600 mt-1">
          Paina yläkulman valikkoa (kolme viivaa) ja valitse <strong>Lääkeluettelo (Kaikki)</strong>. Tämä lista näyttää aina kaiken, riippumatta asetuksista.
        </p>
      </div>
    `
  },
  {
    id: 'history',
    title: '5. Historia & Raportit',
    icon: 'BarChart2',
    content: `
      <p class="text-sm text-slate-600 mb-2"><strong>Historia-välilehti:</strong> Näet aikajanan kaikista otetuista lääkkeistä.</p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li><strong>Haku:</strong> Yläreunan hakukentällä voit etsiä lääkkeen nimellä. Haku on älykäs: jos etsit "Kalkki", se löytää myös "Iltalääkkeet"-merkinnät, jos iltalääkkeisiin on kuulunut kalkkia.</li>
        <li><strong>Muokkaus:</strong> Klikkaamalla merkintää historiassa voit muuttaa sen aikaa, kirjata syyn tai poistaa virheellisen merkinnän.</li>
      </ul>
      
      <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 mt-3">
        <h4 class="font-bold text-purple-800 text-sm mb-1">Raportti lääkärille</h4>
        <p class="text-xs text-slate-600">
          Paina "Raportti" -nappia historiassa. Voit valita aikavälin ja kopioida tarkan listan leikepöydälle. Raportti erittelee selkeästi, mitä lääkkeitä dosetti sisälsi ottohetkellä.
        </p>
      </div>
    `
  },
  {
    id: 'notifications',
    title: '6. Ilmoitukset',
    icon: 'Bell',
    content: `
      <p class="text-sm text-slate-600 mb-2">
        Sovellus muistuttaa aikataulutetuista lääkkeistä, jos et ole vielä kuitannut niitä.
      </p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li><strong>Kello-ikoni ylhäällä:</strong> Kertoo ilmoitusten tilan. Sininen kello = Päällä. Harmaa kello = Pois päältä / Mykistetty.</li>
        <li><strong>Mykistys:</strong> Painamalla kello-ikonia voit mykistää sovelluksen ilmoitukset väliaikaisesti ilman, että sinun tarvitsee mennä puhelimen asetuksiin.</li>
        <li><strong>Ongelmia?</strong> Jos et saa ilmoituksia, varmista puhelimen asetuksista (selainsovellus -> Ilmoitukset), että ne on sallittu. iPhone vaatii yleensä sovelluksen lisäämisen Koti-valikkoon.</li>
      </ul>
    `
  }
];
