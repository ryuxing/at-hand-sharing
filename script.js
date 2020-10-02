const Peer = window.Peer;
var profile={
  name:"No Name",
  color:"pink",
  icon:"img/man.png"
};
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
    localVideo.parentNode.remove();
    joinTrigger.click();
  },{passive:true});
  // Register join handler
  joinTrigger.addEventListener('click', () => {
    console.dir(stream);
    stream.getVideoTracks()[0].stop();
    document.querySelector(".init").remove();
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }
    var param= getRoomId();
    if(('room' in param)==false){
      alert("Invalid URL!");
      return;
    }
    window.room = peer.joinRoom(param.room, {
      mode: "mesh",
      stream: localStream,
    });
    room.once('open', () => {
      addMsg(param.room+"に入室しました");
      addArea(localStream,peer.id,profile.name+" (自分)","red");
      addPointer(peer.id,"red",profile.icon);
      room.send({profile:profile});
    });
    room.on('peerJoin', peerId => {
      addMsg(peerId+"が入室しました");
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
      var name = streams.querySelector(`#pointers [peer-id="${peerId}"]`).querySelector(".name").innerHTML;
      addMsg(name+" さん が退出しました。");
      removeElements(peerId);
      messages.textContent += `===${time} 切断：${peerId}  ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      addMsg("退出しました。");
      streams.querySelectorAll('[context-peer-id]').forEach(stream => {
        removeElements(stream.getAttribute("context-peer-id"));
      });
      alert("退出しました。");
    });
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    //完全なる独自関数

    //マウスでのフォーカス追従（自分）

    //RoomId自動入力(Get ?room=[yourRoom])
    function getRoomId(){
        var url = window.location.search.substring(1);
        var params  =url.split('&');
        var param={};
        for (target of params){
            console.log(target);
            if(target!=""){
                target = target.split("=");
                param[target[0]] = target[1];    
            }
        }
        return param;
    };
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