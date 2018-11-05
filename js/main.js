function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}
const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
const config = require('../json/config.json');
// let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.privateKeyToAccount(internalPrivateKey);
let externalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress, {
    from: externalAccount.address,
    gas: 300000
});
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: internalAccount.address,
    gas: 300000
});
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
/****************class begin****************/
function Erc20Transfer(fromWeb3, toWeb3, fromChainHub, toChainHub, fromErc20, toErc20) {
    this.fromWeb3 = fromWeb3;
    this.toWeb3 = toWeb3;
    this.fromChainHub = fromChainHub;
    this.toChainHub = toChainHub;
    this.fromErc20 = fromErc20;
    this.toErc20 = toErc20;
    this.stop = true;
    this.pre = {};
}
Erc20Transfer.prototype.checkAddress = async function() {
    if (this.fromErc20) {
        this.toErc20 = await this.fromChainHub.methods.contractMap(this.fromErc20).call();
        let confirmFromErc20 = await this.toChainHub.methods.contractMap(this.toErc20).call();
        if (confirmFromErc20 != this.fromErc20) {
            throw new Error('Non-correspondence erc20 address.');
        }
    } else if (this.toErc20) {
        this.fromErc20 = await this.toChainHub.methods.contractMap(this.toErc20).call();
        let confirmToErc20 = await this.fromChainHub.methods.contractMap(this.fromErc20).call();
        if (confirmToErc20 != this.toErc20) {
            throw new Error('Non-correspondence erc20 address.');
        }
    } else {
        throw new Error('No erc20 address.');
    }
};
Erc20Transfer.prototype.sendTransferIn = function(id) {
	let self = this;
    this.pre[id].pending = true;
    this.toChainHub.methods.transferIn(this.pre[id].id, this.pre[id].outErc20, this.pre[id].from, this.pre[id].to, this.pre[id].value).send().on('error', function(error) {
        console.log(error.message);
        if (self.pre.hasOwnProperty(id)) self.pre[id].pending = false;
    }).on('receipt', function(receipt) {
    	console.log('Add transferIn ' + JSON.stringify(receipt.events.TransferIn.returnValues));
        // if (typeof receipt.events.TransferIn !== 'undefined') delete this.pre[receipt.events.TransferIn.returnValues.id];
    });
}
Erc20Transfer.prototype.run = async function() {
    await this.checkAddress();
    this.stop = false;
    let toBlock = await this.fromWeb3.eth.getBlockNumber();
    let events = await this.fromChainHub.getPastEvents('TransferOut', {
        filter: {
            erc20Address: this.fromErc20
        },
        fromBlock: 0,
        toBlock: toBlock
    });
    for (let i = 0; i < events.length; i++) {
    	// console.log(events[i].returnValues);
        let data = events[i].returnValues;
        data.pending = false;
        this.pre[data.id] = data;
    }
    this.watchTransferOut(toBlock + 1);
    toBlock = await this.toWeb3.eth.getBlockNumber();
    events = await this.toChainHub.getPastEvents('TransferIn', {
        filter: {
            erc20Address: this.toErc20
        },
        fromBlock: 0,
        toBlock: toBlock
    });
    for (let i = 0; i < events.length; i++) {
    	// console.log(events[i].returnValues);
        delete this.pre[events[i].returnValues.id];
    }
    this.watchTransferIn(toBlock + 1);
    while (!this.stop) {
        for (let i in this.pre) {
            if (this.pre[i].pending) continue;
            this.sendTransferIn(i);
        }
        await sleep(15000);
    }
};
Erc20Transfer.prototype.watchTransferIn = async function(fromBlock = 0) {
    while (!this.stop) {
        let toBlock = await this.toWeb3.eth.getBlockNumber();
        if (toBlock < fromBlock) {
            await sleep(10000);
        } else {
            let events = await this.toChainHub.getPastEvents('TransferIn', {
                filter: {
                    erc20Address: this.toErc20
                },
                fromBlock: fromBlock,
                toBlock: toBlock
            });
            for (let i = 0; i < events.length; i++) {
                delete this.pre[events[i].returnValues.id];
            }
            fromBlock = toBlock + 1;
            await sleep(2000);
        }
    }
}
Erc20Transfer.prototype.watchTransferOut = async function(fromBlock = 0) {
    while (!this.stop) {
        let toBlock = await this.fromWeb3.eth.getBlockNumber();
        console.log(this.fromErc20,fromBlock,toBlock);
        if (toBlock < fromBlock) {
            await sleep(10000);
        } else {
            let events = await this.fromChainHub.getPastEvents('TransferOut', {
                filter: {
                    erc20Address: this.fromErc20
                },
                fromBlock: fromBlock,
                toBlock: toBlock
            });
            for (let i = 0; i < events.length; i++) {
                let data = events[i].returnValues;
                data.pending = false;
                this.pre[data.id] = data;
            }
            fromBlock = toBlock + 1;
            await sleep(2000);
        }
    }
}
/****************class end****************/
for (let i = 0; i < config.external.erc20Address.length; i++) {
    let externalErc20 = config.external.erc20Address[i];
    new Erc20Transfer(externalWeb3, internalWeb3, externalHubContract, internalHubContract, externalErc20).run();
    new Erc20Transfer(internalWeb3, externalWeb3, internalHubContract, externalHubContract, null, externalErc20).run();
}