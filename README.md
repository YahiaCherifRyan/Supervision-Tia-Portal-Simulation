# 🚦 Supervision S7-300 - Guide de Lancement Rapide

Ce projet permet de piloter un automate Siemens S7-300 (réel ou simulé via PLCSIM) à travers une interface Web Node.js. Il est configuré pour fonctionner même avec un partage de connexion mobile.

---

## ⚙️ 1. Configuration de l'IP dans le Code

Si vous changez d'automate ou de mode de connexion, vous devez modifier le fichier **`server.js`**. La configuration se trouve au début du fichier :
```javascript
// Dans server.js (Ligne 11 environ)
const plcConfig = {
    port: 102,
    host: '127.0.0.1', // <--- MODIFIEZ CETTE IP ICI
    rack: 0,
    slot: 2
};
```

* Mode Simulation (NetToPLCSim) : Laissez `'127.0.0.1'`.
* Mode Automate Réel : Mettez l'adresse IP réelle de l'automate (ex: `'192.168.0.1'`).

## 🚀 2. Étapes de Lancement (Simulation)

Pour que la communication fonctionne, vous devez impérativement lancer les logiciels dans cet ordre :

### Étape A : Lancer l'automate virtuel (TIA Portal)
1. Ouvrez votre projet TIA Portal.
2. Cliquez sur Démarrer la simulation (l'icône petit écran).
3. Dans la fenêtre S7-PLCSIM, vérifiez que l'IP est bien `192.168.0.1`.
4. Passez la CPU en mode RUN (le voyant doit être vert fixe).

### Étape B : Lancer le pont réseau (NetToPLCSim)
1. Faites un clic droit sur `NetToPLCSim.exe` -> Exécuter en tant qu'administrateur.
2. Si une alerte Windows indique que le Port 102 est utilisé, cliquez sur OUI.
3. Vérifiez la ligne : `127.0.0.1` (Network) -> `192.168.0.1` (Plcsim).
4. Cliquez sur Start Server. Le statut doit être RUNNING.

### Étape C : Lancer le Serveur Web (Node.js)
1. Ouvrez le terminal dans VS Code (ou un CMD classique).
2. Lancez la commande :
```bash
node server.js
```

3. Vous devez voir le message : `--- CONNECTÉ À L'AUTOMATE ---`.

## 📱 3. Accès depuis le Téléphone

Si votre PC est sur le partage de connexion de votre téléphone :
1. Trouvez l'IP de votre PC : Tapez `ipconfig` dans un terminal sur votre PC.
2. Cherchez l'adresse IPv4 de la carte réseau liée au partage (ex: `172.20.10.6`).
3. Sur votre téléphone, ouvrez votre navigateur et tapez l'adresse suivante :

`http://172.20.10.6:3000` (remplacez par votre IP trouvée à l'étape 1).

**Note :** Si la page ne s'affiche pas sur le téléphone, désactivez temporairement le Pare-feu Windows ou autorisez l'application "Node.js" dans les paramètres de sécurité.

## 📦 4. Adresses Automate (Mapping)

Le code est configuré pour lire et écrire sur ces adresses dans l'automate :

| Variable | Adresse Siemens | Action |
|----------|-----------------|--------|
| Bouton1 | `DB1.DBX0.0` | Commande ON/OFF |
| Nombre1 | `DB1.DBW2` | Valeur numérique (Entier) |

---

**Auteur :** Ryan  
**Date :** Février 2026
