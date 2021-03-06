let results;
let visibleResults = 0; // currently visible results
let loadPerScroll = 20; // how many results are additionaly loaded when user hits bottom
let firstNumResultsShown = 2; // how many results are shown when user hits search
let lastSearchTime = 0;
let lastSearchQuery = "";

function isLocalHost() {
  return location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";
}

// if webpage is server locally then get audio files from the local server
let audioServerPath = isLocalHost() ? location.origin + "/audio/" : "http://klet.home.kg/"

function startSearch() {
  let query = $("#searchInput").val().trim();
  if (query.length > 0) {
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
  startSearch();
});


let rawTitle;

function updateUrlHashAndTitle(newHash) {
  //history.replaceState(null, null, document.location.pathname + '#' + newHash);
  parent.location.hash = newHash;

  if (!rawTitle) rawTitle = document.title;
  document.title = newHash + " - " + rawTitle;
}

function searchAndDisplay(query) {
  //if (!query) throw ("Query not set!");

  // disable quick　successive searches with same query
  /* TODO is this needed ??
  search_Time = new Date();
  if (lastSearchQuery === query && search_Time - lastSearchTime < 1000) {
    console.log("Fast consecutive searches of the same query. Request ignored.")
    return;
  }
  lastSearchTime = search_Time;
  lastSearchQuery = query;
  */

  $('#search-form').attr("class", null); // remove bootstrap lg-8 class so it covers the whole screen 
  $('#site-title').hide("fade");
  $("#results-info").hide();
  $("#site-info").hide();
  $("#results-list-end").hide();
  $('#search-results-list').empty();
  $('#filter-button').show("fade");

  // set search query into url hash
  updateUrlHashAndTitle(query);


  const requestStart = new Date().getTime();

  results = search(query);

  results.sort(function (a, b) {
    return (a.score < b.score) ?
      1 : ((b.score < a.score) ?
        -1 : a.sentence.localeCompare(b.sentence));
  });

  displayResults(results, 0, firstNumResultsShown);

  // load new results until the wole page is full of results
  let maxFirstLoadSafety = 50; // to prevent inf loop
  let hasMoreToLoad;
  do {
    hasMoreToLoad = loadMoreResultsOnScroll();
  }
  while (hasMoreToLoad && maxFirstLoadSafety-- > 0);

  const searchTime = (new Date().getTime() - requestStart) / 1000;

  // show results info
  $("#results-info").show();
  $("#num-results").text(results.length);
  $("#search-word").text(query);
  $("#search-time").text(searchTime);
}

function displayResults(results, start, end) {
  if (!start) start = 0;
  if (!end) end = start + loadPerScroll;

  end = Math.min(end, results.length);

  for (let i = start; i < end; i++) {
    appendNewSearchResult(results[i], i);
  }

  visibleResults = end;
  handleAudio();

  return visibleResults === results.length;
}

/*
returns true if it has more sentences to load
returns false if it has filled new sentences to the bottom of the screen or has no more sentences to load
*/
function loadMoreResultsOnScroll() {
  let distanceToBottom = $(document).height() - $(window).height() - $(window).scrollTop();

  //$("#info").html(Math.round(distanceToBottom));

  if (results && results.length > 0 && distanceToBottom < 600) {
    let atTheEnd = displayResults(results, visibleResults);
    if (atTheEnd) $("#results-list-end").show();
    return !atTheEnd;
  }

  return false;
}

$(window).scroll(loadMoreResultsOnScroll);
$('body').bind('touchmove', loadMoreResultsOnScroll);
$('body').on({
  'touchmove': loadMoreResultsOnScroll
});

function setQueryBold(query, sentence) {
  if (!sentence) return "";
  if (!query) return sentence;
  return sentence.replace(new RegExp("(" + query + ")", "gi"), '<bld>$1</bld>');
}

function appendNewSearchResult(result, index) {

  // display Anki button only if page is not served on neocities
  displayAnkiButton = window.location.href.indexOf("neocities") == -1;

  let resultElement = $(`
  <div class="search-result">
      <small class="sentence-number">${index + 1}</small>
      <span class="jap">${setQueryBold(result.query, result.sentence)}</span>
      <span class="eng">${setQueryBold(result.query, result.eng)}</span>
      <a href="${result.audio}" class="audioButton audioIdle" onclick="return false" title="Play sound"></a>
      <a class="audioDownload show-on-hover" href="${result.audio}" target="_blank" download="${result.sentence}.mp3" title="Download audio"></a>
      <a href="../report.html?sen=${encodeURIComponent(JSON.stringify(result))}" title="Report a problem" class="report show-on-hover" target="_blank"></a>
      <button class="btn btn-sm btn-outline-secondary anki-add show-on-hover" ${displayAnkiButton? "" : "style='display:none'"}>add to anki</button>
      <div class="hr-line-dashed"></div>
  </div>
  `);

  if (typeof showAnkiDialog !== 'undefined') {
    (function (resultElement) {
      resultElement.find("button").click(() => showAnkiDialog(resultElement, result));
    })(resultElement);
  }

  resultElement.appendTo('#search-results-list');
}

/**
 * Give sentence a score depending on how good match it is 
 * if score = 0  than this sentence does not match given query
 * @param {string} query 
 * @param {sentence} sentence 
 */
function scoreSentence(query, sentence) {
  let score = 0;
  if (sentence.jap.search(query) > -1) score += 10 / sentence.jap.length;
  if (sentence.eng.toLowerCase().search(query.toLowerCase()) > -1) score += 20 / sentence.eng.length;
  return score;
}


function search(query) {
  let results = [];

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i];



    let score = scoreSentence(query, sentence);
    if (score > 0 && checkSentenceAgainstFilters(sentence)) {
      let result = {
        "sentence": sentence.jap,
        "audio": audioServerPath + sentence.audio_jap,
        "eng": sentence.eng,
        "source": sentence.source,
        "score": score,
        "query": query,
      };
      results.push(result);
    }
  }

  return results;
}