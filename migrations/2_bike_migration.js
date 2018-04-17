var Bike = artifacts.require("./Bike.sol");
var BikeToken = artifacts.require("./BikeToken.sol");

module.exports = function(deployer) {
	deployer.deploy(BikeToken, 1000000 * 10 ** 6).then(function() {
		return deployer.deploy(Bike, 600 * 10**6, BikeToken.address);
	});
};


