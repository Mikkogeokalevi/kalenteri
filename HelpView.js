// HelpView.js
import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { ohjeData } from './ohjeet.js';
import { getIconComponent } from './vakiot.js';

const HelpView = ({ onClose }) => {
  if (!ohjeData) return <div className="fixed inset-0 z-[60] bg-white p-5">Virhe: ohjeet.js puuttuu.</div>;

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
        {ohjeData.map((section) => {
          const IconComp = getIconComponent(section.icon);
          return (
            <section key={section.id} className={`${section.id === 'intro' ? 'bg-blue-50 border-blue-100' : 'bg-white shadow-sm border-slate-100'} p-5 rounded-2xl border`}>
              <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${section.id === 'intro' ? 'text-blue-800' : 'text-slate-800'}`}>
                {IconComp && <IconComp size={22} className="text-blue-600" />} 
                {section.title}
              </h3>
              <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: section.content }} />
            </section>
          );
        })}
        
        <div className="text-center text-xs text-slate-400 pt-6 pb-2">
          Lääkemuistio v4.6 - {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default HelpView;
