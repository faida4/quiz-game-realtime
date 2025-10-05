

const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  pseudo: {
    type: String,
    required: true,
    unique: true, // Assure l'unicité du pseudo
  },
  score: {
    type: Number,
    default: 0
  },
  currentQuestion: {
    type: Number,
    default: 0 // Pour stocker l'index de la question actuelle
  },
  isConnected: {
    type: Boolean,
    default: false // Indique si le joueur est actuellement connecté
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
