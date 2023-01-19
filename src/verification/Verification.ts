import {
  addVerifier,
  removeVerifier,
  createMasterAddress,
  removeMasterAddress,
  addLinkedAddress,
  removeLinkedAddress,
  updateActivationDelay,
} from "./helper";
import {
  AddressLinked,
  AddressUnlinked,
  UserRegistered,
  UserUnregistered,
  VerifierAdded,
  VerifierRemoved,
  AddressLinkingRequested,
  AddressLinkingRequestCancelled,
  ActivationDelayUpdated,
  Verification as VerificationContract,
} from "../../generated/Verification/Verification";

export function handleAddressLinked(event: AddressLinked): void {
  let linkedAddress = event.params.linkedAddress;
  let masterAddress = event.params.masterAddress;
  addLinkedAddress(masterAddress, linkedAddress, "LINK");
}

export function handleAddressUnlinked(event: AddressUnlinked): void {
  let unLinkedAddress = event.params.linkedAddress;
  let masterAddress = event.params.masterAddress;
  removeLinkedAddress(masterAddress, unLinkedAddress);
}

export function handleUserRegistered(event: UserRegistered): void {
  let RegisteredUser = event.params.masterAddress;
  let verifier = event.params.verifier;
  let activationTimestamp = event.params.activatesAt;
  // let link = true; // @to be done
  createMasterAddress(RegisteredUser, verifier, activationTimestamp);
}

export function handleUserUnregistered(event: UserUnregistered): void {
  let unRegisteredUser = event.params.masterAddress;
  let verifier = event.params.verifier;
  removeMasterAddress(unRegisteredUser, verifier);
}

export function handleVerifierAdded(event: VerifierAdded): void {
  let verifier = event.params.verifier;
  addVerifier(verifier);
}

export function handleVerifierRemoved(event: VerifierRemoved): void {
  let verifier = event.params.verifier;
  removeVerifier(verifier);
}

export function handleAddressLinkingRequested(event: AddressLinkingRequested): void {
  let linkedAddress = event.params.linkedAddress;
  let masterAddress = event.params.masterAddress;
  addLinkedAddress(masterAddress, linkedAddress, "REQUEST");
}

export function handleAddressLinkingRequestCancelled(event: AddressLinkingRequestCancelled): void {
  let linkedAddress = event.params.linkedAddress;
  let masterAddress = event.params.masterAddress;
  addLinkedAddress(masterAddress, linkedAddress, "CANCEL");
}

export function handleActivationDelayUpdated(event: ActivationDelayUpdated): void {
  let _delay = event.params.activationDelay;
  updateActivationDelay(_delay);
}
