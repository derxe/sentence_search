var results;
var visibleResults = 0; // currently visible results
var loadPerScroll = 20; // how many results are additionaly loaded when user hits bottom
var firstNumResultsShown = 2; // how many results are shown when user hits search
var lastSearchTime = 0;
var lastSearchQuery = "";

function startSearch() {
    let query = $("#searchInput").val();
    if(query.length > 0) {
      searchAndDisplay(query);
    }
}

/*
Refresh search every time url hash value changes 
Url hash value changes when user is navigating using back and forward buttons
*/
$(window).on('hashchange', () => {
  let searchValue = decodeURIComponent(parent.location.hash).substring(1);
  $("#searchInput").val(searchValue);
  console.log("update hash")
  startSearch();
});


var rawTitle;
function updateUrlHashAndTitle(newHash) {
  //history.replaceState(null, null, document.location.pathname + '#' + newHash);
  parent.location.hash = newHash
  
  if(!rawTitle) rawTitle = document.title;
  document.title = newHash + " - " + rawTitle;
}

function searchAndDisplay(query) {
  if(!query) throw("Query not set!");
  
  // disable quick　successive searches with same query 
  search_Time = new Date();
  if(lastSearchQuery == query && search_Time - lastSearchTime < 1000) return;
  lastSearchTime = search_Time;
  lastSearchQuery = query;
  
  $("#results-info").hide();
  $("#site-info").hide();
  $("#results-list-end").hide();
  $('#search-results-list').empty();
  
  // set search query into url hash
  updateUrlHashAndTitle(query)


  var requestStart = new Date().getTime();

  results = search(query);
  
  results.sort(function(a,b) {
    return (a.score < b.score) ? 
        1 : ((b.score < a.score) ? 
          -1 : a.sentence.localeCompare(b.sentence));
  }); 
  
  displayResults(results, 0, firstNumResultsShown);
  
  // load new results until the wole page is full of results
  maxFirstLoadSafety = 50; // to prevent inf loop
  while(loadMoreResultsOnScroll() && maxFirstLoadSafety-- > 0);

  var searchTime = (new Date().getTime() - requestStart) / 1000;
  
  // show reuslts info
  $("#results-info").show();
  $("#num-results").text(results.length);
  $("#search-word").text(query);
  $("#search-time").text(searchTime);
}

function displayResults(results, start, end) {  
  if(!start) start = 0;
  if(!end) end = start + loadPerScroll;
  
  end = Math.min(end, results.length);
  
  for(var i=start; i < end; i++) {
    appendNewSearchResult(results[i], i);
  }
  
  visibleResults = end;
  handleAudio();
  return visibleResults == results.length; 
}

/*
returns true if it has more sentences to load
returns false if it has filled new sentences to the bottom of the screen or has no more sentences to load
*/
function loadMoreResultsOnScroll() {
  let distanceToBottom = $(document).height() - $(window).height() - $(window).scrollTop();
  
  //$("#info").html(Math.round(distanceToBottom));
  
  if(results && results.length > 0 && distanceToBottom　< 200) {
    var atTheEnd = displayResults(results, visibleResults)
    if(atTheEnd) $("#results-list-end").show();
    return !atTheEnd;
  }
  
  return false;
}

$(window).scroll(loadMoreResultsOnScroll);
$('body').bind('touchmove', loadMoreResultsOnScroll);
$('body').on({'touchmove': loadMoreResultsOnScroll });

function setQueryBold(query, sentence) {
  if(!sentence) return "";
  if(!query) return sentence;
  return sentence.replace(new RegExp("("+query+")","gi"), '<bld>$1</bld>');
}

function appendNewSearchResult(result, index) {
  
  $('#search-results-list').append('\
  <div class="search-result">\
      <small>'+ (index+1) + ' </small>\
      <span>'+ setQueryBold(result.query, result.sentence) +'</span> \
      <span>'+ setQueryBold(result.query, result.eng) +'</span> \
      <a href="'+ result.audio +'" class="audioButton audioIdle" onclick="return false"> </a> \
      <a href="'+ result.audio +'" target="_blank" download="'+result.sentence+'.mp3">download</a> \
  </div> \
  <div class="hr-line-dashed"></div>\
  ');
}


function scoreSentence(query, sentence) {
    let score = 0;
    if(sentence.jap.search(query) > -1) score += 10/sentence.jap.length;
    if(sentence.eng.toLowerCase().search(query.toLowerCase()) > -1) score += 20/sentence.eng.length;
    return score;
}

function search(query) {
    var results = [];
    
    for(var i=0; i<sentences.length; i++) {
        let sentence = sentences[i];
        
        let score = scoreSentence(query, sentence);
        if(score > 0) {
          var result = {
            "sentence": sentence.jap,
            "audio" : sentence.audio_jap,
            "eng" : sentence.eng,
            "source" : sentence.source,
            "score" : score,
            "query": query,
          }
          results.push(result);
        }
    }
    
    return results;
}




