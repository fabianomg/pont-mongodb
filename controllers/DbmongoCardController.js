const Cards = require("../model/cards");
const Logs = require("../model/logs");
const Exeptions = require("../model/exeptions");
const Redis = require("redis");
const client = Redis.createClient(6379, "redis");
module.exports = {
  async updatecards(req, res) {
    let result;
    try {
      let dados = req.body.user;
      for (const item of dados) {
        await Cards.findOneAndUpdate(
          { user: item.user },
          { $set: { valid: item.valid } }
        );
      }

      return res.json(result);
    } catch (error) {
      result = error.message;
    }
    return res.json(result);
  },
  async getcards(req, res) {
    let result;
    try {
      let id = req.body.data.id;
      if (id != "") {
        result = await Cards.where({ id: id });
      } else {
        result = await Cards.find();
      }

      return res.json(result);
    } catch (error) {
      result = error.message;
    }
    let data = {data:{result}}
    return res.json(data);
  },
  async verifycards(req, res) {
    let key = Math.floor(Math.random() * (2000000 - 1000880)) + 1007700;
    try {
      for (const item of req.body) {
        let interacao = item.split("|");
        let t = Cards.find({ "card.number": interacao[0] }, function(err, docs) {
          //pega os duplicado do banco
         
          if (docs != "") {
            client.sadd(key, item + "#" + docs[0].valid);
            client.expire(key, 15);
          }
        });
      }
    } catch (error) {
      return res.json(error.message);
    }

    return res.json(key);
  },
  async savecards(req, res) {
    let result;
    try {
      for (const item of req.body) {
        let interacao = item.card.split("|");
        let cards = {
          id: item.id,
          valid: item.valid,
          card: {
            number: interacao[0],
            mes: interacao[1],
            ano: interacao[2],
            cvv: interacao[3]
          }
        };
        Cards.find({ "card.number": cards.card.number }, (err, result) => {
          
          if (result == "") {
            Cards.insertMany(cards);
          }
        });
      }
      result = "ok";
    } catch (error) {
      result = error.message;
    }
    return res.json(result);
  },
  async getlogs(res) {
    let result;
    try {
      result = await Logs.find();

      return res.json(result);
    } catch (error) {
      result = error.message;
    }
    return res.json(result);
  },
  async savelogs(req, res) {
    let result;
    try {
      let dados = req.body.cards;
      let logs = new Logs(dados);

      logs.insert();
      result = "ok";
    } catch (error) {
      result = error.message;
    }
    return res.json(result);
  },
  async createexcepitons(req, res) {
    let result;
    try {
      let dados = req.body.cards;
      let exeptions = new Exeptions(dados);

      exeptions.insert();
      result = "ok";
    } catch (error) {
      result = error.message;
    }
    return res.json(result);
  },
  async getRandomNum(lbound, ubound) {
    return Math.floor(Math.random() * (ubound - lbound)) + lbound;
  },
  getRandomChar(number, lower, upper, other, extra) {
    var numberChars = "0123456789";
    var lowerChars = "abcdefghijklmnopqrstuvwxyz";
    var upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var otherChars = "`~!@#$%^&*()-_=+[{]}\\|;:'\",<.>/? ";
    var charSet = extra;
    if (number == true) charSet += numberChars;
    if (lower == true) charSet += lowerChars;
    if (upper == true) charSet += upperChars;
    if (other == true) charSet += otherChars;
    return charSet.charAt(getRandomNum(0, charSet.length));
  },
  getPassword(
    length,
    extraChars,
    firstNumber,
    firstLower,
    firstUpper,
    firstOther,
    latterNumber,
    latterLower,
    latterUpper,
    latterOther
  ) {
    var rc = "";
    if (length > 0)
      rc =
        rc +
        getRandomChar(
          firstNumber,
          firstLower,
          firstUpper,
          firstOther,
          extraChars
        );
    for (var idx = 1; idx < length; ++idx) {
      rc =
        rc +
        getRandomChar(
          latterNumber,
          latterLower,
          latterUpper,
          latterOther,
          extraChars
        );
    }
    return rc;
  }
};
