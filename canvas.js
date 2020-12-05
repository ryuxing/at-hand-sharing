//Observer
window.resizeObserver = new ResizeObserver(async entries => {
    //フルスクリーン
    if (streams.querySelector(".full-screen") != null) {
        var div = streams.querySelector(".full-screen");
        var video = div.querySelector("video");
        if ((div.clientWidth / video.videoWidth) * video.videoHeight < div.clientHeight) {
            div.classList.remove("height-100");
            div.classList.add("width-100");
        } else {
            div.classList.add("height-100");
            div.classList.remove("width-100");
        }
    }
    //canvasのリサイズ
    for (entry of entries) {
        let canvases = entry.target.parentNode.getElementsByTagName("canvas");
        let canvas0 = canvases[0];
        if (Math.abs(((canvas0.width / canvas0.height) / (entry.target.clientWidth / entry.target.clientheight)) - 1) > 0.1) {
            //縦横比が大きく変化したとき =　スマホ等の画面が回転したときは、描画内容を保存しない
            canvas0.width = entry.target.clientWidth;
            canvas0.height = entry.target.clientHeight;
            continue;
        }
        //作業内容を保存
        for (canvas of canvases) {
            let tmp_c = document.createElement("canvas");
            tmp_c.width = canvas.width;
            tmp_c.height = canvas.height;
            let ctx = tmp_c.getContext("2d");
            ctx.drawImage(canvas, 0, 0);
            //復元
            if (!resizing) {

                setTimeout((tmp_c, peerId, drawer) => {
                    var canvas = streams.querySelector(`[peer-id="${peerId}"][drawer="${drawer}"]`);
                    var newcanv = document.createElement("canvas");
                    newcanv.width = canvas.width;
                    newcanv.height = canvas.height;
                    newcanv.context = newcanv.getContext("2d");
                    newcanv.context.scale(newcanv.width / tmp_c.width, newcanv.height / tmp_c.height);
                    newcanv.context.drawImage(tmp_c, 0, 0);
                    canvas.context.drawImage(newcanv, 0, 0);
                    delete newcanv;

                    resizing = false;
                }, 1000, tmp_c, canvas.getAttribute("peer-id"), canvas.getAttribute("drawer"));
            }
            //リサイズ
            canvas.width = entry.target.clientWidth;
            canvas.height = entry.target.clientHeight;

        }
    }
    resizing = true;

});
window.resizing = false;
//canvas control
window.canvasControl = {
    pause: function(e) {
        var div = e.target.parentNode.parentNode.parentNode;
        var video = div.querySelector("video");
        var canvas = div.querySelector("[drawer='bg']");

        if (canvas.pause) {
            canvas.context.clearRect(0, 0, canvas.width, canvas.height);
            room.send({ pause: { canvas: canvas.getAttribute("peer-id"), pause: false } });
            canvas.pause = false;
        } else {
            let tmp_c = document.createElement("canvas");
            tmp_c.width = canvas.width;
            tmp_c.height = canvas.height;
            tmp_c.context = tmp_c.getContext("2d");
            tmp_c.context.scale(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
            tmp_c.context.drawImage(video, 0, 0);
            canvas.context.drawImage(tmp_c, 0, 0);
            canvas.pause = true;
            room.send({ pause: { canvas: canvas.getAttribute("peer-id"), pause: true } });
            delete tmp_c;
        }
    },
    save: function(e) {
        var div = e.target.parentNode.parentNode.parentNode;
        var video = div.querySelector("video");
        var v_info = video.srcObject.getVideoTracks()[0].getSettings();
        console.log(v_info);
        var canvas = div.getElementsByTagName("canvas");
        var tmp_c = document.createElement("canvas");
        tmp_c.width = video.videoWidth;
        tmp_c.height = video.videoHeight;
        tmp_c.context = tmp_c.getContext("2d");
        tmp_c.context.drawImage(video, 0, 0);
        tmp_c.context.scale(video.videoWidth / canvas[0].width, video.videoHeight / canvas[0].height);
        for (var i = 0; i < canvas.length; i++) {
            tmp_c.context.drawImage(canvas[i], 0, 0);

        }

        var url = tmp_c.toDataURL();
        var img = document.createElement("img");
        img.src = url;
        document.querySelector("div.img").append(img);
        addMsg("<span data-i18n='save_complete'>"+dict.save_complete[lang]+"</span>")
        saveImg(url, document.querySelector(".name").innerHTML);
        tmp_c.remove();
    },
    clear: function(e) {
        var div = e.target.parentNode.parentNode.parentNode;
        var canvases = div.querySelectorAll("canvas:not([drawer='bg'])");
        console.log(canvases);

        for (canvas of canvases) {
            canvas.context.clearRect(0, 0, canvas.width, canvas.height);
        }
        var id = div.getAttribute("content-peer-id");
        room.send({ clear: id });
    },
    fullscreen: function(e) {
        var div = e.target.parentNode.parentNode.parentNode;
        var fullscreen = { target: div.getAttribute("content-peer-id") };
        if (!div.classList.contains("full-screen")) {
            div.classList.add("full-screen");
            fullscreen.status = true;
        } else {
            div.classList.remove("full-screen");
            fullscreen.status = false;
        }
        room.send({ fullscreen: fullscreen });
    }

};
//新canvasのクリア完了
function clearAll() {
    var canvases = document.getElementsByTagName("canvas");
    room.send({ clearAll: true });
    for (canvas of canvases) {
        canvas.context.clearRect(0, 0, canvas.width, canvas.height);
        if (canvas.pause != undefined) { canvas.pause = false; }
    }

}
//全保存
function saveAll(){
    var saveNode = document.getElementsByClassName("save");
    for(var node of saveNode){
        canvasControl.save({target:node});
        console.log("Clicked");
        console.dir(node);
    }
}
//local drawing
var clicked = false;
var focusSendable = true;
var drawing = [];
var x, y, w, h;

function focusmove(e) {
    //x,y,w,hの取得
    x = e.offsetX;
    y = e.offsetY;
    w = e.target.clientWidth;
    h = e.target.clientHeight;
    //描画処理
    if (clicked) {
        drawing.push({ x: x, y: y, w: w, h: h, "peer-id": e.target.getAttribute('peer-id'), begin: false });
        e.target.context.lineTo(x, y);
        e.target.context.stroke();
    }
    //0.15秒に1回送信
    if (!focusSendable) {
        return;
    }
    var clientRect = e.target.getBoundingClientRect();
    console.log(e.target.getAttribute('peer-id'));
    var point = pointers.querySelector(`[peer-id="${peer.id}"]`);
    point.style.top = (window.pageYOffset + clientRect.top + y) + "px";
    point.style.left = (window.pageXOffset + clientRect.left + x) + "px";
    focusSendable = false;
    var val = { mouse: { x: x, y: y, w: w, h: h, "peer-id": e.target.getAttribute('peer-id') } };
    if (drawing.length != 0) {
        val.draw = JSON.parse(JSON.stringify(drawing));
    }
    room.send(val);
    setTimeout(() => { focusSendable = true; }, 110);
}

function onFocus(e) {
    pointers.querySelector(`[peer-id="${peer.id}"]`).classList.remove("display-none");
}

function offFocus(e) {
    pointers.querySelector(`[peer-id="${peer.id}"]`).classList.add("display-none");
    clicked = false;
    room.send({ mouseout: true });
}

function drawInitialize(e) {
    if (touchStatus == "scroll" || touchStatus == "point") { return; }
    x = e.offsetX;
    y = e.offsetY;
    w = e.target.clientWidth;
    h = e.target.clientHeight;
    /*if(streams.querySelector(`[peer-id="${peerId}"][drawer="${peerId}"]`)){
        addCanvas(peerId,peerId);
    }*/
    let mycnvs = e.target.context;
    let color = pointers.querySelector(`[peer-id="${e.target.getAttribute("drawer")}"]`).style.backgroundColor;

    console.log(color);
    mycnvs.lineWidth = 3;
    mycnvs.strokeStyle = color;
    mycnvs.beginPath();
    mycnvs.moveTo(x, y);
    drawing.push({ "peer-id": e.target.getAttribute('peer-id'), x: x, y: y, w: w, h: h, begin: true });
    mycnvs.lineCap = "round";
    clicked = true;
}

function drawFinalize(e) {
    if (touchStatus == "scroll" || touchStatus == "point") { return; }
    let mycnvs = e.target.context;
    drawing.push({ "peer-id": e.target['peer-id'], x: x, y: y, w: w, h: h, begin: false });
    mycnvs.lineTo(x, y);
    mycnvs.stroke();
    mycnvs.save();
    clicked = false;
    var lastDraw = JSON.parse(JSON.stringify(drawing));
    room.send({ draw: { lastDraw } });
    drawing = [];
}
//remote drawing
window.onDataRcv = {
    mouse: function(src, data) {
        //srcのポインタをdataに反映させる
        //display-noneクラスを削除
        console.dir(data);
        var canvas = streams.querySelector(`[peer-id="${data['peer-id']}"]`);
        var cursor = pointers.querySelector(`[peer-id="${src}"]`);
        console.dir(canvas);
        var rect = canvas.getBoundingClientRect();
        cursor.style.top = ((window.pageYOffset + rect.top) + ((canvas.clientHeight / data.h) * data.y)) + "px";
        cursor.style.left = ((window.pageXOffset + rect.left) + ((canvas.clientWidth / data.w) * data.x)) + "px";
        cursor.classList.remove("display-none");
    },
    draw: function(src, data) {
        for (var i = 0; i < data.length; i++) {
            let obj = data[i];
            let canvas = streams.querySelector(`[peer-id="${obj['peer-id']}"][drawer="${src}"]`);
            if (canvas == null) {
                canvas = addCanvas(obj["peer-id"], src);
                canvas.width = canvas.parentNode.querySelector(`[drawer="${peer.id}"]`).width;
                canvas.height = canvas.parentNode.querySelector(`[drawer="${peer.id}"]`).height;
            }
            let xcvs = (canvas.clientWidth / obj.w) * obj.x;
            let ycvs = (canvas.clientHeight / obj.h) * obj.y;
            let mycnvs = canvas.context;
            let color = pointers.querySelector(`[peer-id="${canvas.getAttribute("drawer")}"]`).style.backgroundColor;
            if (obj.begin) {
                mycnvs.lineWidth = 3;
                mycnvs.strokeStyle = color;
                mycnvs.beginPath();
                mycnvs.moveTo(xcvs, ycvs);
                console.log({ beg: true, x: xcvs, y: ycvs });
            } else {
                mycnvs.lineTo(xcvs, ycvs);
                //console.log({beg:false,x:xcvs,y:ycvs});
            }
            mycnvs.stroke();
        }
    },
    mouseout: function(src, data) {
        //srcのポインタにクラス付与
        var cursor = pointers.querySelector(`[peer-id="${src}"]`);
        cursor.classList.add("display-none");
    },
    clear: function(src, canvas) {
        var div = streams.querySelector(`[content-peer-id="${canvas}"]`);
        console.log(div);
        //保存するならここで
        var canvases = div.querySelectorAll("canvas:not([drawer='bg'])")
        for (canvas of canvases) {
            canvas.context.clearRect(0, 0, canvas.width, canvas.height);
        }
        /*
         */
    },
    clearAll: function(src, data) {
        var canvases = document.getElementsByTagName("canvas");
        for (canvas of canvases) {
            canvas.context.clearRect(0, 0, canvas.width, canvas.height);
            if (canvas.pause != undefined) { canvas.pause = false; }
        }
    },
    pause: function(src, data) {
        if (data.pause) {
            //停止処理
            var video = streams.querySelector(`[data-peer-id="${data.canvas}"]`);
            var v_info = video.srcObject.getVideoTracks()[0].getSettings();
            var canvas = streams.querySelector(`[peer-id="${data.canvas}"][drawer="bg"]`);
            var tmp_c = document.createElement("canvas");
            tmp_c.width = canvas.width;
            tmp_c.height = canvas.height;
            tmp_c.context = tmp_c.getContext("2d");
            canvas.pause = true;
            console.log({ "canvas.width": canvas.width, "canvas.height": canvas.height, "tmp_c.width": tmp_c.width, "video.videoWidth": video.videoWidth, "tmp_c.Height": tmp_c.height, "video.videoHeight": video.videoHeight, "scale-x": tmp_c.width / video.videoWidth, "scale-y": tmp_c.Height / video.videoHeight });
            tmp_c.context.scale(tmp_c.width / video.videoWidth, tmp_c.height / video.videoHeight);
            tmp_c.context.drawImage(video, 0, 0);
            canvas.context.drawImage(tmp_c, 0, 0);
            delete tmp_c;

        } else {
            //解除処理
            var canvas = streams.querySelector(`[peer-id="${data.canvas}"][drawer="bg"]`);
            canvas.context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.pause = false;
        }
        //hoge
    },
    fullscreen: function focus(src, data) {
        if (data.status) {
            streams.querySelector(`[data-peer-id="${data.target}"]`).parentNode.classList.add("full-screen");
        } else {
            streams.querySelector(`[data-peer-id="${data.target}"]`).parentNode.classList.remove("full-screen");
        }

    },
    profile: function(src, data) {
        //ポインター、プロフィールの更新
        if (data.icon == "") { data.icon = "img/man.png"; }
        var point = pointers.querySelector(`[peer-id="${src}"]`);
        if (point == null) {
            point = addPointer(src, data.color, data.icon);
        } else {
            point.style.backgroundColor = data.color;
            point.querySelector("div").style.backgroundImage = "url(" + data.icon + ")";
        }
        //ビデオプロフィール更新
        var video = streams.querySelector(`[data-peer-id="${src}"]`);
        if (video == null) {
            //videoは読み込みが遅いことを考慮して3秒後に実施
            setTimeout((src, data) => {
                var video = streams.querySelector(`[data-peer-id="${src}"]`);
                var div = video.parentNode;
                if (video == null) { return; }
                video = video.parentNode;
                video.querySelector(".control").style.backgroundColor = data.color;
                video.querySelector(".name").innerHTML = data.name;
                if (div.getAttribute("init") == null) {
                    initNewUser(div, data);
                    div.setAttribute("init", "done");
                }
            }, 3000, src, data);
        } else {
            video = video.parentNode;
            video.querySelector(".control").style.backgroundColor = data.color;
            video.querySelector(".name").innerHTML = data.name;
            let div = video;
            if (div.getAttribute("init") == null) {
                initNewUser(div, data);
                div.setAttribute("init", "done");
            }

        }
        //名前を更新
        var mem = document.querySelector(`[member-peer-id="${src}"]`);
        mem.querySelector("div").style.backgroundImage = "url('" + data.icon + "')";
        mem.querySelector("div").style.border = "solid 5px " + data.color;
        mem.querySelector("span").innerHTML = data.name;

        //最初のお知らせ部分の文字更新
        setTimeout((src, data) => {
            var doms = document.getElementsByClassName(src);
            console.warn(doms);
            for (dom of doms) {
                dom.innerHTML = data.name ;
                dom.className = "";
            }
            var doms = document.getElementsByClassName(src);
            console.warn(doms);
            for (dom of doms) {
                dom.innerHTML = data.name ;
                dom.className = "";
            }
        }, 500, src, data);
    },
    snapshot: function(){}
}

function initNewUser(div, data) {
    console.log(data);
    if (data.img != undefined) {

        var img = new Image();
        img.src = data.img;
        img.onload = () => {
            var vgdraw = div.querySelector("[drawer='vgdraw']");
            var tmp_c = document.createElement("canvas");
            tmp_c.width = vgdraw.width;
            tmp_c.height = vgdraw.height;
            tmp_c.context = tmp_c.getContext("2d");
            tmp_c.context.scale(tmp_c.width / data.w, tmp_c.height / data.h);
            tmp_c.context.drawImage(img, 0, 0);
            vgdraw.context.drawImage(tmp_c, 0, 0);
            delete tmp_c;
        };
    }
    if (data.bg != undefined) {
        var bgimg = new Image();
        bgimg.src = data.bg;
        bgimg.onload = () => {
            var bg = div.querySelector("[drawer='bg']");
            bg.pause = true;
            var tmp_c = document.createElement("canvas");
            tmp_c.width = bg.width;
            tmp_c.height = bg.height;
            tmp_c.context = tmp_c.getContext("2d");
            tmp_c.context.scale(tmp_c.width / data.bgw, tmp_c.height / data.bgh);
            tmp_c.context.drawImage(bgimg, 0, 0);
            bg.context.drawImage(tmp_c, 0, 0);
            delete tmp_c;
        };
    }
    if (data.fullscreen) {
        div.classList.add("full-screen");
    }
}

function saveImg(url, name) {
    var d = new Date();
    var time = "";
    if (d.getMonth() < 9) { time += "0" }
    time += (d.getMonth() + 1) + "-";
    if (d.getDate() < 10) { time += "0" }
    time += d.getDate() + "_";
    if (d.getHours() < 10) { time += "0" }
    time += d.getHours() + "-";
    if (d.getMinutes() < 10) { time += "0" }
    time += d.getMinutes() + "-";
    if (d.getSeconds() < 10) { time += "0" }
    time += d.getSeconds() + "_";
    var filename = "HandyShare_"+room.name+"_"+time + name +"_"+".png";
        var a = document.createElement("a");
        a.setAttribute("download", filename);
        a.href = url;
        a.target = "_blank";
        a.innerText="Download";
        document.querySelector("body").append(a);
        setTimeout((a)=>{
            a.click();
            console.log("saveIMG");
            a.remove();
    
        },1000,a)
}