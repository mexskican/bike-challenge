/*
Implements EIP20 token standard: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
.*/


pragma solidity ^0.4.18;

import "./EIP20Interface.sol";
import "./SafeMath.sol";


contract StandardToken is EIP20Interface {

    uint256 constant private MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }   
}

contract BikeToken is StandardToken {

    using SafeMath for uint;

    string public name = "Bike Token";
    string public symbol = "BIKE";
    uint public decimals = 6;
    address public founder = 0x0;
    bool public salesOpen = true;
    uint256 constant public PRICE = 314159;

    modifier isOpen() {
        require(salesOpen == true);
        _;
    }

    modifier onlyFounder() {
        require(msg.sender == founder);
        _;
    }

    function BikeToken(uint _initialAmount) public {
        founder = msg.sender;
        balances[founder] = _initialAmount;
    }

    function buyTokens() public payable isOpen {
        uint tokens = (msg.value.div(10 ** 13)).mul(PRICE);
        balances[msg.sender] = balances[msg.sender].add(tokens);
        totalSupply = totalSupply.add(tokens);
        require(founder.call.value(msg.value)());
    }

    function closeSales() public onlyFounder {
        salesOpen = false;
    }
}