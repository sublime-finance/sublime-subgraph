import { PooledCreditLine as PooledCreditLineSchema, PooledCreditLineGlobalVariables, PoolTimeLine } from "../../generated/schema";
import {
  updatePooledCreditLineConstants,
  updatePooledCreditLineVariable,
  updatePooledCreditLineTimeline,
  updatePooledCreditLineStatus,
  updateActorArrayBalances,
} from "./helper";
import { updateLendingInfo } from "../LenderPool/helper";
import {
  BorrowedFromPooledCreditLine,
  CollateralDeposited,
  CollateralWithdrawn,
  CompletePooledCreditLineRepaid,
  PooledCreditLineAccepted,
  PooledCreditLineClosed,
  PooledCreditLineCancelled,
  PooledCreditLineLiquidated,
  PooledCreditLineRequested,
  PooledCreditLineTerminated,
  LimitsUpdated,
  PartialPooledCreditLineRepaid,
  ProtocolFeeCollectorUpdated,
  ProtocolFeeFractionUpdated,
  PooledCreditLine as PooledCreditLineContract,
} from "../../generated/PooledCreditLine/PooledCreditLine";
import { BIGINT_ZERO } from "../constants/constants";
import { Address } from "@graphprotocol/graph-ts";

export function handleBorrowedFromPooledCreditLine(event: BorrowedFromPooledCreditLine): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 4, event.params.borrowAmount, null);
  updateActorArrayBalances(pooledCreditLineId, event.params.borrowAmount, 4);
}

export function handleCollateralDeposited(event: CollateralDeposited): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 3, event.params.shares, event.params.strategy.toHexString());
  updateActorArrayBalances(pooledCreditLineId, event.params.shares, 3);
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 6, event.params.shares, null);
  updateActorArrayBalances(pooledCreditLineId, event.params.shares, 6);
}

export function handleCompletePooledCreditLineRepaid(event: CompletePooledCreditLineRepaid): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 5, event.params.repayAmount, null);
  updateActorArrayBalances(pooledCreditLineId, event.params.repayAmount, 5);
}

export function handlePooledCreditLineAccepted(event: PooledCreditLineAccepted): void {
  let pooledCreditLineInstance = PooledCreditLineContract.bind(event.address);
  let pooledCreditLineId = event.params.id.toString();
  let lenderPool = pooledCreditLineInstance.LENDER_POOL();
  updateLendingInfo(pooledCreditLineId, lenderPool);
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 2, null, null);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 2);
}

export function handlePooledCreditLineClosed(event: PooledCreditLineClosed): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 3, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 7, null, null);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 7);
}

export function handlePooledCreditLineCancelled(event: PooledCreditLineCancelled): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineStatus(event, pooledCreditLineId, 4);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 8, null, null);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 8);
}

export function handlePooledCreditLineTerminated(event: PooledCreditLineTerminated): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineStatus(event, pooledCreditLineId, 7);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 11, null, null);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 11);
}

export function handlePooledCreditLineLiquidated(event: PooledCreditLineLiquidated): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 5, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 12, null, null);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 12);
}

export function handlePooledCreditLineRequested(event: PooledCreditLineRequested): void {
  let pooledCreditLineInstance = PooledCreditLineContract.bind(event.address);
  let lenderPool = pooledCreditLineInstance.LENDER_POOL();
  let pooledCreditLineId = event.params.id.toString();
  let borrowerVerifier = event.params.borrowerVerifier.toHexString();
  updatePooledCreditLineConstants(pooledCreditLineId, event.address, event.block.timestamp, borrowerVerifier);
  updatePooledCreditLineVariable(pooledCreditLineId, 1, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 1, null, null);
  updateLendingInfo(pooledCreditLineId, lenderPool);
  updateActorArrayBalances(pooledCreditLineId, BIGINT_ZERO, 1);
}

// export function handleLimitsUpdated(event: LimitsUpdated): void {}

export function handlePartialPooledCreditLineRepaid(event: PartialPooledCreditLineRepaid): void {
  let pooledCreditLineId = event.params.id.toString();
  updatePooledCreditLineVariable(pooledCreditLineId, 2, event.address);
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 5, event.params.repayAmount, null);
  updateActorArrayBalances(pooledCreditLineId, event.params.repayAmount, 5);
}

export function handleProtocolFeeCollectorUpdated(event: ProtocolFeeCollectorUpdated): void {
  let pooledCreditLineGlobalVariables = PooledCreditLineGlobalVariables.load("1");
  if (pooledCreditLineGlobalVariables) {
  } else {
    pooledCreditLineGlobalVariables = new PooledCreditLineGlobalVariables("1");
  }
  pooledCreditLineGlobalVariables.protocolFeeCollector = event.params.updatedProtocolFeeCollector.toHexString();
  pooledCreditLineGlobalVariables.save();
}

export function handleProtocolFeeFractionUpdated(event: ProtocolFeeFractionUpdated): void {
  let pooledCreditLineGlobalVariables = PooledCreditLineGlobalVariables.load("1");
  if (pooledCreditLineGlobalVariables) {
  } else {
    pooledCreditLineGlobalVariables = new PooledCreditLineGlobalVariables("1");
  }
  pooledCreditLineGlobalVariables.protocolFeeFraction = event.params.updatedProtocolFee;
  pooledCreditLineGlobalVariables.save();
}
