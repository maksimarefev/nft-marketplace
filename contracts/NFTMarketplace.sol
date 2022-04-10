// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@m.arefev/nft/contracts/BeautifulImage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFTMarketplace is Ownable {

    struct Auction {
        uint256 bid;
        uint256 timeout;
        uint256 minPrice;
        uint256 bidsCount;
        uint256 startDate;
        address tokenOwner;
        address bidderAddress;
    }

    struct Listing {
        address tokenOwner;
        uint256 price;
    }

    IERC20 private paymentToken;
    BeautifulImage private nft;

    address public paymentTokenAddress;
    address public nftAddress;

    uint256 public auctionTimeout;
    uint256 public minBidsNumber;

    mapping(uint256 => Listing) private tokenIdToListing;
    mapping(uint256 => Auction) private tokenIdToAuction;

    /**
     * @dev Emitted when `tokenId` token is listed under the `price`
     */
    event Listed(uint256 indexed tokenId, address indexed owner, uint256 price);

    /**
     * @dev Emitted when `tokenId` token is listed on an auction under the `price`
     */
    event ListedOnAuction(uint256 indexed tokenId, address indexed owner, uint256 minPrice);

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

    constructor (uint256 _auctionTimeout, uint256 _minBidsNumber, address _paymentToken, address _nft) public {
        auctionTimeout = _auctionTimeout;
        minBidsNumber = _minBidsNumber;
        paymentTokenAddress = _paymentToken;
        nftAddress = _nft;
        paymentToken = IERC20(_paymentToken);
        nft = BeautifulImage(_nft);
    }

    /**
     * @notice mints a new nft with the provided `tokenCID` to the `tokenOwner`
     */
    function createItem(string memory tokenCID, address tokenOwner) public onlyOwner {
        nft.mint(tokenOwner, tokenCID);
    }

    /**
     * @notice lists an nft with the id `tokenId` at the price `price`
     */
    function listItem(uint256 tokenId, uint256 price) public {
        require(price > 0, "Price can not be set to 0");
        require(msg.sender == nft.ownerOf(tokenId), "Sender is not the token owner");

        nft.transferFrom(msg.sender, address(this), tokenId);

        tokenIdToListing[tokenId] = Listing(msg.sender, price);
        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @notice cancels listing for the given `tokenId`
     */
    function cancel(uint256 tokenId) public {
        Listing memory listing = tokenIdToListing[tokenId];
        require(listing.tokenOwner != address(0), "Token is not listed");
        require(listing.tokenOwner == msg.sender, "Sender is not the token owner");

        nft.transferFrom(address(this), listing.tokenOwner, tokenId);

        emit Delisted(tokenId);
        delete tokenIdToListing[tokenId];
    }

    /**
     * @notice transfers a listed nft with the `tokenId` to the `msg.sender`
     */
    function buyItem(uint256 tokenId) public {
        Listing memory listing = tokenIdToListing[tokenId];
        require(listing.price != 0, "Token is not listed");
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Insufficient sender's balance");

        nft.transferFrom(address(this), msg.sender, tokenId);
        _sendPayments(msg.sender, listing.tokenOwner, listing.price);

        emit Sold(tokenId, listing.price, msg.sender, listing.tokenOwner);
        delete tokenIdToListing[tokenId];
    }

    /**
     * @notice lists an nft with the id `tokenId` and sets a minimum trade price to `minPrice`
     */
    function listItemOnAuction(uint256 tokenId, uint256 minPrice) public {
        require(minPrice > 0, "Minimum price can not be zero");
        require(msg.sender == nft.ownerOf(tokenId), "Sender is not the token owner");

        nft.transferFrom(msg.sender, address(this), tokenId);

        tokenIdToAuction[tokenId] =
            Auction(0, block.timestamp + auctionTimeout, minPrice, 0, block.timestamp, msg.sender, address(0));
        emit ListedOnAuction(tokenId, msg.sender, minPrice);
    }

    /**
     * @notice makes a new bid for a listed nft with the `tokenId`
     */
    function makeBid(uint256 tokenId, uint256 price) public {
        Auction storage auction = tokenIdToAuction[tokenId];
        require(auction.startDate != 0, "No auction found");
        require(block.timestamp < auction.timeout, "Auction is closed");
        require(auction.minPrice <= price, "Price is less than required");
        require(auction.bid < price, "Last bid had >= price");
        require(paymentToken.balanceOf(msg.sender) >= price, "Insufficient sender's balance");

        _sendPayments(msg.sender, address(this), price);

        if (auction.bidsCount > 0) {
            _sendPayments(auction.bidderAddress, auction.bid);
        }

        auction.bidderAddress = msg.sender;
        auction.bid = price;
        auction.bidsCount += 1;
        emit BidderChanged(msg.sender, tokenId, price);
    }

    /**
     * @notice finishes started auction (if any) for an nft with the id `tokenId`
     */
    function finishAuction(uint256 tokenId) public {
        Auction storage auction = tokenIdToAuction[tokenId];
        require(auction.startDate != 0, "No auction found");
        require(block.timestamp >= auction.timeout, "Auction is in progress");

        if (auction.bidsCount < minBidsNumber) {
            if (auction.bidsCount > 0) {
                _sendPayments(auction.bidderAddress, auction.bid);
            }

            nft.transferFrom(address(this), auction.tokenOwner, tokenId);

            emit Delisted(tokenId);
        } else {
            nft.transferFrom(address(this), auction.bidderAddress, tokenId);
            _sendPayments(auction.tokenOwner, auction.bid);
            emit Sold(tokenId, auction.bid, auction.bidderAddress, auction.tokenOwner);
        }

        delete tokenIdToAuction[tokenId];
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
        minBidsNumber = _minBidsNumber;
    }

    function _sendPayments(address to, uint256 amount) internal {
        require(paymentToken.transfer(to, amount), "Payment token transfer failed");
    }

    function _sendPayments(address from, address to, uint256 amount) internal {
        require(paymentToken.transferFrom(from, to, amount), "Payment token transfer failed");
    }
}
