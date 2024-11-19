// Connection à la base de données
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
// Route principale qui renvoie la page "page_principale.ejs" avec tous les inccidents rapportés.
app.get('/', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();

    res.render('page_principale.ejs', {username: "" ,name1: info,info_perso:"",recherche:"",action: false});

});
// Route qui renvoie vers la page "page_identification.ejs"
app.get('/page_identification.ejs',function(req,res,next) {
    res.render('page_identification.ejs', {erreur: "" });

});
// Route qui permet à l'utilisateur de s'inscrire et de charger la page principale avec ses informations personnels. Cette route renvoie une erreur si l'identifiant ou le mot de passe est incorrect.
app.get('/identification.html', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const verification = await identifiant.findOne({ name:req.query.username});
    if ( verification && req.query.password == verification.password ) {
    const info_perso = await data.find({name: verification.name}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    req.session.username = verification.name;
    res.render('page_principale.ejs', {username: req.session.username ,name1: info,info_perso:info_perso,recherche:"",action: false });
  }
  else
    res.render('page_identification.ejs', {erreur: "Identifiant ou mot de passe incorrect" });
});
// Route permettant la création d'un compte si tous les champs ont bien été remplis et si le nom d'utilisateur n'est pas déjà utilisé.
app.post('/inscription.html', async function(req,res,next) {
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const verif_compte = await identifiant.findOne({ name: req.body.username });
    if (verif_compte){
        res.render('page_identification.ejs', {erreur: "Identifiant déjà utilisé" });
    }else if (!req.body.username || !req.body.password){
        res.render('page_identification.ejs', {erreur: "Veuillez remplir tous les champs lors de l'inscription." });
    }else {
        await identifiant.insertOne({ "name" : req.body.username,"password": req.body.password});
        const info_perso = await data.find({name: req.body.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
        req.session.username = req.body.username;
        res.render('page_principale.ejs', {username: req.session.username ,name1: info,info_perso:info_perso,recherche:"",action: false });
    }

    });
// Route qui affiche la page "page_création.ejs"
app.get('/page_creation.html', function(req,res,next) {
  res.render('page_creation.ejs', {username: req.session.username,erreur:"" } );
});
// Route qui ajoute un objet à la base de données si tous les champs ont bien été remplies. Sinon, la route renvoie une erreur.
app.post('/ajout.html', async function(req,res,next) {
    if (req.body.date && req.body.adresse && req.body.description){
    await data.insertOne({ "name" : req.session.username,"date": req.body.date,"adresse": req.body.adresse,"description": req.body.description});
    const info = await data.find({}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs',{username: req.session.username,name1: info,info_perso:info_perso,recherche:"",action: false});
    } else {
        res.render('page_creation.ejs', {username: req.session.username, erreur: "Veuillez remplir tous les champs" } );
    }
});
// Cette route permet à l'utilisateur de se déconnecter.
app.get('/deconnection.html', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');
});
// Route qui permet à l'utilisteur de revenir à la page principale qu'il soit connecté ou non.
app.get('/retour', async function(req,res,next) {
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    if (req.session.username) {
        const info_perso = await data.find({name: req.session.username}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
        res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso,recherche:"",action: false});
    } else {
        res.render('page_principale.ejs', {username: "", name1: info,recherche:"",action: false});
    }
});
// Route qui renvoie la page "modification.ejs" avec les données à modifier.
app.post("/modification.ejs",async function(req,res,next) {
    res.render('modification.ejs', {username: req.session.username,date: req.body.date,adresse: req.body.adresse,description: req.body.description, id:req.body.id});
    });
// Route qui modifie les données sélectionnées.
app.post("/edit", async function(req,res,next) {
    await data.updateOne({_id:new ObjectId(req.body.id) }, {$set: {username: req.session.username,date: req.body.date,adresse: req.body.adresse,description: req.body.description}});
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso,recherche:"",action: false});
    });
// Route qui supprime de la database les données sélectionnées.
app.post("/delete",async function(req,res,next) {
    await data.deleteOne({_id:new ObjectId(req.body.id) })
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso,recherche:"",action: false});
    });
// Route qui retourne les éléments contenant les mots recherchés dans leur description.    
app.get("/recherche", async function(req,res,next){
    const info = await data.find({}, {name: 1, date: 1, adresse: 1, description: 1, _id: 0}).toArray();
    const recherche = await data.find({description:{$regex: req.query.recherche, $options: 'i'}}).toArray();
    if (req.session.username) {
    const info_perso = await data.find({name: req.session.username}, { name:1,date:1, adresse: 1, description: 1, _id: 0 }).toArray();
    res.render('page_principale.ejs', {username: req.session.username, name1: info, info_perso: info_perso, recherche:recherche,action: true});
    }else {
    res.render('page_principale.ejs', {username: "" ,name1: info,info_perso:"",recherche:recherche,action: true});
    }
});
app.use(express.static('static'));
app.listen(8080);
