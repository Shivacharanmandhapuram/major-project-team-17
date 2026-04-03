// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EMRHashRegistry {
    
    // Mapping from Record ID (string) to the SHA256 Hash (string)
    mapping(string => string) private emrHashes;
    
    // Event emitted when a new hash is stored
    event HashStored(string recordId, string hashValue, uint256 timestamp);

    /**
     * @dev Stores the SHA256 hash of an EMR record.
     * @param recordId The unique ID of the EMR (e.g., EMR-12345)
     * @param hashValue The SHA256 hash string of the EMR JSON
     */
    function storeHash(string memory recordId, string memory hashValue) public {
        // Ensure that a hash doesn't already exist for this record
        require(bytes(emrHashes[recordId]).length == 0, "Hash already exists for this Record ID");
        
        // Store the hash
        emrHashes[recordId] = hashValue;
        
        // Emit the event to the blockchain log
        emit HashStored(recordId, hashValue, block.timestamp);
    }

    /**
     * @dev Retrieves the stored SHA256 hash of an EMR record.
     * @param recordId The unique ID of the EMR
     * @return The SHA256 hash string
     */
    function getHash(string memory recordId) public view returns (string memory) {
        // Ensure the record ID is not empty
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        
        return emrHashes[recordId];
    }
}
