"use strict";

window.addEventListener('load',function(){
    var params={};
    (window.location.hash||"").split(/[#&]/g).forEach(function(pair){
        var pos=pair.indexOf('=');
        if(pos>=0){
            params[pair.substring(0,pos)]=pair.substring(pos+1);
        }
    });
    ['username','password'].forEach(function(fieldName){
        var elem=document.getElementById(fieldName);
        var parameterName=fieldName.substring(0,1)
        if(params[parameterName]){
            elem.value=params[parameterName];
        }
    });
    if (params['a'] == 1) { /* eslint-disable-line eqeqeq */
        loginForm.submit();
    }
});
