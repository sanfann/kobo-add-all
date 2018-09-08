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

function addToCart(pid, apiUrl='/zh/tw/shoppingcartwidget/add') {
    return $.post(
        apiUrl, 
        {
            Id: pid,
            IsKoboLoveMembership: false
        },
        null,
        'json'
    ).done((resp) => {
        console.log(resp);

        const elm = $('#kobo-aa-dimmer .main .inner');
        if (elm.length == 0) {
            return;
        }

        elm.append(`<div class="kobo-aa result-items">${resp.ItemDetails.Title} - ${resp.IsSuccess ? '已成功加入購物車' : resp.ErrorMessage}</div>`);
    });
}

function koboAddAll(jq=$) {

    const apiUrl = getKoboApiUrl('/shoppingcartwidget/add');
    const reqList = [];

    $.each(
        jq.find('li.item-wrapper.book'),
        (idx, x) => {
            const pid = $(x).data('track-info').productId;
            reqList.push(
                addToCart(pid, apiUrl)
            );
        }
    );

    return $.when(reqList);
}

function koboFindNextPage(jq=$) {
    if (jq.find('div.pagination').length == 0) {
        return '';
    }

    if (jq.find('div.pagination .next.disabled').length > 0) {
        return '';
    }

    return jq.find('div.pagination a.page-link.active').next().attr('href');
}

function addSequenceShortCuts(){
    $.each(
        $('span.product-sequence-field'),
        (idx, x) => {
            $(x).after(`<div class="kobo-aa add-btn" data-href="${$(x).children('a').attr('href')}">將全系列加入購物車</div>`);
        }
    );
}

function addDimmer() {
    if ($('#kobo-aa-dimmer').length > 0) {
        return;
    }

    let dimmerElm = $(`
<div id="kobo-aa-dimmer">
    <div class="main">
        <div class="inner"></div>
    </div>
</div>`);
    $('body').append(dimmerElm).addClass('kobo-aa-dimmer');
}

function dismissDimmer() {
    $('#kobo-aa-dimmer').remove();
    $('body').removeClass('kobo-aa-dimmer');
}

function koboAddAllAjax(jq) {
    const apiUrl = getKoboApiUrl('/shoppingcartwidget/add');
    const reqList = [];
    $.each(
        jq.filter('li'),
        (idx, x) => {
            const pid = $(x).data('track-info').productId;
            reqList.push(
                addToCart(pid, apiUrl)
            );
        }
    )

    return $.when(reqList);    
}

function processSeqPage(url, finalCB) {
    $.get(url)
    .done((resp) => {
        const jq = $(resp.Items);
        koboAddAllAjax(jq)
        .then(() => {
            console.log('koboAddAllAjax.done');
            if (resp.HasMoreResults) {
                if (/&pageNumber=(\d+)/.test(url)) {
                    const page = parseInt(/&pageNumber=(\d+)/.exec(url)[1], 10);
                    url.replace(/&pageNumber=(\d+)/, `&pageNumber=${page + 1}`);
                } else {
                    url += '&pageNumber=2';
                }
                processSeqPage(url);
            }
        })
    })
    .fail((jqXHR, textStatus, errorThrown) => {
        alert(textStatus);
        finalCB(false);
    });
}

addSequenceShortCuts();

// bind event
$('div.kobo-aa.add-btn').on('click', (e)=>{
    const initUrl = e.target.dataset.href;
    addDimmer();
    processSeqPage(initUrl, ()=>{alert('完成~~')});
});