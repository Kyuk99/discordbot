<div align="center">
  
### DiscordMusicBot

[<img src="https://img.shields.io/badge/프로젝트 기간-2025.01.08~2025.01.20.-green?style=flat&logo=&logoColor=white" />]()

</div> 

## 📝 소개

- 프로젝트 계기
- 화면 구성
- 프로젝트 API 참조
- 사용한 기술 스택
- 기술적 이유와 해결 과정
- 출처

### 프로젝트 계기
소통과 게임을 같이 하던 사람들과 디스코드 서버에서 같이 노래를 듣고싶어했다. 그러자 아는 형이 자기가 만들어보겠다고 만들었다. 하지만 형이 자리를 비울때는 우리가 스스로 디스코드 봇을 이용을 못하게된다. 하지만 나는 취준생이기때문에 항상 컴퓨터에 앉아있는다. 그래서 나도 "만들어볼까?" 에서 시작이 되었다.


### 화면 구성
|재생중인 노래가 있을 시|재생중인 노래가 없을 시|
|:---:|:---:|
|<img src="https://github.com/Kyuk99/ReadmeImage/blob/main/%EC%97%90%EC%8B%9C2.PNG" width="400"/>|<img src="https://github.com/Kyuk99/ReadmeImage/blob/main/%EB%85%B8%EB%9E%98%EA%B0%80%20%EC%9E%AC%EC%83%9Dx.PNG" width="400"/>|


### 🗂️ API 참조

👉🏻 [DiscordBot](https://discord.com/developers/applications)


👉🏻 [YouTubeApi](https://console.cloud.google.com/)


### ⚙ 사용한 기술 스택
<div>
<img src="https://github.com/Kyuk99/ReadmeImage/blob/main/Discord.png" width="80">
<img src="https://github.com/Kyuk99/ReadmeImage/blob/main/Java.png" width="80">
<img src="https://github.com/Kyuk99/ReadmeImage/blob/main/JavaScript.png" width="80">
</div>


## 🤔 기술적 이슈와 해결 과정
- 2025-01-24 Error 403: Forbidden 
    - 노래를 듣고 싶어서 노래봇을 작동을 했다. 그러자 The error message AudioPlayerError: Status code: 403 indicates that the HTTP request made by the miniget module (used internally by ytdl-core to fetch YouTube video information or audio streams) received a 403 Forbidden response from the server. 라는 오류가 나왔다. 자세히 보니 istube/ytdl-core 쪽에서 문제가 있는 것 같았다. @distube/ytdl-core@latest 와 Youtube 이 최시버전에선 작동이 안된다고 한다. 그래서 후속조치로 다운그레이드를 했는데 작동이 잘 됐다.
- 2025-01-25 Error 403: Forbidden
    - 하지만 하루만에 다운그레이드를 해도 똑같은 Error 403: Forbidden 이 나왔다 한동안 노래봇을 실행을 못했다.
- 2025-02-25 Bot Token Ben
    - DiscordBot을 git 에 올릴려다가 실수로 그만 DiscorBot Token, YoutubeApiKey를 함께 같이 올려버린거다 결국 공식 Discord에게 메세지가 왔다.

    - **Safety Jim here! It appears that the token for your bot, 노래봇2세 has been posted to the internet. Luckily, our token-scanning gremlins noticed, and have reset your bot's token - hopefully before anyone could have maliciously used it!**
    - 그래서 나는 일단 git 기존에 있는 DiscordBot repositories 를 지우고 .env, .gitignore 를 사용해보았다.
    - 실행은 안되지만 일단 올려야겠다 싶어서 다시 @distube/ytdl-core@latest 을 최신 버전을 업데이트 한 후 사용을 해보니 이번에는 실행이 잘 된다.
    - 무슨 이유인가 싶어서 [distube/ytdl-core@latest](https://github.com/distubejs/ytdl-core)을 확인해보니

      WEB_CREATOR 라는것을 사용하던 것을
 
      WEB_EMBEDDED 으로 바꿨다고 나와있었다.

      WEB_CREATOR 는 크리에이터 전용 API,

      WEB_EMBEDDED 는 YouTube API를 직접 호출하지 않고, iframe을 통해 YouTube 서버에서 자동으로 데이터를 가져옴

      크리에이터 전용 api 라고 되어있지만 기본적으로 노래 정보는 제공하는듯 하다.

      채널 수익 상태, 댓글 같은 데이터는 해당 크리에이터만 가져올수 있게 되어있는 api인것 같다.\

      추가로 현재는 잘 실행이 된다.


## 💁‍♂️ 출처
|DiscordBot|Readme|
|:---:|:---:|
|[DiscordBot](https://hyun-park-e.tistory.com/)|[Readme](https://github.com/yewon-Noh/readme-template)|
