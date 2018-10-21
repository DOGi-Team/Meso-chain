pragma solidity ^0.4.24;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DogiHub is Ownable{

  using SafeMath for uint256;


  event TransferOut(address indexed bypassContract, address indexed from, address indexed to, uint256 id, uint256 value);
  event TransferIn(address indexed bypassContract, address indexed from, address indexed to, uint256 id, uint256 value);

  mapping (address => address) bypassContract;
  mapping (address => uint256) transferOutId;
  mapping (address => uint256) transferInId;

  function addContract(address _contractAddress, address _bypassAddress) public onlyOwner returns (bool){
  	require(_bypassAddress != address(0));

  	bypassContract[_contractAddress] = _bypassAddress;
  	//transferOutId[_contractAddress] = 0;
  	//transferInId[_contractAddress] = 0;

  	return true;
  }

  function transferOut(address _contractAddress, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));

    IERC20 _contract = IERC20(_contractAddress);

    _contract.transferFrom(msg.sender, this, _value);
    emit TransferOut(bypassContract[_contractAddress], msg.sender, _to, transferOutId[_contractAddress], _value);

    transferOutId[_contractAddress].add(1);
    return true;
  }

//change to array
  function transferIn(uint256 _id, address _contractAddress, address _from, address _to, uint256 _value) public onlyOwner returns (bool){
    require(_to != address(0));
    require(_id == transferInId[_contractAddress]);

    IERC20 _contract = IERC20(_contractAddress);

    _contract.transfer(_to, _value);
    emit TransferIn(bypassContract[_contractAddress], _from, _to, _id, _value);

    transferInId[_contractAddress] = _id.add(1);

    return true;
  }
}
