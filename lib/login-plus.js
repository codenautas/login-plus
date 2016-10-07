"use strict";

var loginPlus = {};

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

loginPlus.Serializer = {
    Memory: function(opts,sessionOpts){
        var thisStore = this;
        thisStore.savedUser={};
        this.serializeUser = function serializeUser(user, done) {
            thisStore.savedUser[user[opts.userFieldName]] = user;
            done(null, user[opts.userFieldName]);
        };
        this.deserializeUser = function deserializeUser(username, done) {
            done(null, thisStore.savedUser[username]);
        };
    },
    FileStore: function(opts,sessionOpts){
        var FileStore = require('session-file-store')(session);
        sessionOpts.store= new FileStore();
        this.serializeUser = function serializeUser(user, done) {
            fs.writeFile('sessions/user_'+user[opts.userFieldName]+'.jsonu', JSON.stringify(user)).then(function(){
                done(null, user[opts.userFieldName]);
            }, done);
        };
        this.deserializeUser = function deserializeUser(username, done) {
            fs.readFile('sessions/user_'+username+'.jsonu','utf-8').then(JSON.parse).then(function(user){
                done(null, user);
            }, done);
        };
    }
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
    if(opts){
        ['unloggedPath'].forEach(function(optName){
            if(opts[optName]){
                console.log('deprecate login-plus.option.'+optName);
            }
        });
    }
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
            oldPasswordLabel:'Old password',
            newPasswordLabel:'New password',
            repPasswordLabel:'Reenter password',
            buttonLabel:'Change',
            formTitle:'change password',
            strength:true
        },
        maxAge: 15*60*1000,
        allowHttpLogin: false
    }, opts || {});
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
    if(opts.php){
        this.phpInit(app,opts);
    }
    app.use(opts.baseUrl+'/auto-login.js', 
        MiniTools.serveFile(Path.join(opts.loginPagePath,'auto-login.js'))
    );
    app.use(opts.baseUrl+'/Oxygen480-actions-key-enter.svg.png', 
        MiniTools.serveFile(Path.join(opts.loginPagePath,'Oxygen480-actions-key-enter.svg.png'))
    );
    var sessionOpts={
        secret: opts.secret || this.secret, 
        resave: false, 
        saveUninitialized: true,
        rolling: true,
        cookie: {maxAge: opts.maxAge,
                httpOnly: true,
                secure:(opts.allowHttpLogin?false:true)
                }
        // cookie: {expires: (new Date()).getTime()+opts.maxAge*1000}
    };
    // console.log('************* CONSTRUYENDO login.plus',opts.fileStore,opts.serializer);
    // console.log('*****',passport);
    opts.serializer = opts.serializer || (
        opts.fileStore ? 
        new loginPlus.Serializer.FileStore(opts,sessionOpts) : 
        new loginPlus.Serializer.Memory(opts,sessionOpts)
    );
    app.set('trust proxy', 1)
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
    console.log("document.location.protocol",document.location.protocol)
    app.get(opts.baseUrl+opts.loginUrlPath, opts.loginPageServe);
    app.post(opts.baseUrl+opts.loginUrlPath,
        passport.authenticate('local', { 
            successRedirect: opts.baseUrl+opts.successRedirect,
            failureRedirect: opts.baseUrl+opts.failedLoginUrlPath,
            failureFlash: true 
        })
    );
    passport.serializeUser(opts.serializer.serializeUser);
    passport.deserializeUser(opts.serializer.deserializeUser);
    /////// ATENCIÓN NUNCA METER ensureLoggedIn dentro de una cadena de promesas. Necesitamos que se ejecute sí o sí
    app.use(opts.baseUrl,this.ensureMiddleware); 
    //// NOW is logged in
    app.get(opts.baseUrl+opts.chPassUrlPath, opts.chPassPageServe);
    app.post(opts.baseUrl+opts.chPassUrlPath, function(req,res){
        thisManager.passwordChanger(
            req.user.username, 
            req.body.oldPassword, 
            req.body.newPassword, 
            function(err, ok, flash){
                if(ok){
                    req.logout();
                    res.redirect(opts.baseUrl+opts.loginUrlPath);
                }else{
                    if(err){
                        console.log('chpass error',err);
                    }
                    req.flash(flash||{message: 'internal error'});
                    res.redirect(opts.baseUrl+opts.chPassUrlPath);
                }
            }
        );
    });
    return promiseChain;
};

loginPlus.Manager.prototype.setValidator = function setValidator(validatorStrategy){
    this.passport.use(new this.LocalStrategy(validatorStrategy));
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