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

var loginPlus = require('../lib/login-plus.js');

loginPlus.init(app,{ });

// probar con http://localhost:12348/ajax-example
app.use('/',MiniTools.serveJade('example/client',true));
app.use('/',MiniTools.serveStylus('example/client',true));

var serveErr = MiniTools.serveErr;

var validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];

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
            console.log('intento de entrar de ',username,password);
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
        // probar con localhost:12348/ejemplo/suma?alfa=3&beta=7
        clientDb.query('select $1::integer + $2::integer as suma',[params.alfa||1,params.beta||10]).fetchUniqueRow().then(function(result){
            if(req.method==='POST'){
                //res.send(''+result.rows[0].suma);
                res.send(''+result.row.suma);
            }else{
                //res.send('<h1>la suma es '+result.rows[0].suma+'<h1>');
                res.send('<h1>la suma es '+result.row.suma+'<h1>');
            }
        }).catch(function(err){
            console.log('err ejemplo/suma',err);
            throw err;
        }).catch(serveErr);
    });
	//personas
    app.get('/persona/load',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/load?dni=71184210
        clientDb.query('select * from reqper.personas where dni = $1',[params.dni]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/load',err);            
            throw err;
        }).catch(serveErr);
    });
    app.get('/persona/siguiente',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/siguiente?dni=71184210
        clientDb.query('select * from reqper.personas where dni > $1 order by dni limit 1',[params.dni]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/siguiente',err);            
            throw err;
        }).catch(serveErr);
    });    
    app.get('/persona/anterior',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/anterior?dni=71184210
        clientDb.query('select * from reqper.personas where dni < $1 order by dni desc limit 1',[params.dni]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/anterior',err);           
            throw err;
        }).catch(serveErr);
    });    
    app.get('/persona/primero',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/primero
        clientDb.query('select * from reqper.personas order by dni limit 1',null).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/primero',err);            
            throw err;
        }).catch(serveErr);
    });    
    app.get('/persona/ultimo',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/ultimo
        clientDb.query('select * from reqper.personas order by dni desc limit 1',null).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/ultimo',err);            
            throw err;
        }).catch(serveErr);
    });
	/*
    app.get('/persona/grabar',function(req,res){
        var params=req.query;
        // probar con localhost:12348/persona/grabar
        clientDb.query('select * from reqper.personas where dni = $1',[params.dni]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err persona/grabar',err);            
            throw err;
        }).catch(serveErr);
    });
	*/
    //requerimientos
    app.get('/requerimiento/load',function(req,res){
        var params=req.query;
        // probar con localhost:12348/requerimiento/load?req_proy=NUEVOPROY&req_req=8
        clientDb.query('select * from reqper.requerimientos where req_proy = $1 and req_req= $2',[params.req_proy,params.req_req]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err requerimiento/load',err);            
            throw err;
        }).catch(serveErr);
    });	
    app.get('/requerimiento/siguiente',function(req,res){
        var params=req.query;
        // probar con localhost:12348/requerimiento/siguiente?req_proy=NUEVOPROY&req_req=8
        clientDb.query('select * from reqper.requerimientos where req_proy > $1 or (req_proy = $1 and comun.para_ordenar_numeros(req_req) > comun.para_ordenar_numeros($2)) order by req_proy, comun.para_ordenar_numeros(req_req) LIMIT 1',[params.req_proy,params.req_req]).fetchOneRowIfExists().then(function(result){
  			res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err requerimiento/siguiente',err);            
            throw err;
        }).catch(serveErr);
    });
    app.get('/requerimiento/anterior',function(req,res){
        var params=req.query;
        // probar con localhost:12348/requerimiento/anterior?req_proy=NUEVOPROY&req_req=8
        clientDb.query('select * from reqper.requerimientos where req_proy < $1 or (req_proy = $1 and comun.para_ordenar_numeros(req_req) < comun.para_ordenar_numeros($2)) order by (req_proy, comun.para_ordenar_numeros(req_req)) desc LIMIT 1',[params.req_proy,params.req_req]).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err requerimiento/anterior',err);            
            throw err;
        }).catch(serveErr);
    });    
    app.get('/requerimiento/primero',function(req,res){
        var params=req.query;
        // probar con localhost:12348/requerimiento/primero
        clientDb.query('select * from reqper.requerimientos order by req_proy, comun.para_ordenar_numeros(req_req) limit 1',null).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err requerimiento/primero',err);            
            throw err;
        }).catch(serveErr);
    });        
    app.get('/requerimiento/ultimo',function(req,res){
        var params=req.query;
        // probar con localhost:12348/requerimiento/ultimo
        clientDb.query('select * from reqper.requerimientos order by (req_proy, comun.para_ordenar_numeros(req_req)) desc limit 1',null).fetchOneRowIfExists().then(function(result){
            res.send(JSON.stringify(result.row));
        }).catch(function(err){
            console.log('err requerimiento/ultimo',err);            
            throw err;
        }).catch(serveErr);
    });	
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
    console.log('quizas las partes que dependen de la base de datos no fueron instaladas en su totalidad');
    console.log('***************');
    console.log('REVISE QUE EXISTA LA DB');
});
