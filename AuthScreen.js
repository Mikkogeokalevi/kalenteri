// AuthScreen.js
import React, { useState } from 'react';
import { User, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase.js';

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

export default AuthScreen;
