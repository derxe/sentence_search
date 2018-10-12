playingButtons = {};

function handleAudio() {
  $('.audioButton').off('click');

  $('.audioButton').click(function () {

    var audioURL = $(this).attr('href');
    var playingId = audioURL;

    if (playingButtons[playingId]) {
      // audio is alread playing
      var audio = playingButtons[playingId];
      togglePause(audio);

    } else {

      // create new audio and add all the necessary listenenrs
      var audio = new Audio(audioURL);
      playingButtons[playingId] = audio;

      audio.onplaying = () => showPlaying($(this));;
      audio.onpause = () => showIdle($(this));
      audio.onloadstart = () => showLoading($(this));
      audio.onloadeddata = () => showIdle($(this));

      audio.onended = () => {
        delete playingButtons[playingId];
        showIdle($(this));
      };
      
      audio.onerror = () => {
        delete playingButtons[playingId];
        showError($(this));
      };

      audio.play();
    }
  });
}

function togglePause(audio) {
  if (audio.paused && audio.currentTime > 0 && !audio.ended) {
    audio.play();
  } else {
    audio.pause();
  }
}

function showPlaying(button) {
  button.addClass("audioPlaying");
  button.removeClass("audioIdle");
  button.removeClass("audioLoading");
}

function showIdle(button) {
  button.addClass("audioIdle");
  button.removeClass("audioPlaying");
  button.removeClass("audioLoading");
}

function showError(button) {
  button.addClass("audioError");
  button.removeClass("audioLoading");
  button.removeClass("audioIdle");
  button.removeClass("audioPlaying");
}

function showLoading(button) {
  button.addClass("audioLoading");
  button.removeClass("audioIdle");
}