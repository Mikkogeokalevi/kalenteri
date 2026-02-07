// Kalenteritoiminnot - eriytetty moduuli
export class CalendarManager {
    constructor() {
        this.nykyinenPaiva = new Date();
        this.kalenteriPaivatOtsikot = document.getElementById('kalenteri-paivat-otsikot');
        this.kalenteriGrid = document.getElementById('kalenteri-grid');
        this.kuukausiOtsikko = document.getElementById('kuukausi-otsikko');
        this.edellinenBtn = document.getElementById('edellinen-kk');
        this.seuraavaBtn = document.getElementById('seuraava-kk');
        this.tanaanBtn = document.getElementById('tanaan-btn');
    }

    // Piirrä kalenteri
    piirraKalenteri(kaikkiTapahtumat, nykyinenKayttaja) {
        const vuosi = this.nykyinenPaiva.getFullYear();
        const kuukausi = this.nykyinenPaiva.getMonth();
        
        // Päivitä kuukausiotsikko
        const kuukausiNimet = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
                              'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
        this.kuukausiOtsikko.textContent = `${kuukausiNimet[kuukausi]} ${vuosi}`;
        
        // Tyhjennä vanhat sisällöt
        this.kalenteriPaivatOtsikot.innerHTML = '';
        this.kalenteriGrid.innerHTML = '';
        
        // Luo viikkonumerot ja päiväotsikot
        const viikkoPohja = this.luoViikkoPohja();
        this.kalenteriPaivatOtsikot.appendChild(viikkoPohja);
        
        // Laske kuukauden ensimmäinen päivä ja viikko
        const ekaPaiva = new Date(vuosi, kuukausi, 1);
        const ekaViikko = this.getWeekNumber(ekaPaiva);
        
        // Luo viikot
        const viikot = this.luoViikot(vuosi, kuukausi, ekaViikko);
        
        // Lisää viikot gridiin
        viikot.forEach(viikko => {
            this.kalenteriGrid.appendChild(viikko);
        });
        
        // Lisää tapahtumat kalenteriin
        this.lisaaTapahtumatKalenteriin(kaikkiTapahtumat, nykyinenKayttaja);
    }

    // Luo viikkopohja (otsikkorivi)
    luoViikkoPohja() {
        const viikkoPohja = document.createElement('div');
        viikkoPohja.style.display = 'contents';
        
        // Viikkonumero-sarake
        const viikkoOtsikko = document.createElement('div');
        viikkoOtsikko.className = 'viikko-nro';
        viikkoOtsikko.textContent = 'Vk';
        viikkoPohja.appendChild(viikkoOtsikko);
        
        // Päiväotsikot
        const paivaOtsikot = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
        paivaOtsikot.forEach(paiva => {
            const otsikko = document.createElement('div');
            otsikko.className = 'viikonpaiva';
            otsikko.textContent = paiva;
            viikkoPohja.appendChild(otsikko);
        });
        
        return viikkoPohja;
    }

    // Luo viikot kuukaudelle
    luoViikot(vuosi, kuukausi, ekaViikko) {
        const viikot = [];
        let nykyinenViikko = ekaViikko;
        let nykyinenPaiva = new Date(vuosi, kuukausi, 1);
        
        // Siirrä ensimmäiseen maanantaihin
        while (nykyinenPaiva.getDay() !== 1) {
            nykyinenPaiva.setDate(nykyinenPaiva.getDate() - 1);
        }
        
        while (nykyinenPaiva.getMonth() === kuukausi || nykyinenPaiva.getMonth() === (kuukausi + 1) % 12) {
            const viikko = this.luoViikko(nykyinenPaiva, nykyinenViikko, vuosi, kuukausi);
            viikot.push(viikko);
            
            // Siirry seuraavaan viikkoon
            nykyinenPaiva.setDate(nykyinenPaiva.getDate() + 7);
            nykyinenViikko++;
            
            // Lopeta kun olemme seuraavan kuukauden puolella ja viikko on tyhjä
            if (nykyinenPaiva.getMonth() !== kuukausi && nykyinenPaiva.getMonth() !== (kuukausi + 1) % 12) {
                break;
            }
        }
        
        return viikot;
    }

    // Luo yksi viikko
    luoViikko(alkupaiva, viikkoNumero, vuosi, kuukausi) {
        const viikko = document.createElement('div');
        viikko.style.display = 'contents';
        
        // Viikkonumero
        const viikkoNro = document.createElement('div');
        viikkoNro.className = 'viikko-nro';
        viikkoNro.textContent = viikkoNumero;
        viikko.appendChild(viikkoNro);
        
        // Luo 7 päivää (ma-su)
        for (let i = 0; i < 7; i++) {
            const paiva = new Date(alkupaiva);
            paiva.setDate(alkupaiva.getDate() + i);
            
            const paivaElementti = this.luoPaivaElementti(paiva, vuosi, kuukausi);
            viikko.appendChild(paivaElementti);
        }
        
        return viikko;
    }

    // Luo päiväelementti
    luoPaivaElementti(paiva, vuosi, kuukausi) {
        const paivaElementti = document.createElement('div');
        const onTanaan = this.onTanaan(paiva);
        const onKuukaudenPaiva = paiva.getMonth() === kuukausi;
        
        paivaElementti.className = `paiva ${onTanaan ? 'tanaan' : ''} ${!onKuukaudenPaiva ? 'tyhja' : ''}`;
        paivaElementti.dataset.pvm = this.formatPVM(paiva);
        
        // Päivän numero
        const paivaNumero = document.createElement('div');
        paivaNumero.className = 'paiva-numero';
        paivaNumero.textContent = paiva.getDate();
        paivaElementti.appendChild(paivaNumero);
        
        // Tapahtumien säiliö
        const tapahtumatContainer = document.createElement('div');
        tapahtumatContainer.className = 'tapahtumat-container';
        paivaElementti.appendChild(tapahtumatContainer);
        
        // Lisää klikkauskäsittelijä
        paivaElementti.addEventListener('click', () => this.handlePaivaClick(paiva));
        
        return paivaElementti;
    }

    // Lisää tapahtumat kalenteriin
    lisaaTapahtumatKalenteriin(kaikkiTapahtumat, nykyinenKayttaja) {
        if (!kaikkiTapahtumat) return;
        
        kaikkiTapahtumat.forEach(tapahtuma => {
            if (!tapahtuma.alku) return;
            
            const tapahtumanPaiva = new Date(tapahtuma.alku);
            const pvm = this.formatPVM(tapahtumanPaiva);
            const paivaElementti = this.kalenteriGrid.querySelector(`[data-pvm="${pvm}"]`);
            
            if (paivaElementti) {
                const tapahtumaPalkki = this.luoTapahtumaPalkki(tapahtuma, nykyinenKayttaja);
                const container = paivaElementti.querySelector('.tapahtumat-container');
                container.appendChild(tapahtumaPalkki);
            }
        });
    }

    // Luo tapahtumapalkki
    luoTapahtumaPalkki(tapahtuma, nykyinenKayttaja) {
        const palkki = document.createElement('div');
        palkki.className = 'tapahtuma-palkki';
        palkki.style.backgroundColor = this.getKayttajanVari(tapahtuma.luoja);
        palkki.textContent = tapahtuma.otsikko;
        
        // Lisää klikkauskäsittelijä
        palkki.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.avaaTapahtumaIkkuna) {
                window.avaaTapahtumaIkkuna(tapahtuma.key);
            }
        });
        
        return palkki;
    }

    // Käsittele päivän klikkaus
    handlePaivaClick(paiva) {
        if (window.handlePaivaClick) {
            window.handlePaivaClick(paiva);
        }
    }

    // Apufunktiot
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    formatPVM(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    onTanaan(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getKayttajanVari(kayttaja) {
        if (window.KAYTTAJA_VARIT) {
            return window.KAYTTAJA_VARIT[kayttaja] || '#666';
        }
        return '#666';
    }

    // Siirrä kuukautta
    siirraKuukausi(suunta) {
        if (suunta === 'edellinen') {
            this.nykyinenPaiva.setMonth(this.nykyinenPaiva.getMonth() - 1);
        } else if (suunta === 'seuraava') {
            this.nykyinenPaiva.setMonth(this.nykyinenPaiva.getMonth() + 1);
        } else if (suunta === 'tanaan') {
            this.nykyinenPaiva = new Date();
        }
    }

    // Palauta nykyinen päivä
    getNykyinenPaiva() {
        return this.nykyinenPaiva;
    }
}
