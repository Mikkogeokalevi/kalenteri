// Firebase-konfiguraatio ja -alustukset
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCZIupycr2puYrPK2KajAW7PcThW9Pjhb0",
  authDomain: "perhekalenteri-projekti.firebaseapp.com",
  databaseURL: "https://perhekalenteri-projekti-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perhekalenteri-projekti",
  storageBucket: "perhekalenteri-projekti.appspot.com",
  messagingSenderId: "588536838615",
  appId: "1:588536838615:web:148de0581bbd46c42c7392"
};

export const KAYTTAJA_VARIT = {
    Toni: '#4ade80',
    Kaisa: '#c084fc',
    Oona: '#60a5fa',
    perhe: '#fb7185'
};

// Alusta Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Apufunktiot Firebase-operaatioille
export const firebaseOperations = {
    // Tapahtumat
    addEvent: (eventData) => push(ref(database, 'tapahtumat'), eventData),
    updateEvent: (key, updates) => update(ref(database, `tapahtumat/${key}`), updates),
    deleteEvent: (key) => remove(ref(database, `tapahtumat/${key}`)),
    listenToEvents: (callback) => onValue(ref(database, 'tapahtumat'), callback),
    
    // Tehtävät
    addTask: (taskData) => push(ref(database, 'tehtavalista'), taskData),
    updateTask: (key, updates) => update(ref(database, `tehtavalista/${key}`), updates),
    deleteTask: (key) => remove(ref(database, `tehtavalista/${key}`)),
    listenToTasks: (callback) => onValue(ref(database, 'tehtavalista'), callback),
    
    // Autentikointi
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
    onAuthChange: (callback) => onAuthStateChanged(auth, callback),
    getCurrentUser: () => auth.currentUser
};
