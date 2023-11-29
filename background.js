chrome.commands.onCommand.addListener(function (command) {
  if (command === "switch_left_tab") {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      var activeTabIndex = getActiveTabIndex(tabs);
      var previousTabIndex =
        activeTabIndex === 0 ? tabs.length - 1 : activeTabIndex - 1;
      chrome.tabs.update(tabs[previousTabIndex].id, { active: true });
    });
  } else if (command === "switch_right_tab") {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      var activeTabIndex = getActiveTabIndex(tabs);
      var nextTabIndex =
        activeTabIndex === tabs.length - 1 ? 0 : activeTabIndex + 1;
      chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
    });
  } else if (command === "insertText") {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        if (tabs.length > 0) {
          var activeTabId = tabs[0].id;
          var storedId = activeTabId;

          let pain = "";

          // pain = await chrome.scripting.executeScript({
          //   target: { tabId: activeTabId },
          //   function: function () {
          //     // Make a request to the API endpoint
          //     const encodedString =
          //       localStorage.getItem("context") || "this is an empty response";
          //     let decodedString = decodeURIComponent(
          //       encodedString.replace(/\%20/g, " ")
          //     );
          //     context = decodedString.slice(0, 1000);

          //     fetch(`http://localhost:4000/generateResponse?context=${context}`)
          //       .then((response) => response.json()) // assuming the response is in JSON format
          //       .then((data) => {
          //         console.log(data.text);
          //         textToInsert = data.text;
          //         localStorage.setItem("context", data.text);
          //         var focused = document.activeElement;

          //         if (
          //           focused.tagName === "INPUT" ||
          //           focused.tagName === "TEXTAREA"
          //         ) {
          //           var cursorPos = focused.selectionStart;
          //           var textBefore = focused.value.substring(0, cursorPos);
          //           var textAfter = focused.value.substring(cursorPos);
          //           focused.value = textBefore + textToInsert + textAfter;
          //         } else {
          //           // finish later
          //         }
          //         return textToInsert;
          //       })
          //       .catch((error) => {
          //         console.error("Error fetching from the API:", error);
          //       });
          //   },
          // });
          textToInsert = await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            function: function () {
              // Make a request to the API endpoint
              const encodedString =
                localStorage.getItem("context") || "this is an empty response";
              let decodedString = decodeURIComponent(
                encodedString.replace(/\%20/g, " ")
              );
              context = decodedString.slice(0, 1000);

              return fetch(
                `http://localhost:4000/generateResponse?context=${context}`
              )
                .then((response) => response.json()) // assuming the response is in JSON format
                .then((data) => {
                  console.log(data.text);
                  textToInsert = data.text;
                  localStorage.setItem("context", data.text);
                  var focused = document.activeElement;

                  if (
                    focused.tagName === "INPUT" ||
                    focused.tagName === "TEXTAREA"
                  ) {
                    var cursorPos = focused.selectionStart;
                    var textBefore = focused.value.substring(0, cursorPos);
                    var textAfter = focused.value.substring(cursorPos);
                    focused.value = textBefore + textToInsert + textAfter;
                  } else {
                    // finish later
                  }
                  return textToInsert;
                })
                .catch((error) => {
                  console.error("Error fetching from the API:", error);
                });
            },
          });

          // Access the result from the array
          textToInsert = textToInsert[0];

          function checkTextToInsert() {
            if (typeof textToInsert !== "undefined") {
              // Your code here once textToInsert is defined
              console.log("textToInsert is defined:", textToInsert);

              // Stop the interval if needed
              clearInterval(intervalId);
            }
          }

          // Set an interval to check the condition
          const intervalId = setInterval(checkTextToInsert, 1000); // Check every second

          chrome.tabs.sendMessage(storedId, {
            message: "summaryGenerated",
          });
        }
      }
    );
  }
});

// Listen for the summary message from the content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command === "summary") {
    // Access the summarized content here
    const summarizedContent = request.content;
    console.log(summarizedContent);
    // context = summarizedContent;
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      message: "pageLoaded",
    });
  }
});

chrome.webNavigation.onCompleted.addListener(function (details) {
  // Check if the navigation is in the main frame
  if (details.frameId === 0) {
    // details.tabId contains the ID of the tab that has completed loading
    const tabId = details.tabId;

    // Send a message to the content script or perform other actions
    chrome.tabs.sendMessage(tabId, {
      message: "pageLoaded",
    });
  }
});

function getActiveTabIndex(tabs) {
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].active) {
      return i;
    }
  }
  return -1;
}
