playingButtons = {};

function handleAudio() {
  $('.audioButton').click(function () {
    
    var audioURL = $(this).attr('href');
    var playingId = audioURL;
    if(playingButtons[playingId]) return;
    
    var audio = new Audio(audioURL);

    audio.onplaying = () => {
      $(this).removeClass("audioIdle");
      $(this).addClass("audioPlaying");
      $(this).removeClass("audioLoading"); 
    }
    audio.onpause = () => {
      delete playingButtons[playingId]
      $(this).addClass("audioIdle");
      $(this).removeClass("audioPlaying");
      $(this).removeClass("audioLoading"); 
    }
    
    audio.onloadstart = () => { 
      $(this).removeClass("audioIdle");
      $(this).addClass("audioLoading");
    }
    audio.onloadeddata = () => {
      $(this).addClass("audioIdle");
      $(this).removeClass("audioLoading"); 
    }
    
    audio.onerror = () => {
      $(this).addClass("audioError");
      $(this).removeClass("audioIdle");
      $(this).removeClass("audioPlaying");
      $(this).removeClass("audioLoading")
    }
    
    
    playingButtons[playingId] = $(this);
    audio.play();
  });
}
