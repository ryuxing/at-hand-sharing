function name_to_cookie(){
    var name = document.getElementsByName("name")[0].value;
    if(name!=""){
        cookie.name = name;
        document.cookie=JSON.stringify(cookie);
    }
    console.log(document.cookie);
}
function lang_to_cookie(){
    setTimeout(()=>{
        cookie.lang=lang;
        document.cookie=JSON.stringify(cookie);
        console.log(document.cookie);
    },500);
}

console.log(document.cookie);
document.getElementById("js-join-trigger").addEventListener("click",name_to_cookie);
document.getElementById("js-join-trigger-without-camera").addEventListener("click",name_to_cookie);
document.getElementById("language").addEventListener("change",lang_to_cookie);
var cookie = "{"+document.cookie.split("{")[1];
try{
    cookie=JSON.parse(cookie);
    if(cookie.name){
        document.getElementsByName("name")[0].value=cookie.name;
    }
    if(cookie.lang){
        change_language(cookie.lang);
    }
}catch(e){
    cookie={};
    console.warn(e);
}

