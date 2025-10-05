
const express = require("express");
const router = express.Router();
const Question = require("../models/question");

// Route pour vérifier que le serveur est en ligne
router.get("/", (req, res) => {
  res.send({ response: "Le serveur est en ligne" }).status(200);
});

// Route pour récupérer les questions
router.get("/questions", (req, res) => {
  Question.find()
    .then(questions => res.json(questions))
    .catch(err => res.status(500).json({ error: "Erreur lors du chargement des questions" }));
});

module.exports = router;






