import { Address, BigInt, ethereum, store } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../constants/constants";
import { PooledCreditLine as PooledCreditLineContract } from "../../generated/PooledCreditLine/PooledCreditLine";
import { LenderPool as LenderPoolContract } from "../../generated/LenderPool/LenderPool";
import {
  PooledCreditLine as PooledCreditLineSchema,
  LenderPool as LenderPoolSchema,
  LenderPerLenderPool,
  verifier,
  PooledCreditLineTimeLine,
  UserProfile,
  LenderSharesBalancePCL,
} from "../../generated/schema";
import { UpdateUserBalancePCL, UpdateLenderBalancePCL, getLenderBalancePCL } from "../PooledCreditLine/helper";

export function updateLendingInfo(pooledCreditLineId: string, contractAddress: Address): void {
  let lenderPoolInstance = LenderPoolContract.bind(contractAddress);
  let pooledCreditLineNum = BigInt.fromString(pooledCreditLineId);
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;

  let lenderPool = LenderPoolSchema.load(pooledCreditLineId);
  if (!lenderPool) {
    lenderPool = new LenderPoolSchema(pooledCreditLineId);
  }
  let _lendingInfo = lenderPoolInstance.pooledCLConstants(pooledCreditLineNum);
  let _lendingVariables = lenderPoolInstance.pooledCLVariables(pooledCreditLineNum);

  let pooledCreditLineContractAddress = lenderPoolInstance.POOLED_CREDIT_LINE();
  let pooledCreditLineContract = PooledCreditLineContract.bind(pooledCreditLineContractAddress);
  let collateralAsset = pooledCreditLineContract.pooledCreditLineConstants(pooledCreditLineNum).value5.toHexString();

  lenderPool.pooledCreditLine = pooledCreditLineId;
  lenderPool.borrowAsset = _lendingInfo.value1.toHexString();
  lenderPool.collateralAsset = collateralAsset;
  lenderPool.borrowLimit = _lendingInfo.value3;
  lenderPool.borrowAssetStrategy = _lendingInfo.value6.toHexString();

  let _minBorrowAmount = _lendingInfo.value4;
  if (_minBorrowAmount > BIGINT_ZERO) {
    lenderPool.minBorrowAmount = _lendingInfo.value4;
    pooledCreditLine.minBorrowAmount = lenderPool.minBorrowAmount;
    lenderPool.startTime = _lendingInfo.value0;
  }

  let verifierProfile = verifier.load(_lendingInfo.value5.toHexString()) as verifier;
  lenderPool.verifier = verifierProfile.id;

  lenderPool.sharesHeld = _lendingVariables.value0;
  lenderPool.borrowerInterestShares = _lendingVariables.value1;
  lenderPool.borrowerInterestSharesWithdrawn = _lendingVariables.value2;
  lenderPool.yieldInterestWithdrawnShares = _lendingVariables.value3;
  lenderPool.collateralHeld = _lendingVariables.value4;
  lenderPool.areTokensTransferable = _lendingInfo.value7;

  pooledCreditLine.lenderVerifier = lenderPool.verifier;
  pooledCreditLine.borrowLimit = lenderPool.borrowLimit;

  lenderPool.save();
  pooledCreditLine.save();
}

export function updateLenderInfo(
  contractAddress: Address,
  pooledCreditLineId: string,
  lenderAddress: Address,
  amount: BigInt,
  shares: BigInt,
  interest: BigInt,
  action: String
): void {
  let lender = lenderAddress.toHexString();
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;
  let lenderPool = LenderPoolSchema.load(pooledCreditLineId) as LenderPoolSchema;

  let lenderId = lender + "#" + pooledCreditLine.id;
  let lenderPerPool = LenderPerLenderPool.load(lenderId);
  if (!lenderPerPool) {
    lenderPerPool = new LenderPerLenderPool(lenderId);
    lenderPerPool.amountLent = BIGINT_ZERO;
    lenderPerPool.amountWithdrawn = BIGINT_ZERO;
    lenderPerPool.sharesWithdrawn = BIGINT_ZERO;
    lenderPerPool.interestWithdrawn = BIGINT_ZERO;
  }

  let lenderProfile = UserProfile.load(lender) as UserProfile;
  lenderPerPool.lender = lenderProfile.id;
  lenderPerPool.lenderPool = lenderPool.id;
  lenderPerPool.strategy = lenderPool.borrowAssetStrategy;
  lenderPerPool.borrowerInterestSharesWithdrawn = lenderPool.borrowerInterestSharesWithdrawn;
  lenderPerPool.yieldInterestWithdrawnShares = lenderPool.yieldInterestWithdrawnShares;

  if (action == "Lend") {
    lenderPerPool.amountLent = lenderPerPool.amountLent.plus(amount);
    pooledCreditLine.totalLentAmount = pooledCreditLine.totalLentAmount.plus(amount);
  } else if (action == "Withdraw") {
    lenderPerPool.amountWithdrawn = lenderPerPool.amountWithdrawn.plus(amount);
    lenderPerPool.amountLent = lenderPerPool.amountLent.minus(amount);
    pooledCreditLine.totalLentAmount = pooledCreditLine.totalLentAmount.minus(amount);
    lenderPerPool.sharesWithdrawn = lenderPerPool.sharesWithdrawn.plus(shares);
    lenderPerPool.interestWithdrawn = lenderPerPool.interestWithdrawn.plus(interest);
  } else if (action == "Withdraw_collateral") {
    lenderPerPool.collateralAmountWithdrawn = lenderPerPool.collateralAmountWithdrawn.plus(amount);
  }

  let lenderPoolInstance = LenderPoolContract.bind(contractAddress);
  let pooledCreditLineNum = BigInt.fromString(pooledCreditLineId);
  lenderPerPool.lenderBalance = lenderPoolInstance.balanceOf(lenderAddress, pooledCreditLineNum);

  let pooledCreditLineStatusCode = getPooledCreditLineStatusCode(pooledCreditLine.status);
  lenderPerPool.lenderAddress = lender;
  lenderPerPool.save();
  pooledCreditLine.save();
  UpdateUserBalancePCL(lender, pooledCreditLineId, pooledCreditLineStatusCode, "LENDER");
}

export function updateLenderBalancePerLenderPool(
  lenderAddress: Address,
  receiverAddress: Address,
  pooledCreditLineId: string,
  amount: BigInt
): void {
  let lender = lenderAddress.toHexString();
  let receiver = receiverAddress.toHexString();

  // Should not execute for zero Address
  if (receiver == BIGINT_ZERO.toHexString()) {
    return;
  }

  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;

  let receiverId = receiver + "#" + pooledCreditLine.id;
  let newLenderPerPool = LenderPerLenderPool.load(receiverId);
  if (!newLenderPerPool) {
    newLenderPerPool = new LenderPerLenderPool(receiverId);
    newLenderPerPool.amountLent = BIGINT_ZERO;
    newLenderPerPool.amountWithdrawn = BIGINT_ZERO;
    newLenderPerPool.sharesWithdrawn = BIGINT_ZERO;
    newLenderPerPool.interestWithdrawn = BIGINT_ZERO;
  }
  newLenderPerPool.lenderBalance = newLenderPerPool.lenderBalance.plus(amount);

  let lenderId = lender + "#" + pooledCreditLine.id;
  let lenderPerPool = LenderPerLenderPool.load(lenderId);

  if (lenderPerPool) {
    lenderPerPool.lenderBalance = lenderPerPool.lenderBalance.minus(amount);
    // if (lenderPerPool.lenderBalance == BIGINT_ZERO) {
    //   // Setting new lender with old lender stats
    //   newLenderPerPool.amountLent = lenderPerPool.amountLent.minus(lenderPerPool.amountWithdrawn);

    //   // Deleting old lender stats
    //   store.remove("LenderPerLenderPool", lenderPerPool.id);
    // }
  }
  newLenderPerPool.save();
}

export function updateLenderBalances(lenderAddress: Address, pooledCreditLineId: string): void {
  let lender = lenderAddress.toHexString();
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;
  let lenderId = lender + "#" + pooledCreditLine.id;
  let lenderPerPool = LenderPerLenderPool.load(lenderId) as LenderPerLenderPool;

  let borrowAsset = pooledCreditLine.borrowAsset;
  let lenderStrategy = pooledCreditLine.lenderStrategy;

  let lenderBalancePCL = getLenderBalancePCL(lender, borrowAsset, lenderStrategy);
  lenderBalancePCL.amountLent = lenderPerPool.amountLent;
  lenderBalancePCL.amountWithdrawn = lenderPerPool.amountWithdrawn;
  lenderBalancePCL.sharesWithdrawn = lenderPerPool.sharesWithdrawn;
  lenderBalancePCL.interestWithdrawn = lenderPerPool.interestWithdrawn;
  lenderBalancePCL.save();

  UpdateLenderBalancePCL(lender, borrowAsset, lenderStrategy, pooledCreditLineId);
}

export function getPooledCreditLineStatusCode(status: string): i32 {
  let value: i32;
  if (status == "NOT_CREATED") {
    return (value = 0);
  } else if (status == "REQUESTED") {
    return (value = 1);
  } else if (status == "ACTIVE") {
    return (value = 2);
  } else if (status == "CLOSED") {
    return (value = 3);
  } else if (status == "CANCELLED") {
    return (value = 4);
  } else if (status == "LIQUIDATED") {
    return (value = 5);
  } else {
    return (value = 6);
  }
}
