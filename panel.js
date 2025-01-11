document.addEventListener('DOMContentLoaded', async function () {
  const resultDiv = document.getElementById('result');
  const urlDiv = document.getElementById('url-info');
  const copyButton = document.getElementById('copy-button');
  let cleanUrl = '';

  function cleanAndDecodeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove query parameters and hash
      urlObj.search = '';
      urlObj.hash = '';
      // Decode URL (handles Korean characters)
      return decodeURIComponent(urlObj.toString());
    } catch (e) {
      return url;
    }
  }

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      copyButton.textContent = '복사됨!';
      copyButton.classList.add('copied');
      setTimeout(() => {
        copyButton.textContent = 'URL 복사하기';
        copyButton.classList.remove('copied');
      }, 2000);
    } catch (err) {
      copyButton.textContent = '복사 실패';
      setTimeout(() => {
        copyButton.textContent = 'URL 복사하기';
      }, 2000);
    }
  });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    cleanUrl = cleanAndDecodeUrl(tab.url);
    urlDiv.textContent = cleanUrl;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const element = document.getElementById('__NEXT_DATA__');
        return element !== null;
      }
    }, (results) => {
      if (results && results[0]) {
        const isNextJS = results[0].result;
        if (isNextJS) {
          resultDiv.innerHTML = `<img width="20" height="20" src="certificated.png" alt="신환경"><span>이 페이지는 신환경입니다.</span>`;
          resultDiv.className = 'success';
        } else {
          resultDiv.innerHTML = `<img width="20" height="20" src="warning.png" alt="구환경"><span>이 페이지는 구환경입니다.</span>`;
          resultDiv.className = 'failure';
        }
      }
    });
  } catch (error) {
    resultDiv.textContent = "오류가 발생했습니다: " + error.message;
    resultDiv.className = 'failure';
  }
});
