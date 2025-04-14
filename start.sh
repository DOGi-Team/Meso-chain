#!/bin/bash

geth --datadir "./data" init ./json/genesis.json

geth --nodiscover --rpc --ipcdisable --mine --miner.threads 1 --miner.gasprice "0" --bootnodes value --datadir "./data" --networkid value

geth --jspath "./js" --exec 'loadScript("main.js")' attach http://127.0.0.1:8545
