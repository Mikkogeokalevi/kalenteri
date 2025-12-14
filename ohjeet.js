// ohjeet.js
// Lääkemuistion laajat käyttöohjeet (Päivitetty versiolle 1.6)
// Tämä tiedosto on kirjoitettu "aloittelijaystävällisesti" ja kattaa kaiken.

export const ohjeData = [
  {
    id: 'intro',
    title: 'Aloitus: Mikä tämä on?',
    icon: 'Info',
    content: `
      <p class="mb-3 text-slate-700">Tervetuloa! Tämä sovellus on sinun henkilökohtainen lääkeapurisi. Se ei ole tavallinen "kaupasta ladattava" sovellus, vaan se toimii suoraan puhelimesi selaimessa, mutta käyttäytyy kuin oikea sovellus.</p>
      
      <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
        <h4 class="font-bold text-blue-800 mb-2">Tämä sovellus hoitaa 4 asiaa puolestasi:</h4>
        <ol class="list-decimal list-inside space-y-2 text-slate-700">
          <li><strong>Muistaa ajat:</strong> Kertoo, milloin lääke pitää ottaa.</li>
          <li><strong>Vahtii varastoa:</strong> Laskee pillerit puolestasi ja kertoo, kun ne ovat loppumassa.</li>
          <li><strong>Tekee ostoslistan:</strong> Kirjoittaa automaattisesti kauppalistan, kun lääkkeet vähenevät.</li>
          <li><strong>Pitää kirjaa:</strong> Tallentaa historian lääkäriä varten.</li>
        </ol>
      </div>
    `
  },
  {
    id: 'install',
    title: '1. Asennus (Tee tämä ensin!)',
    icon: 'PlusSquare',
    content: `
      <p class="mb-3 text-sm text-slate-600">Jotta sovellus toimii koko näytöllä ja ilmoitukset tulevat varmemmin perille, sinun kannattaa lisätä se puhelimesi kotivalikkoon.</p>
      
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-2">🍎 iPhone / iPad (Safari-selain)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
            <li>Katso ruudun alareunaan ja paina <strong>Jaa-nappia</strong> (pieni neliö, josta lähtee nuoli ylöspäin).</li>
            <li>Rullaa valikkoa alaspäin, kunnes löydät tekstin: <strong>"Lisää Koti-valikkoon"</strong>. Paina sitä.</li>
            <li>Paina oikeasta yläkulmasta <strong>"Lisää"</strong>.</li>
            <li>Nyt sovellus on puhelimesi näytöllä omana ikoninaan!</li>
          </ol>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 class="font-bold text-slate-800 text-sm mb-2">🤖 Android (Chrome-selain)</h4>
          <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
            <li>Paina selaimen oikeasta yläkulmasta <strong>kolmea pistettä</strong>.</li>
            <li>Etsi valikosta teksti <strong>"Asenna sovellus"</strong> tai "Lisää aloitusnäyttöön".</li>
            <li>Vahvista painamalla "Asenna" tai "Lisää".</li>
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
      <p class="mb-3 text-sm text-slate-600">Aloitetaan lisäämällä ensimmäinen lääke. Paina alareunan isoa sinistä <strong>Plus (+)</strong> -nappia.</p>
      
      <div class="space-y-4">
        <div class="border-l-4 border-blue-500 pl-3 bg-slate-50 p-3 rounded-r-lg">
          <strong class="block text-sm text-blue-800 mb-1">A) Yksittäinen lääke (Suositus)</strong>
          <p class="text-xs text-slate-600 mb-2">Täytä tiedot näin:</p>
          <ul class="list-disc list-inside text-xs text-slate-700 space-y-2">
            <li><strong>Nimi:</strong> Esim. "Burana" tai "D-vitamiini".</li>
            <li><strong>Väri:</strong> Valitse lääkkeelle oma tunnusväri palloista.</li>
            <li><strong>Seuraa lääkevarastoa:</strong> Laita rasti tähän, jos haluat että sovellus laskee pillerit.
                <ul class="list-disc list-inside ml-4 mt-1 text-slate-500">
                    <li><em>Varastossa:</em> Laske tai arvioi nykyinen määrä (esim. 50 kpl).</li>
                    <li><em>Hälytysraja:</em> Kun määrä alittaa tämän (esim. 10 kpl), sovellus käskee ostamaan lisää.</li>
                </ul>
            </li>
            <li><strong>Hälytys:</strong> "Hälytä äänimerkillä" on oletuksena päällä.
                <br><em>Vinkki: Ota rasti pois, jos lääke on esim. vitamiini, jonka otat "joskus aamulla" etkä halua puhelimen piippaavan siitä.</em>
            </li>
            <li><strong>Aikataulu:</strong> Valitse viikonpäivät (yleensä kaikki) ja kellonajat (esim. Aamu ja Ilta).</li>
          </ul>
        </div>

        <div class="border-l-4 border-purple-500 pl-3 bg-purple-50 p-3 rounded-r-lg">
          <strong class="block text-sm text-purple-800 mb-1">B) Dosetti / Setti</strong>
          <p class="text-xs text-slate-600">Käytä tätä vain, jos haluat kuitata monta lääkettä yhdellä painalluksella. Luo ensin lääkkeet yksitellen (kohta A) ja yhdistä ne sitten tässä setiksi.</p>
        </div>
      </div>
    `
  },
  {
    id: 'colors',
    title: '3. Mitä värit tarkoittavat?',
    icon: 'Layers',
    content: `
      <p class="mb-3 text-slate-600 text-sm">Sovellus on "älykäs" ja kertoo väreillä heti, onko jokin hoidettava. Etusivun kortit muuttuvat näin:</p>
      
      <div class="space-y-3">
        <div class="flex gap-3 items-center bg-red-50 p-3 rounded-xl border-2 border-red-500 shadow-sm">
           <div class="shrink-0 text-red-600 font-bold text-xl">!</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Punainen + Vilkkuva kello</span>
             <span class="text-xs text-slate-700"><strong>Lääke on myöhässä!</strong> Kello on enemmän kuin lääkkeenottoaika. Ota lääke heti ja merkitse otetuksi.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-red-50 p-3 rounded-xl border-2 border-red-300 shadow-sm">
           <div class="shrink-0 text-red-600 font-bold text-xl">0</div>
           <div>
             <span class="font-bold text-red-700 text-xs block uppercase tracking-wider">Punainen reunus</span>
             <span class="text-xs text-slate-700"><strong>Varasto kriittinen.</strong> Lääkettä on alle hälytysrajan. Tämä lääke on nyt punaisella myös ostoslistalla.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-orange-50 p-3 rounded-xl border-2 border-orange-300 shadow-sm">
           <div class="shrink-0 text-orange-500 font-bold text-xl">⚠</div>
           <div>
             <span class="font-bold text-orange-700 text-xs block uppercase tracking-wider">Oranssi reunus</span>
             <span class="text-xs text-slate-700"><strong>Vähissä.</strong> Lääkettä on vielä hetkeksi (raja + 5 kpl), mutta sovellus lisäsi sen jo ennakkoon ostoslistalle.</span>
           </div>
        </div>

        <div class="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
           <div class="shrink-0 text-blue-500 font-bold text-xl">OK</div>
           <div>
             <span class="font-bold text-slate-700 text-xs block uppercase tracking-wider">Normaali väri</span>
             <span class="text-xs text-slate-500">Kaikki hyvin. Joko lääke on otettu tältä päivältä, tai sitä ei tarvitse vielä ottaa.</span>
           </div>
        </div>
      </div>
    `
  },
  {
    id: 'usage',
    title: '4. Päivittäinen käyttö',
    icon: 'CheckCircle',
    content: `
      <h4 class="font-bold text-slate-800 text-sm mb-2">Kun otat lääkkeen:</h4>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2 mb-4">
        <li>Avaa sovellus.</li>
        <li>Etsi oikea lääke listalta.</li>
        <li>Paina kyseistä aika-nappia (esim. <span class="bg-slate-200 px-1 rounded font-bold text-slate-700">AAMU</span>).</li>
        <li>Nappi muuttuu vihreäksi ja pillerimäärä vähenee varastosta automaattisesti.</li>
      </ol>

      <h4 class="font-bold text-slate-800 text-sm mb-2">Jos unohdit merkitä:</h4>
      <p class="text-xs text-slate-600 mb-2">Kun avaat sovelluksen myöhemmin ja jokin lääke on "virallisesti" myöhässä, sovellus avaa heti <strong>"Tervetuloa takaisin"</strong> -ikkunan, joka listaa kaikki rästissä olevat lääkkeet.</p>
    `
  },
  {
    id: 'stock',
    title: '5. Kauppareissu & Täydennys',
    icon: 'ShoppingCart',
    content: `
      <h4 class="font-bold text-slate-800 text-sm mb-2">Ostoslista</h4>
      <p class="text-xs text-slate-600 mb-2">Sinun ei tarvitse kirjoittaa ostoslistaa. Paina yläreunan <strong class="text-red-500">Ostoskärry</strong>-ikonia.</p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-1 mb-4">
        <li>Listalla näkyvät automaattisesti lääkkeet, jotka ovat punaisella tai oranssilla.</li>
      </ul>

      <h4 class="font-bold text-slate-800 text-sm mb-2">Kun tulet apteekista (Varaston päivitys)</h4>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
        <li>Avaa lääkkeen tiedot painamalla lääkkeen nimeä etusivulla (nuoli aukeaa).</li>
        <li>Etsi rivi, jossa lukee varastosaldo ja paina pientä <strong class="text-green-600">Kierrätys/Päivitys</strong> -ikonia.</li>
        <li>Kirjoita ruutuun, paljonko ostit (esim. 100).</li>
        <li>Sovellus lisää määrän vanhaan saldoon.</li>
      </ol>
    `
  },
  {
    id: 'history',
    title: '6. Lääkärikäynti & Historia',
    icon: 'BarChart2',
    content: `
      <p class="text-sm text-slate-600 mb-2">
        Lääkäri kysyy usein: "Oletteko muistanut ottaa lääkkeet?" Tällä sovelluksella voit näyttää faktat.
      </p>
      
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li>Paina alhaalta <strong>Historia</strong>-nappia.</li>
        <li><strong>Raportti:</strong> Paina ylhäältä "Raportti"-nappia. Valitse aikaväli (esim. 1 kuukausi).</li>
        <li>Saat siistin tekstilistan, jonka voit kopioida ja vaikka lähettää sähköpostilla tai näyttää puhelimen ruudulta lääkärille.</li>
      </ul>
    `
  },
  {
    id: 'extra',
    title: '7. Satunnainen lääke',
    icon: 'Zap',
    content: `
      <p class="text-xs text-slate-600 mb-2">
        Otitko särkylääkkeen päänsärkyyn tai allergialääkkeen, jota ei ole aikataulutettu?
      </p>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1">
        <li>Paina alareunan oranssia <strong class="text-orange-500">Salama</strong>-nappia.</li>
        <li>Valitse lääke listalta TAI kirjoita nimi.</li>
        <li>Kirjoita syy (esim. "Migreeni").</li>
        <li>Paina "Kirjaa". Tämä tallentuu historiaan, mutta ei sekoita aikatauluja.</li>
      </ol>
    `
  }
];
