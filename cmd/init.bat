..\bin\geth.exe --datadir "..\chain-data" init ..\json\genesis.json
::..\bin\geth.exe --datadir "..\chain-data" account import ..\privatekey\private.key --password ..\privatekey\password.key