"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */

// APP

var _ = require('lodash');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Promises = require('best-promise');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var readYaml = require('read-yaml-promise');
var extensionServeStatic = require('extension-serve-static');
var MiniTools = require('mini-tools');
var jade = require('jade');
var crypto = require('crypto');

function md5(text){
    return crypto.createHash('md5').update(text).digest('hex');
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(function(req,res,next){
    console.log('***************************');
    console.dir(req,{depth:0});
    console.log('req.cookies',req.cookies);
    console.log('req.query  ',req.query  );
    console.log('req.body   ',req.body   );
    console.log('req.params ',req.params );
    console.log('req.headers',req.headers);
    // console.dir(res,{depth:0});
    next();
});

var validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];

app.use('/public', MiniTools.serveJade('example/unlogged',true));
app.use('/public', MiniTools.serveStylus('example/unlogged',true));
app.use('/public', extensionServeStatic('example/unlogged', {staticExtensions:validExts}));

var loginPlus = require('../lib/login-plus.js');

loginPlus.init(app,{ });

// probar con http://localhost:12348/ajax-example
app.use('/',MiniTools.serveJade('example/client',true));
app.use('/',MiniTools.serveStylus('example/client',true));
app.use('/',extensionServeStatic('./node_modules/ajax-best-promise/bin', {staticExtensions:['js']}));

var serveErr = MiniTools.serveErr;

var mime = extensionServeStatic.mime;

app.use('/',extensionServeStatic('./node_modules/ajax-best-promise/bin', {staticExtensions:'js'}));

app.use('/',extensionServeStatic('./client2', {
    index: ['index.html'], 
    extensions:[''], 
    staticExtensions:validExts
}));

var actualConfig;

var clientDb;

Promises.start(function(){
    return readYaml('example/global-config.yaml',{encoding: 'utf8'});
}).then(function(globalConfig){
    actualConfig=globalConfig;
    return readYaml('example/local-config.yaml',{encoding: 'utf8'}).catch(function(err){
        if(err.code!=='ENOENT'){
            throw err;
        }
        return {};
    }).then(function(localConfig){
        _.merge(actualConfig,localConfig);
    });
}).then(function(){
    return new Promises.Promise(function(resolve, reject){
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
    loginPlus.setValidator(
        function(username, password, done) {
            // console.log('intento de entrar de ',username,password);
            clientDb.query(
                'SELECT usuario as username FROM reqper.usuarios WHERE usuario=$1 AND clavemd5=$2',
                [username, md5(password+username.toLowerCase())]
            ).fetchUniqueRow().then(function(data){
                console.log('datos traidos',data.row);
                done(null, data.row);
            }).catch(function(err){
                console.log('err',err);
                if(err.code==='54011!'){
                    done('Error en usuario o clave');
                }else{
                    throw err;
                }
            }).catch(function(err){
                console.log('error logueando',err);
                console.log('stack',err.stack);
            }).catch(done);
        }
    );
}).then(function(){
    //ejemplo suma
    app.use('/ejemplo/suma',function(req,res){
        var params;
        if(req.method==='POST'){
            params=req.body;
        }else{
            params=req.query;
        }
        var result=params.alfa+params.beta;
        if(req.method==='POST'){
            res.send(result);
        }else{
            res.send('<h1>la suma es '+result+'<h1>');
        }
    });
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});
