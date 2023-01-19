import {
  CollateralAdded,
  AmountBorrowed,
  CollateralWithdrawn,
  LenderLiquidated,
  LiquiditySupplied,
  LiquidityWithdrawn,
  MarginCallCollateralAdded,
  MarginCalled,
  Paused,
  PoolCancelled,
  PoolClosed,
  PoolLiquidated,
  PoolTerminated,
  Transfer,
  Unpaused,
} from "../../generated/templates/Pools/Pool";

import {
  increaseCollateralShares,
  updatePoolTimeline,
  updatePoolLenderDetailsOnLiquiditySupplied,
  decreaseCollateralShares,
} from "../poolHelpers";

import { Pool as PoolEntity } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../constants/constants";

export function handleAmountBorrowed(event: AmountBorrowed): void {
  let poolAddress = event.address;
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  updatePoolTimeline(
    id,
    poolAddress,
    Address.fromString(_pool.borrowerAddress as string),
    event.block.timestamp,
    "BORROW",
    event.params.amount
  );

  _pool.amountBorrowed = event.params.amount;
  _pool.poolStatus = "ACTIVE";
  _pool.save();
}

export function handleCollateralAdded(event: CollateralAdded): void {
  let poolAddress = event.address;
  increaseCollateralShares(poolAddress, event.params.sharesReceived);

  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  updatePoolTimeline(id, poolAddress, event.params.borrower, event.block.timestamp, "COLLATERAL_ADDED", event.params.amount);
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
  let poolAddress = event.address;
  decreaseCollateralShares(poolAddress, event.params.amount);

  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  updatePoolTimeline(id, poolAddress, event.params.borrower, event.block.timestamp, "COLLATERAL_WITHDRAWN", event.params.amount);
}

export function handleLenderLiquidated(event: LenderLiquidated): void {}

export function handleLiquiditySupplied(event: LiquiditySupplied): void {
  let poolAddress = event.address;
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();
  updatePoolTimeline(id, poolAddress, event.params.lenderAddress, event.block.timestamp, "LIQUIDITY_SUPPLIED", event.params.amountSupplied);
  updatePoolLenderDetailsOnLiquiditySupplied(event);
}

export function handleLiquidityWithdrawn(event: LiquidityWithdrawn): void {}

export function handleMarginCallCollateralAdded(event: MarginCallCollateralAdded): void {}

export function handleMarginCalled(event: MarginCalled): void {}

export function handlePaused(event: Paused): void {}

export function handlePoolCancelled(event: PoolCancelled): void {}

export function handlePoolClosed(event: PoolClosed): void {
  let poolAddress = event.address;
  let id = event.transaction.hash.toHexString() + "#" + event.transactionLogIndex.toString();

  let poolId = poolAddress.toHexString();
  let _pool = PoolEntity.load(poolId) as PoolEntity;
  updatePoolTimeline(id, poolAddress, Address.fromString(_pool.borrowerAddress as string), event.block.timestamp, "CLOSE", BIGINT_ZERO);
  _pool.poolStatus = "CLOSED";
  _pool.save();
}

export function handlePoolLiquidated(event: PoolLiquidated): void {}

export function handlePoolTerminated(event: PoolTerminated): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUnpaused(event: Unpaused): void {}

/**
 * sample query
 * 
{
  pools{
    id
    poolTimeLine{
      poolOperation
      actor
      amount
      timestamp
    }
  }
}
 */

/**
 * sample quer
 * 
 * 
 {
  lenderPerPools {
    id
    pool {
      id
    }
    lenderAddress
    percentageContribution
    lentAmount,
    interestWithdrawn
  }
}
 */

/**
 * 
 {
  pools(where:{id:"0xede6de83da2aa06fa0b989e4822d9f2096580673"}){
    id
    lenderAddresses
    borrower{
      wallet{
        id
        user{
          userMetadataPerVerifier{
            metadata
          }
        }
      }
    }
    lenders{
      id
      lenderAddress
      amount
      wallet{
        id
        user{
          userMetadataPerVerifier{
            metadata
          }
        }
      }
    }
  }
}
 */

/**
 * 
 * 
 {
  lenderContirbutions(where:{pool:"0xede6de83da2aa06fa0b989e4822d9f2096580673"}) {
    lenderAddress
    pool{
      id
    }
  }
}

 */
