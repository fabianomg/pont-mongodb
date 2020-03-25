'use strict'
var express = require('express');
var router = express.Router();
const Card = require('./controllers/ValidCardController')

/* GET home page. */
router.post('/validatecard', Card.Card);
router.post('/teste', Card.teste);
router.post('/cadastroCards',Card.save);
router.get('/checkingcards',Card.checking);
router.delete('/deletcards',Card.deletcards);
router.get('/getcards',Card.getcards);

module.exports = router;
