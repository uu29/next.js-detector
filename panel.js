document.addEventListener('DOMContentLoaded', async function () {
  const resultDiv = document.getElementById('result');
  const urlDiv = document.getElementById('url-info');
  const copyButton = document.getElementById('copy-button');
  let cleanUrl = '';

  function cleanAndDecodeUrl(url) {
    try {
      const urlObj = new URL(url);
      urlObj.search = '';
      urlObj.hash = '';
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
        // Shadow DOM 내부까지 탐색하는 헬퍼 함수
        function querySelectorAllDeep(selector) {
          const elements = [];

          function traverse(root) {
            // 현재 루트에서 엘리먼트 찾기
            root.querySelectorAll(selector).forEach(el => elements.push(el));

            // Shadow roots 탐색
            root.querySelectorAll('*').forEach(el => {
              if (el.shadowRoot) {
                traverse(el.shadowRoot);
              }
            });
          }

          traverse(document);
          return elements;
        }

        function detectNextJsAppRouter() {
          const indicators = {
            // next-route-announcer는 App Router의 특징적인 요소
            routeAnnouncer: !!(
              querySelectorAllDeep('next-route-announcer').length > 0 ||
              querySelectorAllDeep('[id="__next-route-announcer__"]').length > 0
            ),

            // parallel routes나 intercepting routes에서 사용되는 특징적인 속성들
            parallelRoutes: !!querySelectorAllDeep('[data-parallel-route]').length,

            // App Router의 layout 구조를 나타내는 요소들
            templateTags: !!querySelectorAllDeep('template[data-slot]').length,

            // RSC 관련 스크립트
            rscScript: Array.from(document.scripts).some(script =>
              script.src && script.src.includes('_rsc')
            ),

            // App Router의 특징적인 meta 태그들
            metaTags: !!querySelectorAllDeep('meta[name="next-size-adjust"]').length
          };

          return {
            isAppRouter: Object.values(indicators).some(value => value === true),
            indicators
          };
        }

        function detectNextJsPageRouter() {
          // Page Router의 가장 확실한 지표인 __NEXT_DATA__ 확인
          const hasNextData = !!querySelectorAllDeep('#__NEXT_DATA__').length;

          // 추가적인 Page Router 특징들 확인
          const indicators = {
            nextContainer: !!querySelectorAllDeep('#__next').length,
            nextData: hasNextData,
            pageTransition: !!querySelectorAllDeep('[data-reactroot]').length,
          };

          return {
            isPageRouter: Object.values(indicators).some(value => value === true),
            indicators
          };
        }

        // 두 라우터 모두 검사
        const { isAppRouter } = detectNextJsAppRouter();
        const { isPageRouter } = detectNextJsPageRouter();

        // 두 라우터의 특징이 모두 있거나 Page Router의 특징만 있으면 Page Router로 판단
        if (isPageRouter) {
          return { isNextJS: true, type: 'page' };
        }

        // App Router의 특징만 있는 경우
        if (isAppRouter) {
          return { isNextJS: true, type: 'app' };
        }

        // 둘 다 아닌 경우
        return { isNextJS: false, type: null };
      }
    }, (results) => {
      if (results && results[0]) {
        const { isNextJS, type } = results[0].result;
        if (isNextJS) {
          const routerType = type === 'app' ? 'App Router' : 'Page Router';
          resultDiv.innerHTML = `<img width="20" height="20" src="certificated.png" alt="신환경"><span>이 페이지는 신환경입니다. (${routerType})</span>`;
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
