// ohjeet.js
// Lääkemuistion laajat käyttöohjeet (Päivitetty versiolle 2.0)
// Sisältää ohjeet dosetin hälytysvalinnalle ja parannetulle historialle.

export const ohjeData = [
  {
    id: 'intro',
    title: 'Aloitus: Mikä tämä on?',
    icon: 'Info',
    content: `
      <p class="mb-3 text-slate-700">Tervetuloa! Tämä sovellus on sinun henkilökohtainen lääkeapurisi. Se toimii suoraan puhelimesi selaimessa, mutta käyttäytyy kuin oikea sovellus.</p>
      
      <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
        <h4 class="font-bold text-blue-800 mb-2">Sovellus hoitaa 4 asiaa puolestasi:</h4>
        <ol class="list-decimal list-inside space-y-2 text-slate-700">
          <li><strong>Muistaa ajat:</strong> Kertoo ja hälyttää, milloin lääke pitää ottaa.</li>
          <li><strong>Vahtii varastoa:</strong> Laskee pillerit puolestasi ja varoittaa, kun ne vähenevät.</li>
          <li><strong>Tekee ostoslistan:</strong> Kirjoittaa automaattisesti kauppalistan puuttuvista lääkkeistä.</li>
          <li><strong>Pitää kirjaa:</strong> Tallentaa tarkan historian lääkäriä varten.</li>
        </ol>
      </div>
    `
  },
  {
    id: 'install',
    title: '1. Asennus (Tee tämä ensin!)',
    icon: 'PlusSquare',
    content: `
      <p class="mb-3 text-sm text-slate-600">Jotta sovellus toimii koko näytöllä ja ilmoitukset tulevat varmemmin perille, lisää se kotivalikkoon.</p>
      
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-2">🍎 iPhone / iPad (Safari)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
            <li>Paina alareunan <strong>Jaa-nappia</strong> (neliö, josta lähtee nuoli ylöspäin).</li>
            <li>Valitse listasta: <strong>"Lisää Koti-valikkoon"</strong>.</li>
            <li>Paina ylhäältä <strong>"Lisää"</strong>.</li>
          </ol>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-2">🤖 Android (Chrome)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
            <li>Paina yläkulman <strong>kolmea pistettä</strong>.</li>
            <li>Valitse <strong>"Asenna sovellus"</strong> tai "Lisää aloitusnäyttöön".</li>
            <li>Vahvista painamalla "Asenna".</li>
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
      <p class="mb-3 text-sm text-slate-600">Paina alareunan isoa sinistä <strong>Plus (+)</strong> -nappia.</p>
      
      <div class="space-y-4">
        <div class="border-l-4 border-blue-500 pl-3 bg-slate-50 p-3 rounded-r-lg">
          <strong class="block text-sm text-blue-800 mb-1">A) Yksittäinen lääke</strong>
          <ul class="list-disc list-inside text-xs text-slate-700 space-y-2">
            <li><strong>Nimi:</strong> Esim. "Burana".</li>
            <li><strong>Seuraa varastoa:</strong> Laita rasti, jos haluat laskurin.
                <ul class="list-disc list-inside ml-4 mt-1 text-slate-500">
                    <li><em>Varastossa:</em> Nykyinen määrä (esim. 50).</li>
                    <li><em>Hälytysraja:</em> Milloin ostetaan lisää (esim. 10).</li>
                </ul>
            </li>
            <li><strong>Hälytys:</strong> Voit valita, piippaako puhelin vai onko lääke vain hiljaa listalla.</li>
            <li><strong>Aikataulu:</strong> Valitse viikonpäivät ja kellonajat (esim. Aamu).</li>
          </ul>
        </div>

        <div class="border-l-4 border-purple-500 pl-3 bg-purple-50 p-3 rounded-r-lg">
          <strong class="block text-sm text-purple-800 mb-1">B) Dosetti / Setti</strong>
          <p class="text-xs text-slate-600 mb-2">Tällä voit kuitata monta lääkettä kerralla (esim. "Aamulääkkeet").</p>
          <ul class="list-disc list-inside text-xs text-slate-700 space-y-2">
             <li>Valitse lääkkeet ja niiden määrät listalta.</li>
             <li><strong>Uutta:</strong> Voit nyt valita myös dosetille, haluatko siitä äänimerkin vai et.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'colors',
    title: '3. Värit ja tilanteet',
    icon: 'Layers',
    content: `
      <p class="mb-3 text-slate-600 text-sm">Etusivun kortit kertovat tilanteen väreillä:</p>
      
      <div class="space-y-3">
        <div class="flex gap-3 items-center bg-red-50 p-3 rounded-xl border-2 border-red-500 shadow-sm">
           <div class="shrink-0 text-red-600 font-bold text-xl">!</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Punainen + Vilkkuva</span>
             <span class="text-xs text-slate-700"><strong>MYÖHÄSSÄ!</strong> Lääkkeen aika on mennyt ohi. Ota se heti.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-red-50 p-3 rounded-xl border-2 border-red-300 shadow-sm">
           <div class="shrink-0 text-red-600 font-bold text-xl">0</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Punainen reunus</span>
             <span class="text-xs text-slate-700"><strong>VARASTO LOPPU.</strong> Lääkettä on alle hälytysrajan. Se on lisätty ostoslistalle.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-orange-50 p-3 rounded-xl border-2 border-orange-300 shadow-sm">
           <div class="shrink-0 text-orange-500 font-bold text-xl">⚠</div>
           <div>
             <span class="font-bold text-orange-700 text-xs block uppercase tracking-wider">Oranssi reunus</span>
             <span class="text-xs text-slate-700"><strong>Vähissä.</strong> Lääkettä on vielä hetkeksi, mutta kannattaa ostaa pian.</span>
           </div>
        </div>
      </div>
    `
  },
  {
    id: 'usage',
    title: '4. Käyttö & Unohtaminen',
    icon: 'CheckCircle',
    content: `
      <h4 class="font-bold text-slate-800 text-sm mb-2">Lääkkeen ottaminen:</h4>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2 mb-4">
        <li>Paina lääkkeen kohdalla olevaa aika-nappia (esim. <span class="bg-slate-200 px-1 rounded font-bold text-slate-700">AAMU</span>).</li>
        <li>Nappi muuttuu vihreäksi <span class="text-green-600">✔</span> ja varasto vähenee.</li>
      </ol>

      <h4 class="font-bold text-slate-800 text-sm mb-2">Jos unohdit merkitä:</h4>
      <p class="text-xs text-slate-600 mb-2">Jos lääke on "virallisesti" myöhässä (yli 15 min), sovellus avaa seuraavalla kerralla automaattisesti ikkunan, joka muistuttaa rästissä olevista lääkkeistä.</p>
    `
  },
  {
    id: 'stock',
    title: '5. Ostoslista & Varasto',
    icon: 'ShoppingCart',
    content: `
      <h4 class="font-bold text-slate-800 text-sm mb-2">Ostoslista</h4>
      <p class="text-xs text-slate-600 mb-2">Paina yläreunan <strong class="text-red-500">Ostoskärry</strong>-ikonia. Siellä näkyvät kaikki lääkkeet, jotka ovat punaisella tai oranssilla.</p>

      <h4 class="font-bold text-slate-800 text-sm mb-2">Apteekkireissun jälkeen</h4>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
        <li>Avaa lääkkeen tiedot etusivulta (nuoli aukeaa).</li>
        <li>Paina <strong class="text-green-600">Kierrätys/Päivitys</strong> -ikonia.</li>
        <li>Syötä ostettu määrä (esim. 100). Sovellus lisää sen nykyiseen saldoon.</li>
      </ol>
    `
  },
  {
    id: 'history',
    title: '6. Historia & Raportit',
    icon: 'BarChart2',
    content: `
      <p class="text-sm text-slate-600 mb-2">
        Täältä näet faktat lääkäriä varten.
      </p>
      
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li><strong>Haku:</strong> Voit etsiä historiasta lääkkeen nimellä (esim. "Burana") tai syyllä (esim. "Päänsärky").</li>
        <li><strong>Raportti:</strong> Paina "Luo raportti", valitse aikaväli ja kopioi teksti lääkärille.</li>
        <li><strong>Navigointi:</strong> Jos katsot yksittäisen lääkkeen historiaa listan kautta, sulkeminen palauttaa sinut kätevästi takaisin listalle.</li>
      </ul>
    `
  },
  {
    id: 'extra',
    title: '7. Satunnainen lääke',
    icon: 'Zap',
    content: `
      <p class="text-xs text-slate-600 mb-2">
        Särkylääke tai allergialääke tarvittaessa?
      </p>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1">
        <li>Paina alareunan oranssia <strong class="text-orange-500">Salama</strong>-nappia.</li>
        <li>Valitse lääke tai kirjoita nimi.</li>
        <li>Kirjoita syy ja paina "Kirjaa".</li>
      </ol>
    `
  }
];
