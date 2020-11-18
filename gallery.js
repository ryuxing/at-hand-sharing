function popup(e){
    console.log(e.target);
    document.querySelector("#popup .content").innerHTML=e.target.innerHTML;
    document.querySelector("#popup").className="show";
}

document.addEventListener("keydown",(e)=>{if(e.key=="Escape")document.querySelector("#popup").className='';});

var storageRef = firebase.storage().ref();
function getImgs(){
    storageRef.child("circuits/"+uid).listAll().then(async(res,item)=>{
        for(item of res.items){
            var url = await storageRef.child(item.fullPath).getDownloadURL();
            var div=document.createElement("div");
            div.className="tile";
            var img = document.createElement("img");
            img.src = url;
            div.append(img);
            var p = document.createElement("p");
            var name = item.name.split(".png")[0].split("_");
            name[0] = name[0].replaceAll("-","/");
            name[1] = name[1].replaceAll("-",":");
            p.innerHTML="<b>"+name[2]+"</b><br><span>"+name[0]+"</span> <span>"+name[1]+"</span>";
            div.append(p);
            div.addEventListener("click",popup);
            document.querySelector("#imgs").append(div);111
        }
    }).catch((e)=>{
        console.error(e);
    });
}
var observer = new MutationObserver(()=>{
    getImgs();
    observer.disconnect();
});
const config = { attributes: true, childList: true, characterData: true };
observer.observe(document.querySelector("#user_name"),config);
