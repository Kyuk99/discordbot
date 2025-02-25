const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');

const  ytdl = require("@distube/ytdl-core");

const { token, youtubeApiKey } = require('./discordConfig.js');

const sodium = require('libsodium-wrappers'); // 추가된 부분
const search = require('youtube-search'); // 유튜브 검색 추가

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

const opts = {
  maxResults: 1,
  key: youtubeApiKey,
  type: 'video'
};

// 준비
client.on('ready', () => console.log(`${client.user.tag} 에 로그인됨`));

// 봇 명령어 구분 문자 
const prefix = '!'; 

let connection;
let voiceChannel;
let player;
let playList = [];
let playListTitle = [];
let playListThumbnail = [];

let isPlaying = false;
let playRepeat = false;
let currentIndex  = 0;
let embedMessage = null; // 처음 전송된 embed 메시지를 저장할 변수

//명령어가 !재생인경우
function prefixPlay(message){
  const query = message.content.replace('!재생', '').trim();

  let playUrl = "";
  let title;
  let thumbnailUrl;

  if (!query) {
    return message.reply('재생할 노래 제목이나 URL을 입력하세요.');
  }

  voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.reply('채널에 먼저 선 입장 필요');
  }
  
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.reply('권한이 없습니다.');
  }

  if (query.indexOf('https://www.youtube.com') != -1) {

    playUrl = query;
    title = query;
    thumbnailUrl = '';
    playList.push(playUrl);
    playListTitle.push(title);
    playListThumbnail.push(thumbnailUrl);
            
    if (!isPlaying) {
      playNext(voiceChannel, message, title, thumbnailUrl);
    } else {
      
      message.reply(`"${playUrl}"이(가) 재생 목록에 추가됨`);  
    }
  } else {
    search(query, opts, async (err, results) => {
      if (err) return console.error(err);
  
      if (results.length === 0) {
        return message.reply('검색 결과가 없습니다.');
      }
  
      playUrl = results[0].link;
      title = results[0].title;
      thumbnailUrl = results[0].thumbnails.default.url;
      playList.push(playUrl);
      playListTitle.push(title);
      playListThumbnail.push(thumbnailUrl);
              
      if (!isPlaying) {
        playNext(voiceChannel, message, title, thumbnailUrl);
      } else {
        
        if (embedMessage && (playList.length % 5 === 0)) {
          await embedMessage.delete();
          sendEmbedMessage(message, title, thumbnailUrl);
        }
        message.reply(`"${title}"이(가) 재생 목록에 추가됨`);  
      }
  
    });
  }

  
}

async function playNext(voiceChannel, message) {

  if (playList.length === 0) {
    isPlaying = false;
    updateEmbedMessage('재생중인 노래가 없습니다', '', '', 'Music Bot (반복재생 off)');
    return;
  }

  if(currentIndex >= playList.length){
    
    if(playRepeat){
      currentIndex=0;
    }else{
      isPlaying = false;
      updateEmbedMessage('재생중인 노래가 없습니다', '', '', 'Music Bot (반복재생 off)');
      return;
    }
  }

  isPlaying = true;
  const playUrl = playList[currentIndex]; // 재생목록의 현재인덱스로 재생
  
  try {
    
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
    }
    

    const stream = ytdl(playUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 스트림 버퍼 크기 설정 (더 크게)
    });
    
    const resource = createAudioResource(stream);

    if (!player) {
      player = createAudioPlayer();

      //현재 플레이되는 곡의 재생 종료 이벤트를 받는 구간
      player.on(AudioPlayerStatus.Idle, () => {
        currentIndex++;  //인덱스 증가하여 다음 재생목록 실행
        
        playNext(voiceChannel, message);
      });
      
      connection.subscribe(player);
    }

    player.play(resource);
    
    // 처음에만 embed 메시지를 전송
    if (!embedMessage) {
      sendEmbedMessage(message, playListTitle[currentIndex], playListThumbnail[currentIndex]);
    } else {
      updateEmbedMessage('현재 재생 중', playListTitle[currentIndex], playListThumbnail[currentIndex], 'Music Bot (반복재생 off)');
    }
    
  } catch (error) {
    console.error(error);
  }
}

// 처음 embed 메시지 전송
function sendEmbedMessage(message, title, thumbnailUrl) {

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('현재 재생 중')
    .setDescription(`**${title}**`)
    .setThumbnail(thumbnailUrl)
    .setFooter({ text: 'Music Bot' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('skip')
        .setLabel('넘기기')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('songList')
        .setLabel('재생목록')
        .setStyle(ButtonStyle.Primary),  
      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('컷')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('loop')
        .setLabel('반복 재생')
        .setStyle(ButtonStyle.Primary)
    );

  message.reply({ embeds: [embed], components: [row] }).then(sentMessage => {
    embedMessage = sentMessage; // 전송된 메시지를 저장
  });
}

// embed 메시지 업데이트
function updateEmbedMessage(title, songTitle, thumbnailUrl, footer) {
  if (!embedMessage) return;

  const updatedEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(title)
    .setDescription(`**${songTitle}**`)
    .setFooter({ text: footer });

  if (thumbnailUrl) {
    updatedEmbed.setThumbnail(thumbnailUrl);
  }

  embedMessage.edit({ embeds: [updatedEmbed] });
}

// 버튼 클릭 처리
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  if (customId === 'skip') {
    await interaction.reply({ content: '노래를 스킵합니다!', ephemeral: true });
    if (player) {
      player.stop();
    }
  } else if (customId === 'songList') {

    if (playList.length === 0) {
      return interaction.reply('재생 목록 없음');
    }

    let response = '재생 목록:\n';
    playListTitle.forEach((item, index) => {
      response += `[${index}] = ${item}\n`;
    });
    interaction.reply(response);

  } else if (customId === 'stop') {

    await interaction.reply({ content: '노래봇이 꺼졌습니다'});
    if (embedMessage) {
      await embedMessage.delete();
      embedMessage = null; // 삭제 후 참조를 초기화
    }
    isPlaying = false;
    if (player) {
        player.stop();
    }
    if (connection) {   
        leaveChannel()
    }

  } else if (customId === 'loop') {

    await interaction.deferUpdate();
    if(!playRepeat){
      playRepeat = true;
      
      updateEmbedMessage('현재 재생 중', playListTitle[currentIndex], playListThumbnail[currentIndex], 'Music Bot (반복재생 on)');
    } 
    else if(playRepeat){
      playRepeat = false;
      
      updateEmbedMessage('현재 재생 중', playListTitle[currentIndex], playListThumbnail[currentIndex], 'Music Bot (반복재생 off)');
    }
    
  }
});

// 채널 나가기
function leaveChannel(){
  
  connection.destroy()
  connection = "" // connection 을 null로 만들어야지 다음 join이 됨...
  //채널 나갈시 모두 초기화 시킴
  player = ""
  playList = [];
  playListTitle = [];
  playListThumbnail = [];
  isPlaying = false;
  playRepeat = false;
  currentIndex  = 0; 
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    if (message.content === '!재생목록'){

      if (playList.length === 0) {
        return message.reply('재생 목록 없음');
      }
  
      let response = '현재 재생 목록:\n';
      playListTitle.forEach((item, index) => {
        response += `[${index}] = ${item}\n`;
      });
      message.reply(response);
    }
    else if (message.content.startsWith('!삭제')) {
      const index = parseInt(message.content.replace('!삭제', '').trim(), 10);
      if (isNaN(index) || index < 0 || index >= playList.length) {
        return message.reply('잘못된 인덱스');
      }
  
      let removed = playList.splice(index, 1);
      removed = playListTitle.splice(index, 1);
      playListThumbnail.splice(index, 1);
      
      if (index === currentIndex && index === playList.length) {
        currentIndex = 0;
      } else if (index <= currentIndex) {
        currentIndex--;
      }

      message.reply(`"${removed[0]}" 재생 목록에서 삭제`); 
    }
    else if(message.content === '!넘기기'){
      if (player) {
        player.stop();
      }
    }
    else if (message.content.startsWith("!재생")) prefixPlay(message);
    else if (message.content === '!반복재생'){
      if(!playRepeat){
        playRepeat = true;
        message.reply('반복재생 켜짐');
      } 
      else if(playRepeat){
        playRepeat = false;
        message.reply('반복재생 꺼짐');
      } 
    }
    else if(message.content === '!초기화'){
      playList = [];
      playListTitle = [];
      message.reply('재생목록 초기화');
    }
    else if(message.content === '!컷' || message.content === '!중지'){
      isPlaying = false;
      if (player) {
          player.stop();
      }
      if (connection) {
          leaveChannel()
      }
    }
    
  });
  
  client.login(token);