"use strict";

var loginPlus = {};

var util = require('util');

var connectFlash = require('connect-flash');
var MiniTools = require('mini-tools');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var session = require('express-session');
var fs = require('fs-promise');
var bestGlobals = require('best-globals');
var changing = bestGlobals.changing;
var Path = require('path');

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

function serveJade(url, opts){
    return function(req, res, next){
        var flashInfo=req.flash();
        return MiniTools.serveJade(url, changing(opts,{flash:flashInfo}))(req, res, next);
    };
}

function completeOptions(opts){
    if(!opts || !opts.successRedirect){
        console.log('login-plus lack of mandatory: opts.successRedirect');
        throw new Error('login-plus lack of mandatory: opts.successRedirect');
    }
    ['unloggedPath'].forEach(function(optName){
        if(opts[optName]){
            console.log('deprecate login-plus.option.'+optName);
        }
    });
    opts = changing({
        loginPagePath  : Path.join(__dirname,'../for-client'),
        baseUrl        : '',
        successRedirect: '/index',
        loginUrlPath   : '/login',
        logoutUrlPath  : '/logout',
        chPassUrlPath  : '/chpass',
        userFieldName  : "username",
        loginForm      : {
            usernameLabel:'Username',
            passwordLabel:'Password',
            buttonLabel:'Log In',
            formTitle:'login',
            formImg:'Oxygen480-actions-key-enter.svg.png',
            autoLogin:false
        },
        chPassForm     : {
            usernameLabel:'Username',
            oldPasswordLabel:'Old password',
            newPasswordLabel:'New password',
            repPasswordLabel:'Reenter password',
            buttonLabel:'Change',
            formTitle:'change password',
            strength:true
        },
        maxAge: 15*60*1000,
        passMinLength: 6,
        allowHttpLogin: false,
        log:{
            errors: new Date()
        },
        serializer:{
            serializeUser  : function serializeUser   (user, done){
                done(null, user);
            },
            deserializeUser: function deserializeUser (user, done){
                done(null, user);
            }
        },
        store:{}
    }, opts);
    opts.baseUrl = opts.baseUrl.replace(/\/$/g,'');
    opts = changing({
        loginPageServe    : serveJade(opts.loginPagePath+'/login', opts.loginForm),
        chPassPageServe   : serveJade(opts.loginPagePath+'/chpass', opts.chPassForm),
        noLoggedUrlPath   : opts.loginUrlPath,
        failedLoginUrlPath: opts.loginUrlPath,
        alreadyLoggedIn   : opts.successRedirect
    },opts);
    return opts;
}

/* eslint global-require: 0 */
loginPlus.Manager.prototype.phpInit = function phpInit(app,opts){
    var PhpSessionMiddleware = require('php-session');
    var phpMiddleware = new PhpSessionMiddleware({
        sessionName: '$SESSION',
        handler: 'file',
        opts: {
            path: opts.php.save_path
        }
    });
    app.use(phpMiddleware);
    /*
    app.use(function(req,res,next){
        phpMiddleware(req, res, function(){
            next.apply(null, arguments);
        });
    });
    */
    var ensureMiddlewareWihtoutPHP = this.ensureMiddleware;
    this.ensureMiddleware = function(req, res, next){
        if(req.$SESSION && req.$SESSION[opts.php.varLogged]){
            return next();
        }else{
            ensureMiddlewareWihtoutPHP(req, res, next);
        }
    };
};

loginPlus.Manager.prototype.init = function init(app,opts){
    var thisManager = this;
    var Passport = require('passport').Passport;
    var passport = this.passport = new Passport();
    this.LocalStrategy = require('passport-local').Strategy;
    var promiseChain = Promise.resolve();
    opts = completeOptions(opts);
    this.ensureMiddleware = ensureLoggedIn(opts.baseUrl+opts.noLoggedUrlPath);
    ['auto-login.js', 'strength-pass.js', 'Oxygen480-actions-key-enter.svg.png'].forEach(function(fileName){
        app.use(opts.baseUrl+'/'+fileName, 
            MiniTools.serveFile(Path.join(opts.loginPagePath,fileName))
        );
    });
    var sessionOpts=opts.session||{};
    if(opts.store.module){
        var sessionStoreConstructor = opts.store.module(session);
        sessionOpts.store=new sessionStoreConstructor(opts.store.opts);
    }
    sessionOpts=changing({
        secret: opts.secret || this.secret, 
        resave: false, 
        saveUninitialized: true,
        rolling: true,
        cookie: {
            maxAge: opts.maxAge,
            httpOnly: true,
            secure:(opts.allowHttpLogin?false:true)
        }
    },sessionOpts);
    app.set('trust proxy', 1);
    app.use(session(sessionOpts));
    app.use(connectFlash());
    app.use(passport.initialize());
    app.use(passport.session());
    var fileNameLogin=opts.fileNameLogin||Path.join(opts.loginPagePath,'login.jade');
    promiseChain = promiseChain.then(function(){
        return fs.exists(fileNameLogin);
    }).then(function(exists){
        if(!exists){
            throw Error('login-plus.init fail "'+fileNameLogin+'" does not exists');
        }
    });
    app.get(opts.baseUrl+opts.logoutUrlPath, function(req,res,next){
        req.logout();
        next();
    });
    app.get(opts.baseUrl+opts.loginUrlPath, function(req,res,next){
        if(req.user){
            res.redirect(opts.baseUrl+opts.alreadyLoggedIn);
        }else{
            return next();
        }
    });
    app.get(opts.baseUrl+opts.loginUrlPath, opts.loginPageServe);
    app.post(opts.baseUrl+opts.loginUrlPath,
        passport.authenticate('local', { 
            successRedirect: opts.baseUrl+opts.successRedirect,
            failureRedirect: opts.baseUrl+opts.failedLoginUrlPath,
            failureFlash: true 
        })
    );
    if(opts.serializer){
        passport.serializeUser(opts.serializer.serializeUser);
        passport.deserializeUser(opts.serializer.deserializeUser);
    }else{
        passport.serializeUser(function serializeUser   (user, done){
            console.log('serializeUser', user);
            done(null, user);
        });
        passport.deserializeUser(function deserializeUser (user, done){
            console.log('deserializeUser', user);
            done(null, user);
        });
    }
    if(opts.php){
        this.phpInit(app,opts);
    }
    /////// ATENCIÓN NUNCA METER ensureLoggedIn dentro de una cadena de promesas. Necesitamos que se ejecute sí o sí
    app.use(opts.baseUrl,this.ensureMiddleware); 
    //// NOW is logged in
    if(opts.chPassUrlPath!==false){
        app.get(opts.baseUrl+opts.chPassUrlPath, opts.chPassPageServe);
    }
    app.post(opts.baseUrl+opts.chPassUrlPath, function(req,res){
        if(req.body.newPassword.length>=opts.passMinLength){
            thisManager.passwordChanger(
                req,
                req.user[opts.userFieldName], 
                req.body.oldPassword, 
                req.body.newPassword, 
                function(err, ok, flash){
                    if(ok){
                        req.logout();
                        res.redirect(opts.baseUrl+opts.loginUrlPath);
                    }else{
                        if(err && opts.log.errors.getTime() > new Date().getTime()){
                            console.log('chpass error',err);
                        }
                        req.flash(flash||{message: 'internal error'});
                        res.redirect(opts.baseUrl+opts.chPassUrlPath);
                    }
                }
            );
        }else{
            req.flash({message: 'pass too short'});
            res.redirect(opts.baseUrl+opts.chPassUrlPath);
        }
    });
    return promiseChain;
};

/* istanbul ignore next */
loginPlus.Manager.prototype.setValidator = util.deprecate(function setValidator(validatorStrategy){
    this.passport.use(new this.LocalStrategy(validatorStrategy));
}, "use setValidatorStrategy");

loginPlus.Manager.prototype.setValidatorStrategy = function setValidatorStrategy(){
    var validatorStrategy=arguments[arguments.length>1?1:0];
    var opts=arguments.length>1?arguments[0]:{};
    this.passport.use(new this.LocalStrategy(changing({passReqToCallback:true},opts), validatorStrategy));
};

loginPlus.Manager.prototype.setPasswordChanger = function setPasswordChanger(passwordChanger){
    this.passwordChanger = passwordChanger;
};

loginPlus.spanishLoginForm={
    usernameLabel:'usuario',
    passwordLabel:'clave',
    buttonLabel:'entrar',
    formTitle:'entrada',
};

module.exports = loginPlus;
