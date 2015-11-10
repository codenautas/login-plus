"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */

var loginPlus = {};

var connectFlash = require('connect-flash');
var MiniTools = require('mini-tools');
var extensionServeStatic = require("extension-serve-static");
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var fs = require('fs-promise');

var Promises = require('promise-plus');

loginPlus.validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];
    
loginPlus.secret = 'keyboard cat';

loginPlus.savedUser = {};

loginPlus.init = function init(app,opts){
    var promiseChain = Promises.resolve();
    opts = opts || {};
    opts.unloggedPath = opts.unloggedPath || __dirname+'/../unlogged';
    opts.loginPagePath = opts.loginPagePath || __dirname+'/../unlogged/login';
    opts.loginPageServe = opts.loginPageServe || MiniTools.serveJade(opts.loginPagePath,false);
    opts.successRedirect = opts.successRedirect || '/index';
    app.use('/unlogged',extensionServeStatic(opts.unloggedPath, {
        index: [''], 
        extensions:[''], 
        staticExtensions:loginPlus.validExts
    }));
    app.use(session({ secret: loginPlus.secret, resave:false, saveUninitialized:true }));
    app.use(connectFlash());
    app.use(passport.initialize());
    app.use(passport.session({ secret: loginPlus.secret }));
    var fileNameLogin=opts.unloggedPath+'/'+(opts.fileNameLogin||'login.jade');
    promiseChain = promiseChain.then(function(){
        return fs.exists(fileNameLogin);
    }).then(function(exists){
        if(!exists){
            throw Error('login-plus.init fail "'+fileNameLogin+'" does not exists');
        }
    });
    app.get('/login', function(req,res,next){
        req.logout();
        next();
    });
    app.get('/login', opts.loginPageServe);

    app.post('/login',
        passport.authenticate('local', { 
            successRedirect: opts.successRedirect,
            failureRedirect: '/login',
            failureFlash: true 
        })
    );

    passport.serializeUser(function(user, done) {
        loginPlus.savedUser[user.username] = user;
        // console.log('SERIALIZE',loginPlus.savedUser,user);
        done(null, user.username);
    });

    passport.deserializeUser(function(username, done) {
        // console.log('deSERIALIZE',loginPlus.savedUser,username);
        done(null, loginPlus.savedUser[username]);
    });

    /////// ATENCIÓN NUNCA MENTER ensureLoggedIn dentro de una cadena de promesas. Necesitamos que se ejecute sí o sí
    app.use(ensureLoggedIn('/login')); 
    
    return promiseChain;
};

loginPlus.setValidator = function setValidator(validatorStrategy){
    passport.use(new LocalStrategy(validatorStrategy));
};

module.exports = loginPlus;