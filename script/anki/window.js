let visibleAnkiDialog = null;
let options = {
    "model": "Japanese-75658",
    "deck": "Default::Core 2k/6k Optimized Japanese Vocabulary",
    "server": "http://localhost:8765"
};

let anki = new AnkiConnect("http://127.0.0.1:8765");

let replaceFields = {
    "Expression": "",
    "Reading": "",
    "Sentence-Kana": "",
    "Sentence-English": "",
    "Sentence-Clozed": "",
    "Sentence-Audio": "[[THIS-SENTENCE-AUDIO]]",
};

let buttonOldText;
let buttonHide = null;
let hideWindowButtonText = "Collapse"

function showAnkiDialog(resultElement, resutlData) {

    let buttonClicked = resultElement.find("button");

    if (buttonHide && buttonHide.html() === hideWindowButtonText) {
        // simply hide visible anki dialog if a current button that is clicked is a hide button
        buttonHide.html(buttonOldText);
        buttonHide = null;

        if (visibleAnkiDialog) {
            visibleAnkiDialog.dialog.remove();
            visibleAnkiDialog = null;
        } else {
            console.error("Illegal state: If a button cancel is set there should be a visible anki dialo")
        }
    } else {
        // display new dialog under search reuslt elemnt

        // change button that was clicked button into a hide button
        buttonHide = buttonClicked;
        buttonOldText = buttonHide.html();
        buttonHide.html(hideWindowButtonText);

        // generate anki add note dialog and append it to clicked result element
        let dialog = $(ankiDialogHtmlTemplate);
        resultElement.append(dialog);

        // rmeove (hide) currently viislbe anki dialgo
        if (visibleAnkiDialog) visibleAnkiDialog.dialog.remove();
        newAnkiDialog(dialog, resutlData);
    }
}

//class AnkiDialog {


async function newAnkiDialog(dialog, sentence) {
    if (!dialog || !sentence) return console.error("Missing AnkiWindow constructor parameters!");

    visibleAnkiDialog = {};
    visibleAnkiDialog.dialog = dialog;
    visibleAnkiDialog.sentence = sentence;

    replaceFields["Expression"] = sentence.sentence;
    replaceFields["Sentence-English"] = sentence.eng;
    //replaceFields["Sentence-Audio"] = "[[" + sentence.audio + "]]";

    // set all the on change and on click listeners
    $('.anki-model').change(utilAsync(onAnkiModelChanged));
    $('.anki-add-note-button').click(onAnkiAddNoteClicked);
    $('.anki-search-card').submit(utilAsync(onSearchNotesAction));
    $('.anki-search-results').change(utilAsync(onAnkiSearchResultChanged));

    // it is necessary for this function to AWAUT so tha tit fills all the fileds 
    // which's values can be latter fieled with ankiNotesResultsPopulate()
    await ankiDeckAndModelPopulate();

    // set search query and call search function on sentence's query
    $("#anki-query").val(sentence.query);
    ankiNotesResultsPopulate(sentence.query);
}

function onAnkiAddNoteClicked(e) {
    try {
        if (!e.originalEvent) return;

        ankiSpinnerShow(true);
        ankiAddNewNoteFromFields();
        ankiErrorShow();
    } catch (e) {
        console.error(e);
        ankiErrorShow(e);
    } finally {
        ankiSpinnerShow(false);
    }
}

function ankiAddNewNoteFromFields() {
    // collect all the value and names from the table
    fields = {};
    audio = {};
    $(".anki-fields tbody tr").each(function () {
        let name = $(this).find(".anki-field-name").text();
        let value = $(this).find(".anki-field-value").val();
        if (value === "[[THIS-SENTENCE-AUDIO]]") {
            audio = {
                "url": visibleAnkiDialog.sentence.audio,
                "filename": "sentece_search_" + Math.floor(Math.random() * 10000) + ".mp3",
                "fields": [name]
            }
        } else {
            fields[name] = value;
        }
    });

    // note object that we will sand to anki api
    note = {
        "deckName": "autoadd",
        "modelName": $(".anki-model").val(),
        "fields": fields,
        "tags": ["autoadd"],
        "audio": audio
    };

    let addButton = $(".anki-add-note-button");
    let errorBox = $(".anki-add-note-error");
    let addButtonText = addButton.html();

    addButton.attr("disabled", true);
    addButton.html("Adding ... ")
    errorBox.hide();

    anki.addNote(note).then((response) => {
        console.log("Adding card response:", response)


        if (!response || response.error) {
            let errorMessage = response.error ? response.error : "null";
            errorBox.html("Error while adding the note: <b>" + errorMessage + "</b>");
            errorBox.show();

            addButton.attr("disabled", false);
            addButton.html(addButtonText)
        } else {
            // note successfully added
            addButton.remove();

            showAddedCardButton = $('<button/>', {
                class: "btn",
                html: "View added note",
                click: function () {
                    anki.guiBrowse("nid:" + response.result)
                }
            });
            errorBox.parent().append(showAddedCardButton);
        }
    });
}

async function ankiDeckAndModelPopulate() {
    const ankiFormat = $('#anki-format').hide();

    // populate deck names chooser
    const deckNames = (await anki.getDeckNames()).result;
    const ankiDeck = $('.anki-deck');
    ankiDeck.find('option').remove();
    deckNames.sort().forEach(name => ankiDeck.append($('<option/>', {value: name, text: name})));

    // populate model names chooser
    const modelNames = (await anki.getModelNames()).result;
    const ankiModel = $('.anki-model');
    ankiModel.find('option').remove();
    modelNames.sort().forEach(name => ankiModel.append($('<option/>', {value: name, text: name})));


    // set default values for anki deck and anki model chooser
    $('#anki-deck').val(options.deck);
    $('#anki-model').val(options.model);

    // call anki field populate when setting default value for anki model
    await ankiFieldsPopulate(options.model);

    ankiFormat.show();
}


async function onAnkiModelChanged(e) {
    try {
        if (!e.originalEvent) return;

        ankiSpinnerShow(true);
        ankiFieldsPopulate($(this).val());
        let firstSearchResult = $('.anki-search-results option').first().val();
        ankiFiledsValuesPopulate(firstSearchResult);
        ankiErrorShow();
    } catch (e) {
        console.error(e);
        ankiErrorShow(e);
    } finally {
        ankiSpinnerShow(false);
    }
}

/**
 * Populate table fields with fields from model
 * @param modelName Name of the model used to populate table fields
 * @returns {Promise<void>}
 */
async function ankiFieldsPopulate(modelName) {
    if (!modelName) return;

    const container = $('#anki-window').find('tbody').empty();

    for (const name of (await anki.getModelFieldNames(modelName)).result) {
        let htmlRow = $(fieldRowHtmlTemplate)
        htmlRow.find(".anki-field-name").text(name);
        htmlRow.find(".anki-field-value").attr("data-field", name);
        container.append(htmlRow);
    }

    //tab.find('.anki-field-value').change(utilAsync(onFormOptionsChanged));
    //tab.find('.marker-link').click(onAnkiMarkerClicked);
}

/**
 * When search for auto fill button was clicked
 * @param e
 * @returns {Promise<boolean>}
 */
async function onSearchNotesAction(e) {
    try {
        if (!e.originalEvent) return false;

        ankiSpinnerShow(true);
        let query = $(this).find("input").val();
        ankiNotesResultsPopulate(query);
        ankiErrorShow();
    } catch (e) {
        console.error(e);
        ankiErrorShow(e);
    } finally {
        ankiSpinnerShow(false);
    }

    return false;
}

/**
 * Search for the searchQuery and fill the results in selecteor
 * @param searchQuery used to find Notes
 * @returns {Promise<void>}
 */
async function ankiNotesResultsPopulate(query) {
    if (!query) {
        console.error("No query provided!");
        return;
    }

    // create query based on deck name and first filed name from model chosen
    // so that it searches only in selected deck and not the whole card but only
    // from the first field selected
    let limitQuery = "";
    let deckName = $(".anki-deck").val();
    if (deckName) limitQuery += '"deck:' + deckName + '" ';

    let firstFiledName = $(".anki-fields .anki-field-name").first().text();
    if (firstFiledName) limitQuery += '"' + firstFiledName + ':*' + query + '*"';
    else limitQuery += query;

    query = limitQuery;

    // execute searching query
    const cardIds = (await anki.findNotes(query)).result;
    const searchResults = $('.anki-search-results');
    searchResults.find('option').remove();

    if (cardIds.length > 0) {
        cardIds.sort().forEach(name => searchResults.append($('<option/>', {value: name, text: name})));
        searchResults.attr('disabled', false);

        // set selected results and update fields
        searchResults.val(cardIds[0]);
        ankiFiledsValuesPopulate(cardIds[0])
    } else {
        // display no results found and disable the selector
        searchResults.val();
        let message = "No search results found for: '" + query + "'";
        searchResults.append($('<option/>', {text: message, selected: true}));
        searchResults.attr('disabled', 'disabled');
    }

}

/**
 * When search result selector has changed new values need to be filled in table fileds
 * @param e Click event
 * @returns {Promise<void>}
 */
async function onAnkiSearchResultChanged(e) {
    try {
        if (!e.originalEvent) return;

        ankiSpinnerShow(true);
        ankiFiledsValuesPopulate($(this).val());
        ankiErrorShow();
    } catch (e) {
        console.error(e);
        ankiErrorShow(e);
    } finally {
        ankiSpinnerShow(false);
    }
}

async function ankiFiledsValuesPopulate(searchedCardId) {
    if (!searchedCardId) return;

    const cardInfos = (await anki.getNotesInfo([searchedCardId])).result;

    if (cardInfos && cardInfos.length > 0) {
        console.log("Got fileds", cardInfos[0].fields.length, $('.anki-fields td').length);
        for (let fieldName in cardInfos[0].fields) {
            let fieldValue = cardInfos[0].fields[fieldName].value;
            if (replaceFields[fieldName] || replaceFields[fieldName] === "") {
                fieldValue = replaceFields[fieldName];
            }

            let tableInputRow = $('.anki-fields td input[data-field="' + fieldName + '"]');
            if (tableInputRow) {
                tableInputRow.val(fieldValue)
            }
        }
    }
}


//h}


function ankiSpinnerShow(show) {
    const spinner = $('#anki-spinner');
    if (show) {
        spinner.show();
    } else {
        spinner.hide();
    }
}

function ankiErrorShow(error) {
    const dialog = $('#anki-error');
    if (error) {
        dialog.show().text(error);
    }
    else {
        dialog.hide();
    }
}

function ankiErrorShown() {
    return $('#anki-error').is(':visible');
}

// was used on initilizaition currently not used here
function ankiFieldsToDict(selection) {
    const result = {};
    selection.each((index, element) => {
        result[$(element).data('field')] = $(element).val();
    });

    return result;
}


function onAnkiMarkerClicked(e) {
    e.preventDefault();
    const link = e.target;
    $(link).closest('.input-group').find('.anki-field-value').val(`{${link.text}}`).trigger('change');
}


async function onAnkiFieldTemplatesReset(e) {
    try {
        e.preventDefault();
        const options = await optionsLoad();
        $('#field-templates').val(options.anki.fieldTemplates = optionsFieldTemplates());
        await optionsSave(options);
    } catch (e) {
        ankiErrorShow(e);
    }
}


fieldRowHtmlTemplate = `
<tr class="row">
    <td class="col-sm-2 anki-field-name"></td>
    <td class="col-sm-10">
        <input type="text" class="anki-field-value form-control" data-field="" value="">
    </td>
</tr>
`;

ankiDialogHtmlTemplate = `
<div id="anki-window" class="mb-lg-3">
   <div class="form-group">
      <label for="interface-server">Interface server</label>
      <input type="text" id="interface-server" class="form-control" value="http://localhost:8765">
   </div>
   <div id="anki-format">
      <div id="terms">
         <div class="form-group">
            <label for="anki-deck">Deck</label>
            <select class="form-control anki-deck" id="anki-deck"></select>
         </div>
         <div class="form-group">
             <label for="anki-model">Model</label>
             <select class="form-control anki-model" id="anki-model"></select>    
         </div>
         <form class="form-inline anki-search-card" onsubmit="return false;">
            <label class="mr-sm-2 mb-0" for="anki-query">Search for autofill:</label>
            <input type="text" class="form-control mr-sm-2 mb-2 mb-sm-0" id="anki-query" name="anki-query">
            <button type="submit" class="btn btn-primary mt-2 mt-sm-0">Search</button>
         </form>
         <div class="form-group">
             <label for="anki-terms-model">Search Results</label>
             <select class="form-control anki-search-results"></select>    
         </div>
         <div class="col-sm-12">
             <table class="table anki-fields">
                <thead>
                   <tr class="row">
                      <th class="col-sm-2">Field</th>
                      <th class="col-sm-10">Value</th>
                   </tr>
                </thead>
                <tbody></tbody>
             </table>
         </div>
         <div class="alert alert-danger anki-add-note-error" style="display:none"> </div>
         <button class="btn btn-primary anki-add-note-button"> Add Note To Anki</button>
      </div>
   </div>
</div>
 `;
 
