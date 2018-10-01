/**
 * js code for the index html page
 */

$(document).ready(() => { 

    // handles sensing contact messages

    // manage sending contact message to firebase
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