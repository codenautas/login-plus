<!--multilang v0 es:LEEME.md en:README.md  -->
# login-plus
<!--lang:es-->
servicio de login para aplicaciones basadas en express
<!--lang:en--]
login service for express
[!--lang:*-->

<!-- cucardas -->
![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/login-plus.svg)](https://npmjs.org/package/login-plus)
[![downloads](https://img.shields.io/npm/dm/login-plus.svg)](https://npmjs.org/package/login-plus)
[![build](https://img.shields.io/travis/codenautas/login-plus/master.svg)](https://travis-ci.org/codenautas/login-plus)
[![coverage](https://img.shields.io/coveralls/codenautas/login-plus/master.svg)](https://coveralls.io/r/codenautas/login-plus)
[![climate](https://img.shields.io/codeclimate/github/codenautas/login-plus.svg)](https://codeclimate.com/github/codenautas/login-plus)
[![dependencies](https://img.shields.io/david/codenautas/login-plus.svg)](https://david-dm.org/codenautas/login-plus)
[![qa-control](http://codenautas.com/github/codenautas/login-plus.svg)](http://codenautas.com/github/codenautas/login-plus)

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

var loginPlus = new require('login-plus').Manager;

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
si no redirecciona a `/login`. 

opts                | predeterminado       | uso
--------------------|----------------------|---------------
unloggedPath        | `../unlogged`        | carpeta en el servidor a la que apuntará la ruta /unlogged
loginPagePath       | `/../unlogged/login` | dirección al archivo .jade que tiene el dibujo de la pantalla de login
loginPageServe      | motor de jade        | función que sirve la página de login (usar esta función cuando no se desea un archivo .jade)
baseUrl             | `/`                  | dirección base de todas las URL
successRedirect     | `/index`             | dirección a donde debe redirigir la aplicación cuando hay un loggin exitoso
loginUrlPath        | `/login`             | dirección donde se muestra la página de login
noLoggedUrlPath     | `/login`             | dirección de la página que se muestra cuando no está logueado si intenta acceder a una página donde se requiere autenticación
failedLoginUrlPath  | `/login`             | dirección de la página que se muestra cuando falla el login
failedLoginUrlPath  | `/login`             | dirección de la página que se muestra cuando falla el login

Los middlewares a partir de ahí pueden acceder a los datos de sesión 
que están en `req.session.passport`.

<!--lang:en--]

From this line on, `loginPlus` controls whether the session is logged. 
If not, it redirects to `/login`.  

opts                | default opts         | use
--------------------|----------------------|---------------
unloggedPath        | `../unlogged`        | server directory to which the path /unlogged points 
loginPagePath       | `/../unlogged/login` | path to the .jade file that contains the login screen
loginPageServe      | motor de jade        | function that serves the login page (use this function when a .jade file is not desired)
baseUrl             | `/`                  | base URL for all other URLs
successRedirect     | `/index`             | successful login path
loginUrlPath        | `/login`             | URL to the login page
noLoggedUrlPath     | `/login`             | URL to the unlogged page where the authentification is required when trying to log in 
failedLoginUrlPath  | `/login`             | URL to the failing login page
userFieldName       | `username`           | name of the "username" field


From this point on, the middlewares can access the data session contained in `req.session.passport`.


[!--lang:*-->

## loginPlus.setValidator(fn)

<!--lang:es-->

Registra la función que debe validar el usuario 
y en caso de ser válido obtener la información adicional necesaria para la seción 
(ej: rol o nivel de permisos) que será accesible en `req.session.passport`.

<!--lang:en--]

It registers the function that the user must validate and in case of success, obtains 
the additional necessary information for the session (for example, role or level of permission) 
that will be available in `req.session.passport`

[!--lang:es-->

# Licencia

<!--lang:en--]

# License

[!--lang:*-->

[MIT](LICENSE)
