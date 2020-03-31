'use strict'
var express = require('express');
var router = express.Router();
const Dbmongo = require('./controllers/DbmongoCardController')

/* GET home page. */
router.post('/updatecards', Dbmongo.updatecards);
router.post('/getcards', Dbmongo.getcards);
router.post('/savecards', Dbmongo.savecards);
router.post('/getlogs/:id?', Dbmongo.getlogs);
router.post('/savelogs', Dbmongo.savelogs);
router.post('/verifycards', Dbmongo.verifycards);
router.post('/createexcepitons', Dbmongo.createexcepitons);

module.exports = router;
