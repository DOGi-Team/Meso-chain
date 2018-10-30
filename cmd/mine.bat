..\bin\geth.exe --nodiscover --ws --wsorigins "*" --ipcdisable --mine --miner.threads 1 --miner.gasprice "0" ^
 --etherbase=0x0000000000000000000000000000000000000001 --datadir "..\chain-data" --networkid 396 --miner.gastarget 16777215
:: --unlock 0x56c1f5d9e8fdf24fcc5479620cb95272902a29bc --password ..\privatekey\password.key