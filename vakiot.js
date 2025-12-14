// vakiot.js
import { Sunrise, Sun, Sunset, Moon, Info, PlusSquare, Plus, CheckCircle, Zap, Package, BarChart2, Bell, List, Layers, HelpCircle } from 'lucide-react';

export const TIME_SLOTS = [
  { id: 'aamu', label: 'Aamu', icon: Sunrise, defaultTime: '08:00' },
  { id: 'paiva', label: 'Päivä', icon: Sun, defaultTime: '12:00' },
  { id: 'ilta', label: 'Ilta', icon: Sunset, defaultTime: '20:00' },
  { id: 'yo', label: 'Yö', icon: Moon, defaultTime: '22:00' }
];

export const WEEKDAYS = [
  { id: 1, label: 'Ma' },
  { id: 2, label: 'Ti' },
  { id: 3, label: 'Ke' },
  { id: 4, label: 'To' },
  { id: 5, label: 'Pe' },
  { id: 6, label: 'La' },
  { id: 0, label: 'Su' }
];

export const getIconComponent = (iconName) => {
  const icons = { Info, PlusSquare, Plus, CheckCircle, Zap, Package, BarChart2, Bell, List, Layers };
  const Icon = icons[iconName] || HelpCircle;
  return Icon;
};

// VÄRIT JA LOGIIKKA
export const colorList = ['blue', 'green', 'purple', 'orange', 'rose', 'cyan', 'amber', 'teal', 'indigo', 'lime', 'fuchsia', 'slate'];

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
  'red':    { bg: 'bg-red-50',     border: 'border-red-500',    dot: 'bg-red-600',    text: 'text-red-800',    btn: 'bg-red-600' } // Lisätty varmuuden vuoksi
};

export const getColors = (key) => colorMap[key] || colorMap['blue'];

export const getSmartColor = (medications) => {
  const activeMeds = medications.filter(m => !m.isArchived);
  const usedColors = new Set(activeMeds.map(m => m.colorKey));
  return colorList.find(c => !usedColors.has(c)) || colorList[medications.length % colorList.length];
};
