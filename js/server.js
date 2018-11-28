const common = require('./common');
const express = require('express')

function ctrlDecorator(ctrl, dealer) {
  if ({}.toString.call(ctrl) !== '[object AsyncFunction]') {
    return ctrl;
  }
  return function (req, res, next) {
    return ctrl(req, res, next).catch(rej => {
      if (dealer) return dealer(req, res, next, rej);
      res.send('Internal Error');
    });
  };
}

function routerDecorator(router, dealer) {
  const methods = require('methods');
  [...methods, 'all'].forEach(method => {
    if (router[method]) {
      router[method] = function (path, ...fns) {
        if (fns.length === 0) return;
        const route = this.route(path);
        const ctrlIndex = fns.length - 1;
        if (typeof fns[ctrlIndex] !== 'function') throw Error('The last param should be a controller, but not a function');
        fns[ctrlIndex] = ctrlDecorator(fns[ctrlIndex], dealer);
        route[method].apply(route, fns);
        return this;
      };
    }
  });
  return router;
}

const app = routerDecorator(express(), function (req, res, next, rej) {
  console.warn('捕捉到控制器内Rejection', rej.message);
  res.status(500);
  res.send('内部错误');
});


let hubEvents = {
    TransferOut: {},
    TransferIn: {}
}

for (let address of common.external.erc20Address) {
    hubEvents.TransferIn[address] = {};
    hubEvents.TransferOut[address] = {};
}

(async () => {
    let fromBlock = 0;
    while (true) {
        let toBlock = await common.external.web3.eth.getBlockNumber();
        if (toBlock < fromBlock) {
            await common.sleep(10000);
        } else {
            let events = await common.external.hubContract.getPastEvents('TransferOut', {
                fromBlock: fromBlock,
                toBlock: toBlock
            });
            for (let event of events) {
                hubEvents.TransferOut[event.returnValues.erc20Address][event.returnValues.id] = {
                    id: event.returnValues.id,
                    erc20: event.returnValues.erc20Address,
                    outErc20: event.returnValues.outErc20,
                    from: event.returnValues.from,
                    to: event.returnValues.to,
                    value: event.returnValues.value,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                }
            }
            events = await common.external.hubContract.getPastEvents('TransferIn', {
                fromBlock: fromBlock,
                toBlock: toBlock
            });
            for (let event of events) {
                hubEvents.TransferIn[event.returnValues.erc20Address][event.returnValues.id] = {
                    id: event.returnValues.id,
                    erc20: event.returnValues.erc20Address,
                    outErc20: event.returnValues.outErc20,
                    from: event.returnValues.from,
                    to: event.returnValues.to,
                    value: event.returnValues.value,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                }
            }
            fromBlock = toBlock + 1;
        }

    }

})()



let erc20Info = {};

let getErc20Info = async (address) => {
    if (typeof erc20Info[address] === 'undefined') {
        let externalErc20 = new common.external.web3.eth.Contract(common.erc20Abi, address);
        let name = await externalErc20.methods.name().call();
        let symbol = await externalErc20.methods.symbol().call();
        let decimals = await externalErc20.methods.decimals().call();
        let totalSupply = await externalErc20.methods.totalSupply().call();
        erc20Info[address] = {
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: totalSupply
        };
    }
    return erc20Info[address];
}

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/info', async (req, res) => {
    let erc20s = [];
    for (let erc20 of common.external.erc20Address) {
        let info = await getErc20Info(erc20);
        erc20s.push({
            address: erc20,
            info: info
        });
    }
    res.json({
        externalHub: common.external.hubAddress,
        internalHub: common.internal.hubAddress,
        erc20: erc20s
    });
})

app.get('/event/:name/:address', async (req, res) => {
    let latestId;
    if(req.params.name == 'TransferOut'){
        latestId = await common.external.hubContract.methods.transferOutId(req.params.address).call();
    }else if(req.params.name == 'TransferIn'){
        latestId = await common.external.hubContract.methods.transferInId(req.params.address).call();
    }
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 10;
    let events = hubEvents[req.params.name][req.params.address];
    let re = [];
    let startId = latestId - (page-1)*pageSize;
    for (let i = startId; i > startId - pageSize; i--) {
        if (typeof events[i] !== 'undefined')
            re.push(events[i]);
    }
    res.json(re)
})

app.get('/block/:number', async (req, res) => {
    let block = await common.internal.web3.eth.getBlock(req.params.number);
    res.json(block);
})

app.get('/blockNumber', async (req, res) => {
    let number = await common.internal.web3.eth.getBlockNumber()
    res.json({
        number: number
    });
})

app.get('/peers', async (req, res) => {
    res.json([
        {name: 'Meso1',status:true,internalStatus:true,transferStatus:true},
        {name: 'Meso2',status:true,internalStatus:true,transferStatus:true},
        {name: 'Meso3',status:true,internalStatus:true,transferStatus:true},
        {name: 'Meso4',status:true,internalStatus:true,transferStatus:true},
        {name: 'Meso5',status:true,internalStatus:true,transferStatus:true}
    ]);
})

app.use(function (err, req, res, next) {
  console.warn('错误处理中间捕获Exception', err);
  res.json({error:'内部错误'});
});

module.exports = app;