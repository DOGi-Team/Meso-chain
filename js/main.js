const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.wallet.add(internalPrivateKey);
let externalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: internalAccount.address,
    gas: 10000000
});
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
async function transferErc20(fromChainHub, toChainHub, fromErc20, toErc20) {
    let checkErc20Address = async function() {
        if (fromErc20) {
            toErc20 = await fromChainHub.methods.contractMap(fromErc20).call();
            confirmFromErc20 = await toChainHub.methods.contractMap(toErc20).call();
            if (confirmFromErc20 != fromErc20) {
                throw new Error('Non-correspondence erc20 address.');
            }
        } else if (toErc20) {
            fromErc20 = await toChainHub.methods.contractMap(toErc20).call();
            confirmToErc20 = await fromChainHub.methods.contractMap(fromErc20).call();
            if (confirmToErc20 != toErc20) {
                throw new Error('Non-correspondence erc20 address.');
            }
        } else {
            throw new Error('No erc20 address.');
        }
    }
    await checkErc20Address();
    // let fromId = await fromChainHub.methods.transferOutId(fromErc20).call();
    let toId = await toChainHub.methods.transferIn(toErc20).call();
    let pre = {};
    let startEvents = await fromChainHub.getPastEvents('TransferOut', {
        filter: {
            id: toId,
            erc20Address: fromErc20
        },
        fromBlock: 0
    });
    if(startEvents.length == 0){
    	throw new Error('Error log.');
    }

    let fromBlock = startEvents.pop().blockNumber;
    fromChainHub.events.TransferOut({
        fromBlock: fromBlock,
        filter: {
            erc20Address: fromErc20
        }
    }).on('data', function(event) {
        let data = event.returnValues;
        if (data.id > toId) {
            pre[data.id] = data;
        }
    }).on('error', console.error);
    let transferIn = async function() {
        let data = {
            id: [],
            erc20Address: [],
            from: [],
            to: [],
            value: []
        };
        let i = await toChainHub.methods.transferIn(toErc20).call();
        for (i++ ; typeof pre[i] !== 'undefined'; i++) {
            data.id.push(i);
            data.erc20Address.push(pre[i].outErc20);
            data.from.push(pre[i].from);
            data.to.push(pre[i].to);
            data.value.push(pre[i].value);
        }
        if (data.id.length == 0) {
            setTimeout(transferIn, 15000);
        } else {
            toChainHub.methods.transferIn(data.id, data.erc20Address, data.from, data.to, data.value).send().on('receipt', function(receipt) {
                setTimeout(transferIn, 1000);
            }).on('error', function(error) {
                console.error(error);
                transferIn();
            });
        }
    }
    transferIn();
}