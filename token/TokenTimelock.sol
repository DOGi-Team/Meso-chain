pragma solidity ^0.4.24;

import "./SafeERC20.sol";



contract TokenTimelock {
  using SafeERC20 for ERC20;

  // ERC20 basic token contract being held
  ERC20 public token;

  // beneficiary of tokens after they are released
  address public beneficiary;

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(
    ERC20 _token,
    address _beneficiary,
    uint256 _releaseTime
  )
    public
  {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    token = _token;
    beneficiary = _beneficiary;
    releaseTime = _releaseTime;
  }

  
  function release() public {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);

    uint256 amount = token.balanceOf(address(this));
    require(amount > 0);

    token.safeTransfer(beneficiary, amount);
  }
}
