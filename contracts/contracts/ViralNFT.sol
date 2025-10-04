// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ISAFEToken {
    function getPost(uint256 postId) external view returns (
        address creator,
        uint256 totalVotes,
        uint256 upVotes,
        uint256 downVotes,
        uint256 viralScore,
        bool isActive,
        uint256 createdAt
    );
    function isEligibleForNFT(uint256 postId) external view returns (bool);
}

/**
 * @title ViralNFT
 * @dev NFT contract for viral content on ViralSafe platform
 * 
 * Features:
 * - Auto-minting based on viral score
 * - IPFS metadata storage
 * - Creator royalties (5-10%)
 * - Marketplace integration
 * - Rarity levels based on viral performance
 */
contract ViralNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    ERC721Royalty,
    Ownable, 
    ReentrancyGuard 
{
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Contract references
    ISAFEToken public safeToken;
    
    // NFT Rarity levels
    enum Rarity { Common, Rare, Epic, Legendary }
    
    struct NFTMetadata {
        uint256 postId;
        address creator;
        uint256 viralScore;
        uint256 mintTimestamp;
        Rarity rarity;
        string ipfsHash;
        bool isActive;
    }

    // State variables
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(uint256 => uint256) public postToTokenId; // postId -> tokenId
    mapping(address => uint256[]) public creatorNFTs;
    
    uint256 public constant MIN_VIRAL_SCORE = 1000 * 10**18;
    uint256 public constant RARE_THRESHOLD = 2000 * 10**18;
    uint256 public constant EPIC_THRESHOLD = 5000 * 10**18;
    uint256 public constant LEGENDARY_THRESHOLD = 10000 * 10**18;
    
    // Royalty settings
    uint96 public constant DEFAULT_ROYALTY = 500; // 5%
    uint96 public constant LEGENDARY_ROYALTY = 1000; // 10% for legendary
    
    // IPFS settings
    string public baseIPFSURI = "https://gateway.pinata.cloud/ipfs/";
    
    // Events
    event NFTAutoMinted(uint256 indexed tokenId, uint256 indexed postId, address indexed creator, uint256 viralScore);
    event RarityAssigned(uint256 indexed tokenId, Rarity rarity);
    event MetadataUpdated(uint256 indexed tokenId, string newIPFSHash);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        address _safeToken,
        address _owner
    ) ERC721("ViralSafe NFT", "VNFT") {
        require(_safeToken != address(0), "Invalid SAFE token address");
        require(_owner != address(0), "Invalid owner address");
        
        safeToken = ISAFEToken(_safeToken);
        _transferOwnership(_owner);
        
        // Set default royalty info
        _setDefaultRoyalty(_owner, DEFAULT_ROYALTY);
    }

    /**
     * @dev Auto-mint NFT when post reaches viral threshold
     * @param postId ID of the viral post
     * @param ipfsHash IPFS hash of the metadata
     * @return tokenId The minted token ID
     */
    function autoMint(
        uint256 postId, 
        string calldata ipfsHash
    ) external nonReentrant returns (uint256) {
        require(postToTokenId[postId] == 0, "NFT already minted for this post");
        require(safeToken.isEligibleForNFT(postId), "Post not eligible for NFT");
        
        // Get post details
        (address creator, , , , uint256 viralScore, bool isActive,) = safeToken.getPost(postId);
        require(isActive, "Post is not active");
        require(creator != address(0), "Invalid creator");
        
        // Mint NFT
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(creator, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        // Determine rarity based on viral score
        Rarity rarity = _determineRarity(viralScore);
        
        // Set royalty based on rarity
        uint96 royaltyFee = rarity == Rarity.Legendary ? LEGENDARY_ROYALTY : DEFAULT_ROYALTY;
        _setTokenRoyalty(tokenId, creator, royaltyFee);
        
        // Store metadata
        nftMetadata[tokenId] = NFTMetadata({
            postId: postId,
            creator: creator,
            viralScore: viralScore,
            mintTimestamp: block.timestamp,
            rarity: rarity,
            ipfsHash: ipfsHash,
            isActive: true
        });
        
        // Update mappings
        postToTokenId[postId] = tokenId;
        creatorNFTs[creator].push(tokenId);
        
        emit NFTAutoMinted(tokenId, postId, creator, viralScore);
        emit RarityAssigned(tokenId, rarity);
        
        return tokenId;
    }

    /**
     * @dev Manually mint NFT (owner only, for special cases)
     * @param to Address to mint NFT to
     * @param postId Associated post ID
     * @param ipfsHash IPFS metadata hash
     * @param rarity Assigned rarity
     * @return tokenId The minted token ID
     */
    function adminMint(
        address to,
        uint256 postId,
        string calldata ipfsHash,
        Rarity rarity
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(postToTokenId[postId] == 0, "NFT already exists for this post");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        // Set royalty
        uint96 royaltyFee = rarity == Rarity.Legendary ? LEGENDARY_ROYALTY : DEFAULT_ROYALTY;
        _setTokenRoyalty(tokenId, to, royaltyFee);
        
        // Store metadata
        nftMetadata[tokenId] = NFTMetadata({
            postId: postId,
            creator: to,
            viralScore: 0, // Set manually by owner
            mintTimestamp: block.timestamp,
            rarity: rarity,
            ipfsHash: ipfsHash,
            isActive: true
        });
        
        postToTokenId[postId] = tokenId;
        creatorNFTs[to].push(tokenId);
        
        emit NFTAutoMinted(tokenId, postId, to, 0);
        emit RarityAssigned(tokenId, rarity);
        
        return tokenId;
    }

    /**
     * @dev Determine NFT rarity based on viral score
     * @param viralScore The viral score of the post
     * @return rarity The determined rarity level
     */
    function _determineRarity(uint256 viralScore) internal pure returns (Rarity) {
        if (viralScore >= LEGENDARY_THRESHOLD) return Rarity.Legendary;
        if (viralScore >= EPIC_THRESHOLD) return Rarity.Epic;
        if (viralScore >= RARE_THRESHOLD) return Rarity.Rare;
        return Rarity.Common;
    }

    /**
     * @dev Get NFT metadata
     * @param tokenId Token ID to query
     * @return NFTMetadata struct with all token information
     */
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return nftMetadata[tokenId];
    }

    /**
     * @dev Get NFTs owned by a creator
     * @param creator Address of the creator
     * @return Array of token IDs owned by the creator
     */
    function getCreatorNFTs(address creator) external view returns (uint256[] memory) {
        return creatorNFTs[creator];
    }

    /**
     * @dev Get NFT rarity as string
     * @param tokenId Token ID to query
     * @return Rarity as string
     */
    function getRarityString(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        Rarity rarity = nftMetadata[tokenId].rarity;
        if (rarity == Rarity.Legendary) return "Legendary";
        if (rarity == Rarity.Epic) return "Epic";
        if (rarity == Rarity.Rare) return "Rare";
        return "Common";
    }

    /**
     * @dev Get NFTs by rarity
     * @param rarity Rarity level to filter by
     * @return Array of token IDs with specified rarity
     */
    function getNFTsByRarity(Rarity rarity) external view returns (uint256[] memory) {
        uint256 totalSupply = _tokenIdCounter.current();
        uint256[] memory rarityTokens = new uint256[](totalSupply);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (nftMetadata[i].rarity == rarity && nftMetadata[i].isActive) {
                rarityTokens[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = rarityTokens[i];
        }
        
        return result;
    }

    /**
     * @dev Update NFT metadata (creator or owner only)
     * @param tokenId Token ID to update
     * @param newIpfsHash New IPFS hash for metadata
     */
    function updateMetadata(uint256 tokenId, string calldata newIpfsHash) external {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            nftMetadata[tokenId].creator == msg.sender ||
            owner() == msg.sender,
            "Not authorized to update metadata"
        );
        
        _setTokenURI(tokenId, newIpfsHash);
        nftMetadata[tokenId].ipfsHash = newIpfsHash;
        
        emit MetadataUpdated(tokenId, newIpfsHash);
    }

    /**
     * @dev Set base IPFS URI (owner only)
     * @param newBaseURI New base URI for IPFS gateway
     */
    function setBaseIPFSURI(string calldata newBaseURI) external onlyOwner {
        baseIPFSURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Update SAFE token contract address (owner only)
     * @param _safeToken New SAFE token contract address
     */
    function setSAFETokenContract(address _safeToken) external onlyOwner {
        require(_safeToken != address(0), "Invalid address");
        safeToken = ISAFEToken(_safeToken);
    }

    /**
     * @dev Get token URI with IPFS gateway
     * @param tokenId Token ID to query
     * @return Full URI with IPFS gateway
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        string memory ipfsHash = nftMetadata[tokenId].ipfsHash;
        if (bytes(ipfsHash).length > 0) {
            return string(abi.encodePacked(baseIPFSURI, ipfsHash));
        }
        
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Get contract statistics
     * @return totalMinted Total NFTs minted
     * @return legendaryCount Number of legendary NFTs
     * @return epicCount Number of epic NFTs
     * @return rareCount Number of rare NFTs
     * @return commonCount Number of common NFTs
     */
    function getContractStats() external view returns (
        uint256 totalMinted,
        uint256 legendaryCount,
        uint256 epicCount,
        uint256 rareCount,
        uint256 commonCount
    ) {
        totalMinted = _tokenIdCounter.current();
        
        for (uint256 i = 1; i <= totalMinted; i++) {
            if (nftMetadata[i].isActive) {
                Rarity rarity = nftMetadata[i].rarity;
                if (rarity == Rarity.Legendary) legendaryCount++;
                else if (rarity == Rarity.Epic) epicCount++;
                else if (rarity == Rarity.Rare) rareCount++;
                else commonCount++;
            }
        }
        
        return (totalMinted, legendaryCount, epicCount, rareCount, commonCount);
    }

    /**
     * @dev Batch mint NFTs (gas optimization)
     * @param postIds Array of post IDs to mint
     * @param ipfsHashes Array of IPFS hashes
     */
    function batchAutoMint(
        uint256[] calldata postIds,
        string[] calldata ipfsHashes
    ) external nonReentrant {
        require(postIds.length == ipfsHashes.length, "Array lengths must match");
        require(postIds.length <= 20, "Too many NFTs in batch");
        
        for (uint256 i = 0; i < postIds.length; i++) {
            autoMint(postIds[i], ipfsHashes[i]);
        }
    }

    /**
     * @dev Get NFTs eligible for minting
     * @param limit Maximum number of posts to check
     * @return eligiblePosts Array of post IDs eligible for NFT minting
     */
    function getEligibleForMinting(uint256 limit) external view returns (uint256[] memory) {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        uint256[] memory eligible = new uint256[](limit);
        uint256 count = 0;
        
        // This is a simple implementation - in production would be more efficient
        for (uint256 postId = 1; postId <= limit && count < limit; postId++) {
            if (postToTokenId[postId] == 0 && safeToken.isEligibleForNFT(postId)) {
                eligible[count] = postId;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = eligible[i];
        }
        
        return result;
    }

    /**
     * @dev Check if post has associated NFT
     * @param postId ID of the post
     * @return tokenId Token ID (0 if no NFT exists)
     */
    function getTokenIdByPost(uint256 postId) external view returns (uint256) {
        return postToTokenId[postId];
    }

    /**
     * @dev Transfer ownership with royalty update
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        _setDefaultRoyalty(newOwner, DEFAULT_ROYALTY);
        super.transferOwnership(newOwner);
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        // Mark as inactive instead of burning
        nftMetadata[tokenId].isActive = false;
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        // Implement pause functionality if needed
    }

    function unpause() external onlyOwner {
        // Implement unpause functionality if needed  
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Receive function to accept ETH
    receive() external payable {}

    fallback() external payable {}
}