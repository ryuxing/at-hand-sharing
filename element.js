/*
addMsg(msg)
addArea(stream, peerId, name, color)
    ->canvasControl[act]
addPointer(peerId,color,icon,name)
*/
window.pointers = document.getElementById("pointers");
window.streams = document.getElementById("js-remote-streams");
function addMsg(msg){
    var p = document.createElement("p");
    var d = new Date();
    var t=document.createElement("span");
    t.style.fontWeight="bold";
    var time= t.innerHTML;
    if(d.getHours()<10){time+='0';}
    time +=d.getHours()+":";
    if(d.getMinutes()<10){time+='0';}
    time +=d.getMinutes()+" /";
    p.append(t);
    p.innerHTML+=msg;
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
    var name = document.createElement("span");
    name.classList.add("name");
    name.innerHTML = name;
    control.append(name);
    var buttons = document.createElement("div");
    var action = ["pause","save","clear"];
    for(act in action){
        let button = document.createElement("div");
        button.classList.add("button");
        button.classList.add(act);
        button.innnerHTML=act;
        button.addEventListener("pointerdown",canvasControl[act]);
        buttons.append(button);
    }
    //Add observer
    streams.append(div);
    resizeObserver.observe(newVideo);
    await newVideo.play().catch(console.error);
}
function addPointer(peerId,color="light-gray",icon="url('img/man.png')",name=""){
    var pointer = document.createElement("div");
    var div = document.createElement("div");
    pointer.append(div);
    div.innerHTML=name;
    div.style.backgroundImage=icon;
    pointer.className="pointer display-none";
    pointer.setAttribute('peer-id',peerId);
    pointer.style.backgroundColor=color;
    pointer.innerHTML=name;
    document.getElementById("pointers").append(pointer);
    return pointer;
}
function removeElements(peerId){
    var video = document.querySelector(`[data-peer-id="${peerId}"]`);
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    streams.querySelector(`[content-peer-id="${peerId}"]`).remove();
    pointers.querySelector(`[peer-id="${peerId}"]`).remove();
    addMsg("退出しました。");
}