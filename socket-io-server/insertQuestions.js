const mongoose = require('mongoose');
const Question = require('./models/question');

mongoose.connect('mongodb://localhost:27017/quizgame', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connecté');
    
    const questions = [
      { text: "Le Soleil est une étoile?", correctAnswer: true },
      { text: "La vitesse de la lumière est plus lente que celle du son?", correctAnswer: false },
      { text: "La Terre tourne autour du Soleil en 365 jours?", correctAnswer: true },
      { text: "Les pandas sont carnivores?", correctAnswer: false },
      { text: "Les éléphants sont les plus gros mammifères terrestres?", correctAnswer: true },
      { text: "Les pingouins peuvent voler?", correctAnswer: false },
      { text: "L’eau gèle à 0 degré Celsius?", correctAnswer: true },
      { text: "Les chauves-souris sont aveugles?", correctAnswer: false }
    ];

    // Insérer les questions dans la base de données
    return Question.insertMany(questions);
  })
  .then(() => {
    console.log('Questions insérées avec succès');
    mongoose.connection.close(); // Fermer la connexion une fois les questions insérées
  })
  .catch((err) => {
    console.error('Erreur lors de l\'insertion des questions :', err);
  });
