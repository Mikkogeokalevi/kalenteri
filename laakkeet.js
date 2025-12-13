import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Pill, Clock, Trash2, CheckCircle, History, X, BarChart2, Calendar, AlertTriangle, Pencil, CalendarPlus, LogOut, User, Lock, Loader2, Archive, ArchiveRestore, ChevronDown, ChevronUp, Sun, Moon, Sunrise, Sunset, Check, Zap, Bell, BellOff, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Package, RefreshCw, ShoppingCart, FileText, Clipboard, MessageSquare, ListChecks, RotateCcw, Share, MoreVertical, PlusSquare, Filter, Layers, LayoutList, Link, Box, Component, Menu } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, getDocs, query, where } from 'firebase/firestore';

// --- ASETUKSET ---
const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.appspot.com",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'laakemuistio';

// --- VAKIOT ---
const TIME_SLOTS = [
  { id: 'aamu', label: 'Aamu', icon: Sunrise, defaultTime: '08:00' },
  { id: 'paiva', label: 'Päivä', icon: Sun, defaultTime: '12:00' },
  { id: 'ilta', label: 'Ilta', icon: Sunset, defaultTime: '20:00' },
  { id: 'yo', label: 'Yö', icon: Moon, defaultTime: '22:00' }
];

// --- OHJESIVU KOMPONENTTI ---
const HelpView = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="bg-white px-4 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm flex-none">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          <HelpCircle /> Käyttöopas
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-20">
        
        {/* 1. ASENNUSOHJEET */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <PlusSquare className="text-slate-500" size={22}/> Asenna puhelimeen
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Tämä on selainpohjainen sovellus. Saat parhaan käyttökokemuksen lisäämällä sen kotivalikkoon, jolloin se toimii kuin oikea sovellus (koko näyttö).
          </p>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"> iPhone / iPad (Safari)</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 ml-1">
                <li>Paina alareunan <strong>Jaa</strong>-painiketta <Share className="inline w-3 h-3"/>.</li>
                <li>Rullaa valikkoa alaspäin ja valitse <strong>"Lisää Koti-valikkoon"</strong>.</li>
                <li>Paina yläkulmasta <strong>Lisää</strong>.</li>
              </ol>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">🤖 Android (Chrome)</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 ml-1">
                <li>Paina selaimen yläkulman kolmea pistettä <MoreVertical className="inline w-3 h-3"/>.</li>
                <li>Valitse valikosta <strong>"Asenna sovellus"</strong> tai <strong>"Lisää aloitusnäyttöön"</strong>.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* 2. ALOITUS JA PERUSKÄYTTÖ */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Pill className="text-blue-500" size={22}/> Lääkkeiden hallinta
          </h3>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <strong className="block text-slate-800 mb-1">Lääkkeen lisääminen:</strong>
              <p>Paina oikean alakulman sinistä <strong>+</strong> painiketta. Voit antaa lääkkeelle nimen, annostuksen ja värin.</p>
            </div>
            <div>
              <strong className="block text-slate-800 mb-1">Lääkkeen ottaminen:</strong>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><strong>Aikataulutetut:</strong> Paina aikakuvaketta (esim. Aurinko). Se muuttuu vihreäksi.</li>
                <li><strong>Tarvittaessa otettavat:</strong> Avaa lääkkeen kortti ja paina <strong>OTA NYT</strong>. Voit kirjata samalla syyn (esim. "Kipu").</li>
              </ul>
            </div>
            <div>
              <strong className="block text-slate-800 mb-1">Muokkaus ja Poisto:</strong>
              <p>Klikkaa lääkkeen nimeä avataksesi toiminnot (Kynä = Muokkaa, Roskakori = Poista, Arkisto = Piilota väliaikaisesti).</p>
            </div>
          </div>
        </section>

        {/* 3. VARASTO JA DOSETTI */}
        <section className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
          <h3 className="font-bold text-blue-800 text-lg mb-4 flex items-center gap-2">
            <LayoutList className="text-blue-600" size={22}/> Varasto & Dosetit
          </h3>
          <div className="space-y-4 text-sm text-slate-600">
            <p>Tämä ominaisuus on hyödyllinen, jos käytät dosettia tai otat useita lääkkeitä kerralla (esim. "Iltasetti").</p>
            
            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase">Vaihe 1: Luo Varasto</h4>
              <p>Lisää ensin kaikki fyysiset lääkepurkit sovellukseen (esim. "Kalkki", "Magnesium").</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Aseta niille <strong>Varastosaldo</strong> (esim. 100 kpl).</li>
                <li>Jos lääke on vain osa yhdistelmää, ota täppä pois kohdasta <em>"Näytä etusivulla"</em>. Tällöin se ei sotke etusivun näkymää, vaan löytyy yläpalkin valikosta <strong>Varastolistalta</strong> (<Box size={12} className="inline"/>).</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase">Vaihe 2: Luo Yhdistelmä (Dosetti)</h4>
              <p>Luo uusi lääke nimeltä "Iltasetti".</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Älä laita sille saldoa. Lisää sille aikataulu (esim. Ilta).</li>
                <li>Kohdassa <strong>Koostumus</strong> valitse pudotusvalikosta varastossa olevat lääkkeet (esim. Kalkki 2kpl, Magnesium 1kpl).</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Miten se toimii?</h4>
              <p>Etusivulla näkyy nyt siisti "Dosetti"-kortti. Kun kuittaat Iltasetin otetuksi, sovellus vähentää automaattisesti saldot Kalkki- ja Magnesium-purkeista!</p>
            </div>
          </div>
        </section>

        {/* 4. HISTORIA JA RAPORTIT */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <FileText className="text-purple-600" size={22}/> Historia & Lääkäri
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p><strong>Historia-välilehti:</strong> Näyttää aikajanalta kaikki tapahtumat.</p>
            <p><strong>Raportti lääkärille:</strong> Paina "Raportti" -nappia. Voit valita aikavälin (esim. viimeiset 3kk) ja mitkä lääkkeet raporttiin otetaan.</p>
            <p>Raportti erottelee kätevästi säännölliset lääkkeet ja tarvittaessa otetut (syy-merkintöineen). Voit kopioida tekstin ja lähettää sen lääkärille tai näyttää vastaanotolla.</p>
          </div>
        </section>

        {/* 5. KUVAKKEET */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <HelpCircle className="text-slate-500" size={22}/> Valikko & Kuvakkeet
          </h3>
          <div className="grid grid-cols-1 gap-3">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><Zap size={16}/></div>
               <div className="text-xs text-slate-600"><strong>Pikalisäys:</strong> Ota satunnainen lääke (esim. Burana päänsärkyyn) ilman että lisäät sitä pysyvästi listalle.</div>
             </div>
             <div className="flex items-center gap-3">
               <div className="p-2 bg-red-100 text-red-600 rounded-full"><ShoppingCart size={16}/></div>
               <div className="text-xs text-slate-600"><strong>Ostoslista:</strong> Ilmestyy yläpalkkiin, kun jonkin varastolääkkeen saldo alittaa hälytysrajan.</div>
             </div>
             <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-100 text-slate-600 rounded-full border border-slate-200"><Menu size={16}/></div>
               <div className="text-xs text-slate-600"><strong>Valikko (yläpalkki):</strong> Täältä löydät Varastolistan, Dosettijaon, Järjestelyn, Ohjeet ja Uloskirjauksen.</div>
             </div>
          </div>
        </section>

        <div className="text-center text-xs text-slate-400 pt-6 pb-2">
          Lääkemuistio v2.9 - {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

// --- KIRJAUTUMISNÄKYMÄ ---
const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let msg = "Tapahtui virhe.";
      if (err.code === 'auth/invalid-email') msg = "Virheellinen sähköposti.";
      if (err.code === 'auth/missing-password') msg = "Syötä salasana.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Väärä sähköposti tai salasana.";
      if (err.code === 'auth/weak-password') msg = "Salasanan tulee olla vähintään 6 merkkiä.";
      if (err.code === 'auth/email-already-in-use') msg = "Sähköposti on jo käytössä.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="" className="w-3/4 opacity-[0.15] grayscale" />
      </div>
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl z-10 border border-white">
        <div className="flex justify-center mb-6">
          <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isRegistering ? 'Luo tunnus' : 'Kirjaudu sisään'}
        </h2>
        <p className="text-center text-slate-400 text-sm mb-8">
          Lääkemuistio - Pidä kirjaa lääkkeistäsi
        </p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sähköposti</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="email" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="sinun@sahkoposti.fi" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salasana</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
            {loading && <Loader2 size={20} className="animate-spin" />}
            {isRegistering ? 'Rekisteröidy' : 'Kirjaudu'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-sm text-slate-500 hover:text-blue-600 font-medium">
            {isRegistering ? 'Onko sinulla jo tunnus? Kirjaudu' : 'Uusi käyttäjä? Luo tunnus'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PÄÄSOVELLUS ---
const MedicineTracker = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [expandedMedId, setExpandedMedId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showDosetti, setShowDosetti] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showStockList, setShowStockList] = useState(false); 
  const [isMenuOpen, setIsMenuOpen] = useState(false); // UUSI: Hampurilaisvalikon tila

  // Raportin tila
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedMeds, setReportSelectedMeds] = useState(new Set());

  // Ainesosien tila lisäys/muokkaus ikkunassa
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCount, setIngredientCount] = useState('');
  const [currentIngredients, setCurrentIngredients] = useState([]); 

  // LISÄYS/MUOKKAUS TILA - ONKO NÄKYVISSÄ ETUSIVULLA
  const [showOnDashboard, setShowOnDashboard] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setLoadingData(false);
        setMedications([]);
        setLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Listener
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    const medsRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'medications');
    const logsRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs');

    const unsubMeds = onSnapshot(medsRef, (snapshot) => {
      const medsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      medsData.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : a.createdAt;
        const orderB = b.order !== undefined ? b.order : b.createdAt;
        return orderA - orderB;
      });
      setMedications(medsData);
      setLoadingData(false);
    }, (err) => { console.error(err); setLoadingData(false); });

    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
    });

    return () => { unsubMeds(); unsubLogs(); };
  }, [user]);

  // Aseta oletusarvot raportille
  useEffect(() => {
    if (showReport) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      setReportStartDate(start.toISOString().split('T')[0]);
      setReportEndDate(end.toISOString().split('T')[0]);
      setReportSelectedMeds(new Set(medications.filter(m => !m.isArchived).map(m => m.id)));
    }
  }, [showReport, medications]);

  // Ilmoituslogiikka
  useEffect(() => {
    if (Notification.permission === 'granted') setNotificationsEnabled(true);
  }, []);

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("Lääkemuistio", { body: "Muistutukset käytössä!" });
      }
    });
  };

  useEffect(() => {
    if (!notificationsEnabled || medications.length === 0) return;
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
      medications.forEach(med => {
        if (med.isArchived) return;
        if (med.scheduleTimes) {
          Object.entries(med.scheduleTimes).forEach(([slotId, time]) => {
            if (time === currentTime) {
              const today = now.toDateString();
              const alreadyTaken = logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === today);
              if (!alreadyTaken) {
                new Notification(`Lääkkeen aika: ${med.name}`, {
                  body: `Aika ottaa ${TIME_SLOTS.find(s => s.id === slotId)?.label || ''} lääke.`,
                  icon: "https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png"
                });
              }
            }
          });
        }
      });
    };
    const interval = setInterval(checkReminders, 60000); 
    return () => clearInterval(interval);
  }, [medications, logs, notificationsEnabled]);


  // State UI
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  
  // Stock state
  const [newMedStock, setNewMedStock] = useState('');
  const [newMedTrackStock, setNewMedTrackStock] = useState(false);
  const [newMedLowLimit, setNewMedLowLimit] = useState('10'); 
  const [newMedIsCourse, setNewMedIsCourse] = useState(false); 

  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedSchedule, setSelectedSchedule] = useState([]); 
  const [scheduleTimes, setScheduleTimes] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddReason, setQuickAddReason] = useState('');
  
  const [takeWithReasonMed, setTakeWithReasonMed] = useState(null);
  const [takeReason, setTakeReason] = useState('');

  const [editingMed, setEditingMed] = useState(null);
  
  const [manualLogMed, setManualLogMed] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualReason, setManualReason] = useState('');

  const [editingLog, setEditingLog] = useState(null);
  const [editingLogDate, setEditingLogDate] = useState('');
  const [editingLogReason, setEditingLogReason] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, mode: null, medId: null, medName: '', logId: null, hasHistory: false });
  const [showArchived, setShowArchived] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  // Värit
  const colorList = ['blue', 'green', 'purple', 'orange', 'rose', 'cyan', 'amber', 'teal', 'indigo', 'lime', 'fuchsia', 'slate'];
  const colorMap = {
    'blue':   { bg: 'bg-blue-100',   border: 'border-blue-300',   dot: 'bg-blue-600',   text: 'text-blue-800',   btn: 'bg-blue-600 active:bg-blue-700' },
    'green':  { bg: 'bg-green-100',  border: 'border-green-300',  dot: 'bg-green-600',  text: 'text-green-800',  btn: 'bg-green-600 active:bg-green-700' },
    'purple': { bg: 'bg-purple-100', border: 'border-purple-300', dot: 'bg-purple-600', text: 'text-purple-800', btn: 'bg-purple-600 active:bg-purple-700' },
    'orange': { bg: 'bg-orange-100', border: 'border-orange-300', dot: 'bg-orange-500', text: 'text-orange-800', btn: 'bg-orange-500 active:bg-orange-600' },
    'rose':   { bg: 'bg-red-100',    border: 'border-red-300',    dot: 'bg-red-600',    text: 'text-red-800',    btn: 'bg-red-600 active:bg-red-700' },
    'cyan':   { bg: 'bg-cyan-100',   border: 'border-cyan-300',   dot: 'bg-cyan-600',   text: 'text-cyan-800',   btn: 'bg-cyan-600 active:bg-cyan-700' },
    'amber':  { bg: 'bg-amber-100',  border: 'border-amber-300',  dot: 'bg-amber-500',  text: 'text-amber-800',  btn: 'bg-amber-500 active:bg-amber-600' },
    'teal':   { bg: 'bg-teal-100',   border: 'border-teal-300',   dot: 'bg-teal-600',   text: 'text-teal-800',   btn: 'bg-teal-600 active:bg-teal-700' },
    'indigo': { bg: 'bg-indigo-100', border: 'border-indigo-300', dot: 'bg-indigo-600', text: 'text-indigo-800', btn: 'bg-indigo-600 active:bg-indigo-700' },
    'lime':   { bg: 'bg-lime-100',   border: 'border-lime-300',   dot: 'bg-lime-600',   text: 'text-lime-800',   btn: 'bg-lime-600 active:bg-lime-700' },
    'fuchsia':{ bg: 'bg-fuchsia-100',border: 'border-fuchsia-300',dot: 'bg-fuchsia-600',text: 'text-fuchsia-800',btn: 'bg-fuchsia-600 active:bg-fuchsia-700' },
    'slate':  { bg: 'bg-slate-200',  border: 'border-slate-300',  dot: 'bg-slate-600',  text: 'text-slate-800',  btn: 'bg-slate-600 active:bg-slate-700' },
  };
  
  const getColors = (key) => colorMap[key] || colorMap['blue'];
  const getSmartColor = () => {
    const activeMeds = medications.filter(m => !m.isArchived);
    const usedColors = new Set(activeMeds.map(m => m.colorKey));
    return colorList.find(c => !usedColors.has(c)) || colorList[medications.length % colorList.length];
  };

  // --- TOIMINNOT ---
  const handleLogout = () => { if(window.confirm("Kirjaudutaanko ulos?")) signOut(auth); };

  const toggleExpand = (id) => {
    setExpandedMedId(expandedMedId === id ? null : id);
  };

  const openAddModal = () => {
    setNewMedName(''); setNewMedDosage(''); setNewMedStock(''); setNewMedTrackStock(false);
    setNewMedLowLimit('10'); setNewMedIsCourse(false); // Oletukset
    setSelectedColor(getSmartColor()); setSelectedSchedule([]); setScheduleTimes({});
    setCurrentIngredients([]);
    setShowOnDashboard(true); // Oletuksena näkyy etusivulla
    setIsAdding(true);
  };

  // Ingredients handlers
  const addIngredient = () => {
    if(!ingredientName.trim()) return;
    setCurrentIngredients([...currentIngredients, {name: ingredientName.trim(), count: ingredientCount.trim() || '1'}]);
    setIngredientName('');
    setIngredientCount('');
  };
  
  const removeIngredient = (index) => {
    const newIng = [...currentIngredients];
    newIng.splice(index, 1);
    setCurrentIngredients(newIng);
  };

  const toggleScheduleSlot = (slotId, isEdit = false) => {
    if (isEdit) {
      const current = editingMed.schedule || [];
      const newSchedule = current.includes(slotId) ? current.filter(id => id !== slotId) : [...current, slotId];
      let newTimes = { ...(editingMed.scheduleTimes || {}) };
      if (!current.includes(slotId)) newTimes[slotId] = TIME_SLOTS.find(s => s.id === slotId).defaultTime;
      setEditingMed({...editingMed, schedule: newSchedule, scheduleTimes: newTimes});
    } else {
      const newSchedule = selectedSchedule.includes(slotId) ? selectedSchedule.filter(id => id !== slotId) : [...selectedSchedule, slotId];
      let newTimes = { ...scheduleTimes };
      if (!selectedSchedule.includes(slotId)) newTimes[slotId] = TIME_SLOTS.find(s => s.id === slotId).defaultTime;
      setSelectedSchedule(newSchedule); setScheduleTimes(newTimes);
    }
  };

  const handleTimeChange = (slotId, time, isEdit = false) => {
    if (isEdit) {
      setEditingMed({ ...editingMed, scheduleTimes: { ...editingMed.scheduleTimes, [slotId]: time } });
    } else {
      setScheduleTimes({ ...scheduleTimes, [slotId]: time });
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !user) return;
    try {
      const maxOrder = medications.reduce((max, m) => Math.max(max, m.order || 0), 0);
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'medications'), {
        name: newMedName.trim(), 
        dosage: newMedDosage.trim(), 
        stock: newMedTrackStock ? parseInt(newMedStock) || 0 : null,
        trackStock: newMedTrackStock,
        lowStockLimit: newMedTrackStock ? (parseInt(newMedLowLimit) || 10) : 10,
        isCourse: newMedIsCourse,
        colorKey: selectedColor, 
        schedule: selectedSchedule, 
        scheduleTimes: scheduleTimes,
        ingredients: currentIngredients, 
        showOnDashboard: showOnDashboard,
        createdAt: Date.now(), 
        order: maxOrder + 1, 
        isArchived: false
      });
      setNewMedName(''); setNewMedDosage(''); setIsAdding(false); setCurrentIngredients([]);
    } catch (error) { alert("Virhe lisäyksessä."); }
  };

  const handleUpdateMedication = async (e) => {
    e.preventDefault();
    if (!editingMed || !editingMed.name.trim() || !user) return;
    try {
      const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', editingMed.id);
      await updateDoc(medRef, { 
        name: editingMed.name.trim(), 
        dosage: editingMed.dosage ? editingMed.dosage.trim() : '', 
        stock: editingMed.trackStock ? (parseInt(editingMed.stock) || 0) : null,
        trackStock: editingMed.trackStock || false,
        lowStockLimit: editingMed.trackStock ? (parseInt(editingMed.lowStockLimit) || 10) : 10,
        isCourse: editingMed.isCourse || false,
        colorKey: editingMed.colorKey, 
        schedule: editingMed.schedule || [], 
        scheduleTimes: editingMed.scheduleTimes || {},
        ingredients: currentIngredients,
        showOnDashboard: editingMed.showOnDashboard !== undefined ? editingMed.showOnDashboard : true
      });
      setEditingMed(null);
    } catch (error) { alert("Virhe muokkauksessa."); }
  };

  const openEditMed = (med) => {
    setEditingMed(med);
    setCurrentIngredients(med.ingredients || []);
  };

  const moveMedication = async (index, direction) => {
    if (!user) return;
    const activeMeds = medications.filter(m => !m.isArchived && (m.showOnDashboard !== false));
    if (index + direction < 0 || index + direction >= activeMeds.length) return;
    const currentMed = activeMeds[index];
    const swapMed = activeMeds[index + direction];
    let order1 = currentMed.order ?? currentMed.createdAt;
    let order2 = swapMed.order ?? swapMed.createdAt;
    if (order1 === order2) order2 = order1 + 1;
    try {
      const medRef1 = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', currentMed.id);
      const medRef2 = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', swapMed.id);
      await updateDoc(medRef1, { order: order2 });
      await updateDoc(medRef2, { order: order1 });
    } catch (e) { console.error("Järjestäminen epäonnistui", e); }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddName.trim() || !user) return;
    
    // Yritetään löytää varastotuote nimellä
    const stockItem = medications.find(m => m.name.toLowerCase() === quickAddName.trim().toLowerCase() && m.trackStock);
    
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: stockItem ? stockItem.id : 'quick_dose', 
        medName: quickAddName.trim(), 
        medColor: stockItem ? stockItem.colorKey : 'orange', 
        slot: null, 
        timestamp: new Date().toISOString(),
        reason: quickAddReason.trim()
      });
      
      // Vähennä saldoa jos löytyi
      if (stockItem && stockItem.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', stockItem.id);
         await updateDoc(medRef, { stock: stockItem.stock - 1 });
      }

      setQuickAddName(''); setQuickAddReason(''); setIsQuickAdding(false);
    } catch(e) { alert("Virhe pikalisäyksessä"); }
  };

  const takeMedicine = async (med, slotId = null, reasonText = '') => {
    if (!user) return;
    try {
      // 1. Logi
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: med.id, 
        medName: med.name, 
        medColor: med.colorKey, 
        slot: slotId, 
        timestamp: new Date().toISOString(), 
        reason: reasonText.trim()
      });
      
      // 2. Vähennä varastoa itse lääkkeeltä (jos seurannassa)
      if (med.trackStock && med.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
         await updateDoc(medRef, { stock: med.stock - 1 });
      }

      // 3. Vähennä varastoa AINESOSILTA (linkitys nimen perusteella)
      if (med.ingredients && med.ingredients.length > 0) {
        for (const ing of med.ingredients) {
           // Etsi vastaava lääke nykyisestä tilasta
           const subMed = medications.find(m => m.name.toLowerCase() === ing.name.toLowerCase() && !m.isArchived);
           
           if (subMed && subMed.trackStock && subMed.stock !== null) {
              const amountToTake = parseInt(ing.count) || 1;
              const newStock = subMed.stock - amountToTake;
              
              const subMedRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', subMed.id);
              await updateDoc(subMedRef, { stock: newStock });
           }
        }
      }

    } catch (error) { console.error(error); }
  };

  const handleConfirmTakeWithReason = async (e) => {
    e.preventDefault();
    if(!takeWithReasonMed) return;
    await takeMedicine(takeWithReasonMed, null, takeReason);
    setTakeWithReasonMed(null);
    setTakeReason('');
  };

  const handleRefill = async (med) => {
    if (!user) return;
    const amount = prompt("Paljonko lisätään varastoon?", "30");
    if (amount && !isNaN(amount)) {
       const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
       await updateDoc(medRef, { stock: (med.stock || 0) + parseInt(amount) });
    }
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    if (!manualLogMed || !manualDate || !user) return;
    try {
      // 1. Logi
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: manualLogMed.id, 
        medName: manualLogMed.name, 
        medColor: manualLogMed.colorKey, 
        slot: null, 
        timestamp: new Date(manualDate).toISOString(),
        reason: manualReason.trim()
      });
      
      // 2. Vähennä varastoa itse lääkkeeltä
      if (manualLogMed.trackStock && manualLogMed.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', manualLogMed.id);
         await updateDoc(medRef, { stock: manualLogMed.stock - 1 });
      }

      // 3. Vähennä varastoa AINESOSILTA
      if (manualLogMed.ingredients && manualLogMed.ingredients.length > 0) {
        for (const ing of manualLogMed.ingredients) {
           const subMed = medications.find(m => m.name.toLowerCase() === ing.name.toLowerCase() && !m.isArchived);
           if (subMed && subMed.trackStock && subMed.stock !== null) {
              const amountToTake = parseInt(ing.count) || 1;
              const newStock = subMed.stock - amountToTake;
              const subMedRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', subMed.id);
              await updateDoc(subMedRef, { stock: newStock });
           }
        }
      }

      setManualLogMed(null); setManualDate(''); setManualReason('');
    } catch (error) { alert("Virhe lisäyksessä."); }
  };

  const toggleArchive = async (med) => {
    if(!user) return;
    try {
      const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
      await updateDoc(medRef, { isArchived: !med.isArchived });
    } catch (e) { alert("Virhe arkistoinnissa"); }
  };

  const requestDeleteMed = (med) => {
    const hasHistory = logs.some(l => l.medId === med.id);
    setDeleteDialog({ isOpen: true, mode: 'med', medId: med.id, medName: med.name, hasHistory: hasHistory });
  };

  const handleDeleteAll = async () => {
    if (!user || !deleteDialog.medId) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', deleteDialog.medId));
      const logsToDelete = logs.filter(l => l.medId === deleteDialog.medId);
      logsToDelete.forEach(log => deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', log.id)));
      if (showHistoryFor === deleteDialog.medId) setShowHistoryFor(null);
    } catch (e) { alert("Poisto epäonnistui"); }
    setDeleteDialog({ isOpen: false, mode: null, medId: null, medName: '', hasHistory: false });
  };

  const handleDeleteKeepHistory = async () => {
    if (!user || !deleteDialog.medId) return;
    try {
      const logsToUpdate = logs.filter(l => l.medId === deleteDialog.medId && !l.medName);
      const med = medications.find(m => m.id === deleteDialog.medId);
      if (med && logsToUpdate.length > 0) {
         logsToUpdate.forEach(log => {
           const logRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', log.id);
           updateDoc(logRef, { medName: med.name, medColor: med.colorKey });
         });
      }
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', deleteDialog.medId));
      if (showHistoryFor === deleteDialog.medId) setShowHistoryFor(null);
    } catch (e) { alert("Poisto epäonnistui"); }
    setDeleteDialog({ isOpen: false, mode: null, medId: null, medName: '', hasHistory: false });
  };

  const openLogEdit = (log) => {
    setEditingLog(log);
    const d = new Date(log.timestamp);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditingLogDate(d.toISOString().slice(0, 16));
    setEditingLogReason(log.reason || '');
  };

  const handleSaveLogEdit = async (e) => {
    e.preventDefault();
    if (!editingLog || !editingLogDate || !user) return;
    try {
      const logRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', editingLog.id);
      await updateDoc(logRef, { 
        timestamp: new Date(editingLogDate).toISOString(),
        reason: editingLogReason.trim()
      });
      setEditingLog(null);
    } catch (error) { alert("Virhe tallennuksessa."); }
  };

  const requestDeleteLog = () => {
     if(!editingLog) return;
     const logId = editingLog.id;
     setEditingLog(null);
     setDeleteDialog({ isOpen: true, mode: 'log', logId: logId, title: 'Poista merkintä?', message: 'Haluatko varmasti poistaa tämän merkinnän?' });
  };

  const handleDeleteSingleLog = async () => {
     if(!user || !deleteDialog.logId) return;
     try {
       await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', deleteDialog.logId));
     } catch(e) { alert("Poisto epäonnistui"); }
     setDeleteDialog({ isOpen: false, mode: null, medId: null, logId: null });
  };

  // UI Helpers
  const formatTime = (iso) => { try { return new Date(iso).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }); } catch(e) { return '--:--'; } };
  const getDayLabel = (iso) => {
    try { const d = new Date(iso); const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Tänään';
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      if (d.toDateString() === yest.toDateString()) return 'Eilen';
      return `${d.getDate()}.${d.getMonth()+1}.`; } catch(e) { return ''; }
  };
  
  const getLastTaken = (medId) => {
    const l = logs.filter(x => x.medId === medId);
    return l.length ? l.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0] : null;
  };

  const getHistoryDates = () => {
    const dates = [...new Set(logs.map(log => new Date(log.timestamp).toDateString()))];
    return dates.sort((a, b) => new Date(b) - new Date(a));
  };
  const getLogsForDate = (dateObj) => logs.filter(l => new Date(l.timestamp).toDateString() === dateObj.toDateString()).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  const getCurrentDateTimeLocal = () => {
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const isSlotTakenToday = (medId, slotId) => {
    const today = new Date().toDateString();
    return logs.some(l => l.medId === medId && l.slot === slotId && new Date(l.timestamp).toDateString() === today);
  };

  // Onko yleislääke (ei aikataulua) otettu tänään?
  const isGenericTakenToday = (medId) => {
    const today = new Date().toDateString();
    return logs.some(l => l.medId === medId && new Date(l.timestamp).toDateString() === today);
  };

  // Datan valmistelu
  // Nyt suodatetaan pois ne, joita ei haluta etusivulle
  const activeMeds = medications.filter(m => !m.isArchived && (m.showOnDashboard !== false));
  const archivedMeds = medications.filter(m => m.isArchived);
  
  // OSTOSLISTA LOGIIKKA (Näyttää kaikki varastolääkkeet, riippumatta onko etusivulla)
  const shoppingListMeds = medications.filter(m => 
    !m.isArchived &&
    m.trackStock && 
    !m.isCourse && 
    (m.stock !== null && m.stock <= (m.lowStockLimit || 10))
  );

  const getLogName = (log) => {
    const med = medications.find(m => m.id === log.medId);
    return med ? med.name : (log.medName || 'Poistettu lääke');
  };
  
  const getLogColorKey = (log) => {
    const med = medications.find(m => m.id === log.medId);
    return med ? med.colorKey : (log.medColor || 'blue');
  };

  // --- RAPORTIN LUONTI LOGIIKKA ---
  const generateReportText = () => {
    if (!reportStartDate || !reportEndDate) return "Valitse päivämäärät.";

    const start = new Date(reportStartDate); start.setHours(0,0,0,0);
    const end = new Date(reportEndDate); end.setHours(23,59,59,999);
    
    // Suodata logit aikavälin ja valinnan mukaan
    const filteredLogs = logs.filter(l => {
      const d = new Date(l.timestamp);
      const isSelected = reportSelectedMeds.has(l.medId) || l.medId === 'quick_dose';
      return d >= start && d <= end && isSelected;
    });
    
    const medStats = {};
    Array.from(reportSelectedMeds).forEach(medId => {
       const med = medications.find(m => m.id === medId);
       if(med) medStats[med.name] = { count: 0, logs: [], isScheduled: med.schedule && med.schedule.length > 0 };
    });

    filteredLogs.forEach(log => {
      const name = getLogName(log);
      if (!medStats[name]) medStats[name] = { count: 0, logs: [], isScheduled: false };
      medStats[name].count++;
      medStats[name].logs.push(log);
    });
    
    let text = `LÄÄKKEIDEN KÄYTTÖ\n`;
    text += `Aikaväli: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}\n\n`;
    text += `YHTEENVETO:\n`;
    Object.entries(medStats).sort((a,b) => b[1].count - a[1].count).forEach(([name, data]) => {
      text += `- ${name}: ${data.count} kpl\n`;
    });
    text += `\n-----------------------------\n`;
    text += `ERITTELY:\n\n`;

    Object.entries(medStats).forEach(([name, data]) => {
       if (data.count === 0) return;
       text += `--- ${name.toUpperCase()} (${data.count} kpl) ---\n`;
       if (data.isScheduled) {
          const days = {};
          data.logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(log => {
             const dStr = new Date(log.timestamp).toLocaleDateString('fi-FI', {weekday: 'short', day: 'numeric', month: 'numeric'});
             if (!days[dStr]) days[dStr] = [];
             const slotName = TIME_SLOTS.find(s => s.id === log.slot)?.label || 'Muu';
             days[dStr].push(slotName);
          });
          Object.entries(days).forEach(([day, slots]) => {
             text += `${day}: ${slots.join(', ')}\n`;
          });
       } else {
          data.logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(log => {
             const d = new Date(log.timestamp);
             const timeStr = d.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'});
             const reasonStr = log.reason ? ` - "${log.reason}"` : '';
             text += `${timeStr}${reasonStr}\n`;
          });
       }
       text += `\n`;
    });
    
    return text;
  };
  
  const copyReport = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => alert("Raportti kopioitu leikepöydälle!")).catch(e => alert("Kopiointi ei onnistunut"));
  };

  const toggleReportMedSelection = (medId) => {
    const newSet = new Set(reportSelectedMeds);
    if (newSet.has(medId)) newSet.delete(medId);
    else newSet.add(medId);
    setReportSelectedMeds(newSet);
  };

  // --- PRORESS BAR CALCULATION ---
  const scheduledMeds = activeMeds.filter(m => m.schedule && m.schedule.length > 0);
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  scheduledMeds.forEach(med => {
    med.schedule.forEach(slotId => {
      totalDosesToday++;
      if (isSlotTakenToday(med.id, slotId)) {
        takenDosesToday++;
      }
    });
  });

  const dailyProgress = totalDosesToday > 0 ? (takenDosesToday / totalDosesToday) * 100 : 0;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden select-none relative">
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="" className="w-3/4 max-w-lg opacity-[0.15] grayscale" />
      </div>

      <header className="flex-none bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 z-10 shadow-sm relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {activeTab === 'home' ? <Pill className="text-blue-600" size={20} /> : <BarChart2 className="text-blue-600" size={20} />}
              {activeTab === 'home' ? 'Lääkkeet' : 'Historia'}
            </h1>
          </div>
          
          {/* HEADER ICON GROUP - HAMBURGER MENU */}
          <div className="flex items-center gap-1">
            {activeTab === 'home' && (
              <>
                <button 
                  onClick={() => setShowShoppingList(true)}
                  className={`p-2 rounded-full transition-colors relative ${shoppingListMeds.length > 0 ? 'text-red-500 hover:text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Ostoslista"
                >
                  <ShoppingCart size={20} />
                  {shoppingListMeds.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
                <button 
                  onClick={requestNotificationPermission} 
                  className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                  title={notificationsEnabled ? "Ilmoitukset päällä" : "Ota ilmoitukset käyttöön"}
                >
                  {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>
                
                {/* MENU BUTTON */}
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Menu size={24} />
                  </button>

                  {/* MENU DROPDOWN */}
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-100 z-50 p-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => {setShowStockList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left">
                          <Box size={18} className="text-blue-500"/> Varastolista
                        </button>
                        <button onClick={() => {setShowDosetti(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left">
                          <LayoutList size={18} className="text-blue-500"/> Dosettijako
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => {setIsReordering(!isReordering); setIsMenuOpen(false);}} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-left ${isReordering ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                          <ArrowUpDown size={18} className={isReordering ? 'text-blue-600' : 'text-slate-400'}/> Järjestä
                        </button>
                        <button onClick={() => {setShowHelp(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left">
                          <HelpCircle size={18} className="text-slate-400"/> Ohjeet
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => {handleLogout(); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium text-left">
                          <LogOut size={18}/> Kirjaudu ulos
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* TABIT YLHÄÄLLÄ (SEGMENTED CONTROL) */}
        <div className="bg-slate-100 p-1 rounded-xl flex mb-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Pill size={16} /> Lääkkeet
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart2 size={16} /> Historia
          </button>
        </div>
        
        {/* PÄIVÄN EDISTYMISPALKKI */}
        {activeTab === 'home' && !isReordering && dailyProgress > 0 && (
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
              style={{width: `${dailyProgress}%`}}
            ></div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-20 z-10 relative">
        <div className="max-w-md mx-auto space-y-3">
          {loadingData ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2"><Loader2 className="animate-spin" /><span className="text-sm">Ladataan lääkkeitä...</span></div>
          ) : (
          <>
          {activeTab === 'home' && (
            <>
              {activeMeds.length === 0 && !isAdding && (
                <div className="text-center py-12 text-slate-400">
                  <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-sm"><Pill size={32} className="text-blue-200" /></div>
                  <p className="mb-4 text-sm">Ei lääkkeitä listalla.</p>
                  <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg text-sm active:scale-95 transition-transform">Lisää ensimmäinen</button>
                </div>
              )}
              {activeMeds.map((med, index) => {
                const lastLog = getLastTaken(med.id);
                const c = getColors(med.colorKey || 'blue');
                const hasSchedule = med.schedule && med.schedule.length > 0;
                const isExpanded = expandedMedId === med.id || isReordering; 
                
                // Onko kyseessä yhdistelmä / dosetti?
                const isCombo = med.ingredients && med.ingredients.length > 0;

                // Onko kaikki päivän annokset otettu?
                let isDoneForToday = false;
                if (hasSchedule) {
                  isDoneForToday = med.schedule.every(slotId => isSlotTakenToday(med.id, slotId));
                } else {
                  isDoneForToday = isGenericTakenToday(med.id);
                }

                // Normaalin lääkkeen hälytys (yhdistelmillä ei omaa saldoa)
                const isLowStock = !isCombo && med.trackStock && !med.isCourse && med.stock !== null && med.stock <= (med.lowStockLimit || 10);

                return (
                  <div key={med.id} className={`rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${c.bg} ${c.border} ${!isExpanded?'hover:shadow-md':''} relative group`}>
                    
                    {/* JÄRJESTYSKONTROLLIT */}
                    {isReordering && (
                      <div className="absolute right-0 top-0 bottom-0 w-14 flex flex-col justify-center gap-2 pr-2 bg-gradient-to-l from-white/80 via-white/50 to-transparent z-30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveMedication(index, -1); }}
                          disabled={index === 0}
                          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveMedication(index, 1); }}
                          disabled={index === activeMeds.length - 1}
                          className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"
                        >
                          <ArrowDown size={18} />
                        </button>
                      </div>
                    )}

                    {/* HEADER - KOMPAKTI NÄKYMÄ (AINA NÄKYVISSÄ) */}
                    <div 
                      onClick={() => !isReordering && toggleExpand(med.id)}
                      className={`p-4 flex justify-between items-center ${!isReordering ? 'cursor-pointer active:bg-black/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                         <div className="flex items-center gap-2">
                            {/* Eri ikoni jos dosetti */}
                            {isCombo && <Layers size={20} className="text-slate-600" />}
                            
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">
                              {med.name}
                            </h3>
                            {/* Status-ikoni suljetussa tilassa */}
                            {expandedMedId !== med.id && isDoneForToday && <CheckCircle size={18} className="text-green-600 shrink-0" />}
                            {expandedMedId !== med.id && isLowStock && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
                         </div>
                         
                         {/* Lisätiedot vain jos suljettu */}
                         {expandedMedId !== med.id && (
                           <div className="flex items-center gap-2 mt-1">
                             {isCombo ? (
                               // YHDISTELMÄN TIEDOT SULJETTUNA
                               <span className="text-xs font-bold text-slate-500 bg-white/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Dosetti</span>
                             ) : isLowStock ? (
                               <span className="text-xs text-red-600 font-bold truncate">{med.stock} kpl jäljellä!</span>
                             ) : med.trackStock && med.isCourse ? (
                               <span className="text-xs text-slate-500 font-bold truncate">Kuuri: {med.stock} kpl</span>
                             ) : med.dosage ? (
                               <span className="text-xs text-slate-600 font-medium truncate">{med.dosage}</span>
                             ) : (
                               <span className="text-xs text-slate-500 truncate">{lastLog ? `Viimeksi: ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span>
                             )}
                           </div>
                         )}
                      </div>
                      
                      {/* Nuoli */}
                      {!isReordering && (
                        <div className="text-slate-400">
                          {expandedMedId === med.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                      )}
                    </div>

                    {/* EXPANDED CONTENT - VAIN KUN AVATTU */}
                    {expandedMedId === med.id && !isReordering && (
                      <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                         <div className="border-t border-black/5 mb-3 pt-1"></div>
                         
                         {/* AINESOSAT / KOOSTUMUS NÄKYVIIN (Jos on dosetti) */}
                         {isCombo && (
                           <div className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg mb-3 border border-slate-100">
                             <div className="flex items-center gap-2 mb-2">
                               <Layers size={14} className="text-slate-400"/>
                               <span className="font-bold uppercase text-[10px] text-slate-500">Sisältö</span>
                             </div>
                             <div className="space-y-1">
                               {med.ingredients.map((ing, idx) => (
                                 <div key={idx} className="flex justify-between border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                                   <span className="font-medium">{ing.name}</span>
                                   <span className="text-slate-500">{ing.count} kpl</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {!isCombo && med.dosage && (
                           <div className="text-sm text-slate-700 mb-2 font-medium bg-white/50 p-2 rounded-lg inline-block mr-2">
                             {med.dosage}
                           </div>
                         )}

                         {!isCombo && med.trackStock && (
                           <div className={`text-sm mb-3 font-medium bg-white/50 p-2 rounded-lg inline-flex items-center gap-2 ${isLowStock ? 'text-red-600 border border-red-200' : 'text-slate-700'}`}>
                             <Package size={14} /> 
                             <span>{med.stock !== null ? med.stock : 0} kpl</span>
                           </div>
                         )}

                         <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium mb-4">
                           <Clock size={12} /><span>{lastLog ? `${getDayLabel(lastLog.timestamp)} klo ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span>
                         </div>

                         {/* Toiminnot rivissä */}
                         <div className="flex gap-2 mb-4 justify-end flex-wrap">
                            {!isCombo && med.trackStock && (
                              <button onClick={() => handleRefill(med)} className="p-2 bg-white/60 rounded-lg hover:text-green-600 hover:bg-white flex items-center gap-1" title="Täydennä varastoa">
                                <RefreshCw size={18}/>
                              </button>
                            )}
                            <button onClick={() => { setManualLogMed(med); setManualDate(getCurrentDateTimeLocal()); }} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Lisää manuaalisesti"><CalendarPlus size={18}/></button>
                            <button onClick={() => setShowHistoryFor(med.id)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Historia"><History size={18}/></button>
                            <button onClick={() => setEditingMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Muokkaa"><Pencil size={18}/></button>
                            <button onClick={() => toggleArchive(med)} className="p-2 bg-white/60 rounded-lg hover:text-orange-500 hover:bg-white" title="Arkistoi"><Archive size={18}/></button>
                            <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-red-500 hover:bg-white" title="Poista"><Trash2 size={18}/></button>
                         </div>

                         {/* OTA-painikkeet */}
                         {hasSchedule ? (
                            <div className="grid grid-cols-4 gap-2">
                              {TIME_SLOTS.filter(slot => med.schedule.includes(slot.id)).map(slot => {
                                const isTaken = isSlotTakenToday(med.id, slot.id);
                                const scheduleTime = med.scheduleTimes?.[slot.id] || slot.defaultTime;
                                return (
                                  <button 
                                    key={slot.id}
                                    onClick={() => takeMedicine(med, slot.id)}
                                    disabled={isTaken}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                      isTaken 
                                        ? 'bg-green-100 border-green-200 text-green-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 active:scale-95'
                                    }`}
                                  >
                                    {isTaken ? <Check size={20} strokeWidth={3} /> : <slot.icon size={20} />}
                                    <span className="text-[10px] font-bold mt-1 uppercase">{slot.label}</span>
                                    {!isTaken && <span className="text-[9px] text-slate-400">{scheduleTime}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            // TÄMÄ ON SE UUSI LOGIIKKA: Klikkaus avaa syy-ikkunan, ei ota suoraan.
                            <button onClick={() => { setTakeWithReasonMed(med); setTakeReason(''); }} className={`w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform ${c.btn}`}>
                              <CheckCircle size={20} /> OTA NYT
                            </button>
                          )
                         }
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ARKISTOIDUT */}
              {archivedMeds.length > 0 && !isReordering && (
                <div className="mt-8">
                  <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 text-slate-400 text-sm font-medium w-full px-2"
                  >
                    {showArchived ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    Arkistoidut lääkkeet ({archivedMeds.length})
                  </button>
                  
                  {showArchived && (
                    <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2">
                      {archivedMeds.map(med => (
                        <div key={med.id} className="bg-slate-100 rounded-xl p-3 flex justify-between items-center opacity-70">
                          <span className="font-medium text-slate-600 ml-2">{med.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => toggleArchive(med)} className="p-2 bg-white rounded-lg text-slate-500 hover:text-blue-600" title="Palauta käyttöön"><ArchiveRestore size={18}/></button>
                            <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white rounded-lg text-slate-500 hover:text-red-600" title="Poista"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* RAPORTTINAPPI */}
              <button 
                onClick={() => setShowReport(true)}
                className="w-full bg-white border border-blue-200 text-blue-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
              >
                <FileText size={20}/> Raportti (Valitse & Tulosta)
              </button>

              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Lääkkeet</h3>
                <div className="flex flex-wrap gap-2">
                  {medications.map(med => {
                    const c = getColors(med.colorKey || 'blue');
                    return (
                      <div key={med.id} className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${c.bg} ${c.border} ${med.isArchived ? 'opacity-50' : ''}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                        <span className="text-xs font-bold text-slate-700">{med.name} {med.isArchived && '(arkisto)'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Calendar className="text-blue-500" size={18}/> Koko historia</h2>
                <div className="space-y-3">
                  {getHistoryDates().map((dayStr, i) => {
                    const logsNow = getLogsForDate(new Date(dayStr));
                    const dayDate = new Date(dayStr);
                    const isToday = dayDate.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={i} className={`border-b border-slate-50 pb-2 last:border-0 ${isToday ? 'bg-blue-50/40 -mx-2 px-2 rounded-lg py-2 border-none' : ''}`}>
                        <div className={`text-[10px] font-bold uppercase mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{getDayLabel(dayDate.toISOString())}</div>
                        <div className="flex flex-wrap gap-2">
                          {logsNow.map(log => {
                            const cKey = getLogColorKey(log);
                            const c = getColors(cKey);
                            return (
                              <button key={log.id} onClick={() => openLogEdit(log)} className={`flex flex-col items-start gap-0.5 px-2.5 py-1.5 rounded-xl border shadow-sm active:scale-95 ${c.bg} ${c.border} max-w-full text-left`}>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                  <span className="text-xs font-bold text-slate-700">{getLogName(log)} {formatTime(log.timestamp)}</span>
                                </div>
                                {log.reason && (
                                  <span className="text-[10px] text-slate-500 italic ml-3 truncate max-w-[150px]">"{log.reason}"</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {logs.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Ei vielä historiaa.</div>}
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center z-20 pb-safe">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
          <Pill size={22} strokeWidth={activeTab==='home'?2.5:2} /> <span className="text-[10px] font-bold">Lääkkeet</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'stats' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
          <BarChart2 size={22} strokeWidth={activeTab==='stats'?2.5:2} /> <span className="text-[10px] font-bold">Historia</span>
        </button>
      </nav>

      {!isAdding && activeTab === 'home' && !showHistoryFor && !deleteDialog.isOpen && !editingMed && !manualLogMed && !takeWithReasonMed && !editingLog && !isQuickAdding && !isReordering && !showStockList && (
        <>
          {/* PÄIVITYSNAPPI (VASEN ALAKULMA) */}
          <button
            onClick={() => window.location.reload()}
            className="absolute bottom-20 left-5 z-30 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:rotate-180 transition-all duration-500 border border-slate-200"
            title="Päivitä sovellus"
          >
            <RotateCcw size={24} />
          </button>

          {/* LISÄYSNAPIT (OIKEA ALAKULMA) */}
          <div className="absolute bottom-20 right-5 z-30 flex gap-3 items-end">
            <button onClick={() => setIsQuickAdding(true)} className="bg-orange-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform" title="Pikalisäys"><Zap size={24}/></button>
            <button onClick={openAddModal} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"><Plus size={32}/></button>
          </div>
        </>
      )}

      {/* --- MODALIT --- */}
      
      {/* VARASTOLISTA MODAL */}
      {showStockList && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><Box/> Varastolista</h2>
                <button onClick={() => setShowStockList(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
             </div>
             
             <div className="space-y-3">
               {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(med => (
                 <div key={med.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-800">{med.name}</div>
                      <div className={`text-xs font-bold ${med.stock <= med.lowStockLimit ? 'text-red-500' : 'text-slate-500'}`}>
                        Saldo: {med.stock} kpl (Raja: {med.lowStockLimit})
                      </div>
                    </div>
                    <button onClick={() => openEditMed(med)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600"><Pencil size={16}/></button>
                 </div>
               ))}
               {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).length === 0 && (
                 <p className="text-center text-slate-400 text-sm py-4">Ei varastoseurannassa olevia lääkkeitä.</p>
               )}
             </div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* DOSETTI MODAL */}
      {showDosetti && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-600"><LayoutList/> Dosettijako</h2>
                <button onClick={() => setShowDosetti(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
             </div>
             
             <div className="space-y-6">
               {TIME_SLOTS.map(slot => {
                 const medsForSlot = medications.filter(m => !m.isArchived && m.schedule && m.schedule.includes(slot.id));
                 
                 return (
                   <div key={slot.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase text-sm border-b border-slate-200 pb-1">
                       <slot.icon size={16} className="text-blue-500"/> {slot.label}
                     </h3>
                     
                     {medsForSlot.length === 0 ? (
                       <p className="text-xs text-slate-400 italic">Ei lääkkeitä.</p>
                     ) : (
                       <ul className="space-y-2">
                         {medsForSlot.map(med => {
                           if (med.ingredients && med.ingredients.length > 0) {
                             return med.ingredients.map((ing, idx) => (
                               <li key={`${med.id}-${idx}`} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                 <span className="font-medium text-sm text-slate-700">{ing.name}</span>
                                 <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{ing.count}</span>
                               </li>
                             ));
                           } else {
                             return (
                               <li key={med.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                 <span className="font-medium text-sm text-slate-700">{med.name}</span>
                                 <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{med.dosage || '1 kpl'}</span>
                               </li>
                             );
                           }
                         })}
                       </ul>
                     )}
                   </div>
                 );
               })}
             </div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* RAPORTTI MODAL */}
      {showReport && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
             <div className="flex justify-between items-center mb-4 flex-none">
                <h2 className="text-lg font-bold">Luo raportti</h2>
                <button onClick={() => setShowReport(false)} className="p-1 bg-slate-100 rounded-full"><X size={18}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alkaen</label>
                      <input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Päättyen</label>
                      <input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase">Valitse lääkkeet</label>
                       <button onClick={() => {
                         const allIds = medications.filter(m => !m.isArchived).map(m => m.id);
                         setReportSelectedMeds(reportSelectedMeds.size === allIds.length ? new Set() : new Set(allIds));
                       }} className="text-xs text-blue-600 font-bold">Valitse/Poista kaikki</button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50">
                      {medications.filter(m => !m.isArchived).map(med => (
                        <label key={med.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded"
                            checked={reportSelectedMeds.has(med.id)}
                            onChange={() => toggleReportMedSelection(med.id)}
                          />
                          <span className="text-sm font-medium text-slate-700 truncate">{med.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex-none pt-4 mt-2 border-t">
               <pre className="bg-slate-50 p-3 rounded-xl text-[10px] font-mono overflow-auto h-32 whitespace-pre-wrap mb-3 border">
                 {generateReportText()}
               </pre>
               <button onClick={copyReport} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95">
                 <Clipboard size={18} /> Kopioi leikepöydälle
               </button>
             </div>
           </div>
        </div>
      )}

      {/* OSTOSLISTA MODAL */}
      {showShoppingList && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2 text-red-600"><ShoppingCart/> Ostoslista</h2>
                <button onClick={() => setShowShoppingList(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
             </div>
             {shoppingListMeds.length === 0 ? (
               <div className="text-center text-slate-400 py-8">Kaikki lääkkeet hyvässä tilanteessa!</div>
             ) : (
               <div className="space-y-3">
                 {shoppingListMeds.map(med => (
                   <div key={med.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div>
                        <div className="font-bold text-slate-800">{med.name}</div>
                        <div className="text-xs text-red-600 font-bold">Jäljellä: {med.stock} kpl (Raja: {med.lowStockLimit||10})</div>
                      </div>
                      <Package className="text-red-300" size={24}/>
                   </div>
                 ))}
               </div>
             )}
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* OHJEET */}
      {showHelp && <HelpView onClose={() => setShowHelp(false)} />}

      {/* PIKALISÄYS */}
      {isQuickAdding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="text-orange-500"/> Kirjaa kertaluontoinen</h2>
            <form onSubmit={handleQuickAdd}>
              <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">
                {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (
                  <button 
                    key={m.id} 
                    type="button" 
                    onClick={() => setQuickAddName(m.name)} 
                    className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 active:bg-blue-100 active:border-blue-300 active:text-blue-700"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-orange-500" placeholder="Mitä otit? (esim. Burana)" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-sm mb-4 outline-none border focus:border-orange-500" placeholder="Syy (valinnainen, esim. Päänsärky)" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsQuickAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" disabled={!quickAddName.trim()} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">Kirjaa</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* OTA SYYLLÄ (UUSI) */}
      {takeWithReasonMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-1">
               <h2 className="text-lg font-bold">Ota lääke</h2>
               <button onClick={() => setTakeWithReasonMed(null)} className="p-1 bg-slate-100 rounded-full"><X size={16}/></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{takeWithReasonMed.name}</p>
            <form onSubmit={handleConfirmTakeWithReason}>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-4 outline-none border focus:border-blue-500" placeholder="Syy (valinnainen, esim. Kipu)" value={takeReason} onChange={e => setTakeReason(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setTakeWithReasonMed(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg">Kirjaa</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* 1. LISÄÄ LÄÄKE */}
      {isAdding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Lisää lääke</h2>
            <form onSubmit={handleAddMedication}>
              {/* VÄRIVALINTA */}
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valitse väri</label>
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {colorList.map(c => {
                  const colors = getColors(c);
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                    >
                      <div className={`w-full h-full rounded-full ${colors.dot} shadow-sm`} />
                    </button>
                  );
                })}
              </div>

              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" placeholder="Lääkkeen nimi" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-base mb-6 outline-none border focus:border-blue-500" placeholder="Annostus / Lisätiedot (valinnainen)" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
              
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input type="checkbox" checked={showOnDashboard} onChange={(e) => setShowOnDashboard(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Näytä etusivulla</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Ota pois, jos tämä on vain varastotuote jota käytetään osana yhdistelmää.</p>
              </div>

              {/* KOOSTUMUS / DOSETTI */}
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Koostumus / Dosetti</label>
                 <p className="text-[10px] text-slate-400 mb-3">Lisää tähän jos lääke sisältää useamman pillerin. Valitse varastosta.</p>
                 
                 <div className="flex gap-2 mb-2">
                   <select className="flex-1 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" value={ingredientName} onChange={e => setIngredientName(e.target.value)}>
                     <option value="">Valitse lääke varastosta...</option>
                     {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (
                       <option key={m.id} value={m.name}>{m.name}</option>
                     ))}
                   </select>
                   <input className="w-20 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)} />
                   <button type="button" onClick={addIngredient} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={18}/></button>
                 </div>

                 <div className="space-y-2">
                   {currentIngredients.map((ing, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-sm">
                       <span>{ing.name} <span className="text-slate-400 font-normal">({ing.count})</span></span>
                       <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              </div>

              {/* VARASTOSEURANTA */}
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={newMedTrackStock} onChange={(e) => setNewMedTrackStock(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Seuraa lääkevarastoa</span>
                </label>
                {newMedTrackStock && (
                  <div className="animate-in slide-in-from-top-2 space-y-3 border-t border-slate-200 pt-3 mt-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varastossa (kpl)</label>
                        <input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Esim. 100" value={newMedStock} onChange={e => setNewMedStock(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hälytysraja (kpl)</label>
                        <input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Oletus 10" value={newMedLowLimit} onChange={e => setNewMedLowLimit(e.target.value)} />
                        <p className="text-[10px] text-slate-400 mt-1">Lääke menee punaiseksi kun alle rajan.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input type="checkbox" checked={newMedIsCourse} onChange={(e) => setNewMedIsCourse(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <div>
                          <span className="text-sm font-bold text-slate-700 block">Tämä on kuuri</span>
                          <span className="text-[10px] text-slate-500 block">Ei hälytä loppumisesta, vain vähentää saldoa.</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* AIKATAULU */}
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Otettava (valinnainen)</label>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {TIME_SLOTS.map(slot => {
                  const isSelected = selectedSchedule.includes(slot.id);
                  return (
                    <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => toggleScheduleSlot(slot.id)}
                        className={`flex-1 flex items-center gap-3`}
                      >
                        <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}><slot.icon size={20}/></div>
                        <span className={`text-sm font-bold uppercase ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>{slot.label}</span>
                      </button>
                      
                      {isSelected && (
                        <input 
                          type="time" 
                          className="bg-white border border-blue-200 text-blue-800 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                          value={scheduleTimes[slot.id] || slot.defaultTime}
                          onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" disabled={!newMedName.trim()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Tallenna</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* 2. MUOKKAA LÄÄKETTÄ */}
      {editingMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Muokkaa</h2>
            <form onSubmit={handleUpdateMedication}>
              {/* VÄRIVALINTA MUOKKAUS */}
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Väri</label>
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {colorList.map(c => {
                  const colors = getColors(c);
                  const isSelected = editingMed.colorKey === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingMed({...editingMed, colorKey: c})}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                    >
                      <div className={`w-full h-full rounded-full ${colors.dot} shadow-sm`} />
                    </button>
                  );
                })}
              </div>

              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" value={editingMed.name} onChange={e => setEditingMed({...editingMed, name: e.target.value})} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-base mb-6 outline-none border focus:border-blue-500" placeholder="Annostus / Lisätiedot" value={editingMed.dosage || ''} onChange={e => setEditingMed({...editingMed, dosage: e.target.value})} />
              
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input type="checkbox" checked={editingMed.showOnDashboard !== false} onChange={(e) => setEditingMed({...editingMed, showOnDashboard: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Näytä etusivulla</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Ota pois, jos tämä on vain varastotuote jota käytetään osana yhdistelmää.</p>
              </div>

              {/* KOOSTUMUS / DOSETTI (UUSI) */}
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Koostumus / Dosetti</label>
                 <p className="text-[10px] text-slate-400 mb-3">Lisää tähän jos lääke sisältää useamman pillerin. Valitse varastosta.</p>
                 
                 <div className="flex gap-2 mb-2">
                   <select className="flex-1 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" value={ingredientName} onChange={e => setIngredientName(e.target.value)}>
                     <option value="">Valitse lääke varastosta...</option>
                     {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (
                       <option key={m.id} value={m.name}>{m.name}</option>
                     ))}
                   </select>
                   <input className="w-20 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)} />
                   <button type="button" onClick={addIngredient} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={18}/></button>
                 </div>

                 <div className="space-y-2">
                   {currentIngredients.map((ing, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-sm">
                       <span>{ing.name} <span className="text-slate-400 font-normal">({ing.count})</span></span>
                       <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              </div>

              {/* VARASTOSEURANTA MUOKKAUS */}
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" checked={editingMed.trackStock || false} onChange={(e) => setEditingMed({...editingMed, trackStock: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Seuraa lääkevarastoa</span>
                </label>
                {editingMed.trackStock && (
                  <div className="animate-in slide-in-from-top-2 space-y-3 border-t border-slate-200 pt-3 mt-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varastossa (kpl)</label>
                        <input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Esim. 100" value={editingMed.stock !== null && editingMed.stock !== undefined ? editingMed.stock : ''} onChange={e => setEditingMed({...editingMed, stock: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hälytysraja (kpl)</label>
                        <input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Oletus 10" value={editingMed.lowStockLimit || 10} onChange={e => setEditingMed({...editingMed, lowStockLimit: e.target.value})} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input type="checkbox" checked={editingMed.isCourse || false} onChange={(e) => setEditingMed({...editingMed, isCourse: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <div>
                          <span className="text-sm font-bold text-slate-700 block">Tämä on kuuri</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* AIKATAULU MUOKKAUS */}
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Otettava</label>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {TIME_SLOTS.map(slot => {
                  const currentSchedule = editingMed.schedule || [];
                  const isSelected = currentSchedule.includes(slot.id);
                  const currentTime = editingMed.scheduleTimes?.[slot.id] || slot.defaultTime;

                  return (
                    <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => toggleScheduleSlot(slot.id, true)}
                        className={`flex-1 flex items-center gap-3`}
                      >
                        <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}><slot.icon size={20}/></div>
                        <span className={`text-sm font-bold uppercase ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>{slot.label}</span>
                      </button>
                      
                      {isSelected && (
                        <input 
                          type="time" 
                          className="bg-white border border-blue-200 text-blue-800 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                          value={currentTime}
                          onChange={(e) => handleTimeChange(slot.id, e.target.value, true)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingMed(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" disabled={!editingMed.name.trim()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Tallenna</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* 3. MANUAALINEN LISÄYS */}
      {manualLogMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-lg font-bold mb-1">Unohditko merkitä?</h2>
            <p className="text-sm text-slate-500 mb-4">{manualLogMed.name}</p>
            <form onSubmit={handleManualLog}>
              <input type="datetime-local" className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-sm mb-4 outline-none border focus:border-blue-500" placeholder="Syy (valinnainen)" value={manualReason} onChange={e => setManualReason(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => {setManualLogMed(null); setManualReason('');}} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" disabled={!manualDate} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Tallenna</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* 4. MUOKKAA MERKINTÄÄ (HISTORIA) */}
      {editingLog && (
        <div className="absolute inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-lg font-bold mb-1">Muokkaa merkintää</h2>
            <p className="text-sm text-slate-500 mb-4">
              {getLogName(editingLog)}
            </p>
            <form onSubmit={handleSaveLogEdit}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Aika ja päivä</label>
              <input type="datetime-local" className="w-full bg-slate-50 p-3 rounded-xl text-base mb-4 outline-none border focus:border-blue-500" value={editingLogDate} onChange={e => setEditingLogDate(e.target.value)} />
              
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Syy</label>
              <input className="w-full bg-slate-50 p-3 rounded-xl text-sm mb-6 outline-none border focus:border-blue-500" placeholder="Esim. Päänsärky" value={editingLogReason} onChange={e => setEditingLogReason(e.target.value)} />
              
              <div className="flex gap-3 mb-3">
                <button type="button" onClick={() => setEditingLog(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md">Tallenna</button>
              </div>
              <button type="button" onClick={requestDeleteLog} className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={16}/> Poista merkintä</button>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* 5. POISTOVARMISTUS */}
      {deleteDialog.isOpen && (
        <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-2 font-bold text-lg"><AlertTriangle /> 
              {deleteDialog.mode === 'log' ? deleteDialog.title : `Poista ${deleteDialog.medName}?`}
            </div>
            
            {deleteDialog.mode === 'log' && (
              <>
                <p className="text-slate-600 mb-6 text-sm">{deleteDialog.message}</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteDialog({isOpen:false})} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 text-sm">Peruuta</button>
                  <button onClick={handleDeleteSingleLog} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm">Poista</button>
                </div>
              </>
            )}

            {deleteDialog.mode === 'med' && (
              <>
                {deleteDialog.hasHistory ? (
                  <>
                    <p className="text-slate-600 mb-6 text-sm">Tällä lääkkeellä on merkintöjä historiassa. Miten haluat toimia?</p>
                    <div className="space-y-2">
                      <button onClick={handleDeleteKeepHistory} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">Säilytä historia, poista lääke</button>
                      <button onClick={handleDeleteAll} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm">Poista kaikki (lääke + historia)</button>
                      <button onClick={() => setDeleteDialog({isOpen:false})} className="w-full py-3 text-slate-400 font-medium text-sm">Peruuta</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-600 mb-6 text-sm">Haluatko varmasti poistaa lääkkeen?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setDeleteDialog({isOpen:false})} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 text-sm">Peruuta</button>
                      <button onClick={handleDeleteAll} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm">Poista</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 6. HISTORIA (LÄÄKEKOHTAINEN) */}
      {showHistoryFor && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white w-full h-[85%] rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{medications.find(m => m.id === showHistoryFor)?.name}</h2>
              <button onClick={() => setShowHistoryFor(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {logs.filter(l => l.medId === showHistoryFor).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).map(log => (
                <div key={log.id} onClick={() => openLogEdit(log)} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 active:bg-slate-100 cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-700 text-sm">{getDayLabel(log.timestamp)}</div>
                    <div className="text-xs text-slate-400">klo {formatTime(log.timestamp)}</div>
                    {log.reason && <div className="text-xs text-blue-600 italic mt-1">"{log.reason}"</div>}
                  </div>
                  <div className="p-2 text-slate-300"><Pencil size={16}/></div>
                </div>
              ))}
              {!logs.some(l => l.medId === showHistoryFor) && <div className="text-center text-slate-400 mt-10 text-sm">Ei merkintöjä.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- RENDERÖINTI ---
const root = createRoot(document.getElementById('root'));
root.render(<MedicineTracker />);
