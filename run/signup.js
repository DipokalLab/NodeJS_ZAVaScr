var bcrypt = require('bcrypt');
const Nedb = require('nedb');
const db = new Nedb({
    filename : './run/db/user.db', 
    autoload : true 
});
var saltRounds = 10;
var moment = require('moment');
var jwt = require('jsonwebtoken');
let config = require("./config/def.json");
var jwtSecret = config.jwtsecret;


exports.def_signup = function(req, res){
    var backs =  "<script type='text/javascript'>alert('가입 성공'); window.location.href='/'; </script>";
    var back =  "<script type='text/javascript'>alert('가입 실패'); window.location.href='/'; </script>";
    var back1 =  "<script type='text/javascript'>alert('ID 중복'); window.location.href='/'; </script>";

    let body = req.body;
    let uId = body.Id;
    let uPassword = body.Password;
    let uEmail = body.Email;
  
    bcrypt.hash(uPassword, saltRounds, function(err, hash) {
      var login_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

      var login_time = moment().format("MM-DD-YYYY");

        let doc = {
            uid : uId,
            upw : hash,
            uemail: uEmail,
            ip : login_ip
        };
        // 데이터 저장
        db.insert(doc, function (err, newDoc) {
        if(err !== null){
            console.log(err);
            return;
        }
        console.log(newDoc);
        bcrypt.compare(uPassword, hash, function(err, correct) {
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
        });


    



    });
}