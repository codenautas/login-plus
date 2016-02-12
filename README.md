# login-plus
login service for express

![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/login-plus.svg)](https://npmjs.org/package/login-plus)
[![downloads](https://img.shields.io/npm/dm/login-plus.svg)](https://npmjs.org/package/login-plus)
[![build](https://img.shields.io/travis/codenautas/login-plus/master.svg)](https://travis-ci.org/codenautas/login-plus)
[![coverage](https://img.shields.io/coveralls/codenautas/login-plus/master.svg)](https://coveralls.io/r/codenautas/login-plus)
[![climate](https://img.shields.io/codeclimate/github/codenautas/login-plus.svg)](https://codeclimate.com/github/codenautas/login-plus)
[![dependencies](https://img.shields.io/david/codenautas/login-plus.svg)](https://david-dm.org/codenautas/login-plus)
[![qa-control](http://codenautas.com/github/codenautas/login-plus.svg)](http://codenautas.com/github/codenautas/login-plus)


language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md)


# install


```sh
> npm install login-plus
```


# Use


```js

var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

var loginPlus = require('../lib/login-plus.js');

loginPlus.init(app,{ });

loginPlus.setValidator(
    function(username, password, done) {
        if(username === 'admin' && password === 'secret.pass'){
            done(null, {username: 'admin', when: Date()});
        }else{
            done('username or password error');
        }
    }
);

app.get('/user-info',function(req,res){
    res.end(
        'user: '+req.session.passport.username+
        ' logged since '+req.session.passport.when
    );
});

```


## loginPlus.init(app, opts)


From this line on, `loginPlus` controls whether the session is logged. 
If not, it redirects to `/login`.  

opts                | default opts         | use
--------------------|----------------------|---------------
unloggedPath        | `../unlogged`        | server directory to which the path /unlogged points 
loginPagePath       | `/../unlogged/login` | path to the .jade file that contains the login screen
loginPageServe      | motor de jade        | function that serves the login page (use this function when a .jade file is not desired)
successRedirect     | `/index`             | successful login path
loginUrlPath        | `/login`             | URL to the login page
noLoggedUrlPath     | `/login`             | URL to the unlogged page where the authentification is required when trying to log in 
failedLoginUrlPath  | `/login`             | URL to the failing login page


From this point on, the middlewares can access the data session contained in `req.session.passport`.


## loginPlus.setValidator(fn)


It registers the function that the user must validate and in case of success, obtains 
the additional necessary information for the session (for example, role or level of permission) 
that will be available in `req.session.passport`


# License


[MIT](LICENSE)
