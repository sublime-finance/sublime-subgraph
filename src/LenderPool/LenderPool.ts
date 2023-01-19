import { PooledCreditLine as PooledCreditLineSchema, PooledCreditLineGlobalVariables } from "../../generated/schema";
import { BIGINT_ZERO } from "../constants/constants";
import { updateLendingInfo, updateLenderInfo, updateLenderBalances, updateLenderBalancePerLenderPool } from "./helper";
import { updatePooledCreditLineTimeline } from "../PooledCreditLine/helper";
import {
  ApprovalForAll,
  InterestWithdrawn,
  Lend,
  Liquidated,
  LiquidationWithdrawn,
  TransferBatch,
  TransferSingle,
  URI,
  WithdrawLiquidity,
  WithdrawLiquidityOnCancel,
  LenderPool as LenderPoolContract,
} from "../../generated/LenderPool/LenderPool";

export function handleApprovalForAll(event: ApprovalForAll): void {
  // let account = event.params.account;
  // let appoved = event.params.approved;
  // let operator = event.params.operator;
}

export function handleInterestWithdrawn(event: InterestWithdrawn): void {
  let pooledCreditLineId = event.params.id.toString();
  let lenderAddress = event.params.user;
  let shares = event.params.shares;
  updateLendingInfo(pooledCreditLineId, event.address);
  updateLenderInfo(event.address, pooledCreditLineId, lenderAddress, BIGINT_ZERO, BIGINT_ZERO, shares, "Withdraw");
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 14, shares, null);
  updateLenderBalances(lenderAddress, pooledCreditLineId);
}

export function handleLend(event: Lend): void {
  let pooledCreditLineId = event.params.id.toString();
  let lenderAddress = event.params.user;
  let amount = event.params.amount;
  updateLendingInfo(pooledCreditLineId, event.address);
  updateLenderInfo(event.address, pooledCreditLineId, lenderAddress, amount, BIGINT_ZERO, BIGINT_ZERO, "Lend");
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 13, amount, null);
  updateLenderBalances(lenderAddress, pooledCreditLineId);
}

export function handleLiquidated(event: Liquidated): void {
  let pooledCreditLineId = event.params.id.toString();
  updateLendingInfo(pooledCreditLineId, event.address);
}

export function handleLiquidationWithdrawn(event: LiquidationWithdrawn): void {
  let pooledCreditLineId = event.params.id.toString();
  let lenderAddress = event.params.user;
  let amount = event.params.collateralShare;
  updateLendingInfo(pooledCreditLineId, event.address);
  updateLenderInfo(event.address, pooledCreditLineId, lenderAddress, amount, BIGINT_ZERO, BIGINT_ZERO, "Withdraw_collateral");
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 16, amount, null);
  updateLenderBalances(lenderAddress, pooledCreditLineId);
}

export function handleTransferBatch(event: TransferBatch): void {
  let from = event.params.from;
  let to = event.params.to;
  let values = event.params.values;
  let ids = event.params.ids;
  let operator = event.params.operator;
  for (let i = 0; i < ids.length; i++) {
    updateLenderBalancePerLenderPool(from, to, ids[i].toString(), values[i]);
  }
}

export function handleTransferSingle(event: TransferSingle): void {
  let from = event.params.from;
  let to = event.params.to;
  let value = event.params.value;
  let id = event.params.id.toString();
  let operator = event.params.operator;
  updateLenderBalancePerLenderPool(from, to, id, value);
}

export function handleURI(event: URI): void {
  // let id = event.params.id;
  // let value = event.params.value;
}

export function handleWithdrawLiquidity(event: WithdrawLiquidity): void {
  let pooledCreditLineId = event.params.id.toString();
  let lenderAddress = event.params.user;
  let shares = event.params.shares;
  updateLendingInfo(pooledCreditLineId, event.address);
  updateLenderInfo(event.address, pooledCreditLineId, lenderAddress, BIGINT_ZERO, shares, BIGINT_ZERO, "Withdraw");
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 15, shares, null);
  updateLenderBalances(lenderAddress, pooledCreditLineId);
}

export function handleWithdrawLiquidityOnCancel(event: WithdrawLiquidityOnCancel): void {
  let pooledCreditLineId = event.params.id.toString();
  let lenderAddress = event.params.user;
  let amount = event.params.amount;
  updateLendingInfo(pooledCreditLineId, event.address);
  updateLenderInfo(event.address, pooledCreditLineId, lenderAddress, amount, BIGINT_ZERO, BIGINT_ZERO, "Withdraw");
  updatePooledCreditLineTimeline(event, pooledCreditLineId, 15, amount, null);
  updateLenderBalances(lenderAddress, pooledCreditLineId);
}
