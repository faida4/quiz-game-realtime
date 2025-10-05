# 🎮 Quiz Game Realtime

Jeu questionnaire **multijoueur en temps réel** développé avec **React**, **Node.js/Express** et **Socket.IO**.  
Les joueurs rejoignent une partie avec un pseudonyme, répondent à des questions **Vrai/Faux**, et marquent des points selon la **rapidité** et l’**exactitude**. L’interface et les scores se synchronisent instantanément chez tous.

---

## 📸 Aperçu

<p align="center">
  <!-- Remplace par tes vraies images dans /images -->
  <img src="images/app1.png" alt="Écran d'accueil (pseudo + rejoindre)" width="280"/>
  <img src="images/app2.png" alt="Question en cours (Vrai/Faux + timer)" width="280"/>
  <img src="images/app3.png" alt="Tableau des scores en direct" width="280"/>
</p>

---

## ✨ Fonctionnalités

- 👥 **Multijoueur** en temps réel (Socket.IO)
- 🧠 Questions **Vrai/Faux**
- ⚡ Points au **plus rapide** qui répond **correctement**
- 🕒 **Timer** par question (ex. 15 s)
- 🔄 gestion des déconnexions
- 🚪 Démarrage de la partie dès **≥ 2 joueurs**
- 📊 **Scores** mis à jour en direct

---

## 🧰 Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
</p>

> Optionnel : **MongoDB** (local ou Atlas) pour persister les joueurs/scores/historiques.

---

## 🗂️ Structure

```text
quiz-game-realtime/
├── socket-io-client/          # Frontend React
├── socket-io-server/          # Backend Node.js (Express + Socket.IO)
├── package.json
└── package-lock.json
```


---


