pragma solidity ^0.4.24;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DogiHub is Ownable{

  using SafeMath for uint256;


  event TransferToBypass(address indexed bypassContract, address indexed from, address indexed to, uint256 id, uint256 value);
  event TransferFromBypass(address indexed bypassContract, address indexed from, address indexed to, uint256 id, uint256 value);

  mapping (address => address) bypassContract;
  mapping (address => uint256) transferToBypassId;
  mapping (address => uint256) transferFromBypassId;

  function addContract(address _contractAddress, address _bypassAddress) public onlyOwner returns (bool){
  	require(_bypassAddress != address(0));

  	bypassContract[_contractAddress] = _bypassAddress;
  	//transferToBypassId[_contractAddress] = 0;
  	//transferFromBypassId[_contractAddress] = 0;

  	return true;
  }

  function transferToBypass(address _contractAddress, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));

    IERC20 _contract = IERC20(_contractAddress);

    _contract.transferFrom(msg.sender, this, _value);
    emit TransferToBypass(bypassContract[_contractAddress], msg.sender, _to, transferToBypassId[_contractAddress], _value);

    transferToBypassId[_contractAddress].add(1);
    return true;
  }

  function transferFromBypass(uint256 _id, address _contractAddress, address _from, address _to, uint256 _value) public onlyOwner returns (bool){
    require(_to != address(0));
    require(_id == transferFromBypassId[_contractAddress]);

    IERC20 _contract = IERC20(_contractAddress);

    _contract.transfer(_to, _value);
    emit TransferFromBypass(bypassContract[_contractAddress], _from, _to, _id, _value);

    transferFromBypassId[_contractAddress] = _id.add(1);

    return true;
  }
}
