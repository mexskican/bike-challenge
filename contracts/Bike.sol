pragma solidity ^0.4.21;

import './Ownable.sol';
import './EIP20Interface.sol';
import './SafeMath.sol';

contract Bike is Ownable {

	using SafeMath for uint;

	uint public hourlyCost;
	EIP20Interface private bikeTokenInterface = EIP20Interface(address(0x0));

	struct BikeStruct {
		uint id;
		bool available;
		bool added;
	}

	struct Rental {
		uint bikeId;
		address renter;
		uint hoursRent;
		uint price;
		uint returnTime;
		bool renting;
	}

	mapping(uint => BikeStruct) public bikes;
	mapping(address => Rental) public rentals;

	event bikeAdded(uint _bikeId);
	event bikeRemoved(uint _bikeId);
	event bikeRented(uint _bikeId, address _renter, uint hoursRent);
	event bikeTransferred(uint _bikeId, address _previousRenter, address _newRenter);
	event bikeReturned(uint _bikeId, address _renter, bool _onTime);
	event newCost(uint _hourlyCost);

	modifier onlyRenter(uint _bikeId) {
		require(rentals[msg.sender].renting == true && rentals[msg.sender].bikeId == _bikeId);
		_;
	}

	modifier canTransfer(uint _bikeId, address _previousRenter) {
		require(rentals[_previousRenter].renting == true && rentals[_previousRenter].bikeId == _bikeId);
		_;
	}

	modifier onlyAvailable(uint _bikeId) {
		require(bikes[_bikeId].available == true && bikes[_bikeId].added == true);
		_;
	}

	modifier isNotAdded(uint _bikeId) {
		require(bikes[_bikeId].added == false);
		_;
	}

	modifier isNotRenting() {
		require(rentals[msg.sender].renting == false);
		_;
	}

	function Bike(uint _hourlyCost, address _tokenAddress) public {
		hourlyCost = _hourlyCost;
		bikeTokenInterface = EIP20Interface(_tokenAddress);
	}

	function setTokenAddress(address _bikeTokenAddress) public onlyOwner returns (bool) {
		bikeTokenInterface = EIP20Interface(_bikeTokenAddress);
		return true;
	}


	function updateHourlyCost(uint _newCost) public onlyOwner returns (bool success){
		hourlyCost = _newCost;
		emit newCost(_newCost);
		return true;
	}

	function addBike(uint _bikeId) public onlyOwner isNotAdded(_bikeId) returns (bool success) {
		if (_bikeId == 0) {
			return false;
		}
		bikes[_bikeId] = BikeStruct(_bikeId, true, true);
		emit bikeAdded(_bikeId);
		return true;
	}

	function removeBike(uint _bikeId) public onlyOwner onlyAvailable(_bikeId) returns (bool success) {
		delete bikes[_bikeId];
		emit bikeRemoved(_bikeId);
		return true;
	}

	function rentBike(uint _bikeId, uint _hoursRent) public onlyAvailable(_bikeId) isNotRenting returns (bool success) {
		if (_hoursRent < 1 || _hoursRent > 24) {
			return false;
		}
		uint returnTime = now.add(_hoursRent.mul(1 hours));
		uint price = _hoursRent.mul(hourlyCost);
		rentals[msg.sender] = Rental(_bikeId, msg.sender, _hoursRent, price, returnTime, true);
		bikes[_bikeId].available = false;
		require(bikeTokenInterface.transferFrom(msg.sender, address(this), price.mul(4)));
		emit bikeRented(_bikeId, msg.sender, _hoursRent);
		return true;
	}

	function transferRentedBike(uint _bikeId, address _previousRenter) public canTransfer(_bikeId, _previousRenter) isNotRenting returns (bool success) {
		uint hoursRent = rentals[msg.sender].hoursRent;
		uint price = rentals[msg.sender].price;
		uint returnTime = rentals[msg.sender].returnTime;
		rentals[msg.sender] = Rental(_bikeId, msg.sender, hoursRent, price, returnTime, true);
		delete rentals[_previousRenter];
		require(bikeTokenInterface.transferFrom(msg.sender, _previousRenter, price.mul(3)));
		emit bikeTransferred(_bikeId, _previousRenter, msg.sender);
		return true;
	}

	function returnBike(uint _bikeId, address _renter) public onlyOwner returns (bool){
		if(now < rentals[_renter].returnTime) {
			rentals[_renter].renting = false;
			bikes[_bikeId].available = true;
			uint price = rentals[_renter].price;
			delete rentals[_renter];
			require(bikeTokenInterface.transfer(_renter, price.mul(3)));
			emit bikeReturned(_bikeId, _renter, true);
			return true;
		} else {
			rentals[_renter].renting = false;
			bikes[_bikeId].available = true;
			delete rentals[_renter];
			emit bikeReturned(_bikeId, _renter, false);
			return false;
		}
	}

	function transferFunds(uint _balance) public onlyOwner returns (bool) {
		require(bikeTokenInterface.transfer(owner, _balance));
		return true;
	}

	function getRentalBikeId(address _renter) public view returns (uint) {
		if(rentals[_renter].renting == true) {
			return rentals[_renter].bikeId;
		} else {
			return 0;
		}
	}

	function getReturnTime(address _renter) public view returns (uint) {
		if(rentals[_renter].renting == true) {
			return rentals[_renter].returnTime;
		} else {
			return 0;
		}
	}

	function bikeIsAvailable(uint _bikeId) public view returns (bool) {
		return bikes[_bikeId].available;
	}
}
