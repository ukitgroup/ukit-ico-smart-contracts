require('./index.scss')

import $ from 'jquery'
import contract from 'truffle-contract'
import delay from 'nanodelay'

import constants from 'Utils/constants.json'

import UKTToken_Artifacts from 'Contracts/UKTToken.json'
import UKTTokenController_Artifacts from 'Contracts/UKTTokenController.json'
import UKTTokenVotingFactory_Artifacts from 'Contracts/UKTTokenVotingFactory.json'
import UKTTokenVoting_Artifacts from 'Contracts/UKTTokenVoting.json'

const UKTToken              = contract(UKTToken_Artifacts)
const UKTTokenController    = contract(UKTTokenController_Artifacts)
const UKTTokenVotingFactory = contract(UKTTokenVotingFactory_Artifacts)
const UKTTokenVoting        = contract(UKTTokenVoting_Artifacts)

function showWeb3Modal (content) {
	$('#MetamaskNotInjectedModal')
		.find('.js-metamask-not-injected-modal-content')
		.html(content)
		.end()
		.addClass('is-active')
		.show()
}

function hideWeb3Modal () {
	$('#MetamaskNotInjectedModal').hide()
}

const tplTokenHolder = ({idx = 0, address = '0x0', avBalance = 0, acBalance = 0}) => (
	`<tr data-idx="${idx}" class="js-token-holder">
		<th>${idx + 1}</th>
		<td>${address}</td>
		<td>${avBalance} UKT</td>
		<td>${acBalance} UKT</td>
		<td>
			<button
				class="button is-primary js-token-holder-distribute"
				${ ! avBalance && 'disabled'}
			>
				Distribute
			</button>
		</td>
	</tr>`
)

async function start () {
	hideWeb3Modal()
	
	let UKTToken_Instance
	let UKTTokenController_Instance
	let UKTTokenVotingFactory_Instance
	
	try {
		UKTToken.setProvider(web3.currentProvider)
		UKTTokenController.setProvider(web3.currentProvider)
		UKTTokenVotingFactory.setProvider(web3.currentProvider)
		UKTTokenVoting.setProvider(web3.currentProvider)
		
		UKTToken_Instance              = await UKTToken.deployed()
		UKTTokenController_Instance    = await UKTTokenController.deployed()
		UKTTokenVotingFactory_Instance = await UKTTokenVotingFactory.deployed()
	} catch (error) {
		showWeb3Modal(error.message)
	}
	
	window.UKTToken_Instance = UKTToken_Instance
	window.UKTTokenController_Instance = UKTTokenController_Instance
	window.UKTTokenVotingFactory_Instance = UKTTokenVotingFactory_Instance
	
	const balanceOf        = async (address) => (await UKTToken_Instance.balanceOf.call(address)).toNumber() / 10 ** 18
	const getTotalSupply   = async () => (await UKTToken_Instance.totalSupply.call()).toNumber() / 10 ** 18
	const getIcoAllocation = async () => await balanceOf(UKTTokenController_Instance.address)
	const distributeTokens = async (addresses, amounts) => await UKTTokenController_Instance.distribute(
		addresses, amounts, { from : web3.eth.accounts[0] }
	)
	const finalizeDistribution = async () => await UKTTokenController_Instance.finalize(
		{ from : web3.eth.accounts[0] }
	)
	
	const totalSupply = await getTotalSupply()
	const icoAllocation = await getIcoAllocation()
	
	const store = {
		totalSupply,
		icoAllocation,
		holders : await Promise.all([
					'0x1042f55c0413ad18df17908c71fb4a08dbf75203', // 0xf16fc0867e2fa44b1d4ad4b47bd67b3c6453c32a9d8044c9f4cd0cd302ed50b3
					'0x79e7cff79934068e8fb2a8664fe5027ef21ac2bb', // 0x80361b857f09837de373d87588b14bb6363349776e4d8d5c8fe5379c1d237738
					'0x89b7d70224c09106501e1a9ea135ba321624923a', // 0x3d2e71230b9f71b7291e1d26cf37c69121cec9e45691eb063534114dfb675a72
					'0x495af2efdad3503c43f0571cd0d2a65bf581edbd', // 0x0e34451c7c297da5491d4a41403e8f029c0a3a0714bb23593bc04e11d9a472ac
					'0x84ef1e392785dc0e5731a46e1e7445040f9b57b1', // 0x5fdaa9a9554f38fa7d24d6dfe3ee5251b8bb279c84fcb43410d3ddc999cd0373
					'0x2c44665ecfd3af1e954fe70b9d55d77fe8a723e0', // 0x8836faf5aa60d363f76fdb0650848c578cd2815be2a719e86d7ebae7eb5c3984
					'0xaaffd31cf8c36c0baa958c6bd7bf6e3677bc84aa', // 0x93c9ceb0cc5643e601dfa682bc567e955118273c3f9d08487189650364b3d412
					'0xeb477c5e72c3031e628f5ce5d7d29923ec71bd48', // 0x1cc267aa5fd8bf8c3dea09e76732ff2ef6c89618ddfa2612ff2535c5202fdaba
					'0xeeb462daa7f2645b43561c65c9348f8601d1542c', // 0x2ea2264ce6e057a3cda7e91aa9ed94975b58c4d64c0c10f4b54ab9a3c7a8d18a
					'0x3586394e67aad6003ccfb21ae2287412d1a0d3fd', // 0xb2fe585e7dbb0b393f3ae5d3bda1bfcbfbd2afbcf3511a5e805628a2373b942f
				].map(async (address, idx) => {
					const acBalance = await balanceOf(address)
					const avBalance = (! acBalance && icoAllocation) ? (idx + 1) * 10000 : 0
					return { address, avBalance, acBalance}
				}))
	}
	
	$('#UKTTokenController, #UKTTokenVotingFactory, #UKTTokenVoting').show()
	
	const UKTTokenControllerTokenHoldersTable = $('#UKTTokenController-token-holders-table')
	
	const renderTotalSupply   = async () => (
		$('#UKTTokenController-stat-total-sup')
			.text(store.totalSupply)
	)
	const renderIcoAllocation = async () => (
		$('#UKTTokenController-stat-ico-alloc')
			.text(store.icoAllocation)
	)
	const renderTokenHolders  = () => {
		UKTTokenControllerTokenHoldersTable.find('tbody').html(
			store.holders
				.map((holder, idx) => tplTokenHolder({ ...holder, idx }))
				.join()
		)
	}
	
	renderTokenHolders()
	renderTotalSupply()
	renderIcoAllocation()
	
	UKTTokenControllerTokenHoldersTable
		.find('.js-token-holders-distribute-all')
		.prop('disabled', ! store.holders.filter(h => h.avBalance > 0).length)
		.end()
		.find('.js-token-holders-distribute-finalize')
		.prop('disabled', ! store.icoAllocation)
	
	const processTokensDistribution = async (addresses, amounts) => {
		const result = await distributeTokens(addresses, amounts)
	
		console.info(result)
	
		if ( ! web3.toDecimal(result.receipt.status)) {
			throw Error(`Transaction ${result.tx} failed!`)
		}
		
		await delay(1000)
	}
	
	$('body')
		.on('click', '.js-token-holder-distribute:not(.is-loading)', async e => {
			e.preventDefault()
			
			const $btn    = $(e.target)
			const $holder = $btn.closest('.js-token-holder')
			const idx     = $holder.data('idx')
			
			$btn.addClass('is-loading')
			
			try {
				await processTokensDistribution(
					[ store.holders[idx].address ],
					[ store.holders[idx].avBalance ]
				)
				
				const avBalance = 0
				const acBalance = await balanceOf(store.holders[idx].address)
				
				store.holders[idx] = {
					...store.holders[idx], avBalance, acBalance
				}
				store.icoAllocation = await getIcoAllocation()
				
				renderTokenHolders()
				renderIcoAllocation()
			} catch (error) {
				console.error(error)
			} finally {
				$btn.removeClass('is-loading')
			}
		})
		.on('click', '.js-token-holders-distribute-all:not(.is-loading)', async e => {
			e.preventDefault()
			
			const $btn = $(e.target)
			const $btns = UKTTokenControllerTokenHoldersTable.find('.js-token-holder-distribute:not([disabled])')
			
			$btn.addClass('is-loading')
			$btns.prop('disabled', true)
			
			const filteredHolders = store.holders.filter(h => h.avBalance > 0)
			
			try {
				await processTokensDistribution(
					filteredHolders.map(h => h.address),
					filteredHolders.map(h => h.avBalance)
				)
				
				store.holders = await Promise.all(store.holders.map(async h => {
					const avBalance = 0
					const acBalance = await balanceOf(h.address)
					return { ...h, avBalance, acBalance }
				}))
				store.icoAllocation = await getIcoAllocation()
				
				renderTokenHolders()
				renderIcoAllocation()
				
				$btn.prop('disabled', true)
			} catch (error) {
				console.error(error)
				$btns.prop('disabled', false)
			} finally {
				$btn.removeClass('is-loading')
			}
		})
		.on('click', '.js-token-holders-distribute-finalize:not(.is-loading)', async e => {
			e.preventDefault()
			
			const $btn    = $(e.target)
			const $btnAll = UKTTokenControllerTokenHoldersTable.find('.js-token-holders-distribute-all:not([disabled])')
			const $btns   = UKTTokenControllerTokenHoldersTable.find('.js-token-holder-distribute:not([disabled])')
			
			$btn.addClass('is-loading')
			$btnAll.prop('disabled', true)
			$btns.prop('disabled', true)
			
			try {
				const result = await finalizeDistribution()
				
				console.info(result)
				
				await delay(1000)
				
				store.holders = await Promise.all(store.holders.map(async h => {
					return { ...h, avBalance : 0 }
				}))
				store.totalSupply = await getTotalSupply()
				store.icoAllocation = await getIcoAllocation()
				
				renderTokenHolders()
				renderTotalSupply()
				renderIcoAllocation()
				
				$btn.prop('disabled', true)
			} catch (error) {
				console.error(error)
				$btnAll.prop('disabled', false)
				$btns.prop('disabled', false)
			} finally {
				$btn.removeClass('is-loading')
			}
		})
}

if (typeof web3 === 'undefined') {
	
	showWeb3Modal('Can\'t find Metamask\'s web3 provider!<br>Please, <a href="#">connect it</a> and <a href="javascript:window.location.reload()">reload the page</a>!')
	throw Error('Can\'t find Metamask\'s web3 provider!')
	
} else if (web3.eth.accounts[0] !== constants.owner.address) {
	
	showWeb3Modal('Metamask\'s selected account is not the same as contracts owner!<br>Please, <a href="#">select right account</a> and <a href="javascript:window.location.reload()">reload the page</a>!')
	const selectAccountInterval = setInterval(() => {
		if (web3.eth.accounts[0] === constants.owner.address) {
			clearInterval(selectAccountInterval)
			start()
		}
	}, 300)
	
} else {
	
	start()
	
}
