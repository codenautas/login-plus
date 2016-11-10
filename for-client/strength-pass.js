"use strict";

window.addEventListener('load', function(){
    oldPassword.onkeyup=function(){
        if(oldPassword.value.substr(0,5).toLowerCase()=='user:'){
            oldPassword.type='text';
        }else{
            oldPassword.type='password';
        }
    };
});