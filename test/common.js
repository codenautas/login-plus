"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-env node*/

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var assert = require('assert');
var request = require('supertest');

var loginPlus = require('..');

var changing = require('best-globals').changing;

var simpleLoginPageServe=function(req, res, next){
    res.end('<div>The login page');
}

function internal(INTERNAL_PORT, spy, validatorOpt){

    INTERNAL_PORT = INTERNAL_PORT || 34444;

    function createServerGetAgent(opts) {
        return new Promise(function(resolve, reject){
            var app = express();
            var loginPlusManager = new loginPlus.Manager;
            if(opts && !opts.withSomeMiddleware){
                opts.allowHttpLogin=true;
                if(opts.successRedirect == null){
                    opts.successRedirect='/index';
                }
                loginPlusManager.initCookieParser(app,opts,cookieParser);
            }
            if(opts.withSomeMiddleware){
                app.use(function(req,res,next){ next(); });
            }
            var concat = require('concat-stream');
            app.use(bodyParser.urlencoded({extended:true}));
            if("show raw body"){
                app.use(function(req, res, next){
                  req.pipe(concat(function(data){
                    req.bodyRaw = data.toString();
                    next();
                  }));
                });
            }
            var opts2 = opts||{};
            opts2.baseUrl = opts2.baseUrl||'';
            app.get(opts2.baseUrl+'/php-set-cookie', function(req,res){
                res.cookie('PHPSESSID', 'oek1ort6vbqdd7374eft6adv61');
                res.end('ok');
            });
            loginPlusManager.init(app,opts);
            var validatorStrategy = function(req, username, password, done){
                if(username=='prueba' && password=='prueba1'){
                    if(opts2.userFieldName){
                        done(null, {userFieldName: 'prueba', userData: 'data-user'});
                    }else{
                        done(null, {username: 'user'});
                    }
                }else{
                    done('user not found in this test.');
                }
            };
            if(validatorOpt){
                loginPlusManager.setValidatorStrategy(validatorOpt, validatorStrategy);
            }else{
                loginPlusManager.setValidatorStrategy(validatorStrategy);
            }
            loginPlusManager.setPasswordChanger(function(req, username, oldPassword, newPassword, done){
                if(username=='user' && oldPassword=='prueba1' && newPassword=='prueba2'){
                    spy.globalChPassOk=1;
                    done(null, true);
                }else if(username=='user' && oldPassword!='prueba1' && oldPassword!='error'){
                    spy.globalChPassOk=2;
                    done(null, false, {message: 'old does not match'});
                }else{
                    spy.globalChPassOk=3;
                    // console.log('***********', arguments);
                    done('error changing pass');
                }
            });
            app.get(opts2.baseUrl+'/private/:id',function(req,res){
                res.end('private: '+req.params.id);
            });
            app.get(opts2.baseUrl+'/whoami',function(req,res){
                res.end('I am: '+JSON.stringify(req.user));
            });
            var server = app.listen(INTERNAL_PORT++, function(){
                // resolve(server);
                resolve(request.agent(server));
            });
        });
    }
    return {createServerGetAgent};   
}

module.exports = internal;