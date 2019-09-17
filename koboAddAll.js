function getLocation(href) {
  var l = document.createElement('a');
  l.href = href;
  return l;
}

function getKoboApiUrl(apiPath) {
  const curLoc = getLocation(window.location.href);
  const splits = curLoc.pathname.split('/');
  if (splits.length < 3) {
    return;
  }

  return '/' + [splits[1], splits[2], apiPath.replace(/^\//, '')].join('/');
}

function addToCart(pid, apiUrl = '/tw/zh/shoppingcartwidget/add') {
  const req = 'https://www.kobo.com' + apiUrl;
  const bodyJson = JSON.stringify({ Id: pid, IsKoboLoveMembership: false, });
  const p = fetch(
    req,
    {
      method: 'POST',
      credentials: 'same-origin',
      mode: 'same-origin',
      body: bodyJson,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((response) => {
      return response.json();
    }).then((resp) => {
      appendMessage(resp.ItemDetails.Title + '-added to cart');
      return resp;
    });
  return p;
}

function appendMessage(msg) {
  const elm = document.querySelector('#kobo-aa-dimmer .main .inner');
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('kobo-aa', 'result-items')
  msgDiv.textContent = msg;
  elm.appendChild(msgDiv);  
}

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function addSequenceShortCuts() {
  const items = document.querySelectorAll('span.product-sequence-field, li.wishlist-item span.series');
  
  [].forEach.call(items, item => {
    var aaDiv = document.createElement('div');
    aaDiv.classList.add('kobo-aa', 'add-btn');
    aaDiv.setAttribute('data-href', item.querySelector('a').href);
    aaDiv.textContent = 'Add this series';
    aaDiv.addEventListener('click', (e) => {
      const initUrl = e.target.dataset.href + '&sort=TitleAsc';
      addDimmer();
      processSeqPage(initUrl, () => {
        appendMessage('Done. Please refresh the page');
      });
    });
    insertAfter(aaDiv, item);
  });
}

function addDimmer() {
  if (!document.querySelector('#kobo-aa-dimmer')) {
    const dimmer = document.createElement('div');
    dimmer.id = 'kobo-aa-dimmer';
    dimmer.classList.add('kobo-aa-dimmer');

    const dimmerMain = document.createElement('div');
    dimmerMain.classList.add('main');

    const dimmerInner = document.createElement('div');
    dimmerInner.classList.add('inner');

    dimmerMain.appendChild(dimmerInner);
    dimmer.appendChild(dimmerMain);

    document.body.append(dimmer);
  }
}

function koboAddAllAjax(items) {
  const p = new Promise((resolve, reject) => {
    const apiUrl = getKoboApiUrl('/shoppingcartwidget/add');
    const results = [];

    let chain = Promise.resolve();
    [].forEach.call(items, item => {
      const pid = JSON.parse(item.dataset.trackInfo).productId;
      chain = chain.then(() => {
        return addToCart(pid, apiUrl).then((resp) => {
          results.push(resp);
        });
      });
    });

    chain.then(() => {
      resolve(results);
    });
  });

  return p;
}

function processSeqPage(url, finalCB) {
  fetch(url, {method: 'GET'})
  .then(response => {
    return response.text();
  })
  .then(seriesHtml => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(seriesHtml, "text/html");
    const items = doc.querySelectorAll('ul.result-items li');

    koboAddAllAjax(items).then((results) => {
      console.log('koboAddAllAjax.done');
      console.log(results);
      if (!!doc.querySelector('div.pagination')) { 
        if (/&pageNumber=(\d+)/.test(url)) {
          const currentPage = parseInt(/&pageNumber=(\d+)/.exec(url)[1], 10);
          const finalPage = parseInt(doc.querySelector('div.pagination a.final').textContent);
          if (currentPage == finalPage) {
            finalCB();
            return ;
          }
          url = url.replace(/&pageNumber=(\d+)/, `&pageNumber=${currentPage + 1}`);
        } else {
          url += '&pageNumber=2';
        }
        appendMessage('Loading series ... please wait');
        processSeqPage(url, finalCB);
      } else {
        finalCB();
      }
    });
  });
}

addSequenceShortCuts();
