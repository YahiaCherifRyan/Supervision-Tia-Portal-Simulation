# 🚦 Supervision S7-300 - Guide de Lancement Rapide

Ce projet permet de piloter un automate Siemens S7-300 (réel ou simulé via PLCSIM) à travers une interface Web Node.js. Il est configuré pour fonctionner même avec un partage de connexion mobile.

---

## ✨ Nouveautés v1.1

- 🔐 **Authentification par login** : Système de connexion sécurisé avec sessions
- 👤 **Gestion des rôles** : Deux niveaux d'accès (admin et opérateur)
- 🛡️ **Protection des données** : Seuls les utilisateurs authentifiés peuvent accéder aux commandes PLC
- 🎨 **Interface de connexion** : Page de login moderne et intuitive avec validation

### Accès Sécurisé

Avant d'accéder à l'interface de supervision, vous devez vous connecter avec l'un de ces identifiants :

#### 👨‍💼 Administrateur
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`
- **Accès** : Complet sur tous les contrôles

#### 👨‍🔧 Opérateur
- **Nom d'utilisateur** : `operateur`
- **Mot de passe** : `operateur123`
- **Accès** : Lecture/écriture des variables PLC

**Note :** Les mots de passe sont hashés avec SHA-256. Les sessions expirent après 1 heure d'inactivité.

---

## ⚙️ 1. Configuration de l'IP dans le Code

Si vous changez d'automate ou de mode de connexion, vous devez modifier le fichier **`server.js`**. La configuration se trouve au début du fichier :

```javascript
// ============ CONFIGURATION PLC (NETTOPLCSIM) ============
const plcConfig = {
    host: '172.20.10.3',  // Ton IP Wi-Fi (ipconfig)
    rack: 0,
    slot: 2               // Slot 2 pour S7-300
};
```

**Options courantes :**
- **Mode Simulation (NetToPLCSim) en local** : `'127.0.0.1'`
- **Mode Simulation via partage réseau** : `'172.20.10.3'` (ou votre adresse IP Wi-Fi)
- **Mode Automate Réel** : Mettez l'adresse IP réelle de l'automate (ex: `'192.168.0.1'`)

---

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
2. Naviguez vers le dossier du projet :
```bash
cd ProgrammeVisualStudio
```

3. Installez les dépendances (première fois uniquement) :
```bash
npm install
```

4. Lancez le serveur :
```bash
npm start
```

ou directement :

```bash
node server.js
```

5. Vous devez voir le message : `--- CONNECTÉ À L'AUTOMATE ---`.

### Étape D : Accéder à l'Interface (NEW v1.1)

1. Ouvrez votre navigateur et allez à :
   - **PC local** : `http://localhost:3000`
   - **Téléphone** : `http://172.20.10.3:3000` (voir section 3)

2. **Vous verrez une page de connexion** - Entrez vos identifiants (admin/admin123 ou operateur/operateur123)

3. Cliquez sur "Connexion"

4. Vous serez redirigé vers l'interface de supervision

---

## 📱 3. Accès depuis le Téléphone

Si votre PC est sur le partage de connexion de votre téléphone :

1. Trouvez l'IP de votre PC : Tapez `ipconfig` dans un terminal sur votre PC.
2. Cherchez l'adresse IPv4 de la carte réseau liée au partage (ex: `172.20.10.6`).
3. Sur votre téléphone, ouvrez votre navigateur et tapez l'adresse suivante :
`http://172.20.10.6:3000` (remplacez par votre IP trouvée à l'étape 1).

**Note :** Si la page ne s'affiche pas sur le téléphone, désactivez temporairement le Pare-feu Windows ou autorisez l'application "Node.js" dans les paramètres de sécurité.

---

## 📦 4. Adresses Automate (Mapping)

Le code est configuré pour lire et écrire sur ces adresses dans l'automate :

| Variable | Adresse Siemens | Action |
|----------|-----------------|--------|
| Bouton1 | `DB1.DBX0.0` | Commande ON/OFF |
| Nombre1 | `DB1.DBW2` | Valeur numérique (Entier) |

---

## 🔐 5. Sécurité (NEW v1.1)

- ✅ Les mots de passe sont hashés avec SHA-256
- ✅ Les sessions expirent après 1 heure d'inactivité
- ✅ Les routes API sont protégées par authentification
- ✅ Seuls les utilisateurs authentifiés peuvent lire/écrire les variables PLC

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| Erreur de connexion PLC | Vérifiez que PLCSIM est en cours d'exécution et l'IP est correcte |
| Accès refusé (401) | Vérifiez que vous êtes connecté avec un compte valide |
| Variables non mises à jour | Vérifiez la connexion à l'automate et le statut du serveur |
| Page de login ne charge pas | Vérifiez que le serveur Node.js est en cours d'exécution |
| Identifiants incorrects | Utilisez admin/admin123 ou operateur/operateur123 |

---

## 📞 Support

Pour toute question ou problème, consultez la documentation technique ou les logs du serveur.

---

**Auteur :** Ryan  
**Version :** 1.1  
**Date :** Février 2026
