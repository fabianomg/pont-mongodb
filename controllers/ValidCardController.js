'use strict'
const Func = require('../lib/func')
const Amarithcafe = require('../lib/amarithcafe')
const Queue = require('../lib/queue')

const CadastroCards = require("../model/cards")
const Logs = require("../model/logs")
const CardsBeingTested = require("../model/cards_being_tested");
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
console.log(req.body)
        const query = await CardsBeingTested.where({ userID: req.query.userID });

        let result = []

        for (let index = 0; index < query.length; index++) {


            if (query[index].valid === true) {
                console.log(query[index].valid)
                result.push({
                    'cards': '<a href="#">' + query[index].card.number + '|' + query[index].card.mes + '|' + query[index].card.ano + '|' + query[index].card.cvv + '</a>',
                    'status': '<span class="label label-sm label-success">APROVADO</span> <span class="label label-sm label-info">ELPATRON</span>'
                })
            } else {
                result.push({
                    'cards': '<a href="#">' + query[index].card.number + '|' + query[index].card.mes + '|' + query[index].card.ano + '|' + query[index].card.cvv + '</a>',
                    'status': '<span class="label label-sm label-danger">NEGADO</span> <span class="label label-sm label-warning">ELPATRON</span>'
                })
            }




        }
        var dados = { data: result };

        return res.json(dados);
        //let t = await CadastroCards.where({ _id: query[0]._id }).updateOne({ tested: true, valid: true })


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
        const query = await CardsBeingTested.where({ userID: req.body.userID });
        for (const ids of query) {

            CardsBeingTested.findByIdAndDelete(ids._id, function (err) {
                if (err) console.log(err);
                console.log(ids._id + " Successful deletion");
            });
        }
        return res.json(query.length)

    }

}
