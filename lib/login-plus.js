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
var bestGlobals = require('best-globals');
var Path = require('path');

var Promises = require('promise-plus');

loginPlus.init = function AlertDeprecated(){
    console.log('deprecated loginPlus.init is now replaced with new (loginPlus.Manager).init');
    throw new Error('deprecated loginPlus.init is now replaced with new (loginPlus.Manager).init');
};

loginPlus.Manager = function LoginPlusManager(){
    this.validExts=[
        'html',
        'jpg','png','gif',
        'css','js','manifest'
    ];
    this.secret = 'keyboard cat '+Math.random();
    this.savedUser = {};
};

loginPlus.Manager.init = function AlertDeprecated(){
    console.log("lack outer parenthesis in: var loginPlus = new (require('login-plus').Manager);");
    throw new Error("lack outer parenthesis in: var loginPlus = new (require('login-plus').Manager);");
};

function completeOptions(opts){
    opts = bestGlobals.changing({
        unloggedPath   : Path.join(__dirname,'/../unlogged'),
        loginPagePath  : Path.join(__dirname,'/../unlogged/login'),
        baseUrl        : '',
        successRedirect: '/index',
        loginUrlPath   : '/login',
        userFieldName  : "username",
    }, opts || {});
    opts.loginPageServe     = opts.loginPageServe     || MiniTools.serveJade(opts.loginPagePath,false);
    opts.baseUrl            = opts.baseUrl.replace(/\/$/g,'');
    opts.noLoggedUrlPath    = opts.noLoggedUrlPath    || opts.loginUrlPath;
    opts.failedLoginUrlPath = opts.failedLoginUrlPath || opts.loginUrlPath;
    return opts;
}

/*eslint global-require: 0*/
loginPlus.Manager.prototype.init = function init(app,opts){
    var thisManager = this;
    var promiseChain = Promises.resolve();
    opts = completeOptions(opts);
    if(opts.php){
        var PhpSessionMiddleware = require('php-session-middleware');
        var phpMiddleware = new PhpSessionMiddleware({
            handler: 'file',
            opts: {
                path: opts.php.save_path
            }
        });
        app.use(function(req,res,next){
            var session = req.session;
            phpMiddleware(req, res, function(){
                req.$SESSION = req.session;
                req.session = session;
                next.apply(null, arguments);
            });
        });
    }
    app.use(opts.baseUrl+'/unlogged',extensionServeStatic(opts.unloggedPath, {
        index: [''], 
        extensions:[''], 
        staticExtensions:this.validExts
    }));
    var sessionOpts={ 
        secret: this.secret, 
        resave: false, 
        saveUninitialized: true,
    };
    if(opts.fileStore===true){
        var FileStore = require('session-file-store')(session);
        sessionOpts.store= new FileStore();
    }
    app.use(session(sessionOpts));
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
        // console.log('*************************');
        // console.log(thisManager.savedUser);
        // console.log(opts.userFieldName);
        // console.log('user', user);
        if(opts.fileStore===true){
            fs.writeFile('sessions/user_'+user[opts.userFieldName]+'.jsonu', JSON.stringify(user)).then(function(){
                done(null, user[opts.userFieldName]);
            }, done);
        }else{
            thisManager.savedUser[user[opts.userFieldName]] = user;
            done(null, user[opts.userFieldName]);
        }
    });

    passport.deserializeUser(function(username, done) {
        // console.log('deSERIALIZE',this.savedUser,username);
        if(opts.fileStore===true){
            fs.readFile('sessions/user_'+username+'.jsonu','utf-8').then(JSON.parse).then(function(user){
                done(null, user);
            }, done);
        }else{
            done(null, thisManager.savedUser[username]);
        }
    });

    /////// ATENCIÓN NUNCA MENTER ensureLoggedIn dentro de una cadena de promesas. Necesitamos que se ejecute sí o sí
    var ensureMiddlewareWihtoutPHP = ensureLoggedIn(opts.baseUrl+opts.noLoggedUrlPath);
    var ensureMiddleware = ensureMiddlewareWihtoutPHP;
    if(opts.php){
        ensureMiddleware = function(req, res, next){
            if(req.$SESSION && req.$SESSION[opts.php.varLogged]){
                return next();
            }else{
                ensureMiddlewareWihtoutPHP(req, res, next);
            }
        };
    }
    app.use(opts.baseUrl,ensureMiddleware); 
    
    return promiseChain;
};

loginPlus.Manager.prototype.setValidator = function setValidator(validatorStrategy){
    passport.use(new LocalStrategy(validatorStrategy));
};

module.exports = loginPlus;