..\bin\geth.exe --datadir "..\chain-data" init ..\json\genesis.json
..\bin\geth.exe --datadir "..\chain-data" account import ..\privatekey\internal_private.key --password ..\privatekey\password.key