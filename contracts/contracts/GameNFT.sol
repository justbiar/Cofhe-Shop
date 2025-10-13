// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GameNFT
 * @dev NFT contract for in-game items, characters, etc.
 */
contract GameNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;
    
    // NFT attributes
    struct NFTAttributes {
        uint256 level;
        uint256 power;
        uint256 rarity;
        string characterType;
    }
    
    mapping(uint256 => NFTAttributes) public nftAttributes;
    
    constructor() ERC721("GameNFT", "GNFT") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new NFT
     * @param to Address to mint NFT to
     * @param level Character level
     * @param power Character power
     * @param rarity Character rarity (1-5)
     * @param characterType Type of character
     */
    function mint(
        address to,
        uint256 level,
        uint256 power,
        uint256 rarity,
        string memory characterType
    ) external onlyOwner {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        nftAttributes[tokenId] = NFTAttributes({
            level: level,
            power: power,
            rarity: rarity,
            characterType: characterType
        });
    }
    
    /**
     * @dev Update NFT attributes
     * @param tokenId Token ID to update
     * @param level New level
     * @param power New power
     */
    function updateAttributes(
        uint256 tokenId,
        uint256 level,
        uint256 power
    ) external {
    require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        nftAttributes[tokenId].level = level;
        nftAttributes[tokenId].power = power;
    }
    
    /**
     * @dev Set base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Get token URI
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
    // ownerOf will revert if token does not exist
    ownerOf(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, tokenId.toString()))
            : "";
    }
    
    /**
     * @dev Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Required override
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Required override
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    /**
     * @dev Required override
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

