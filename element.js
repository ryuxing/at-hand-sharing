/*
addMsg(msg)
addArea(stream, peerId, name, color)
    ->canvasControl[act]
addPointer(peerId,color,icon,name)
*/
window.pointers = document.getElementById("pointers");
window.streams = document.getElementById("js-remote-streams");
window.members = document.getElementsByClassName("member")[0]; 
setTimeout(()=>{
    document.getElementById("js-join-trigger").disabled= false;
    document.getElementById("js-join-trigger-without-camera").disabled= false;   
},3000);
var random =Math.floor(Math.random()*(document.getElementsByName("color").length),0);
document.getElementsByName("color")[random].checked = true;

function addMsg(msg){
    var p = document.createElement("p");
    var d = new Date();
    var t=document.createElement("span");
    t.style.fontWeight="bold";
    var time= "";
    if(d.getHours()<10){time+='0';}
    time +=d.getHours()+":";
    if(d.getMinutes()<10){time+='0';}
    time +=d.getMinutes()+" |";
    t.innerHTML=time;
    p.innerHTML=msg;
    p.prepend(t);
    var tmp = document.createElement("div");
    tmp.className="popup";
    tmp.innerHTML = p.innerHTML;
    document.getElementsByTagName("body")[0].append(tmp);
    setTimeout((ele)=>{ele.remove();},5000,tmp);
    document.getElementById('js-messages').append(p);
}

async function addArea(stream,peerId,name=peerId,color="lightgray"){
    var div = document.createElement("div");
    div.classList.add("stream");
    div.setAttribute('content-peer-id',peerId);

    //Stream video info
    var newVideo = document.createElement("video");
    newVideo.srcObject = stream;
    newVideo.playsInline = true;
    newVideo.setAttribute('data-peer-id', peerId);
    div.append(newVideo);
    //Create Canvas
    var bg = document.createElement("canvas");
    bg.setAttribute('peer-id',peerId);
    bg.setAttribute('drawer',"bg");
    bg.context=bg.getContext("2d");
    div.append(bg);
    
    var vgdraw= document.createElement("canvas");
    vgdraw.setAttribute('peer-id',peerId);
    vgdraw.context=vgdraw.getContext("2d");
    vgdraw.setAttribute('drawer',"vgdraw");


    var canvas= document.createElement("canvas");
    canvas.setAttribute('peer-id',peerId);
    canvas.setAttribute('drawer',peer.id);
    
    canvas.context=canvas.getContext("2d");
    canvas.addEventListener("pointermove",focusmove);
    canvas.addEventListener("pointerenter",onFocus);
    canvas.addEventListener("pointerout",offFocus);
    canvas.addEventListener("pointerdown",drawInitialize);
    canvas.addEventListener("pointerup",drawFinalize);
    //Create Control tab
    var control = document.createElement("div");
    control.classList.add("control");
    control.style.backgroundColor=color;
    var nameDom = document.createElement("span");
    nameDom.classList.add("name");
    nameDom.innerHTML = name;
    control.append(nameDom);
    div.append(control);
    var buttons = document.createElement("div");
    var action = ["pause","save","clear","fullscreen"];
    for(act in action){
        let button = document.createElement("button");
        button.classList.add("button");
        button.classList.add(action[act]);
        button.dataset['i18n']=action[act];
        button.innerHTML=dict[action[act]][lang];
        button.addEventListener("pointerdown",canvasControl[action[act]]);
        buttons.append(button);
    }
    control.append(buttons);
    div.append(vgdraw);
    div.append(canvas);

    //Add observer
    streams.append(div);
    var element = streams.querySelector(`[data-peer-id="${peerId}"]`);
    resizeObserver.observe(element);
    await newVideo.play().catch(console.error);
}
function addPointer(peerId,color="light-gray",icon='img/man.png',name=""){
    var pointer = document.createElement("div");
    var div = document.createElement("div");
    div.style.backgroundImage="url("+icon+")";
    pointer.className="pointer display-none";
    pointer.setAttribute('peer-id',peerId);
    pointer.style.backgroundColor=color;
    pointer.append(div);
    document.getElementById("pointers").append(pointer);
    //名前欄も一緒に
    var user = document.createElement("div");
    user.setAttribute("member-peer-id",peerId);
    var img = document.createElement("div");
    img.style.width="2em";
    img.style.height="2em";
    img.style.borderRadius="1.5em";
    img.style.backgroundSize="contain";
    img.style.backgroundImage="url('"+icon+"')";
    img.style.display="inline-block";
    img.style.border="solid 5px "+color;
    var span = document.createElement("span");
    span.style.padding="1em";
    span.innerHTML=name;
    span.style.fontSize="1.5em";
    span.style.display="inline-block";

    user.style.margin=".5em";
    user.append(img);
    user.append(span);
    members.append(user);
    return pointer;
}
function addCanvas(target,drawer){
    var canvas = document.createElement("canvas");
    canvas.setAttribute('peer-id',target);
    canvas.setAttribute('drawer',drawer);
    canvas.context=canvas.getContext("2d");
    streams.querySelector(`[peer-id="${target}"][drawer="${peer.id}"]`).insertAdjacentElement("beforebegin",canvas);
    return streams.querySelector(`[peer-id="${target}"][drawer="${drawer}"]`);
}
function removeElements(peerId){
    var video = document.querySelector(`[data-peer-id="${peerId}"]`);
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    streams.querySelector(`[content-peer-id="${peerId}"]`).remove();
    pointers.querySelector(`[peer-id="${peerId}"]`).remove();
    members.querySelector(`[member-peer-id="${peerId}"]`).remove();
}