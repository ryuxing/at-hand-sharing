# ShareHandy
 自分で編集・拡張するにはSkyWayの登録が必須
##
1. [SkyWay](https://webrtc.ecl.ntt.com/) のWebページで無料会員登録を行う
2. APIキーの入ったjsファイルを作成し、以下の内容を記述
```
 window.__SKYWAY_KEY__ = 'TODO_YOUR_API_KEY';
```
3. index.htmlの101行目を上で作成したjsファイルのパスに変更
3. SkyWayの[マイページ](https://console-webrtc-free.ecl.ntt.com/) でホストするURLを登録する
 
