/*
addMsg(msg)
addArea(stream, peerId, name, color)
    ->canvasControl[act]
addPointer(peerId,color,icon,name)
*/
window.pointers = document.getElementById("pointers");
window.streams = document.getElementById("js-remote-streams");
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
    var canvas= document.createElement("canvas");
    canvas.setAttribute('peer-id',peerId);
    canvas.contexts = {};
    canvas.contexts[peerId]=canvas.getContext("2d");
    canvas.contexts.draw=canvas.getContext("2d");
    canvas.addEventListener("pointermove",focusmove);
    canvas.addEventListener("pointerenter",onFocus);
    canvas.addEventListener("pointerout",offFocus);
    canvas.addEventListener("pointerdown",drawInitialize);
    canvas.addEventListener("pointerup",drawFinalize);
    div.append(canvas);
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
    var action = ["pause","save","clear"];
    for(act in action){
        let button = document.createElement("button");
        button.classList.add("button");
        button.classList.add(action[act]);
        button.innerHTML=action[act];
        button.addEventListener("pointerdown",canvasControl[action[act]]);
        buttons.append(button);
    }
    control.append(buttons);
    //Add observer
    streams.append(div);
    var element = streams.querySelector(`[data-peer-id="${peerId}"]`);
    resizeObserver.observe(element);
    await newVideo.play().catch(console.error);
}
function addPointer(peerId,color="light-gray",icon='img/man.png',name=""){
    var pointer = document.createElement("div");
    var div = document.createElement("div");
    div.innerHTML=name;
    div.style.backgroundImage="url("+icon+")";
    pointer.className="pointer display-none";
    pointer.setAttribute('peer-id',peerId);
    pointer.style.backgroundColor=color;
    pointer.innerHTML=name;
    pointer.append(div);
    document.getElementById("pointers").append(pointer);
    return pointer;
}
function removeElements(peerId){
    var video = document.querySelector(`[data-peer-id="${peerId}"]`);
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    streams.querySelector(`[content-peer-id="${peerId}"]`).remove();
    pointers.querySelector(`[peer-id="${peerId}"]`).remove();
}