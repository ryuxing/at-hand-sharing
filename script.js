const Peer = window.Peer;
var profile={
  name:"No Name",
  color:"pink",
  icon:"img/man.png"
};
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



  var localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {facingMode:"environment"}
    })
    .catch(console.error);

  // Render local stream
  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));
  joinTriggerNoCam.addEventListener("click",()=>{
    localStream.getTracks()[0].stop();
    localStream = null;
    joinTrigger.click();
  },{passive:true});
  // Register join handler
  joinTrigger.addEventListener('click', () => {
    var name = document.querySelector("input[name='name']").value;
    var color = document.querySelector("div form").color.value;
    var icon = document.querySelector("input[name='icon']").value;
    var roomName = document.querySelector("input[name='roomId']").value||"empty_room";
    profile.name=name||profile.name;
    profile.color=color||profile.color;
    profile.icon=icon||profile.icon;
    history.replaceState("",roomName+" | 回路共有システム","?room="+roomName);
    stream.getVideoTracks()[0].stop();
    document.querySelector(".init").remove();
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }
    window.room = peer.joinRoom(roomName, {
      mode: "mesh",
      stream: localStream,
    });
    room.once('open', () => {
      addMsg(roomName+"に入室しました");
      if(localStream!=null){
        addArea(localStream,peer.id,profile.name+" (自分)",profile.color);
      }
      addPointer(peer.id,profile.color,profile.icon);
      room.send({profile:profile});
    });
    room.on('peerJoin', peerId => {
      addMsg("<span class='"+peerId+"'>"+peerId+"</span>が入室しました");
      addPointer(peerId);
      room.send({profile:profile});
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
      addMsg(name+" さん が退出しました。");
      removeElements(peerId);
    });

    // for closing myself
    room.once('close', () => {
      addMsg("退出しました。");
      console.log(streams);
      streams.querySelectorAll('[content-peer-id]').forEach(stream => {
        console.log("close");
        console.log(stream.getAttribute("content-peer-id"));
        removeElements(stream.getAttribute("content-peer-id"));
      });
      alert("退出しました。");
    });
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

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
  },{passive:true});
  peer.on('error', console.error);


}