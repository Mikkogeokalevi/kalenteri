import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, Pill, Trash2, X, BarChart2, Pencil, LogOut, Loader2, ArchiveRestore, 
  ChevronDown, ChevronUp, Zap, Bell, BellOff, ArrowUpDown, Package, Clipboard, 
  RotateCcw, ShoppingCart, LayoutList, Box, Menu 
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';

// Tuodaan omat moduulit
import { TIME_SLOTS, getColors, colorList, getCurrentDateTimeLocal } from './utils.js';
import { AuthScreen } from './auth.js';
import { MedicationCard, StatsView, HelpView } from './components.js';

// --- FIREBASE ASETUKSET ---
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

// --- PÄÄSOVELLUS (MedicineTracker) ---
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedMeds, setReportSelectedMeds] = useState(new Set());

  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCount, setIngredientCount] = useState('');
  const [currentIngredients, setCurrentIngredients] = useState([]); 
  const [showOnDashboard, setShowOnDashboard] = useState(true);

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
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

  // --- LOGIIKKA ALKAA ---
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

  const handleLogout = () => { if(window.confirm("Kirjaudutaanko ulos?")) signOut(auth); };

  const getSmartColor = () => {
    const activeMeds = medications.filter(m => !m.isArchived);
    const usedColors = new Set(activeMeds.map(m => m.colorKey));
    return colorList.find(c => !usedColors.has(c)) || colorList[medications.length % colorList.length];
  };

  const openAddModal = () => {
    setNewMedName(''); setNewMedDosage(''); setNewMedStock(''); setNewMedTrackStock(false);
    setNewMedLowLimit('10'); setNewMedIsCourse(false); 
    setSelectedColor(getSmartColor()); setSelectedSchedule([]); setScheduleTimes({});
    setCurrentIngredients([]);
    setShowOnDashboard(true);
    setIsAdding(true);
  };

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
      setNewMedName(''); setIsAdding(false); setCurrentIngredients([]);
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

  const takeMedicine = async (med, slotId = null, reasonText = '') => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: med.id, medName: med.name, medColor: med.colorKey, slot: slotId, 
        timestamp: new Date().toISOString(), reason: reasonText.trim()
      });
      if (med.trackStock && med.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
         await updateDoc(medRef, { stock: med.stock - 1 });
      }
      if (med.ingredients && med.ingredients.length > 0) {
        for (const ing of med.ingredients) {
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

  const handleManualLog = async (e) => {
    e.preventDefault();
    if (!manualLogMed || !manualDate || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: manualLogMed.id, medName: manualLogMed.name, medColor: manualLogMed.colorKey, slot: null, 
        timestamp: new Date(manualDate).toISOString(), reason: manualReason.trim()
      });
      if (manualLogMed.trackStock && manualLogMed.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', manualLogMed.id);
         await updateDoc(medRef, { stock: manualLogMed.stock - 1 });
      }
      setManualLogMed(null); setManualDate(''); setManualReason('');
    } catch (error) { alert("Virhe lisäyksessä."); }
  };

  const handleRefill = async (med) => {
    if (!user) return;
    const amount = prompt("Paljonko lisätään varastoon?", "30");
    if (amount && !isNaN(amount)) {
       const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', med.id);
       await updateDoc(medRef, { stock: (med.stock || 0) + parseInt(amount) });
    }
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

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddName.trim() || !user) return;
    const stockItem = medications.find(m => m.name.toLowerCase() === quickAddName.trim().toLowerCase() && m.trackStock);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'logs'), {
        medId: stockItem ? stockItem.id : 'quick_dose', medName: quickAddName.trim(), 
        medColor: stockItem ? stockItem.colorKey : 'orange', slot: null, timestamp: new Date().toISOString(), reason: quickAddReason.trim()
      });
      if (stockItem && stockItem.stock > 0) {
         const medRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'medications', stockItem.id);
         await updateDoc(medRef, { stock: stockItem.stock - 1 });
      }
      setQuickAddName(''); setQuickAddReason(''); setIsQuickAdding(false);
    } catch(e) { alert("Virhe pikalisäyksessä"); }
  };
  
  const handleConfirmTakeWithReason = async (e) => {
    e.preventDefault();
    if(!takeWithReasonMed) return;
    await takeMedicine(takeWithReasonMed, null, takeReason);
    setTakeWithReasonMed(null);
    setTakeReason('');
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
      await updateDoc(logRef, { timestamp: new Date(editingLogDate).toISOString(), reason: editingLogReason.trim() });
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
     try { await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'logs', deleteDialog.logId)); } catch(e) { alert("Poisto epäonnistui"); }
     setDeleteDialog({ isOpen: false, mode: null, medId: null, logId: null });
  };

  const generateReportText = () => {
    if (!reportStartDate || !reportEndDate) return "Valitse päivämäärät.";
    const start = new Date(reportStartDate); start.setHours(0,0,0,0);
    const end = new Date(reportEndDate); end.setHours(23,59,59,999);
    const filteredLogs = logs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= start && d <= end && (reportSelectedMeds.has(l.medId) || l.medId === 'quick_dose');
    });
    
    const medStats = {};
    Array.from(reportSelectedMeds).forEach(medId => {
       const med = medications.find(m => m.id === medId);
       if(med) medStats[med.name] = { count: 0, logs: [], isScheduled: med.schedule && med.schedule.length > 0 };
    });
    filteredLogs.forEach(log => {
      const name = log.medId === 'quick_dose' ? (log.medName || 'Pikalisäys') : (medications.find(m => m.id === log.medId)?.name || log.medName);
      if (!name) return;
      if (!medStats[name]) medStats[name] = { count: 0, logs: [], isScheduled: false };
      medStats[name].count++;
      medStats[name].logs.push(log);
    });
    let text = `LÄÄKKEIDEN KÄYTTÖ\n`;
    text += `Aikaväli: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}\n\nYHTEENVETO:\n`;
    Object.entries(medStats).sort((a,b) => b[1].count - a[1].count).forEach(([name, data]) => {
      text += `- ${name}: ${data.count} kpl\n`;
    });
    text += `\n-----------------------------\nERITTELY:\n\n`;
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
          Object.entries(days).forEach(([day, slots]) => text += `${day}: ${slots.join(', ')}\n`);
       } else {
          data.logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(log => {
             const d = new Date(log.timestamp);
             const timeStr = d.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'});
             text += `${timeStr}${log.reason ? ` - "${log.reason}"` : ''}\n`;
          });
       }
       text += `\n`;
    });
    return text;
  };

  const copyReport = () => { navigator.clipboard.writeText(generateReportText()).then(() => alert("Raportti kopioitu!")).catch(()=>alert("Virhe")); };
  const toggleReportMedSelection = (medId) => { const newSet = new Set(reportSelectedMeds); if (newSet.has(medId)) newSet.delete(medId); else newSet.add(medId); setReportSelectedMeds(newSet); };

  const activeMeds = medications.filter(m => !m.isArchived && (m.showOnDashboard !== false));
  const archivedMeds = medications.filter(m => m.isArchived);
  const shoppingListMeds = medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse && (m.stock !== null && m.stock <= (m.lowStockLimit || 10)));
  
  const scheduledMeds = activeMeds.filter(m => m.schedule && m.schedule.length > 0);
  let totalDoses = 0;
  let takenDoses = 0;
  scheduledMeds.forEach(med => { med.schedule.forEach(slotId => { totalDoses++; if (isSlotTakenToday(med.id, slotId)) takenDoses++; }); });
  const dailyProgress = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!user) return <AuthScreen auth={auth} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden select-none relative">
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
                <button onClick={requestNotificationPermission} className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
                  {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>
                <div className="relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><Menu size={24} /></button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-100 z-50 p-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => {setShowStockList(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><Box size={18} className="text-blue-500"/> Varastolista</button>
                        <button onClick={() => {setShowDosetti(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><LayoutList size={18} className="text-blue-500"/> Dosettijako</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => {setIsReordering(!isReordering); setIsMenuOpen(false);}} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-left ${isReordering ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}><ArrowUpDown size={18} className={isReordering ? 'text-blue-600' : 'text-slate-400'}/> Järjestä</button>
                        <button onClick={() => {setShowHelp(true); setIsMenuOpen(false);}} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium text-left"><HelpCircle size={18} className="text-slate-400"/> Ohjeet</button>
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
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Pill size={16} /> Lääkkeet</button>
          <button onClick={() => setActiveTab('stats')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart2 size={16} /> Historia</button>
        </div>
        
        {activeTab === 'home' && !isReordering && dailyProgress > 0 && (
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{width: `${dailyProgress}%`}}></div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-20 z-0 relative">
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
              {activeMeds.map((med, index) => (
                <MedicationCard
                  key={med.id}
                  med={med}
                  index={index}
                  isReordering={isReordering}
                  isExpanded={expandedMedId === med.id}
                  toggleExpand={(id) => setExpandedMedId(expandedMedId === id ? null : id)}
                  moveMedication={moveMedication}
                  activeMedsLength={activeMeds.length}
                  logs={logs}
                  takeMedicine={takeMedicine}
                  setManualLogMed={(m) => { setManualLogMed(m); setManualDate(getCurrentDateTimeLocal()); }}
                  setShowHistoryFor={setShowHistoryFor}
                  setEditingMed={(m) => { openEditMed(m); }}
                  toggleArchive={toggleArchive}
                  requestDeleteMed={requestDeleteMed}
                  handleRefill={handleRefill}
                />
              ))}
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
                            <button onClick={() => toggleArchive(med)} className="p-2 bg-white rounded-lg text-slate-500 hover:text-blue-600"><ArchiveRestore size={18}/></button>
                            <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white rounded-lg text-slate-500 hover:text-red-600"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'stats' && <StatsView medications={medications} logs={logs} setShowReport={setShowReport} openLogEdit={openLogEdit} />}
          </>
          )}
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center z-20 pb-safe">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><Pill size={22} strokeWidth={activeTab==='home'?2.5:2} /> <span className="text-[10px] font-bold">Lääkkeet</span></button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'stats' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><BarChart2 size={22} strokeWidth={activeTab==='stats'?2.5:2} /> <span className="text-[10px] font-bold">Historia</span></button>
      </nav>

      {!isAdding && activeTab === 'home' && !showHistoryFor && !deleteDialog.isOpen && !editingMed && !manualLogMed && !takeWithReasonMed && !editingLog && !isQuickAdding && !isReordering && !showStockList && (
        <>
          <button onClick={() => window.location.reload()} className="absolute bottom-20 left-5 z-30 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 border border-slate-200"><RotateCcw size={24} /></button>
          <div className="absolute bottom-20 right-5 z-30 flex gap-3 items-end">
            <button onClick={() => setIsQuickAdding(true)} className="bg-orange-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"><Zap size={24}/></button>
            <button onClick={openAddModal} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"><Plus size={32}/></button>
          </div>
        </>
      )}

      {/* --- MODALIT --- */}
      {showStockList && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-800"><Box/> Varastolista</h2><button onClick={() => setShowStockList(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             <div className="space-y-3">{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(med => (<div key={med.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl"><div><div className="font-bold text-slate-800">{med.name}</div><div className={`text-xs font-bold ${med.stock <= med.lowStockLimit ? 'text-red-500' : 'text-slate-500'}`}>Saldo: {med.stock} kpl (Raja: {med.lowStockLimit})</div></div><button onClick={() => openEditMed(med)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600"><Pencil size={16}/></button></div>))}</div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {showDosetti && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-blue-600"><LayoutList/> Dosettijako</h2><button onClick={() => setShowDosetti(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             <div className="space-y-6">{TIME_SLOTS.map(slot => { const medsForSlot = medications.filter(m => !m.isArchived && m.schedule && m.schedule.includes(slot.id)); return (<div key={slot.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase text-sm border-b border-slate-200 pb-1"><slot.icon size={16} className="text-blue-500"/> {slot.label}</h3>{medsForSlot.length === 0 ? <p className="text-xs text-slate-400 italic">Ei lääkkeitä.</p> : (<ul className="space-y-2">{medsForSlot.map(med => { if (med.ingredients && med.ingredients.length > 0) { return med.ingredients.map((ing, idx) => (<li key={`${med.id}-${idx}`} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><span className="font-medium text-sm text-slate-700">{ing.name}</span><span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{ing.count}</span></li>)); } else { return (<li key={med.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><span className="font-medium text-sm text-slate-700">{med.name}</span><span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{med.dosage || '1 kpl'}</span></li>); } })}</ul>)}</div>); })}</div>
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
             <div className="flex justify-between items-center mb-4 flex-none"><h2 className="text-lg font-bold">Luo raportti</h2><button onClick={() => setShowReport(false)} className="p-1 bg-slate-100 rounded-full"><X size={18}/></button></div>
             <div className="flex-1 overflow-y-auto pr-2"><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alkaen</label><input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Päättyen</label><input type="date" className="w-full bg-slate-50 p-2 rounded-lg text-sm border" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} /></div></div><div><div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-slate-500 uppercase">Valitse lääkkeet</label><button onClick={() => { const allIds = medications.filter(m => !m.isArchived).map(m => m.id); setReportSelectedMeds(reportSelectedMeds.size === allIds.length ? new Set() : new Set(allIds)); }} className="text-xs text-blue-600 font-bold">Valitse/Poista kaikki</button></div><div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50">{medications.filter(m => !m.isArchived).map(med => (<label key={med.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={reportSelectedMeds.has(med.id)} onChange={() => toggleReportMedSelection(med.id)} /><span className="text-sm font-medium text-slate-700 truncate">{med.name}</span></label>))}</div></div></div></div>
             <div className="flex-none pt-4 mt-2 border-t"><pre className="bg-slate-50 p-3 rounded-xl text-[10px] font-mono overflow-auto h-32 whitespace-pre-wrap mb-3 border">{generateReportText()}</pre><button onClick={copyReport} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"><Clipboard size={18} /> Kopioi leikepöydälle</button></div>
           </div>
        </div>
      )}

      {showShoppingList && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold flex items-center gap-2 text-red-600"><ShoppingCart/> Ostoslista</h2><button onClick={() => setShowShoppingList(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
             {shoppingListMeds.length === 0 ? <div className="text-center text-slate-400 py-8">Kaikki lääkkeet hyvässä tilanteessa!</div> : (<div className="space-y-3">{shoppingListMeds.map(med => (<div key={med.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-xl"><div><div className="font-bold text-slate-800">{med.name}</div><div className="text-xs text-red-600 font-bold">Jäljellä: {med.stock} kpl (Raja: {med.lowStockLimit||10})</div></div><Package className="text-red-300" size={24}/></div>))}</div>)}
             <div className="h-6"></div>
          </div>
        </div>
      )}

      {showHelp && <HelpView onClose={() => setShowHelp(false)} />}

      {isQuickAdding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="text-orange-500"/> Kirjaa kertaluontoinen</h2>
            <form onSubmit={handleQuickAdd}>
              <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (<button key={m.id} type="button" onClick={() => setQuickAddName(m.name)} className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 active:bg-blue-100 active:border-blue-300 active:text-blue-700">{m.name}</button>))}</div>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-orange-500" placeholder="Mitä otit? (esim. Burana)" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-sm mb-4 outline-none border focus:border-orange-500" placeholder="Syy (valinnainen, esim. Päänsärky)" value={quickAddReason} onChange={e => setQuickAddReason(e.target.value)} />
              <div className="flex gap-3"><button type="button" onClick={() => setIsQuickAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button><button type="submit" disabled={!quickAddName.trim()} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">Kirjaa</button></div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {takeWithReasonMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-1"><h2 className="text-lg font-bold">Ota lääke</h2><button onClick={() => setTakeWithReasonMed(null)} className="p-1 bg-slate-100 rounded-full"><X size={16}/></button></div>
            <p className="text-sm text-slate-500 mb-4">{takeWithReasonMed.name}</p>
            <form onSubmit={handleConfirmTakeWithReason}>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-4 outline-none border focus:border-blue-500" placeholder="Syy (valinnainen, esim. Kipu)" value={takeReason} onChange={e => setTakeReason(e.target.value)} />
              <div className="flex gap-3"><button type="button" onClick={() => setTakeWithReasonMed(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg">Kirjaa</button></div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Lisää lääke</h2>
            <form onSubmit={handleAddMedication}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valitse väri</label>
              <div className="flex flex-wrap gap-3 justify-center mb-6">{colorList.map(c => { const colors = getColors(c); const isSelected = selectedColor === c; return (<button key={c} type="button" onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}><div className={`w-full h-full rounded-full ${colors.dot} shadow-sm`} /></button>); })}</div>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" placeholder="Lääkkeen nimi" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-base mb-6 outline-none border focus:border-blue-500" placeholder="Annostus / Lisätiedot (valinnainen)" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
              <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200"><input type="checkbox" checked={showOnDashboard} onChange={(e) => setShowOnDashboard(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-slate-700">Näytä etusivulla</span></label></div>
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Koostumus / Dosetti</label>
                 <div className="flex gap-2 mb-2"><select className="flex-1 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" value={ingredientName} onChange={e => setIngredientName(e.target.value)}><option value="">Valitse lääke varastosta...</option>{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}</select><input className="w-20 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)} /><button type="button" onClick={addIngredient} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={18}/></button></div>
                 <div className="space-y-2">{currentIngredients.map((ing, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-sm"><span>{ing.name} <span className="text-slate-400 font-normal">({ing.count})</span></span><button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>))}</div>
              </div>
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={newMedTrackStock} onChange={(e) => setNewMedTrackStock(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-slate-700">Seuraa lääkevarastoa</span></label>
                {newMedTrackStock && (<div className="animate-in slide-in-from-top-2 space-y-3 border-t border-slate-200 pt-3 mt-2"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varastossa (kpl)</label><input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Esim. 100" value={newMedStock} onChange={e => setNewMedStock(e.target.value)} /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hälytysraja (kpl)</label><input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Oletus 10" value={newMedLowLimit} onChange={e => setNewMedLowLimit(e.target.value)} /></div><label className="flex items-center gap-2 cursor-pointer pt-2"><input type="checkbox" checked={newMedIsCourse} onChange={(e) => setNewMedIsCourse(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><div><span className="text-sm font-bold text-slate-700 block">Tämä on kuuri</span></div></label></div>)}
              </div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Otettava (valinnainen)</label>
              <div className="grid grid-cols-1 gap-2 mb-6">{TIME_SLOTS.map(slot => { const isSelected = selectedSchedule.includes(slot.id); return (<div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}><button type="button" onClick={() => toggleScheduleSlot(slot.id)} className={`flex-1 flex items-center gap-3`}><div className={`p-2 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}><slot.icon size={20}/></div><span className={`text-sm font-bold uppercase ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>{slot.label}</span></button>{isSelected && (<input type="time" className="bg-white border border-blue-200 text-blue-800 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400" value={scheduleTimes[slot.id] || slot.defaultTime} onChange={(e) => handleTimeChange(slot.id, e.target.value)} />)}</div>); })}</div>
              <div className="flex gap-3"><button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button><button type="submit" disabled={!newMedName.trim()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Tallenna</button></div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {editingMed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Muokkaa</h2>
            <form onSubmit={handleUpdateMedication}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Väri</label>
              <div className="flex flex-wrap gap-3 justify-center mb-6">{colorList.map(c => { const colors = getColors(c); const isSelected = editingMed.colorKey === c; return (<button key={c} type="button" onClick={() => setEditingMed({...editingMed, colorKey: c})} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}><div className={`w-full h-full rounded-full ${colors.dot} shadow-sm`} /></button>); })}</div>
              <input autoFocus className="w-full bg-slate-50 p-3 rounded-xl text-base mb-3 outline-none border focus:border-blue-500" value={editingMed.name} onChange={e => setEditingMed({...editingMed, name: e.target.value})} />
              <input className="w-full bg-slate-50 p-3 rounded-xl text-base mb-6 outline-none border focus:border-blue-500" placeholder="Annostus / Lisätiedot" value={editingMed.dosage || ''} onChange={e => setEditingMed({...editingMed, dosage: e.target.value})} />
              <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200"><input type="checkbox" checked={editingMed.showOnDashboard !== false} onChange={(e) => setEditingMed({...editingMed, showOnDashboard: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-slate-700">Näytä etusivulla</span></label></div>
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Koostumus / Dosetti</label>
                 <div className="flex gap-2 mb-2"><select className="flex-1 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" value={ingredientName} onChange={e => setIngredientName(e.target.value)}><option value="">Valitse lääke varastosta...</option>{medications.filter(m => !m.isArchived && m.trackStock && !m.isCourse).map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}</select><input className="w-20 bg-white p-2 rounded-lg text-sm border focus:border-blue-500" placeholder="Määrä" value={ingredientCount} onChange={e => setIngredientCount(e.target.value)} /><button type="button" onClick={addIngredient} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={18}/></button></div>
                 <div className="space-y-2">{currentIngredients.map((ing, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-sm"><span>{ing.name} <span className="text-slate-400 font-normal">({ing.count})</span></span><button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>))}</div>
              </div>
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={editingMed.trackStock || false} onChange={(e) => setEditingMed({...editingMed, trackStock: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><span className="text-sm font-bold text-slate-700">Seuraa lääkevarastoa</span></label>
                {editingMed.trackStock && (<div className="animate-in slide-in-from-top-2 space-y-3 border-t border-slate-200 pt-3 mt-2"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Varastossa (kpl)</label><input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Esim. 100" value={editingMed.stock !== null && editingMed.stock !== undefined ? editingMed.stock : ''} onChange={e => setEditingMed({...editingMed, stock: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hälytysraja (kpl)</label><input type="number" className="w-full bg-white p-2 rounded-lg text-base outline-none border focus:border-blue-500" placeholder="Oletus 10" value={editingMed.lowStockLimit || 10} onChange={e => setEditingMed({...editingMed, lowStockLimit: e.target.value})} /></div><label className="flex items-center gap-2 cursor-pointer pt-2"><input type="checkbox" checked={editingMed.isCourse || false} onChange={(e) => setEditingMed({...editingMed, isCourse: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /><div><span className="text-sm font-bold text-slate-700 block">Tämä on kuuri</span></div></label></div>)}
              </div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Otettava</label>
              <div className="grid grid-cols-1 gap-2 mb-6">{TIME_SLOTS.map(slot => { const currentSchedule = editingMed.schedule || []; const isSelected = currentSchedule.includes(slot.id); const currentTime = editingMed.scheduleTimes?.[slot.id] || slot.defaultTime; return (<div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}><button type="button" onClick={() => toggleScheduleSlot(slot.id, true)} className={`flex-1 flex items-center gap-3`}><div className={`p-2 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}><slot.icon size={20}/></div><span className={`text-sm font-bold uppercase ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>{slot.label}</span></button>{isSelected && (<input type="time" className="bg-white border border-blue-200 text-blue-800 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400" value={currentTime} onChange={(e) => handleTimeChange(slot.id, e.target.value, true)} />)}</div>); })}</div>
              <div className="flex gap-3"><button type="button" onClick={() => setEditingMed(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm">Peruuta</button><button type="submit" disabled={!editingMed.name.trim()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Tallenna</button></div>
            </form>
            <div className="h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- RENDERÖINTI ---
const root = createRoot(document.getElementById('root'));
root.render(<MedicineTracker />);
