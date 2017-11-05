"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-env node*/

var express = require('express');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var assert = require('assert');
var request = require('supertest');
// var loginPlus = require('../lib/login-plus.js');
var loginPlus = require('..');

var changing = require('best-globals').changing;

var expect = require('expect.js');

var sinon = require('sinon');

var simpleLoginPageServe=function(req, res, next){
    res.end('<div>The login page');
}

var globalChPassOk=false;

describe('login-plus', function(){
    [
        {param:'/'          ,base:''           ,root:true },
        {param:'/base'      ,base:'/base'      ,root:false},
        {param:'/base/'     ,base:'/base'      ,root:false},
        {param:'/doble/base',base:'/doble/base',root:false}, 
        {param:null         ,base:''           ,root:true },
    ].forEach(function(opt){
        describe('base:'+opt.param, function(){
            describe('not logged', function(){
                var agent;
                before(function (done) {
                    createServerGetAgent({baseUrl:opt.base, loginPageServe:simpleLoginPageServe}).then(function(_agent){ 
                        agent=_agent; 
                    }).then(done,done);
                });
                it('must redirect if not logged in', function(done){
                    console.log('fetching',opt.base+'/private/data.txt?here=7');
                    agent
                    .get(opt.base+'/private/data.txt?here=7')
                    .expect('location', '../login')
                    .expect(302, /Redirecting to \.\.\/login/, done);
                });
                it('must redirect if not logged in and want chpass', function(done){
                    agent
                    .get(opt.base+'/chpass')
                    .expect('location', 'login')
                    .expect(302, /Redirecting to login/, done);
                });
                it('must get login page when not logged in', function(done){
                    agent
                    .get(opt.base+'/login')
                    .expect(200, '<div>The login page', done);
                });
                it('must redirect to root if not logged in', function(done){
                    agent
                    .get(opt.base+'/this/and/this/algo.txt')
                    .expect('location', '../../../login')
                    .expect(302, /Redirecting to \.\.\/\.\.\/\.\.\/login/, done);
                });
                if(!opt.root){
                    it('must fail outside the base', function(done){
                        agent
                        .get('/algo.txt')
                        .expect(function(rec){
                            if(rec.status!=404){
                                console.log('***************')
                                console.log(rec);
                            }
                        })
                        .expect(404, done);
                    });
                };
            });
            // TODO: poner un test para indicar que falta setValidator
            describe('to log', function(){
                var agent;
                before(function (done) {
                    createServerGetAgent({
                        baseUrl:opt.base, 
                        loginPageServe:simpleLoginPageServe, 
                        userFieldName:'userFieldName',
                        alreadyLoggedIn:'/already-logged-in',
                    }).then(function(_agent){ 
                        agent=_agent; 
                    }).then(done,done);
                });
                it('must set cookie', function(done){
                    agent.get(opt.base+'/login')
                    .expect('set-cookie',/connect.sid=/)
                    .expect(function(res){
                        // console.dir(res,{depth:0});
                        // console.log(res.headers);
                        // console.log('set-cookies',res.headers["set-cookie"]);
                    })
                    .end(done);
                });
                it('must receive login parameters', function(done){
                    agent
                    .post(opt.base+'/login')
                    .type('form')
                    .send({username:'prueba', password:'prueba1'})
                    .expect(function(res){
                        // console.log('****');
                        //console.log('set-cookies',res.headers["set-cookie"]);
                    })
                    .expect(302, /Redirecting to \.\/index/, done);
                });
                it('must serve data if logged', function(done){
                    agent
                    .get(opt.base+'/private/data')
                    .expect('private: data',done);
                });
                it('must serve data if logged 2', function(done){
                    agent
                    .get(opt.base+'/private/data2')
                    .expect('private: data2',done);
                });
                it('must serve whoami', function(done){
                    agent
                    .get(opt.base+'/whoami')
                    .expect('I am: {"userFieldName":"prueba","userData":"data-user"}',done);
                });
                if(!opt.root){
                    it('must fail outside the base', function(done){
                        agent
                        .get('/private/algo.txt')
                        .expect(404, done);
                    });
                };
                it('if the login page was visited then redirect to successful url', function(done){
                    agent
                    .get(opt.base+'/login')
                    .expect(302, /Redirecting to \.\/already*/, done);
                });
                it('if the logout page was visited then unlog', function(done){
                    agent
                    .get(opt.base+'/logout')
                    .end(function(){
                        agent
                        .get(opt.base+'/private/data3')
                        .expect('location', '../login')
                        .expect(302, /Redirecting to \.\.\/login/, done);
                    });
                });
            });
            describe("init",function(){
                var loginPlusM = new loginPlus.Manager;
                it("reject init if cookie-parser is setted",function(done){
                    var app = express();
                    app.use(require('cookie-parser')());
                    Promise.resolve().then(function(){
                        return loginPlusM.init(app,{successRedirect:'/menu'})
                    }).then(function(){
                        done("an error expected");
                    },function(err){
                        done();
                    });
                });
                it("reject init if the path for login.jade does not exists",function(done){
                    var app = express();
                    loginPlusM.init(app,{loginPagePath:'unexisting-path', successRedirect:'/menu'}).then(function(){
                        done("an error expected");
                    },function(err){
                        done();
                    });
                });
                it("reject init if login.jade does not exists",function(done){
                    var app = express();
                    loginPlusM.init(app,{fileNameLogin:'unexisting-file', successRedirect:'/menu'}).then(function(){
                        done("an error expected");
                    },function(err){
                        done();
                    });
                });
                it("serve the internal files",function(done){
                    createServerGetAgent({baseUrl:opt.base, withSomeMiddleware:true, successRedirect:'/menu'}).then(function(agent){ 
                        return agent
                        .get(opt.base+'/auto-login.js')
                        .expect(200, /^"use strict";/);
                    }).then(done.bind(null,null),done);
                });
                it("serve the default login page",function(done){
                    createServerGetAgent({baseUrl:opt.base, chPassUrlPath:false}).then(function(agent){ 
                        return agent
                        .get(opt.base+'/login')
                        .expect(200, /label.*Username/)
                        .expect(200, /name="username"/)
                        .expect(200, /id="password".*name="password"/);
                    }).then(done.bind(null,null),done);
                });
                it("serve the parametrized default login page",function(done){
                    var loginForm=changing(loginPlus.spanishLoginForm,{formImg:'this.png'});
                    createServerGetAgent({baseUrl:opt.base, loginForm}).then(function(agent){ 
                        return agent
                        .get(opt.base+'/login')
                        .expect(200, /usuario.*name="username"/);
                    }).then(done.bind(null,null),done);
                });
            });
            describe('logged in php session', function(){
                var agent;
                before(function (done) {
                    createServerGetAgent({
                        baseUrl:opt.base, 
                        loginPageServe:simpleLoginPageServe,
                        php:{
                            varLogged:'abcd_usu_nombre',
                            save_path:'./test/temp-session'
                        }
                    }).then(function(_agent){ 
                        agent=_agent; 
                    }).then(done,done);
                });
                it('must reject if php session is not active', function(done){
                    agent
                    .get(opt.base+'/private/data')
                    .expect('location', '../login')
                    .expect(302, /Redirecting to \.\.\/login/, done);
                });
                it('must set cookie for test', function(done){
                    agent
                    .get(opt.base+'/php-set-cookie')
                    .expect('set-cookie',/PHPSESSID=oek1/)
                    .expect('ok', done);
                });
                it('must serve if php session', function(done){
                    agent
                    .get(opt.base+'/private/data')
                    .expect('private: data',done);
                });
            });
        });
    });
    describe("warnings", function(){
        it("warn deprecated use of module", function(){
            sinon.stub(console, "log");
            expect(function(){
                loginPlus.init();
            }).to.throwError(/deprecated/);
            try{
                expect(console.log.args).to.eql([
                    [ 'deprecated loginPlus.init is now replaced with new (loginPlus.Manager).init' ]
                ]);
            }finally{
                console.log.restore();
            };
        });
        it("detect lack of mandatory opt successRedirect", function(){
            sinon.stub(console, "log");
            var loginPlusDep = new loginPlus.Manager;
            var app = express();
            expect(function(){
                loginPlusDep.init(app, {unloggedPath: 'x'});
            }).to.throwError(/lack.*mandatory/);
            try{
                expect(console.log.args).to.eql([
                    [ 'login-plus lack of mandatory: opts.successRedirect' ]
                ]);
            }finally{
                console.log.restore();
            };
        });
        it("warn deprecated use of options", function(){
            sinon.stub(console, "log");
            var loginPlusDep = new loginPlus.Manager;
            var app = express();
            loginPlusDep.init(app, {unloggedPath: 'x', successRedirect:'/menu'});
            try{
                expect(console.log.args).to.eql([
                    [ 'deprecate login-plus.option.unloggedPath' ]
                ]);
            }finally{
                console.log.restore();
            };
        });
        it("warn alert missuse of parentesis creating object", function(){
            sinon.stub(console, "log");
            expect(function(){
                loginPlus.Manager.init();
            }).to.throwError(/lack.* outer.*parent/);
            try{
                expect(console.log.args).to.eql([
                    [ "lack outer parenthesis in: var loginPlus = new (require('login-plus').Manager);" ]
                ]);
            }finally{
                console.log.restore();
            };
        });
    });
});

var common = require('./common.js')(34390);
var createServerGetAgent = common.createServerGetAgent;