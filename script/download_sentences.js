var sentences = [];


$(document).ready(function() {
  let wordListsUrls = [
      "./data/all_v8.json"
  ];

  for(let i=0; i<wordListsUrls.length; i++) {
    downloadSentences(wordListsUrls[i]);
  }
});


function downloadSentences(url){

  var req = new XMLHttpRequest();
  req.open("GET", url, true); 
  
  req.addEventListener("progress", (evt) => displayProgress(req, evt), false);
  
  req.responseType = "json";
  req.onreadystatechange = function () {
    if(req.readyState === 4) {
      if (req.status === 200) {
        onDownloadCompleate(req);
      } else {
        console.log("An error occured downloading sentences", req.statusText);
        console.log(req.statusText);
      }
    }
  };
  req.send();
}

function onDownloadCompleate(req) {
  let newSentences = req.response;
  sentences = sentences.concat(newSentences);
  $("#nSentences").text(sentences.length);
          
  let searchValue = decodeURIComponent(parent.location.hash).substring(1);
  $("#searchInput").prop('disabled', false);
  $("#searchInput").val(searchValue);
  $("#searchButton").prop('disabled', false);
  
  flashSearchBar();
}

function displayProgress(req, evt) {
  let percentComplete;
  let fileSize;
  
  if(evt.lengthComputable) {
      percentComplete = evt.loaded / evt.total * 100;
      fileSize = evt.total;
  }else {
    var total = req.getResponseHeader('content-length');
    if(!total) {
      console.error("Unable to get total download size from header persuming the file size to be 1.3MB");
      total = 1300000;
    }
    fileSize = total;
    var encoding = req.getResponseHeader('content-encoding');
    if (total && encoding && (encoding.indexOf('gzip') > -1)) {
      // assuming average gzip compression ratio to be 20%
      total *= 5; // original size / compressed size
      percentComplete = Math.min(100, event.loaded / total * 100);
    } else {
      console.error('lengthComputable failed');
    }
  }
  
  let loadingString = "Loading";
  if(percentComplete) loadingString += " " + Math.round(percentComplete) +" %";
  if(fileSize) loadingString += " (" + bytesToSize(fileSize) + ")";
  
  $("#searchInput").val(loadingString);
}

function flashSearchBar() {
  let flash = function() {
    $(".input-group").toggleClass("active");
  };
  flash();
  setTimeout(flash, 400);
}

function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}


