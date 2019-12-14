pragma solidity ^0.4.24;

import "./StandardToken.sol";
// the token can be burned;

contract BurnableToken is StandardToken {

  event TokensBurned(address indexed burner, uint256 value);

  function burn(uint256 _value) public {
    _burn(msg.sender, _value);
  }

  function burnFrom(address _from, uint256 _value) public {
    _burnFrom(_from, _value);
  }

  function _burn(address _who, uint256 _value) internal {
    super._burn(_who, _value);
    emit TokensBurned(_who, _value);
  }
}
