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
        //作業内容を保存
        var tmp_c = document.createElement("canvas");
        tmp_c.width = entry.target.clientWidth;
        tmp_c.height=entry.target.clientHeight;
        var ctx = tmp_c.getContext("2d");
        ctx.drawImage(canvas,0,0); 
        //リサイズ
        canvas.width=entry.target.clientWidth;
        canvas.height=entry.target.clientHeight; 
        //復元
        if(!resizing){
            setTimeout((tmp_c)=>{
                canvas.contexts.draw.scale(canvas.width/tmp_c.width,canvas.height/tmp_c.height);
                canvas.contexts.draw.drawImage(tmp_c,0,0);
                canvas.contexts.draw.scale(tmp_c.width/canvas.width,tmp_c.height/canvas.height);
                delete tmp_c;
                resizing=false;
            },300,tmp_c);
        }
    }
    resizing=true;
});
window.resizing =false;
//canvas control
window.canvasControl = {
    pause: function(e){
        var div = e.path[3];
        var video = div.querySelector("video");
        var v_info = video.srcObject.getVideoTracks()[0].getSettings();
        console.log(v_info);
        var canvas = div.querySelector("canvas");
        //すでに止まってるとき
        if("bg" in canvas.contexts){
            canvas.contexts.bg.clearRect(0,0,canvas.width,canvas,height);
            delete canvas.contexts.bg;
        }else{
            var tmp_c = document.createElement("canvas");
            tmp_c.width = canvas.width;
            tmp_c.height= canvas.height; 
            var ctx = tmp_c.getContext("2d");
            canvas.contexts.bg = canvas.getContext("2d");
            ctx.drawImage(canvas,0,0);
            canvas.contexts.bg.scale(canvas.width/v_info.width,canvas.width/v_info.width);
            canvas.contexts.bg.drawImage(video,0,0);
            canvas.contexts.bg.scale(v_info.width/canvas.width,v_info.width/canvas.width);
            canvas.contexts.draw.drawImage(tmp_c,0,0);
            delete tmp_c;
        }
    },
    save:  function(e){
        console.warn("save",e);
        var div = e.path[3];
        var video = div.querySelector("video");
        var v_info = video.srcObject.getVideoTracks()[0].getSettings();
        console.log(v_info);
        var canvas = div.querySelector("canvas");
        var tmp_c = document.createElement("canvas");
        tmp_c.width = v_info.width * 2;
        tmp_c.height = v_info.height * 2;
        tmp_c.contexts = {bg:null,draw:null};
        tmp_c.contexts.bg=tmp_c.getContext("2d");
        tmp_c.contexts.draw =tmp_c.getContext("2d");
        tmp_c.contexts.draw.scale(2,2);
        tmp_c.contexts.bg.drawImage(video,0,0);
        tmp_c.contexts.draw.scale(v_info.width/canvas.width,v_info.width/canvas.width);
        tmp_c.contexts.draw.drawImage(canvas,0,0);
        var url = tmp_c.toDataURL();
        var img =document.createElement("img");
        img.src=url;
        document.querySelector("div.img").append(img);
        tmp_c.remove();
        },
    clear: function(e){
        var div = e.path[3];
        var canvas = div.querySelector("canvas");
        if(canvas)
        canvas.width = canvas.width+1;
        canvas.width = canvas.width-1;
        var id= div.getAttribute("content-peer-id");
        room.send({clear:id});
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
    setTimeout(()=>{focusSendable=true;},110);
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
        var canvas = streams.querySelector(`[peer-id="${canvas}"]`);
        //保存するならここで
        canvas.width = canvas.width+1;
        canvas.width = canvas.width-1;
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
            point = addPointer(src,data.color,data.icon);
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