import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Pill, Clock, Trash2, CheckCircle, History, X, BarChart2, Calendar, AlertTriangle, Pencil, CalendarPlus, LogOut, User, Lock, Loader2, Archive, ArchiveRestore, ChevronDown, ChevronUp, Sun, Moon, Sunrise, Sunset, Check, Zap, Bell, BellOff, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Package, RefreshCw, ShoppingCart, FileText, Clipboard, MessageSquare, ListChecks, RotateCcw, Share, MoreVertical, PlusSquare, Filter, Layers, LayoutList, Link, Box, Component, Menu, Search, Info, List, CalendarDays, Settings } from 'lucide-react';

// TUODAAN OHJEET ERILLISESTÄ TIEDOSTOSTA
// Varmista että sinulla on ohjeet.js tiedosto samassa kansiossa!
import { ohjeData } from './ohjeet.js';

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

const WEEKDAYS = [
  { id: 1, label: 'Ma' },
  { id: 2, label: 'Ti' },
  { id: 3, label: 'Ke' },
  { id: 4, label: 'To' },
  { id: 5, label: 'Pe' },
  { id: 6, label: 'La' },
  { id: 0, label: 'Su' }
];

const getIconComponent = (iconName) => {
  const icons = { Info, PlusSquare, Plus, CheckCircle, Zap, Package, BarChart2, Bell, List, Layers };
  const Icon = icons[iconName] || HelpCircle;
  return <Icon size={22} className="text-blue-600" />;
};

// --- OHJESIVU KOMPONENTTI ---
const HelpView = ({ onClose }) => {
  // Fallback jos tiedosto puuttuu
  if (!ohjeData) return (
    <div className="fixed inset-0 z-[60] bg-white p-5 flex flex-col justify-center items-center">
      <p className="text-red-500 font-bold mb-4">Virhe: ohjeet.js tiedostoa ei löydy.</p>
      <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Sulje</button>
    </div>
  );

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

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20">
        {ohjeData.map((section) => (
          <section key={section.id} className={`${section.id === 'intro' ? 'bg-blue-50 border-blue-100' : 'bg-white shadow-sm border-slate-100'} p-5 rounded-2xl border`}>
            <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${section.id === 'intro' ? 'text-blue-800' : 'text-slate-800'}`}>
              {section.icon && getIconComponent(section.icon)} 
              {section.title}
            </h3>
            <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: section.content }} />
          </section>
        ))}
        
        <div className="text-center text-xs text-slate-400 pt-6 pb-2">
          Lääkemuistio v4.5 - {new Date().getFullYear()}
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
  const [showAllMedsList, setShowAllMedsList] = useState(false); 
  const [showAlertsList, setShowAlertsList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Raportin tila
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedMeds, setReportSelectedMeds] = useState(new Set());

  // HAKU TILA
  const [historySearch, setHistorySearch] = useState('');

  // Ainesosien tila lisäys/muokkaus ikkunassa
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCount, setIngredientCount] = useState('');
  const [currentIngredients, setCurrentIngredients] = useState([]); 

  // LISÄYS TILA
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState('single'); // 'single' tai 'dosett'
  
  // UI Kentät (Lisäys ja Muokkaus)
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedStock, setNewMedStock] = useState('');
  const [newMedTrackStock, setNewMedTrackStock] = useState(false);
  const [newMedLowLimit, setNewMedLowLimit] = useState('10'); 
  const [newMedIsCourse, setNewMedIsCourse] = useState(false); 
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedSchedule, setSelectedSchedule] = useState([]); 
  const [scheduleTimes, setScheduleTimes] = useState({});
  
  // Jaksotus
  const [frequencyMode, setFrequencyMode] = useState('weekdays'); // 'every_day', 'every_other', 'weekdays'
  const [selectedWeekdays, setSelectedWeekdays] = useState([0,1,2,3,4,5,6]); 
  const [intervalStartDate, setIntervalStartDate] = useState(''); 

  // PIKALISÄYS TILA
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddReason, setQuickAddReason] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  
  const [takeWithReasonMed, setTakeWithReasonMed] = useState(null);
  const [takeReason, setTakeReason] = useState('');

  const [editingMed, setEditingMed] = useState(null);
  const [manualLogMed, setManualLogMed] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualReason, setManualReason] = useState('');

  const [editingLog, setEditingLog] = useState(null);
  const [editingLogDate, setEditingLogDate] = useState('');
  const [editingLogReason, setEditingLogReason] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, mode: null, medId: null, medName: '', logId: null, hasHistory: false, message: '' });
  const [showArchived, setShowArchived] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  // --- FIREBASE LISTENERS ---
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

  // Ilmoituslogiikka - ladataan tila
  useEffect(() => {
    if (Notification.permission === 'granted') setNotificationsEnabled(true);
  }, []);

  // --- LOGIIKKA ---

  // Tarkista onko lääke "myöhässä" (visuaalinen cue)
  const getMedStatusColor = (med) => {
    if (!med.scheduleTimes) return null;
    const now = new Date();
    const currentTime = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    const currentHour = now.getHours();

    // Tarkista onko tänään ottopäivä
    let isToday = false;
    if (med.interval === 2 && med.intervalStartDate) {
       const start = new Date(med.intervalStartDate);
       const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)); 
       if (diff % 2 === 0) isToday = true;
    } else {
       const day = now.getDay();
       const days = med.weekdays || [0,1,2,3,4,5,6];
       if (days.includes(day)) isToday = true;
    }
    
    if (!isToday) return null;

    let status = 'normal'; // normal, late, soon

    Object.entries(med.scheduleTimes).forEach(([slotId, time]) => {
      const taken = logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === now.toDateString());
      if (!taken) {
         if (time < currentTime) status = 'late';
         else {
            const medHour = parseInt(time.split(':')[0]);
            if (medHour === currentHour || medHour === currentHour + 1) {
                if (status !== 'late') status = 'soon';
            }
         }
      }
    });

    if (status === 'late') return 'border-red-400 bg-red-50';
    if (status === 'soon') return 'border-yellow-400 bg-yellow-50';
    return null;
  };

  const toggleNotificationForMed = async (med) => {
    const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
    await updateDoc(medRef, { reminderEnabled: !(med.reminderEnabled !== false) });
  };

  const toggleNotifications = () => {
    if (!("Notification" in window)) return alert("Selaimesi ei tue ilmoituksia.");
    
    if (Notification.permission === 'denied') {
      return alert("Olet estänyt ilmoitukset selaimen asetuksista. Käy sallimassa ne sieltä.");
    }

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      alert("Ilmoitukset mykistetty tässä istunnossa.");
    } else {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        alert("Ilmoitukset käytössä!");
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setNotificationsEnabled(true);
            new Notification("Lääkemuistio", { body: "Ilmoitukset käytössä!" });
          } else {
            alert("Ilmoituslupaa ei myönnetty.");
          }
        });
      }
    }
  };

  // Hälytyslooppi
  useEffect(() => {
    if (!notificationsEnabled || medications.length === 0) return;
    
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
      const currentDay = now.getDay();

      medications.forEach(med => {
        if (med.isArchived || med.reminderEnabled === false) return; 

        // Onko tänään ottopäivä?
        let isToday = false;
        if (med.interval === 2 && med.intervalStartDate) {
           const start = new Date(med.intervalStartDate);
           const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
           if (diff % 2 === 0) isToday = true;
        } else {
           const days = med.weekdays || [0,1,2,3,4,5,6];
           if (days.includes(currentDay)) isToday = true;
        }

        if (isToday && med.scheduleTimes) {
          Object.entries(med.scheduleTimes).forEach(([slotId, time]) => {
            if (time === currentTime) {
              const today = now.toDateString();
              const alreadyTaken = logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === today);
              
              if (!alreadyTaken) {
                new Notification(`Ota lääke: ${med.name}`, {
                  body: `Aika ottaa ${TIME_SLOTS.find(s => s.id === slotId)?.label || ''} lääke.`,
                  icon: "https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png"
                });
              }
            }
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Tarkista minuutin välein
    return () => clearInterval(interval);
  }, [medications, logs, notificationsEnabled]);

  // Lomakekäsittelijät
  const openAddModal = () => {
    setAddMode('single');
    setNewMedName(''); setNewMedDosage(''); setNewMedStock(''); setNewMedTrackStock(false);
    setNewMedLowLimit('10'); setNewMedIsCourse(false);
    setSelectedColor(getSmartColor()); setSelectedSchedule([]); setScheduleTimes({});
    setFrequencyMode('weekdays'); setSelectedWeekdays([0,1,2,3,4,5,6]); setIntervalStartDate(new Date().toISOString().split('T')[0]);
    setCurrentIngredients([]); setShowOnDashboard(true);
    setIsAdding(true);
  };

  const openEditMed = (med) => {
    setEditingMed(med);
    // Tunnista moodi: jos ainesosia -> dosetti, muuten single
    const mode = (med.ingredients && med.ingredients.length > 0) ? 'dosett' : 'single';
    setAddMode(mode);
    setCurrentIngredients(med.ingredients || []);
    
    // Tunnista jaksotus
    if (med.interval === 2) {
      setFrequencyMode('every_other');
      setIntervalStartDate(med.intervalStartDate || new Date().toISOString().split('T')[0]);
    } else if (med.weekdays && med.weekdays.length === 7) {
      setFrequencyMode('every_day');
    } else {
      setFrequencyMode('weekdays');
      setSelectedWeekdays(med.weekdays || [0,1,2,3,4,5,6]);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !user) return;
    
    if (addMode === 'dosett' && currentIngredients.length === 0) {
      alert("Dosetissa täytyy olla vähintään yksi lääke!");
      return;
    }

    try {
      const maxOrder = medications.reduce((max, m) => Math.max(max, m.order || 0), 0);
      let weekdays = [0,1,2,3,4,5,6];
      let interval = 1;
      
      if (frequencyMode === 'weekdays') weekdays = selectedWeekdays;
      if (frequencyMode === 'every_other') { interval = 2; weekdays = []; } 

      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'medications'), {
        name: newMedName.trim(), 
        dosage: addMode === 'dosett' ? '' : newMedDosage.trim(), 
        stock: (addMode === 'single' && newMedTrackStock) ? parseInt(newMedStock) || 0 : null,
        trackStock: addMode === 'single' ? newMedTrackStock : false,
        lowStockLimit: (addMode === 'single' && newMedTrackStock) ? (parseInt(newMedLowLimit) || 10) : 10,
        isCourse: addMode === 'single' ? newMedIsCourse : false,
        colorKey: selectedColor, 
        schedule: selectedSchedule, 
        scheduleTimes: scheduleTimes,
        weekdays: weekdays,
        interval: interval,
        intervalStartDate: frequencyMode === 'every_other' ? intervalStartDate : null,
        ingredients: addMode === 'dosett' ? currentIngredients : [], 
        showOnDashboard: addMode === 'dosett' ? true : showOnDashboard,
        reminderEnabled: true,
        createdAt: Date.now(), 
        order: maxOrder + 1, 
        isArchived: false
      });
      setIsAdding(false);
    } catch (e) { alert("Virhe tallennuksessa"); }
  };

  const handleUpdateMedication = async (e) => {
    e.preventDefault();
    if (!editingMed || !user) return;
    try {
      let weekdays = [0,1,2,3,4,5,6];
      let interval = 1;
      if (frequencyMode === 'weekdays') weekdays = selectedWeekdays; // Käytä tilamuuttujaa muokkauksessa
      if (frequencyMode === 'every_other') { interval = 2; weekdays = []; }
      if (frequencyMode === 'every_day') weekdays = [0,1,2,3,4,5,6];

      const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', editingMed.id);
      await updateDoc(medRef, { 
        name: editingMed.name.trim(), 
        dosage: editingMed.dosage || '', 
        stock: editingMed.trackStock ? parseInt(editingMed.stock) : null,
        trackStock: editingMed.trackStock || false,
        lowStockLimit: editingMed.trackStock ? parseInt(editingMed.lowStockLimit) : 10,
        isCourse: editingMed.isCourse || false,
        colorKey: editingMed.colorKey, 
        schedule: editingMed.schedule || [], 
        scheduleTimes: editingMed.scheduleTimes || {},
        weekdays: weekdays,
        interval: interval,
        intervalStartDate: frequencyMode === 'every_other' ? intervalStartDate : null,
        ingredients: currentIngredients,
        showOnDashboard: editingMed.showOnDashboard !== undefined ? editingMed.showOnDashboard : true
      });
      setEditingMed(null);
    } catch (e) { alert("Virhe muokkauksessa"); }
  };

  const addIngredient = () => {
    if(!ingredientName.trim()) return;
    setCurrentIngredients([...currentIngredients, {name: ingredientName.trim(), count: ingredientCount.trim() || '1'}]);
    setIngredientName(''); setIngredientCount('');
  };
  
  const removeIngredient = (index) => {
    const newIng = [...currentIngredients];
    newIng.splice(index, 1);
    setCurrentIngredients(newIng);
  };

  const editIngredient = (index) => {
    const ing = currentIngredients[index];
    setIngredientName(ing.name);
    setIngredientCount(ing.count);
    removeIngredient(index);
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

  const toggleWeekday = (dayId, isEdit = false) => {
    if (isEdit) {
       // Muokkaustilassa päivitetään suoraan selectedWeekdays (jota käytetään lomakkeessa)
       const current = selectedWeekdays;
       const newW = current.includes(dayId) ? current.filter(d => d !== dayId) : [...current, dayId];
       setSelectedWeekdays(newW);
    } else {
       const newW = selectedWeekdays.includes(dayId) ? selectedWeekdays.filter(d => d !== dayId) : [...selectedWeekdays, dayId];
       setSelectedWeekdays(newW);
    }
  };

  const handleTimeChange = (slotId, time, isEdit = false) => {
    if (isEdit) {
      setEditingMed({ ...editingMed, scheduleTimes: { ...editingMed.scheduleTimes, [slotId]: time } });
    } else {
      setScheduleTimes({ ...scheduleTimes, [slotId]: time });
    }
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

  const openQuickAdd = () => {
    setQuickAddDate(getCurrentDateTimeLocal());
    setIsQuickAdding(true);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddName.trim() || !user || !quickAddDate) return;
    const stockItem = medications.find(m => m.name.toLowerCase() === quickAddName.trim().toLowerCase() && m.trackStock);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: stockItem ? stockItem.id : 'quick_dose', 
        medName: quickAddName.trim(), 
        medColor: stockItem ? stockItem.colorKey : 'orange', 
        slot: null, 
        timestamp: new Date(quickAddDate).toISOString(),
        reason: quickAddReason.trim(),
        ingredients: null
      });
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
      const ingredientsSnapshot = med.ingredients && med.ingredients.length > 0 ? med.ingredients : null;
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: med.id, medName: med.name, medColor: med.colorKey, slot: slotId, 
        timestamp: new Date().toISOString(), reason: reasonText.trim(), ingredients: ingredientsSnapshot 
      });
      if (med.trackStock && med.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
         await updateDoc(medRef, { stock: med.stock - 1 });
      }
      if (med.ingredients) {
        for (const ing of med.ingredients) {
           const sub = medications.find(m => m.name === ing.name);
           if (sub && sub.trackStock) await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', sub.id), { stock: sub.stock - (parseInt(ing.count)||1) });
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
      const ingredientsSnapshot = manualLogMed.ingredients && manualLogMed.ingredients.length > 0 ? manualLogMed.ingredients : null;
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: manualLogMed.id, 
        medName: manualLogMed.name, 
        medColor: manualLogMed.colorKey, 
        slot: null, 
        timestamp: new Date(manualDate).toISOString(),
        reason: manualReason.trim(),
        ingredients: ingredientsSnapshot
      });
      if (manualLogMed.trackStock && manualLogMed.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', manualLogMed.id);
         await updateDoc(medRef, { stock: manualLogMed.stock - 1 });
      }
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
    setDeleteDialog({ isOpen: true, mode: 'med', medId: med.id, medName: med.name, hasHistory: hasHistory, message: `Haluatko varmasti poistaa lääkkeen ${med.name}?` });
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
     setDeleteDialog({ isOpen: true, mode: 'log', logId: logId, title: 'Poista merkintä?', message: 'Haluatko varmasti poistaa tämän merkinnän historiasta?' });
  };

  const handleDeleteSingleLog = async () => {
     if(!user || !deleteDialog.logId) return;
     try {
       await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', deleteDialog.logId));
     } catch(e) { alert("Poisto epäonnistui"); }
     setDeleteDialog({ isOpen: false, mode: null, medId: null, logId: null });
  };

  const getStockStatusColor = (med) => {
     if (!med.trackStock || med.stock === null) return '';
     const limit = med.lowStockLimit || 10;
     if (med.stock <= limit) return 'text-red-600 font-bold';
     if (med.stock <= limit + 5) return 'text-orange-600 font-bold';
     return 'text-slate-500';
  };

  // --- FILTTERÖINTI ETUSIVULLE ---
  const activeMeds = medications.filter(m => {
    if (m.isArchived) return false;
    if (m.showOnDashboard === false) return false;
    const now = new Date();
    // Jaksotus
    if (m.interval === 2 && m.intervalStartDate) {
       const start = new Date(m.intervalStartDate);
       const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
       return diff % 2 === 0;
    }
    const today = now.getDay();
    const activeDays = m.weekdays || [0,1,2,3,4,5,6];
    return activeDays.includes(today);
  });

  const archivedMeds = medications.filter(m => m.isArchived);
  
  const shoppingListMeds = medications.filter(m => 
    !m.isArchived &&
    m.trackStock && 
    !m.isCourse && 
    (m.stock !== null && m.stock <= (m.lowStockLimit || 10))
  );

  const filteredLogs = logs.filter(log => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    const name = getLogName(log).toLowerCase();
    if (name.includes(term)) return true;
    const reason = (log.reason || '').toLowerCase();
    if (reason.includes(term)) return true;
    if (log.ingredients && Array.isArray(log.ingredients)) {
      const hasIngredient = log.ingredients.some(ing => ing.name.toLowerCase().includes(term));
      if (hasIngredient) return true;
    }
    return false;
  });

  const generateReportText = () => {
    if (!reportStartDate || !reportEndDate) return "Valitse päivämäärät.";
    const start = new Date(reportStartDate); start.setHours(0,0,0,0);
    const end = new Date(reportEndDate); end.setHours(23,59,59,999);
    const logsForReport = logs.filter(l => {
      const d = new Date(l.timestamp);
      const isSelected = reportSelectedMeds.has(l.medId) || l.medId === 'quick_dose';
      return d >= start && d <= end && isSelected;
    });
    const medStats = {};
    Array.from(reportSelectedMeds).forEach(medId => {
       const med = medications.find(m => m.id === medId);
       if(med) medStats[med.name] = { count: 0, logs: [], isScheduled: med.schedule && med.schedule.length > 0 };
    });
    logsForReport.forEach(log => {
      const name = getLogName(log);
      if (!medStats[name]) medStats[name] = { count: 0, logs: [], isScheduled: false };
      medStats[name].count++;
      medStats[name].logs.push(log);
    });
    let text = `LÄÄKKEIDEN KÄYTTÖ\n`;
    text += `Aikaväli: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}\n\n`;
    Object.entries(medStats).sort((a,b) => b[1].count - a[1].count).forEach(([name, data]) => {
      text += `- ${name}: ${data.count} kpl\n`;
    });
    text += `\nERITTELY:\n\n`;
    Object.entries(medStats).forEach(([name, data]) => {
       if (data.count === 0) return;
       text += `--- ${name.toUpperCase()} (${data.count} kpl) ---\n`;
       if (data.isScheduled) {
          const days = {};
          data.logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(log => {
             const dStr = new Date(log.timestamp).toLocaleDateString('fi-FI', {weekday: 'short', day: 'numeric', month: 'numeric'});
             if (!days[dStr]) days[dStr] = [];
             const slotName = TIME_SLOTS.find(s => s.id === log.slot)?.label || 'Muu';
             let extra = '';
             if (log.ingredients && log.ingredients.length > 0) {
               const ings = log.ingredients.map(i => `${i.name} (${i.count})`).join(', ');
               extra = ` [Sisälsi: ${ings}]`;
             }
             days[dStr].push(slotName + extra);
          });
          Object.entries(days).forEach(([day, slots]) => { text += `${day}: ${slots.join(', ')}\n`; });
       } else {
          data.logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(log => {
             const d = new Date(log.timestamp);
             const timeStr = d.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'});
             const reasonStr = log.reason ? ` - "${log.reason}"` : '';
             let extra = '';
             if (log.ingredients && log.ingredients.length > 0) {
                const ings = log.ingredients.map(i => `${i.name} (${i.count})`).join(', ');
                extra = `\n    Sisälsi: ${ings}`;
             }
             text += `${timeStr}${reasonStr}${extra}\n`;
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden select-none relative">
      
      {/* TAUSTAKUVA */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="" className="w-3/4 max-w-lg opacity-[0.15] grayscale" />
      </div>

      <header className="flex-none bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 z-50 shadow-sm relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" alt="Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {activeTab === 'home' ? <Pill className="text-blue-600" size={20} /> : <BarChart2 className="text-blue-600" size={20} />}
              {activeTab === 'home' ? 'Lääkkeet' : 'Historia'}
            </h1>
          </div>
          
          <div className="flex items-center gap-1">
            {activeTab === 'home' && (
              <>
                <button onClick={() => setShowShoppingList(true)} className={`p-2 rounded-full transition-colors relative ${shoppingListMeds.length > 0 ? 'text-red-500 hover:text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ShoppingCart size={20} />
                  {shoppingListMeds.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
                
                <button onClick={toggleNotifications} className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`} title={notificationsEnabled ? "Mykistä ilmoitukset" : "Ota ilmoitukset käyttöön"}>
                  {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>

                <button onClick={() => setShowHelp(true)} className="p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                  <HelpCircle size={20} />
                </button>
                
                <div className="relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Menu size={24} />
                  </button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-100 z-50 p-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => {setShowAlertsList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><Bell size={18} className="text-blue-500"/> Hälytyslista</button>
                        <button onClick={() => {setShowAllMedsList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><List size={18} className="text-blue-500"/> Lääkeluettelo (Kaikki)</button>
                        <button onClick={() => {setShowStockList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><Box size={18} className="text-blue-500"/> Varastolista</button>
                        <button onClick={() => {setShowDosetti(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><LayoutList size={18} className="text-blue-500"/> Dosettijako</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => {setIsReordering(!isReordering); setIsMenuOpen(false);}} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-left ${isReordering ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}><ArrowUpDown size={18} className={isReordering ? 'text-blue-600' : 'text-slate-400'}/> Järjestä</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => {handleLogout(); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium text-left"><LogOut size={18}/> Kirjaudu ulos</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex mb-1">
          <button onClick={() => handleTabChange('home')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Lääkkeet</button>
          <button onClick={() => handleTabChange('stats')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Historia</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-20 z-0 relative">
        <div className="max-w-md mx-auto space-y-3">
          {activeTab === 'home' && (
            <>
              {activeMeds.length === 0 && !isAdding && (
                <div className="text-center py-12 text-slate-400">
                  <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-sm"><Pill size={32} className="text-blue-200" /></div>
                  <p className="mb-4 text-sm">Ei lääkkeitä listalla tälle päivälle.</p>
                  <div className="flex flex-col gap-3 px-10">
                    <button onClick={() => setShowHelp(true)} className="bg-white text-blue-600 border border-blue-200 px-5 py-2.5 rounded-full font-bold shadow-sm text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"><Info size={18}/> Tutustu ohjeisiin</button>
                    <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"><Plus size={18}/> Lisää ensimmäinen</button>
                  </div>
                </div>
              )}
              {activeMeds.map((med, index) => {
                const lateClass = getMedStatusColor(med);
                const c = getColors(med.colorKey || 'blue');
                const lastLog = getLastTaken(med.id);
                const isExpanded = expandedMedId === med.id || isReordering; 
                
                const today = new Date().toDateString();
                const doneToday = med.scheduleTimes 
                   ? Object.keys(med.scheduleTimes).every(slot => logs.some(l => l.medId === med.id && l.slot === slot && new Date(l.timestamp).toDateString() === today))
                   : logs.some(l => l.medId === med.id && new Date(l.timestamp).toDateString() === today);

                return (
                  <div key={med.id} className={`rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${c.bg} ${lateClass || c.border} relative group`}>
                    {isReordering && (
                      <div className="absolute right-0 top-0 bottom-0 w-14 flex flex-col justify-center gap-2 pr-2 bg-gradient-to-l from-white/80 via-white/50 to-transparent z-30">
                        <button onClick={(e) => { e.stopPropagation(); moveMedication(index, -1); }} disabled={index === 0} className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"><ArrowUp size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveMedication(index, 1); }} disabled={index === activeMeds.length - 1} className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"><ArrowDown size={18} /></button>
                      </div>
                    )}

                    <div onClick={() => !isReordering && toggleExpand(med.id)} className={`p-4 flex justify-between items-center ${!isReordering ? 'cursor-pointer active:bg-black/5' : ''}`}>
                      <div className="flex-1 min-w-0 pr-3">
                         <div className="flex items-center gap-2">
                            {med.ingredients && med.ingredients.length > 0 && <Layers size={20} className="text-slate-600" />}
                            <h3 className={`text-lg font-bold leading-tight ${lateClass ? 'text-red-800' : 'text-slate-800'}`}>{med.name}</h3>
                            {doneToday && <CheckCircle size={18} className="text-green-600 shrink-0" />}
                            {lateClass && !doneToday && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
                         </div>
                         
                         {expandedMedId !== med.id && (
                           <div className="flex items-center gap-2 mt-1">
                             {med.ingredients && med.ingredients.length > 0 ? (
                               <span className="text-xs font-bold text-slate-500 bg-white/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Dosetti</span>
                             ) : med.trackStock && med.stock <= (med.lowStockLimit || 10) ? (
                               <span className="text-xs text-red-600 font-bold truncate">{med.stock} kpl jäljellä!</span>
                             ) : med.dosage ? (
                               <span className="text-xs text-slate-600 font-medium truncate">{med.dosage}</span>
                             ) : (
                               <span className="text-xs text-slate-500 truncate">{lastLog ? `Viimeksi: ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span>
                             )}
                           </div>
                         )}
                      </div>
                      {!isReordering && <div className="text-slate-400">{expandedMedId === med.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>}
                    </div>

                    {expandedMedId === med.id && !isReordering && (
                      <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                         <div className="border-t border-black/5 mb-3 pt-1"></div>
                         
                         {med.ingredients && med.ingredients.length > 0 && (
                           <div className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg mb-3 border border-slate-100">
                             <div className="flex items-center gap-2 mb-2"><Layers size={14} className="text-slate-400"/><span className="font-bold uppercase text-[10px] text-slate-500">Sisältö</span></div>
                             <div className="space-y-1">
                               {med.ingredients.map((ing, idx) => (
                                 <div key={idx} className="flex justify-between border-b border-slate-200 last:border-0 pb-1 last:pb-0"><span className="font-medium">{ing.name}</span><span className="text-slate-500">{ing.count} kpl</span></div>
                               ))}
                             </div>
                           </div>
                         )}

                         {!med.ingredients?.length && med.dosage && <div className="text-sm text-slate-700 mb-2 font-medium bg-white/50 p-2 rounded-lg inline-block mr-2">{med.dosage}</div>}

                         {!med.ingredients?.length && med.trackStock && (
                           <div className={`text-sm mb-3 font-medium bg-white/50 p-2 rounded-lg inline-flex items-center gap-2 ${getStockStatusColor(med)}`}>
                             <Package size={14} /> <span>{med.stock !== null ? med.stock : 0} kpl</span>
                           </div>
                         )}

                         <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium mb-4">
                           <Clock size={12} /><span>{lastLog ? `${getDayLabel(lastLog.timestamp)} klo ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span>
                         </div>

                         <div className="flex gap-2 mb-4 justify-end flex-wrap">
                            {med.trackStock && <button onClick={() => handleRefill(med)} className="p-2 bg-white/60 rounded-lg hover:text-green-600 hover:bg-white flex items-center gap-1" title="Täydennä varastoa"><RefreshCw size={18}/></button>}
                            <button onClick={() => { setManualLogMed(med); setManualDate(getCurrentDateTimeLocal()); }} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Lisää manuaalisesti"><CalendarPlus size={18}/></button>
                            <button onClick={() => setShowHistoryFor(med.id)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Historia"><History size={18}/></button>
                            <button onClick={() => openEditMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Muokkaa"><Pencil size={18}/></button>
                            <button onClick={() => toggleArchive(med)} className="p-2 bg-white/60 rounded-lg hover:text-orange-500 hover:bg-white" title="Arkistoi"><Archive size={18}/></button>
                            <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-red-500 hover:bg-white" title="Poista"><Trash2 size={18}/></button>
                         </div>

                         {med.scheduleTimes ? (
                            <div className="grid grid-cols-4 gap-2">
                              {TIME_SLOTS.filter(slot => (med.schedule||[]).includes(slot.id)).map(slot => {
                                const taken = logs.some(l => l.medId === med.id && l.slot === slot.id && new Date(l.timestamp).toDateString() === today);
                                return (
                                  <button key={slot.id} onClick={() => takeMedicine(med, slot.id)} disabled={taken} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${taken ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 active:scale-95'}`}>
                                    {taken ? <Check size={20} strokeWidth={3} /> : <slot.icon size={20} />}
                                    <span className="text-[10px] font-bold mt-1 uppercase">{slot.label}</span>
                                    {!taken && <span className="text-[9px] text-slate-400">{med.scheduleTimes[slot.id]}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <button onClick={() => takeMedicine(med)} className={`w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform ${c.btn}`}>
                              <CheckCircle size={20} /> OTA NYT
                            </button>
                          )
                         }
                      </div>
                    )}
                  </div>
                );
              })}

              {archivedMeds.length > 0 && !isReordering && (
                <div className="mt-8">
                  <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-slate-400 text-sm font-medium w-full px-2">
                    {showArchived ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Arkistoidut lääkkeet ({archivedMeds.length})
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
              <button onClick={() => setShowReport(true)} className="w-full bg-white border border-blue-200 text-blue-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                <FileText size={20}/> Raportti (Valitse & Tulosta)
              </button>

              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                   <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-blue-500" size={18}/> Koko historia</h2>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                  <input type="text" placeholder="Etsi lääkettä..." className="w-full bg-slate-50 pl-10 pr-4 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                  {historySearch && (<button onClick={() => setHistorySearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"><X size={18}/></button>)}
                </div>

                <div className="space-y-3">
                  {getHistoryDates(filteredLogs).map((dayStr, i) => {
                    const logsNow = getLogsForDate(new Date(dayStr), filteredLogs);
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
                                {log.reason && <span className="text-[10px] text-slate-500 italic ml-3 truncate max-w-[150px]">"{log.reason}"</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredLogs.length === 0 && <div className="text-center text-slate-400 text-sm py-4">{historySearch ? 'Ei hakutuloksia.' : 'Ei vielä historiaa.'}</div>}
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center z-20 pb-safe">
        <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
          <Pill size={22} strokeWidth={activeTab==='home'?2.5:2} /> <span className="text-[10px] font-bold">Lääkkeet</span>
        </button>
        <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" className="h-10 w-auto object-contain -mt-4 drop-shadow-md"/>
        <button onClick={() => handleTabChange('stats')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'stats' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
          <BarChart2 size={22} strokeWidth={activeTab==='stats'?2.5:2} /> <span className="text-[10px] font-bold">Historia</span>
        </button>
      </nav>

      {/* FAB NAPIT (Vain Home-välilehdellä, ei modaleissa) */}
      {!isAdding && activeTab === 'home' && !showHistoryFor && !deleteDialog.isOpen && !editingMed && !manualLogMed && !takeWithReasonMed && !editingLog && !isQuickAdding && !isReordering && !showStockList && !showAllMedsList && !showAlertsList && !showShoppingList && (
        <>
          <button onClick={() => window.location.reload()} className="absolute bottom-20 left-5 z-30 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:rotate-180 transition-all duration-500 border border-slate-200" title="Päivitä sovellus"><RotateCcw size={24} /></button>
          <div className="absolute bottom-20 right-5 z-30 flex gap-3 items-end">
            <button onClick={openQuickAdd} className="bg-orange-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform" title="Pikalisäys"><Zap size={24}/></button>
            <button onClick={openAddModal} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"><Plus size={32}/></button>
          </div>
        </>
      )}

      {/* --- MODALIT --- */}
      
      {/* HÄLYTYSLISTA */}
      {showAlertsList && (
        <div className="absolute inset-0 z-50 bg-white p-5 overflow-y-auto animate-in slide-in-from-bottom">
           <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex gap-2"><Bell/> Hälytyslista</h2><button onClick={() => setShowAlertsList(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           <div className="space-y-3">
             {medications.filter(m => !m.isArchived && m.scheduleTimes && Object.keys(m.scheduleTimes).length > 0).map(med => (
               <div key={med.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border">
                 <span className="font-bold">{med.name}</span>
                 <button onClick={() => toggleNotificationForMed(med)} className={`p-2 rounded-full ${med.reminderEnabled !== false ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                   {med.reminderEnabled !== false ? <Bell size={20}/> : <BellOff size={20}/>}
                 </button>
               </div>
             ))}
             {medications.filter(m => !m.isArchived && m.scheduleTimes && Object.keys(m.scheduleTimes).length > 0).length === 0 && <p className="text-center text-slate-400">Ei aikataulutettuja lääkkeitä.</p>}
           </div>
        </div>
      )}

      {/* LÄÄKELUETTELO (KAIKKI) */}
      {showAllMedsList && (
        <div className="absolute inset-0 z-50 bg-white p-5 overflow-y-auto animate-in slide-in-from-bottom">
           <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex gap-2"><List/> Lääkeluettelo</h2><button onClick={() => setShowAllMedsList(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           
           <div className="space-y-6">
               {['💊 Yksittäiset lääkkeet', '🗓️ Dosetit & Yhdistelmät'].map((title, idx) => {
                 const isDosettSection = idx === 1;
                 const list = medications.filter(m => !m.isArchived && (isDosettSection ? (m.ingredients?.length>0) : (!m.ingredients || m.ingredients.length===0))).sort((a,b) => a.name.localeCompare(b.name));
                 return (
                   <div key={idx}>
                     <h3 className="font-bold text-slate-400 uppercase text-xs mb-2">{title}</h3>
                     <div className="space-y-2">
                       {list.map(med => (
                         <div key={med.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex-1">
                              <div className="font-bold text-slate-800">{med.name}</div>
                              <div className="text-xs text-slate-500">{isDosettSection ? `Sisältö: ${med.ingredients.length} osaa` : (med.trackStock ? `Varasto: ${med.stock}` : 'Ei varastoa')}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setShowHistoryFor(med.id); setShowAllMedsList(false); }} className="p-2 bg-white border rounded text-blue-600"><History size={16}/></button>
                              <button onClick={() => { openEditMed(med); setShowAllMedsList(false); }} className="p-2 bg-white border rounded text-blue-600"><Pencil size={16}/></button>
                            </div>
                         </div>
                       ))}
                       {list.length === 0 && <p className="text-xs text-slate-400 italic">Tyhjä.</p>}
                     </div>
                   </div>
                 )
               })}
           </div>
        </div>
      )}

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
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{med.name}</div>
                      <div className={`text-xs ${getStockStatusColor(med)}`}>Saldo: {med.stock} kpl (Raja: {med.lowStockLimit})</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowHistoryFor(med.id); setShowStockList(false); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600" title="Historia"><History size={16}/></button>
                      <button onClick={() => openEditMed(med)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600"><Pencil size={16}/></button>
                    </div>
                 </div>
               ))}
             </div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* DOSETTI MODAL */}
      {showDosetti && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-blue-600"><LayoutList/> Dosettijako</h2><button onClick={() => setShowDosetti(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             <div className="space-y-6">
               {TIME_SLOTS.map(slot => {
                 const medsForSlot = medications.filter(m => !m.isArchived && m.schedule && m.schedule.includes(slot.id));
                 return (
                   <div key={slot.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase text-sm border-b border-slate-200 pb-1"><slot.icon size={16} className="text-blue-500"/> {slot.label}</h3>
                     {medsForSlot.length === 0 ? <p className="text-xs text-slate-400 italic">Ei lääkkeitä.</p> : (
                       <ul className="space-y-2">
                         {medsForSlot.map(med => {
                           if (med.ingredients && med.ingredients.length > 0) {
                             return med.ingredients.map((ing, idx) => (
                               <li key={`${med.id}-${idx}`} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><span className="font-medium text-sm text-slate-700">{ing.name}</span><span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{ing.count}</span></li>
                             ));
                           } else {
                             return (
                               <li key={med.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><span className="font-medium text-sm text-slate-700">{med.name}</span><span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{med.dosage || '1 kpl'}</span></li>
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
             <div className="flex justify-between items-center mb-4 flex-none"><h2 className="text-lg font-bold">Luo raportti</h2><button onClick={() => setShowReport(false)} className="p-1 bg-slate-100 rounded-full"><X size={18}/></button></div>
             <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alkaen</label><input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Päättyen</label><input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-slate-500 uppercase">Valitse lääkkeet</label><button onClick={() => { const allIds = medications.filter(m => !m.isArchived).map(m => m.id); setReportSelectedMeds(reportSelectedMeds.size === allIds.length ? new Set() : new Set(allIds)); }} className="text-xs text-blue-600 font-bold">Valitse/Poista kaikki</button></div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50">
                      {medications.filter(m => !m.isArchived).map(med => (
                        <label key={med.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={reportSelectedMeds.has(med.id)} onChange={() => toggleReportMedSelection(med.id)} /><span className="text-sm font-medium text-slate-700 truncate">{med.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
             <div className="flex-none pt-4 mt-2 border-t">
               <pre className="bg-slate-50 p-3 rounded-xl text-[10px] font-mono overflow-auto h-32 whitespace-pre-wrap mb-3 border">{generateReportText()}</pre>
               <button onClick={copyReport} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"><Clipboard size={18} /> Kopioi leikepöydälle</button>
             </div>
           </div>
        </div>
      )}

      {/* OSTOSLISTA MODAL */}
      {showShoppingList && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-red-600"><ShoppingCart/> Ostoslista</h2><button onClick={() => setShowShoppingList(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             {shoppingListMeds.length === 0 ? <div className="text-center text-slate-400 py-8">Kaikki lääkkeet hyvässä tilanteessa!</div> : (
               <div className="space-y-3">
                 {shoppingListMeds.map(med => (
                   <div key={med.id} className={`flex justify-between items-center p-3 border rounded-xl ${med.stock <= med.lowStockLimit ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div>
                        <div className="font-bold text-slate-800">{med.name}</div>
                        <div className={`text-xs font-bold ${med.stock <= med.lowStockLimit ? 'text-red-600' : 'text-orange-600'}`}>Jäljellä: {med.stock} kpl (Raja: {med.lowStockLimit||10})</div>
                      </div>
                      <Package className={med.stock <= med.lowStockLimit ? 'text-red-300' : 'text-orange-300'} size={24}/>
                   </div>
                 ))}
               </div>
             )}
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* PIKALISÄYS */}
      {isQuickAdding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="text-orange-500"/> Kirjaa kertaluontoinen</h2>
            <form onSubmit={handleQuickAdd}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valitse listalta (valinnainen)</label>
                <select className="w-full bg-slate-50 p-3 rounded-xl text-base border focus:border-orange-500 outline-none appearance-none" onChange={(e) => { const selected = medications.find(m => m.id === e.target.value); if(selected) setQuickAddName(selected.name); }} defaultValue="">
                  <option value="" disabled>Valitse lääke...</option>
                  {medications.filter(m => !m.isArchived).sort((a,b) => a.name.localeCompare(b.name)).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-orange-500" placeholder="Tai kirjoita nimi (esim. Burana)" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ajankohta</label><input type="datetime-local" className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none border focus:border-orange-500" value={quickAddDate} onChange={e => setQuickAddDate(e.target.value)} /></div>
                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Syy</label><input className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none border focus:border-orange-500" placeholder="Valinnainen" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)} /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsQuickAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button>
                <button type="submit" disabled={!quickAddName.trim()} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">Kirjaa</button>
              </div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {/* OTA SYYLLÄ */}
      {takeWithReasonMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-1"><h2 className="text-lg font-bold">Ota lääke</h2><button onClick={() => setTakeWithReasonMed(null)} className="p-1 bg-slate-100 rounded-full"><X size={16}/></button></div>
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

      {/* SINGLE MED HISTORY MODAL */}
      {showHistoryFor && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><History /> Historia: {medications.find(m => m.id === showHistoryFor)?.name || 'Lääke'}</h2><button onClick={() => setShowHistoryFor(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             <div className="space-y-3">
                {getHistoryDates(logs.filter(l => l.medId === showHistoryFor)).map((dayStr, i) => {
                  const filteredLogs = getLogsForDate(new Date(dayStr), logs.filter(l => l.medId === showHistoryFor));
                  return (
                    <div key={i} className="border-b border-slate-50 pb-2 last:border-0">
                       <div className="text-[10px] font-bold uppercase mb-1.5 text-slate-400">{getDayLabel(dayStr)}</div>
                       <div className="space-y-2">
                         {filteredLogs.map(log => (
                           <button key={log.id} onClick={() => openLogEdit(log)} className="w-full flex justify-between items-center p-2 bg-slate-50 rounded-lg text-left">
                              <div><span className="font-bold text-sm text-slate-700">{formatTime(log.timestamp)}</span>{log.ingredients && log.ingredients.length > 0 && (<div className="text-[10px] text-slate-500 mt-0.5">Sisälsi: {log.ingredients.map(ing => `${ing.name} (${ing.count})`).join(', ')}</div>)}</div>
                              {log.reason && <span className="text-xs text-slate-500 italic">"{log.reason}"</span>}
                           </button>
                         ))}
                       </div>
                    </div>
                  );
                })}
                {logs.filter(l => l.medId === showHistoryFor).length === 0 && <p className="text-center text-slate-400 text-sm">Ei merkintöjä.</p>}
             </div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {deleteDialog.isOpen && (
        <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h2 className="text-lg font-bold text-red-600 mb-2">{deleteDialog.title || 'Poista?'}</h2>
             <p className="text-slate-600 mb-6">{deleteDialog.message || 'Haluatko varmasti jatkaa?'}</p>
             <div className="flex flex-col gap-3">
               {deleteDialog.mode === 'med' && deleteDialog.hasHistory ? (
                 <><button onClick={handleDeleteKeepHistory} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm">Poista, mutta säästä historia</button><button onClick={handleDeleteAll} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm">Poista kaikki (myös historia)</button></>
               ) : deleteDialog.mode === 'log' ? (
                 <button onClick={handleDeleteSingleLog} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm">Poista merkintä</button>
               ) : (
                 <button onClick={handleDeleteAll} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm">Poista</button>
               )}
               <button onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })} className="w-full py-3 text-slate-400 font-bold text-sm">Peruuta</button>
             </div>
           </div>
        </div>
      )}

      {editingLog && (
        <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Merkinnän tiedot</h2><button onClick={() => setEditingLog(null)} className="p-1 bg-slate-100 rounded-full"><X size={18}/></button></div>
             <form onSubmit={handleSaveLogEdit}>
               {editingLog.ingredients && editingLog.ingredients.length > 0 && (
                 <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sisälsi</label><ul className="space-y-1">{editingLog.ingredients.map((ing, idx) => (<li key={idx} className="flex justify-between text-sm"><span className="font-medium text-slate-700">{ing.name}</span><span className="text-slate-500">{ing.count} kpl</span></li>))}</ul></div>
               )}
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aika</label>
               <input type="datetime-local" required className="w-full bg-slate-50 p-3 rounded-xl mb-4 border" value={editingLogDate} onChange={e => setEditingLogDate(e.target.value)} />
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Syy / Lisätieto</label>
               <input className="w-full bg-slate-50 p-3 rounded-xl mb-6 border" placeholder="Valinnainen" value={editingLogReason} onChange={e => setEditingLogReason(e.target.value)} />
               <div className="flex gap-3">
                 <button type="button" onClick={requestDeleteLog} className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2 size={20}/></button>
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Tallenna</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* LISÄYS / MUOKKAUS */}
      {(isAdding || editingMed) && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[95vh] overflow-y-auto">
            <div className="flex flex-wrap gap-3 justify-center mb-6 pt-2">
              {colorList.map(c => { const colors = getColors(c); const isSelected = editingMed ? editingMed.colorKey === c : selectedColor === c;
                return (<button key={c} type="button" onClick={() => editingMed ? setEditingMed({...editingMed, colorKey: c}) : setSelectedColor(c)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}><div className={`w-full h-full rounded-full ${colors.dot} shadow-sm`} /></button>);
              })}
            </div>

            {/* TYYPPIVALINTA VAIN LISÄYKSESSÄ */}
            {!editingMed && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button type="button" onClick={() => setAddMode('single')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${addMode==='single'?'bg-white shadow text-blue-600':'text-slate-500'}`}>Yksittäinen</button>
                <button type="button" onClick={() => setAddMode('dosett')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${addMode==='dosett'?'bg-white shadow text-blue-600':'text-slate-500'}`}>Dosetti</button>
              </div>
            )}

            <h2 className="text-lg font-bold mb-4">{editingMed ? 'Muokkaa' : (addMode === 'single' ? 'Lisää lääke' : 'Luo Dosetti')}</h2>
            
            <form onSubmit={editingMed ? handleUpdateMedication : handleAddMedication}>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" placeholder={addMode === 'single' ? "Lääkkeen nimi" : "Dosetin nimi"} value={editingMed ? editingMed.name : newMedName} onChange={e => editingMed ? setEditingMed({...editingMed, name: e.target.value}) : setNewMedName(e.target.value)} />
              
              {addMode === 'single' && (
                <input className="w-full bg-slate-50 p-3 rounded-xl text-base mb-6 outline-none border focus:border-blue-500" placeholder="Annostus (valinnainen)" value={editingMed ? (editingMed.dosage || '') : newMedDosage} onChange={e => editingMed ? setEditingMed({...editingMed, dosage: e.target.value}) : setNewMedDosage(e.target.value)} />
              )}

              {addMode === 'dosett' && (
                <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Sisältö</label>
                   <div className="flex gap-2 mb-2">
                     <select className="flex-1 p-2 rounded border outline-none" value={ingredientName} onChange={e => setIngredientName(e.target.value)}>
                       <option value="">Valitse lääke...</option>
                       {medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                     </select>
                     <input className="w-16 p-2 rounded border outline-none" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)} />
                     <button type="button" onClick={addIngredient} className="p-2 bg-blue-600 text-white rounded"><Plus/></button>
                   </div>
                   {currentIngredients.map((ing, i) => (
                     <div key={i} className="flex justify-between text-sm p-2 bg-white border rounded mb-1">
                       <span>{ing.name} ({ing.count})</span>
                       <div className="flex gap-1"><button type="button" onClick={() => editIngredient(i)} className="p-1 text-slate-400"><Pencil size={16}/></button><button type="button" onClick={() => removeIngredient(i)} className="p-1 text-red-400"><Trash2 size={16}/></button></div>
                     </div>
                   ))}
                </div>
              )}

              {addMode === 'single' && (
                <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={editingMed ? editingMed.trackStock : newMedTrackStock} onChange={(e) => editingMed ? setEditingMed({...editingMed, trackStock: e.target.checked}) : setNewMedTrackStock(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-bold text-slate-700">Seuraa lääkevarastoa</span>
                  </label>
                  {(editingMed ? editingMed.trackStock : newMedTrackStock) && (
                    <div className="animate-in slide-in-from-top-2 pt-2 grid grid-cols-2 gap-3">
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Varastossa</label><input type="number" className="w-full bg-white p-2 rounded border" value={editingMed ? (editingMed.stock ?? '') : newMedStock} onChange={e => editingMed ? setEditingMed({...editingMed, stock: e.target.value}) : setNewMedStock(e.target.value)} /></div>
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase">Hälytysraja</label><input type="number" className="w-full bg-white p-2 rounded border" value={editingMed ? (editingMed.lowStockLimit ?? 10) : newMedLowLimit} onChange={e => editingMed ? setEditingMed({...editingMed, lowStockLimit: e.target.value}) : setNewMedLowLimit(e.target.value)} /></div>
                    </div>
                  )}
                  {/* Etusivun valinta vain single-modessa, dosetti aina true */}
                  <label className="flex items-center gap-2 cursor-pointer mt-3 pt-2 border-t">
                    <input type="checkbox" checked={editingMed ? (editingMed.showOnDashboard !== false) : showOnDashboard} onChange={(e) => editingMed ? setEditingMed({...editingMed, showOnDashboard: e.target.checked}) : setShowOnDashboard(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-bold text-slate-700">Näytä etusivulla</span>
                  </label>
                </div>
              )}

              {/* JAKSOTUS */}
              <div className="mb-6">
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Toistuvuus</label>
                 <select className="w-full p-3 bg-slate-50 border rounded-xl mb-3" value={frequencyMode} onChange={e => setFrequencyMode(e.target.value)}>
                   <option value="every_day">Joka päivä</option>
                   <option value="every_other">Joka toinen päivä</option>
                   <option value="weekdays">Valitut viikonpäivät</option>
                 </select>

                 {frequencyMode === 'weekdays' && (
                   <div className="flex justify-between bg-slate-50 p-2 rounded-xl border mb-4">
                     {WEEKDAYS.map(day => {
                       const currentDays = editingMed ? (editingMed.weekdays || []) : selectedWeekdays;
                       const isSelected = currentDays.includes(day.id);
                       const toggle = () => { const newDays = isSelected ? currentDays.filter(d => d !== day.id) : [...currentDays, day.id]; editingMed ? setEditingMed({...editingMed, weekdays: newDays}) : setSelectedWeekdays(newDays); };
                       return <button key={day.id} type="button" onClick={toggle} className={`w-8 h-8 rounded-full text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{day.label}</button>
                     })}
                   </div>
                 )}
                 
                 {frequencyMode === 'every_other' && (
                   <div className="bg-slate-50 p-3 rounded-xl border mb-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Aloituspäivä</label>
                     <input type="date" className="w-full bg-white p-2 rounded border" value={editingMed ? (editingMed.intervalStartDate || '') : intervalStartDate} onChange={e => editingMed ? setEditingMed({...editingMed, intervalStartDate: e.target.value}) : setIntervalStartDate(e.target.value)} />
                   </div>
                 )}

                 <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kellonajat</label>
                 <div className="grid grid-cols-1 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const currentSchedule = editingMed ? (editingMed.schedule || []) : selectedSchedule;
                      const isSelected = currentSchedule.includes(slot.id);
                      const times = editingMed ? (editingMed.scheduleTimes || {}) : scheduleTimes;
                      return (
                        <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <button type="button" onClick={() => { const newSch = isSelected ? currentSchedule.filter(id => id !== slot.id) : [...currentSchedule, slot.id]; editingMed ? setEditingMed({...editingMed, schedule: newSch}) : setSelectedSchedule(newSch); }} className="flex-1 flex gap-3 items-center">
                            <slot.icon size={20} className={isSelected ? 'text-blue-600' : 'text-slate-400'}/>
                            <span className="font-bold text-sm uppercase">{slot.label}</span>
                          </button>
                          {isSelected && <input type="time" className="bg-white border rounded p-1" value={times[slot.id] || slot.defaultTime} onChange={(e) => { const newTimes = {...times, [slot.id]: e.target.value}; editingMed ? setEditingMed({...editingMed, scheduleTimes: newTimes}) : setScheduleTimes(newTimes); }} />}
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => {setIsAdding(false); setEditingMed(null);}} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Peruuta</button>
                <button type="submit" disabled={editingMed ? !editingMed.name : (!newMedName.trim() || (addMode === 'dosett' && currentIngredients.length === 0))} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">Tallenna</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showHelp && <HelpView onClose={() => setShowHelp(false)} />}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<MedicineTracker />);
