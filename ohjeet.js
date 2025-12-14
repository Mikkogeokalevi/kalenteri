// ohjeet.js
// Lääkemuistion laajat käyttöohjeet (Versio 1.2)
// Tämä tiedosto sisältää kaiken ohjeistuksen sovelluksen käyttöön.

export const ohjeData = [
  {
    id: 'intro',
    title: 'Tervetuloa Mikkokalevin Lääkemuistioon',
    icon: 'Info',
    content: `
      <p class="mb-3 text-slate-700">Tämä sovellus on suunniteltu auttamaan lääkityksen hallinnassa, varastosaldojen seurannassa ja ottoaikojen muistamisessa.</p>
      
      <div class="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm">
        <h4 class="font-bold text-blue-800 mb-1">Pääominaisuudet:</h4>
        <ul class="list-disc list-inside space-y-1 text-slate-600">
          <li><strong>Aikataulut:</strong> Muistuttaa milloin lääke pitää ottaa.</li>
          <li><strong>Varastoseuranta:</strong> Vähentää saldoa automaattisesti ja varoittaa loppumisesta.</li>
          <li><strong>Dosetit:</strong> Voit yhdistää useita lääkkeitä yhden napin taakse.</li>
          <li><strong>Historia:</strong> Tarkka kirjanpito otetuista lääkkeistä.</li>
        </ul>
      </div>
    `
  },
  {
    id: 'install',
    title: '1. Asennus (Aloita tästä)',
    icon: 'PlusSquare',
    content: `
      <p class="mb-3 text-sm text-slate-600">Jotta sovellus toimii koko näytöllä ja ilmoitukset tulevat perille, lisää se puhelimesi kotivalikkoon:</p>
      
      <div class="space-y-3">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-1"> iPhone / iPad</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1 ml-1">
            <li>Paina selaimen alareunan <strong>Jaa</strong>-painiketta (neliö, josta nuoli ylös).</li>
            <li>Rullaa valikkoa ja valitse <strong>"Lisää Koti-valikkoon"</strong>.</li>
            <li>Paina yläkulmasta "Lisää".</li>
          </ol>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-1">🤖 Android</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1 ml-1">
            <li>Paina selaimen yläkulman kolmea pistettä.</li>
            <li>Valitse <strong>"Asenna sovellus"</strong> tai "Lisää aloitusnäyttöön".</li>
            <li>Vahvista asennus.</li>
          </ol>
        </div>
      </div>
    `
  },
  {
    id: 'colors',
    title: '2. Värikoodien merkitys',
    icon: 'Layers',
    content: `
      <p class="mb-3 text-slate-600 text-sm">Etusivun lääkekortit vaihtavat väriä automaattisesti tilanteen mukaan. Tässä selitykset:</p>
      
      <div class="space-y-3">
        <div class="flex gap-3 items-center bg-red-50 p-2.5 rounded-xl border-2 border-red-500 shadow-sm">
           <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold border border-red-200 shrink-0">!</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Myöhässä</span>
             <span class="text-xs text-slate-700">Kellonaika on ohittanut lääkkeen aikataulun. Kortti on punainen ja kello-ikoni vilkkuu.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-red-50 p-2.5 rounded-xl border-2 border-red-300 shadow-sm">
           <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold border border-red-200 shrink-0">0</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Varasto loppumassa</span>
             <span class="text-xs text-slate-700">Lääkettä on alle asettamasi hälytysrajan (esim. alle 10 kpl). Näkyy myös ostoslistalla punaisena.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-orange-50 p-2.5 rounded-xl border-2 border-orange-300 shadow-sm">
           <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200 shrink-0">5</div>
           <div>
             <span class="font-bold text-orange-700 text-xs block uppercase tracking-wider">Vähissä</span>
             <span class="text-xs text-slate-700">Lääke lähestyy loppumista (raja + 5 kpl). Nousee ostoslistalle oranssina.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
           <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 shrink-0">OK</div>
           <div>
             <span class="font-bold text-slate-700 text-xs block uppercase tracking-wider">Normaali</span>
             <span class="text-xs text-slate-500">Kaikki hyvin. Lääke on otettu tai sitä on varastossa riittävästi.</span>
           </div>
        </div>
      </div>
    `
  },
  {
    id: 'add',
    title: '3. Lääkkeen lisääminen',
    icon: 'Plus',
    content: `
      <p class="mb-2 text-sm text-slate-600">Paina alhaalla olevaa isoa <strong class="text-blue-600">Plus (+)</strong> -nappia. Valitse joko:</p>
      
      <div class="space-y-4 mt-3">
        <div class="border-l-4 border-blue-500 pl-3 bg-slate-50 p-2 rounded-r-lg">
          <strong class="block text-sm text-blue-700 mb-1">A) Yksittäinen lääke (Suositus)</strong>
          <ul class="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li>Anna nimi ja annostus.</li>
            <li><strong>Varastoseuranta:</strong> Laita rasti ruutuun "Seuraa lääkevarastoa".</li>
            <li><strong>Varastossa:</strong> Kirjaa montako tablettia sinulla on nyt (esim. 100).</li>
            <li><strong>Hälytysraja:</strong> Määritä raja (esim. 10), jolloin sovellus alkaa varoittaa punaisella.</li>
            <li><strong>Aikataulu:</strong> Valitse kellonajat ja viikonpäivät.</li>
          </ul>
        </div>

        <div class="border-l-4 border-purple-500 pl-3 bg-slate-50 p-2 rounded-r-lg">
          <strong class="block text-sm text-purple-700 mb-1">B) Dosetti / Setti</strong>
          <p class="text-xs text-slate-600 mb-2">Luo ensin yksittäiset lääkkeet (kohta A), ja yhdistä ne sitten täällä.</p>
          <ul class="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li>Anna setille nimi (esim. "Aamudosetti").</li>
            <li>Valitse listalta lääkkeet ja niiden määrät.</li>
            <li>Kun kuittaat dosetin otetuksi, varasto vähenee automaattisesti kaikista siihen kuuluvista purkeista.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'usage',
    title: '4. Käyttö & Varaston täydennys',
    icon: 'Package',
    content: `
      <h4 class="font-bold text-slate-800 text-sm mb-2">Lääkkeen ottaminen</h4>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2 mb-4">
        <li>Etsi lääke etusivulta.</li>
        <li>Paina kyseistä aikalaatikkoa (esim. <span class="bg-slate-200 px-1 rounded text-[10px]">AAMU</span>).</li>
        <li>Laatikko muuttuu vihreäksi ja varastosaldo vähenee.</li>
        <li>Jos unohdit merkitä, voit tehdä sen myöhemminkin.</li>
      </ol>

      <h4 class="font-bold text-slate-800 text-sm mb-2">Varaston täydennys (Apteekkireissu)</h4>
      <p class="text-xs text-slate-600 mb-2">Kun ostat lisää lääkettä, toimi näin:</p>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
        <li>Avaa lääkkeen tiedot painamalla nuolta tai korttia etusivulla.</li>
        <li>Paina vihreää <strong class="text-green-600">Kierrätys-ikonia</strong> (Päivitä varasto).</li>
        <li>Kirjoita ostamasi määrä (esim. 100). Sovellus lisää sen nykyiseen saldoon.</li>
      </ol>
    `
  },
  {
    id: 'history',
    title: '5. Historia & Raportointi',
    icon: 'BarChart2',
    content: `
      <p class="text-sm text-slate-600 mb-2">Alapalkin <strong>Historia</strong>-nappi avaa lokitiedot.</p>
      
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li><strong>Tarkastelu:</strong> Näet päiväkohtaisesti mitä olet ottanut ja milloin.</li>
        <li><strong>Muokkaus:</strong> Klikkaa merkintää muuttaaksesi aikaa tai poistaaksesi virheellisen kirjauksen.</li>
        <li><strong>Lääkärinraportti:</strong> Paina ylhäältä "Raportti"-nappia.
          <ul class="list-disc list-inside ml-4 mt-1 opacity-80">
            <li>Valitse aikaväli (esim. 1 kk).</li>
            <li>Valitse mitkä lääkkeet sisällytetään.</li>
            <li>Paina "Kopioi leikepöydälle" ja liitä sähköpostiin tai tulosta.</li>
          </ul>
        </li>
      </ul>
    `
  },
  {
    id: 'features',
    title: '6. Muut toiminnot',
    icon: 'Zap',
    content: `
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-3">
        <li>
          <strong>Ostoslista (Automatiikka):</strong> 
          Paina yläreunan <span class="text-red-500">Ostoskärryä</span>. Listalle ilmestyvät itsestään ne lääkkeet, joiden varasto on "Vähissä" (oranssi) tai "Loppumassa" (punainen). Sinun ei tarvitse lisätä niitä käsin.
        </li>
        <li>
          <strong>Pikalisäys (Salama):</strong>
          Alareunan oranssi salama-nappi on tarkoitettu satunnaisiin lääkkeisiin (esim. särkylääke). Voit kirjata lääkkeen ja syyn (esim. "Päänsärky") ilman aikataulua.
        </li>
        <li>
          <strong>Arkistointi:</strong>
          Jos lääkitys loppuu, älä poista lääkettä (koska se poistaa historian). Paina sen sijaan <span class="text-orange-500">Arkistoi</span>-nappia lääkkeen tiedoista. Se piilottaa lääkkeen listalta, mutta säilyttää historian.
        </li>
      </ul>
    `
  }
];
