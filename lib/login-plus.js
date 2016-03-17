"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

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

loginPlus.Manager = function LoginPlusManager(){
    this.validExts=[
        'html',
        'jpg','png','gif',
        'css','js','manifest'
    ];
    this.secret = 'keyboard cat '+Math.random();
    this.savedUser = {};
};

loginPlus.Manager.prototype.init = function init(app,opts){
    var thisManager = this;
    var promiseChain = Promises.resolve();
    opts = opts || {};
    opts.unloggedPath       = opts.unloggedPath       || __dirname+'/../unlogged';
    opts.loginPagePath      = opts.loginPagePath      || __dirname+'/../unlogged/login';
    opts.loginPageServe     = opts.loginPageServe     || MiniTools.serveJade(opts.loginPagePath,false);
    opts.baseUrl            = opts.baseUrl            || '';
    opts.baseUrl = opts.baseUrl.replace(/\/$/g,'');
    opts.successRedirect    = opts.successRedirect    || '/index';
    opts.loginUrlPath       = opts.loginUrlPath       || '/login';
    opts.noLoggedUrlPath    = opts.noLoggedUrlPath    || opts.loginUrlPath;
    opts.failedLoginUrlPath = opts.failedLoginUrlPath || opts.loginUrlPath;
    opts.userNameField = opts.userNameField || "username";
    app.use(opts.baseUrl+'/unlogged',extensionServeStatic(opts.unloggedPath, {
        index: [''], 
        extensions:[''], 
        staticExtensions:this.validExts
    }));
    app.use(session({ secret: this.secret, resave:false, saveUninitialized:true }));
    app.use(connectFlash());
    app.use(passport.initialize());
    app.use(passport.session({ secret: this.secret }));
    var fileNameLogin=opts.unloggedPath+'/'+(opts.fileNameLogin||'login.jade');
    promiseChain = promiseChain.then(function(){
        return fs.exists(fileNameLogin);
    }).then(function(exists){
        if(!exists){
            throw Error('login-plus.init fail "'+fileNameLogin+'" does not exists');
        }
    });
    app.get(opts.baseUrl+opts.loginUrlPath, function(req,res,next){
        req.logout();
        next();
    });
    app.get(opts.baseUrl+opts.loginUrlPath, opts.loginPageServe);

    app.post(opts.baseUrl+opts.loginUrlPath,
        passport.authenticate('local', { 
            successRedirect: opts.baseUrl+opts.successRedirect,
            failureRedirect: opts.baseUrl+opts.failedLoginUrlPath,
            failureFlash: true 
        })
    );

    passport.serializeUser(function(user, done) {
        thisManager.savedUser[user[opts.userNameField]] = user;
        done(null, user[opts.userNameField]);
    });

    passport.deserializeUser(function(username, done) {
        // console.log('deSERIALIZE',this.savedUser,username);
        done(null, thisManager.savedUser[username]);
    });

    /////// ATENCIÓN NUNCA MENTER ensureLoggedIn dentro de una cadena de promesas. Necesitamos que se ejecute sí o sí
    app.use(opts.baseUrl,ensureLoggedIn(opts.baseUrl+opts.noLoggedUrlPath)); 
    
    return promiseChain;
};

loginPlus.Manager.prototype.setValidator = function setValidator(validatorStrategy){
    passport.use(new LocalStrategy(validatorStrategy));
};

module.exports = loginPlus;