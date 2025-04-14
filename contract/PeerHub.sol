pragma solidity ^0.4.24;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract PeerHub is Ownable{

  using SafeMath for uint256;

  event TransferOut(uint256 indexed id, address indexed erc20Address, address indexed from, address to, uint256 value, address outErc20);
  event TransferIn(uint256 indexed id, address indexed erc20Address, address from, address indexed to, uint256 value, address outErc20);

  mapping (address => address) public contractMap;
  mapping (address => uint256) public transferOutId;
  mapping (address => uint256) public transferInId;
  mapping (address => mapping (uint256 => bool)) public transferInStatus;

  function addContract(address _erc20Address, address _outErc20) public onlyOwner returns (bool){
  	require(_erc20Address != address(0));
    require(_outErc20 != address(0));

  	contractMap[_erc20Address] = _outErc20;
  	transferOutId[_erc20Address] = 0;
  	transferInId[_erc20Address] = 0;

  	return true;
  }

  function transferOut(address _erc20Address, address _to, uint256 _value) public returns (bool) {
    require(_erc20Address != address(0));
    require(contractMap[_erc20Address] != address(0));

    IERC20 _erc20 = IERC20(_erc20Address);

    _erc20.transferFrom(msg.sender, this, _value);
    transferOutId[_erc20Address] = transferOutId[_erc20Address].add(1);
    emit TransferOut(transferOutId[_erc20Address], _erc20Address, msg.sender, _to, _value, contractMap[_erc20Address]);

    return true;
  }

  function transferIn(uint256 _id, address _erc20Address, address _from, address _to, uint256 _value) public returns (bool){
    require(transferInStatus[_erc20Address][_id] == false);
    return forceTransferIn(_id, _erc20Address, _from, _to, _value);
  }

  function forceTransferIn(uint256 _id, address _erc20Address, address _from, address _to, uint256 _value) public onlyOwner returns (bool){
    require(_erc20Address != address(0));
    require(contractMap[_erc20Address] != address(0));

    IERC20 _erc20 = IERC20(_erc20Address);

    _erc20.transfer(_to, _value);
    transferInStatus[_erc20Address][_id] = true;
    if(_id > transferInId[_erc20Address]){
      transferInId[_erc20Address] = _id;
    }
    emit TransferIn(_id, _erc20Address, _from, _to, _value, contractMap[_erc20Address]);

    return true;
  }

  function setTransferInId(uint256 _id, address _erc20Address) public onlyOwner returns (bool){
    transferInId[_erc20Address] = _id;
    return true;
  }
}
