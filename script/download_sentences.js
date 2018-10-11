var lastTimeUpdated = 0;
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
  lastTimeUpdated = new Date();

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
    total = evt.total;
    fileSize = evt.total;
  }else {
    // try to esitimate length from content lengh
    var total = req.getResponseHeader('content-length');
    if(!total) {
      // guess content length
      console.error("Unable to get total download size from header persuming the file size to be 1.7MB");
      total = 1700000;
    }
    fileSize = total;
    var encoding = req.getResponseHeader('content-encoding');
    if (total && encoding && (encoding.indexOf('gzip') > -1)) {
      // assuming average gzip compression ratio to be 20%
      total *= 5; // original size / compressed size
    } else {
      console.error('lengthComputable failed');
    }
  }

  percentComplete =  Math.min(event.loaded / total * 100, 100);
  
  // create loading string to be displayed
  let loadingString = "Loading";
  if(percentComplete) loadingString += " " + parseFloat(percentComplete).toFixed(0) + " %";
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
   return parseFloat(bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}


