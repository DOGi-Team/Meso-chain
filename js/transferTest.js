const common = require('./common');
class Chain {
    constructor(web3, hub, erc20Address, privateKey) {
        this.web3 = web3;
        if (erc20Address) {
            this.erc20 = new web3.eth.Contract(common.erc20Abi, erc20Address);
        }
        this.hub = hub;
        if (privateKey) {
            this.account = web3.eth.accounts.wallet.add(privateKey);
        } else {
            this.account = web3.eth.accounts.wallet.add(web3.eth.accounts.create());
        }
    }
    setErc20(erc20Address) {
        this.erc20 = new this.web3.eth.Contract(common.erc20Abi, erc20Address);
    }
}
class Robot {
    constructor(chain1, chain2, fromIndex) {
        this.chain1 = chain1;
        this.chain2 = chain2;
        this.fromIndex = 0;
    }
    async checkAddress() {
        if (this.chain1.erc20 && this.chain2.erc20) {
            let confirmErc20Address1 = await this.chain2.hub.methods.contractMap(this.chain2.erc20.options.address).call();
            let confirmErc20Address2 = await this.chain1.hub.methods.contractMap(this.chain1.erc20.options.address).call();
            if (confirmErc20Address1 != this.chain1.erc20.options.address && confirmErc20Address2 != this.chain2.erc20.options.address) {
                throw new Error('Non-correspondence erc20 address.');
            }
        } else if (this.chain1.erc20) {
            let erc20Address2 = await this.chain1.hub.methods.contractMap(this.chain1.erc20.options.address).call();
            let confirmErc20Address1 = await this.chain2.hub.methods.contractMap(erc20Address2).call();
            if (confirmErc20Address1 != this.chain1.erc20.options.address) {
                throw new Error('Non-correspondence erc20 address.');
            } else {
                this.chain2.setErc20(erc20Address2);
            }
        } else if (this.chain2.erc20) {
            let erc20Address1 = await this.chain2.hub.methods.contractMap(this.chain2.erc20.options.address).call();
            let confirmErc20Address2 = await this.chain1.hub.methods.contractMap(erc20Address1).call();
            if (confirmErc20Address2 != this.chain2.erc20.options.address) {
                throw new Error('Non-correspondence erc20 address.');
            } else {
                this.chain1.setErc20(erc20Address1);
            }
        } else {
            throw new Error('No erc20 address.');
        }
    }
    async takeErc20(fromPrivateKey, index, value) {
        let fromAccount = this['chain' + index].web3.eth.accounts.privateKeyToAccount(fromPrivateKey);
        let gasPrice = await this['chain' + index].web3.eth.getGasPrice();
        this.fromIndex = index;
        await this['chain' + index].erc20.methods.transfer(this['chain' + index].account.address, value).send({
            from: fromAccount.address,
            gas: 60000,
            gasPrice: gasPrice
        }).on('error', (error) => {
            console.log('Transfer erc20 error: ' + error);
        });
        // console.log('Transfer erc20 success.');
        await this['chain' + index].web3.eth.sendTransaction({
            from: fromAccount.address,
            to: this['chain' + index].account.address,
            value: 1e16,
            gas: 30000,
            gasPrice: gasPrice
        }).on('error', (error) => {
            console.log('Transfer eth error: ' + error);
        });
        // console.log('Transfer eth success.');
        await this.transfer(0.5);
    }
    async transfer(factor = 0.01 * Math.random()) {
        let chain1, chain2;
        if (this.fromIndex == 1) {
            chain1 = this.chain1;
            chain2 = this.chain2;
            this.fromIndex = 2;
        } else if (this.fromIndex == 2) {
            chain1 = this.chain2;
            chain2 = this.chain1;
            this.fromIndex = 1;
        } else {
            return;
        }
        let gasPrice = await chain1.web3.eth.getGasPrice();
        let erc20Amount = await chain1.erc20.methods.balanceOf(chain1.account.address).call();
        let transferAmount = parseInt(erc20Amount * factor);
        await chain1.erc20.methods.approve(chain1.hub.options.address, transferAmount).send({
            from: chain1.account.address,
            gas: 50000,
            gasPrice: gasPrice
        });
        await chain1.hub.methods.transferOut(chain1.erc20.options.address, chain2.account.address, transferAmount).send({
            from: chain1.account.address,
            gas: 100000,
            gasPrice: gasPrice
        });
        console.log('Transfer erc20 success: ' + chain1.account.address + ' to ' + chain2.account.address + ' value ' + transferAmount);
    }
    async pre() {
        await this.checkAddress();
        await this.takeErc20(config.external.privateKey, 1, 10000000);
        console.log('prepare success.');
    }
    async run() {
        await this.checkAddress();
        this.fromIndex = 2;
        while (this.fromIndex != 0) {
            await this.transfer();
            await common.sleep(1000);
        }
    }
}
module.exports.Chain = Chain;
module.exports.Robot = Robot;