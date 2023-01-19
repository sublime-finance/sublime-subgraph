import {
  // ExtensionRepaid,
  GracePenaltyRateUpdated,
  GracePenaltyRepaid,
  GracePeriodFractionUpdated,
  InterestRepaid,
  InterestRepaymentComplete,
  PoolFactoryUpdated,
  PrincipalRepaid,
  Repayments as RepaymentContract,
} from "../../generated/Repayments/Repayments";

import { updatePoolTimeline } from "../poolHelpers";
import { Pool as PoolEntity } from "../../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";

// export function handleExtensionRepaid(event: ExtensionRepaid): void {
//   let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
//   let poolAddress = event.params.poolID;

//   let poolId = poolAddress.toHexString();
//   let _pool = PoolEntity.load(poolId) as PoolEntity;

//   updatePoolTimeline(
//     id,
//     poolAddress,
//     Address.fromString(_pool.borrowerAddress as string),
//     event.block.timestamp,
//     "EXTENSION_REPAID",
//     event.params.repayAmount
//   );
//   updateRepaymentParams(poolAddress, event.address);
// }

export function handleGracePenaltyRateUpdated(event: GracePenaltyRateUpdated): void {}

export function handleGracePenaltyRepaid(event: GracePenaltyRepaid): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let poolAddress = event.params.poolID;

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;

  updatePoolTimeline(
    id,
    poolAddress,
    Address.fromString(_pool.borrowerAddress as string),
    event.block.timestamp,
    "GRACE_PENALTY_REPAID",
    event.params.repayAmount
  );
  updateRepaymentParams(poolAddress, event.address);
}

export function handleGracePeriodFractionUpdated(event: GracePeriodFractionUpdated): void {}

export function handleInterestRepaid(event: InterestRepaid): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let poolAddress = event.params.poolID;

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  updatePoolTimeline(
    id,
    poolAddress,
    Address.fromString(_pool.borrowerAddress as string),
    event.block.timestamp,
    "INTEREST_REPAID",
    event.params.repayAmount
  );
  updateRepaymentParams(poolAddress, event.address);
}

export function handleInterestRepaymentComplete(event: InterestRepaymentComplete): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let poolAddress = event.params.poolID;

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  updatePoolTimeline(
    id,
    poolAddress,
    Address.fromString(_pool.borrowerAddress as string),
    event.block.timestamp,
    "COMPLETE_INTEREST_REPAID",
    event.params.repayAmount
  );
  updateRepaymentParams(poolAddress, event.address);
}

export function handlePoolFactoryUpdated(event: PoolFactoryUpdated): void {}

export function handlePrincipalRepaid(event: PrincipalRepaid): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let poolAddress = event.params.poolID;

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  updatePoolTimeline(
    id,
    poolAddress,
    Address.fromString(_pool.borrowerAddress as string),
    event.block.timestamp,
    "PRINCIPLE_REPAID",
    event.params.repayAmount
  );
  updateRepaymentParams(poolAddress, event.address);
}

function updateRepaymentParams(poolAddress: Address, repaymentContractAddress: Address): void {
  let repaymentInstance = RepaymentContract.bind(repaymentContractAddress);
  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;

  let nextPaymentAmount = BigInt.fromString("0");
  let nextPaymentDeadline = BigInt.fromString("0");
  let _result1 = repaymentInstance.try_getInterestDueTillInstalmentDeadline(poolAddress);
  if (_result1.reverted) {
  } else {
    nextPaymentAmount = _result1.value;
  }
  let _result2 = repaymentInstance.try_getNextInstalmentDeadline(poolAddress);
  if (_result2.reverted) {
  } else {
    nextPaymentDeadline = _result2.value;
  }

  _pool.nextPaymentAmount = nextPaymentAmount;
  _pool.nextPaymentDeadline = nextPaymentDeadline;
  _pool.save();
}
