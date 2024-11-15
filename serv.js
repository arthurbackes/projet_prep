const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

const database = client.db('database');
const identifiant= database.collection('identifiant');
const data = database.collection('data');

var express = require('express');
var session = require('express-session');
engines = require('consolidate');
var app = express ();
app.engine('html', engines.hogan);
app.set('view engine', 'ejs');
app.set('views', 'static');

app.use(session({
  secret: "propre123",
  resave: true,
  saveUninitialized: false
}));

app.get('/', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    console.log(info);
    res.render('page_principale.ejs', {username: "" ,description: "",name1: info});

});

app.get('/identification.html', async function(req,res,next) {
  if ( req.query.username == "moimeme" && req.query.password == "secret" ) {
    req.session.username = "moimeme";
    res.render('page_principale.ejs', {username: req.session.username ,description: "" });
  }
  else
    res.redirect('page_identification.html');
});

app.get('/inscription.html', function(req,res,next) {
    req.session.username = req.query.username;
    res.render('page_principale.ejs', {username: req.session.username ,description: "" });
    });

app.get('/page_creation.html', function(req,res,next) {
  res.render('page_creation.ejs', {username: req.session.username } );
});
app.get('/ajout.html', function(req,res,next) {
  if ( req.session.username )
    // this session belongs to an authorized user, we should add the incident to the database
    res.render('page_principale.ejs',{username: req.session.username, description: req.query.description });
  else
    // the session belongs to a user that was not authorized; refuse request.
    res.redirect('page_identification.html');
});
app.get('/deconnection.html', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');
});

app.use(express.static('static'));
app.listen(8080);
