<!--multilang v0 es:LEEME.md en:README.md  -->
# login-plus
<!--lang:es-->
servicio de login para aplicaciones basadas en express
<!--lang:en--]
login service for express
[!--lang:*-->

<!-- cucardas -->
![designing](https://img.shields.io/badge/stability-designing-red.svg)
[![npm-version](https://img.shields.io/npm/v/login-plus.svg)](https://npmjs.org/package/login-plus)
[![downloads](https://img.shields.io/npm/dm/login-plus.svg)](https://npmjs.org/package/login-plus)
[![build](https://img.shields.io/travis/codenautas/login-plus/master.svg)](https://travis-ci.org/codenautas/login-plus)
[![coverage](https://img.shields.io/coveralls/codenautas/login-plus/master.svg)](https://coveralls.io/r/codenautas/login-plus)
[![climate](https://img.shields.io/codeclimate/github/codenautas/login-plus.svg)](https://codeclimate.com/github/codenautas/login-plus)
[![dependencies](https://img.shields.io/david/codenautas/login-plus.svg)](https://david-dm.org/codenautas/login-plus)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en: 
[![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md) - 

<!--lang:es-->

# instalación

<!--lang:en--]

# install

[!--lang:*-->

```sh
> npm install login-plus
```

<!--lang:es-->

# Uso

<!--lang:en--]

# Use

[!--lang:*-->

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

<!--lang:*-->

## loginPlus.init(app, opts)

<!--lang:es-->

A partir de esta línea `loginPlus` controla que la sesión esté logueada 
si no redirecciona a /login. 

Los middlewares a partir de ahí pueden acceder a los datos de sesión 
que están en `req.session.passport`.

<!--lang:en--]

(... comming soon ...)

[!--lang:*-->

## loginPlus.setValidator(fn)

<!--lang:es-->

Registra la función que debe validar el usuario 
y en caso de ser válido obtener la información adicional necesaria para la seción 
(ej: rol o nivel de permisos) que será accesible en `req.session.passport` 

<!--lang:en--]

(... comming soon ...)

[!--lang:es-->

# Licencia

<!--lang:en--]

# License

[!--lang:*-->

[MIT](LICENSE)
