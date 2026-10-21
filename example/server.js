"use strict";

// APP

var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var readYaml = require('read-yaml-promise');
var serveContent = require('serve-content');
var MiniTools = require('mini-tools');
var bestGlobals = require('best-globals');
var crypto = require('node:crypto');
var escapeHtml = require('escape-html');

function passwordHash(username, password){
    return crypto.createHash('sha256').update(password+username.toLowerCase()).digest('hex');
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

// only the query and some well known headers are logged: the body and the cookies can contain secrets
// JSON.stringify escapes the line feeds, so the values cannot forge log lines
var LOGGED_HEADERS = ['host', 'user-agent', 'accept', 'accept-language', 'content-type', 'content-length'];

app.use(function(req,res,next){
    var headers = {};
    LOGGED_HEADERS.forEach(function(name){
        if(name in req.headers){
            headers[name] = req.headers[name];
        }
    });
    console.log('request', JSON.stringify({method:req.method, path:req.path, query:req.query, headers:headers}));
    next();
});

var validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];

var baseUrl=''; // '/test-lp';

app.use(baseUrl+'/public', MiniTools.serveJade('example/unlogged',true));
app.use(baseUrl+'/public', MiniTools.serveStylus('example/unlogged',true));
app.use(baseUrl+'/public', serveContent('example/unlogged', {allowedExts:validExts}));

var loginPlus = require('../lib/login-plus.js');
var loginPlusManager = new loginPlus.Manager;
void loginPlusManager.init(app,{allowHttpLogin:true, baseUrl:baseUrl,successRedirect:'/menu'});

app.use(function(req,res,next){
    console.log('------ logged ---------');
    console.log('logged', JSON.stringify({path:req.path, query:req.query, username:req.user?.username}));
    next();
});


// probar con http://localhost:12348/ajax-example
app.use(baseUrl+'/',MiniTools.serveJade('example/client',true));
app.use(baseUrl+'/',MiniTools.serveStylus('example/client',true));
app.use(baseUrl+'/',serveContent('./node_modules/ajax-best-promise/bin', {allowedExts:['js']}));

var serveErr = MiniTools.serveErr;

var mime = serveContent.mime;

app.use(baseUrl+'/',serveContent('./node_modules/ajax-best-promise/bin', {allowedExts:'js'}));

app.use(baseUrl+'/',serveContent('./client2', {
    index: ['index.html'],
    extensions:[''],
    allowedExts:validExts
}));

var actualConfig;

var clientDb;

MiniTools.readConfig([
    'example/global-config',
    'example/local-config'
]).then(function(config){
    actualConfig=config;
}).then(function(){
    return new Promise(function(resolve, reject){
        var server=app.listen(actualConfig.server.port, function(event) {
            console.log('Listening on port %d', server.address().port);
            resolve();
        });
    });
}).then(function(){
    return pg.connect(actualConfig.db);
}).then(function(client){
    console.log("CONECTED TO", actualConfig.db.database);
    clientDb=client;
    loginPlusManager.setValidatorStrategy(
        function(req, username, password, done) {
            console.log('validating in req',req.session,req.user);
            clientDb.query(
                'SELECT "user" as username, active FROM example."users" WHERE "user"=$1 AND pass_sha256=$2',
                [username, passwordHash(username, password)]
            ).fetchUniqueRow().then(function(data){
                console.log('datos traidos',data.row);
                if(data.row.active){
                    done(null, data.row);
                }else{
                    done(null, null, {message:'inactive'});
                }
            }).catch(function(err){
                console.log('err',err);
                if(err.code==='54011!'){
                    done(null,false,{message: 'Error en usuario o clave'});
                }else{
                    throw err;
                }
            }).catch(function(err){
                console.log('error logueando',err);
                console.log('stack',err.stack);
            }).catch(done);
        }
    );
    loginPlusManager.setPasswordChanger(
        function(req, username, oldPassword, newPassword, done) {
            return Promise.resolve().then(function(){
                return clientDb.query(
                    'UPDATE example."users" SET pass_sha256=$3 WHERE "user"=$1 AND pass_sha256=$2 RETURNING 1 as ok',
                    [username, passwordHash(username, oldPassword), passwordHash(username, newPassword)]
                ).fetchOneRowIfExists();
            }).then(function(result){
                console.log('datos traidos p/ch.pass',result);
                if(result.rowCount){
                    done(null,true);
                }else{
                    done(null,false,{message: 'old password does not matchs or username is not longer valid'});
                }
            }).catch(function(err){
                console.log('error changing pass',err);
                console.log('stack',err.stack);
            }).catch(done);
        }
    );
}).then(function(){
    //ejemplo suma solo para los logueados
    app.use(baseUrl+'/ejemplo/suma',function(req,res){
        var params;
        if(req.method==='POST'){
            params=req.body;
        }else{
            params=req.query;
        }
        var result=(Number(params.alfa)+Number(params.beta)).toString()+' (de '+JSON.stringify(params)+')';
        if(req.method==='POST'){
            res.type('text/plain').send(result);
        }else{
            res.send('<h1>la suma es '+escapeHtml(result)+'</h1><p><small>Servicio privado para el usuario '+escapeHtml(req.user.username));
        }
    });
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});
