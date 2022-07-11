// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SBT {

    struct JobSBT {
        uint id;
        string title;
        uint8 startMonth;
        uint16 startYear;
        uint8 endMonth;
        uint16 endYear;
        /** 
         * @dev Tracks the state of a SBT
         * 
         * - 0 means address is not present in mapping.
         * - 1 means address is present, but pending.
         * - 2 means address is present & issued.
         */
        uint8 isSet;
    }

    mapping (address => mapping(address => JobSBT[])) private issuedSBT;

    // Requested SBTs that are not yet accepted/rejected
    mapping (address => mapping(address => JobSBT)) private pendingSBT;
    mapping (address => address[]) private pendingSBTAddresses;

    /** 
     * @dev Tracks the count of a company's issued SBT
     * 
     * - 0 means company is not registered.
     * - 1 means company is registerd.
     * - n means company has issued n-1 SBT. 
    */
    mapping (address => uint) countIssued;

    /** 
     * @dev Registers the caller with the contract.
     *
     * Requirements:
     *
     * - the caller (company) must not be already registered.
     */
    function registerCompany() external returns (bool) {
        require(countIssued[msg.sender] == 0, "SBT: company already registerd");
        countIssued[msg.sender] = 1;
        return true;
    }
   
    /**
     * @dev Requests a SBT from `company` for the caller's account.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `company` cannot be the zero address.
     * - `company` must be present in mapping.
     * - the caller must not have requested the same `company` before.
     */
    function requestSBT(address company, JobSBT memory jobSBT_) external returns (bool) {
        require(company != address(0), "SBT: company address cannot be the zero address");
        require(countIssued[company] != 0, "SBT: company not registerd");

        JobSBT memory _jobSBT = pendingSBT[company][msg.sender];
        require (_jobSBT.isSet == 0, "SBT: request is already in pending list");

        jobSBT_.isSet = 1;
        pendingSBT[company][msg.sender] = jobSBT_;
        pendingSBTAddresses[company].push(msg.sender);
        return true;
    }

    /**
     * @dev Returns all pending SBT requests for the caller.
     *
     * Requirements:
     *
     * - the caller must be present in mapping.
     */
    function getPendingSBTRequests() external view returns (address[] memory, JobSBT[] memory) {
        address company = msg.sender;
        require(countIssued[company] != 0, "SBT: company not registerd");

        address[] memory returnAddresses = pendingSBTAddresses[company];
        JobSBT[] memory returnPendingSBT = new JobSBT[](returnAddresses.length);

        for (uint i = 0; i < returnAddresses.length; i++) {
            returnPendingSBT[i] = pendingSBT[company][pendingSBTAddresses[company][i]];
        }

        return (returnAddresses, returnPendingSBT);
    }

    /**
     * @dev Responds to a SBT request. 
     *
     * Issues SBT if `reponse` is true, else rejects the request.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - the caller `company` must be present (registerd) in mapping.
     * - the caller `company` must have pending requests to respond to from `user`.
     */
    function respondToRequestSBT(address user, bool response) external returns (bool) {
        
        address company = msg.sender;
        require(countIssued[company] != 0, "SBT: company not registerd");
        
        uint len = pendingSBTAddresses[company].length;
        require(len != 0, "SBT: company has no pending requests");

        require(pendingSBT[company][user].isSet == 1, "SBT: user has not requested any SBT");

        if (response == true) {
            pendingSBT[company][user].isSet = 2;
            issuedSBT[company][user].push(pendingSBT[company][user]);
        } 

        delete pendingSBT[company][user];
        for (uint i = 0; i < len; i++) {
            if (pendingSBTAddresses[company][i] == user) {
                pendingSBTAddresses[company][i] = pendingSBTAddresses[company][len-1];
                pendingSBTAddresses[company].pop();
                break;
            }
        }

        return true;
    }

    /**
     * @dev Returns a boolean value indicating whether `company` has issued a SBT with
     * `id` to the `issuedTo` or not.
     *
     * Requirements:
     *
     * - `company` cannot be the zero address.
     * - `issuedTo` cannot be the zero address.
     * - `id` cannot be greater than the total SBT issued by the `company`
     */
    function verifySBT(address company, address issuedTo, uint id) external view returns (bool) {
        require(company != address(0), "SBT: company address cannot be the zero address");
        require(issuedTo != address(0), "SBT: issuedTo address cannot be the zero address");
        require(id > countIssued[company], "SBT: id cannot be greater than the total SBT issued by company");

        JobSBT[] memory jobSBT = issuedSBT[company][issuedTo];
        bool flag = false;
        for (uint i = 0; i < jobSBT.length; i++) {
            if (jobSBT[i].id == id) {
                flag = true;
                break;
            }
        }
        return flag;
    }
}