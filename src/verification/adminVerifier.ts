import { updateMetadata } from "./helper";
import { AdminVerifierGlobalParam } from "../../generated/schema";
import {
  UserRegistered,
  UserUnregistered,
  SignValidityUpdated,
  SignerUpdated,
  adminVerifier as adminVerifierContract,
} from "../../generated/adminVerifier/adminVerifier";

export function handleUserRegisteredByAdmin(event: UserRegistered): void {
  let user = event.params.user;
  let verifier = event.address;
  updateMetadata(user, verifier, "Admin Verifier");
}

export function handleUserUnregisteredByAdmin(event: UserUnregistered): void {
  // let user = event.params.user;
  // let verifier = event.address;
}

export function handleSignValidityUpdated(event: SignValidityUpdated): void {
  let adminVerifierGlobalParam = AdminVerifierGlobalParam.load("1");
  if (adminVerifierGlobalParam) {
  } else {
    adminVerifierGlobalParam = new AdminVerifierGlobalParam("1");
  }
  adminVerifierGlobalParam.signValidiy = event.params.signValidity;
  adminVerifierGlobalParam.save();
}

export function handleSignerUpdated(event: SignerUpdated): void {
  let adminVerifierGlobalParam = AdminVerifierGlobalParam.load("1");
  if (adminVerifierGlobalParam) {
  } else {
    adminVerifierGlobalParam = new AdminVerifierGlobalParam("1");
  }
  adminVerifierGlobalParam.singer = event.params.signerAddress.toHexString();
  adminVerifierGlobalParam.save();
}
