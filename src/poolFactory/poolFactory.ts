import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  PoolCreated,
  BorrowTokenUpdated,
  CollateralTokenUpdated,
  CollectionPeriodUpdated,
  // ExtensionImplUpdated,
  LimitsUpdated,
  LiquidatorRewardFractionUpdated,
  LoanWithdrawalDurationUpdated,
  MarginCallDurationUpdated,
  MinBorrowFractionUpdated,
  NoStrategyUpdated,
  OwnershipTransferred,
  PoolCancelPenaltyMultipleUpdated,
  PoolInitSelectorUpdated,
  PoolLogicUpdated,
  PriceOracleUpdated,
  ProtocolFeeCollectorUpdated,
  ProtocolFeeFractionUpdated,
  RepaymentImplUpdated,
  SavingsAccountUpdated,
  StrategyRegistryUpdated,
  UserRegistryUpdated,
} from "../../generated/PoolFactory/PoolFactory";
import { Pool, PoolGlobalParam } from "../../generated/schema";

import { Pools as PoolTemplate } from "../../generated/templates";
import { Pool as PoolContract } from "../../generated/templates/Pools/Pool";

import { createPool, updatePoolTimeline } from "../poolHelpers";

export function handlePoolCreated(event: PoolCreated): void {
  let poolAddress = event.params.pool;
  PoolTemplate.create(poolAddress);
  createPool(poolAddress);

  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let poolInstance = PoolContract.bind(poolAddress);
  let poolConstants = poolInstance.poolConstants();

  updatePoolTimeline(id, event.params.pool, event.params.borrower, event.block.timestamp, "CREATED", poolConstants.value11);
}

export function handleBorrowTokenUpdated(event: BorrowTokenUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let borrowToken = event.params.borrowToken.toHexString();
  let support = event.params.isSupported;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  let borrowTokenList = poolGlobalParam.supportedBorrowTokens;
  let index = borrowTokenList.indexOf(borrowToken);

  if (support == true) {
    if (index == -1) {
      borrowTokenList.push(borrowToken);
      poolGlobalParam.supportedBorrowTokens = borrowTokenList;
    } else {
      // throw new Error("Borrow token already whitelisted");
    }
  } else {
    if (index == -1) {
      throw new Error("Borrow token is not suppored");
    } else {
      borrowTokenList.splice(index, 1);
      poolGlobalParam.supportedBorrowTokens = borrowTokenList;
    }
  }

  poolGlobalParam.save();
}

export function handleCollateralTokenUpdated(event: CollateralTokenUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let collateralToken = event.params.collateralToken.toHexString();
  let support = event.params.isSupported;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  let collateralTokenList = poolGlobalParam.supportedCollateralTokens;
  let index = collateralTokenList.indexOf(collateralToken);

  if (support == true) {
    if (index == -1) {
      collateralTokenList.push(collateralToken);
      poolGlobalParam.supportedCollateralTokens = collateralTokenList;
    } else {
      // throw new Error("Collateral token already whitelisted");
    }
  } else {
    if (index == -1) {
      throw new Error("Collateral token is not suppored");
    } else {
      collateralTokenList.splice(index, 1);
      poolGlobalParam.supportedCollateralTokens = collateralTokenList;
    }
  }

  poolGlobalParam.save();
}

export function handleCollectionPeriodUpdated(event: CollectionPeriodUpdated): void {
  let poolGlobalParam = new PoolGlobalParam("1") as PoolGlobalParam;
  let collectionPeriod = event.params.updatedCollectionPeriod;

  poolGlobalParam.collectionPeriod = collectionPeriod;
  poolGlobalParam.save();
}

// export function handleExtensionImplUpdated(event: ExtensionImplUpdated): void {}

export function handleLimitsUpdated(event: LimitsUpdated): void {}

export function handleLiquidatorRewardFractionUpdated(event: LiquidatorRewardFractionUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let liquidatorRewardFraction = event.params.updatedLiquidatorRewardFraction;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.liquidatorRewardFraction = liquidatorRewardFraction;
  poolGlobalParam.save();
}

export function handleLoanWithdrawalDurationUpdated(event: LoanWithdrawalDurationUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let loanWiithdrawalDuration = event.params.updatedLoanWithdrawalDuration;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.loanWithdrawalDuration = loanWiithdrawalDuration;
  poolGlobalParam.save();
}

export function handleMarginCallDurationUpdated(event: MarginCallDurationUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let marginCallDuration = event.params.updatedMarginCallDuration;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.marginCallDuration = marginCallDuration;
  poolGlobalParam.save();
}

export function handleMinBorrowFractionUpdated(event: MinBorrowFractionUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let minBorrowFraction = event.params.updatedMinBorrowFraction;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.minBorrowFraction = minBorrowFraction;
  poolGlobalParam.save();
}

export function handleNoStrategyUpdated(event: NoStrategyUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePoolCancelPenaltyMultipleUpdated(event: PoolCancelPenaltyMultipleUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let poolCancelPenalty = event.params.updatedPoolCancelPenaltyMultiple;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.poolCancelPenalty = poolCancelPenalty;
  poolGlobalParam.save();
}

export function handlePoolInitSelectorUpdated(event: PoolInitSelectorUpdated): void {}

export function handlePoolLogicUpdated(event: PoolLogicUpdated): void {}

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {}

export function handleProtocolFeeCollectorUpdated(event: ProtocolFeeCollectorUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let protocolFeeCollector = event.params.updatedProtocolFeeCollector.toHexString();

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.protocolFeeCollector = protocolFeeCollector;
  poolGlobalParam.save();
}

export function handleProtocolFeeFractionUpdated(event: ProtocolFeeFractionUpdated): void {
  let poolGlobalParam = PoolGlobalParam.load("1") as PoolGlobalParam;
  let protocolFee = event.params.updatedProtocolFee;

  if (poolGlobalParam) {
  } else {
    poolGlobalParam = new PoolGlobalParam("1");
  }

  poolGlobalParam.protocolFeeFraction = protocolFee;
  poolGlobalParam.save();
}

export function handleRepaymentImplUpdated(event: RepaymentImplUpdated): void {}

export function handleSavingsAccountUpdated(event: SavingsAccountUpdated): void {}

export function handleStrategyRegistryUpdated(event: StrategyRegistryUpdated): void {}

export function handleUserRegistryUpdated(event: UserRegistryUpdated): void {}
