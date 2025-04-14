pragma solidity ^0.4.24;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract SimpleToken is ERC20 {

  string public name = "SimpleToken";
  string public symbol = "SIM";
  uint8 public decimals = 18;

  // uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor(string _name,string _symbol,uint8 _decimals,uint256 totalSupply) public {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    _mint(msg.sender, totalSupply);
  }

}
