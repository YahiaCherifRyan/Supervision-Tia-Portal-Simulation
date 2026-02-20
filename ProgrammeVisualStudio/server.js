const express = require('express');
const snap7 = require('node-snap7');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const mysql = require('mysql2');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const client = new snap7.S7Client();

// --- 1. CONFIGURATION BDD (XAMPP) ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'db_supervision_s7'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erreur MySQL:', err);
  } else {
    console.log('✅ MySQL connecté');
  }
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

// --- 3. ARDUINO (Serial COM5) ---
let temperatureActuelle = 0;
let arduinoConnected = false;
let lastLogTime = 0;
let lastTemperature = null;

function initArduino() {
  try {
    const port = new SerialPort({
      path: 'COM5',  // ✅ Port COM5 pour Arduino
      baudRate: 9600
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (data) => {
      try {
        let temperature = parseFloat(data.trim());
        
        if (!isNaN(temperature)) {
          temperatureActuelle = temperature;
          
          // Log SEULEMENT si la température change (pas de répétition)
          if (lastTemperature !== temperature) {
            const now = Date.now();
            if (now - lastLogTime > 5000) {  // Log max une fois toutes les 5 sec
              console.log(`🌡️  Température: ${temperature.toFixed(2)}°C`);
              lastLogTime = now;
            }
            lastTemperature = temperature;
          }
          
          // Sauvegarder en base de données (SANS log)
          const query = 'INSERT INTO temperatures (temperature) VALUES (?)';
          db.query(query, [temperature], (err) => {
            if (err) console.error('❌ Erreur insertion MySQL:', err);
          });

          // Écrire la température dans DB1 du S7-300 (NOUVEAU)
          if (plcConnected) {
            writeTemperatureToPLC(temperature);
          }
        }
      } catch (err) {
        console.error('❌ Erreur parsing Arduino:', err);
      }
    });

    port.on('open', () => {
      arduinoConnected = true;
      console.log('✅ Arduino connecté sur COM5');
    });

    port.on('error', (err) => {
      arduinoConnected = false;
      console.error('❌ Erreur Arduino:', err.message);
      setTimeout(initArduino, 5000);
    });

    port.on('close', () => {
      arduinoConnected = false;
      console.log('⚠️  Arduino déconnecté');
    });

  } catch (err) {
    console.error('❌ Erreur initialisation Arduino:', err);
  }
}

// --- 4. CONFIGURATION AUTOMATE S7-300 ---
const plcConfig = {
    host: '192.168.0.10',  // ✅ Change avec ton IP
    rack: 0,
    slot: 2 
};

let plcConnected = false;
let plcValues = { Bouton1: false, Nombre1: 0, Temperature: 0 };

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
    
    // Lecture DB1.DBD4 (Temperature - Real 4 octets)
    client.DBRead(1, 4, 4, (err, data) => {
      if (!err && data) {
        plcValues.Temperature = data.readFloatBE(0);
      }
    });
  }, 500);
}

// Fonction pour écrire la température dans DB1.DBD4 du S7-300
function writeTemperatureToPLC(temperature) {
  if (!plcConnected) return;
  
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(temperature, 0);
  
  client.DBWrite(1, 4, 4, buffer, (err) => {
    if (err) {
      console.error('❌ Erreur écriture température PLC:', err);
    }
    // Pas de log en cas de succès (pas de spam)
  });
}

// --- 5. ROUTES NAVIGATION ---
app.get('/', (req, res) => {
  if (req.session.userId) res.sendFile(path.join(__dirname, 'index.html'));
  else res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// --- 6. API AUTHENTIFICATION ---
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

// --- 7. API S7-300 ---
app.get('/api/read/:variable', isAuthenticated, (req, res) => {
  res.json({ value: plcValues[req.params.variable] });
});

app.post('/api/write', isAuthenticated, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: "Droits insuffisants" });
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

// --- 8. API ARDUINO ---
app.get('/api/temperature', isAuthenticated, (req, res) => {
  res.json({ temperature: temperatureActuelle });
});

app.get('/api/temperature/history', isAuthenticated, (req, res) => {
  db.query('SELECT temperature, timestamp FROM temperatures ORDER BY timestamp DESC LIMIT 10', (err, results) => {
    if (err) {
      res.json({ history: [] });
    } else {
      res.json({ history: results || [] });
    }
  });
});

// --- 9. LANCEMENT ---
initArduino();
connectPLC();

app.listen(3000, '0.0.0.0', () => {
  console.log('\n🚀 ========== SUPERVISION S7-300 + ARDUINO ==========');
  console.log('🌐 Local      : http://localhost:3000');
  console.log('🌐 Réseau     : http://192.168.0.10:3000');
  console.log('🔌 S7-300    : En connexion...');
  console.log('🌡️  Arduino    : En écoute sur COM5');
  console.log('📊 MySQL      : Table temperatures active');
  console.log('📝 TIA Portal  : Température écrite en DB1.DBD4');
  console.log('====================================================\n');
});