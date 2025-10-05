

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },         // Texte de la question
  correctAnswer: { type: Boolean, required: true } // Réponse correcte (true ou false)
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
