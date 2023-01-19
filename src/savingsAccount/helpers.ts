import { Address, store } from "@graphprotocol/graph-ts";
import { BigInt } from "@graphprotocol/graph-ts";
import { SavingsAccount } from "../../generated/SavingsAccount/SavingsAccount";
import { Allowance, Balance, Strategy, UserBalance } from "../../generated/schema";
import { BIGINT_ZERO } from "../constants/constants";

function getUserBalanceId(user: Address, token: Address): string {
  let userBalanceId = user.toHexString() + token.toHexString();
  return userBalanceId;
}

export function getUserBalance(user: Address, token: Address, createIfNew: boolean = false): UserBalance {
  let userBalanceId = getUserBalanceId(user, token);
  let userBalance = UserBalance.load(userBalanceId);
  if (userBalance == null && createIfNew) {
    userBalance = new UserBalance(userBalanceId);
    userBalance.token = token.toHexString();
    userBalance.user = user.toHexString();
    userBalance.strategyBalance = [];
    // TODO: this can be removed ?
    userBalance.save();
  }
  return userBalance as UserBalance;
}

function getBalanceId(user: Address, token: Address, strategy: Address): string {
  let balanceId = user.toHexString() + token.toHexString() + strategy.toHexString();
  return balanceId;
}

export function getBalance(user: Address, token: Address, strategy: Address, createIfNew: boolean = false): Balance {
  let balanceId = getBalanceId(user, token, strategy);
  let balance = Balance.load(balanceId);

  if (balance == null && createIfNew) {
    balance = new Balance(balanceId);
    balance.token = token.toHexString();
    balance.user = user.toHexString();
    balance.strategy = strategy.toHexString();
    balance.shares = BIGINT_ZERO;
    // TODO: this can be removed ?
    balance.save();
    addBalanceToUser(user, token, strategy);
  }
  return balance as Balance;
}

export function increaseBalance(user: Address, token: Address, strategy: Address, amount: BigInt): void {
  let balance = getBalance(user, token, strategy, true);
  balance.shares = balance.shares.plus(amount);
  balance.save();
}

export function decreaseBalance(user: Address, token: Address, strategy: Address, amount: BigInt): void {
  let balance: Balance = getBalance(user, token, strategy);
  balance.shares = balance.shares.minus(amount);
  balance.save();

  if (balance.shares.equals(BIGINT_ZERO)) {
    store.remove("Balance", balance.id);
    removeBalanceFromUser(user, token, strategy);
  }
}

export function addBalanceToUser(user: Address, token: Address, strategy: Address): void {
  let userBalance = getUserBalance(user, token, true);
  let strategyBalances = userBalance.strategyBalance;
  let balanceId = getBalanceId(user, token, strategy);
  if (strategyBalances.includes(balanceId)) {
    return;
  }
  strategyBalances.push(balanceId);
  userBalance.strategyBalance = strategyBalances;
  userBalance.save();
}

export function removeBalanceFromUser(user: Address, token: Address, strategy: Address): void {
  let userBalance = getUserBalance(user, token);
  let strategyBalances = userBalance.strategyBalance;
  let balanceId = getBalanceId(user, token, strategy);
  let index = strategyBalances.indexOf(balanceId);
  if (index == -1) {
    return;
  }
  strategyBalances.splice(index, 1);
  userBalance.strategyBalance = strategyBalances;
  userBalance.save();

  if (userBalance.strategyBalance.length == 0) {
    store.remove("UserBalance", userBalance.id);
  }
}

export function getAllowanceId(from: Address, to: Address, token: Address): string {
  let allowanceId = from.toHexString() + to.toHexString() + token.toHexString();
  return allowanceId;
}

export function getAllowance(from: Address, to: Address, token: Address, createIfNew: boolean = false): Allowance {
  let allowanceId = getAllowanceId(from, to, token);
  let allowance = Allowance.load(allowanceId);
  if (allowance == null && createIfNew) {
    allowance = new Allowance(allowanceId);
    allowance.from = from.toHexString();
    allowance.to = to.toHexString();
    allowance.token = token.toHexString();
    allowance.amount = BIGINT_ZERO;
    allowance.save();
  }
  return allowance as Allowance;
}

export function updateAllowance(from: Address, to: Address, token: Address, savingsAccount: Address): void {
  let savingsAccountContract = SavingsAccount.bind(savingsAccount);
  let latestAllowance = savingsAccountContract.allowance(from, token, to);

  let allowanceEntity = getAllowance(from, to, token, true);
  allowanceEntity.amount = latestAllowance;
  allowanceEntity.save();
}
