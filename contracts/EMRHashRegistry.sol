// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title EMRHashRegistry
/// @notice Stores SHA256 hashes of Electronic Medical Records for tamper-proof verification.
/// @dev Each EMR record is identified by a unique string recordId.
///      The hash is stored once and cannot be modified after storage.

contract EMRHashRegistry {

    /// @notice Mapping from record ID to its SHA256 hash
    mapping(string => string) private emrHashes;

    /// @notice Mapping to track if a record has already been stored
    mapping(string => bool) private hashExists;

    /// @notice Address of the contract owner (deployer)
    address public owner;

    /// @notice Emitted when a new hash is stored
    event HashStored(
        string indexed recordId,
        string hash,
        uint256 timestamp,
        address storedBy
    );

    /// @notice Emitted when verification is performed
    event HashVerified(
        string indexed recordId,
        bool isValid,
        uint256 timestamp
    );

    /// @notice Only the owner can call certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    /// @notice Constructor sets the deployer as owner
    constructor() {
        owner = msg.sender;
    }

    /// @notice Store the SHA256 hash of an EMR record
    /// @param recordId Unique identifier of the EMR record
    /// @param hash The SHA256 hash of the EMR data
    function storeHash(string memory recordId, string memory hash) public onlyOwner {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(hash).length > 0, "Hash cannot be empty");
        require(!hashExists[recordId], "Hash already stored for this record");

        emrHashes[recordId] = hash;
        hashExists[recordId] = true;

        emit HashStored(recordId, hash, block.timestamp, msg.sender);
    }

    /// @notice Retrieve the stored hash for a record
    /// @param recordId Unique identifier of the EMR record
    /// @return The stored SHA256 hash
    function getHash(string memory recordId) public view returns (string memory) {
        require(hashExists[recordId], "No hash found for this record");
        return emrHashes[recordId];
    }

    /// @notice Check if a hash exists for a given record
    /// @param recordId Unique identifier of the EMR record
    /// @return true if a hash is stored for this record
    function hasHash(string memory recordId) public view returns (bool) {
        return hashExists[recordId];
    }

    /// @notice Verify a hash against the stored value
    /// @param recordId Unique identifier of the EMR record
    /// @param hash The hash to verify against the stored value
    /// @return isValid true if the hashes match
    function verifyHash(string memory recordId, string memory hash) public returns (bool isValid) {
        require(hashExists[recordId], "No hash found for this record");
        isValid = keccak256(bytes(emrHashes[recordId])) == keccak256(bytes(hash));
        emit HashVerified(recordId, isValid, block.timestamp);
        return isValid;
    }

    /// @notice Get the total info about a stored record hash
    /// @param recordId Unique identifier of the EMR record
    /// @return hash The stored hash
    /// @return exists Whether the hash exists
    function getRecordInfo(string memory recordId) public view returns (string memory hash, bool exists) {
        return (emrHashes[recordId], hashExists[recordId]);
    }
}
