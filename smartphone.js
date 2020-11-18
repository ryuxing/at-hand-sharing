var touchStatus="off";
var stream;
var initStream;
window.onload= async function(){
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
