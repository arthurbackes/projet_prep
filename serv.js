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
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "propre123",
  resave: true,
  saveUninitialized: false
}));

app.get('/', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();

    res.render('page_principale.ejs', {username: "" ,name1: info,info_perso:""});

});
app.get('/page_identification.ejs',function(req,res,next) {
    res.render('page_identification.ejs', {erreur: "" });

});
app.get('/identification.html', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const verification = await identifiant.findOne({ name:req.query.username});
    if ( verification && req.query.password == verification.password ) {
    const info_perso = await data.find({name: verification.name}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    req.session.username = verification.name;
    res.render('page_principale.ejs', {username: req.session.username ,name1: info,info_perso:info_perso });
  }
  else
    res.render('page_identification.ejs', {erreur: "Identifiant ou mot de passe incorrect" });
});

app.post('/inscription.html', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const verif_compte = await identifiant.findOne({ name: req.body.username });
    if (verif_compte){
        res.render('page_identification.ejs', {erreur: "Identifiant déjà utilisé" });
    }else {
        await identifiant.insertOne({ "name" : req.body.username,"password": req.body.password});
        const info_perso = await data.find({name: req.body.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
        req.session.username = req.body.username;
        res.render('page_principale.ejs', {username: req.session.username ,name1: info,info_perso:info_perso });
    }

    });

app.get('/page_creation.html', function(req,res,next) {
  res.render('page_creation.ejs', {username: req.session.username,erreur:"" } );
});
app.post('/ajout.html', async function(req,res,next) {
    if (req.body.date && req.body.adresse && req.body.description){
    await data.insertOne({ "name" : req.session.username,"date": req.body.date,"adresse": req.body.adresse,"description": req.body.description});
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs',{username: req.session.username,name1: info,info_perso:info_perso});
    } else {
        res.render('page_creation.ejs', {username: req.session.username, erreur: "Veuillez remplir tous les champs" } );
    }
});
app.get('/deconnection.html', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');
});
app.get('/retour', async function(req,res,next) {
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    if (req.session.username) {
        const info_perso = await data.find({name: req.session.username}, {
            name: 1,
            date: 1,
            adresse: 1,
            description: 1,
            _id: 0
        }).toArray();
        res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso});
    } else {
        res.render('page_principale.ejs', {username: "", name1: info});
    }
});

app.post("/modification.ejs",async function(req,res,next) {
    res.render('modification.ejs', {username: req.session.username,date: req.body.date,adresse: req.body.adresse,description: req.body.description, id:req.body.id});
    });
app.post("/edit", async function(req,res,next) {
    await data.updateOne({_id:new ObjectId(req.body.id) }, {$set: {username: req.session.username,date: req.body.date,adresse: req.body.adresse,description: req.body.description}});
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso});
    });
app.post("/delete",async function(req,res,next) {
    await data.deleteOne({_id:new ObjectId(req.body.id) })
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso});
    });
app.use(express.static('static'));
app.listen(8080);
