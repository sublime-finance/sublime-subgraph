import { Address } from "@graphprotocol/graph-ts";
import { StrategyRegistry } from "../../generated/schema";
import { StrategyRegistry as StrategyRegistryContract } from "../../generated/StrategyRegistry/StrategyRegistry";

export function updateStrategyOrder(strategyRegistryAddress: Address): string[] {
  let strategyRegistryContract = StrategyRegistryContract.bind(strategyRegistryAddress);
  let rawStrategyOrder = strategyRegistryContract.getStrategies();
  let strategies: string[] = [];

  for (let i = 0; i < rawStrategyOrder.length; i++) {
    strategies[i] = rawStrategyOrder[i].toHexString();
  }

  let strategyRegistry = StrategyRegistry.load("default") as StrategyRegistry;
  strategyRegistry.strategyOrder = strategies;
  strategyRegistry.save();

  return strategies;
}
