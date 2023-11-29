chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "pageLoaded") {
    // alert("page loaded");
    const textContent = document.body.innerText;
    localStorage.setItem("context", textContent);

    chrome.runtime.sendMessage({ command: "summary", content: textContent });
    // alert(textContent);
  } else if (request.message === "summaryGenerated") {
    alert(localStorage.getItem("context"));
  }
});
