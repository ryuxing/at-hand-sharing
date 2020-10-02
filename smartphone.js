var touchStatus="off";
var stream;
var initStream;
window.onload=async function(){
    //ストリームするカメラの選択
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
    //スマホ対応確認
    if(typeof window.ontouchmove !="undefined"){
        document.getElementById("touchcontrol").querySelectorAll("input").forEach((e)=>{
            e.addEventListener("change",onChangeRadio);
        });
        document.getElementById("touchcontrol").classList.remove("display-none");
        document.getElementById("scroll").checked=true;
        onChangeRadio();
    }
    await main();
}

//スクロールロック
function scrollLock(e){
    e.preventDefault();
}

function onChangeRadio(){
    touchStatus=document.getElementById("touchcontrol").touchAction.value;
    if(touchStatus=="scroll"||touchStatus=="off"){
        console.log("scrollable");
        //scrollをロック解除
        document.removeEventListener("touchmove",scrollLock,{passive:false});
    }else{
        console.log("stop");
        //scrollロックをかける
        document.addEventListener("touchmove",scrollLock,{passive:false});

    }

}
