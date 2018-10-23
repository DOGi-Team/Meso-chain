pragma solidity ^0.4.24;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DogiHub is Ownable{

  using SafeMath for uint256;


  event TransferOut(uint256 indexed id, address indexed externalErc20, address indexed from, address to, uint256 value);
  event TransferIn(uint256 indexed id, address indexed externalErc20, address from, address indexed to, uint256 value);

  mapping (address => address) contractMap;
  mapping (address => uint256) transferOutId;
  mapping (address => uint256) transferInId;

  function addContract(address _internalErc20, address _externalErc20) public onlyOwner returns (bool){
  	require(_internalErc20 != address(0));
    require(_externalErc20 != address(0));

  	contractMap[_internalErc20] = _externalErc20;
  	transferOutId[_internalErc20] = 0;
  	transferInId[_internalErc20] = 0;

  	return true;
  }

  function transferOut(address _internalErc20, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_internalErc20 != address(0));
    require(contractMap[_internalErc20] != address(0));

    IERC20 _erc20 = IERC20(_internalErc20);

    _erc20.transferFrom(msg.sender, this, _value);
    emit TransferOut(transferOutId[_internalErc20], contractMap[_internalErc20], msg.sender, _to, _value);

    transferOutId[_internalErc20].add(1);
    return true;
  }

  function multTransferIn(uint256[] _id, address[] _internalErc20, address[] _from, address[] _to, uint256[] _value) public onlyOwner returns (bool){
    for (uint256 i = 0; i < _id.length; i++){
      transferIn(_id[i],_internalErc20[i],_from[i],_to[i],_value[i]);
    }
  }

//change to array
  function transferIn(uint256 _id, address _internalErc20, address _from, address _to, uint256 _value) public onlyOwner returns (bool){
    require(_to != address(0));
    require(_internalErc20 != address(0));
    require(contractMap[_internalErc20] != address(0));
    require(_id == transferInId[_internalErc20]);

    IERC20 _erc20 = IERC20(_internalErc20);

    _erc20.transfer(_to, _value);
    emit TransferIn(_id, contractMap[_internalErc20], _from, _to, _value);

    transferInId[_internalErc20] = _id.add(1);

    return true;
  }
}
