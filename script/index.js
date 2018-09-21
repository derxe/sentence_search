/**
 * js code for the index html page
 */

$(document).ready(() => { 

    sendHelper = new FirebaseMessageSendHelper(
        $("#send-contact-message"),
        $("#send-successful"),
        $("#send-error"));

    sendHelper.onClicked(() => {
        return firebase.sendContactMessage({
            "message": $("#Message").val()
        }); 
    })
});