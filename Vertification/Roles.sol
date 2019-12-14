pragma solidity ^0.4.24;



library Roles {
  struct Role {
    mapping (address => bool) bearer;
  }

  
  function add(Role storage _role, address _account)
    internal
  {
    _role.bearer[_account] = true;
  }

  
  function remove(Role storage _role, address _account)
    internal
  {
    _role.bearer[_account] = false;
  }

  
  function check(Role storage _role, address _account)
    internal
    
    view
  {
    require(has(_role, _account));
  }

  
  function has(Role storage _role, address _account)
    internal
    view
    returns (bool)
  {
    return _role.bearer[_account];
  }
}
