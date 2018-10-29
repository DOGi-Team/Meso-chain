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

  function multTransferIn(uint256[] _id, address[] _erc20Address, address[] _from, address[] _to, uint256[] _value) public onlyOwner returns (bool){
    require(_id.length > 0);
    for (uint256 i = 0; i < _id.length; i++){
      transferIn(_id[i],_erc20Address[i],_from[i],_to[i],_value[i]);
    }
  }

//change to array
  function transferIn(uint256 _id, address _erc20Address, address _from, address _to, uint256 _value) private returns (bool){
    require(_erc20Address != address(0));
    require(contractMap[_erc20Address] != address(0));
    require(_id == transferInId[_erc20Address].add(1));

    IERC20 _erc20 = IERC20(_erc20Address);

    _erc20.transfer(_to, _value);
    transferInId[_erc20Address] = _id;
    emit TransferIn(_id, _erc20Address, _from, _to, _value, contractMap[_erc20Address]);

    return true;
  }
}
