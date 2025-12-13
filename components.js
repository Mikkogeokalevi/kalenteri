import React from 'react';
import { 
  Plus, Pill, Clock, Trash2, CheckCircle, History, X, BarChart2, Calendar, AlertTriangle, 
  Pencil, CalendarPlus, Archive, ArchiveRestore, ChevronDown, ChevronUp, Check, 
  Package, RefreshCw, FileText, Layers, ArrowUp, ArrowDown, HelpCircle, PlusSquare 
} from 'lucide-react';

import { getColors, TIME_SLOTS, formatTime, getDayLabel } from './utils.js';

// --- HelpView ---
export const HelpView = ({ onClose }) => {
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
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <PlusSquare className="text-slate-500" size={22}/> Asenna puhelimeen
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Tämä on selainpohjainen sovellus. Saat parhaan käyttökokemuksen lisäämällä sen kotivalikkoon.
          </p>
        </section>
        <div className="text-center text-xs text-slate-400 pt-6 pb-2">
          Lääkemuistio v3.1 - {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

// --- MedicationCard ---
export const MedicationCard = ({ 
  med, index, isReordering, isExpanded, toggleExpand, moveMedication, 
  activeMedsLength, logs, takeMedicine, setManualLogMed, setShowHistoryFor, 
  setEditingMed, toggleArchive, requestDeleteMed, handleRefill 
}) => {
  const lastLog = logs.filter(x => x.medId === med.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
  const c = getColors(med.colorKey || 'blue');
  const hasSchedule = med.schedule && med.schedule.length > 0;
  const isCombo = med.ingredients && med.ingredients.length > 0;
  const isLowStock = !isCombo && med.trackStock && !med.isCourse && med.stock !== null && med.stock <= (med.lowStockLimit || 10);
  
  let isDoneForToday = false;
  const todayStr = new Date().toDateString();
  if (hasSchedule) {
    isDoneForToday = med.schedule.every(slotId => 
      logs.some(l => l.medId === med.id && l.slot === slotId && new Date(l.timestamp).toDateString() === todayStr)
    );
  } else {
    isDoneForToday = logs.some(l => l.medId === med.id && new Date(l.timestamp).toDateString() === todayStr);
  }

  return (
    <div className={`rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${c.bg} ${c.border} ${!isExpanded?'hover:shadow-md':''} relative group`}>
      {isReordering && (
        <div className="absolute right-0 top-0 bottom-0 w-14 flex flex-col justify-center gap-2 pr-2 bg-gradient-to-l from-white/80 via-white/50 to-transparent z-30">
          <button onClick={(e) => { e.stopPropagation(); moveMedication(index, -1); }} disabled={index === 0} className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"><ArrowUp size={18} /></button>
          <button onClick={(e) => { e.stopPropagation(); moveMedication(index, 1); }} disabled={index === activeMedsLength - 1} className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed mx-auto"><ArrowDown size={18} /></button>
        </div>
      )}
      <div onClick={() => !isReordering && toggleExpand(med.id)} className={`p-4 flex justify-between items-center ${!isReordering ? 'cursor-pointer active:bg-black/5' : ''}`}>
        <div className="flex-1 min-w-0 pr-3">
           <div className="flex items-center gap-2">
              {isCombo && <Layers size={20} className="text-slate-600" />}
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{med.name}</h3>
              {!isExpanded && isDoneForToday && <CheckCircle size={18} className="text-green-600 shrink-0" />}
              {!isExpanded && isLowStock && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
           </div>
           {!isExpanded && (
             <div className="flex items-center gap-2 mt-1">
               {isCombo ? <span className="text-xs font-bold text-slate-500 bg-white/50 px-1.5 py-0.5 rounded uppercase tracking-wider">Dosetti</span> : isLowStock ? <span className="text-xs text-red-600 font-bold truncate">{med.stock} kpl jäljellä!</span> : med.trackStock && med.isCourse ? <span className="text-xs text-slate-500 font-bold truncate">Kuuri: {med.stock} kpl</span> : med.dosage ? <span className="text-xs text-slate-600 font-medium truncate">{med.dosage}</span> : <span className="text-xs text-slate-500 truncate">{lastLog ? `Viimeksi: ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span>}
             </div>
           )}
        </div>
        {!isReordering && (<div className="text-slate-400">{isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>)}
      </div>

      {isExpanded && !isReordering && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
           <div className="border-t border-black/5 mb-3 pt-1"></div>
           {isCombo && (
             <div className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg mb-3 border border-slate-100">
               <div className="flex items-center gap-2 mb-2"><Layers size={14} className="text-slate-400"/><span className="font-bold uppercase text-[10px] text-slate-500">Sisältö</span></div>
               <div className="space-y-1">{med.ingredients.map((ing, idx) => (<div key={idx} className="flex justify-between border-b border-slate-200 last:border-0 pb-1 last:pb-0"><span className="font-medium">{ing.name}</span><span className="text-slate-500">{ing.count} kpl</span></div>))}</div>
             </div>
           )}
           {!isCombo && med.dosage && <div className="text-sm text-slate-700 mb-2 font-medium bg-white/50 p-2 rounded-lg inline-block mr-2">{med.dosage}</div>}
           {!isCombo && med.trackStock && <div className={`text-sm mb-3 font-medium bg-white/50 p-2 rounded-lg inline-flex items-center gap-2 ${isLowStock ? 'text-red-600 border border-red-200' : 'text-slate-700'}`}><Package size={14} /> <span>{med.stock !== null ? med.stock : 0} kpl</span></div>}
           <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium mb-4"><Clock size={12} /><span>{lastLog ? `${getDayLabel(lastLog.timestamp)} klo ${formatTime(lastLog.timestamp)}` : 'Ei otettu vielä'}</span></div>
           <div className="flex gap-2 mb-4 justify-end flex-wrap">
              {!isCombo && med.trackStock && <button onClick={() => handleRefill(med)} className="p-2 bg-white/60 rounded-lg hover:text-green-600 hover:bg-white flex items-center gap-1" title="Täydennä varastoa"><RefreshCw size={18}/></button>}
              <button onClick={() => { setManualLogMed(med); }} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Lisää manuaalisesti"><CalendarPlus size={18}/></button>
              <button onClick={() => setShowHistoryFor(med.id)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Historia"><History size={18}/></button>
              <button onClick={() => setEditingMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-blue-600 hover:bg-white" title="Muokkaa"><Pencil size={18}/></button>
              <button onClick={() => toggleArchive(med)} className="p-2 bg-white/60 rounded-lg hover:text-orange-500 hover:bg-white" title="Arkistoi"><Archive size={18}/></button>
              <button onClick={() => requestDeleteMed(med)} className="p-2 bg-white/60 rounded-lg hover:text-red-500 hover:bg-white" title="Poista"><Trash2 size={18}/></button>
           </div>
           {hasSchedule ? (
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.filter(slot => med.schedule.includes(slot.id)).map(slot => {
                  const isTaken = logs.some(l => l.medId === med.id && l.slot === slot.id && new Date(l.timestamp).toDateString() === todayStr);
                  const scheduleTime = med.scheduleTimes?.[slot.id] || slot.defaultTime;
                  return (
                    <button key={slot.id} onClick={() => takeMedicine(med, slot.id)} disabled={isTaken} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isTaken ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 active:scale-95'}`}>
                      {isTaken ? <Check size={20} strokeWidth={3} /> : <slot.icon size={20} />}
                      <span className="text-[10px] font-bold mt-1 uppercase">{slot.label}</span>
                      {!isTaken && <span className="text-[9px] text-slate-400">{scheduleTime}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button onClick={() => takeMedicine(med)} className={`w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform ${c.btn}`}><CheckCircle size={20} /> OTA NYT</button>
            )
           }
        </div>
      )}
    </div>
  );
};

// --- StatsView ---
export const StatsView = ({ medications, logs, setShowReport, openLogEdit }) => {
  const getLogName = (log) => { const med = medications.find(m => m.id === log.medId); return med ? med.name : (log.medName || 'Poistettu lääke'); };
  const getLogColorKey = (log) => { const med = medications.find(m => m.id === log.medId); return med ? med.colorKey : (log.medColor || 'blue'); };
  const getHistoryDates = () => { const dates = [...new Set(logs.map(log => new Date(log.timestamp).toDateString()))]; return dates.sort((a, b) => new Date(b) - new Date(a)); };
  const getLogsForDate = (dateObj) => logs.filter(l => new Date(l.timestamp).toDateString() === dateObj.toDateString()).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));

  return (
    <div className="space-y-4">
      <button onClick={() => setShowReport(true)} className="w-full bg-white border border-blue-200 text-blue-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"><FileText size={20}/> Raportti (Valitse & Tulosta)</button>
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Lääkkeet</h3>
        <div className="flex flex-wrap gap-2">{medications.map(med => { const c = getColors(med.colorKey || 'blue'); return (<div key={med.id} className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${c.bg} ${c.border} ${med.isArchived ? 'opacity-50' : ''}`}><div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /><span className="text-xs font-bold text-slate-700">{med.name} {med.isArchived && '(arkisto)'}</span></div>); })}</div>
      </div>
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Calendar className="text-blue-500" size={18}/> Koko historia</h2>
        <div className="space-y-3">
          {getHistoryDates().map((dayStr, i) => {
            const logsNow = getLogsForDate(new Date(dayStr)); const dayDate = new Date(dayStr); const isToday = dayDate.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`border-b border-slate-50 pb-2 last:border-0 ${isToday ? 'bg-blue-50/40 -mx-2 px-2 rounded-lg py-2 border-none' : ''}`}>
                <div className={`text-[10px] font-bold uppercase mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{getDayLabel(dayDate.toISOString())}</div>
                <div className="flex flex-wrap gap-2">
                  {logsNow.map(log => {
                    const cKey = getLogColorKey(log); const c = getColors(cKey);
                    return (<button key={log.id} onClick={() => openLogEdit(log)} className={`flex flex-col items-start gap-0.5 px-2.5 py-1.5 rounded-xl border shadow-sm active:scale-95 ${c.bg} ${c.border} max-w-full text-left`}><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /><span className="text-xs font-bold text-slate-700">{getLogName(log)} {formatTime(log.timestamp)}</span></div>{log.reason && (<span className="text-[10px] text-slate-500 italic ml-3 truncate max-w-[150px]">"{log.reason}"</span>)}</button>);
                  })}
                </div>
              </div>
            );
          })}
          {logs.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Ei vielä historiaa.</div>}
        </div>
      </div>
    </div>
  );
};
