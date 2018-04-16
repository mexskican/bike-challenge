const Bike = artifacts.require('./Bike.sol');
const BikeToken = artifacts.require('./BikeToken.sol');

contract('Bike', function(accounts) {

    let isException = function (error) {
        let strError = error.toString();
        return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
    };

	const ownerAddress = accounts[0];
    const renter1Address = accounts[1];
    const renter2Address = accounts[2];
    const gasAmount = 3000000;
    const initialHourlyCost = 600 * 10**6; // 600 BIKE tokens
    const initialBikeTokenSupply = 1000000 * 10**6; // 1M BIKE tokens

    it("It should let an User rent a Bike with Bike credits", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        const balance1Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(4800 * 10**6, balance1Renter1);
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeContract.addBike(15, {from: ownerAddress});
        await bikeContract.rentBike(15, 2, {from: renter1Address});
        const balance2Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(0 * 10**6, balance2Renter1);
        const bikeRented = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(15, bikeRented);
        await bikeContract.returnBike(15, renter1Address, {from: ownerAddress});
        const bikeReturned = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(bikeReturned, 0);
        const balance3Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(3600 * 10**6, balance3Renter1);
    });

    it("It should let an User transfer a rented Bike", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeTokenContract.transfer(renter2Address, 3600 * 10**6, {from: ownerAddress});
        await bikeTokenContract.approve(bikeContract.address, 3600 * 10**6, {from: renter2Address});
        await bikeContract.addBike(15, {from: ownerAddress});
        await bikeContract.rentBike(15, 2, {from: renter1Address});
        const bikeRented = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(15, bikeRented);
        await bikeContract.transferRentedBike(15, renter1Address, {from: renter2Address});
        const bikeRented2 = await bikeContract.getRentalBikeId(renter2Address);
        assert.equal(15, bikeRented2);
    });

    it("It should NOT let an User rent a Bike WITHOUT Bike credits", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        // The next line is missing therefor the User does not have any Bike credits
        // await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        const balance1Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(0, balance1Renter1);
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeContract.addBike(15, {from: ownerAddress});

        try {
            await bikeContract.rentBike(15, 2, {from: renter1Address});
        } catch (e) {
            assert(isException(e))
        }
    });

    it("It should NOT let an User rent a Bike WITHOUT allowing the Bike contract", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        const balance1Renter1 = await bikeTokenContract.balanceOf(renter1Address);
        assert.equal(4800 * 10**6, balance1Renter1);
        // The next line is missing therefor the User does not allow the Bike contract to transfer tokens
        // await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeContract.addBike(15, {from: ownerAddress});

        try {
            await bikeContract.rentBike(15, 2, {from: renter1Address});
        } catch (e) {
            assert(isException(e))
        }
    });

    it("It should NOT let an User rent an ALREADY rented Bike", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        await bikeTokenContract.transfer(renter2Address, 4800 * 10**6, {from: ownerAddress});
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter2Address});
        await bikeContract.addBike(15, {from: ownerAddress});
        await bikeContract.rentBike(15, 2, {from: renter1Address});
        const bikeRented = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(bikeRented, 15);
        try {
            await bikeContract.rentBike(15, 2, {from: renter2Address});
        } catch (e) {
           assert(isException(e))
        }
    });

    it("It should NOT let an User rent 2 Bikes at the same time", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 9600 * 10**6, {from: ownerAddress});
        await bikeTokenContract.approve(bikeContract.address, 9600 * 10**6, {from: renter1Address});
        await bikeContract.addBike(15, {from: ownerAddress});
        await bikeContract.addBike(16, {from: ownerAddress});
        await bikeContract.rentBike(15, 2, {from: renter1Address});
        const bikeRented = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(bikeRented, 15);
        try {
            await bikeContract.rentBike(16, 2, {from: renter1Address});
        } catch (e) {
            assert(isException(e))
        }
    });

    it("It should let the owner update the Hourly Cost", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeContract.updateHourlyCost(700 * 10**6, {from: ownerAddress});
        assert(700 * 10**6, bikeContract.hourlyCost);
    });

    it("It should NOT let an USER update the Hourly Cost", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        try {
            await bikeContract.updateHourlyCost(700 * 10**6, {from: renter1Address});
        } catch (e) {
            assert(isException(e))
        }
        assert(bikeContract.hourlyCost, 600 * 10**6);
    });

    it("It should NOT let an user rent a bike for less then an hour", async() => {
        const bikeTokenContract = await BikeToken.new(initialBikeTokenSupply, {from: ownerAddress, gas: gasAmount});
        const bikeContract = await Bike.new(initialHourlyCost, bikeTokenContract.address, {from: ownerAddress, gas: gasAmount});
        await bikeTokenContract.transfer(renter1Address, 4800 * 10**6, {from: ownerAddress});
        await bikeTokenContract.approve(bikeContract.address, 4800 * 10**6, {from: renter1Address});
        await bikeContract.addBike(15, {from: ownerAddress});
        await bikeContract.rentBike(15, 0, {from: renter1Address});
        const bikeRented = await bikeContract.getRentalBikeId(renter1Address);
        assert.equal(0, bikeRented);
    });
});
