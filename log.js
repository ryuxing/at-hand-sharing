function registerLogging(){
  room.on("log",LogDataRcv);
  setInterval(LogData, 1000*30);
}
function LogData(){
  //get_snapshot
  if(document.querySelector(`[data-peer-id="${peer.id}"]`)==undefined){
    return;
  }
  var v = document.querySelector(`[data-peer-id="${peer.id}"]`);
  var c = document.createElement("canvas");
  c.width = v.videoWidth/3;
  c.height= v.videoHeight/3;
  var ctx = c.getContext("2d");
  ctx.scale(1/3,1/3);
  ctx.drawImage(v,0,0);
  room.send({snapshot:c.toDataURL("image/jpeg")});
  delete c;
  room.getLog();
}

var timestamps=[];
var tmp_data={};
function LogDataRcv(src){
  for(var log=0;log<src.length; log++){
    var ts = JSON.parse(src[log]).timestamp;
    if(tmp_data[ts]==undefined){
      tmp_data[ts] = new Array(src[log]);
      if(timestamps.indexOf(ts)==-1){
        timestamps.push(ts);
      }
    }
    if(tmp_data[ts].indexOf(src[log])==-1){
      tmp_data[ts].push(src[log]);
    }
  }
  
  console.log(tmp_data);

  //Upload
  var groupId = JSON.parse(src[0]).message.roomName;
  var d = new Date();
  var date = d.getMonth() +"-"+d.getDate();
  db.collection("ShareHandylog").doc(groupId+"_"+date).get().then((rcv)=>{
    console.log(rcv.data());
    if(rcv.exists ==false || Date.now() > rcv.data().last_update + (1000 * 60 )){
      tmp_data.last_update = Date.now();
      db.collection("ShareHandylog").doc(groupId+"_"+date).set(tmp_data,{merge:true}).then((res)=>{
        console.log("Sent.");
        //timestamps一番最後のtmp_dataものこす
        var last_time = timestamps[timestamps.length-1]
        var last_data = tmp_data[last_time];
        tmp_data={};
        timestamps=[];
        tmp_data[last_time]=last_data;
        timestamps.push(last_time);  
      });
    }
  });

  if(/*送信したら*/true){
  }
}
 
var db =  firestore;