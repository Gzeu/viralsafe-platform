// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SAFEToken
 * @dev ERC-20 token for ViralSafe platform with voting and staking capabilities
 * 
 * Features:
 * - Standard ERC-20 functionality
 * - Voting system for viral content
 * - Staking with rewards
 * - Governance capabilities
 * - Anti-spam protection
 */
contract SAFEToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Token details
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 400_000_000 * 10**18; // 400M for community
    
    // Distribution allocations
    uint256 public constant COMMUNITY_ALLOCATION = 400_000_000 * 10**18; // 40%
    uint256 public constant CREATOR_ALLOCATION = 300_000_000 * 10**18;   // 30%
    uint256 public constant DEVELOPMENT_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant MARKETING_ALLOCATION = 100_000_000 * 10**18;  // 10%
    uint256 public constant TEAM_ALLOCATION = 50_000_000 * 10**18;        // 5%

    // Voting system
    struct Vote {
        address voter;
        uint256 postId;
        bool support; // true = upvote, false = downvote
        uint256 amount;
        uint256 timestamp;
    }

    // Staking system
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    // Post tracking for viral scoring
    struct Post {
        address creator;
        uint256 totalVotes;
        uint256 upVotes;
        uint256 downVotes;
        uint256 viralScore;
        bool isActive;
        uint256 createdAt;
    }

    // State variables
    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => Post) public posts;
    mapping(address => mapping(uint256 => Vote)) public userVotes;
    mapping(address => uint256[]) public userVoteHistory;
    mapping(address => bool) public authorizedVoters;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 50; // 5% APY (50 basis points)
    uint256 public minVoteAmount = 10 * 10**18; // Minimum 10 SAFE to vote
    uint256 public viralThreshold = 1000; // Viral score threshold for NFT minting
    uint256 public nextPostId = 1;
    
    address public viralNFTContract;
    address public treasuryWallet;
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed creator);
    event VoteCast(address indexed voter, uint256 indexed postId, bool support, uint256 amount);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event ViralScoreUpdated(uint256 indexed postId, uint256 newScore);
    event NFTMintTriggered(uint256 indexed postId, address indexed creator);

    constructor(
        address _owner,
        address _treasuryWallet
    ) ERC20("ViralSafe Token", "SAFE") {
        require(_owner != address(0), "Invalid owner address");
        require(_treasuryWallet != address(0), "Invalid treasury address");
        
        treasuryWallet = _treasuryWallet;
        _transferOwnership(_owner);
        
        // Mint initial supply to owner for distribution
        _mint(_owner, INITIAL_SUPPLY);
    }

    /**
     * @dev Create a new post for voting
     * @param creator Address of the content creator
     * @return postId The ID of the created post
     */
    function createPost(address creator) external onlyOwner returns (uint256) {
        require(creator != address(0), "Invalid creator address");
        
        uint256 postId = nextPostId++;
        posts[postId] = Post({
            creator: creator,
            totalVotes: 0,
            upVotes: 0,
            downVotes: 0,
            viralScore: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit PostCreated(postId, creator);
        return postId;
    }

    /**
     * @dev Vote on a post with SAFE tokens
     * @param postId ID of the post to vote on
     * @param support True for upvote, false for downvote
     * @param amount Amount of SAFE tokens to use for voting
     */
    function voteOnPost(
        uint256 postId, 
        bool support, 
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(posts[postId].isActive, "Post not found or inactive");
        require(amount >= minVoteAmount, "Insufficient vote amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(userVotes[msg.sender][postId].amount == 0, "Already voted on this post");
        
        // Transfer tokens to contract (they'll be redistributed as rewards)
        _transfer(msg.sender, address(this), amount);
        
        // Record vote
        userVotes[msg.sender][postId] = Vote({
            voter: msg.sender,
            postId: postId,
            support: support,
            amount: amount,
            timestamp: block.timestamp
        });
        
        userVoteHistory[msg.sender].push(postId);
        
        // Update post statistics
        Post storage post = posts[postId];
        post.totalVotes = post.totalVotes.add(amount);
        
        if (support) {
            post.upVotes = post.upVotes.add(amount);
        } else {
            post.downVotes = post.downVotes.add(amount);
        }
        
        // Calculate viral score (upvotes * 2 - downvotes)
        post.viralScore = post.upVotes.mul(2).sub(post.downVotes);
        
        emit VoteCast(msg.sender, postId, support, amount);
        emit ViralScoreUpdated(postId, post.viralScore);
        
        // Check if post reaches viral threshold for NFT minting
        if (post.viralScore >= viralThreshold * 10**18 && viralNFTContract != address(0)) {
            emit NFTMintTriggered(postId, post.creator);
        }
        
        // Reward the creator with a portion of the vote
        uint256 creatorReward = amount.mul(20).div(100); // 20% to creator
        if (support && creatorReward > 0) {
            _transfer(address(this), post.creator, creatorReward);
        }
    }

    /**
     * @dev Stake SAFE tokens to earn rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim pending rewards before updating stake
        if (stakes[msg.sender].amount > 0) {
            _claimStakingReward();
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking info
        stakes[msg.sender].amount = stakes[msg.sender].amount.add(amount);
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].rewardDebt = 0;
        
        totalStaked = totalStaked.add(amount);
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Calculate and claim rewards
        uint256 reward = _calculateStakingReward(msg.sender);
        
        // Update staking info
        stakes[msg.sender].amount = stakes[msg.sender].amount.sub(amount);
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].rewardDebt = 0;
        
        totalStaked = totalStaked.sub(amount);
        
        // Transfer unstaked tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        // Transfer reward if available
        if (reward > 0 && balanceOf(address(this)) >= reward) {
            _transfer(address(this), msg.sender, reward);
        }
        
        emit Unstaked(msg.sender, amount, reward);
    }

    /**
     * @dev Claim staking rewards without unstaking
     */
    function claimStakingReward() external nonReentrant {
        require(stakes[msg.sender].amount > 0, "No staked tokens");
        _claimStakingReward();
    }

    /**
     * @dev Internal function to claim staking rewards
     */
    function _claimStakingReward() internal {
        uint256 reward = _calculateStakingReward(msg.sender);
        
        if (reward > 0 && balanceOf(address(this)) >= reward) {
            stakes[msg.sender].rewardDebt = stakes[msg.sender].rewardDebt.add(reward);
            stakes[msg.sender].timestamp = block.timestamp;
            
            _transfer(address(this), msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev Calculate staking reward for a user
     * @param user Address of the staker
     * @return reward Amount of reward tokens
     */
    function _calculateStakingReward(address user) internal view returns (uint256) {
        if (stakes[user].amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp.sub(stakes[user].timestamp);
        uint256 rewardPerSecond = stakes[user].amount.mul(rewardRate).div(10000).div(365 days);
        uint256 reward = rewardPerSecond.mul(stakingDuration);
        
        return reward;
    }

    /**
     * @dev Get post information
     * @param postId ID of the post
     * @return Post struct with all information
     */
    function getPost(uint256 postId) external view returns (Post memory) {
        return posts[postId];
    }

    /**
     * @dev Get user's vote on a specific post
     * @param user Address of the voter
     * @param postId ID of the post
     * @return Vote struct with vote information
     */
    function getUserVote(address user, uint256 postId) external view returns (Vote memory) {
        return userVotes[user][postId];
    }

    /**
     * @dev Get user's staking information
     * @param user Address of the staker
     * @return amount Current staked amount
     * @return timestamp When the stake was last updated
     * @return pendingReward Current pending reward
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount, 
        uint256 timestamp, 
        uint256 pendingReward
    ) {
        StakeInfo memory stakeInfo = stakes[user];
        uint256 reward = _calculateStakingReward(user);
        
        return (stakeInfo.amount, stakeInfo.timestamp, reward);
    }

    /**
     * @dev Set the ViralNFT contract address
     * @param _viralNFTContract Address of the ViralNFT contract
     */
    function setViralNFTContract(address _viralNFTContract) external onlyOwner {
        require(_viralNFTContract != address(0), "Invalid contract address");
        viralNFTContract = _viralNFTContract;
    }

    /**
     * @dev Update reward rate (only owner)
     * @param _newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 1000, "Reward rate too high"); // Max 10%
        rewardRate = _newRate;
    }

    /**
     * @dev Update minimum vote amount
     * @param _minAmount New minimum vote amount
     */
    function updateMinVoteAmount(uint256 _minAmount) external onlyOwner {
        minVoteAmount = _minAmount;
    }

    /**
     * @dev Update viral threshold for NFT minting
     * @param _threshold New viral threshold
     */
    function updateViralThreshold(uint256 _threshold) external onlyOwner {
        viralThreshold = _threshold;
    }

    /**
     * @dev Emergency withdraw function for owner
     * @param amount Amount to withdraw to treasury
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= balanceOf(address(this)), "Insufficient contract balance");
        _transfer(address(this), treasuryWallet, amount);
    }

    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Mint new tokens (for future token releases)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply().add(amount) <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @dev Get user's voting history
     * @param user Address of the user
     * @return Array of post IDs the user has voted on
     */
    function getUserVoteHistory(address user) external view returns (uint256[] memory) {
        return userVoteHistory[user];
    }

    /**
     * @dev Check if user has voted on a specific post
     * @param user Address of the user
     * @param postId ID of the post
     * @return Boolean indicating if user has voted
     */
    function hasUserVoted(address user, uint256 postId) external view returns (bool) {
        return userVotes[user][postId].amount > 0;
    }

    /**
     * @dev Get viral score for a post
     * @param postId ID of the post
     * @return Current viral score
     */
    function getViralScore(uint256 postId) external view returns (uint256) {
        return posts[postId].viralScore;
    }

    /**
     * @dev Check if post is eligible for NFT minting
     * @param postId ID of the post
     * @return Boolean indicating if post can be minted as NFT
     */
    function isEligibleForNFT(uint256 postId) external view returns (bool) {
        return posts[postId].viralScore >= viralThreshold * 10**18;
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Batch vote on multiple posts (gas optimization)
     * @param postIds Array of post IDs
     * @param supports Array of vote directions
     * @param amounts Array of vote amounts
     */
    function batchVote(
        uint256[] calldata postIds,
        bool[] calldata supports,
        uint256[] calldata amounts
    ) external {
        require(
            postIds.length == supports.length && supports.length == amounts.length,
            "Array lengths must match"
        );
        require(postIds.length <= 10, "Too many votes in batch");
        
        for (uint256 i = 0; i < postIds.length; i++) {
            voteOnPost(postIds[i], supports[i], amounts[i]);
        }
    }

    /**
     * @dev Get top viral posts
     * @param limit Number of posts to return
     * @return Array of post IDs sorted by viral score
     */
    function getTopPosts(uint256 limit) external view returns (uint256[] memory) {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        // Simple implementation - in production would use more efficient sorting
        uint256[] memory topPosts = new uint256[](limit);
        uint256 count = 0;
        
        // Find posts with highest viral scores
        for (uint256 i = 1; i < nextPostId && count < limit; i++) {
            if (posts[i].isActive && posts[i].viralScore > 0) {
                topPosts[count] = i;
                count++;
            }
        }
        
        return topPosts;
    }

    /**
     * @dev Get contract statistics
     * @return totalPosts Total number of posts created
     * @return totalVotesCast Total votes cast across all posts
     * @return totalStakedAmount Total tokens currently staked
     * @return averageViralScore Average viral score across active posts
     */
    function getContractStats() external view returns (
        uint256 totalPosts,
        uint256 totalVotesCast,
        uint256 totalStakedAmount,
        uint256 averageViralScore
    ) {
        totalPosts = nextPostId - 1;
        totalStakedAmount = totalStaked;
        
        uint256 totalViralScore = 0;
        uint256 activePosts = 0;
        
        for (uint256 i = 1; i < nextPostId; i++) {
            if (posts[i].isActive) {
                totalVotesCast = totalVotesCast.add(posts[i].totalVotes);
                totalViralScore = totalViralScore.add(posts[i].viralScore);
                activePosts++;
            }
        }
        
        averageViralScore = activePosts > 0 ? totalViralScore.div(activePosts) : 0;
        
        return (totalPosts, totalVotesCast, totalStakedAmount, averageViralScore);
    }
}