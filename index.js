// IMPORT
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const bodyParser = require('body-parser'); 
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const io = require('socket.io').listen(server);
const multer  = require('multer');
const Nedb = require('nedb');
const session = require('express-session');
const NedbSession = require('connect-nedb-session')(session);


// SETTING
const db = new Nedb({
    filename : './run/db/data.db', 
    autoload : true 
});

const upload = multer({ dest: 'uploads/' })
const config = require('./run/config/def.json');
var version = config.vs;
var jwtSecret = config.jwtsecret;



// APP USE
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine','ejs');
app.set('views','./views');
app.use(express.static('pub'));
app.use(session({ resave: true,
    saveUninitialized: true,
    store: new NedbSession({ filename: './run/db/session.db' }),
    cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 31 // 쿠키 유효기간 31일
    },
    secret: 'devent4sesescgsdfigsodng!!@#@@' 
}));
    

// RUN IMPORT
var login = require('./run/login');
var signup = require('./run/signup');


// GET, POST
app.get('/', function(req, res) {
    if (!req.session.uid) {
        res.render('./login');
    } else {
        db.find({}, function(err, doc){
            if(err !== null){
                console.log(err);
                return;
            }
            let id = [];
            let name = [];
            let msg = [];
    
            for (let i = 0; i < doc.length; i++) {
                id.push(doc[i]._id);
                name.push(doc[i].name);
                msg.push(doc[i].msg);
    
            }
    
            res.render("index", {
                id : id,
                name: name,
                msg : msg
            });
        });
    }
});

app.post('/login_ok', function(req, res) {
    login.def_login(req, res);
});

app.post('/signup_ok', function(req, res) {
    signup.def_signup(req, res);
});

app.get('/login', function(req, res) {
    res.render("login")
});

app.get('/signup', function(req, res) {
    res.render("signup")
});

app.get('/logout', function(req, res) {
    //console.log(req);
    res.clearCookie("user");      
    req.session.uid = '';
    res.redirect('/');
  });

app.get("/certified", function(req, res, next){
    try {
      let token = req.cookies.user;
      let decoded = jwt.verify(token, jwtSecret);
      if(decoded){
        res.send("권한이 있어서 정상적으로 수행 가능")
      }
      else{
        res.send("권한이 없습니다.")
      }
    } catch (error) {
      res.send("권한이 없습니다.")
    }
});
   

// SOCKET IO
  io.use(function(socket, next){
    if (socket.handshake.query && socket.handshake.query.token){
      jwt.verify(socket.handshake.query.token, jwtSecret, function(err, decoded) {
        if (err) return next(new Error('Authentication error'));
        console.log(`[ Socket.io ] Verify 요청`)
        socket.decoded = decoded;
        next();
      });
    }
    else {
      next(new Error('Authentication error'));
    }    
  }).on('connection', (socket) => {
    console.log('connected');


    socket.on('chat', (name, msg) => {

        if (name !== '') {
            
            let timestamp = new Date().getTime();
            var rand = Math.floor(Math.random() * 999);
            io.emit('chat', socket.decoded.user_id , msg);
            var doc = {
                _id : String(timestamp)+"-"+String(rand),
                name : socket.decoded.user_id,
                msg : msg
            };
        
            db.insert(doc, function (err, newDoc) {
                if(err !== null){
                    console.log(err);
                    return;
                }
                console.log(newDoc);
            });

        }
    });
    socket.on('disconnect', () => {
        console.log('disconnected');
    });
  });

server.listen(8804);