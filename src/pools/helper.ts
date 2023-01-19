import { Address, store, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Pools,
  PoolTimeLine,
  Lenders,
  LenderPerPool,
  Borrowers,
  UserProfile,
  verifier,
  UserMetadataPerVerifier,
  walletAddr,
} from "../../generated/schema";
import { Pool } from "../../generated/templates/Pools/Pool";
