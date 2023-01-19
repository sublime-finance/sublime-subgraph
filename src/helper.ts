import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import { BorrowerSharesBalanceCL, CreditLine, LenderSharesBalanceCL, UserBalanceCL } from "../generated/schema";
import { BIGINT_ZERO } from "./constants/constants";

export function getCreditLineStatus(value: i32): string {
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
    default:
      return "CANCELLED";
  }
}

export function getCreditLineOperation(value: i32): string {
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
    default:
      return "LIQUIDATED";
  }
}

function getUserBalanceCLId(user: string, creditLineId: string): string {
  let _userBalanceId = user + "#" + creditLineId;
  return _userBalanceId;
}

function getLenderSharesBalanceCLId(user: string, token: string, strategy: string): string {
  let _lenderBalanceId = user + "#" + token + "#" + strategy;
  return _lenderBalanceId;
}

function getBorrowerSharesBalanceCLId(user: string, token: string, strategy: string): string {
  let _borrowerBalanceId = user + "#" + token + "#" + strategy;
  return _borrowerBalanceId;
}

function getUserBalanceCL(user: string, creditLineId: string): UserBalanceCL {
  let _userBalanceId = getUserBalanceCLId(user, creditLineId);

  let _userBalance = UserBalanceCL.load(_userBalanceId);
  if (_userBalance == null) {
    _userBalance = new UserBalanceCL(_userBalanceId) as UserBalanceCL;
    _userBalance.userAddress = user;
    _userBalance.creditLine = creditLineId;
    _userBalance.clStatus = "REQUESTED";
    _userBalance.principal = BIGINT_ZERO;
    _userBalance.lenderShareBalance = [];
    _userBalance.borrowerShareBalance = [];
    _userBalance.save();
  }
  return _userBalance as UserBalanceCL;
}

export function UpdateUserBalanceCL(user: string, creditLineId: string, creditLineStatusCode: i32, actor: string): void {
  let _userBalance = getUserBalanceCL(user, creditLineId);
  let status = getCreditLineStatus(creditLineStatusCode);

  _userBalance.clStatus = status;
  _userBalance.actorType = actor;
  _userBalance.save();
}

function getLenderBalanceCL(user: string, token: string, strategy: string): LenderSharesBalanceCL {
  let _lenderBalanceId = getLenderSharesBalanceCLId(user, token, strategy);

  let _lenderBalance = LenderSharesBalanceCL.load(_lenderBalanceId);
  if (_lenderBalance == null) {
    _lenderBalance = new LenderSharesBalanceCL(_lenderBalanceId) as LenderSharesBalanceCL;
    _lenderBalance.token = token;
    _lenderBalance.user = user;
    _lenderBalance.strategy = strategy;
    _lenderBalance.amountLent = BIGINT_ZERO;
    _lenderBalance.interestReceived = BIGINT_ZERO;
    _lenderBalance.save();
  }

  return _lenderBalance as LenderSharesBalanceCL;
}

export function UpdateLenderBalanceCL(
  user: string,
  token: string,
  strategy: string,
  creditLineId: string,
  amount: BigInt,
  creditLineOperation: i32
): void {
  let operation = getCreditLineOperation(creditLineOperation);
  let _lenderBalance = getLenderBalanceCL(user, token, strategy);
  let _userBalance = getUserBalanceCL(user, creditLineId);

  if (operation == "BORROW") {
    _lenderBalance.amountLent = _lenderBalance.amountLent.plus(amount);
    _userBalance.principal = _lenderBalance.amountLent;
  } else if (operation == "REPAY") {
    _lenderBalance.interestReceived = _lenderBalance.interestReceived.plus(amount);
  } else if (operation == "CLOSED") {
    _lenderBalance.amountLent = _lenderBalance.amountLent.minus(_userBalance.principal);
  } else {
  }

  let _creditLines = _lenderBalance.creditLines;
  _creditLines.push(_userBalance.creditLine);
  _lenderBalance.creditLines = _creditLines;

  _lenderBalance.save();
  _userBalance.save();
  AddToBalanceArrayCL(user, creditLineId, _lenderBalance.id, "LENDER");
}

function getBorrowerBalanceCL(user: string, token: string, strategy: string): BorrowerSharesBalanceCL {
  let _borrowerBalanceId = getBorrowerSharesBalanceCLId(user, token, strategy);

  let _borrowerBalance = BorrowerSharesBalanceCL.load(_borrowerBalanceId);
  if (_borrowerBalance == null) {
    _borrowerBalance = new BorrowerSharesBalanceCL(_borrowerBalanceId) as BorrowerSharesBalanceCL;
    _borrowerBalance.token = token;
    _borrowerBalance.user = user;
    _borrowerBalance.strategy = strategy;
    _borrowerBalance.collateralDeposited = BIGINT_ZERO;
    _borrowerBalance.amountBorrowed = BIGINT_ZERO;
    _borrowerBalance.amountRepaid = BIGINT_ZERO;
    _borrowerBalance.save();
  }

  return _borrowerBalance as BorrowerSharesBalanceCL;
}

export function UpdateBorrowerBalanceCL(
  user: string,
  token: string,
  strategy: string,
  creditLineId: string,
  amount: BigInt,
  creditLineOperation: i32
): void {
  let operation = getCreditLineOperation(creditLineOperation);
  let _borrowerBalance = getBorrowerBalanceCL(user, token, strategy);
  let _userBalance = getUserBalanceCL(user, creditLineId);
  let creditLine = CreditLine.load(creditLineId) as CreditLine;

  if (operation == "DEPOSIT_COLLATERAL" && token == creditLine.collateralAsset) {
    _borrowerBalance.collateralDeposited = _borrowerBalance.collateralDeposited.plus(amount);
  } else if (operation == "BORROW" && token == creditLine.borrowAsset) {
    _borrowerBalance.amountBorrowed = _borrowerBalance.amountBorrowed.plus(amount);
  } else if (operation == "REPAY" && token == creditLine.borrowAsset) {
    _borrowerBalance.amountRepaid = _borrowerBalance.amountRepaid.plus(amount);
  } else if (operation == "WITHDRAW_COLLATERAL" && token == creditLine.collateralAsset) {
    _borrowerBalance.collateralDeposited = _borrowerBalance.collateralDeposited.minus(amount);
  } else if (operation == "CLOSED" && token == creditLine.borrowAsset) {
    _borrowerBalance.amountBorrowed = _borrowerBalance.amountBorrowed.minus(_userBalance.principal);
  } else {
  }

  let _creditLines = _borrowerBalance.creditLines;
  _creditLines.push(_userBalance.creditLine);
  _borrowerBalance.creditLines = _creditLines;

  _borrowerBalance.save();
  AddToBalanceArrayCL(user, creditLineId, _borrowerBalance.id, "BORROWER");
}

function AddToBalanceArrayCL(user: string, creditLineId: string, balanceId: string, actor: string): void {
  let _userBalance = getUserBalanceCL(user, creditLineId);
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
