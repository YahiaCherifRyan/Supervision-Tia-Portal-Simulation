# 🚀 Supervision S7-300 - v1.3

## ✨ Nouvelles Fonctionnalités

### 🌡️ Intégration Arduino PT100
- Lecture capteur de température PT100 via Arduino Uno (COM5)
- Affichage temps réel sur interface web
- Grove-LCD RGB Backlight : Affichage température + "Ing. Prompteur"
- Correction automatique +2°C

### 📊 Stockage MySQL
- Sauvegarde automatique des mesures de température
- Table `temperatures` avec historique complet
- API d'accès aux 10 dernières mesures

### 🔌 Écriture S7-300
- Variable Temperature écrite en DB1.DBD4 (Real 4 octets)
- Synchronisation temps réel Arduino → S7-300
- Support natif TIA Portal

### 📱 Interface Web Améliorée
- Nouvelle carte d'affichage température
- Statut de connexion Arduino/S7-300
- Logs optimisés (pas de spam terminal)
- Responsive design (PC, Tablette, Téléphone)

## 🔧 Fonctionnalités Existantes

- ✅ Pilotage S7-300 (Bouton1, Nombre1 en DB1)
- ✅ Authentification MySQL (Admin, Opérateur, Visiteur)
- ✅ Interface web sécurisée avec sessions
- ✅ Accès depuis PC et téléphone
- ✅ Gestion des rôles et permissions

## 📡 Configuration Réseau

**NetToPLCSim Bridge** :
- Network address: 192.168.0.10
- PLCsim address: 192.168.0.1
- Port 102 OK

**Arduino** :
- Port Serial: COM5
- Baud rate: 9600

**Web Server** :
- Local: http://localhost:3000
- Network: http://192.168.0.10:3000
- Mobile (Wi-Fi): http://172.20.10.3:3000

## 🔐 Identifiants

| Utilisateur | Mot de passe | Permissions |
|------------|--------------|------------|
| admin | 123 | Accès total (Lecture/Écriture) |
| operateur | 1234 | Lecture/Contrôle limité |
| visiteur | 1234 | Lecture seule |

## 📋 Ordre de Démarrage

1. XAMPP (Apache + MySQL)
2. TIA Portal (Simulation CPU en RUN)
3. NetToPLCSim (Mode administrateur, serveur RUNNING)
4. Arduino (COM5 connecté et alimenté)
5. Node.js (node server.js)

## 🎯 Flux de Données
```
Arduino PT100 (COM5)
    ↓
Node.js Server
    ├→ Interface Web (affichage temps réel)
    ├→ MySQL (historique)
    └→ S7-300 DB1.DBD4 (variable Temperature)
```

---

<img width="1232" height="533" alt="image" src="https://github.com/user-attachments/assets/f9ed654f-58bd-46e0-9f5b-b08a713cb936" />


**Auteur** : Ryan  
**Date** : Février 2026  
**Version** : 1.3
