"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

var loginPlus = {};

var connectFlash = require('connect-flash');
var MiniTools = require('mini-tools');
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var fs = require('fs-promise');
var changing = require('best-globals').changing;
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
        userFieldName  : "username",
        loginForm      : {
            usernameLabel:'Username',
            passwordLabel:'Password',
            buttonLabel:'Log In',
            formTitle:'login',
            formImg:'Oxygen480-actions-key-enter.svg.png',
            autoLogin:false
        }
    }, opts || {});
    opts.loginPageServe     = opts.loginPageServe     || function(req, res, next){
        var flashInfo=req.flash();
        return MiniTools.serveJade(
            opts.loginPagePath+'/login',
            changing(opts.loginForm,{flash:flashInfo})
        )(req, res, next);
    };
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
    };
    if(opts.fileStore===true){
        var FileStore = require('session-file-store')(session);
        sessionOpts.store= new FileStore();
    }
    app.use(session(sessionOpts));
    app.use(connectFlash());
    app.use(passport.initialize());
    app.use(passport.session({ secret: this.secret, cookie: { maxAge: 60000 } }));
    var fileNameLogin=opts.fileNameLogin||'login.jade';
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

loginPlus.spanishLoginForm={
    usernameLabel:'usuario',
    passwordLabel:'clave',
    buttonLabel:'entrar',
    formTitle:'entrada',
};

module.exports = loginPlus;