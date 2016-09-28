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
var Promises = require('promise-plus');

var changing = require('best-globals').changing;

var expect = require('expect.js');

var sinon = require('sinon');

var spy = {globalChPassOk:false};

describe('login-plus with fs', function(){
    [
        {param:'/'          ,base:''           ,root:true },
        {param:'/base'      ,base:'/base'      ,root:false},
        {param:'/base/'     ,base:'/base'      ,root:false},
        {param:'/doble/base',base:'/doble/base',root:false}, 
        {param:null         ,base:''           ,root:true },
    ].forEach(function(opt){
        describe('base:'+opt.param, function(){
            describe('loggin in and change password', function(){
                var agent;
                before(function (done) {
                    spy.globalChPassOk=false;
                    createServerGetAgent({baseUrl:opt.base, successRedirect:'/loggedin', fileStore:true},34432).then(function(_agent){ 
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
                // it('must get then name from fileStore', function(done){
                //     agent
                //     .get(opt.base+'/whoami') 
                //     .expect(200, /I am: {"username":"user"}/, done); //logged with an alias
                // });
                it('must reject erroneous change password', function(done){
                    agent
                    .post(opt.base+'/chpass')
                    .type('form')
                    .send({oldPassword:'bad_pass', newPassword:'prueba2'})
                    .expect(function(res){
                        expect(spy.globalChPassOk).to.eql(2);
                    })
                    .expect(302, /Redirecting to \/.*chpass/, done);
                });
                it('must receive change password', function(done){
                    agent
                    .post(opt.base+'/chpass')
                    .type('form')
                    .send({oldPassword:'prueba1', newPassword:'prueba2'})
                    .expect(function(res){
                        expect(spy.globalChPassOk).to.eql(1);
                    })
                    .expect(302, /Redirecting to \/.*login/, done);
                });
            });
        });
    });
});

var common = require('./common.js')(39932, spy);
var createServerGetAgent = common.createServerGetAgent;