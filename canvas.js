//Observer
window.resizeObserver = new ResizeObserver(async entries=>{
    for (entry of entries){
        let canvas = entry.target.parentNode.getElementsByTagName("canvas")[0];
        if(Math.abs(((canvas.width/canvas.height)/(entry.target.clientWidth/entry.target.clientheight))-1)>0.1){
        //縦横比が大きく変化したとき =　スマホ等の画面が回転したときは、描画内容を保存しない
        canvas.width=entry.target.clientWidth;
        canvas.height=entry.target.clientHeight; 
        continue; 
        }
        //作業内容を保存するなら保存する
        canvas.width=entry.target.clientWidth;
        canvas.height=entry.target.clientHeight; 
   
    }
});

//canvas control
window.canvasControl = {
    pause: function(e){
        console.warn("pause",e);
    },
    save:  function(e){
        console.warn("save",e);
    },
    clear: function(e){
        console.warn("clear",e);
    }
};
//local drawing
var clicked=false;
var focusSendable=true;
var drawing=[];
var x,y,w,h;

function focusmove(e){
    //x,y,w,hの取得
    x = e.offsetX;
    y = e.offsetY;
    w = e.target.clientWidth;
    h = e.target.clientHeight;
    //描画処理
    if(clicked){
        drawing.push({x:x,y:y,w:w,h:h,"peer-id":e.target.getAttribute('peer-id'),begin:false});
        e.target.contexts[peer.id].lineTo(x,y);
        e.target.contexts[peer.id].stroke();
    }
    //0.15秒に1回送信
    if(!focusSendable){
        return;
    }
    var clientRect = e.target.getBoundingClientRect();
    console.log(e.target.getAttribute('peer-id'));
    var point = pointers.querySelector(`[peer-id="${peer.id}"]`);
    point.style.top = (window.pageYOffset + clientRect.top + y)+"px";
    point.style.left = (window.pageXOffset + clientRect.left + x)+"px";
    focusSendable=false;
    var val={mouse:{x:x,y:y,w:w,h:h,"peer-id":e.target.getAttribute('peer-id')}};
    if(drawing.length!=0){
        val.draw=JSON.parse(JSON.stringify(drawing));
    }
    room.send(val);
    drawing=[];
    setTimeout(()=>{focusSendable=true;},150);
}
function onFocus(e){
    pointers.querySelector(`[peer-id="${peer.id}"]`).classList.remove("display-none");
}
function offFocus(e){
    pointers.querySelector(`[peer-id="${peer.id}"]`).classList.add("display-none");
    clicked=false;
    room.send({mouseout:true});
}
function drawInitialize(e){
    if(touchStatus=="scroll"||touchStatus=="point"){return;}
    x = e.offsetX;
    y = e.offsetY;
    w = e.target.clientWidth;
    h = e.target.clientHeight;
    if(peer.id in e.target.contexts==false){
        e.target.contexts[peer.id]=e.target.getContext("2d");
    }
    let mycnvs = e.target.contexts[peer.id];
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
    let mycnvs = e.target.contexts[peer.id];
    drawing.push({"peer-id":e.target['peer-id'],x:x,y:y,w:w,h:h,begin:false});
    mycnvs.lineTo(x,y);
    mycnvs.stroke();
    mycnvs.save();
    clicked=false;
    var lastDraw=JSON.parse(JSON.stringify(drawing));
    room.send({draw:{lastDraw}});
    drawing=[];
}
//remote drawing
window.onDataRcv ={
    mouse: function(src,data){
        //srcのポインタをdataに反映させる
        //display-noneクラスを削除
        console.dir(data);
        var canvas = streams.querySelector(`[peer-id="${data['peer-id']}"]`);
        var cursor = pointers.querySelector(`[peer-id="${src}"]`);
        console.dir(canvas);
        var rect = canvas.getBoundingClientRect();
        cursor.style.top=((window.pageYOffset + rect.top)  + ((canvas.clientHeight/data.h)*data.y))+"px";
        cursor.style.left=((window.pageXOffset+ rect.left) + ((canvas.clientWidth/data.w)*data.x) )+"px";
        cursor.classList.remove("display-none");
    },
    draw: function(src,data){
        for(var i=0;i<data.length;i++){
            let obj = data[i];
            let canvas = streams.querySelector(`[peer-id="${obj['peer-id']}"]`);
            let xcvs = (canvas.clientWidth/obj.w )*obj.x;
            let ycvs = (canvas.clientHeight/obj.h)*obj.y;
            if(src in canvas.contexts==false){
              canvas.contexts[src]=canvas.getContext("2d");
            }
            let mycnvs=canvas.contexts[src];
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
    mouseout: function(src,data){
        //srcのポインタにクラス付与
        var cursor = pointers.querySelector(`[peer-id="${src}"]`);
        cursor.classList.add("display-none");
    },
    clear: function(src,canvas){
        /*
        w = e.target.clientWidth;
        h = e.target.clientHeight;  
        */  
    },
    pause: function(){
        //hoge
    },    
    profile: function(src,data){
        //ポインター、プロフィールの更新
        if(data.icon==""){data.icon="img/man.png";}
        var point = pointers.querySelector(`[peer-id="${src}"]`);
        if(point==null){
            point = addPointer(src,data.color,"url('"+data.icon+"')");
        }else{
            point.style.backgroundColor=data.color;
            point.querySelector("div").style.backgroundImage="url("+data.icon+")";
        }
        //ビデオプロフィール更新
        var video = streams.querySelector(`[data-peer-id="${src}"]`);
        if(video==null){
            //videoは読み込みが遅いことを考慮して3秒後に実施
            setTimeout((src,data)=>{
                var video = streams.querySelector(`[data-peer-id="${src}"]`);
                if(video==null){return;}
                video = video.parentNode;
                video.querySelector(".control").style.backgroundColor=data.color;
                video.querySelector(".name").innerHTML=data.name;
            },3000,src,data);
        }else{
            video = video.parentNode;
            video.querySelector(".control").style.backgroundColor=data.color;
            video.querySelector(".name").innerHTML=data.name;

        }
        //最初のお知らせ部分の文字更新
        var doms = document.getElementsByClassName(src);
        for(dom of doms){
            dom.innerHTML=data.name+" さん ";
            dom.className="";
        }
    }
}