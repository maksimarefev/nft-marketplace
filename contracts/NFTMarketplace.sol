pragma solidity ^0.8.0;

import "./IERC721Mintable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFTMarketplace is Ownable {

    IERC20 private paymentToken;
    IERC721Mintable private nft;

    uint256 public auctionTimeout;
    uint256 public mindBidsNumber;

    mapping(uint256 => address) private tokenIdToOwner;

    mapping(uint256 => uint256) private tokenIdToPrice;

    mapping(uint256 => uint256) private tokenIdToBid;
    mapping(uint256 => uint256) private auctionTimeouts;
    mapping(uint256 => uint256) private tokenIdToMinPrice;
    mapping(uint256 => uint256) private tokenIdToBidsCount;
    mapping(uint256 => uint256) private tokenIdToAuctionStart;
    mapping(uint256 => address) private tokenIdToBidderAddress;

    /**
     * @dev Emitted when `tokenId` token is listed under the `price`
     */
    event Listed(uint256 indexed tokenId, uint256 price);

    /**
     * @dev Emitted when `tokenId` token is listed on an auction under the `price`
     */
    event ListedOnAuction(uint256 indexed tokenId, uint256 minPrice);

    /**
     * @dev Emitted when `tokenId` token is transferred from `buyer` to `seller` for the `price`
     */
    event Sold(uint256 indexed tokenId, uint256 price, address indexed buyer, address indexed seller);

    /**
     * @dev Emitted when `tokenId` token is delisted
     */
    event Delisted(uint256 indexed tokenId);

    /**
     * @dev Emitted when `tokenId` token listed on an auction receives new bid with the `newBidder` and `price`
     */
    event BidderChanged(address indexed newBidder, uint256 indexed tokenId, uint256 price);

    constructor (address _paymentToken, address _nft) public {
        auctionTimeout = 2 days;
        mindBidsNumber = 2;
        paymentToken = IERC20(_paymentToken);
        nft = IERC721Mintable(_nft);
    }

    /**
     * @notice mints a new nft with the provided `tokenURI` to the `tokenOwner`
     */
    function createItem(string memory tokenURI, address tokenOwner) public onlyOwner {
        nft.mint(tokenOwner, tokenURI);
    }

    /**
     * @notice lists an nft with the id `tokenId` at the price `price`
     */
    function listItem(uint256 tokenId, uint256 price) public {
        require(msg.sender == nft.ownerOf(tokenId), "Sender is not the token owner");

        nft.transferFrom(msg.sender, address(this), tokenId);

        tokenIdToPrice[tokenId] = price;
        tokenIdToOwner[tokenId] = msg.sender;
        emit Listed(tokenId, price);
    }

    /**
     * @notice cancels listing for the given `tokenId`
     */
    function cancel(uint256 tokenId) public {
        require(tokenIdToOwner[tokenId] == msg.sender, "Sender is not the token owner");

        nft.transferFrom(address(this), tokenIdToOwner[tokenId], tokenId);

        emit Delisted(tokenId);
        _clearTokenInfo(tokenId);
    }

    /**
     * @notice transfers a listed nft with the `tokenId` to the `msg.sender`
     */
    function buyItem(uint256 tokenId) public {
        require(tokenIdToPrice[tokenId] != 0, "Token does not exists");
        require(paymentToken.balanceOf(msg.sender) >= tokenIdToPrice[tokenId], "Sender does not hold sufficient balance");

        nft.transferFrom(address(this), msg.sender, tokenId);
        paymentToken.transferFrom(msg.sender, tokenIdToOwner[tokenId], tokenIdToPrice[tokenId]);

        emit Sold(tokenId, tokenIdToPrice[tokenId], msg.sender, tokenIdToOwner[tokenId]);
        _clearTokenInfo(tokenId);
    }

    /**
     * @notice lists an nft with the id `tokenId` and sets a minimum trade price to `minPrice`
     */
    function listItemOnAuction(uint256 tokenId, uint256 minPrice) public {
        require(minPrice > 0, "Minimum price can not be zero");
        require(msg.sender == nft.ownerOf(tokenId), "Sender is not the token owner");

        nft.transferFrom(msg.sender, address(this), tokenId);

        tokenIdToMinPrice[tokenId] = minPrice;
        tokenIdToOwner[tokenId] = msg.sender;
        tokenIdToAuctionStart[tokenId] = block.timestamp;
        auctionTimeouts[tokenId] = block.timestamp + auctionTimeout;
        emit ListedOnAuction(tokenId, minPrice);
    }

    /**
     * @notice makes a new bid for a listed nft with the `tokenId`
     */
    function makeBid(uint256 tokenId, uint256 price) public {
        require(tokenIdToAuctionStart[tokenId] != 0, "No auction found");
        require(tokenIdToAuctionStart[tokenId] < auctionTimeouts[tokenId], "Auction is closed");
        require(tokenIdToMinPrice[tokenId] <= price, "Price is less than required");
        require(tokenIdToBid[tokenId] < price, "Last bid was greater in price");

        require(paymentToken.balanceOf(msg.sender) >= price, "Sender does not hold sufficient balance");
        paymentToken.transferFrom(msg.sender, address(this), price);

        if (tokenIdToBidsCount[tokenId] > 0) {
            paymentToken.transferFrom(address(this), tokenIdToBidderAddress[tokenId], tokenIdToBid[tokenId]);
        }

        tokenIdToBidderAddress[tokenId] = msg.sender;
        tokenIdToBid[tokenId] = price;
        tokenIdToBidsCount[tokenId] += 1;
        emit BidderChanged(msg.sender, tokenId, price);
    }

    /**
     * @notice finishes started auction (if any) for an nft with the id `tokenId`
     */
    function finishAuction(uint256 tokenId) public {
        require(tokenIdToAuctionStart[tokenId] >= auctionTimeouts[tokenId], "Auction is in progress");

        if (tokenIdToBidsCount[tokenId] < mindBidsNumber) {
            paymentToken.transferFrom(address(this), tokenIdToBidderAddress[tokenId], tokenIdToBid[tokenId]);
            emit Delisted(tokenId);
        } else {
            nft.transferFrom(address(this), tokenIdToBidderAddress[tokenId], tokenId);
            paymentToken.transferFrom(address(this), tokenIdToOwner[tokenId], tokenIdToBid[tokenId]);
            tokenIdToOwner[tokenId] = tokenIdToBidderAddress[tokenId];
            emit Sold(tokenId, tokenIdToBid[tokenId], tokenIdToBidderAddress[tokenId], tokenIdToOwner[tokenId]);
        }

        delete tokenIdToAuctionStart[tokenId];
        delete tokenIdToMinPrice[tokenId];
        delete tokenIdToBidderAddress[tokenId];
        delete tokenIdToBid[tokenId];
        delete tokenIdToBidsCount[tokenId];
        delete tokenIdToOwner[tokenId];
        delete auctionTimeouts[tokenId];
    }

    /**
     * @notice sets the auction timeout to the `_auctionTimeout`
     */
    function setAuctionTimeout(uint256 _auctionTimeout) public onlyOwner {
        require(_auctionTimeout > 0, "Can not be zero");
        auctionTimeout = _auctionTimeout;
    }

    /**
     * @notice sets the minimum bids number to the `_minBidsNumber`
     */
    function setMinBidsNumber(uint256 _minBidsNumber) public onlyOwner {
        require(_minBidsNumber > 0, "Can not be zero");
        mindBidsNumber = _minBidsNumber;
    }

    function _clearTokenInfo(uint256 tokenId) internal {
        delete tokenIdToPrice[tokenId];
        delete tokenIdToOwner[tokenId];
    }
}
