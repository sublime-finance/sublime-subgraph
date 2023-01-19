import { MaxStrategiesUpdated, StrategyAdded, StrategyRemoved } from "../../generated/StrategyRegistry/StrategyRegistry";

import { Strategy, StrategyRegistry } from "../../generated/schema";
import { updateStrategyOrder } from "./helpers";

export function handleStrategyAdded(event: StrategyAdded): void {
  let strategy = event.params.strategy.toHexString();
  let strategyInstance = Strategy.load(strategy);

  if (strategyInstance == null) {
    strategyInstance = new Strategy(strategy);
    strategyInstance.address = strategy;
    strategyInstance.enabled = false;
  }

  strategyInstance.enabled = true;
  strategyInstance.save();

  updateStrategyOrder(event.address);
}

export function handleStrategyRemoved(event: StrategyRemoved): void {
  let strategy = event.params.strategy.toHexString();
  let strategyInstance = Strategy.load(strategy) as Strategy;

  strategyInstance.enabled = false;
  strategyInstance.save();

  updateStrategyOrder(event.address);
}

export function handleMaxStrategiesUpdated(event: MaxStrategiesUpdated): void {
  let strategyRegistry = StrategyRegistry.load("default");
  if (strategyRegistry == null) {
    strategyRegistry = new StrategyRegistry("default");
  }
  strategyRegistry.max = event.params.maxStrategies;
  strategyRegistry.save();
}
