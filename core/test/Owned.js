const { accounts, defaultSender, contract } = require('@openzeppelin/test-environment');
const { expectRevert, expectEvent, constants } = require('@openzeppelin/test-helpers');
//const { expect } = require('../../chai-local');
const { expect } = require('chai');

const { ZERO_ADDRESS } = constants;

const Owned = contract.fromArtifact('Owned');

describe('Owned', () => {
    let contract;
    const owner = defaultSender;
    const newOwner = accounts[1];

    beforeEach(async () => {
        contract = await Owned.new();
    });

    it('verifies the owner after construction', async () => {
        expect(await contract.owner.call()).to.be.eql(defaultSender);
    });

    it('verifies the new owner after ownership transfer', async () => {
        await contract.transferOwnership(newOwner);
        await contract.acceptOwnership({ from: newOwner });

        expect(await contract.owner.call()).to.be.eql(newOwner);
    });

    it('verifies that ownership transfer fires an OwnerUpdate event', async () => {
        await contract.transferOwnership(newOwner);
        const res = await contract.acceptOwnership({ from: newOwner });
        expectEvent(res, 'OwnerUpdate', { _prevOwner: owner, _newOwner: newOwner });
    });

    it('verifies that newOwner is cleared after ownership transfer', async () => {
        await contract.transferOwnership(newOwner);
        await contract.acceptOwnership({ from: newOwner });

        expect(await contract.newOwner.call()).to.be.eql(ZERO_ADDRESS);
    });

    it('verifies that no ownership transfer takes places before the new owner accepted it', async () => {
        await contract.transferOwnership(newOwner);

        expect(await contract.owner.call()).to.be.eql(owner);
    });

    it('verifies that only the owner can initiate ownership transfer', async () => {
        const nonOwner = accounts[2];

        await expectRevert(contract.transferOwnership(newOwner, { from: nonOwner }), 'ERR_ACCESS_DENIED');
    });

    it('verifies that the owner can cancel ownership transfer before the new owner accepted it', async () => {
        await contract.transferOwnership(newOwner);
        await contract.transferOwnership(ZERO_ADDRESS);

        expect(await contract.newOwner.call()).to.be.eql(ZERO_ADDRESS);
    });

    it("verifies that it's not possible to transfer ownership to the same owner", async () => {
        await expectRevert(contract.transferOwnership(owner), 'ERR_SAME_OWNER');
    });
});
