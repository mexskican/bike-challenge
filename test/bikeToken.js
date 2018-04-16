const BikeToken = artifacts.require('./BikeToken.sol');

contract('BikeToken', function(accounts) {

	const ownerAddress = accounts[0];
    const renter1Address = accounts[1];
    const renter2Address = accounts[2];
    const gasAmount = 3000000;
    const initialBikeTokenSupply = 1000000 * 10 ** 6; // 1M BIKE tokens

    it("It should let an User buy some Bike credits", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const initialOwnerBalance = web3.eth.getBalance(ownerAddress);
        await bikeTokenContract.buyTokens({from: renter1Address, value: 1 * 10 ** 18});
        const balance1Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(314159 * 10 ** 5, balance1Renter1);
        const finalOwnerBalance = web3.eth.getBalance(ownerAddress);
        assert.equal(initialOwnerBalance - (0 * 10 ** 18), finalOwnerBalance - (1 * 10 ** 18));
    });

    it("It should let an User transfer his credits", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const initialOwnerBalance = web3.eth.getBalance(ownerAddress);
        await bikeTokenContract.buyTokens({from: renter1Address, value: 1 * 10 ** 18});
        await bikeTokenContract.transfer(renter2Address, 14159 * 10 ** 5, {from: renter1Address});
        const balance1Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(300000 * 10 ** 5, balance1Renter1);
        const balance1Renter2 = await bikeTokenContract.balanceOf(renter2Address);
        assert.equal(14159 * 10 ** 5, balance1Renter2);
    });

});