// ohjeet.js
// Lääkemuistion päivitetyt ohjee t (Versio 1.2 yhteensopiva)

import { Info, PlusSquare, Plus, CheckCircle, Zap, Package, BarChart2, Bell, List, Layers, AlertTriangle, ShoppingCart } from 'lucide-react';

export const ohjeData = [
  {
    id: 'intro',
    title: 'Tervetuloa Lääkemuistioon!',
    icon: 'Info',
    content: `
      <p class="mb-2 text-slate-700">Tämä sovellus auttaa sinua hallitsemaan lääkitystäsi, muistamaan ottoajat ja seuraamaan lääkevaraston kulumista.</p>
      
      <div class="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm mb-3">
        <h4 class="font-bold text-blue-800 mb-1">Mitä uutta?</h4>
        <ul class="list-disc list-inside space-y-1 text-slate-600">
          <li><strong>Älykkäät värit:</strong> Näet heti, jos lääke on myöhässä tai loppumassa.</li>
          <li><strong>Automaattinen ostoslista:</strong> Lääkkeet ilmestyvät listalle, kun ne ovat vähissä.</li>
        </ul>
      </div>
    `
  },
  {
    id: 'colors',
    title: '2. Värikoodit ja Tilat (Tärkeä!)',
    icon: 'AlertTriangle',
    content: `
      <p class="mb-3 text-slate-600 text-sm">Etusivun lääkekortit vaihtavat väriä tilanteen mukaan. Tässä merkkien selitykset:</p>
      
      <div class="space-y-3">
        <div class="flex gap-3 items-start bg-white p-2 rounded-lg border-2 border-red-500 shadow-sm">
           <div class="w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
           <div>
             <span class="font-bold text-slate-800 text-xs block uppercase">Punainen reunus + Vilkkuva kello</span>
             <span class="text-xs text-slate-600"><strong>Lääke on myöhässä!</strong> Ottoaika on mennyt ohi. Ota lääke ja kuittaa se heti.</span>
           </div>
        </div>

        <div class="flex gap-3 items-start bg-white p-2 rounded-lg border-2 border-red-300 shadow-sm">
           <div class="w-4 h-4 rounded-full bg-red-300 mt-1 flex-shrink-0"></div>
           <div>
             <span class="font-bold text-slate-800 text-xs block uppercase">Punainen reunus (Ei vilku)</span>
             <span class="text-xs text-slate-600"><strong>Kriittinen varasto!</strong> Lääke on loppunut tai aivan loppumassa. Se on punaisella myös ostoslistalla.</span>
           </div>
        </div>

        <div class="flex gap-3 items-start bg-white p-2 rounded-lg border-2 border-orange-300 shadow-sm">
           <div class="w-4 h-4 rounded-full bg-orange-400 mt-1 flex-shrink-0"></div>
           <div>
             <span class="font-bold text-slate-800 text-xs block uppercase">Oranssi reunus</span>
             <span class="text-xs text-slate-600"><strong>Vähissä.</strong> Lääkettä on vielä, mutta on aika hakea lisää. Se on noussut ostoslistalle.</span>
           </div>
        </div>

        <div class="flex gap-3 items-start bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
           <div class="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
           <div>
             <span class="font-bold text-slate-800 text-xs block uppercase">Vihreä merkki / Normaali</span>
             <span class="text-xs text-slate-600">Kaikki hyvin. Lääke on otettu tai varastoa on riittävästi.</span>
           </div>
        </div>
      </div>
    `
  },
  {
    id: 'add',
    title: '3. Lääkkeen lisäys',
    icon: 'Plus',
    content: `
      <p class="mb-2 text-sm text-slate-600">Paina alhaalla olevaa isoa <strong class="text-blue-600">Plus (+)</strong> -nappia.</p>
      
      <h4 class="font-bold text-slate-800 text-sm mt-3 mb-1">A) Yksittäinen lääke (Suositus)</h4>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-1 mb-2">
        <li>Kirjoita nimi ja annostus.</li>
        <li><strong>Tärkeä:</strong> Valitse "Seuraa lääkevarastoa", jos haluat varastovaroitukset.</li>
        <li>Aseta "Hälytysraja" (esim. 10 kpl). Kun määrä alittaa tämän, lääke muuttuu punaiseksi. Viisi (5) kappaletta ennen rajaa se muuttuu oranssiksi.</li>
        <li>Valitse kellonajat ja viikonpäivät.</li>
      </ul>

      <h4 class="font-bold text-slate-800 text-sm mt-3 mb-1">B) Dosetti</h4>
      <p class="text-xs text-slate-600 mb-2">Käytä tätä, jos jaat lääkkeet dosettiin kerran viikossa.</p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-1">
        <li>Dosetti vähentää varastoa automaattisesti kaikista siihen kuuluvista lääkkeistä, kun kuittaat dosetin otetuksi.</li>
      </ul>
    `
  },
  {
    id: 'usage',
    title: '4. Käyttö & Kuittaus',
    icon: 'CheckCircle',
    content: `
      <p class="text-sm text-slate-600 mb-2">Kun otat lääkkeen:</p>
      <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2">
        <li>Etsi lääke etusivulta.</li>
        <li>Paina kyseistä aikalaatikkoa (esim. <strong>AAMU</strong> tai <strong>ILTA</strong>).</li>
        <li>Laatikko muuttuu vihreäksi ja kello lakkaa vilkkumasta.</li>
      </ol>
      <p class="text-sm text-slate-600 mt-2 mb-1"><strong>Satunnainen lääke (esim. särkylääke)?</strong></p>
      <p class="text-xs text-slate-600">Paina alareunan oranssia <strong class="text-orange-500">Salama</strong>-nappia. Voit kirjata lääkkeen nopeasti ilman aikataulua.</p>
    `
  },
  {
    id: 'stock',
    title: '5. Varasto & Ostoslista',
    icon: 'ShoppingCart',
    content: `
      <p class="text-sm text-slate-600 mb-2">
        Sovellus pitää kirjaa tablettien määrästä.
      </p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li><strong>Ostoslista:</strong> Paina yläreunan <span class="text-red-500">Ostoskärry</span>-ikonia. Sinne ilmestyvät automaattisesti kaikki lääkkeet, jotka ovat oranssilla (vähissä) tai punaisella (loppumassa).</li>
        <li><strong>Varaston täydennys:</strong> Kun haet lääkkeen apteekista, avaa lääkkeen tiedot (nuoli alaspäin) ja paina <span class="text-green-600">Kierrätys/Päivitys</span> -ikonia. Syötä ostamasi määrä (esim. 100), niin se lisätään saldoon.</li>
      </ul>
    `
  },
  {
    id: 'history',
    title: '6. Historia & Raportit',
    icon: 'BarChart2',
    content: `
      <p class="text-sm text-slate-600 mb-2">
        Alapalkista löydät <strong>Historia</strong>-välilehden.
      </p>
      <ul class="list-disc list-inside text-xs text-slate-600 space-y-2">
        <li>Näet listan kaikista otetuista lääkkeistä päivittäin.</li>
        <li><strong>Raportti lääkärille:</strong> Paina "Raportti" -nappia. Voit valita aikavälin ja kopioida tarkan listan leikepöydälle. Tämä on hyödyllinen lääkärikäynneillä.</li>
        <li><strong>Virhekirjaus:</strong> Jos painoit vahingossa, etsi merkintä historiasta, klikkaa sitä ja valitse "Poista".</li>
      </ul>
    `
  },
  {
    id: 'install',
    title: '7. Asennusvinkki',
    icon: 'PlusSquare',
    content: `
      <p class="mb-2 text-sm text-slate-600">Jotta ilmoitukset toimivat parhaiten, lisää tämä sovellus puhelimesi kotivalikkoon:</p>
      <div class="bg-slate-100 p-2 rounded border border-slate-200 text-xs">
        <p><strong>iPhone:</strong> Paina Jaa-nappia (nuoli laatikosta ylös) -> "Lisää Koti-valikkoon".</p>
        <p class="mt-1"><strong>Android:</strong> Paina selaimen kolmea pistettä -> "Asenna sovellus" tai "Lisää aloitusnäyttöön".</p>
      </div>
    `
  }
];
