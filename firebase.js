// Firebase-konfiguraatio ja alustus
const firebaseConfig = {
    apiKey: "AIzaSyD5XW5VYhKX8x9L8x3x2x1x1x1x1x1x1x1",
    authDomain: "kalenteri-12345.firebaseapp.com",
    databaseURL: "https://kalenteri-12345-default-rtdb.firebaseio.com",
    projectId: "kalenteri-12345",
    storageBucket: "kalenteri-12345.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Firebase-funktiot
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            nykyinenKayttaja = userCredential.user;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('app-section').style.display = 'block';
            document.getElementById('user-info').textContent = nykyinenKayttaja.email;
            haeTapahtumat();
            haeTehtavat();
        })
        .catch(error => {
            alert('Kirjautuminen epäonnistui: ' + error.message);
        });
}

function handleLogout() {
    signOut(auth).then(() => {
        nykyinenKayttaja = null;
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
        if (unsubscribeFromEvents) unsubscribeFromEvents();
        if (unsubscribeFromTasks) unsubscribeFromTasks();
    });
}
