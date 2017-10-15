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

var spy = {globalChPassOk:false};

describe('login-plus with fs', function(){
    [
        {param:'/'          ,base:''           ,root:true , deltaT:-10000},
        {param:'/base'      ,base:'/base'      ,root:false, deltaT: 10000},
        {param:'/base/'     ,base:'/base'      ,root:false, deltaT: 10000},
        {param:'/doble/base',base:'/doble/base',root:false, deltaT: 10000}, 
        {param:null         ,base:''           ,root:true , deltaT: 10000},
    ].forEach(function(opt){
        describe('base:'+opt.param, function(){
            describe('loggin in and change password', function(){
                var agent;
                before(function (done) {
                    spy.globalChPassOk=false;
                    createServerGetAgent({baseUrl:opt.base, successRedirect:'/loggedin', log:{errors:new Date(new Date().getTime()+opt.deltaT)}},34432).then(function(_agent){ 
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
                    .send({username2:'prueba', password:'prueba1'})
                    .expect(function(res){
                         //console.log('****', res);
                    })
                    .expect(302, /Redirecting to \/.*loggedin/, done);
                });
                it('must reject erroneous change password', function(done){
                    spy.globalChPassOk=-2;
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
                    spy.globalChPassOk=-1;
                    agent
                    .post(opt.base+'/chpass')
                    .type('form')
                    .send({oldPassword:'prueba1', newPassword:'prueba2'})
                    .expect(function(res){
                        expect(spy.globalChPassOk).to.eql(1);
                    })
                    .expect(302, /Redirecting to \/.*login/, done);
                });
                it('must redirect to success page in another login', function(done){
                    agent
                    .post(opt.base+'/login')
                    .type('form')
                    .send({username2:'prueba', password:'prueba1'})
                    .expect(function(res){
                         //console.log('****', res);
                    })
                    .expect(302, /Redirecting to \/.*loggedin/, done);
                });
                it('must detect change password error', function(done){
                    spy.globalChPassOk=-4;
                    agent
                    .post(opt.base+'/chpass')
                    .type('form')
                    .send({oldPassword:'prueba1', newPassword:'p'})
                    .expect(function(res){
                        expect(spy.globalChPassOk).to.eql(-4);
                    })
                    .expect(302, /Redirecting to \/.*chpass/, done);
                });
                it('must detect change password error', function(done){
                    spy.globalChPassOk=-3;
                    agent
                    .post(opt.base+'/chpass')
                    .type('form')
                    .send({oldPassword:'error', newPassword:'prueba2'})
                    .expect(function(res){
                        expect(spy.globalChPassOk).to.eql(3);
                    })
                    .expect(302, /Redirecting to \/.*chpass/, done);
                });
            });
        });
    });
});

var common = require('./common.js')(39932, spy, { usernameField: 'username2'});
var createServerGetAgent = common.createServerGetAgent;