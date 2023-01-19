import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  CreditLine as CreditLineSchema,
  CreditLineGlobalParam,
  CreditLineTimeline,
  walletLenderCreditLineIndex,
  walletBorrowreCreditLineIndex,
} from "../generated/schema";

import {
  BorrowedFromCreditLine,
  BorrowLimitUpdated,
  CompleteCreditLineRepaid,
  CreditLineAccepted,
  CreditLineClosed,
  CreditLineCancelled,
  CreditLineLiquidated,
  CreditLineRequested,
  CreditLineReset,
  LiquidationRewardFractionUpdated,
  OwnershipTransferred,
  PartialCreditLineRepaid,
  ProtocolFeeCollectorUpdated,
  ProtocolFeeFractionUpdated,
  CollateralDeposited,
  CollateralWithdrawn,
  CreditLine as CreditLineContract,
} from "../generated/CreditLine/CreditLine";

import { getCreditLineOperation, getCreditLineStatus, UpdateUserBalanceCL, UpdateBorrowerBalanceCL, UpdateLenderBalanceCL } from "./helper";
import { BIGINT_ZERO } from "./constants/constants";

export function handleBorrowedFromCreditLine(event: BorrowedFromCreditLine): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 4, event.params.borrowAmount, null, null);
  updateActorArrayBalances(creditLineId, event.params.borrowAmount, 4);
}

export function handleCompleteCreditLineRepaid(event: CompleteCreditLineRepaid): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 5, event.params.repayAmount, null, null);
  updateActorArrayBalances(creditLineId, event.params.repayAmount, 5);
}

export function handleCreditLineAccepted(event: CreditLineAccepted): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 2, null, null, null);
  updateActorArrayBalances(creditLineId, BIGINT_ZERO, 2);
}

export function handleCreditLineClosed(event: CreditLineClosed): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 3, event.address);
  updateCreditLineTimeline(event, creditLineId, 7, null, null, null);
  updateActorArrayBalances(creditLineId, BIGINT_ZERO, 7);
}

export function handleCreditLineCancelled(event: CreditLineCancelled): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineStatus(creditLineId, 4);
  updateCreditLineTimeline(event, creditLineId, 8, null, null, null);
  updateActorArrayBalances(creditLineId, BIGINT_ZERO, 8);
}

export function handleCreditLineLiquidated(event: CreditLineLiquidated): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 5, event.address);
  updateCreditLineTimeline(event, creditLineId, 10, null, null, null);
  updateActorArrayBalances(creditLineId, BIGINT_ZERO, 10);
}

export function handleCollateralDeposited(event: CollateralDeposited): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 3, event.params.shares, event.params.strategy.toHexString(), null);
  updateActorArrayBalances(creditLineId, event.params.shares, 3);
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 6, event.params.shares, null, null);
  updateActorArrayBalances(creditLineId, event.params.shares, 6);
}

export function handleCreditLineRequested(event: CreditLineRequested): void {
  let creditLineId = event.params.id.toString();
  let creditLine = CreditLineSchema.load(creditLineId);

  let borrower = event.params.borrower.toHexString();
  let lender = event.params.lender.toHexString();

  checkWalletLenderCreditLineMapping(lender, creditLineId);
  checkWalletBorrowerCreditLineMapping(borrower, creditLineId);

  if (creditLine) {
  } else {
    updateCreditLineTimeline(event, creditLineId, 1, null, null, null);
    updateCreditLineConstant(creditLineId, event.address, event.block.timestamp);
    updateCreditLineVariable(creditLineId, 1, event.address);
    updateActorArrayBalances(creditLineId, BIGINT_ZERO, 1);
  }
}

export function handleCreditLineReset(event: CreditLineReset): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 9, null, null, null);
  updateActorArrayBalances(creditLineId, BIGINT_ZERO, 9);
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePartialCreditLineRepaid(event: PartialCreditLineRepaid): void {
  let creditLineId = event.params.id.toString();
  updateCreditLineVariable(creditLineId, 2, event.address);
  updateCreditLineTimeline(event, creditLineId, 5, event.params.repayAmount, null, null);
  updateActorArrayBalances(creditLineId, event.params.repayAmount, 5);
}

export function handleBorrowLimitUpdated(event: BorrowLimitUpdated): void {
  let creditLineId = event.params.id.toString();

  let creditLine = CreditLineSchema.load(creditLineId);
  if (!creditLine) {
    creditLine = new CreditLineSchema(creditLineId);
  }
  creditLine.borrowLimit = event.params.updatedBorrowLimit;
}

export function handleLiquidationRewardFractionUpdated(event: LiquidationRewardFractionUpdated): void {
  let creditLineGlobalParam = CreditLineGlobalParam.load("1");
  if (creditLineGlobalParam) {
  } else {
    creditLineGlobalParam = new CreditLineGlobalParam("1");
  }
  creditLineGlobalParam.liquidationRewardFraction = event.params.liquidatorRewardFraction;
  creditLineGlobalParam.save();
}

export function handleProtocolFeeCollectorUpdated(event: ProtocolFeeCollectorUpdated): void {
  let creditLineGlobalParam = CreditLineGlobalParam.load("1");
  if (creditLineGlobalParam) {
  } else {
    creditLineGlobalParam = new CreditLineGlobalParam("1");
  }
  creditLineGlobalParam.protocolFeeCollector = event.params.updatedProtocolFeeCollector.toHexString();
  creditLineGlobalParam.save();
}

export function handleProtocolFeeFractionUpdated(event: ProtocolFeeFractionUpdated): void {
  let creditLineGlobalParam = CreditLineGlobalParam.load("1");
  if (creditLineGlobalParam) {
  } else {
    creditLineGlobalParam = new CreditLineGlobalParam("1");
  }
  creditLineGlobalParam.protocolFeeFraction = event.params.updatedProtocolFee;
  creditLineGlobalParam.save();
}

// bool autoLiquidation; //0
// bool requestByLender; //1
// uint128 borrowLimit; //2
// uint128 borrowRate; //3
// uint256 idealCollateralRatio; //4
// address lender; //5
// address borrower; //6
// address borrowAsset; //7
// address collateralAsset; //8

function updateCreditLineConstant(creditLineId: string, contractAddress: Address, createdAt: BigInt): void {
  let creditLineInstance = CreditLineContract.bind(contractAddress);
  let creditLineNum = BigInt.fromString(creditLineId);

  let creditLine = CreditLineSchema.load(creditLineId);
  if (!creditLine) {
    creditLine = new CreditLineSchema(creditLineId);
  }
  let _tempConstants = creditLineInstance.creditLineConstants(creditLineNum);
  creditLine.lender = _tempConstants.value5.toHexString();
  creditLine.borrower = _tempConstants.value6.toHexString();

  creditLine.borrowLimit = _tempConstants.value2;
  creditLine.idealCollateralRatio = _tempConstants.value4;
  creditLine.borrowRate = _tempConstants.value3;
  creditLine.borrowAsset = _tempConstants.value7.toHexString();
  creditLine.collateralAsset = _tempConstants.value9.toHexString();
  creditLine.autoLiquidation = _tempConstants.value0;
  creditLine.requestByLender = _tempConstants.value1;
  creditLine.borrowAssetStrategy = _tempConstants.value8.toHexString();
  creditLine.collateralAssetStrategy = _tempConstants.value10.toHexString();
  creditLine.createdAt = createdAt;
  creditLine.save();
}

function updateCreditLineVariable(creditLineId: string, creditLineStatusCode: i32, contractAddress: Address): void {
  let creditLineInstance = CreditLineContract.bind(contractAddress);
  let creditLineNum = BigInt.fromString(creditLineId);

  let creditLine = CreditLineSchema.load(creditLineId);
  if (!creditLine) {
    creditLine = new CreditLineSchema(creditLineId);
  }
  let _tempVariables = creditLineInstance.creditLineVariables(creditLineNum);
  let _collateralshares = creditLineInstance.collateralShareInStrategy(creditLineNum);
  creditLine.status = getCreditLineStatus(creditLineStatusCode);
  creditLine.principal = _tempVariables.value1;
  creditLine.totalInterestRepaid = _tempVariables.value2;
  creditLine.lastPrincipalUpdateTime = _tempVariables.value3;
  creditLine.interestAccruedTillLastPrincipalUpdate = _tempVariables.value4;
  creditLine.collateralShareInStrategy = _collateralshares;
  creditLine.save();
  updateUserBalances(creditLineId, creditLineStatusCode);
}

function updateCreditLineStatus(creditLineId: string, creditLineStatusCode: i32): void {
  let creditLine = CreditLineSchema.load(creditLineId) as CreditLineSchema;
  creditLine.status = getCreditLineStatus(creditLineStatusCode);
  updateUserBalances(creditLineId, creditLineStatusCode);

  creditLine.save();
}

function updateCreditLineTimeline(
  event: ethereum.Event,
  creditLineId: string,
  creditLineOperation: i32,
  amount: BigInt | null,
  strategy: string | null,
  liquidator: string | null
): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let creditLineTimeline = CreditLineTimeline.load(id);
  if (creditLineTimeline) {
  } else {
    creditLineTimeline = new CreditLineTimeline(id);
    creditLineTimeline.creditLine = creditLineId;
    creditLineTimeline.timestamp = event.block.timestamp;
    creditLineTimeline.creditLineOperation = getCreditLineOperation(creditLineOperation);
    creditLineTimeline.amount = amount;
    creditLineTimeline.strategy = strategy;
    creditLineTimeline.liquidator = liquidator;
    creditLineTimeline.save();
  }
}

function checkWalletLenderCreditLineMapping(walletAddress: string, creditLineId: string): void {
  let id = walletAddress + "#" + creditLineId;
  let index = walletLenderCreditLineIndex.load(id);
  if (index) {
  } else {
    index = new walletLenderCreditLineIndex(id);
    index.creditLine = creditLineId;
    index.wallet = walletAddress;
    index.save();
  }
}

function checkWalletBorrowerCreditLineMapping(walletAddress: string, creditLineId: string): void {
  let id = walletAddress + "#" + creditLineId;
  let index = walletBorrowreCreditLineIndex.load(id);
  if (index) {
  } else {
    index = new walletBorrowreCreditLineIndex(id);
    index.creditLine = creditLineId;
    index.wallet = walletAddress;
    index.save();
  }
}

function updateUserBalances(creditLineId: string, creditLineStatusCode: i32): void {
  let creditLine = CreditLineSchema.load(creditLineId);
  if (!creditLine) {
    creditLine = new CreditLineSchema(creditLineId);
  }
  let _lender = creditLine.lender;
  let _borrower = creditLine.borrower;

  // Adding lender and borrower balances
  UpdateUserBalanceCL(_lender, creditLineId, creditLineStatusCode, "LENDER");
  UpdateUserBalanceCL(_borrower, creditLineId, creditLineStatusCode, "BORROWER");
}

function updateActorArrayBalances(creditLineId: string, amount: BigInt, creditLineOperation: i32): void {
  let creditLine = CreditLineSchema.load(creditLineId);
  if (!creditLine) {
    creditLine = new CreditLineSchema(creditLineId);
  }
  let _lender = creditLine.lender;
  let _borrower = creditLine.borrower;
  let _borrowAsset = creditLine.borrowAsset;
  let _collateralAsset = creditLine.collateralAsset;
  let _borrowStrategy = creditLine.borrowAssetStrategy;
  let _collateralStrategy = creditLine.collateralAssetStrategy;

  UpdateBorrowerBalanceCL(_borrower, _borrowAsset, _borrowStrategy, creditLineId, amount, creditLineOperation);
  UpdateBorrowerBalanceCL(_borrower, _collateralAsset, _collateralStrategy, creditLineId, amount, creditLineOperation);
  UpdateLenderBalanceCL(_lender, _borrowAsset, _borrowStrategy, creditLineId, amount, creditLineOperation);
}

/* ------------------ constants -------------------*/

// address lender;
// address borrower;
// uint256 borrowLimit;
// uint256 idealCollateralRatio;
// uint256 borrowRate;
// address borrowAsset;
// address collateralAsset;
// bool autoLiquidation;
// bool requestByLender;

/* ------------------ variables -------------------*/

// CreditLineStatus status;
// uint256 principal;
// uint256 totalInterestRepaid;
// uint256 lastPrincipalUpdateTime;
// uint256 interestAccruedTillLastPrincipalUpdate;
// uint256 collateralAmount;
