const Web3 = require('web3');
const fs = require('fs');
const config = require('../json/config.json');
if (config.internal.HttpProvider !== undefined) {
    config.internal.web3 = new Web3(new Web3.providers.HttpProvider(config.internal.HttpProvider));
};
if (config.external.HttpProvider !== undefined) {
    config.external.web3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
};
config.internal.privateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
config.internal.account = config.internal.web3.eth.accounts.privateKeyToAccount(config.internal.privateKey);
config.external.privateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
config.external.account = config.external.web3.eth.accounts.privateKeyToAccount(config.external.privateKey);
config.external.hubContract = new config.external.web3.eth.Contract(config.hubAbi, config.external.hubAddress, {
    from: config.external.account.address,
    gas: 300000
});
config.internal.hubContract = new config.internal.web3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: config.internal.account.address,
    gas: 300000
});

function outputConfig() {
    fs.writeFileSync(__dirname + '/../json/config.json', JSON.stringify({
        hubCode: config.hubCode,
        hubAbi: config.hubAbi,
        erc20Code: config.erc20Code,
        erc20Abi: config.erc20Abi,
        internal: {
            hubAddress: config.internal.hubAddress,
            HttpProvider: config.internal.HttpProvider
        },
        external: {
            hubAddress: config.external.hubAddress,
            HttpProvider: config.external.HttpProvider,
            erc20Address: config.external.erc20Address
        }
    }));
}
module.exports = config;
module.exports.sleep = function(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
};
module.exports.addErc20 = function(address) {
    if (config.external.erc20Address.indexOf(address) == -1) {
        config.external.erc20Address.push(address);
        outputConfig();
    }
};
module.exports.delErc20 = function(address) {
    let index = config.external.erc20Address.indexOf(address);
    if (index != -1) {
        config.external.erc20Address.splice(index, 1);
        outputConfig();
    }
};
module.exports.setHubAddress = function(externalHubAddress, internalHubAddress) {
    if (typeof externalHubAddress !== 'undefined') {
        config.external.hubAddress = externalHubAddress;
    }
    if (typeof internalHubAddress !== 'undefined'){
        config.internal.hubAddress = internalHubAddress;
    }
    outputConfig();
}