const common = require('./common');
class Erc20Transfer {
    constructor(fromWeb3, toWeb3, fromChainHub, toChainHub, fromErc20, toErc20) {
        this.fromWeb3 = fromWeb3;
        this.toWeb3 = toWeb3;
        this.fromChainHub = fromChainHub;
        this.toChainHub = toChainHub;
        this.fromErc20 = fromErc20;
        this.toErc20 = toErc20;
        this.stop = true;
        this.pre = {};
    }
    async checkAddress() {
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
    }
    sendTransferIn(id) {
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
    async run() {
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
            await common.sleep(15000);
        }
    }
    async watchTransferIn(fromBlock = 0) {
        while (!this.stop) {
            let toBlock = await this.toWeb3.eth.getBlockNumber();
            if (toBlock < fromBlock) {
                await common.sleep(10000);
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
                await common.sleep(2000);
            }
        }
    }
    async watchTransferOut(fromBlock = 0) {
        while (!this.stop) {
            let toBlock = await this.fromWeb3.eth.getBlockNumber();
            if (toBlock < fromBlock) {
                await common.sleep(10000);
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
                await common.sleep(2000);
            }
        }
    }
}

module.exports = Erc20Transfer