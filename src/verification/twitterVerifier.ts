import { updateMetadata } from "./helper";
import { TwitterVerifierGlobalParam } from "../../generated/schema";
import { UserRegistered, UserUnregistered, SignValidityUpdated, SignerUpdated } from "../../generated/twitterVerifier/twitterVerifier";

export function handleUserRegisteredByTwitter(event: UserRegistered): void {
  let user = event.params.user;
  let verifier = event.address;
  updateMetadata(user, verifier, "Twitter Verifier");
}

export function handleUserUnregisteredByTwitter(event: UserUnregistered): void {
  // let user = event.params.user;
  // let verifier = event.address;
}

export function handleSignValidityUpdated(event: SignValidityUpdated): void {
  let twitterVerifierGlobalParam = TwitterVerifierGlobalParam.load("1");
  if (twitterVerifierGlobalParam) {
  } else {
    twitterVerifierGlobalParam = new TwitterVerifierGlobalParam("1");
  }
  twitterVerifierGlobalParam.signValidiy = event.params.signValidity;
  twitterVerifierGlobalParam.save();
}

export function handleSignerUpdated(event: SignerUpdated): void {
  let twitterVerifierGlobalParam = TwitterVerifierGlobalParam.load("1");
  if (twitterVerifierGlobalParam) {
  } else {
    twitterVerifierGlobalParam = new TwitterVerifierGlobalParam("1");
  }
  twitterVerifierGlobalParam.singer = event.params.signerAddress.toHexString();
  twitterVerifierGlobalParam.save();
}
