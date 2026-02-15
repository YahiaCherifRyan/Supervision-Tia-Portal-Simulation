const express = require('express');
const snap7 = require('node-snap7');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const client = new snap7.S7Client();

// --- 1. CONFIGURATION BDD (XAMPP) ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'db_supervision_s7' // Nom de ta nouvelle base
});

app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: 's7-secret-key-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 }
}));

// --- 2. OUTILS ---
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isAuthenticated(req, res, next) {
  if (req.session.userId) next();
  else res.status(401).json({ error: 'Session expirée' });
}

// --- 3. CONFIGURATION AUTOMATE ---
const plcConfig = {
    host: '192.168.1.27', 
    rack: 0,
    slot: 2 
};

let plcConnected = false;
let plcValues = { Bouton1: false, Nombre1: 0 };

function connectPLC() {
  client.ConnectTo(plcConfig.host, plcConfig.rack, plcConfig.slot, (err) => {
    if (err) {
      plcConnected = false;
      setTimeout(connectPLC, 5000);
    } else {
      plcConnected = true;
      console.log('✅ Automate connecté : ' + plcConfig.host);
      startPolling();
    }
  });
}

function startPolling() {
  setInterval(() => {
    if (!plcConnected) return;
    // Lecture DB1.DBX0.0 (Bouton)
    client.DBRead(1, 0, 1, (err, data) => {
      if (!err && data) plcValues.Bouton1 = (data[0] & 0x01) !== 0;
    });
    // Lecture DB1.DBW2 (Nombre)
    client.DBRead(1, 2, 2, (err, data) => {
      if (!err && data) plcValues.Nombre1 = data.readInt16BE(0);
    });
  }, 500);
}

// --- 4. ROUTES NAVIGATION ---
app.get('/', (req, res) => {
  if (req.session.userId) res.sendFile(path.join(__dirname, 'index.html'));
  else res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// --- 5. API AUTHENTIFICATION (MYSQL) ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const hash = hashPassword(password);

  db.query(
    'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
    [username, hash],
    (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, message: 'Identifiants incorrects' });
      }
      const user = results[0];
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      res.json({ success: true, role: user.role });
    }
  );
});

app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({ username: req.session.username, role: req.session.role });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// --- 6. API AUTOMATE (LECTURE/ECRITURE) ---
app.get('/api/read/:variable', isAuthenticated, (req, res) => {
  res.json({ value: plcValues[req.params.variable] });
});

app.post('/api/write', isAuthenticated, (req, res) => {
  // 🔐 SÉCURITÉ : Seul l'admin peut écrire
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: "Droits insuffisants (Admin requis)" });
  }

  const { variable, value } = req.body;
  let buffer;

  if (variable === 'Bouton1') {
    buffer = Buffer.alloc(1);
    buffer[0] = value ? 0x01 : 0x00;
    client.DBWrite(1, 0, 1, buffer, (err) => {
      if (!err) plcValues.Bouton1 = value;
      res.json({ success: !err });
    });
  } else if (variable === 'Nombre1') {
    buffer = Buffer.alloc(2);
    buffer.writeInt16BE(value, 0);
    client.DBWrite(1, 2, 2, buffer, (err) => {
      if (!err) plcValues.Nombre1 = value;
      res.json({ success: !err });
    });
  }
});

// --- 7. LANCEMENT ---
connectPLC();
app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Serveur Supervision S7 prêt !');
  console.log('Accès local    : http://localhost:3000');
  console.log('Accès réseau   : http://' + plcConfig.host + ':3000');
});