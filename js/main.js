const erc20Abi = [];

const mainHubAddress = '';
const mainnetWeb3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const bypassHubAddress = '';
const bypassWeb3 = web3;

const erc20 = web3.eth.contract(erc20Abi);
var erc20Instance = erc20.at(erc20Address);
// watch for an event with {some: 'args'}
var transferToBypass = erc20Instance.TransferToBypass(null, {fromBlock: 0, toBlock: 'latest'});
transferToBypass.watch(function(error, result){
 if (!error){

 }
});
// would get all past logs again.
var myResults = transferToBypass.get(function(error, logs){ ... });
...
// would stop and uninstall the filter
transferToBypass.stopWatching();