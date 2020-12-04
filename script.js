const Peer = window.Peer;
var profile={
  name:"No Name",
  color:"pink",
  icon:"img/man.png"
};
lang = "ja";
var _GET = window.location.search.substring(1);
var params=_GET.split("&");
var param={};
for (target of params){
    if(target!=""){
        target = target.split("=");
        param[target[0]] = target[1];    
    }
}
if('room' in param){
  document.querySelector("input[name='roomId']").value= decodeURI(param.room);
}
async function main() {
  const joinTriggerNoCam = document.getElementById('js-join-trigger-without-camera');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const messages = document.getElementById('js-messages');


  var localStream = null;
  // Render local stream
  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));
  joinTriggerNoCam.addEventListener("click",()=>{
    if(localStream!=null){
      localStream.getTracks()[0].stop();
      localStream = null;
    }
    startSharing();
    },{passive:true});
  //カメラONトリガー
  async function getCamera(){
    //ストリームするカメラの選択

  }
  async function localStreamOn(e){
  document.getElementById("init-popup").classList.remove("display-none");
  e.target.removeEventListener("click",localStreamOn);
  initStream = document.getElementById('init-stream');
  stream= await navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: {facingMode:"environment"}
  })
  .catch(console.error);
  console.log(stream);
  initStream.muted = true;
  initStream.srcObject = stream;
  initStream.playsInline = true;
  initStream.play();
  navigator.mediaDevices.enumerateDevices()
      .then(function(devices) { // 成功時
          devices.forEach(function(device) {
              if(device.kind=="videoinput"){
                  let dom = document.createElement("option");
                  dom.value=device.deviceId;
                  //facing
                  dom.innerHTML="";
                  console.dir(device);
              }
              
          // デバイスごとの処理
          });
      }).catch(function(err) { // エラー発生時
          console.error('enumerateDevide ERROR:', err);
      });

  localStream = await navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: {facingMode:"environment"}
  })
  .catch(console.error);
  e.target.innerHTML = dict.join_with_video[lang];
  e.target.dataset['i18n']="join_with_video";
  document.getElementById("start").addEventListener("click",startSharing);
  }
joinTrigger.addEventListener("click",localStreamOn);
  // Register join handler
  function startSharing(){
    var name = document.querySelector("input[name='name']").value;
    var color = document.querySelector("div form").color.value;
    var icon = document.querySelector("input[name='icon']").value;
    var roomName = document.querySelector("input[name='roomId']").value||"empty_room";
    profile.name=name||profile.name;
    profile.color=color||profile.color;
    profile.icon=icon||profile.icon;
    //Create a icon Shape
    if(name!=""){
      var icon_cv = document.createElement("canvas");
      icon_cv.width=80;
      icon_cv.height=80;
      var icon_ctx = icon_cv.getContext("2d");
      icon_ctx.fillStyle = "rgba(255,255,255,0.6)";
      icon_ctx.fillRect(0,0,80,80);
      icon_ctx.fillStyle = "black"
      icon_ctx.font = "bold 60px Gothic";
      icon_ctx.textBaseline = "hanging";
      var icon_txt=profile.name.slice(0,1);
      if(profile.name.split(/[\ 　]/).length>1 && icon_txt.match(/[\x01-\x7E]/)){
        icon_txt += profile.name.split(/[\ 　]/)[1].slice(0,1);
        console.warn("icon_txt");
      }
      icon_ctx.fillText(icon_txt, 10, 10,60);
      profile.icon = icon_cv.toDataURL("image/png");
      delete icon_cv;  
      console.log(profile.icon);
    }
    document.getElementsByTagName("title")[0].innerHTML= roomName+" | ShareHandy";
    history.replaceState("",roomName+" | ShareHandy","?room="+roomName);
    if(stream!=undefined){
      stream.getVideoTracks()[0].stop();
    }
    document.querySelector(".init").remove();
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }
    window.room = peer.joinRoom(roomName, {
      mode: "sfh",
      stream: localStream,
    });
    room.once('open', () => {
      addMsg(roomName+"<span data-i18n='you_enter_room'>"+dict.you_enter_room[lang]+"</span>");
      document.getElementById("h2_roomId").innerHTML=roomName;
      if(localStream!=null){
        addArea(localStream,peer.id,profile.name+" (You)",profile.color);
        streams.querySelector(`[content-peer-id="${peer.id}"]`).setAttribute("init","done");
      }

      addPointer(peer.id,profile.color,profile.icon,profile.name+"(You)");
      room.send({profile:profile});
      registerLogging();
    });
    room.on('peerJoin', peerId => {
      addMsg("<span class='"+peerId+"'>"+peerId+"</span><span data-i18n='anyone_enters_room'>"+dict.anyone_enters_room[lang]+"</span>");
      addPointer(peerId);
      if(streams.querySelector(`[content-peer-id="${peer.id}"]`)==null){
        console.warn("sent");
        room.send({profile:profile});
        return;
      }
      console.warn("sent with canvas");

      var canvas = document.createElement("canvas");
      canvas.context = canvas.getContext("2d");
      var current = streams.querySelectorAll(`[peer-id="${peer.id}"]:not([drawer="bg"])`);
      canvas.width = current[0].width;
      canvas.height = current[0].height;
      for(cv of current){
        canvas.context.drawImage(cv,0,0);
      }

      var newProf = JSON.parse(JSON.stringify(profile));
      newProf.img = canvas.toDataURL();
      newProf.w = canvas.width;
      newProf.h = canvas.height;
      if(streams.querySelector(`[content-peer-id="${peer.id}"]`).classList.contains("full-screen")){
        newProf.fullscreen = true

      }
      if(streams.querySelector(`[peer-id="${peer.id}"][drawer="bg"]`).pause){
        var bgCanvas = streams.querySelector(`[peer-id="${peer.id}"][drawer="bg"]`);
        newProf.bg = bgCanvas.toDataURL();
        newProf.bgw= bgCanvas.width;
        newProf.bgh= bgCanvas.height;
      }

      room.send({profile:newProf});
      delete canvas;

    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      addArea(stream,stream.peerId);
    });

    room.on('data', ({ data, src }) => {
      for (act in data){
        onDataRcv[act](src,data[act]);
      }
      console.dir(data);
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      var name = streams.querySelector(`[content-peer-id="${peerId}"]`).querySelector(".name").innerHTML;
      addMsg(name+"<span i18n='anyone_left_room'>"+dict.anyone_left_room[lang]+"</span>");
      removeElements(peerId);
    });

    // for closing myself
    room.once('close', () => {
      addMsg("<span i18n='you_left_room'>"+dict.you_left_room[lang]+"</span>");
      console.log(streams);
      streams.querySelectorAll('[content-peer-id]').forEach(stream => {
        console.log("close");
        console.log(stream.getAttribute("content-peer-id"));
        removeElements(stream.getAttribute("content-peer-id"));
      });
      alert(dict.you_left_room[lang]);
      //ユーザー一覧を削除
      //todo

    });
    leaveTrigger.addEventListener('click', () =>{ room.close(); leaveTrigger.disabled=true;}, { once: true });

    //完全なる独自関数

    //マウスでのフォーカス追従（自分）

    function pause(e,pause){
      var v = e.target.parentNode.parentNode.parentNode.querySelector("video");
      if(pause){
          v.pause();
      }else{
          v.start();
      }
      room.send({pause:{pause:pause,id:v.getAttribute("data-peer-id")}});
  }
  function save(e){
      var v = e.target.parentNode.parentNode.parentNode.querySelector("video").getAttribute("data-peer-id");
      room.send({save:v});
      onDataRcv.save(null,v);
  }
  function clear(e){
    console.log(e.target.parentNode.parentNode);
      var v = e.target.parentNode.parentNode.parentNode.querySelector("video").getAttribute("data-peer-id");
      room.send({save:v});
      onDataRcv.save(null,v);
  
    }
  }
  peer.on('error', console.error);


}