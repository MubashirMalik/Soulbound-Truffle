const SBT = artifacts.require("SBT");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract("SBT", accounts => {

    console.log(accounts);

    let instance = null;
    before(async () => {
        instance = await SBT.deployed()
    })

    const jobSBT = {
        id : 1,
        title: "Senior Dummy Engineer",
        startMonth: 1,
        startYear: 2020,
        endMonth: 12,
        endYear: 2021,
        isSet: 0
    }

    it("should not allow requesting SBT from a zero address (company)", async () => {
        try {
            await instance.requestSBT(ZERO_ADDRESS, jobSBT);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should not allow requesting SBT from an unregistered company", async () => {
        try {
            await instance.requestSBT(accounts[0], jobSBT);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should not allow unregistered company to check pending requests", async() => {
        try {
            await instance.getPendingSBTRequests();
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });
    
    it("should not allow unregistered company to respond to requests", async () => {
        try {
            await instance.respondToRequestSBT(accounts[3], true);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should register the caller as company", async () => {
        await instance.registerCompany();
    });

    it("should not allow registered company with no requests to respond", async () => {
        try {
            await instance.respondToRequestSBT(accounts[3], true);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should not allow re-registering a company", async () => {
        try {
            await instance.registerCompany();
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should request SBT from a registered company", async () => {
        await instance.requestSBT(accounts[0], jobSBT, {from: accounts[9]});
    });


    it("should not allow re-requesting a company for SBT", async () => {
        try {
            await instance.requestSBT(accounts[0], jobSBT, {from: accounts[9]});
            assert.fail("The transaction should have thrown an error");
        } 
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should not allow registered company to respond to invalid user", async () => {
        try {
            await instance.respondToRequestSBT(accounts[8], true);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should return pending requests for the caller (company)", async () => {
        // register another company
        await instance.registerCompany({from: accounts[1]});
        // request SBT from company 2
        await instance.requestSBT(accounts[1], jobSBT, {from: accounts[9]});
        await instance.requestSBT(accounts[1], jobSBT, {from: accounts[8]});
        await instance.requestSBT(accounts[1], jobSBT, {from: accounts[7]});

        let result = await instance.getPendingSBTRequests({from: accounts[1]});
        assert.equal(result[0].length, 3);
        assert.equal(result[1].length, 3);

        result = await instance.getPendingSBTRequests();
        assert.equal(result[1].length, 1);
    });

    it("should respond to a pending requests", async () => {

        let countIssued = await instance.getCountIssued({from: accounts[1]});
        assert.equal(countIssued.toNumber(), 1);

        // accept the offer
        await instance.respondToRequestSBT(accounts[7], true, {from: accounts[1]});
        
        let result = await instance.getPendingSBTRequests({from: accounts[1]});
        assert.equal(result[1].length, 2);

        countIssued = await instance.getCountIssued({from: accounts[1]});
        assert.equal(countIssued.toNumber(), 2);
        
        // reject the offer
        await instance.respondToRequestSBT(accounts[8], false, {from: accounts[1]});

        result = await instance.getPendingSBTRequests({from: accounts[1]});
        assert.equal(result[1].length, 1);

        countIssued = await instance.getCountIssued({from: accounts[1]});
        assert.equal(countIssued.toNumber(), 2);

        // accept the offer
        await instance.respondToRequestSBT(accounts[9], true, {from: accounts[1]});

        result = await instance.getPendingSBTRequests({from: accounts[1]});
        assert.equal(result[1].length, 0);

        countIssued = await instance.getCountIssued({from: accounts[1]});
        assert.equal(countIssued.toNumber(), 3);
    });

    it("should not allow verification of a zero address (company)", async () => {
        try {
            await instance.verifySBT(ZERO_ADDRESS, accounts[9], 1);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should not allow verification of a zero address (issuedTo)", async () => {
        try {
            await instance.verifySBT(accounts[0], ZERO_ADDRESS, 1);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should perform verification of a SBT", async () => { 
        let result = await instance.verifySBT(accounts[1], accounts[9], 1);
        assert.equal(result, false);

        result = await instance.verifySBT(accounts[1], accounts[9], 4);
        assert.equal(result, false);

        result = await instance.verifySBT(accounts[1], accounts[9], 3);
        assert.equal(result, true);
    });
});