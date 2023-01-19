import { Address, store, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { UserMetadataPerVerifier, UserProfile, verifier, walletAddr, VerificationGlobalParam } from "../../generated/schema";
import { twitterVerifier as twitterVerifierContract } from "../../generated/twitterVerifier/twitterVerifier";
import { adminVerifier as adminVerifierContract } from "../../generated/adminVerifier/adminVerifier";

export function addVerifier(Verifier: Address): void {
  let _verifierAddress = Verifier.toHexString();

  let _verifier = new verifier(_verifierAddress);
  _verifier.status = "VALID";
  _verifier.save();
}

export function removeVerifier(Verifier: Address): void {
  let _verifierAddress = Verifier.toHexString();
  let _verifier = verifier.load(_verifierAddress) as verifier;

  if (_verifier == null) {
    throw new Error("Verifier does not exist.");
  }

  // if(_verifier.usersVerified != null) {
  //     let _verifiedUsers = _verifier.usersVerified;
  //     for(let i = 0; i < _verifiedUsers.length; i++) {
  //         let _user = _verifiedUsers[i].toString();
  //         let _userMetadata = UserMetadataPerVerifier.load(_user);
  //         store.remove("UserMetadataPerVerifier",_userMetadata.id);
  //     }
  // }
  _verifier.status = "INVALID";
  _verifier.save();
}

export function createMasterAddress(masterAddress: Address, verifierAddress: Address, activation: BigInt): void {
  let masterAddr = masterAddress.toHexString();
  let verifierAddr = verifierAddress.toHexString();

  let _userProfile = new UserProfile(masterAddr) as UserProfile;
  let _walletAddress = new walletAddr(masterAddr) as walletAddr;
  let _verifier = verifier.load(verifierAddr) as verifier; // Assuming verifier exists

  let userID = _verifier.id + "_" + _userProfile.id;
  let _userMetadata = new UserMetadataPerVerifier(userID) as UserMetadataPerVerifier;

  _userMetadata.userID = _userProfile.id;
  _userMetadata.verifier = "Pending";
  _userMetadata.verifiedBy = _verifier.id;
  _userProfile.masterAddress = masterAddr;

  _walletAddress.user = _userProfile.id;
  _walletAddress.linkStatus = "MASTER";
  _walletAddress.timestamp = activation;

  _userProfile.save();
  _userMetadata.save();
  _walletAddress.save();
}

export function removeMasterAddress(masterAddress: Address, verifierAddress: Address): void {
  let masterAddr = masterAddress.toHexString();
  let verifierAddr = verifierAddress.toHexString();

  let _userProfile = UserProfile.load(masterAddr) as UserProfile;
  let _walletAddress = walletAddr.load(masterAddr) as walletAddr;
  let _verifier = verifier.load(verifierAddr) as verifier; // Assuming verifier exists

  if (_userProfile == null) {
    throw new Error("User profile does not exist.");
  }

  if (_walletAddress != null) {
    // wallet Address might not exist for every user profile
    store.remove("walletAddr", _walletAddress.id);
  }

  if (_verifier != null) {
    let _userID = _verifier.id + "_" + _userProfile.id;
    let _userMetadata = UserMetadataPerVerifier.load(_userID) as UserMetadataPerVerifier;
    if (_userMetadata != null) {
      store.remove("UserMetadataPerVerifier", _userMetadata.id);
    }
  }

  store.remove("UserProfile", _userProfile.id);
}

export function addLinkedAddress(masterAddress: Address, linkedAddress: Address, status: String): void {
  let masterAddr = masterAddress.toHexString();
  let linkedAddr = linkedAddress.toHexString();

  // Assuming user profile exists for given master address
  let _userProfile = UserProfile.load(masterAddr) as UserProfile;
  let _walletAddress = walletAddr.load(linkedAddr) as walletAddr;

  if (_walletAddress == null) {
    _walletAddress = new walletAddr(linkedAddr);
  }

  if (_userProfile == null) {
    _userProfile = new UserProfile(masterAddr);
    _userProfile.masterAddress = masterAddr;
  }
  _walletAddress.user = _userProfile.id;

  if (status == "LINK") {
    _walletAddress.linkStatus = "LINKED";
  } else if (status == "REQUEST") {
    _walletAddress.linkStatus = "REQUESTED";
  } else if (status == "CANCEL") {
    _walletAddress.linkStatus = "CANCELLED";
  }

  _userProfile.save();
  _walletAddress.save();
}

export function removeLinkedAddress(masterAddress: Address, linkedAddress: Address): void {
  let masterAddr = masterAddress.toHexString();
  let linkedAddr = linkedAddress.toHexString();

  // Assuming user profile exists for given master address
  let _userProfile = UserProfile.load(masterAddr) as UserProfile;
  let _walletAddress = walletAddr.load(linkedAddr) as walletAddr;

  if (_walletAddress == null) {
    throw new Error("Address does not exist.");
  }

  _userProfile.save();
  store.remove("walletAddr", _walletAddress.id);
}

export function updateActivationDelay(value: BigInt): void {
  let _globalParams = VerificationGlobalParam.load("1") as VerificationGlobalParam;

  if (_globalParams == null) {
    _globalParams = new VerificationGlobalParam("1");
  }

  _globalParams.activationDelay = value;

  _globalParams.save();
}

export function updateMetadata(user: Address, verifier: Address, verifierType: string): void {
  let _userAddress = user.toHexString();
  let _verifier = verifier.toHexString();
  let _userID = _verifier + "_" + _userAddress;
  let _userMetadata = UserMetadataPerVerifier.load(_userID) as UserMetadataPerVerifier;

  _userMetadata.verifier = verifierType;
  if (verifierType == "Twitter Verifier") {
    let twitterVerifier = twitterVerifierContract.bind(verifier);
    let userData = twitterVerifier.userData(user);
    _userMetadata.metadata = userData.value0 + "_" + userData.value1;
  } else {
    let adminVerifier = adminVerifierContract.bind(verifier);
    let userData = adminVerifier.userData(user);
    _userMetadata.metadata = userData;
  }

  _userMetadata.save();
}
