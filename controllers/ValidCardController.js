'use strict'
const Func = require('../lib/func')
const Amarithcafe = require('../lib/amarithcafe')
const Queue = require('../lib/queue')
const CadastroCards = require("../model/cards")
const Logs = require("../model/logs")
const CardsBeingTested = require("../model/cards_being_tested");
const Redis = require('redis');
const Cache = Redis.createClient(6379, "redis");
module.exports = {

    async Card(req, res) {

        Queue.consume(true, req.body.id + "#tokenRecaptcha", (message) => {
            if (message) {
                Amarithcafe.cardValidation(req.body.id, req.body.username, message.content.toString())
            }
        })

        return res.json({
            res: 'esperando token'
        })
    },
    async save(req, res) {
        let c = req.body
        try {
            for (let i = 0; i < c.cards.length; i++) {
                let cardSeparetion = c.cards[i].split('|');
                const cad = new CadastroCards({
                    userID: c.userID,
                    owner: c.owner,
                    card: {
                        number: cardSeparetion[0],
                        mes: cardSeparetion[1],
                        ano: cardSeparetion[2],
                        cvv: cardSeparetion[3]
                    }
                });
                cad.save((error) => {
                    if (error) {
                        let l = new Logs({ arq: 'ValidationController', type: 'error', msg: error.message })
                        l.save();
                    } else {
                        Queue.sendToQueue(false, c.userID + '#cadastro#cards', 'true')
                    }
                });
            }

        } catch (error) {
            let l = new Logs({ arq: 'ValidationController', type: 'error', msg: error.message })
            l.save();
            Queue.sendToQueue(false, c.userID + '#cadastro#cards', 'false')
        }
    },
    async teste(req, res) {

        const query = await CadastroCards.where({ tested: false, userID: req.body.userID, owner: req.body.owner }).limit(1);

        //let t = await CadastroCards.where({ _id: query[0]._id }).updateOne({ tested: true, valid: true })
        return res.json(query)

    },
    async getCardsResolvidos(req, res) {

        const query = await CadastroCards.where({ tested: false, userID: req.body.userID, owner: req.body.owner }).count();
        console.log(query)
        //let t = await CadastroCards.where({ _id: query[0]._id }).updateOne({ tested: true, valid: true })
        return res.json(query)

    },
    async checking(req, res) {
        console.log(req.query.userID)
        const query = await CardsBeingTested.where({ userid: req.query.userID });

        let result = []

        for (let index = 0; index < query.length; index++) {
console.log(query[index])
                result.push({
                    'cards': query[index].card,
                    'status': query[index].status
               });

        }
        var dados = { data: result };
      return res.json(dados);
       },
    async listcards(req, res) {

        const query = await CadastroCards.where({ userID: req.body.userID, owner: req.body.owner });
        let result = []

        for (let index = 0; index < query.length; index++) {
            result.push({
                'Card': query[index].card.number,
                'Mês': query[index].card.mes,
                'Ano': query[index].card.ano,
                'CVV': query[index].card.cvv,
                'Valido': query[index].valid,
                'Testado': query[index].tested,
                'Data': query[index].data
            })

        }
        console.log(result)
        //let t = await CadastroCards.where({ _id: query[0]._id }).updateOne({ tested: true, valid: true })
        return res.json(result)

    },
    async deletcards(req, res) {
        console.log(req.body.userID)
        const query = await CardsBeingTested.where({ userid: req.body.userID });
        console.log(query)
        for (const ids of query) {

            CardsBeingTested.findByIdAndDelete(ids._id, function (err) {
                if (err) console.log(err);
                console.log(ids._id + " Successful deletion");
            });
        }
        return res.json(query.length)

    },
    async getcards(req,res){
 console.log(req.body.id)
        const query = await CadastroCards.where({ userID: req.query.id });

        let result = []

        for (let index = 0; index < query.length; index++) {
            let v;
            let t;
           if(query[index].valid){
              v = '<span class="label label-sm label-success">'+query[index].valid+'</span>';
           }else{
             v = '<span class="label label-sm label-danger">'+query[index].valid+'</span>';
           }
            if(query[index].valid){
              t = '<span class="label label-sm label-info">'+query[index].valid+'</span>';
           }else{
             t = '<span class="label label-sm label-warning">'+query[index].valid+'</span>';
           }

                result.push({
                    'cards': query[index].card.number,
                    'mes': query[index].card.mes,
                    'ano': query[index].card.ano,
                    'cvv': query[index].card.cvv,
                    'valido': v,
                    'testado': t,
                    'data': query[index].data

               });

        }
        var dados = { data: result };
      return res.json(dados);
      
    }

}
