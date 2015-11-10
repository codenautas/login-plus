
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var assert = require('assert');
var request = require('supertest');
// var loginPlus = require('../lib/login-plus.js');
var loginPlus = require('..');
var Promises = require('promise-plus');

var expect = require('expect.js');

describe('login-plus', function(){
    describe('not logged', function(){
        var agent;
        before(function (done) {
            createServerGetAgent().then(function(_agent){ 
                agent=_agent; 
            }).then(done,done);
        });
        it('must redirect if not logged in', function(done){
            agent
            .get('/algo.txt')
            .expect('location', '/login')
            .expect(302, /Redirecting to \/login/, done);
        });
        it('must get login page when not logged in', function(done){
            agent
            .get('/login')
            .expect(200, '<div>The login page', done);
        });
        it('must redirect to root if not logged in', function(done){
            agent
            .get('/this/and/this/algo.txt')
            .expect('location', '/login')
            .expect(302, /Redirecting to \/login/, done);
        });
    });
    // TODO: poner un test para indicar que falta setValidator
    describe('to log', function(){
        var agent;
        before(function (done) {
            createServerGetAgent().then(function(_agent){ 
                agent=_agent; 
            }).then(done,done);
        });
        it('must set cookie', function(done){
            agent.get('/login')
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
            .post('/login')
            .type('form')
            .send({username:'prueba', password:'prueba1'})
            .expect(function(res){
                // console.log('****');
                //console.log('set-cookies',res.headers["set-cookie"]);
            })
            .expect(302, /Redirecting to \/index/, done);
        });
        it('must serve data if logged', function(done){
            agent
            .get('/private/data')
            .expect('private: data',done);
        });
        it('must serve data if logged 2', function(done){
            agent
            .get('/private/data2')
            .expect('private: data2',done);
        });
        it('if the login page was visited then unlog', function(done){
            agent
            .get('/login')
            .end(function(){
                agent
                .get('/private/data3')
                .expect('location', '/login')
                .expect(302, /Redirecting to \/login/, done);
            });
        });
    });
    describe('loggin in', function(){
        var agent;
        before(function (done) {
            createServerGetAgent({successRedirect:'/loggedin'}).then(function(_agent){ 
                agent=_agent; 
            }).then(done,done);
        });
        it('must redirect to success page', function(done){
            agent
            .post('/login')
            .type('form')
            .send({username:'prueba', password:'prueba1'})
            .expect(function(res){
                 //console.log('****', res);
            })
            .expect(302, /Redirecting to \/loggedin/, done);
        });
    });
    describe("init",function(){
        it("reject init if the path for login.jade does not exists",function(done){
            var app = express();
            loginPlus.init(app,{unloggedPath:'unexisting-path' }).then(function(){
                done("an error expected");
            },function(err){
                done();
            });
        });
        it("reject init if login.jade does not exists",function(done){
            var app = express();
            loginPlus.init(app,{fileNameLogin:'unexisting-file' }).then(function(){
                done("an error expected");
            },function(err){
                done();
            });
        });
        it("serve the default login page",function(done){
            createServerGetAgent(null).then(function(agent){ 
                agent
                .get('/login')
                .expect(200, /name="username".*name="password"/, done);
            }).then(done,done);
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
        loginPlus.init(app,(opts===undefined?{
			loginPageServe:function(req, res, next){
				res.end('<div>The login page');
			}
		}:opts));
        loginPlus.setValidator(function(username, password, done){
            // console.log('********* intento de entrar de ',username,password);
            if(username=='prueba' && password=='prueba1'){
                done(null, {username: 'prueba'});
            }else{
                done('user not found in this test.');
            }
        });
        app.get('/private/:id',function(req,res){
            res.end('private: '+req.params.id);
        });
        var server = app.listen(INTERNAL_PORT++,function(){
            // resolve(server);
            resolve(request.agent(server));
        });
    });
}


function createServer2(dir, opts, fn) {

  var _serve = loginPlus(dir, opts);

  return http.createServer(function (req, res) {
    fn && fn(req, res);
    _serve(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 404;
      res.end(err ? err.stack : 'sorry!');
    });
  });
}

