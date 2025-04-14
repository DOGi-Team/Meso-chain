const common = require('./common');
async function copyErc20(externalErc20Address) {
    //get info
    let externalErc20 = new common.external.web3.eth.Contract(common.erc20Abi, externalErc20Address);
    let name = await externalErc20.methods.name().call();
    let symbol = await externalErc20.methods.symbol().call();
    let decimals = await externalErc20.methods.decimals().call();
    let totalSupply = await externalErc20.methods.totalSupply().call();
    //deploy erc20
    let internalErc20 = new common.internal.web3.eth.Contract(common.erc20Abi, null, {
        from: common.internal.account.address,
        gas: 1000000
    });
    internalErc20 = await internalErc20.deploy({
        data: common.erc20Code,
        arguments: [name, symbol, decimals, totalSupply]
    }).send({
        from: common.internal.account.address,
        gas: 3000000
    }).on('error', error => {
        console.log('Deploy erc20 error: ' + error);
    });
    console.log("Erc20 deploy success: " + internalErc20.options.address);
    //transfer totalSupply
    await internalErc20.methods.transfer(common.internal.hubAddress, totalSupply).send({
        from: common.internal.account.address,
        gas: 60000
    }).on('error', error => {
        console.log('Transfer totalSupply error: ' + error);
    });
    console.log("Transfer totalSupply success: " + totalSupply);
    //InternalHub addContract
    let internalHub = new common.internal.web3.eth.Contract(common.hubAbi, common.internal.hubAddress);
    await internalHub.methods.addContract(internalErc20.options.address, externalErc20Address).send({
        from: common.internal.account.address,
        gas: 60000
    }).on('error', error => {
        console.log('InternalHub addContract error: ' + error);
    });
    console.log("InternalHub addContract success.");
    //ExternalHub addContract
    let gasPrice = await common.external.web3.eth.getGasPrice();
    if (common.external.web3.utils.toBN(gasPrice).gt(common.external.web3.utils.toBN('5000000000'))) {
        gasPrice = '5000000000';
    }
    let externalHub = new common.external.web3.eth.Contract(common.hubAbi, common.external.hubAddress);
    await externalHub.methods.addContract(externalErc20Address, internalErc20.options.address).send({
        from: common.external.account.address,
        gas: 60000,
        gasPrice: gasPrice
    }).on('error', error => {
        console.log('ExternalHub addContract error: ' + error);
    });
    console.log("ExternalHub addContract success.");
    common.addErc20(externalErc20Address);
}
module.exports = copyErc20;