const express = require('express');
const nodes7 = require('nodes7');

const app = express();
const conn = new nodes7();

app.use(express.json());
app.use(express.static('.'));

// Configuration pour NetToPLCSim (Localhost)
const plcConfig = {
    port: 102,
    host: '127.0.0.1', // On passe par le pont
    rack: 0,
    slot: 2
};

// Mapping des variables
const variablesMap = {
    Bouton1: 'DB1,X0.0',
    Nombre1: 'DB1,INT2'
};

// Mémoire tampon (Cache) pour éviter de saturer l'automate
let plcValues = {
    Bouton1: false,
    Nombre1: 0
};

let plcConnected = false;

// Initialisation de la connexion
conn.initiateConnection(plcConfig, (err) => {
    if (err) {
        console.error('Erreur connexion critique :', err);
        return; // On arrête si pas de connexion au démarrage
    }
    
    plcConnected = true;
    console.log('--- CONNECTÉ À L\'AUTOMATE VIA NETTOPLCSIM ---');
    
    conn.setTranslationCB((tag) => variablesMap[tag]);
    conn.addItems(Object.keys(variablesMap));

    // BOUCLE DE LECTURE (POLLING)
    // On lit l'automate toutes les 500ms et on met à jour le cache
    setInterval(() => {
        conn.readAllItems((err, values) => {
            if (err) {
                console.error("Erreur lecture cyclique :", err);
            } else {
                // Mise à jour de la mémoire tampon
                plcValues = values; 
                // console.log("Données à jour :", plcValues); // Decommenter pour debug
            }
        });
    }, 500); 
});

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint ECRITURE (Reste direct)
app.post('/api/write', (req, res) => {
    const { variable, value } = req.body;

    if (!plcConnected) return res.status(500).json({ error: 'Automate non connecté' });
    if (!(variable in variablesMap)) return res.status(400).json({ error: 'Variable inconnue' });

    conn.writeItems(variable, value, (err) => {
        if (err) {
            console.error('Erreur écriture :', err);
            return res.status(500).json({ error: 'Echec écriture' });
        }
        
        // On met à jour le cache local tout de suite pour l'affichage
        plcValues[variable] = value;
        
        console.log(`Écriture OK : ${variable} = ${value}`);
        res.json({ success: true, variable, value });
    });
});

// Endpoint LECTURE (Lit le cache instantanément -> Plus de crash)
app.get('/api/read/:variable', (req, res) => {
    const { variable } = req.params;

    if (!(variable in plcValues)) {
        return res.status(400).json({ error: 'Variable inconnue' });
    }

    // On renvoie la valeur stockée en mémoire (très rapide)
    res.json({ variable, value: plcValues[variable] });
});

app.listen(3000, () => {
    console.log('Serveur stable en écoute sur http://localhost:3000');
});