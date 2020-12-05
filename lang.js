function change_language(language){
    lang=language;
    for(dom of document.querySelectorAll('[data-i18n]')){
        if(dict[dom.dataset['i18n']]==undefined){
            console.warn(dom.dataset['i18n']);
        }else if(dict[dom.dataset['i18n']][lang]==undefined){
            console.warn(dom.dataset['i18n'] + "("+lang+")");
            dom.innerHTML=dict[dom.dataset['i18n']]['en'];
        }else{
            dom.innerHTML=dict[dom.dataset['i18n']][lang];
        }
    }
}
dict = {
    "title":{
        "en" : "ShareHandy - Share your handy",
        "ja" : "ShareHandy - 手元共有システム"
    },
    "leave_btn":{
        "en" : "Leave",
        "ja" : "退出"
    },
    "messages":{
        "en" : "Messages",
        "ja" : "メッセージ"
    },
    "members":{
        "en" : "Members",
        "ja" : "メンバー"
    },
    "options":{
        "en" : "Options",
        "ja" : "オプション"
    },
    "save_all_circuit":{
        "en" : "Capture and save ALL videos with drawings",
        "ja" : "全員の手元の状態を保存"
    },
    "clear_all_drawing":{
        "en" : "Clear all drawings & pauses",
        "ja" : "全ての描画・ポーズをクリア"
    },
    "room_id":{
        "en" : "Group",
        "ja" : "グループ"
    },
    "name":{
        "en" : "Name",
        "ja" : "名前"
    },
    "icon":{
        "en" : "Icon",
        "ja" : "アイコン"
    },
    "color":{
        "en" : "Color",
        "ja" : "表示色"
    },
    "video_on":{
        "en" : "Turn on your camera",
        "ja" : "ビデオをオンにする"
    },
    "join_with_video":{
        "en" : "Join with the video",
        "ja" : "ビデオありで参加"
    },
    "join_without_video":{
        "en" : "Join WITHOUT the video",
        "ja" : "ビデオなしで参加"
    },
    "join":{
        "en" : "Join now",
        "ja" : "参加する"
    },
    "saved_circuits":{
        "en" : "Saved circuits images",
        "ja" : "保存した回路"
    },
    "saved_circuits_detail":{
        "en" : "Please save the circuit images from above list directly if it doesn't start downloading.",
        "ja" : "自動でダウンロードされない場合、必要な回路をPCやスマートフォンに以下から直接保存してください。"
    },
    "#↑　html　↓　js innerHTML or Alert":true,
    "you_enter_room":{
        "en" : " is your current room.",
        "ja" : "に入室しました。"
    },
    "anyone_enters_room":{
        "en" : " enters this room.",
        "ja" : " が入室しました。"
    },
    "you_left_room":{
        "en" : "You left the room.",
        "ja" : "退出しました。"
    },
    "anyone_left_room":{
        "en" : " left the room.",
        "ja" : " さんが退出しました。"
    },
    "save_complete":{
        "en" : "The image was stocked to below area now. <br>Please save it to your PC manually if it doesn't start downloading.",
        "ja" : "画像を保存します。<br>自動でダウンロードされない場合、以下のスペースにある画像を直接PCに保存してください。"
    },
    "pause":{
        "en":"pause",
        "ja":"画面固定"
    },
    "save":{
        "en":"save",
        "ja":"保存"
    },
    "clear":{
        "en":"clear",
        "ja":"クリア"
    },
    "fullscreen":{
        "en":"fullscreen",
        "ja":"全画面"
    }

}