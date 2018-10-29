const Web3 = require('web3');
const fs = require('fs');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
var web3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
let cryptKey = "";
let privateKey = "0x4a7d41e8385b03223d1fb20b9b4b3c68c252a41c8f92c785f573308a9a738b30";
let account = web3.eth.accounts.wallet.add(privateKey);
console.log(account);
process.exit(0);
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