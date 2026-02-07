// Tehtävien hallinta - eriytetty moduuli
export class TaskManager {
    constructor() {
        this.tehtavatContainer = document.getElementById('tehtavat-container');
        this.uusiTehtavaTeksti = document.getElementById('uusi-tehtava-teksti');
        this.lisaaTehtavaNappi = document.getElementById('lisaa-tehtava-nappi');
        this.tehtavalistaToggle = document.getElementById('tehtavalista-toggle');
        this.tehtavalistaSisalto = document.getElementById('tehtavalista-sisalto');
        this.avoimetTehtavatLaskuri = document.getElementById('avoimet-tehtavat-laskuri');
        this.lisaaTehtavaHenkilot = document.getElementById('lisaa-tehtava-henkilot');
        this.lisaaMaarapaivaToggle = document.getElementById('lisaa-maarapaiva-toggle');
        this.uusiTehtavaMaarapaiva = document.getElementById('uusi-tehtava-maarapaiva');
        this.avaaArkistoBtn = document.getElementById('avaa-arkisto-btn');
        this.tehtavaArkistoModal = document.getElementById('tehtava-arkisto-modal');
        this.suljeArkistoModalBtn = document.getElementById('sulje-arkisto-modal-btn');
        this.arkistoidutTehtavatLista = document.getElementById('arkistoidut-tehtavat-lista');
        
        this.kaikkiTehtavat = [];
        this.nykyinenKayttaja = null;
    }

    // Alusta tehtävien kuuntelijat
    initializeEventListeners() {
        this.tehtavalistaToggle.addEventListener('click', () => this.toggleTehtavalista());
        this.lisaaTehtavaNappi.addEventListener('click', () => this.lisaaTehtava());
        this.lisaaMaarapaivaToggle.addEventListener('change', (e) => this.toggleMaarapaiva(e.target.checked));
        this.avaaArkistoBtn.addEventListener('click', () => this.avaaArkisto());
        this.suljeArkistoModalBtn.addEventListener('click', () => this.suljeArkisto());
        
        // Enter-näppäin tehtävän lisäykseen
        this.uusiTehtavaTeksti.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.lisaaTehtava();
            }
        });
        
        // Modalin sulkeminen taustasta klikkaamalla
        this.tehtavaArkistoModal.addEventListener('click', (e) => {
            if (e.target === this.tehtavaArkistoModal) {
                this.suljeArkisto();
            }
        });
    }

    // Kuuntele tehtäviä
    kuunteleTehtavia(firebaseOperations) {
        return firebaseOperations.listenToTasks((snapshot) => {
            this.kaikkiTehtavat = [];
            snapshot.forEach((child) => {
                const tehtava = { key: child.key, ...child.val() };
                this.kaikkiTehtavat.push(tehtava);
            });
            this.piirraTehtavalista();
            this.paivitaLaskuri();
        });
    }

    // Piirrä tehtävälista
    piirraTehtavalista() {
        this.tehtavalistaSisalto.innerHTML = '';
        
        const aktiivisetTehtavat = this.kaikkiTehtavat
            .filter(t => t.tila !== 'arkistoitu')
            .sort((a, b) => {
                // Järjestä ensin määräpäivän mukaan, sitten lisäysajan mukaan
                if (a.maarapaiva && b.maarapaiva) {
                    return new Date(a.maarapaiva) - new Date(b.maarapaiva);
                }
                if (a.maarapaiva) return -1;
                if (b.maarapaiva) return 1;
                return new Date(b.lisattyAika || 0) - new Date(a.lisattyAika || 0);
            });

        if (aktiivisetTehtavat.length === 0) {
            this.tehtavalistaSisalto.innerHTML = '<p style="text-align:center; opacity:0.7;">Ei aktiivisia tehtäviä</p>';
            return;
        }

        aktiivisetTehtavat.forEach(tehtava => {
            const tehtavaElementti = this.rakennaTehtavaItemView(tehtava);
            this.tehtavalistaSisalto.appendChild(tehtavaElementti);
        });
    }

    // Rakenna tehtävä-item view
    rakennaTehtavaItemView(tehtava) {
        const item = document.createElement('div');
        item.className = `tehtava-item ${this.maaritaTehtavanTila(tehtava)}`;
        item.dataset.key = tehtava.key;

        const vasen = document.createElement('div');
        vasen.className = 'tehtava-vasen';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = tehtava.tehty;
        checkbox.addEventListener('change', () => this.paivitaTehtavanTila(tehtava.key, checkbox.checked));
        vasen.appendChild(checkbox);

        // Tehtävän tiedot
        const tiedot = document.createElement('div');
        tiedot.className = 'tehtava-tiedot';

        const teksti = document.createElement('p');
        teksti.className = 'tehtava-teksti';
        teksti.textContent = tehtava.teksti;
        tiedot.appendChild(teksti);

        // Meta-tiedot
        if (tehtava.maarapaiva || tehtava.kohdistus) {
            const meta = document.createElement('div');
            meta.className = 'tehtava-meta';

            if (tehtava.maarapaiva) {
                const maarapaiva = document.createElement('span');
                maarapaiva.textContent = `📅 ${this.formatDate(tehtava.maarapaiva)}`;
                meta.appendChild(maarapaiva);
            }

            if (tehtava.kohdistus && tehtava.kohdistus.length > 0) {
                const kohdistus = document.createElement('span');
                kohdistus.textContent = this.formatKohdistus(tehtava.kohdistus);
                kohdistus.style.marginLeft = '8px';
                meta.appendChild(kohdistus);
            }

            tiedot.appendChild(meta);
        }

        vasen.appendChild(tiedot);
        item.appendChild(vasen);

        // Oikea puoli (nappulat)
        const oikea = document.createElement('div');
        oikea.className = 'tehtava-oikea';

        const muokkaaBtn = document.createElement('button');
        muokkaaBtn.className = 'muokkaa-tehtava-nappi pieni-nappi';
        muokkaaBtn.textContent = 'Muokkaa';
        muokkaaBtn.addEventListener('click', () => this.siirryMuokkaustilaan(item, tehtava));
        oikea.appendChild(muokkaaBtn);

        const arkistoiBtn = document.createElement('button');
        arkistoiBtn.className = 'arkistoi-tehtava-nappi pieni-nappi';
        arkistoiBtn.textContent = 'Arkistoi';
        arkistoiBtn.addEventListener('click', () => this.arkistoiTehtava(tehtava.key));
        oikea.appendChild(arkistoiBtn);

        const poistaBtn = document.createElement('button');
        poistaBtn.className = 'poista-tehtava-nappi pieni-nappi';
        poistaBtn.textContent = 'Poista';
        poistaBtn.addEventListener('click', () => this.poistaTehtava(tehtava.key));
        oikea.appendChild(poistaBtn);

        item.appendChild(oikea);
        return item;
    }

    // Siirrä muokkaustilaan
    siirryMuokkaustilaan(itemElementti, tehtava) {
        itemElementti.classList.add('is-editing');
        itemElementti.innerHTML = '';

        const vasen = document.createElement('div');
        vasen.className = 'tehtava-vasen';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = tehtava.tehty;
        checkbox.addEventListener('change', () => this.paivitaTehtavanTila(tehtava.key, checkbox.checked));
        vasen.appendChild(checkbox);

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = tehtava.teksti;
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.tallennaMuokkaus(tehtava.key, editInput.value);
            }
        });
        vasen.appendChild(editInput);

        itemElementti.appendChild(vasen);

        const oikea = document.createElement('div');
        oikea.className = 'tehtava-oikea edit-controls';

        // Määräpäivän muokkaus
        const maarapaivaContainer = document.createElement('div');
        maarapaivaContainer.className = 'maarapaiva-container';
        
        const maarapaivaToggle = document.createElement('label');
        maarapaivaToggle.innerHTML = `
            <input type="checkbox" ${tehtava.maarapaiva ? 'checked' : ''}>
            Määräpäivä
        `;
        maarapaivaContainer.appendChild(maarapaivaToggle);

        const maarapaivaInput = document.createElement('input');
        maarapaivaInput.type = 'date';
        maarapaivaInput.className = 'edit-input';
        maarapaivaInput.value = tehtava.maarapaiva || '';
        maarapaivaInput.style.display = tehtava.maarapaiva ? 'block' : 'none';
        maarapaivaContainer.appendChild(maarapaivaInput);

        maarapaivaToggle.querySelector('input').addEventListener('change', (e) => {
            maarapaivaInput.style.display = e.target.checked ? 'block' : 'none';
        });

        oikea.appendChild(maarapaivaContainer);

        // Tallenna ja peruuta napit
        const tallennaBtn = document.createElement('button');
        tallennaBtn.className = 'pieni-nappi';
        tallennaBtn.textContent = 'Tallenna';
        tallennaBtn.addEventListener('click', () => this.tallennaMuokkaus(tehtava.key, editInput.value, maarapaivaInput.value));
        oikea.appendChild(tallennaBtn);

        const peruutaBtn = document.createElement('button');
        peruutaBtn.className = 'pieni-nappi cancel-btn';
        peruutaBtn.textContent = 'Peruuta';
        peruutaBtn.addEventListener('click', () => this.peruutaMuokkaus(itemElementti, tehtava));
        oikea.appendChild(peruutaBtn);

        itemElementti.appendChild(oikea);
        editInput.focus();
    }

    // Tallenna muokkaus
    tallennaMuokkaus(key, uusiTeksti, uusiMaarapaiva) {
        const paivitykset = {
            teksti: uusiTeksti,
            maarapaiva: uusiMaarapaiva || null
        };
        
        if (window.firebaseOperations) {
            window.firebaseOperations.updateTask(key, paivitykset);
        }
    }

    // Peruuta muokkaus
    peruutaMuokkaus(itemElementti, tehtava) {
        this.piirraTehtavalista();
    }

    // Lisää uusi tehtävä
    lisaaTehtava() {
        const teksti = this.uusiTehtavaTeksti.value.trim();
        if (!teksti) return;

        const kohdistusValinnat = Array.from(this.lisaaTehtavaHenkilot.querySelectorAll('.assign-btn.active'))
            .map(btn => btn.dataset.user);

        const uusiTehtava = {
            teksti: teksti,
            tehty: false,
            tila: 'aktiivinen',
            kohdistus: kohdistusValinnat,
            luoja: this.nykyinenKayttaja,
            lisattyAika: new Date().toISOString()
        };

        if (this.lisaaMaarapaivaToggle.checked && this.uusiTehtavaMaarapaiva.value) {
            uusiTehtava.maarapaiva = this.uusiTehtavaMaarapaiva.value;
        }

        if (window.firebaseOperations) {
            window.firebaseOperations.addTask(uusiTehtava).then(() => {
                this.uusiTehtavaTeksti.value = '';
                this.lisaaTehtavaHenkilot.querySelectorAll('.assign-btn').forEach(btn => btn.classList.remove('active'));
                this.lisaaMaarapaivaToggle.checked = false;
                this.uusiTehtavaMaarapaiva.classList.add('hidden');
                this.uusiTehtavaMaarapaiva.value = '';
            });
        }
    }

    // Päivitä tehtävän tila
    paivitaTehtavanTila(key, onkoTehty) {
        if (window.firebaseOperations) {
            window.firebaseOperations.updateTask(key, { tehty: onkoTehty });
        }
    }

    // Arkistoi tehtävä
    arkistoiTehtava(key) {
        if (window.firebaseOperations) {
            window.firebaseOperations.updateTask(key, { tila: 'arkistoitu' });
        }
    }

    // Palauta tehtävä
    palautaTehtava(key) {
        if (window.firebaseOperations) {
            window.firebaseOperations.updateTask(key, { tila: 'aktiivinen' });
        }
    }

    // Poista tehtävä
    poistaTehtava(key) {
        if (confirm('Haluatko varmasti poistaa tämän tehtävän lopullisesti? Tätä ei voi perua.')) {
            if (window.firebaseOperations) {
                window.firebaseOperations.deleteTask(key);
            }
        }
    }

    // Avaa arkisto
    avaaArkisto() {
        this.arkistoidutTehtavatLista.innerHTML = '';
        const arkistoidut = this.kaikkiTehtavat
            .filter(t => t.tila === 'arkistoitu')
            .sort((a, b) => new Date(b.lisattyAika || 0) - new Date(a.lisattyAika || 0));

        if (arkistoidut.length === 0) {
            this.arkistoidutTehtavatLista.innerHTML = '<p style="text-align:center; opacity:0.7;">Arkisto on tyhjä.</p>';
        } else {
            arkistoidut.forEach(tehtava => {
                const item = document.createElement('div');
                item.className = 'arkisto-item';

                const teksti = document.createElement('span');
                teksti.className = 'arkisto-item-teksti';
                teksti.textContent = tehtava.teksti;

                const nappulat = document.createElement('div');
                nappulat.className = 'arkisto-item-nappulat';

                const palautaNappi = document.createElement('button');
                palautaNappi.textContent = 'Palauta';
                palautaNappi.className = 'pieni-nappi';
                palautaNappi.addEventListener('click', () => this.palautaTehtava(tehtava.key));

                const poistaNappi = document.createElement('button');
                poistaNappi.textContent = 'Poista pysyvästi';
                poistaNappi.className = 'delete-btn pieni-nappi';
                poistaNappi.addEventListener('click', () => this.poistaTehtava(tehtava.key));

                nappulat.appendChild(palautaNappi);
                nappulat.appendChild(poistaNappi);
                item.appendChild(teksti);
                item.appendChild(nappulat);
                this.arkistoidutTehtavatLista.appendChild(item);
            });
        }

        this.tehtavaArkistoModal.classList.remove('hidden');
    }

    // Sulje arkisto
    suljeArkisto() {
        this.tehtavaArkistoModal.classList.add('hidden');
    }

    // Toggle tehtävälista
    toggleTehtavalista() {
        this.tehtavalistaSisalto.classList.toggle('hidden');
    }

    // Toggle määräpäivä
    toggleMaarapaiva(show) {
        this.uusiTehtavaMaarapaiva.classList.toggle('hidden', !show);
    }

    // Päivitä laskuri
    paivitaLaskuri() {
        const avoimet = this.kaikkiTehtavat.filter(t => t.tila !== 'arkistoitu' && !t.tehty).length;
        this.avoimetTehtavatLaskuri.textContent = avoimet;
    }

    // Määritä tehtävän tila
    maaritaTehtavanTila(tehtava) {
        if (tehtava.tehty) {
            return 'tehty';
        }
        if (tehtava.maarapaiva) {
            const nyt = new Date();
            const maarapaiva = new Date(tehtava.maarapaiva);
            if (nyt > maarapaiva) {
                return 'myohassa';
            }
            if (maarapaiva - nyt < 86400000) { // 24 tuntia millisekunteina
                return 'kiireellinen';
            }
            return 'ok';
        }
        return ''; // Ei erityistä tilaa
    }

    // Apufunktiot
    formatDate(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('fi-FI');
        } catch (error) {
            return isoString;
        }
    }

    formatKohdistus(kohdistus) {
        if (!kohdistus || kohdistus.length === 0) return '';
        if (kohdistus.length === 1) return kohdistus[0];
        if (kohdistus.length >= 3) return 'Koko perhe';
        return kohdistus.join(', ');
    }

    // Aseta nykyinen käyttäjä
    setNykyinenKayttaja(kayttaja) {
        this.nykyinenKayttaja = kayttaja;
    }

    // Palauta kaikki tehtävät
    getKaikkiTehtavat() {
        return this.kaikkiTehtavat;
    }
}
