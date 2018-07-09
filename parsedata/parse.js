fs = require('fs')
fs.readFile('../data/all.json', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var jsonData = JSON.parse(data);
  console.log(jsonData.length);
  
  var correct = [];
  var wrong = [];
  
  for(var i=0; i<jsonData.length; i++){
    if(jsonData[i].audio_jap.endsWith("_e.mp3")) {
      wrong.push(jsonData[i]);
    } else {
      correct.push(jsonData[i])
    }
  }
  
  fs.writeFile("correct.json", JSON.stringify(correct, null, 2), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  }); 
  
  fs.writeFile("english_audio_sentneces.json", JSON.stringify(wrong, null, 2), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  }); 
  
  
  console.log(wrong.length, correct.length);
});
