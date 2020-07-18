var mysql = require('mysql');
var jwt = require('jsonwebtoken');
let config = require("./config/def.json");
var jwtSecret = config.jwtsecret;

var bcrypt = require('bcrypt');
var moment = require('moment');

var saltRounds = 10;

const Nedb = require('nedb');
const db = new Nedb({
    filename : './run/db/user.db', 
    autoload : true 
});


exports.def_login = function(req, res){
    var back =  '<script type="text/javascript"> window.location.href="/"; </script>';
    var backs =  "<script type='text/javascript'>alert('로그인 성공'); window.location.href='/'; </script>";

    let body = req.body;
    let uId = body.uid;
    let uPassword = body.upw;

    try {
        db.find({uid:uId}, function(err, docs) {
          if (docs.length == 1) {
            console.log(docs[0].upw);
            var hash = docs[0].upw.replace('$2y$', '$2a$');
            bcrypt.compare(uPassword, hash, function(err1, correct) {
              if (correct == true) {
                var token = jwt.sign({
                  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 60),
                  user_id: uId
                }, jwtSecret);
                res.cookie("user", token);
                req.session.uid = uId;
                res.send(backs);
            } else {
              res.send(back);
            }
          });
          } else {
            console.log("a", docs.length)
          }

        });
    } catch (error) {
      console.log('docs[0].upw');

    }

}