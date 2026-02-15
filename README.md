# 🚦 Supervision S7-300 - Guide de Lancement Rapide (v1.2)

Ce projet permet de piloter un automate Siemens S7-300 (réel ou simulé via PLCSIM) à travers une interface Web Node.js sécurisée par une base de données MySQL. Cette version intègre une gestion dynamique des rôles (Admin, Opérateur, Visiteur).

---

## 🗄️ 1. Configuration de la Base de Données

Pour que l'authentification fonctionne, vous devez configurer **XAMPP** :

1. **Lancer XAMPP** : Activez les modules **Apache** et **MySQL**.
2. **Importer la base** :
   - Allez sur `http://localhost/phpmyadmin`.
   - Créez une base de données nommée `db_supervision_s7`.
   - Cliquez sur l'onglet **Importer** et sélectionnez le fichier `users.sql` présent à la racine du projet.
3. **Vérification** : La table `users` doit contenir les 3 comptes par défaut (admin, operateur, visiteur).

## ⚙️ 2. Configuration de l'IP dans le Code

Si vous changez d'automate ou de mode de connexion, vous devez modifier le fichier `server.js`. La configuration se trouve au début du fichier :

```javascript
// Dans server.js (Ligne 11 environ)
const plcConfig = {
    port: 102,
    host: '127.0.0.1', // <--- MODIFIEZ CETTE IP ICI
    rack: 0,
    slot: 2
};
```

- **Mode Simulation (NetToPLCSim)** : Laissez `'127.0.0.1'`.
- **Mode Automate Réel** : Mettez l'adresse IP réelle de l'automate (ex: `'192.168.0.1'`).

## 🚀 3. Étapes de Lancement (Simulation)

Pour que la communication fonctionne, vous devez impérativement lancer les logiciels dans cet ordre :

### Étape A : Lancer l'automate virtuel (TIA Portal)

1. Ouvrez votre projet TIA Portal.
2. Cliquez sur **Démarrer la simulation** (l'icône petit écran).
3. Passez la CPU en mode **RUN** (le voyant doit être vert fixe).

### Étape B : Lancer le pont réseau (NetToPLCSim)

1. Faites un clic droit sur `NetToPLCSim.exe` → **Exécuter en tant qu'administrateur**.
2. Si une alerte Windows indique que le Port 102 est utilisé, cliquez sur **OUI**.
3. Cliquez sur **Start Server**. Le statut doit être **RUNNING**.

### Étape C : Lancer le Serveur Web (Node.js)

1. Ouvrez le terminal dans VS Code (ou un CMD classique).
2. Installez les dépendances (si nécessaire) :
   ```bash
   npm install
   ```
3. Lancez la commande :
   ```bash
   node server.js
   ```
4. Vous devez voir le message : `--- CONNECTÉ À L'AUTOMATE ---`.

## 🔐 4. Identifiants de Connexion (v1.2)

L'accès est désormais géré par rôles via la base de données MySQL :

| Rôle | Utilisateur | Mot de passe | Permissions |
|------|-------------|--------------|-------------|
| Administrateur | `admin` | `123` | Accès total (Lecture/Écriture) |
| Opérateur | `operateur` | `1234` | Pilotage opérationnel |
| Visiteur | `visiteur` | `1234` | Lecture seule (Commandes masquées) |

**Note** : Les mots de passe sont hachés en SHA-256 dans la base de données pour plus de sécurité.

## 📱 5. Accès depuis le Téléphone

Si votre PC est sur le partage de connexion de votre téléphone :

1. Trouvez l'IP de votre PC : Tapez `ipconfig` dans un terminal (ex: `172.20.10.6`).
2. Sur votre téléphone, ouvrez votre navigateur et tapez : `http://172.20.10.6:3000`.

---

**Auteur** : Ryan  
**Date** : Février 2026
