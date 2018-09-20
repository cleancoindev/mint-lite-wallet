let isFirefox = typeof InstallTrigger !== 'undefined';
let browser = isFirefox ? browser : chrome;
let xhr = new XMLHttpRequest();
let checkStatusUrl = 'https://staging.goldmint.io/wallet/api/v1/explorer/transaction';

let wallets = [];
let txQueue = {};

// after load page
watchTransactionStatus(true);

function storageAction(request) {
    request.identify && window.sessionStorage.setItem('identify', request.identify);
    request.logout && window.sessionStorage.removeItem('identify');
    // after added new tx
    request.newTransaction && watchTransactionStatus(false);
}

function watchTransactionStatus(firstLoad) {
   browser.storage.local.get(null, (result) => {
        wallets = result.wallets;

        wallets && wallets.forEach(wallet => {
            if (wallet.tx) {
                const hash = wallet.tx.hash;
                const endTime = wallet.tx.endTime;

                let isMatch = false;
                Object.keys(txQueue).forEach(key => {
                    key === hash && (isMatch = true);
                });

                if (!isMatch) {
                    const interval = setInterval(() => {
                        checkTransactionStatus(hash, endTime);
                    }, 30000);
                    txQueue[hash] = interval;
                    firstLoad && checkTransactionStatus(hash, endTime);
                }
            }
        });
    });
}

function checkTransactionStatus(hash, endTime) {
    const time = new Date().getTime();
    if (time < endTime) {
        xhr.open('POST', checkStatusUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({hash: hash}));

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status == 200) {
                const result = JSON.parse(xhr.responseText);

                if (result.data.status === 2) {
                    finishTx(hash);
                    successTxNotification(hash);
                }
            }
        }
    } else {
        finishTx(hash);
        feiledTxNotification(hash);
    }
}

function finishTx(hash) {
    clearInterval(txQueue[hash]);
    delete txQueue[hash];

    wallets = wallets.map(wallet => {
        if (wallet.tx && wallet.tx.hash === hash) {
            delete wallet.tx;
        }
        return wallet;
    });
    browser.storage.local.set({['wallets']: wallets}, () => { });
}

function successTxNotification(hash) {
    new Notification('Goldmint Lite Wallet', {
        icon: 'assets/icon.png',
        body: `Transaction ${hash} is confirmed`,
    });
}

function feiledTxNotification(hash) {
    new Notification('Goldmint Lite Wallet', {
        icon: 'assets/icon.png',
        body: `Transaction ${hash} is failed`,
    });
}

if (isFirefox) {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        storageAction(request);
    });
} else {
    browser.extension.onMessage.addListener((request, sender, sendResponse) => {
        storageAction(request);
    });
}