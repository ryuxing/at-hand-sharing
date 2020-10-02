const Peer = window.Peer;
var profile={
  name:"No Name",
  color:"pink",
  icon:"./man.png"
};
async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTriggerNoCam = document.getElementById('js-join-trigger-without-camera');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const messages = document.getElementById('js-messages');


  var localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {facingMode:"environment"}
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

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
    const room = peer.joinRoom(param.room, {
      mode: "mesh",
      stream: localStream,
    });
    cnvs={}; //キャンバスのコンテキストを保持
    room.once('open', () => {
      var time = getTime();
      messages.textContent += `===${time} ${param.room} に参加しました ===\n`;
      var divTag=document.getElementById("js-local-stream");
      if(divTag!=undefined){
        divTag.setAttribute("data-peer-id",peer.id);
        divTag=divTag.parentNode;
        divTag.children[1].setAttribute("peer-id",peer.id);
        cnvs[peer.id]={org:divTag.children[1]};
        resizeObserver.observe(document.getElementsByTagName("video")[0]);
        var contrl = divTag.parentNode.querySelector(".control").querySelectorAll("div");
        console.warn(contrl);
        contrl[1].addEventListener("pointerdown",pause);
        contrl[2].addEventListener("pointerdown",save);
        contrl[3].addEventListener("pointerdown",clear);
  
      }
      room.send({profile:profile});
    });
    room.on('peerJoin', peerId => {
      var time = getTime();
      messages.textContent += `=== ${time} 参加：${peerId}  ===\n`;
      room.send({profile:profile});
      var pointer= document.createElement("div");
      pointer.className="pointer display-none";
      //pointer の名前
      pointer.innerHTML="<div>"+peerId.slice(0,2)+"</div>";
      pointer.setAttribute('peer-id',peerId);
      var color="green";
      pointer.style.backgroundColor=color;
      var pList = document.getElementById("pointers");
      pList.append(pointer);

    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      var div = document.createElement("div");
      var control = document.createElement("div");
      control.className="control";
      var nameSpan = document.createElement("span");
      nameSpan.className="name";
      //名前と色を取得
      var name= stream.peerId;
      var color="lightgray";
      control.style.backgroundColor=color;
      nameSpan.innerHTML=name;
      control.append(nameSpan);
      //controlするボタンを配置
      control.innerHTML+='<div class="buttons"><div class="button pause">pause</div><div class="button save">save</div><div class="button clear">clear</div></div>';
      div.className="stream";
      var canvas= document.createElement("canvas");
      canvas.setAttribute('peer-id',stream.peerId);
      div.append(newVideo);
      div.append(canvas);
      div.append(control);
      remoteVideos.append(div);
      await newVideo.play().catch(console.error);
      var canv = div.childNodes[1];
      //マウスイベントリスナ追加
      console.dir(canv);
      cnvs[stream.peerId]={org:canv};
      canv.addEventListener("pointermove",focusmove);
      canv.addEventListener("pointerenter",onFocus);
      canv.addEventListener("pointerout",offFocus);
      canv.addEventListener("pointerdown",drawInitialize);
      canv.addEventListener("pointerup",drawFinalize);
      var contrl = div.querySelector(".control").querySelectorAll("div");
      contrl.querySelector(".pause").addEventListener("pointerdown",pause);
      contrl.querySelector(".save").addEventListener("pointerdown",save);
      contrl.querySelector(".clear").addEventListener("pointerdown",clear);
      
      //Touch
      /*
      canv.addEventListener("touchmove",focusmove);
      canv.addEventListener("touchstart",onFocus);
      canv.addEventListener("touchend",offFocus);
      canv.addEventListener("touchstart",drawInitialize);
      canv.addEventListener("touchend",drawFinalize);
      */
      resizeObserver.observe(newVideo);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      for (act in data){
        onDataRcv[act](src,data[act]);
      }
      //messages.textContent += `${src}: ${data}\n`;
      console.dir(data);
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      var point = document.querySelector(`#pointers [peer-id="${peerId}"]`);
      point.remove();
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.parentNode.remove();
      var time = getTime();
      messages.textContent += `===${time} 切断：${peerId}  ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      var time = getTime();
      messages.textContent += `===${time} 退室しました ===\n`;
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        if(remoteVideo.children[0].id=="js-local-stream"){
          return;
        }
        remoteVideo.children[0].srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.children[0].srcObject = null;
        remoteVideo.remove();
      });
      alert("退出しました。");
      open('about:blank', '_self').close();
    });
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    //完全なる独自関数

    //マウスでのフォーカス追従（自分）
    var focusSendable=true;
    var clicked=false;
    var focused=false;
    var drawing=[];
    var x,y,w,h;
    //canvas上でのマウスの動き・描画
    function focusmove(e){
        var rect = e.target.getBoundingClientRect()|{left:0,top:0};
        //console.log({clientY:e.touches[0].clientY,pageYoff:window.pageYOffset,recttop:rect.top});

        x = e.offsetX;
        y = e.offsetY;
        w = e.target.clientWidth;
        h = e.target.clientHeight;
        console.log({w:w,h:h,x:x,y:y});
        if(clicked){
            drawing.push({x:x,y:y,w:w,h:h,"peer-id":e.target.getAttribute('peer-id'),begin:false});
            cnvs[e.target.getAttribute('peer-id')][peer.id].lineTo(x,y);
            cnvs[e.target.getAttribute('peer-id')][peer.id].stroke();
        }

        if(!focusSendable){
            return;
        }
        var clientRect = e.target.getBoundingClientRect() ;
        var point = document.getElementsByClassName("pointer")[0];
        point.style.top = (window.pageYOffset + clientRect.top + y)+"px";
        point.style.left = (window.pageXOffset + clientRect.left + x)+"px";
        focusSendable=false;
        var val={mouse:{x:x,y:y,w:w,h:h,"peer-id":e.target.getAttribute('peer-id')}};
        console.log(e.target.getAttribute('peer-id'));
        if(drawing.length!=0){
            val.draw=JSON.parse(JSON.stringify(drawing));
        }
        room.send(val);
        setTimeout(()=>{focusSendable=true;},100);
    }
    //フォーカス追従開始(自分)
    function onFocus(){
        var point = document.getElementsByClassName("pointer")[0];
        point.classList.remove("display-none");
    }
    //フォーカス追従終了(自分)
    function offFocus(){
        var point = document.getElementsByClassName("pointer")[0];
        point.classList.add("display-none");
        room.send({mouseout:true});
        clicked=false;
    }
    function drawInitialize(e){
      
      if(touchStatus=="scroll"||touchStatus=="point"){return;}
        x = e.offsetX;
        y = e.offsetY;
        w = e.target.clientWidth;
        h = e.target.clientHeight;

      console.dir(cnvs);
      console.log(peer.id in cnvs[e.target.getAttribute('peer-id')]==false);
        if(peer.id in cnvs[e.target.getAttribute('peer-id')]==false){
          cnvs[e.target.getAttribute('peer-id')][peer.id]=e.target.getContext("2d");
        }
        let mycnvs=cnvs[e.target.getAttribute('peer-id')][peer.id];
        console.log({cnvs:cnvs,mycnvs:mycnvs});
        mycnvs.lineWidth=3;
        mycnvs.strokeStyle="red";
        mycnvs.beginPath();
        mycnvs.moveTo(x,y);
        drawing.push({"peer-id":e.target.getAttribute('peer-id'),x:x,y:y,w:w,h:h,begin:true});
        mycnvs.lineCap="round";
        clicked=true;
    }
    function drawFinalize(e){
      if(touchStatus=="scroll"||touchStatus=="point"){return;}
      let mycnvs=cnvs[e.target.getAttribute('peer-id')][peer.id];
        drawing.push({"peer-id":e.target['peer-id'],x:x,y:y,w:w,h:h,begin:false});
        mycnvs.lineTo(x,y);
        mycnvs.stroke();
        mycnvs.save();
        clicked=false;
        console.log(drawing);
        var lastDraw=JSON.parse(JSON.stringify(drawing));
        room.send({draw:{lastDraw}});
        //送信
        drawing=[];
    }
    //フォーカス追従(自分)のイベントリスナー追加
    //(Safari以外)
    console.log()
    if(document.getElementsByTagName("canvas")[0] !=undefined){
    document.getElementsByTagName("canvas")[0].addEventListener("pointermove",focusmove);
    document.getElementsByTagName("canvas")[0].addEventListener("pointerenter",onFocus);
    document.getElementsByTagName("canvas")[0].addEventListener("pointerout",offFocus);
    document.getElementsByTagName("canvas")[0].addEventListener("pointerdown",drawInitialize);
    document.getElementsByTagName("canvas")[0].addEventListener("pointerup",drawFinalize);
    }
    //canvasサイズの変化
    const resizeObserver = new ResizeObserver(async entries=>{
        console.dir(entries); 
        for(entry of entries){
            //delayのキャンセル
            let canvas = entry.target.parentNode.getElementsByTagName("canvas")[0];
            if(Math.abs(((canvas.width/canvas.height)/(entry.target.clientWidth/entry.target.clientheight))-1)>0.1){
              //縦横比が大きく変化したとき =　スマホ等の画面が回転したときは、描画内容を保存しない
              canvas.width=entry.target.clientWidth;
              canvas.height=entry.target.clientHeight; 
              continue; 
            }
            var img=[];
            let prev={w:canvas.width,h:canvas.height};
            console.log(cnvs[canvas.getAttribute("peer-id")]);
            
            Object.entries(cnvs[canvas.getAttribute("peer-id")]).every(([key,contxt])=>
            {
              if(key=="org") {return true;}
              //contxt.save();
              
              img[key] = contxt.getImageData(0,0,canvas.width,canvas.height);
              console.dir(img[key]);
              return true;
            }
            );
            canvas.width=entry.target.clientWidth;
            canvas.height=entry.target.clientHeight;
            console.log({cnvs:Object.keys(cnvs[canvas.getAttribute("peer-id")]),length:Object.keys(cnvs[canvas.getAttribute("peer-id")]).length});
            //Todo 描かれていた描画の処理
            
            Object.entries(cnvs[canvas.getAttribute("peer-id")]).every(([key,contxt])=>
            {
              console.log(contxt);
              if(key=="org") {return true;}
              //contxt.restore();
              contxt.putImageData(img[key],0,0,0,0,canvas.width,canvas.height);
              console.log(img[key]);

              return true;
            }
            );
            

        }
    });
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
    }
    //時刻返し
    function getTime(){
        var d = new Date();
        var time="";
        if(d.getHours()<10){time+='0';}
        time +=d.getHours()+":";
        if(d.getMinutes()<10){time+='0';}
        time +=d.getMinutes()+" /";
        return time; 
    }

    const onDataRcv = {
      mouse: function(src,data){
        //srcのポインタをdataに反映させる
        //display-noneクラスを削除
        console.dir(data);
        var canvs = document.querySelector(`canvas[peer-id="${data['peer-id']}"]`);
        var cursor = document.querySelector(`div[peer-id="${src}"]`);
        var rect = canvs.getBoundingClientRect();
        cursor.style.top=((window.pageYOffset + rect.top)  + ((canvs.clientHeight/data.h)*data.y))+"px";
        cursor.style.left=((window.pageXOffset+ rect.left) + ((canvs.clientWidth/data.w)*data.x) )+"px";
        cursor.classList.remove("display-none");
      },
      draw: function(src,data){
        console.dir(data);
        //canvasに描画する
        
        for(var i=0;i<data.length;i++){
          let obj = data[i];
          let xcvs = (cnvs[obj['peer-id']].org.clientWidth/obj.w )*obj.x;
          let ycvs = (cnvs[obj['peer-id']].org.clientHeight/obj.h)*obj.y;
          if(src in cnvs[obj['peer-id']]==false){
            cnvs[obj['peer-id']][src]=cnvs[obj['peer-id']].org.getContext("2d");
          }
          let mycnvs=cnvs[obj['peer-id']][src];
          console.dir(mycnvs);
          if(obj.begin){
            mycnvs.lineWidth=3;
            mycnvs.strokeStyle="red";//色の選択を後ほど考える
            mycnvs.beginPath();
            mycnvs.moveTo(xcvs,ycvs);
            console.log({beg:true,x:xcvs,y:ycvs});
          }else{
            mycnvs.lineTo(xcvs,ycvs);
            console.log({beg:false,x:xcvs,y:ycvs});
          } 
          mycnvs.stroke();
        }
      },
      mouseout: function(src){
        //srcのポインタにクラス付与
        var cursor = document.querySelector(`div[peer-id="${src}"]`);
        cursor.classList.add("display-none");

      },
      profile: function(src,data){
        console.warn(src+": profile{Obj}");
        var point = document.querySelector(`#pointers [peer-id="${src}"]`);
        console.log(point);
        if(point==null){

          var pointer= document.createElement("div");
          pointer.className="pointer display-none";
          pointer.setAttribute('peer-id',src);
          var pList = document.getElementById("pointers");
          pList.append(pointer);
          point = document.querySelector(`#pointers div[peer-id="${src}"]`);
          console.log(point);
        }
        //pointer の名前
        point.innerHTML="<div>　</div>";
        point.style.backgroundColor=data.color;
        if(data.icon==""){data.icon="./man.png";}
        point.querySelector("div").style.backgroundImage="url("+data.icon+")";
        
        //videoは3秒後に実施
        setTimeout((src,data)=>{
          var video = document.querySelector(`[data-peer-id="${src}"]`);
          if(video!=null){
            video = video.parentNode;
            video.querySelector(".control").style.backgroundColor=data.color;
            video.querySelector(".name").innerHTML=data.name;
          }

        },3000,src,data);
      },
      clear: function(src,canvas){
        var size = {w:cnvs[canvas].org.width,h:cnvs[canvas].org.height};
        cnvs[canvas].org.width+=1;
        cnvs[canvas].org.width-=1;
        
      },
      save: function(src,canvas){
        console.log(cnvs[canvas].org);
        var csize = {w:cnvs[canvas].org.width,h:cnvs[canvas].org.height};
        var v= document.querySelector(`video[data-peer-id=${canvas}]`);
        var vsize = {w:v}//Video Size
        var img={};
        Object.entries(cnvs[canvas]).every(([key,ctx])=>{
          console.log(ctx);
          if(ctx.save==undefined){return true;}
          console.log("restore");
          console.log(csize);

          img[key]=ctx.getImageData(0,0,csize.w,csize.h);
          return true;        
        });
        cnvs[canvas].tmp=cnvs[canvas].org.getContext("2d");
        var contxt=document.getElementById("tmp").getContext("2d");
        console.log(cnvs[canvas].tmp);
        cnvs[canvas].tmp.drawImage(v,10,10);
        document.getElementById("tmp").width=csize.w;
        document.getElementById("tmp").height=csize.h;
        contxt.drawImage(v,0,0);
        Object.entries(img).every(([key,img])=>{
          cnvs[canvas][key].putImageData(img,0,0);
          contxt.putImageData(img,0,0);

          return true;        
        });/*
        cnvs[canvas].org.toBlob((blob)=>{
          var d = new Date();
          //"circuitImg/"+name+"/"+
          var filename = (d.getMonth+1)+""+d.getDate+"-"+d.getHours()+""+d.getMinutes()+""+d.getSeconds()+"_"+document.querySelector(`video[data-peer-id=${canvas}]`).parentNode.querySelector(".name").innerHTML+".png";
          window.open(URL.createObjectURL(blob),"_blank");
          //save to firebase 
          //Clear
          cnvs[canvas].tmp.clearRect(0,0,size.w,size.h);
  
        });*/
  
        },
        pause: function(src,video){
          var v= document.querySelector(`[data-peer-id=${video.id}]`);
          if(video.pause){v.pause();}
          else v.start();
        }
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