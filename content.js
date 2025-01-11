function checkElementById() {
  const targetId = "__NEXT_DATA__";
  const element = document.getElementById(targetId);

  if (element) {
    return {
      found: true
    };
  } else {
    return {
      found: false
    };
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "CHECK_ELEMENT") {
      const result = checkElementById();
      sendResponse(result);
    }
    return true;
  }
);
