
class FirebaseMessageSendHelper {

  constructor(sendButton, successPane, errorPane) {
    successPane.hide();
    errorPane.hide();

    sendButton.click(() => {
      sendButton.attr("disabled", "disabled");
      sendButton.html("Sending ...");

      successPane.hide();
      errorPane.hide();
      
      this.onClickedFun()
        .then(() => {
          sendButton.html("Successfully Sent");
          successPane.show();
      }).catch((textStatus, errorThrown) => {
          console.error("Error sending a message", textStatus, errorThrown);
          sendButton.attr("disabled", false);
          sendButton.html("Try again?");

          errorPane.html(`There was an error sending the message to the firease: '${textStatus}': ${errorThrown}`);
          errorPane.show();
      });
      
    }); 
  }

  onClicked(fun) {
    this.onClickedFun = fun;
  }

}



class Firebase {


  sendContactMessage(message) {
    return this.post("contact", message);
  }

  sendReport(report) {
    return this.post("report", report);
  }

  post(path, message) {
    if(!message) message = {};
    
    // add user details to the message so that more direct (better) help can be provided
    message["user_details"] = gatherUserDetails();
    message["date"] =  new Date() + "";
    
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "POST",
        url: `https://receptomanijalogi.firebaseio.com/${path}.json`,
        data: JSON.stringify(message),
        success: function () {
            resolve();
            console.log("Report successfully sendededed!")
        },
        error: function (xhr, textStatus, errorThrown) {
            reject(textStatus, errorThrown )
            console.error("Error sending a report", textStatus, errorThrown );
        },
        dataType: "json",
        contentType: "application/json"
      });
    });
  }
}

function gatherUserDetails() {
  let userDetails = {};

  $.getJSON('https://ipapi.co/json/', function(data) {
    userDetails["ip"] = data;
  });
  
  // collect some data from navigator object
  userDetails.navigator = {};
  let properties = ["appCodeName", "appName", "appVersion", 
    "language", "langauges", "platform", "product", "productSub", 
    "userAgent", "vendor"];
  let i;
  for(i=0; i<properties.length; i++){
      userDetails.navigator[properties[i]] = navigator[properties[i]];
  }
  
  userDetails.screen = screen;
  userDetails.screen["docW"] = document.width;
  userDetails.screen["docH"] = document.height;
  userDetails.screen["inw"] = innerWidth;
  userDetails.screen["inH"] = innerHeight;
  
  return userDetails;
}


let firebase = new Firebase();



