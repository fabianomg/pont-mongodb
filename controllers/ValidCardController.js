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
// aciona afila dos token
        Queue.consume(true, '#'+req.body.id + 'token', (message) => {
            if (message) {
                Amarithcafe.cardValidation(req.body.id, req.body.username, message.content.toString())
            }
        })
        
              Queue.sendToQueue(false, '#' + req.body.id+ 'atividade', ' Resolvendo captcha......')
              Queue.sendToQueue(false, '#' + req.body.id+ 'verificarcards', ' ok')
        
    },
    async save(req, res) {

        let c = req.body
        try {
            let duplicados = 0;
            let cadastrados = 0;
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

               CadastroCards.find({'card':{'number':cardSeparetion[0]}},(arr,result)=>{
             console.log(result)
               if(result ==''){
                
                 Queue.sendToQueue(false, '#' + c.userID + 'carregados', 1)
              cad.save((error) => {
              if (error) {
                        console.log(error.message)
                        let e = error.message.indexOf('to be unique');
                        let ee = error.message.indexOf('dup key');
                        if (e != -1 || ee  !=-1) {
                            Cache.set('duplicados', 0, () => {
                                Cache.incr('duplicados');
                            });
                            Cache.expire('duplicados', 30);
                            Queue.sendToQueue(false, '#' + c.userID + 'atividade', c.cards[i] + ' já existe na nossa base de dados..')
                            let l = new Logs({ arq: 'ValidationController', type: 'card', msg: error.message })
                            l.save();
                        }

                    } else {
                        Cache.set('cadastrados', 0, () => {
                            Cache.incr('cadastrados');
                        });
                        Cache.expire('cadastrados', 30);
                        Queue.sendToQueue(false, '#' + c.userID + 'atividade', c.cards[i] + ' Cadastrado com sucesso ...')
                    }
                });
          }else{
            Queue.sendToQueue(false, '#' + c.userID + 'duplicados', 1)
          }
                });
          }

         
           Queue.sendToQueue(false, '#' + c.userID + 'atividade', ' Aguarde.......')

            if (cadastrados != 0 && duplicados != 0) {

                Queue.sendToQueue(false, '#' + c.userID + 'atividade', ' Foi cadastrado ' + cadastrados + ' cartões e ' + duplicados + ' já estão na nossa base dados.')
            }
            if (cadastrados != 0 && duplicados == 0) {
                Queue.sendToQueue(false, '#' + c.userID + 'atividade', cadastrados + ' cartões foi cadastrado  com sucesso!')
            }
            if (cadastrados = 0 && duplicados != 0) {
                Queue.sendToQueue(false, '#' + c.userID + 'atividade', ' todos os ' + cadastrados + ' que você inseriu já exite na nossa base de dados')
            }


        } catch (error) {
            let l = new Logs({ arq: 'ValidationController', type: 'errorcatch', msg: error.message })
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
    async getcards(req, res) {
        console.log(req.query.id)
        const query = await CadastroCards.where({ userID: req.query.id,valid:true });

        let result = []

        for (let index = 0; index < query.length; index++) {
            let v;
            let t;
            if (query[index].valid) {
                v = '<span class="label label-sm label-success">' + query[index].valid + '</span>';
            } else {
                v = '<span class="label label-sm label-danger">' + query[index].valid + '</span>';
            }
            if (query[index].tested) {
                t = '<span class="label label-sm label-info">' + query[index].tested + '</span>';
            } else {
                t = '<span class="label label-sm label-warning">' + query[index].tested + '</span>';
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
