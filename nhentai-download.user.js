// ==UserScript==
// @name         nhentai-download
// @version      0.7
// @description  insert download gallery button
// @author       penguin-jedi
// @homepage     https://github.com/penguin-jedi/hentaithai
// @downloadURL  https://github.com/penguin-jedi/hentaithai/raw/release/nhentai-download.user.js
// @updateURL    https://github.com/penguin-jedi/hentaithai/raw/release/nhentai-download.user.js
// @supportURL   https://github.com/penguin-jedi/hentaithai/issues
// @match        *://*.nhentai.net/g/*
// @match        *://*.nhentai.net/artist/*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY2BgYAAAAAQAAVzN/2kAAAAASUVORK5CYII=
// @require      https://code.jquery.com/jquery-3.6.4.slim.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlHttpRequest
// @grant        GM_cookie
// @grant        GM.cookie
// @run-at       document-end
// ==/UserScript==

const disableConsoleClear = () => {
  console.clear = () => undefined;
  console.log = () => undefined;
}
disableConsoleClear();
if (typeof GM_xmlHttpRequest === 'undefined') var GM_xmlHttpRequest = GM.xmlHttpRequest;
if (typeof GM_cookie === 'undefined') var GM_cookie = GM.cookie;

const $j = jQuery.noConflict();
$j(document).ready(async () => {
  const CONCURRENT = 3;
  const DOWNLOAD_TIMEOUT_MILLISECOND = 10000;
  const RETRY_DELAY_MILLISECOND = 25600;
  const RETRY_MAX_COUNT = 1000000000;
  const spinner = '<img src="data:image/gif;base64,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" />';
  const silentAudioFile = new Audio ('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcxLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1Ny44OQAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU487uNhOvEmQDaCm1Yz1c6DPjbs6zdZVBk0pdGpMzxF/+MYxA8L0DU0AP+0ANkwmYaAMkOKDDjmYoMtwNMyDxMzDHE/MEsLow9AtDnBlQgDhTx+Eye0GgMHoCyDC8gUswJcMVMABBGj/+MYxBoK4DVpQP8iAtVmDk7LPgi8wvDzI4/MWAwK1T7rxOQwtsItMMQBazAowc4wZMC5MF4AeQAGDpruNuMEzyfjLBJhACU+/+MYxCkJ4DVcAP8MAO9J9THVg6oxRMGNMIqCCTAEwzwwBkINOPAs/iwjgBnMepYyId0PhWo+80PXMVsBFzD/AiwwfcKGMEJB/+MYxDwKKDVkAP8eAF8wMwIxMlpU/OaDPLpNKkEw4dRoBh6qP2FC8jCJQFcweQIPMHOBtTBoAVcwOoCNMYDI0u0Dd8ANTIsy/+MYxE4KUDVsAP8eAFBVpgVVPjdGeTEWQr0wdcDtMCeBgDBkgRgwFYB7Pv/zqx0yQQMCCgKNgonHKj6RRVkxM0GwML0AhDAN/+MYxF8KCDVwAP8MAIHZMDDA3DArAQo3K+TF5WOBDQw0lgcKQUJxhT5sxRcwQQI+EIPWMA7AVBoTABgTgzfBN+ajn3c0lZMe/+MYxHEJyDV0AP7MAA4eEwsqP/PDmzC/gNcwXUGaMBVBIwMEsmB6gaxhVuGkpoqMZMQjooTBwM0+S8FTMC0BcjBTgPwwOQDm/+MYxIQKKDV4AP8WADAzAKQwI4CGPhWOEwCFAiBAYQnQMT+uwXUeGzjBWQVkwTcENMBzA2zAGgFEJfSPkPSZzPXgqFy2h0xB/+MYxJYJCDV8AP7WAE0+7kK7MQrATDAvQRIwOADKMBuA9TAYQNM3AiOSPjGxowgHMKFGcBNMQU1FMy45OS41VVU/31eYM4sK/+MYxKwJaDV8AP7SAI4y1Yq0MmOIADGwBZwwlgIJMztCM0qU5TQPG/MSkn8yEROzCdAxECVMQU1FMy45OS41VTe7Ohk+Pqcx/+MYxMEJMDWAAP6MADVLDFUx+4J6Mq7NsjN2zXo8V5fjVJCXNOhwM0vTCDAxFpMYYQU+RlVMQU1FMy45OS41VVVVVVVVVVVV/+MYxNcJADWAAP7EAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxOsJwDWEAP7SAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPMLoDV8AP+eAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPQL0DVcAP+0AFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
  silentAudioFile.loop = true;
  const httpGet = (url, headers) => new Promise((resolve, reject) => {
    const nhentaiCookie = localStorage.getItem('nhentaiCookie');
    GM_xmlHttpRequest({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Cookie': nhentaiCookie,
        ...headers,
      },
      responseType: 'arraybuffer',
      onloadend: (responseObject) => {
        if (responseObject.status === 200 && !responseObject.responseText) {
          const decoder = new TextDecoder();
          responseObject.responseText = decoder.decode(responseObject.response);
        }
        resolve(responseObject);
      },
      onerror: reject,
      ontimeout: reject,
      timeout: DOWNLOAD_TIMEOUT_MILLISECOND,
      withCredentials: true,
    });
  });
  const scrapImgSrc = (html) => {
    const start = html.indexOf('<img src="https://i') + 10;
    html = html.substring(start);
    const end = html.indexOf('"');
    return html.substring(0, end) || html;
  }
  let downloadGallerying = null;
  const start = () => {
    downloadGallerying = true;
    silentAudioFile.play();
    const originalHtml = $j(`#downloadGalleryButton`).html();
    $j(`#downloadGalleryButton`).attr("disabled", true).html(spinner);
    return originalHtml;
  };
  const finish = (originalHtml) => {
    downloadGallerying = false;
    silentAudioFile.pause();
    $j(`#downloadGalleryButton`).removeAttr("disabled").html(originalHtml);
    $j(`#downloadGalleryButton`).css({ "background-color": "#23e320" });
  };
  const delay = (millisec) => new Promise((res) => setTimeout(res, millisec));
  const retryableJob = async (job, onError, limit = 1) => {
    for(let k = 1; k <= limit; k++) {
      try {
        await job();
        break;
      } catch (error) {
        onError(error, k);
        await delay(RETRY_DELAY_MILLISECOND);
        continue;
      }
    }
  };
  const escapeFileName = (str) => {
    let result = str || '';
    if (str[0] === '(') result = result.substring(result.indexOf(')') + 1).trim();
    result = result.replace(new RegExp('&amp;', 'ig'), '&');
    result = result.replace(new RegExp('&lt;', 'ig'), '[');
    result = result.replace(new RegExp('&gt;', 'ig'), ']');
    return result;
  };
  const galleryId = window.location.pathname.split('/').at(-2);
  const downloadGallery = async (takingIndexesMap) => {
    if (downloadGallerying === true) return;
    const originalHtml = start();
    const title = $j("h1.title > span").map((_index, element) => element.innerHTML).get().join('') || $j('title').html();
    const imgPages = $j("a.gallerythumb").get().map((element) => element.href);
    const gallerySize = imgPages.length;
    const imageContents = Array(gallerySize);
    const targetLength = Math.ceil(Math.log10(gallerySize));
    const imgQueue = [];
    imgPages.forEach((url, index) => {
      if (takingIndexesMap[index] === true) imgQueue.push({ url, index });
    });
    const retryableTask = async () => {
      for (let element = imgQueue.shift(); !!element; element = imgQueue.shift()) {
        const { url, index } = element;
        const taskID = `${index + 1}`.padStart(targetLength, '0');
        const attempt = async () => {
          const res = await httpGet(url);
          // console.info('res', res);
          if (res.status !== 200) throw new Error(`res status [${res.status}]`);
          const imgSrc = scrapImgSrc(res.responseText);
          // console.info('imgSrc', imgSrc);
          imageContents[index] = await httpGet(imgSrc);
          await delay(Math.floor((Math.random() * 512) + 1));
        };
        await retryableJob(attempt, (error, attemptTH) => {
          console.error(`[${taskID}.${attemptTH}]`, error);
        }, RETRY_MAX_COUNT);
      }
    };
    await Promise.all(Array(CONCURRENT).fill().map((_e, _index) => retryableTask()));

    const zip = new JSZip();
    for (let i = 0; i < imageContents.length; i++) {
      const imageContent = imageContents[i];
      if (!imageContent) continue;
      const fileExtension = imageContent.finalUrl.substring(imageContent.finalUrl.lastIndexOf('.') + 1);
      const padStartRuningNumber = `${i + 1}`.padStart(targetLength, '0');
      zip.file(`${galleryId}_${padStartRuningNumber}.${fileExtension}`, imageContent.response);
    }
    const zipContent = await zip.generateAsync({ type: 'arraybuffer' });
    const blob = new Blob([zipContent], {type: 'application/zip'});
    saveAs(blob, `${escapeFileName(title)}.zip`);
    finish(originalHtml);
  };
  const preDownload = async () => {
    const nhentaiCookie = $j('#nhentai-cookie').val();
    if (nhentaiCookie) localStorage.setItem('nhentaiCookie', nhentaiCookie);

    const gallerySize = $j("a.gallerythumb").get().map((element) => element.href).length;
    const isSpecifyTakingPageNumbers = $j("input:text[name ='page_numbers']").val().length > 0;
    const takingIndexesMap = Object.assign({}, Array(gallerySize).fill(!isSpecifyTakingPageNumbers));
    if (!isSpecifyTakingPageNumbers) {
      const skipPreIndexs = $j("input:radio[name ='skip_pre']:checked").val().split(',').filter((n) => !!n);
      const skipSufIndexs = $j("input:radio[name ='skip_suf']:checked").val().split(',').filter((n) => !!n);
      // ['0', '1', '-1', '-2', '-3']
      skipPreIndexs.concat(skipSufIndexs).forEach((n) => {
        let skipingIndex = parseInt(n);
        if(skipingIndex < 0) skipingIndex += gallerySize;
        takingIndexesMap[skipingIndex] = false;
      });
    }
    else {
      // gallery with 10 pages:              10     9
      // 1,3,4-9,-1,-2 -> ['1', '3', '4-9', '-1', '-2']
      const pageNumbers = $j("input:text[name ='page_numbers']").val().split(',');
      pageNumbers.forEach((pageNumberStr) => {
        if(pageNumberStr.startsWith('-')) {
          const pageNumber = parseInt(pageNumberStr) + 1 + gallerySize;
          takingIndexesMap[pageNumber-1] = true;
        }
        else if(pageNumberStr.includes('-')) {
          const [startPageNumber, endPageNumber] = pageNumberStr.split('-').map((n) => parseInt(n));
          for(let i = startPageNumber; i <= endPageNumber; i++) {
            takingIndexesMap[i-1] = true;
          }
        }
        else {
          const pageNumber = parseInt(pageNumberStr);
          takingIndexesMap[pageNumber-1] = true;
        }
      });
    }
    // console.info('takingIndexesMap', takingIndexesMap);
    await downloadGallery(takingIndexesMap);
  };

  window.onbeforeunload = unsafeWindow.onbeforeunload = () => downloadGallerying ? 'Downloading, pls w8' : null;

  $j(document.body).prepend(`
    <div style="position:fixed;z-index:2147483647;right:20px;bottom:20px;background-color:#EF771E;padding:10px;">
      <textarea id="nhentai-cookie" name="nhentai-cookie" rows="4" cols="32"></textarea>
      <div style="display:flex;flex-direction:row;">
        <div style="display:flex;flex-direction:column;margin-right:10px;">
          <label><input type="radio" name="skip_pre" value="" checked> don't skip</label>
          <label><input type="radio" name="skip_pre" value="0"> skip 1st page</label>
          <label><input type="radio" name="skip_pre" value="1"> skip 2nd page</label>
          <label><input type="radio" name="skip_pre" value="0,1"> skip both page</label>
        </div>
        <div style="display:flex;flex-direction:column;">
          <label><input type="radio" name="skip_suf" value="-1,-2,-3"> skip last 3 pages</label>
          <label><input type="radio" name="skip_suf" value="-1,-2"> skip last 2 pages</label>
          <label><input type="radio" name="skip_suf" value="-1"> skip last 1 page</label>
          <label><input type="radio" name="skip_suf" value="" checked> don't skip</label>
        </div>
      </div>
      <input type="text" name="page_numbers" />
      <div style="display:flex;justify-content:center;padding-top:10px;">
        <button id="downloadGalleryButton" style="width: 88px; height: 40px;">Download</button>
      </div>
    </div>
  `);
  $j("#downloadGalleryButton").click(preDownload);
  const nhentaiCookie = localStorage.getItem('nhentaiCookie');
  if (nhentaiCookie) $j('#nhentai-cookie').html(nhentaiCookie);

  setTimeout(() => {
    const innerText = $j('span.name').innerText;
    // console.info('innerText', innerText);
    let url;
    if ($j('span.type').innerText === 'Artist') url = `/search/?q=Artist%3A"${innerText}"+Language%3Aenglish+-yaoi`;
    // console.info('url', url);
    if (url) $j("a.tag").attr('href', url);
  }, 5000);
});
