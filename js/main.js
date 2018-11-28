const program = require('commander');
const common = require('./common');
const fs = require('fs');
const copyErc20 = require('./copyErc20');
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});

function transfer() {
    const Erc20Transfer = require('./transfer');
    for (let i = 0; i < common.external.erc20Address.length; i++) {
        let externalErc20 = common.external.erc20Address[i];
        new Erc20Transfer(common.external.web3, common.internal.web3, common.external.hubContract, common.internal.hubContract, externalErc20).run();
        new Erc20Transfer(common.internal.web3, common.external.web3, common.internal.hubContract, common.external.hubContract, null, externalErc20).run();
    }
}

function testRun() {
    const test = require('./transferTest');
    let testInternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_internal_private.key').toString().split('\n');
    let testExternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_external_private.key').toString().split('\n');
    for (let i = 0; i < 3; i++) {
        new test.Robot(
            new test.Chain(common.external.web3, common.external.hubContract, common.external.erc20Address[0], '0x' + testExternalPrivateKey[i]),
            new test.Chain(common.internal.web3, common.internal.hubContract, undefined, '0x' + testInternalPrivateKey[i])
        ).run();
    }
}

async function testPre() {
    const test = require('./transferTest');
    let testInternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_internal_private.key').toString().split('\n');
    let testExternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_external_private.key').toString().split('\n');
    for (let i = 0; i < 3; i++) {
        await new test.Robot(
            new test.Chain(common.external.web3, common.external.hubContract, common.external.erc20Address[0], '0x' + testExternalPrivateKey[i]),
            new test.Chain(common.internal.web3, common.internal.hubContract, undefined, '0x' + testInternalPrivateKey[i])
        ).pre();
    }
}

async function newErc20(name = 'TestErc20', symbol = 'TE2', decimals = 6, totalSupply = 1e18) {
    let erc20 = await new common.external.web3.eth.Contract(common.erc20Abi).deploy({
        data: common.erc20Code,
        arguments: [name, symbol, decimals, totalSupply]
    }).send({
        from: common.external.account.address,
        gas: 3000000
    }).on('error', error => {
        console.log('Deploy erc20 error: ' + error);
    });
    console.log("Erc20 deploy success: " + erc20.options.address);
    await copyErc20(erc20.options.address);
}
async function deployHub(externalHubAddress, internalHubAddress) {
    let hub;
    if (typeof externalHubAddress === 'undefined') {
        hub = await common.external.hubContract.deploy({ data: common.hubCode }).send({
        	gas: 3000000
        });
        externalHubAddress = hub.options.address;
        console.log('deploy externalHub: ' + externalHubAddress);
    } else if (externalHubAddress === false) {
        externalHubAddress = common.external.hubAddress;
    }
    if (typeof internalHubAddress === 'undefined') {
        hub = await common.internal.hubContract.deploy({ data: common.hubCode }).send({gas: 3000000});
        internalHubAddress = hub.options.address;
        console.log('deploy internalHub: ' + internalHubAddress);
    } else if (internalHubAddress === false) {
        internalHubAddress = common.internal.hubAddress;
    }
    common.setHubAddress(externalHubAddress, internalHubAddress);
    console.log('set hub success. ' + externalHubAddress + ' ' + internalHubAddress);
}

program.version('0.0.1')
program.command('deploy')
    .description('Deploy hub.')
    .option('-i, --internal [value]', 'internal hub address')
    .option('-e, --external [value]', 'external hub address')
    .option('--ne')
    .option('--ni')
    .action(function(option) {
        let externalHubAddress;
        let internalHubAddress;
        if (option.ne) {
            externalHubAddress = false;
        } else if (option.external) {
            externalHubAddress = option.external;
        }
        if (option.ni) {
            internalHubAddress = false;
        } else if (option.internal) {
            internalHubAddress = option.internal;
        }
        deployHub(externalHubAddress, internalHubAddress);
    })

program.command('adderc20 <address>')
    .action(function(address) {
        copyErc20(address);
    })

program.command('newerc20')
    .option('--name [value]', '', 'TestErc20')
    .option('--symbol [value]', '', 'TE2')
    .option('--decimals [value]', '', '6')
    .option('--totalSupply [value]', '', '1000000000000000000')
    .action(function(option) {
        newErc20(option.name, option.symbol, option.decimals, option.totalSupply);
    })

program.command('transfer')
    .action(transfer)

program.command('testrun')
    .action(testRun)

program.command('testpre')
.action(testPre)

program.command('server')
    .action(function() {
        const server = require('./server');
        server.listen(3000);
    })

program.parse(process.argv);