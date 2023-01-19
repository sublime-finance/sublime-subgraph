import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Pool as PoolEntity, PoolTimeLine, BorrowerProfileAndPoolIndex, LenderContirbution } from "../generated/schema";
import { LiquiditySupplied, Pool as PoolContract } from "../generated/templates/Pools/Pool";

export function createPool(poolAddress: Address): void {
  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId);

  if (_pool) {
  } else {
    _pool = new PoolEntity(poolId);
  }

  let poolInstance = PoolContract.bind(poolAddress);

  let poolConstants = poolInstance.poolConstants();
  _pool.borrowerAddress = poolConstants.value4.toHexString();
  _pool.lenderAddresses = [];
  _pool.loanStartTime = poolConstants.value0;
  _pool.borrowAsset = poolConstants.value6.toHexString();
  _pool.collateralAsset = poolConstants.value5.toHexString();
  _pool.borrowRate = poolConstants.value9;
  _pool.borrowAmountRequested = poolConstants.value11;
  _pool.collateralShares = BigInt.fromString("0");
  _pool.idealCollateralRatio = poolConstants.value10;
  _pool.poolSavingsStrategy = poolConstants.value7.toHexString();

  _pool.amountBorrowed = BigInt.fromString("0");
  _pool.repaymentProgress = BigInt.fromString("0");
  _pool.nextPaymentAmount = BigInt.fromString("0");
  _pool.nextPaymentDeadline = BigInt.fromString("0");
  _pool.loanDurationCovered = BigInt.fromString("0");
  _pool.loanDuration = BigInt.fromString("0");
  _pool.poolStatus = "COLLECTION";

  _pool.save();

  // value4 is borrowerAddress
  checkBorrowerWalletAndPoolIndex(poolConstants.value4.toHexString(), poolId);
}

export function increaseCollateralShares(poolAddress: Address, newShares: BigInt): void {
  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  let existingShares = _pool.collateralShares as BigInt;
  existingShares = existingShares.plus(newShares);
  _pool.collateralShares = existingShares;
  _pool.save();
}

export function decreaseCollateralShares(poolAddress: Address, sharesWithdrawn: BigInt): void {
  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  let existingShares = _pool.collateralShares as BigInt;
  if (existingShares.gt(sharesWithdrawn)) {
    existingShares = existingShares.plus(sharesWithdrawn);
  } else {
    existingShares = BigInt.fromString("0");
  }
  _pool.collateralShares = existingShares;
  _pool.save();
}

export function updatePoolLenderDetailsOnLiquiditySupplied(event: LiquiditySupplied): void {
  let poolAddress = event.address;
  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  let existingLenders = _pool.lenderAddresses as string[];
  let newLender = event.params.lenderAddress.toHexString();

  if (existingLenders.includes(newLender)) {
  } else {
    existingLenders.push(newLender);
  }
  _pool.lenderAddresses = existingLenders;
  _pool.save();

  updateLenderContribution(event);
}

function updateLenderContribution(event: LiquiditySupplied): void {
  let poolAddress = event.address;
  let lenderAddress = event.params.lenderAddress;

  let id = poolAddress.toHexString() + "#" + lenderAddress.toHexString();
  let lenderContribution = LenderContirbution.load(id);
  if (lenderContribution) {
    let existingAmount = lenderContribution.amount;
    existingAmount = existingAmount.plus(event.params.amountSupplied);
  } else {
    lenderContribution = new LenderContirbution(id);
    lenderContribution.wallet = lenderAddress.toHexString();
    lenderContribution.lenderAddress = lenderAddress.toHexString();
    lenderContribution.pool = poolAddress.toHexString();
    lenderContribution.amount = event.params.amountSupplied;
  }
  lenderContribution.save();
}

export function updatePoolTimeline(
  pooltimelineId: string,
  poolAddress: Address,
  actor: Address,
  timestamp: BigInt,
  poolOperation: string,
  amount: BigInt
): void {
  let _poolTimeline = PoolTimeLine.load(pooltimelineId);
  if (_poolTimeline) {
  } else {
    _poolTimeline = new PoolTimeLine(pooltimelineId);
    _poolTimeline.pool = poolAddress.toHexString();
    _poolTimeline.actor = actor.toHexString();
    _poolTimeline.timestamp = timestamp;
    _poolTimeline.poolOperation = poolOperation;
    _poolTimeline.amount = amount;
  }
  _poolTimeline.save();
}

function checkBorrowerWalletAndPoolIndex(walletAddress: string, poolId: string): void {
  let id = walletAddress + "#" + poolId;
  let index = BorrowerProfileAndPoolIndex.load(id);
  if (index) {
  } else {
    index = new BorrowerProfileAndPoolIndex(id);
    index.pool = poolId;
    index.wallet = walletAddress;
    index.save();
  }
}
// pool entity
// borrowerAddress: String
// lenderAddresses: [String!]
// borrower: Borrowers @derivedFrom(field: "pool")
// lenders: [Lenders!] @derivedFrom(field: "pool")
// lenderPerPool: [LenderPerPool!]! @derivedFrom(field: "pool")
// loanStartTime: BigInt!
// borrowAsset: String!
// collateralAsset: String!
// borrowRate: BigInt!
// borrowAmountRequested: BigInt!
// collateralAmount: BigInt!
// idealCollateralRatio: BigInt!
// poolSavingsStrategy: String!

// # repayment details
// repaymentProgress: BigInt! # noOfRepaymentIntervals * repymentInterval
// nextPaymentAmount: BigInt!
// nextPaymentDeadline: BigInt! # next repayment deadline
// loanDurationCovered: BigInt!
// loanDuration: BigInt! # expected loan end time
// # Pool timeline events
// poolTimeLine: [PoolTimeLine!] @derivedFrom(field: "pool")
// poolStatus: LoanStatus!

// poolConstants
// uint64 loanStartTime; 0
// uint64 loanWithdrawalDeadline; 1
// uint64 noOfRepaymentIntervals; 2
// uint64 repaymentInterval; 3
// address borrower; 4
// address collateralAsset; 5
// address borrowAsset; 6
// address poolSavingsStrategy; 7
// address lenderVerifier; 8
// uint256 borrowRate; 9
// uint256 idealCollateralRatio; 10
// uint256 borrowAmountRequested; 11

// {
//   savingsAccount: '0x502Ff10373b3eb62cC3bD7a359B75415dffBD922',
//   strategyRegistry: '0x93D53283C2667f5E374FDE1edE6D8d18F4A41Ca1',
//   creditLines: '0xeE9f7388e776aEfAD75Fb5aFCd1825320259762B',
//   proxyAdmin: '0x03f484190bc6889B28739Af182D996df57B02CC9',
//   admin: '0x4813CB98f2322CFb9fbf2f2dAFe01297FD70D19e',
//   noYield: '0x1fb7d411C01311A181Dc5a46f39E9A89Ae86437f',
//   compoundYield: '0x1a04C2133Fc70Ec6e51e7d84c5ba8d265F69A6Cf',
//   verification: '0x39E1f5E5d4Fc5E5FDD85D3Cbaa2d45D674F1666a',
//   twitterVerifier: '0x6d9C92603d5054EC6AB8b651b339E555A671C04d',
//   adminVerifier: '0x8Deae56d6e1E712ce03b8484B4F5b8d9eab6E93f',
//   priceOracle: '0x10dF01258F32fb571B3A199Bb1f86e97103eBe54',
//   poolLogic: '0x367FE4925C507193ab0CD338eC2BE1486D5Ac176',
//   repaymentLogic: '0x2C6666b2a1B25A35125708E71456aC8B35db35f2',
//   poolFactory: '0x1771C23d2c6Bad2837A3d91524bC6A1e94b733Aa',
//   weth: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
//   usdc: '0xe22da380ee6B445bb8273C81944ADEB6E8450422',
//   beacon: '0x0746682e8D6f37488117a8f6B6B3c8e40A86A89e',
//   poolUtils: '0xfE17e673A3E5fa7BB1Eac2126d44b0F43Ca64C25',
//   creditLineUtils: '0x3FDCB634c1F595dAEc148a58aB2Da0c0fFAC6BcB',
//   savingsAccountEthUtils: '0xaD25cCa271c3a990c256F2a86A87f284c1cE51B0',
//   lenderPool: '0x4468530963e9925393A7BD530446D557C97ddc7A',
//   pooledCreditlines: '0x0068652D8E7AE9e02aB2c03DE428a7a1Fe7C9E11'
// }
