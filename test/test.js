
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var assert = require('assert');
var request = require('supertest');
// var loginPlus = require('../lib/login-plus.js');
var loginPlus = require('..');

describe('login-plus', function(){
    describe('not logged', function(){
        var server;
        before(function () {
            server = createServer();
        });
        it('must redirect if not logged in', function(done){
            request(server)
            .get('/algo.txt')
            .expect(302, 'Found. Redirecting to ./login', done);
        });
        it('must get login page when not logged in', function(done){
            request(server)
            .get('/login')
            .expect(200, '<div>The login page', done);
        });
    });
    // TODO: poner un test para indicar que falta setValidator
    describe('to log', function(){
        var server;
        before(function () {
            server = createServer();
        });
        it('must receive login parameters', function(done){
            request(server)
            .post('/login')
            .field('username','prueba')
            .field('password','prueba1')
            .expect(302, 'Found. Redirecting to ./index', done);
        });
    });
});

function createServer(dir, opts, fn) {
    var app = express();
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({extended:true}));
    loginPlus.loginPageServe=function(req, res, next){
        res.end('<div>The login page');
    };
    loginPlus.init(app,{ });
    loginPlus.setValidator(function(username, password, done){
        console.log('********* intento de entrar de ',username,password);
        if(username=='prueba' && password=='prueba1'){
            done(null, {username: 'prueba'});
        }else{
            done('user not found');
        }
    });
    return app;
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

