const constants = require('../utils/constants.json')

const Controller = artifacts.require('UKTTokenController')

describe('Ownable', addresses => {
	
	let ControllerContract
	
	before(async () => {
		ControllerContract = await Controller.deployed()
	})
	
	beforeEach(async () => {
		await require('nanodelay')(100)
	})
	
	it('Should verify initial owner', async () => {
		
		const ownerAddress = await ControllerContract.owner.call()
		
		assert.equal(ownerAddress, constants.owner.address, 'Owners do not match')
	})
	
	it('Should not be able to call transferOwnership() if not owner', async () => {
		
		try {
		
			const tx = await ControllerContract.transferOwnership(
				constants.newOwner.address,
				{ from : constants.newOwner.address }
			)
			
			throw new Error('newOwner should not be able to call transferOwnership() function')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should set potential owner', async () => {
		
		const tx = await ControllerContract.transferOwnership(
			constants.newOwner.address,
			{ from : constants.owner.address }
		)
		
		const potentialOwnerAddress = await ControllerContract.potentialOwner.call()
		
		assert.equal(potentialOwnerAddress, constants.newOwner.address, 'Potential owner was not set')
	})
	
	it('Should not be able to confirm the ownership if not potential owner', async () => {
		
		try {
			
			const tx = await ControllerContract.confirmOwnership({
				from: constants.owner.address
			})
			
			throw new Error('Owner should not be able to confirm ownership')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should confirm ownership', async () => {
		
		const tx = await ControllerContract.confirmOwnership({
			from: constants.newOwner.address
		})
		
		const ownerAddress = await ControllerContract.owner.call()
		
		assert.equal(ownerAddress, constants.newOwner.address, 'Owner was not changed')
		
		const potentialOwnerAddress = await ControllerContract.potentialOwner.call()
		
		assert.equal(potentialOwnerAddress, 0, 'Potential owner was not deleted')
	})
	
	it('Should not be able to remove ownership if not owner', async () => {
		
		try {
			
			const tx = await ControllerContract.removeOwnership({
				from: constants.owner.address
			})
			
			throw new Error('Old owner should not be able to remove ownership')
			
		} catch (error) {
			assert.equal(error.message, 'VM Exception while processing transaction: revert')
		}
	})
	
	it('Should remove ownership', async () => {
		
		const tx = await ControllerContract.removeOwnership({
			from: constants.newOwner.address
		})
		
		const ownerAddress = await ControllerContract.owner.call()
		const potentialOwnerAddress = await ControllerContract.potentialOwner.call()
		
		assert.equal(ownerAddress, 0, 'Ownership was not deleted')
	})
	
})
