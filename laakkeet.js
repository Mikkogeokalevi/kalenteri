import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Pill, Clock, Trash2, CheckCircle, History, X, BarChart2, Calendar, AlertTriangle, Pencil, CalendarPlus, LogOut, User, Lock, Loader2, Archive, ArchiveRestore, ChevronDown, ChevronUp, Sun, Moon, Sunrise, Sunset, Check, Zap, Bell, BellOff, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Package, RefreshCw, ShoppingCart, FileText, Clipboard, MessageSquare, ListChecks, RotateCcw, Share, MoreVertical, PlusSquare, Filter, Layers, LayoutList, Link, Box, Component, Menu, Search, Info, List, CalendarDays, Settings } from 'lucide-react';

// TUODAAN OHJEET (Varmista että ohjeet.js on olemassa!)
import { ohjeData } from './ohjeet.js';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
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
  { id: 1, label: 'Ma' }, { id: 2, label: 'Ti' }, { id: 3, label: 'Ke' }, { id: 4, label: 'To' }, { id: 5, label: 'Pe' }, { id: 6, label: 'La' }, { id: 0, label: 'Su' }
];

const getIconComponent = (iconName) => {
  const icons = { Info, PlusSquare, Plus, CheckCircle, Zap, Package, BarChart2, Bell, List, Layers };
  const Icon = icons[iconName] || HelpCircle;
  return <Icon size={22} className="text-blue-600" />;
};

// --- KOMPONENTIT ---
const HelpView = ({ onClose }) => {
  if (!ohjeData) return <div className="fixed inset-0 z-[60] bg-white p-5 flex flex-col justify-center items-center"><p>Virhe: ohjeet.js puuttuu.</p><button onClick={onClose} className="mt-4 p-2 bg-slate-100 rounded">Sulje</button></div>;
  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="bg-white px-4 py-4 border-b flex items-center justify-between shadow-sm flex-none">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg"><HelpCircle /> Käyttöopas</div>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20">
        {ohjeData.map((section) => (
          <section key={section.id} className="bg-white shadow-sm border border-slate-100 p-5 rounded-2xl">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-800">{section.icon && getIconComponent(section.icon)} {section.title}</h3>
            <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: section.content }} />
          </section>
        ))}
        <div className="text-center text-xs text-slate-400 pt-6 pb-2">Lääkemuistio v5.0</div>
      </div>
    </div>
  );
};

const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      isRegistering ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setError("Tapahtui virhe. Tarkista tiedot."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <div className="w-full max-w-sm bg-white/90 p-8 rounded-2xl shadow-xl z-10 border">
        <h2 className="text-2xl font-bold text-center mb-6">{isRegistering ? 'Luo tunnus' : 'Kirjaudu sisään'}</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" required className="w-full p-3 border rounded-xl" placeholder="Sähköposti" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required className="w-full p-3 border rounded-xl" placeholder="Salasana" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl">{loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Rekisteröidy' : 'Kirjaudu')}</button>
        </form>
        <div className="mt-6 text-center"><button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-slate-500">{isRegistering ? 'Kirjaudu sisään' : 'Luo tunnus'}</button></div>
      </div>
    </div>
  );
};

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
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedMeds, setReportSelectedMeds] = useState(new Set());
  const [historySearch, setHistorySearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState('single'); 
  const [editingMed, setEditingMed] = useState(null);
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
  const [frequencyMode, setFrequencyMode] = useState('weekdays'); 
  const [selectedWeekdays, setSelectedWeekdays] = useState([0,1,2,3,4,5,6]); 
  const [intervalStartDate, setIntervalStartDate] = useState(''); 
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCount, setIngredientCount] = useState('');
  const [currentIngredients, setCurrentIngredients] = useState([]); 
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddReason, setQuickAddReason] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  const [takeWithReasonMed, setTakeWithReasonMed] = useState(null);
  const [takeReason, setTakeReason] = useState('');
  const [manualLogMed, setManualLogMed] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [editingLogDate, setEditingLogDate] = useState('');
  const [editingLogReason, setEditingLogReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false });
  const [showArchived, setShowArchived] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); if(!u){setMedications([]);setLogs([]);} });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    const unsubMeds = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'medications'), (s) => {
      setMedications(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>(a.order||a.createdAt)-(b.order||b.createdAt)));
      setLoadingData(false);
    });
    const unsubLogs = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), (s) => {
      setLogs(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubMeds(); unsubLogs(); };
  }, [user]);

  useEffect(() => { if (Notification.permission === 'granted') setNotificationsEnabled(true); }, []);

  const getMedStatusColor = (med) => {
    if (!med.scheduleTimes) return null;
    const now = new Date();
    const isToday = med.interval===2 && med.intervalStartDate ? (Math.floor((now - new Date(med.intervalStartDate)) / 86400000) % 2 === 0) : (med.weekdays||[0,1,2,3,4,5,6]).includes(now.getDay());
    if (!isToday) return null;
    const currentTime = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    let status = 'normal';
    Object.entries(med.scheduleTimes).forEach(([slotId, time]) => {
      const taken = logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === now.toDateString());
      if (!taken) {
         if (time < currentTime) status = 'late';
         else if (parseInt(time.split(':')[0]) <= now.getHours() + 1 && status !== 'late') status = 'soon';
      }
    });
    if (status === 'late') return 'border-red-400 bg-red-50';
    if (status === 'soon') return 'border-yellow-400 bg-yellow-50';
    return null;
  };

  const toggleNotificationForMed = async (med) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id), { reminderEnabled: !(med.reminderEnabled !== false) });
  };

  const toggleNotifications = () => {
    if (!("Notification" in window)) return alert("Ei tukea.");
    if (notificationsEnabled) { setNotificationsEnabled(false); alert("Mykistetty."); }
    else Notification.requestPermission().then(p => { if(p==='granted'){setNotificationsEnabled(true); new Notification("Päällä!");} else alert("Estetty."); });
  };

  // Hälytyslooppi
  useEffect(() => {
    if (!notificationsEnabled || medications.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
      medications.forEach(med => {
        if (med.isArchived || med.reminderEnabled === false) return;
        const isToday = med.interval===2 && med.intervalStartDate ? (Math.floor((now - new Date(med.intervalStartDate)) / 86400000) % 2 === 0) : (med.weekdays||[0,1,2,3,4,5,6]).includes(now.getDay());
        if (isToday && med.scheduleTimes) {
          Object.entries(med.scheduleTimes).forEach(([slotId, time]) => {
            if (time === currentTime && !logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === now.toDateString())) {
                new Notification(`Ota lääke: ${med.name}`, { body: `Aika: ${time}` });
            }
          });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [medications, logs, notificationsEnabled]);

  const openAddModal = () => {
    setAddMode('single'); setNewMedName(''); setNewMedDosage(''); setNewMedStock(''); setNewMedTrackStock(false);
    setNewMedLowLimit('10'); setNewMedIsCourse(false); setSelectedColor('blue'); setSelectedSchedule([]); setScheduleTimes({});
    setFrequencyMode('weekdays'); setSelectedWeekdays([0,1,2,3,4,5,6]); setIntervalStartDate(new Date().toISOString().split('T')[0]);
    setCurrentIngredients([]); setShowOnDashboard(true); setIsAdding(true);
  };

  const openEditMed = (med) => {
    setEditingMed(med);
    setAddMode((med.ingredients?.length > 0) ? 'dosett' : 'single');
    setCurrentIngredients(med.ingredients || []);
    if (med.interval === 2) { setFrequencyMode('every_other'); setIntervalStartDate(med.intervalStartDate || ''); }
    else if (med.weekdays?.length === 7) { setFrequencyMode('every_day'); }
    else { setFrequencyMode('weekdays'); setSelectedWeekdays(med.weekdays || [0,1,2,3,4,5,6]); }
  };

  const handleSaveMed = async (e) => {
    e.preventDefault();
    if (!newMedName.trim() && !editingMed) return;
    let weekdays = [0,1,2,3,4,5,6];
    let interval = 1;
    if (frequencyMode === 'weekdays') weekdays = selectedWeekdays;
    if (frequencyMode === 'every_other') { interval = 2; weekdays = []; }
    const data = {
      name: editingMed ? editingMed.name : newMedName.trim(), 
      dosage: addMode === 'dosett' ? '' : (editingMed ? editingMed.dosage : newMedDosage.trim()), 
      stock: (addMode === 'single' && (editingMed ? editingMed.trackStock : newMedTrackStock)) ? parseInt(editingMed ? editingMed.stock : newMedStock) || 0 : null,
      trackStock: addMode === 'single' ? (editingMed ? editingMed.trackStock : newMedTrackStock) : false,
      lowStockLimit: (addMode === 'single') ? (parseInt(editingMed ? editingMed.lowStockLimit : newMedLowLimit) || 10) : 10,
      isCourse: addMode === 'single' ? (editingMed ? editingMed.isCourse : newMedIsCourse) : false,
      colorKey: editingMed ? editingMed.colorKey : selectedColor, 
      schedule: editingMed ? editingMed.schedule : selectedSchedule, 
      scheduleTimes: editingMed ? editingMed.scheduleTimes : scheduleTimes,
      weekdays: weekdays,
      interval: interval,
      intervalStartDate: frequencyMode === 'every_other' ? (editingMed ? editingMed.intervalStartDate : intervalStartDate) : null,
      ingredients: addMode === 'dosett' ? currentIngredients : [], 
      showOnDashboard: addMode === 'dosett' ? true : (editingMed ? editingMed.showOnDashboard : showOnDashboard),
      reminderEnabled: editingMed ? (editingMed.reminderEnabled !== false) : true,
    };
    if (editingMed) {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', editingMed.id), data);
      setEditingMed(null);
    } else {
      const maxOrder = medications.reduce((max, m) => Math.max(max, m.order || 0), 0);
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'medications'), { ...data, createdAt: Date.now(), order: maxOrder + 1, isArchived: false });
      setIsAdding(false);
    }
  };

  const takeMedicine = async (med, slotId = null, reasonText = '') => {
    await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
      medId: med.id, medName: med.name, medColor: med.colorKey, slot: slotId, 
      timestamp: new Date().toISOString(), reason: reasonText.trim(), ingredients: med.ingredients || null
    });
    if (med.trackStock && med.stock > 0) await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id), { stock: med.stock - 1 });
    if (med.ingredients) {
      for (const ing of med.ingredients) {
         const sub = medications.find(m => m.name === ing.name);
         if (sub && sub.trackStock) await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', sub.id), { stock: sub.stock - (parseInt(ing.count)||1) });
      }
    }
  };

  // Render logic vars
  const colorList = ['blue', 'green', 'purple', 'orange', 'rose', 'cyan', 'amber', 'teal', 'indigo', 'lime', 'fuchsia', 'slate'];
  const colorMap = { 'blue': {bg:'bg-blue-100',border:'border-blue-300',dot:'bg-blue-600',text:'text-blue-800',btn:'bg-blue-600'}, 'green': {bg:'bg-green-100',border:'border-green-300',dot:'bg-green-600',text:'text-green-800',btn:'bg-green-600'}, 'purple': {bg:'bg-purple-100',border:'border-purple-300',dot:'bg-purple-600',text:'text-purple-800',btn:'bg-purple-600'}, 'orange': {bg:'bg-orange-100',border:'border-orange-300',dot:'bg-orange-500',text:'text-orange-800',btn:'bg-orange-500'}, 'rose': {bg:'bg-red-100',border:'border-red-300',dot:'bg-red-600',text:'text-red-800',btn:'bg-red-600'}, 'cyan': {bg:'bg-cyan-100',border:'border-cyan-300',dot:'bg-cyan-600',text:'text-cyan-800',btn:'bg-cyan-600'}, 'amber': {bg:'bg-amber-100',border:'border-amber-300',dot:'bg-amber-500',text:'text-amber-800',btn:'bg-amber-500'}, 'teal': {bg:'bg-teal-100',border:'border-teal-300',dot:'bg-teal-600',text:'text-teal-800',btn:'bg-teal-600'}, 'indigo': {bg:'bg-indigo-100',border:'border-indigo-300',dot:'bg-indigo-600',text:'text-indigo-800',btn:'bg-indigo-600'}, 'lime': {bg:'bg-lime-100',border:'border-lime-300',dot:'bg-lime-600',text:'text-lime-800',btn:'bg-lime-600'}, 'fuchsia': {bg:'bg-fuchsia-100',border:'border-fuchsia-300',dot:'bg-fuchsia-600',text:'text-fuchsia-800',btn:'bg-fuchsia-600'}, 'slate': {bg:'bg-slate-200',border:'border-slate-300',dot:'bg-slate-600',text:'text-slate-800',btn:'bg-slate-600'} };
  const getColors = (key) => colorMap[key] || colorMap['blue'];
  const getSmartColor = () => colorList[medications.length % colorList.length];

  const activeMeds = medications.filter(m => {
    if (m.isArchived || m.showOnDashboard === false) return false;
    const now = new Date();
    if (m.interval === 2 && m.intervalStartDate) return (Math.floor((now - new Date(m.intervalStartDate))/86400000) % 2 === 0);
    return (m.weekdays||[0,1,2,3,4,5,6]).includes(now.getDay());
  });

  const getHistoryDates = (list) => [...new Set(list.map(l => new Date(l.timestamp).toDateString()))].sort((a,b)=>new Date(b)-new Date(a));
  const getLogsForDate = (ds, list) => list.filter(l => new Date(l.timestamp).toDateString() === ds).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  const filteredLogs = logs.filter(log => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    return (medications.find(m => m.id === log.medId)?.name || log.medName).toLowerCase().includes(term) || (log.ingredients && log.ingredients.some(i => i.name.toLowerCase().includes(term)));
  });

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden select-none relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"><img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" className="w-3/4 opacity-[0.15] grayscale" /></div>
      
      <header className="flex-none bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 z-50 shadow-sm relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3"><img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" className="h-8"/> <h1 className="text-lg font-bold text-slate-800">{activeTab === 'home' ? 'Lääkkeet' : 'Historia'}</h1></div>
          <div className="flex items-center gap-1">
             {activeTab === 'home' && (
              <>
               <button onClick={() => setShowShoppingList(true)} className="p-2 rounded-full text-slate-400"><ShoppingCart size={20}/></button>
               <button onClick={toggleNotifications} className={`p-2 rounded-full ${notificationsEnabled?'text-blue-500':'text-slate-400'}`}>{notificationsEnabled ? <Bell size={20}/> : <BellOff size={20}/>}</button>
               <button onClick={() => setShowHelp(true)} className="p-2 rounded-full text-slate-400"><HelpCircle size={20}/></button>
               <div className="relative">
                 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-slate-400"><Menu size={24}/></button>
                 {isMenuOpen && (
                   <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-50 p-1 flex flex-col gap-1">
                     <button onClick={() => {setShowAlertsList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-sm"><Bell size={18} className="text-blue-500"/> Hälytyslista</button>
                     <button onClick={() => {setShowAllMedsList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-sm"><List size={18} className="text-blue-500"/> Lääkeluettelo</button>
                     <button onClick={() => {setShowStockList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-sm"><Box size={18} className="text-blue-500"/> Varastolista</button>
                     <button onClick={() => {setShowDosetti(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 hover:bg-slate-50 text-sm"><LayoutList size={18} className="text-blue-500"/> Dosettijako</button>
                     <div className="h-px bg-slate-100"></div>
                     <button onClick={() => {handleLogout(); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 text-sm"><LogOut size={18}/> Kirjaudu ulos</button>
                   </div>
                 )}
               </div>
              </>
             )}
          </div>
        </div>
        <div className="bg-slate-100 p-1 rounded-xl flex mb-1">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab==='home'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Lääkkeet</button>
           <button onClick={() => setActiveTab('stats')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab==='stats'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Historia</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-20 z-0 relative">
         <div className="max-w-md mx-auto space-y-3">
           {activeTab === 'home' && activeMeds.length === 0 && !isAdding && (
             <div className="text-center py-12 text-slate-400">
               <p>Ei lääkkeitä listalla tälle päivälle.</p>
               <div className="flex flex-col gap-3 px-10 mt-4">
                 <button onClick={() => setShowHelp(true)} className="bg-white text-blue-600 border px-4 py-2 rounded-full font-bold shadow-sm text-sm">Tutustu ohjeisiin</button>
                 <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm">Lisää ensimmäinen</button>
               </div>
             </div>
           )}

           {activeTab === 'home' && activeMeds.map(med => {
              const lateClass = getMedStatusColor(med);
              const c = getColors(med.colorKey);
              const lastLog = getLastTaken(med.id);
              const isExpanded = expandedMedId === med.id;
              const today = new Date().toDateString();
              const doneToday = med.scheduleTimes 
                ? Object.keys(med.scheduleTimes).every(sid => logs.some(l => l.medId === med.id && l.slot === sid && new Date(l.timestamp).toDateString() === today))
                : logs.some(l => l.medId === med.id && new Date(l.timestamp).toDateString() === today);

              return (
                <div key={med.id} className={`rounded-xl shadow-sm border transition-all ${c.bg} ${lateClass || c.border} relative`}>
                   <div onClick={() => toggleExpand(med.id)} className="p-4 flex justify-between items-center cursor-pointer">
                      <div className="flex items-center gap-2">
                        {med.ingredients?.length > 0 && <Layers size={20} className="text-slate-600"/>}
                        <h3 className={`text-lg font-bold ${lateClass?'text-red-800':'text-slate-800'}`}>{med.name}</h3>
                        {doneToday && <CheckCircle size={18} className="text-green-600"/>}
                        {lateClass && !doneToday && <AlertTriangle size={18} className="text-red-500"/>}
                      </div>
                      {expandedMedId === med.id ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                   </div>
                   {expandedMedId === med.id && (
                     <div className="px-4 pb-4 border-t border-black/5 pt-3 animate-in slide-in-from-top-1">
                        {med.ingredients?.length > 0 ? (
                          <div className="mb-3 text-sm text-slate-600 bg-white/60 p-2 rounded">{med.ingredients.map((i,x)=><div key={x}>{i.name} ({i.count})</div>)}</div>
                        ) : (
                          <div className={`mb-3 text-sm font-medium bg-white/50 p-2 rounded inline-flex gap-2`}>
                             {med.dosage && <span>{med.dosage}</span>}
                             {med.trackStock && <span className={med.stock <= (med.lowStockLimit||10) ? 'text-red-600 font-bold' : ''}>Varasto: {med.stock} kpl</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3"><Clock size={12}/> {lastLog ? `${getDayLabel(lastLog.timestamp)} ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</div>
                        <div className="flex gap-2 mb-4 justify-end flex-wrap">
                           {med.trackStock && <button onClick={() => handleRefill(med)} className="p-2 bg-white/60 rounded text-green-600"><RefreshCw size={18}/></button>}
                           <button onClick={() => { setManualLogMed(med); setManualDate(new Date().toISOString().slice(0,16)); }} className="p-2 bg-white/60 rounded text-blue-600"><CalendarPlus size={18}/></button>
                           <button onClick={() => setShowHistoryFor(med.id)} className="p-2 bg-white/60 rounded text-blue-600"><History size={18}/></button>
                           <button onClick={() => openEditMed(med)} className="p-2 bg-white/60 rounded text-blue-600"><Pencil size={18}/></button>
                           <button onClick={() => toggleArchive(med)} className="p-2 bg-white/60 rounded text-orange-500"><Archive size={18}/></button>
                           <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white/60 rounded text-red-500"><Trash2 size={18}/></button>
                        </div>
                        {med.scheduleTimes ? (
                          <div className="grid grid-cols-4 gap-2">
                             {TIME_SLOTS.filter(s => (med.schedule||[]).includes(s.id)).map(slot => {
                               const taken = logs.some(l => l.medId === med.id && l.slot === slot.id && new Date(l.timestamp).toDateString() === today);
                               return (
                                 <button key={slot.id} onClick={() => takeMedicine(med, slot.id)} disabled={taken} className={`p-2 rounded border flex flex-col items-center ${taken ? 'bg-green-100 border-green-300' : 'bg-white'}`}>
                                   {taken ? <Check size={20} className="text-green-600"/> : <slot.icon size={20} className="text-slate-500"/>}
                                   <span className="text-[10px] font-bold uppercase mt-1">{slot.label}</span>
                                 </button>
                               );
                             })}
                          </div>
                        ) : (
                          <button onClick={() => takeMedicine(med)} className={`w-full py-3 rounded-lg font-bold text-white shadow ${c.btn}`}>OTA NYT</button>
                        )}
                     </div>
                   )}
                </div>
              );
           })}

           {activeTab === 'stats' && (
             <div className="bg-white p-3 rounded-xl shadow-sm border space-y-4">
                <div className="flex justify-between items-center"><h2 className="font-bold flex gap-2"><Calendar className="text-blue-500"/> Historia</h2></div>
                <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Hae..." value={historySearch} onChange={e => setHistorySearch(e.target.value)}/></div>
                <div className="space-y-3">
                   {getHistoryDates(filteredLogs).map((d,i) => (
                     <div key={i} className="border-b pb-2 last:border-0">
                       <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{getDayLabel(d)}</div>
                       <div className="space-y-2">
                          {getLogsForDate(d, filteredLogs).map(l => (
                            <div key={l.id} onClick={() => openLogEdit(l)} className="flex justify-between p-2 bg-slate-50 rounded border cursor-pointer">
                               <div><span className="font-bold text-sm">{formatTime(l.timestamp)}</span> <span className="text-sm">{getLogName(l)}</span></div>
                               {l.reason && <span className="text-xs italic text-slate-500">{l.reason}</span>}
                            </div>
                          ))}
                       </div>
                     </div>
                   ))}
                </div>
                <button onClick={() => setShowReport(true)} className="w-full py-3 border rounded-xl text-blue-600 font-bold flex justify-center gap-2"><FileText/> Raportti</button>
             </div>
           )}
         </div>
      </main>

      <nav className="flex-none bg-white border-t px-4 py-2 flex justify-around items-center z-20 pb-safe">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab==='home'?'text-blue-600':'text-slate-400'}`}><Pill size={24}/><span className="text-[10px]">Lääkkeet</span></button>
         <img src="https://img.geocaching.com/be1cc7ca-c887-4f38-90b6-813ecf9b342b.png" className="h-10 -mt-4 drop-shadow-md"/>
         <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center ${activeTab==='stats'?'text-blue-600':'text-slate-400'}`}><BarChart2 size={24}/><span className="text-[10px]">Historia</span></button>
      </nav>
      
      {!isAdding && activeTab === 'home' && !showHistoryFor && !deleteDialog.isOpen && !editingMed && !manualLogMed && !takeWithReasonMed && !editingLog && !isQuickAdding && !isReordering && !showStockList && !showAllMedsList && !showAlertsList && !showShoppingList && (
        <div className="absolute bottom-20 right-5 z-30 flex gap-3 items-end">
           <button onClick={() => { setIsQuickAdding(true); setQuickAddDate(new Date().toISOString().slice(0,16)); }} className="bg-orange-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"><Zap size={24}/></button>
           <button onClick={openAddModal} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center"><Plus size={32}/></button>
        </div>
      )}
      
      {/* MODALIT */}
      {showAlertsList && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom">
           <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Hälytykset</h2><button onClick={() => setShowAlertsList(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           <div className="space-y-3">{medications.filter(m => !m.isArchived && m.scheduleTimes).map(m => (<div key={m.id} className="flex justify-between p-4 bg-slate-50 border rounded-xl"><span className="font-bold">{m.name}</span><button onClick={() => toggleNotificationForMed(m)} className={`p-2 rounded-full ${m.reminderEnabled!==false?'bg-blue-100 text-blue-600':'bg-slate-200'}`}>{m.reminderEnabled!==false?<Bell/>:<BellOff/>}</button></div>))}</div>
        </div>
      )}

      {showAllMedsList && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom overflow-y-auto">
           <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Lääkeluettelo</h2><button onClick={() => setShowAllMedsList(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           <div className="space-y-6">
             {['Yksittäiset lääkkeet', 'Dosetit & Yhdistelmät'].map((title, idx) => {
               const isDosett = idx === 1;
               const list = medications.filter(m => !m.isArchived && (isDosett ? (m.ingredients?.length>0) : (!m.ingredients || m.ingredients.length===0))).sort((a,b)=>a.name.localeCompare(b.name));
               return (
                 <div key={idx}><h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{title}</h3>
                   <div className="space-y-2">{list.map(m => (
                     <div key={m.id} className="flex justify-between p-3 border rounded-xl bg-slate-50">
                       <div><div className="font-bold">{m.name}</div><div className="text-xs text-slate-500">{isDosett ? 'Dosetti' : `Varasto: ${m.stock}`}</div></div>
                       <div className="flex gap-2"><button onClick={() => {setShowHistoryFor(m.id); setShowAllMedsList(false)}} className="p-2 border rounded bg-white text-blue-600"><History size={16}/></button><button onClick={() => {openEditMed(m); setShowAllMedsList(false)}} className="p-2 border rounded bg-white text-blue-600"><Pencil size={16}/></button></div>
                     </div>
                   ))}</div>
                 </div>
               )
             })}
           </div>
        </div>
      )}

      {showStockList && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom overflow-y-auto">
           <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Varastolista</h2><button onClick={() => setShowStockList(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           <div className="space-y-3">{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (
             <div key={m.id} className="flex justify-between p-3 border rounded-xl bg-slate-50">
               <div><div className="font-bold">{m.name}</div><div className={`text-xs ${m.stock<=(m.lowStockLimit||10)?'text-red-600 font-bold':'text-slate-500'}`}>Saldo: {m.stock} kpl (Raja: {m.lowStockLimit})</div></div>
               <div className="flex gap-2"><button onClick={() => {setShowHistoryFor(m.id); setShowStockList(false)}} className="p-2 border rounded bg-white"><History size={16}/></button><button onClick={() => openEditMed(m)} className="p-2 border rounded bg-white"><Pencil size={16}/></button></div>
             </div>
           ))}</div>
        </div>
      )}

      {(isAdding || editingMed) && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom overflow-y-auto">
           <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editingMed ? 'Muokkaa' : 'Lisää uusi'}</h2><button onClick={() => {setIsAdding(false); setEditingMed(null)}} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
           <form onSubmit={handleSaveMed}>
             {!editingMed && <div className="flex p-1 bg-slate-100 rounded-xl mb-4"><button type="button" onClick={() => setAddMode('single')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${addMode==='single'?'bg-white shadow text-blue-600':'text-slate-500'}`}>Yksittäinen</button><button type="button" onClick={() => setAddMode('dosett')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${addMode==='dosett'?'bg-white shadow text-blue-600':'text-slate-500'}`}>Dosetti</button></div>}
             <input className="w-full p-4 bg-slate-50 rounded-xl border mb-4 text-lg" placeholder="Nimi" value={editingMed ? editingMed.name : newMedName} onChange={e => editingMed ? setEditingMed({...editingMed, name: e.target.value}) : setNewMedName(e.target.value)}/>
             
             {/* VÄRIVALINTA */}
             <div className="flex flex-wrap gap-2 justify-center mb-4">
               {colorList.map(c => { const clr = getColors(c); const sel = editingMed ? editingMed.colorKey === c : selectedColor === c; return (
                 <button key={c} type="button" onClick={() => editingMed ? setEditingMed({...editingMed, colorKey: c}) : setSelectedColor(c)} className={`w-8 h-8 rounded-full flex items-center justify-center ${sel ? 'ring-2 ring-slate-400 scale-110' : ''}`}><div className={`w-full h-full rounded-full ${clr.dot}`}/></button>
               )})}
             </div>

             {addMode === 'single' && <input className="w-full p-3 bg-slate-50 rounded-xl border mb-4" placeholder="Annostus" value={editingMed ? (editingMed.dosage||'') : newMedDosage} onChange={e => editingMed ? setEditingMed({...editingMed, dosage: e.target.value}) : setNewMedDosage(e.target.value)} />}
             
             {addMode === 'dosett' && (
               <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <label className="text-xs font-bold uppercase text-blue-800">Sisältö</label>
                  <div className="flex gap-2 mt-2 mb-2"><select className="flex-1 p-2 rounded border" value={ingredientName} onChange={e => setIngredientName(e.target.value)}><option value="">Valitse...</option>{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select><input className="w-16 p-2 rounded border" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)}/><button type="button" onClick={addIngredient} className="p-2 bg-blue-600 text-white rounded"><Plus/></button></div>
                  {currentIngredients.map((ing, i) => <div key={i} className="flex justify-between p-2 bg-white border rounded mb-1 text-sm"><span>{ing.name} ({ing.count})</span><div className="flex gap-1"><button type="button" onClick={() => editIngredient(i)}><Pencil size={14}/></button><button type="button" onClick={() => removeIngredient(i)}><Trash2 size={14}/></button></div></div>)}
               </div>
             )}

             {addMode === 'single' && (
               <div className="mb-4 bg-slate-50 p-3 rounded-xl border">
                 <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={editingMed ? editingMed.trackStock : newMedTrackStock} onChange={e => editingMed ? setEditingMed({...editingMed, trackStock: e.target.checked}) : setNewMedTrackStock(e.target.checked)} className="w-4 h-4"/> <span className="font-bold text-sm">Seuraa varastoa</span></label>
                 {(editingMed ? editingMed.trackStock : newMedTrackStock) && <div className="grid grid-cols-2 gap-3 mt-2"><div><label className="text-[10px] uppercase font-bold text-slate-400">Varasto</label><input type="number" className="w-full p-2 border rounded" value={editingMed ? (editingMed.stock||'') : newMedStock} onChange={e => editingMed ? setEditingMed({...editingMed, stock: e.target.value}) : setNewMedStock(e.target.value)}/></div><div><label className="text-[10px] uppercase font-bold text-slate-400">Raja</label><input type="number" className="w-full p-2 border rounded" value={editingMed ? (editingMed.lowStockLimit||10) : newMedLowLimit} onChange={e => editingMed ? setEditingMed({...editingMed, lowStockLimit: e.target.value}) : setNewMedLowLimit(e.target.value)}/></div></div>}
               </div>
             )}

             <div className="mb-4">
               <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Toistuvuus</label>
               <select className="w-full p-3 border rounded-xl mb-3" value={frequencyMode} onChange={e => setFrequencyMode(e.target.value)}><option value="weekdays">Viikonpäivät</option><option value="every_day">Joka päivä</option><option value="every_other">Joka toinen päivä</option></select>
               {frequencyMode === 'weekdays' && <div className="flex justify-between bg-slate-50 p-2 rounded-xl border mb-3">{WEEKDAYS.map(d => { const cur = editingMed ? (editingMed.weekdays||[]) : selectedWeekdays; const sel = cur.includes(d.id); return <button key={d.id} type="button" onClick={() => toggleWeekday(d.id, !!editingMed)} className={`w-8 h-8 rounded-full text-xs font-bold ${sel?'bg-blue-600 text-white':'bg-white border'}`}>{d.label}</button> })}</div>}
               {frequencyMode === 'every_other' && <div className="bg-slate-50 p-3 rounded-xl border mb-3"><label className="text-xs uppercase font-bold text-slate-400">Aloituspäivä</label><input type="date" className="w-full p-2 border rounded bg-white" value={editingMed ? (editingMed.intervalStartDate||'') : intervalStartDate} onChange={e => editingMed ? setEditingMed({...editingMed, intervalStartDate: e.target.value}) : setIntervalStartDate(e.target.value)} /></div>}
             </div>

             <div className="grid grid-cols-1 gap-2 mb-6">
                {TIME_SLOTS.map(slot => {
                  const sch = editingMed ? (editingMed.schedule||[]) : selectedSchedule;
                  const sel = sch.includes(slot.id);
                  const times = editingMed ? (editingMed.scheduleTimes||{}) : scheduleTimes;
                  return <div key={slot.id} className={`flex items-center gap-3 p-3 border rounded-xl ${sel?'bg-blue-50 border-blue-500':''}`}><button type="button" onClick={() => toggleScheduleSlot(slot.id, !!editingMed)} className="flex-1 flex items-center gap-3"><slot.icon size={20} className={sel?'text-blue-600':'text-slate-400'}/><span className="font-bold text-sm uppercase">{slot.label}</span></button>{sel && <input type="time" className="border rounded p-1" value={times[slot.id] || slot.defaultTime} onChange={e => handleTimeChange(slot.id, e.target.value, !!editingMed)} />}</div>
                })}
             </div>

             <div className="flex gap-3"><button type="button" onClick={() => {setIsAdding(false); setEditingMed(null)}} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Peruuta</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Tallenna</button></div>
           </form>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {isQuickAdding && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom">
           <h2 className="text-xl font-bold mb-4 flex gap-2"><Zap className="text-orange-500"/> Pikalisäys</h2>
           <form onSubmit={handleQuickAdd}>
             <select className="w-full p-4 bg-slate-50 border rounded-xl mb-4" onChange={e => { const m = medications.find(x => x.id === e.target.value); if(m) setQuickAddName(m.name); }}>
               <option value="">Valitse listalta...</option>
               {medications.filter(m => !m.isArchived).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
             <input className="w-full p-4 bg-slate-50 border rounded-xl mb-4" placeholder="Tai kirjoita nimi..." value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
             <div className="grid grid-cols-2 gap-3 mb-4">
               <input type="datetime-local" className="p-3 bg-slate-50 border rounded-xl" value={quickAddDate} onChange={e => setQuickAddDate(e.target.value)} />
               <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Syy (valinnainen)" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)} />
             </div>
             <div className="flex gap-3">
               <button type="button" onClick={() => setIsQuickAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Peruuta</button>
               <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold">Kirjaa</button>
             </div>
           </form>
        </div>
      )}

      {takeWithReasonMed && (
        <div className="absolute inset-0 z-50 bg-white p-5 animate-in slide-in-from-bottom flex flex-col justify-center">
            <h2 className="text-xl font-bold mb-2">Ota {takeWithReasonMed.name}</h2>
            <form onSubmit={handleConfirmTakeWithReason}>
              <input autoFocus className="w-full p-4 bg-slate-50 border rounded-xl mb-4" placeholder="Syy (valinnainen)" value={takeReason} onChange={e => setTakeReason(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setTakeWithReasonMed(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Peruuta</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Kirjaa</button>
              </div>
            </form>
        </div>
      )}

      {editingLog && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h2 className="text-lg font-bold mb-4">Muokkaa merkintää</h2>
             <input type="datetime-local" className="w-full p-3 bg-slate-50 border rounded-xl mb-4" value={editingLogDate} onChange={e => setEditingLogDate(e.target.value)} />
             <input className="w-full p-3 bg-slate-50 border rounded-xl mb-6" value={editingLogReason} onChange={e => setEditingLogReason(e.target.value)} placeholder="Syy" />
             <div className="flex gap-3">
               <button onClick={requestDeleteLog} className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2/></button>
               <button onClick={handleSaveLogEdit} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Tallenna</button>
               <button onClick={() => setEditingLog(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Peruuta</button>
             </div>
           </div>
        </div>
      )}

      {deleteDialog.isOpen && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h2 className="text-lg font-bold text-red-600 mb-2">Poista?</h2>
             <p className="text-slate-600 mb-6">Haluatko varmasti jatkaa?</p>
             <div className="flex flex-col gap-3">
               {deleteDialog.mode === 'med' ? (
                 <><button onClick={handleDeleteKeepHistory} className="w-full py-3 border-2 rounded-xl font-bold">Poista, säästä historia</button><button onClick={handleDeleteAll} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold">Poista kaikki</button></>
               ) : (
                 <button onClick={handleDeleteAll} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold">Poista</button>
               )}
               <button onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })} className="w-full py-3 text-slate-400 font-bold">Peruuta</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<MedicineTracker />);
