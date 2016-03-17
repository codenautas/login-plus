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
// var loginPlus = require('../lib/login-plus.js');
var loginPlus = require('..');
var loginPlusManager = new loginPlus.Manager;
var Promises = require('promise-plus');

var expect = require('expect.js');

var simpleLoginPageServe=function(req, res, next){
    res.end('<div>The login page');
}

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
                    agent
                    .get(opt.base+'/algo.txt')
                    .expect('location', opt.base+'/login')
                    .expect(302, /Redirecting to \/((doble\/)?base\/)?login/, done);
                });
                it('must get login page when not logged in', function(done){
                    agent
                    .get(opt.base+'/login')
                    .expect(200, '<div>The login page', done);
                });
                it('must redirect to root if not logged in', function(done){
                    agent
                    .get(opt.base+'/this/and/this/algo.txt')
                    .expect('location', opt.base+'/login')
                    .expect(302, /Redirecting to \/((doble\/)?base\/)?login/, done);
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
                    createServerGetAgent({baseUrl:opt.base, loginPageServe:simpleLoginPageServe, userFieldName:'userFieldName'}).then(function(_agent){ 
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
                    .expect(302, /Redirecting to \/.*index/, done);
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
                        .get('/privae/algo.txt')
                        .expect(404, done);
                    });
                };
                it('if the login page was visited then unlog', function(done){
                    agent
                    .get(opt.base+'/login')
                    .end(function(){
                        agent
                        .get(opt.base+'/private/data3')
                        .expect('location', opt.base+'/login')
                        .expect(302, /Redirecting to \/.*login/, done);
                    });
                });
            });
            describe('loggin in', function(){
                var agent;
                before(function (done) {
                    createServerGetAgent({baseUrl:opt.base, successRedirect:'/loggedin'}).then(function(_agent){ 
                        agent=_agent; 
                    }).then(done,done);
                });
                if(!opt.root){
                    it('must fail outside the base', function(done){
                        agent
                        .get('/login')
                        .expect(404, done);
                    });
                };
                it('must redirect to success page', function(done){
                    agent
                    .post(opt.base+'/login')
                    .type('form')
                    .send({username:'prueba', password:'prueba1'})
                    .expect(function(res){
                         //console.log('****', res);
                    })
                    .expect(302, /Redirecting to \/.*loggedin/, done);
                });
            });
            describe("init",function(){
                var loginPlusM = new loginPlus.Manager;
                it("reject init if the path for login.jade does not exists",function(done){
                    var app = express();
                    loginPlusM.init(app,{unloggedPath:'unexisting-path' }).then(function(){
                        done("an error expected");
                    },function(err){
                        done();
                    });
                });
                it("reject init if login.jade does not exists",function(done){
                    var app = express();
                    loginPlusM.init(app,{fileNameLogin:'unexisting-file' }).then(function(){
                        done("an error expected");
                    },function(err){
                        done();
                    });
                });
                it("serve the default login page",function(done){
                    createServerGetAgent(opt.param==null?null:{baseUrl:opt.base}).then(function(agent){ 
                        agent
                        .get(opt.base+'/login')
                        .expect(200, /name="username".*name="password"/);
                    }).then(done,done);
                });
            });
            /*
             * No se necesita porque action=./login alcanza
             *
            describe.skip('action /login with base', function(){
                var agent;
                before(function (done) {
                    createServerGetAgent({baseUrl:opt.base}).then(function(_agent){ 
                        agent=_agent; 
                    }).then(done,done);
                });
                it("must include base in action path", function(done){
                    agent
                    .get(opt.base+'/login')
                    .expect(function(obt){
                        console.log(obt.text);
                    })
                    .expect(200,new RegExp('form action="'+opt.base+'/login"'),done);
                });
            });
            */
        });
    });
});

var INTERNAL_PORT=34444;

function createServerGetAgent(opts) {
    return Promises.make(function(resolve, reject){
        var app = express();
        app.use(cookieParser());
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
        // loginPlus.logAll=true;
        loginPlusManager.init(app,opts);
        var opts2 = opts||{};
        opts2.baseUrl = opts2.baseUrl||'';
        loginPlusManager.setValidator(function(username, password, done){
            // console.log('********* intento de entrar de ',username,password);
            if(username=='prueba' && password=='prueba1'){
                if(opts2.userFieldName){
                    done(null, {userFieldName: 'prueba', userData: 'data-user'});
                }else{
                    done(null, {username: 'user'});
                }
            }else{
                done('user not found in this test.');
            }
        });
        app.get(opts2.baseUrl+'/private/:id',function(req,res){
            res.end('private: '+req.params.id);
        });
        app.get(opts2.baseUrl+'/whoami',function(req,res){
            res.end('I am: '+JSON.stringify(req.user));
        });
        var server = app.listen(INTERNAL_PORT++,function(){
            // resolve(server);
            resolve(request.agent(server));
        });
    });
}
