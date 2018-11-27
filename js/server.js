const http = require('http');
const url = require('url');
const common = require('./common');
module.exports = http.createServer(function(req, res) {
    // 定义了一个post变量，用于暂存请求体的信息
    let post = '';
    let thisUrl = url.parse(req.url, true);
    let returnError = function(message, code) {
        let returnObj = {};
        returnObj.ok = false;
        returnObj.error = {
            message: message,
            code: code,
        };
        res.end(JSON.stringify(returnObj));
    };
    let requireArg = function(data, ...arg) {
        for (let k of arg) {
            if (typeof data[k] === 'undefined') {
                returnError("内部参数错误", "10004");
            }
        }
    };
    let getEvent = async function(data) {
        requireArg(data, 'fromBlock', 'toBlock','eventName','chainNumber');
        let web3;
        if(data.chainNumber == 0){
            hubContract = externalHubContract;
        }else{
            hubContract = internalHubContract;
        }
        let filter = {}
        if (typeof data.erc20Address !== 'undefined') {
            filter.erc20Address = data.erc20Address;
        }
        hubContract.getPastEvents(data.eventName, {
            filter: filter,
            fromBlock: data.fromBlock,
            toBlock: data.toBlock
        },function(error,result){
            if (!error) {
                for(let event of result){
                    delete event.raw;
                }
                req.end(JSON.stringify({
                    ok: true,
                    data: result
                }));
            } else {
                returnError(error, '10007');
            }
        });
    };
    let getErc20Name = function(data) {
        requireArg(data, 'erc20Address');
        let externalErc20 = new externalWeb3.eth.Contract(common.erc20Abi, externalErc20Address);
        externalErc20.methods.name().call({}, function(error, result) {
            if (!error) {
                req.end(JSON.stringify({
                    ok: true,
                    data: {
                        name: result
                    }
                }));
            } else {
                returnError(error, '10007');
            }
        });
    };
    let getBlock = function(data) {
        requireArg(data, 'blockNumber');
        internalWeb3.eth.getBlock(data.blockNumber, true, function(error, result) {
            if (!error) {
                req.end(JSON.stringify({
                    ok: true,
                    data: result
                }));
            } else {
                returnError(error, '10007');
            }
        });
    };
    let getBlockNumber = function(data) {
        requireArg(data,'chainNumber');
        let web3;
        if(data.chainNumber == 0){
            web3 = externalWeb3;
        }else{
            web3 = internalWeb3;
        }
        web3.eth.getBlockNumber(function(result) {
            req.end(JSON.stringify({
                ok: true,
                data: {
                    blockNumber: result
                }
            }));
        })
    }
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
    req.on('data', function(chunk) {
        post += chunk;
    });
    // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
    req.on('end', function() {
        try {
            if (req.headers['content-type'].indexOf('application/json') == 0) {
                post = JSON.parse(post);
                if (typeof post.data === 'undefined') {
                    returnError("参数错误", "10003");
                } else {
                    let data = JSON.parse(post.data);
                    switch (thisUrl.pathname) {
                        case '/getBlock':
                            break;
                        case '/getEvent':
                            break;
                        case '/check':
                            web3.eth.getTransaction(data.transactionHash).catch(function(error) {
                                returnError(error.message, "10005");
                            }).then(function(transaction) {
                                if (transaction === null) {
                                    res.end(JSON.stringify({
                                        ok: true,
                                        data: {
                                            transactionState: 'notFound'
                                        }
                                    }));
                                } else if (transaction.blockNumber === null) {
                                    res.end(JSON.stringify({
                                        ok: true,
                                        data: {
                                            transactionState: 'pending'
                                        }
                                    }));
                                } else {
                                    web3.eth.getTransactionReceipt(data.transactionHash).catch(function(error) {
                                        returnError(error.message, "10006");
                                    }).then(function(receipt) {
                                        if (receipt.status) {
                                            res.end(JSON.stringify({
                                                ok: true,
                                                data: {
                                                    transactionState: 'success'
                                                }
                                            }));
                                        } else {
                                            res.end(JSON.stringify({
                                                ok: true,
                                                data: {
                                                    transactionState: 'fail'
                                                }
                                            }));
                                        }
                                    });
                                }
                            });
                            break;
                        case '/extract':
                            contract.methods.transfer(data.address, data.amount).send().on('error', function(error) {
                                returnError(error.message, "10005");
                            }).on('transactionHash', function(hash) {
                                res.end(JSON.stringify({
                                    ok: true,
                                    data: {
                                        transactionHash: hash
                                    }
                                }));
                            });
                            break;
                        default:
                            returnError("非法请求", "10002");
                            break;
                    }
                }
            } else {
                returnError("非法请求", "10001");
            }
        } catch (e) {
            returnError(e.message, '10000');
        }
    });
});