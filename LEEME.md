<!--multilang v0 es:LEEME.md en:README.md -->
# login-plus
<!--lang:es-->
servicio de login para aplicaciones basadas en express
<!--lang:en--]
login service for express
[!--lang:*-->

<!-- cucardas -->
![stable](https://img.shields.io/badge/stability-stable-brightgreen.svg)
[![npm-version](https://img.shields.io/npm/v/login-plus.svg)](https://npmjs.org/package/login-plus)
[![downloads](https://img.shields.io/npm/dm/login-plus.svg)](https://npmjs.org/package/login-plus)
[![build](https://img.shields.io/travis/codenautas/login-plus/master.svg)](https://travis-ci.org/codenautas/login-plus)
[![coverage](https://img.shields.io/coveralls/codenautas/login-plus/master.svg)](https://coveralls.io/r/codenautas/login-plus)
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

var loginPlus = new (require('login-plus').Manager);

loginPlus.init(app,{ successRedirect:'/index' });

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
loginPagePath       | *interno [1]*        | dirección al archivo .jade que tiene el dibujo de la pantalla de login
loginPageServe      | *motor de jade*      | función que sirve la página de login (usar esta función cuando no se desea un archivo .jade)
baseUrl             | `/`                  | dirección base de todas las URL
successRedirect     | *obligatorio*        | dirección a donde debe redirigir la aplicación cuando hay un loggin exitoso
successReturns      | false                | indica si debe volver a la URL anterior en caso de que al login se haya llegado redireccionando         
loginUrlPath        | `/login`             | dirección donde se muestra la página de login
noLoggedUrlPath     | `/login`             | dirección de la página que se muestra cuando no está logueado si intenta acceder a una página donde se requiere autenticación
failedLoginUrlPath  | `/login`             | dirección de la página que se muestra cuando falla el login
logoutRedirect      | noLoggedUrlPath      | dirección de la página a la que se redirige después de entrar a /logout
userFieldName       | `username`           | nombre del campo "username"
secret              | random key           | clave para las cookies, si se omite se cortará la sesión al cortar el servidor (porque en forma predeterminada la clave secreta es aleatoria y por lo tanto cambia)
**php**             | false                | si comparte el sistema de login con un sistema en PHP
.save_path          |                      | lugar donde encontrar las sesiones PHP
.varLogged          |                      | variable de `$SESSION` que indica si el usuario está logueado
**loginForm**       |                      | opciones del formulario de login
.usernameLabel      | `Username`           | texto para el campo usuario
.passwordLabel      | `Password`           | texto para el campo password
.buttonLabel        | `Log In`             | texto del botón entrar
.formTitle          | `login`              | título del formulario
.formImg            |                      | imagen a la derecha del formulario
.autoLogin          | false                | si permite el autologuea desde la URL especificando los parámetros `?u=user&p=pass&a=1`
store.module        | null                 | functión de devuelve el constructor apara almacenar el los datos de sesión (recibe como parámetro la instancia de express-session)

Los middlewares a partir de ahí pueden acceder a los datos de sesión 
que están en `false`.

<!--lang:en--]

From this line on, `loginPlus` controls whether the session is logged. 
If not, it redirects to `/login`.  

opts                | default opts         | use
--------------------|----------------------|---------------
loginPagePath       | *internal [1]*       | path to the .jade file that contains the login screen
loginPageServe      | *jade motor*         | function that serves the login page (use this function when a .jade file is not desired)
baseUrl             | `/`                  | base URL for all other URLs
successRedirect     | *mandatory*          | successful login path
successReturns      | false                | returns to previous path when login
loginUrlPath        | `/login`             | URL to the login page
noLoggedUrlPath     | `/login`             | URL to the unlogged page where the authentification is required when trying to log in 
failedLoginUrlPath  | `/login`             | URL to the failing login page
userFieldName       | `username`           | name of the "username" field
secret              | random key           | keys for cookies
**php**             | false                | hibrid login system mergin with PHP
.save_path          |                      | path of PHP session files
.varLogged          |                      | `$SESSION` variable name for login control
**loginForm**       |                      | opciones del formulario de login
.usernameLabel      | `Username`           | username label
.passwordLabel      | `Password`           | password label
.buttonLabel        | `Log In`             | button label
.formTitle          | `login`              | form title
.formImg            |                      | form image
.autoLogin          | false                | enable direct login from URL with `?u=user&p=pass&a=1`
store.module        | null                 | function that returns the constructor of the module to store sessions (it receive the express-session instance as first argument)

From this point on, the middlewares can access the data session contained in `req.user`.


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
