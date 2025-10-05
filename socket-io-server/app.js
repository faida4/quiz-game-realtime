const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Question = require("./models/question");
const Player = require("./models/player");

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);
app.use(cors());

const server = http.createServer(app); //Crée un serveur HTTP avec l'application Express.
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Etablir la Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/quizgame', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.log('Erreur de connexion MongoDB:', err));

// Charger toutes les questions depuis MongoDB
let questions = [];
Question.find()
  .then(loadedQuestions => { //parametres qui represente les questions chargees 
    questions = loadedQuestions;
    console.log("Questions chargées depuis MongoDB : ", questions);
  })
  .catch(err => console.log('Erreur lors du chargement des questions:', err));

let players = {};  //Initialise un objet vide pour stocker les informations des joueurs connectés.
let currentQuestionIndex = 0;
let gameStarted = false;
let endGame = false;  
let timer = null;
let waitingForPlayers = false;
let questionStartTime = 0;  

// Fonction pour envoyer des questions aux joueurs
const sendQuestion = (io) => {
  if (endGame) return;  // Si le jeu est terminé, ne rien faire

  if (Object.keys(players).length < 2) {
    waitingForPlayers = true;
    io.emit('waitingForPlayers', "En attente de plus de joueurs...");
    return;  // Ne pas envoyer de question tant que le nombre de joueurs est insuffisant
  }

  if (currentQuestionIndex < questions.length) {
    const question = questions[currentQuestionIndex].text; //La question actuelle est récupérée.
    console.log("Envoyer la question :", question);

    // Réinitialiser l'état des joueurs
    for (const id in players) {
      players[id].answered = false;
      players[id].time = null;
      players[id].answer = null;
    }

    // Envoyer la question immédiatement
    io.emit("question", question);
    questionStartTime = new Date().getTime(); // Temps de début de la question
    if (timer) {
      clearInterval(timer);
    }

    // Démarrer un nouveau compte à rebours de 15 secondes
    let timeLeft = 15;
    timer = setInterval(() => {
      timeLeft -= 1;
      io.emit("timeUpdate", timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timer);  // Arrêter le timer lorsque le temps est écoulé
        evaluateAnswers(io);  // Évaluer les réponses après 15 secondes
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          sendQuestion(io);  // Envoyer la question suivante
        } else {
          io.emit("endGame", "Le jeu est terminé! Merci d'avoir joué.");
          endGame = true;
          resetGame();
        }
      }
    }, 1000);
  } else {
    console.log("Le jeu est terminé. Plus de questions à envoyer.");
  }
};

// Fonction pour évaluer les réponses et déterminer le gagnant
const evaluateAnswers = (io) => {
  let fastestPlayer = null;
  const correctPlayers = [];

  for (const id in players) {
    const player = players[id];
    const currentQuestion = questions[currentQuestionIndex];

    if (player.answered && player.answer === currentQuestion.correctAnswer) {
      correctPlayers.push(player);
      if (!fastestPlayer || player.time < fastestPlayer.time) {
        fastestPlayer = player;
      }
    }
  }

  //si le joueur le plus rapide a été trouvé
  if (fastestPlayer) {
    fastestPlayer.score += 1;
    io.emit("fastestAnswer", {
      player: fastestPlayer.pseudo,
      score: fastestPlayer.score,
      responseTime: fastestPlayer.time - questionStartTime
    });
  } else {
    io.emit("noCorrectAnswer", "Personne n'a bien répondu cette fois.");
  }

  // Envoyer un message de bonne réponse aux joueurs ayant répondu correctement
  for (const player of correctPlayers) {
    if (player !== fastestPlayer) {
      io.to(player.id).emit("correctAnswer", {
        player: player.pseudo,
        score: player.score,
        responseTime: player.time - questionStartTime
      });
    }
  }

  io.emit("updatePlayers", players);
};

// Fonction pour réinitialiser le jeu après la fin
const resetGame = () => {
  currentQuestionIndex = 0;
  gameStarted = false;
  waitingForPlayers = true;
  endGame = false;  // Réinitialiser le statut du jeu

  for (const id in players) {
    players[id].score = 0;
    players[id].answered = false;
    players[id].time = null;
    players[id].answer = null;
  }

  // Annuler le timer en cours 
  if (timer) {
    clearInterval(timer);
    timer = null;  // Réinitialiser la variable timer
  }
};

// Gestion des connexions des joueurs
io.on('connection', (socket) => {
  console.log("Un client a ouvert la page");

  socket.on('playerConnect', async (pseudo) => {
    try {
      // Vérifier si le pseudo est déjà utilisé dans la base de données
      const existingPlayer = await Player.findOne({ pseudo: pseudo }).exec();
  
      if (existingPlayer && existingPlayer.isConnected) {
        // Si le joueur est déjà connecté dans une partie en cours, envoyer une erreur
        socket.emit('pseudoError', { message: 'Le pseudo est déjà utilisé dans cette partie. Veuillez choisir un autre pseudo.' });
      } else {
        // Si le joueur existe mais qu'il est déconnecté (d'une partie précédente), réinitialiser son score
        if (existingPlayer && !existingPlayer.isConnected) {
          // Réinitialiser les informations du joueur pour la nouvelle partie
          existingPlayer.score = 0;
          existingPlayer.isConnected = true;
          existingPlayer.currentQuestion = 0;
          await existingPlayer.save();
        } else {
          // Sinon, créer un nouveau joueur si le pseudo n'existait pas
          const newPlayer = new Player({
            pseudo: pseudo,
            score: 0,
            isConnected: true,
            currentQuestion: 0
          });
          await newPlayer.save();
        }
  
        // Ajouter le joueur à la liste des joueurs actuels en utilisant l'id de connexion
        players[socket.id] = { pseudo, score: 0, answered: false, time: null, answer: null };
  
        socket.emit('welcome', { message: `Bienvenue ${pseudo}!`, pseudo });
  
        // Notifier les autres joueurs qu'un nouveau joueur a rejoint
      socket.broadcast.emit('playerJoined', { player: pseudo });
  
        // Envoyer la liste mise à jour des joueurs et leurs scores à tous les joueurs connectés
        io.emit('updatePlayers', players);
  
        // Gérer le démarrage du jeu si suffisamment de joueurs sont connectés
        const connectedPlayers = Object.keys(players).length;
        if (connectedPlayers === 1) {
          socket.emit("waitingForPlayers", "En attente d'un autre joueur...");
          waitingForPlayers = true;
        } else if (connectedPlayers >= 2 && !gameStarted && waitingForPlayers) {
          io.emit("exitWaiting", "Le jeu commence maintenant !");
          io.emit("startGame");
          gameStarted = true;
          waitingForPlayers = false;
          // Envoyer la première question
          sendQuestion(io);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la connexion du joueur:', err);
    }
  });
  

  socket.on("answer", (data) => {
    if (Object.keys(players).length < 2) {
      socket.emit("waitingForPlayers", "En attente d'un autre joueur...");
      return;
    }

    const player = players[socket.id];
    const currentQuestion = questions[currentQuestionIndex];

    const responseTime = new Date().getTime();

    if (player.answered) return;  

    player.answered = true;
    player.time = responseTime;
    player.answer = data.answer;

    //compare la réponse du joueur  avec la réponse correcte

    if (data.answer === currentQuestion.correctAnswer) {
      socket.emit("correctAnswer", "Bonne réponse!");
    } else {
      socket.emit("wrongAnswer", "Mauvaise réponse!");
    }
  });

  socket.on('disconnect', async () => {
    const playerId = socket.id;  //recuperer l'id
    const playerPseudo = players[playerId]?.pseudo;  //extraire le pseudo
  
    if (playerPseudo) {
      try {
        // Mise à jour de l'état du joueur dans la base de données
        await Player.findOneAndUpdate(
          { pseudo: playerPseudo },
          { isConnected: false, currentQuestion: currentQuestionIndex, score: players[playerId].score }
        ).exec();
  
        console.log(`Le joueur ${playerPseudo} s'est déconnecté`);
        socket.broadcast.emit('playerDisconnected', {
          pseudo: playerPseudo,
          message: `${playerPseudo} s'est déconnecté`
        });
  
        // Supprimer le joueur de la liste des joueurs actifs
        delete players[playerId];
  
        const connectedPlayersCount = Object.keys(players).length;
  
        if (connectedPlayersCount < 2) {
          // S'il ne reste qu'un seul joueur, arrêter complètement le jeu
          io.emit('gameSuspended', 'Le jeu est suspendu en attente d’autres joueurs.');
          endGame = true;  // Le jeu est terminé
          resetGame();  // Réinitialiser toutes les variables du jeu
        } else {
          // Si deux joueurs ou plus restent, continuer le jeu
          io.emit('updatePlayers', players); // Mettre à jour la liste des joueurs connectés
          io.emit('continueGame', 'Le jeu continue avec les joueurs restants.');
        }
  
        // Annuler le timer si le jeu est suspendu
        if (connectedPlayersCount < 2 && timer) {
          clearInterval(timer);
          timer = null;
        }
      } catch (err) {
        console.error('Erreur lors de la déconnexion du joueur:', err);
      }
    }
  });
  
});


server.listen(port, () => console.log(`Écoute sur le port ${port}`));
