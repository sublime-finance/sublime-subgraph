import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { PooledCreditLine as PooledCreditLineContract } from "../../generated/PooledCreditLine/PooledCreditLine";
import { LenderPool as LenderPoolContract } from "../../generated/LenderPool/LenderPool";
import {
  PooledCreditLine as PooledCreditLineSchema,
  PooledCreditLineGlobalVariables,
  LenderPool as LenderPoolSchema,
  PooledCreditLineTimeLine,
  UserProfile,
  UserBalancePCL,
  LenderSharesBalancePCL,
  BorrowerSharesBalancePCL,
  verifier,
} from "../../generated/schema";
import { BIGINT_ZERO } from "../constants/constants";

export function updatePooledCreditLineConstants(
  pooledCreditLineId: string,
  contractAddress: Address,
  createdAt: BigInt,
  borrowerVerifier: string
): void {
  let pooledCreditLineInstance = PooledCreditLineContract.bind(contractAddress);
  let pooledCreditLineNum = BigInt.fromString(pooledCreditLineId);

  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId);
  if (!pooledCreditLine) {
    pooledCreditLine = new PooledCreditLineSchema(pooledCreditLineId);
  }
  let _tempConstants = pooledCreditLineInstance.pooledCreditLineConstants(pooledCreditLineNum);

  let borrowerAddress = _tempConstants.value3.toHexString();
  if (borrowerAddress == "0x0000000000000000000000000000000000000000") {
    pooledCreditLine.borrower = borrowerAddress;
  } else {
    let borrowerProfile = UserProfile.load(borrowerAddress) as UserProfile;
    pooledCreditLine.borrower = borrowerProfile.id;
  }

  pooledCreditLine.borrowerAddress = borrowerAddress;
  pooledCreditLine.borrowLimit = _tempConstants.value0;
  pooledCreditLine.borrowRate = _tempConstants.value1;
  pooledCreditLine.idealCollateralRatio = _tempConstants.value2;
  pooledCreditLine.gracePenaltyRate = _tempConstants.value11;

  pooledCreditLine.borrowAsset = _tempConstants.value4.toHexString();
  pooledCreditLine.collateralAsset = _tempConstants.value5.toHexString();
  pooledCreditLine.lenderStrategy = _tempConstants.value9.toHexString();
  pooledCreditLine.collateralStrategy = _tempConstants.value10.toHexString();

  pooledCreditLine.startsAt = _tempConstants.value6;
  pooledCreditLine.createdAt = createdAt;
  pooledCreditLine.defaultsAt = _tempConstants.value8;
  pooledCreditLine.endsAt = _tempConstants.value7;

  let verifierProfile = verifier.load(borrowerVerifier) as verifier;
  pooledCreditLine.borrowerVerifier = verifierProfile.id;

  pooledCreditLine.save();
}

export function updatePooledCreditLineVariable(
  pooledCreditLineId: string,
  pooledCreditLineStatusCode: i32,
  contractAddress: Address
): void {
  let pooledCreditLineInstance = PooledCreditLineContract.bind(contractAddress);
  let pooledCreditLineNum = BigInt.fromString(pooledCreditLineId);

  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;
  let _tempVariables = pooledCreditLineInstance.pooledCreditLineVariables(pooledCreditLineNum);
  let _collateralshares = pooledCreditLineInstance.depositedCollateralInShares(pooledCreditLineNum);
  pooledCreditLine.status = getPooledCreditLineStatus(pooledCreditLineStatusCode);
  pooledCreditLine.principal = _tempVariables.value1;
  pooledCreditLine.totalInterestRepaid = _tempVariables.value2;
  pooledCreditLine.lastPrincipalUpdateTime = _tempVariables.value3;
  pooledCreditLine.interestAccruedTillLastPrincipalUpdate = _tempVariables.value4;
  pooledCreditLine.depositedCollateralInShares = _collateralshares;

  pooledCreditLine.save();
  updateUserBalances(pooledCreditLineId, pooledCreditLineStatusCode);
}

export function updatePooledCreditLineStatus(event: ethereum.Event, pooledCreditLineId: string, pooledCreditLineStatusCode: i32): void {
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;

  pooledCreditLine.status = getPooledCreditLineStatus(pooledCreditLineStatusCode);
  updateUserBalances(pooledCreditLineId, pooledCreditLineStatusCode);

  pooledCreditLine.save();
}

export function updatePooledCreditLineTimeline(
  event: ethereum.Event,
  pooledCreditLineId: string,
  pooledCreditLineOperation: i32,
  amount: BigInt | null,
  strategy: string | null
): void {
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  let pooledCreditLineTimeline = PooledCreditLineTimeLine.load(id);
  if (pooledCreditLineTimeline) {
  } else {
    pooledCreditLineTimeline = new PooledCreditLineTimeLine(id);
    pooledCreditLineTimeline.pooledCreditLine = pooledCreditLineId;
    pooledCreditLineTimeline.timestamp = event.block.timestamp;
    pooledCreditLineTimeline.pooledCreditLineOperation = getPooledCreditLineOperation(pooledCreditLineOperation);
    pooledCreditLineTimeline.amount = amount;
    pooledCreditLineTimeline.strategy = strategy;

    pooledCreditLineTimeline.save();
  }
}

function getUserBalancePCLId(user: string, pooledCreditLineId: string): string {
  let _userBalanceId = user + "#" + pooledCreditLineId;
  return _userBalanceId;
}

function getLenderSharesBalancePCLId(user: string, token: string, strategy: string): string {
  let _lenderBalanceId = user + "#" + token + "#" + strategy;
  return _lenderBalanceId;
}

function getBorrowerSharesBalancePCLId(user: string, token: string, strategy: string): string {
  let _borrowerBalanceId = user + "#" + token + "#" + strategy;
  return _borrowerBalanceId;
}

function getUserBalancePCL(user: string, pooledCreditLineId: string): UserBalancePCL {
  let _userBalanceId = getUserBalancePCLId(user, pooledCreditLineId);

  let _userBalance = UserBalancePCL.load(_userBalanceId);
  if (_userBalance == null) {
    _userBalance = new UserBalancePCL(_userBalanceId) as UserBalancePCL;
    _userBalance.userProfile = user;
    _userBalance.pooledCreditLine = pooledCreditLineId;
    _userBalance.pclStatus = "REQUESTED";
    _userBalance.principal = BIGINT_ZERO;
    _userBalance.lenderShareBalance = [];
    _userBalance.borrowerShareBalance = [];
    _userBalance.save();
  }
  return _userBalance as UserBalancePCL;
}

export function UpdateUserBalancePCL(user: string, pooledCreditLineId: string, creditLineStatusCode: i32, actor: string): void {
  let _userBalance = getUserBalancePCL(user, pooledCreditLineId);
  let status = getPooledCreditLineStatus(creditLineStatusCode);

  _userBalance.pclStatus = status;
  _userBalance.actorType = actor;
  _userBalance.save();
}

export function getLenderBalancePCL(user: string, token: string, strategy: string): LenderSharesBalancePCL {
  let _lenderBalanceId = getLenderSharesBalancePCLId(user, token, strategy);

  let _lenderBalance = LenderSharesBalancePCL.load(_lenderBalanceId);
  if (_lenderBalance == null) {
    _lenderBalance = new LenderSharesBalancePCL(_lenderBalanceId) as LenderSharesBalancePCL;
    _lenderBalance.token = token;
    _lenderBalance.user = user;
    _lenderBalance.strategy = strategy;
    _lenderBalance.amountLent = BIGINT_ZERO;
    _lenderBalance.amountWithdrawn = BIGINT_ZERO;
    _lenderBalance.sharesWithdrawn = BIGINT_ZERO;
    _lenderBalance.interestWithdrawn = BIGINT_ZERO;
    _lenderBalance.save();
  }

  return _lenderBalance as LenderSharesBalancePCL;
}

export function UpdateLenderBalancePCL(user: string, token: string, strategy: string, pooledCreditLineId: string): void {
  let _lenderBalance = getLenderBalancePCL(user, token, strategy);
  let _userBalance = getUserBalancePCL(user, pooledCreditLineId);

  let _pooledCreditLines = _lenderBalance.pooledCreditLines;
  _pooledCreditLines.push(_userBalance.pooledCreditLine);
  _lenderBalance.pooledCreditLines = _pooledCreditLines;

  _lenderBalance.save();
  _userBalance.save();
  AddToBalanceArrayPCL(user, pooledCreditLineId, _lenderBalance.id, "LENDER");
}

function getBorrowerBalancePCL(user: string, token: string, strategy: string): BorrowerSharesBalancePCL {
  let _borrowerBalanceId = getBorrowerSharesBalancePCLId(user, token, strategy);

  let _borrowerBalance = BorrowerSharesBalancePCL.load(_borrowerBalanceId);
  if (_borrowerBalance == null) {
    _borrowerBalance = new BorrowerSharesBalancePCL(_borrowerBalanceId) as BorrowerSharesBalancePCL;
    _borrowerBalance.token = token;
    _borrowerBalance.user = user;
    _borrowerBalance.strategy = strategy;
    _borrowerBalance.collateralDeposited = BIGINT_ZERO;
    _borrowerBalance.amountBorrowed = BIGINT_ZERO;
    _borrowerBalance.amountRepaid = BIGINT_ZERO;
    _borrowerBalance.save();
  }

  return _borrowerBalance as BorrowerSharesBalancePCL;
}

function UpdateBorrowerBalancePCL(
  user: string,
  token: string,
  strategy: string,
  pooledCreditLineId: string,
  amount: BigInt,
  creditLineOperation: i32
): void {
  let operation = getPooledCreditLineOperation(creditLineOperation);
  let _borrowerBalance = getBorrowerBalancePCL(user, token, strategy);
  let _userBalance = getUserBalancePCL(user, pooledCreditLineId);
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId) as PooledCreditLineSchema;

  if (operation == "DEPOSIT_COLLATERAL" && token == pooledCreditLine.collateralAsset) {
    _borrowerBalance.collateralDeposited = _borrowerBalance.collateralDeposited.plus(amount);
  } else if (operation == "BORROW" && token == pooledCreditLine.borrowAsset) {
    _borrowerBalance.amountBorrowed = _borrowerBalance.amountBorrowed.plus(amount);
  } else if (operation == "REPAY" && token == pooledCreditLine.borrowAsset) {
    _borrowerBalance.amountRepaid = _borrowerBalance.amountRepaid.plus(amount);
  } else if (operation == "WITHDRAW_COLLATERAL" && token == pooledCreditLine.collateralAsset) {
    _borrowerBalance.collateralDeposited = _borrowerBalance.collateralDeposited.minus(amount);
  } else if (operation == "CLOSED" && token == pooledCreditLine.borrowAsset) {
    _borrowerBalance.amountBorrowed = _borrowerBalance.amountBorrowed.minus(_userBalance.principal);
  } else {
  }

  let _pooledCreditLines = _borrowerBalance.pooledCreditLines;
  _pooledCreditLines.push(_userBalance.pooledCreditLine);
  _borrowerBalance.pooledCreditLines = _pooledCreditLines;

  _borrowerBalance.save();
  AddToBalanceArrayPCL(user, pooledCreditLineId, _borrowerBalance.id, "BORROWER");
}

function AddToBalanceArrayPCL(user: string, pooledCreditLineId: string, balanceId: string, actor: string): void {
  let _userBalance = getUserBalancePCL(user, pooledCreditLineId);
  let lenderBalances = _userBalance.lenderShareBalance;
  let borrowerBalances = _userBalance.borrowerShareBalance;

  if (actor == "LENDER") {
    if (lenderBalances.includes(balanceId)) {
      return;
    } else {
      lenderBalances.push(balanceId);
      _userBalance.lenderShareBalance = lenderBalances;
      _userBalance.save();
    }
  } else if (actor == "BORROWER") {
    if (borrowerBalances.includes(balanceId)) {
      return;
    } else {
      borrowerBalances.push(balanceId);
      _userBalance.borrowerShareBalance = borrowerBalances;
      _userBalance.save();
    }
  } else {
  }
}

function updateUserBalances(pooledCreditLineId: string, pooledCreditLineStatusCode: i32): void {
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId);
  if (!pooledCreditLine) {
    pooledCreditLine = new PooledCreditLineSchema(pooledCreditLineId);
  }
  let _borrower = pooledCreditLine.borrowerAddress;

  // Adding borrower balances
  UpdateUserBalancePCL(_borrower, pooledCreditLineId, pooledCreditLineStatusCode, "BORROWER");
}

export function updateActorArrayBalances(pooledCreditLineId: string, amount: BigInt, pooledCreditLineOperation: i32): void {
  let pooledCreditLine = PooledCreditLineSchema.load(pooledCreditLineId);
  if (!pooledCreditLine) {
    pooledCreditLine = new PooledCreditLineSchema(pooledCreditLineId);
  }

  let _borrower = pooledCreditLine.borrowerAddress;
  let _borrowAsset = pooledCreditLine.borrowAsset;
  let _collateralAsset = pooledCreditLine.collateralAsset;
  let _lenderStrategy = pooledCreditLine.lenderStrategy;
  let _collateralStrategy = pooledCreditLine.collateralStrategy;

  UpdateBorrowerBalancePCL(_borrower, _borrowAsset, _lenderStrategy, pooledCreditLineId, amount, pooledCreditLineOperation);
  UpdateBorrowerBalancePCL(_borrower, _collateralAsset, _collateralStrategy, pooledCreditLineId, amount, pooledCreditLineOperation);
}

export function getPooledCreditLineStatus(value: i32): string {
  switch (value) {
    case 0:
      return "NOT_CREATED";
    case 1:
      return "REQUESTED";
    case 2:
      return "ACTIVE";
    case 3:
      return "CLOSED";
    case 4:
      return "CANCELLED";
    case 5:
      return "LIQUIDATED";
    case 6:
      return "EXPIRED";
    default:
      return "TERMINATED";
  }
}

export function getPooledCreditLineOperation(value: i32): string {
  switch (value) {
    case 0:
      return "NOT_CREATED";
    case 1:
      return "REQUESTED";
    case 2:
      return "ACTIVE";
    case 3:
      return "DEPOSIT_COLLATERAL";
    case 4:
      return "BORROW";
    case 5:
      return "REPAY";
    case 6:
      return "WITHDRAW_COLLATERAL";
    case 7:
      return "CLOSED";
    case 8:
      return "CANCELLED";
    case 9:
      return "RESET";
    case 10:
      return "EXPIRED";
    case 11:
      return "TERMINATED";
    case 12:
      return "LIQUIDATED";
    case 13:
      return "LEND";
    case 14:
      return "WITHDRAW_INTEREST";
    case 15:
      return "WITHDRAW_LIQUIDATY";
    default:
      return "WITHDRAW_COLLATERAL_SHARE";
  }
}
