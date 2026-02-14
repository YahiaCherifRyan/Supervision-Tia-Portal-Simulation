const express = require('express');
const snap7 = require('node-snap7');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const client = new snap7.S7Client();

app.use(express.json());
app.use(express.static('.'));

// Configuration des sessions
app.use(session({
  secret: 'supervision-s7-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, 
    maxAge: 3600000
  }
}));

// Base de données d'utilisateurs
const users = [
  {
    id: 1,
    username: 'admin',
    password: hashPassword('admin123'),
    role: 'admin'
  },
  {
    id: 2,
    username: 'operateur',
    password: hashPassword('operateur123'),
    role: 'operateur'
  }
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Non authentifié' });
  }
}

// ============ CONFIGURATION PLC (NETTOPLCSIM) ============
const plcConfig = {
    host: '172.20.10.3',  // Ton IP Wi-Fi (ipconfig)
    rack: 0,
    slot: 2               // Slot 2 pour S7-300
};

let plcConnected = false;
let plcValues = {
  Bouton1: false,
  Nombre1: 0
};

// Connexion à l'automate
function connectPLC() {
  client.ConnectTo(plcConfig.host, plcConfig.rack, plcConfig.slot, (err) => {
    if (err) {
      console.error('--- ERREUR CONNEXION PLC ---');
      plcConnected = false;
      setTimeout(connectPLC, 5000);
    } else {
      plcConnected = true;
      console.log('--- CONNECTÉ À L\'AUTOMATE VIA ' + plcConfig.host + ' ---');
      startPolling();
    }
  });
}

// Lecture cyclique (Polling)
function startPolling() {
  setInterval(() => {
    if (!plcConnected) return;

    client.DBRead(1, 0, 1, (err, data) => {
      if (!err && data) plcValues.Bouton1 = (data[0] & 0x01) !== 0;
    });

    client.DBRead(1, 2, 2, (err, data) => {
      if (!err && data) plcValues.Nombre1 = data.readInt16BE(0);
    });
  }, 500);
}

// ============ ROUTES DE NAVIGATION (FIX "Cannot GET") ============

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ============ ROUTES API ============

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (!user || user.password !== hashPassword(password)) {
    return res.json({ success: false, message: 'Identifiants incorrects' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;
  res.json({ success: true });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({ username: req.session.username, role: req.session.role });
});

app.get('/api/read/:variable', isAuthenticated, (req, res) => {
  const { variable } = req.params;
  res.json({ variable, value: plcValues[variable] });
});

app.post('/api/write', isAuthenticated, (req, res) => {
  const { variable, value } = req.body;
  if (!plcConnected) return res.status(500).json({ error: 'Automate déconnecté' });

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

// Démarrage
connectPLC();

app.listen(3000, '0.0.0.0', () => {
  console.log('---------------------------------------------');
  console.log('SERVEUR SUPERVISION DISPONIBLE');
  console.log('PC local   : http://localhost:3000');
  console.log('Téléphone  : http://172.20.10.3:3000');
  console.log('---------------------------------------------');
});