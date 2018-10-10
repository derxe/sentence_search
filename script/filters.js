filters = {
    size: {
        name: "Length",
        filters: [{
            display: "< 7",
            test: sen => sen.jap.length <= 7,
        }, {
            display: "7 - 15",
            test: sen => 5 <= sen.jap.length && sen.jap.length <= 15,
        }, {
            display: "15 - 30",
            test: sen => 15 <= sen.jap.length && sen.jap.length <= 30,
        }, {
            display: "30 - 50",
            test: sen => 30 <= sen.jap.length && sen.jap.length <= 50,
        }, {
            display: "> 50",
            test: sen => sen.jap.length >= 50,
        }]
    },
    source: {
        name: "Source",
        // set global test for all filters
        test: (sen, filter) => sen.source === filter.display,
        filters: []
    }
}

collections = [];

/**
 * Extract all the types of collections from sentences and
 * saves them into collections array.
 * @param {sentence} sentences 
 */
function extractCollections(sentences) {
    let collectionObject = {};

    for (let i = 0; i < sentences.length; i++) {
        let source = sentences[i].source.split("/")[0];
        sentences[i].source = source;
        if (!collectionObject[source])
            collectionObject[source] = true;
    }

    for (let i in collectionObject) {
        collections.push(i);
    }
}

let filtersLoaded = false;

function loadAndShowFilters() {
    if(!filtersLoaded) {
        extractCollections(sentences);
        displayAllFilters();
        filtersLoaded = true;
    }
}

function displayAllFilters() {
    $("#filter-box").empty();

    filters.source.filters = [];
    for (let i = 0; i < collections.length; i++) {
        filters.source.filters.push({
            "display": collections[i]
        });
    }

    for (let filter_name in filters) {
        displayFilter(filters[filter_name]);
    }
    $("#filter-box").find("hr").last().remove();
}

/*
function clearFilterCount() {
    for (filter_name in filters) {
        let filter = filters[filter_name];
        console.log(filter_name, filter.filters, filter.filters.length);
        for (let i = 0; i < filter.filters.length; i++) {
            filter.filters[i].count = 0;
            console.log(filter_name, i);
        }
    }
}
*/

/**
 * Set or unset all checkboxes for a given filter. 
 * @param {filter} filter 
 * @param {jquery element} cb_container 
 * @param {boolean} state 
 */
function setAllCheckBoxes(filter, cb_container, state) {
    cb_container.find("input:checkbox").prop('checked', state);

    for (let i = 0; i < filter.filters.length; i++) {
        filter.filters[i].set = state;
    }
}

/**
 * Draw all filters checkboxes into filters filed. 
 * @param {filter} filter 
 */
function displayFilter(filter) {
    let filterGroup = $(`
    <div class="row filter-group">
    <label for="collection" class="col-lg-2 control-label">${filter.name}</label>
      <div class="col-lg-10 filters">
      </div>
    </div>
    <hr>
    `);

    for (let i = 0; i < filter.filters.length; i++) {
        let filter_count = filter.filters[i].count >= 0 ? `(${filter.filters[i].count})` : "";
        let checked = filter.filters[i].set ? "checked" : "";
        let cb = $(
            `<label class="checkbox-fw">
          <input type="checkbox" ${checked}> ${filter.filters[i].display} ${filter_count}
        </label>`);

        cb.find("input[type='checkbox']").change(function () {
            filter.set = true;
            filter.filters[i].set = this.checked;
            startSearch();
        })

        filterGroup.find(".filters").append(cb);
    }

    let clearSetButtons = $(
        `<label class="checkbox-fw">
         <a href="javascript:void(0);" class="clear-checkbox btn-link">clear</a>&nbsp;|&nbsp;<a href="javascript:void(0);" class="set-checkbox btn-link">set&nbsp;all</a>
       </label>`);

    console.log("finding and some stuff")
    clearSetButtons.find(".clear-checkbox").on("click", function () {
        let cb_container = $(this).parent().parent();
        setAllCheckBoxes(filter, cb_container, false);
        startSearch();
        // NE POZABT tisti ka v downloadih nafilam vse razlicne source je treba premaknt v sovojo datoteko
        // pa nardit sele takrt ko se zahteva prikazovanje filtrov. 
    })

    clearSetButtons.find(".set-checkbox").on("click", function () {
        let cb_container = $(this).parent().parent();
        setAllCheckBoxes(filter, cb_container, true);
        startSearch();
    })

    filterGroup.find(".filters").append(clearSetButtons);



    $("#filter-box").append(filterGroup);
}


/**
 * Check sentence against  all filters
 * Decide if a sentences passes or fails filters. 
 * @param {sentence} sentence 
 */
function checkSentenceAgainstFilters(sentence) {

    for (filter_name in filters) {
      // all filters need to pass in order for sentence to pass filters
      if (!filterSentence(sentence, filter_name)) {
        return false;
      }
    }
  
    return true;
  }
  
  /**
   * Provide sentence and a filter name this function returns true if sentence passes filer 
   * false otherwise. 
   * 
   * @param {sentence} sentence to be compared against filter
   * @param {filter} filter_name name of the filter being used to filter sentence 
   */
  function filterSentence(sentence, filter_name) {
  
    let allFiltersOff = true;
    for (let i = 0; i < filters[filter_name].filters.length; i++) {
      let filter = filters[filter_name].filters[i];
  
      if (filter.set) {
        allFiltersOff = false;
  
        if (filter.test) {
          // try individual filter if it exists.
          if (filter.test(sentence))
            return true;
  
        } else if (filters[filter_name].test) {
          // if individual filter is not set, try the global one
          if (filters[filter_name].test(sentence, filter))
            return true;
  
        } else {
          console.warn("Filter does not have test comparator function set.", filterName, i);
        }
      }
    }
  
    // non of the filters are set. This means that none of the check boxes are set 
    // meaning that the filter is not active so the sentence automatically passes is not sentences passes
    if (allFiltersOff) {
      return true;
    }
  
    return false;
  }