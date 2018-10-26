const Web3 = require('web3');
const fs = require('fs');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
var web3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
let tokenAddress = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52";
let tokenAbi = [{
    "constant": false,
    "inputs": [{
        "name": "spender",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "from",
        "type": "address"
    }, {
        "name": "to",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "transferFrom",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "who",
        "type": "address"
    }],
    "name": "balanceOf",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "to",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "owner",
        "type": "address"
    }, {
        "name": "spender",
        "type": "address"
    }],
    "name": "allowance",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "from",
        "type": "address"
    }, {
        "indexed": true,
        "name": "to",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Transfer",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "owner",
        "type": "address"
    }, {
        "indexed": true,
        "name": "spender",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Approval",
    "type": "event"
}];
let cryptKey = "";
let privateKey = "4a7d41e8385b03223d1fb20b9b4b3c68c252a41c8f92c785f573308a9a738b30";
let account = web3.eth.accounts.wallet.add(privateKey);
let contract = new web3.eth.Contract(tokenAbi, tokenAddress, {
    from: account.address,
    gas: 3000000
});
// web3.eth.getTransaction('0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b§234',function(error,result){
// 	console.log(error);
// })
async function test() {
    // try {
        console.log("123", 456);
    	throw new Error('skdjgla');
        let a = contract.methods.transfer('0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 1)
        .send();
        // .catch(console.log, 123);
        // a = web3.eth.getTransaction('0xB8c77482e45F1F44dE1745F52C74426C631bDD52');
        console.log(a,2423);
    // } catch (e) {
    //     console.log(e,23523);
    // }
}


function sleep(time = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    })
  }

async function test2(){
	return test3();
}

async function test3(){
	await sleep(3000);
	console.log(333);
	throw new Error('www');
	return 1;
}

async function test1(){
	try{

	a = await sleep(1000);
	console.log(a);
	}catch(e){
		console.log(e,1234);
	}
}

test1();

// process.on('unhandledRejection', error => {
//   console.error('unhandledRejection', error);
// //  process.exit(1) // To exit with a 'failure' code
// });