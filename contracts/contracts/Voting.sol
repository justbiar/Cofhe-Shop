// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    // round => targetId => votes
    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // round => voter => voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event VoteCast(uint256 indexed round, address indexed voter, uint256 indexed targetId);

    function castVote(uint256 round, uint256 targetId) external {
        require(!hasVoted[round][msg.sender], "Already voted this round");
        hasVoted[round][msg.sender] = true;
        votes[round][targetId] += 1;
        emit VoteCast(round, msg.sender, targetId);
    }

    // helper to read votes for a target
    function getVotes(uint256 round, uint256 targetId) external view returns (uint256) {
        return votes[round][targetId];
    }
}
