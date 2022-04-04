pragma solidity ^0.8.0;

import "./IERC721Mintable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//todo arefev: add docs
//todo arefev: emit events
//todo arefev: fork stablecoin contract
//todo arefev: how it could be the 1155? if so, should i check it?
contract NFTMarketplace is Ownable {

    IERC20 private paymentToken;
    IERC721Mintable private nft;

    uint256 public auctionTimeout;
    uint256 public mindBidsNumber;

    mapping(uint256 => uint256) private tokenIdToAuctionStart;
    mapping(uint256 => uint256) private tokenIdToPrice;
    mapping(uint256 => uint256) private tokenIdToMinPrice;
    mapping(uint256 => address) private tokenIdToBidderAddress;
    mapping(uint256 => uint256) private tokenIdToBid;
    mapping(uint256 => uint256) private tokenIdToBidsCount;
    mapping(uint256 => address) private tokenIdToOwner;

    event Listed(uint256 indexed tokenId, uint256 price);
    event ListedOnAuction(uint256 indexed tokenId, uint256 minPrice);
    event Sold(uint256 indexed tokenId, uint256 price, address indexed buyer, address indexed seller);
    event Delisted(uint256 indexed tokenId);
    event BidderChanged(address indexed newBidder, uint256 indexed tokenId, uint256 price);

    constructor (address _paymentToken, address _nft) public {
        auctionTimeout = 2 minutes;
        mindBidsNumber = 2;
        paymentToken = IERC20(_paymentToken);
        nft = IERC721Mintable(_nft);
    }

    //todo arefev: should mint NFT (either 721 or 1155)
    //todo arefev: only the marketplace should have access to mint function
    function createItem(string memory tokenURI, address tokenOwner) {

    }

    //todo arefev: this function should send the token to NFTMarketplace contract
    function listItem(uint256 tokenId, uint256 price) {

    }

    //todo arefev: should work only if nobody bought that token
    //todo arefev: should throw if there is an auction in proggress
    function cancel(uint256 tokenId) {

    }

    function buyItem(uint256 tokenId) {
        require(tokenIdToPrice[tokenId] != 0, "todo arefev: create a message");
        require(tokenIdToAuctionStart[tokenId] == 0, "todo arefev: create a message");
        require(paymentToken.balanceOf(msg.sender) >= tokenIdToPrice[tokenId], "todo arefev: create a message");

        nft.transferFrom(tokenIdToOwner[tokenId], msg.sender, tokenId);
        paymentToken.transferFrom(msg.sender, tokenIdToOwner[tokenId], tokenIdToPrice[tokenId]);
        tokenIdToOwner[tokenId] = msg.sender;
    }

    //todo arefev: minPrice => require the bid to be gte than it
    function listItemOnAuction(uint256 tokenId, uint256 minPrice) {

    }

    function makeBid(uint256 tokenId, uint256 price) {
        require(tokenIdToAuctionStart[tokenId] != 0, "todo arefev: create a message");
        require(tokenIdToMinPrice[tokenId] <= price, "todo arefev: create a message");
        require(tokenIdToBid[tokenId] < price, "todo arefev: create a message");

        require(paymentToken.balanceOf(msg.sender) >= price, "todo arefev: create a message");
        paymentToken.transferFrom(msg.sender, address(this), price);
        paymentToken.transferFrom(address(this), tokenIdToBidderAddress[tokenId], tokenIdToBid[tokenId]);

        tokenIdToBidderAddress[tokenId] = msg.sender;
        tokenIdToBid[tokenId] = price;
        tokenIdToBidsCount[tokenId] += 1;
    }

    function finishAuction(uint256 tokenId) {
        require(tokenIdToAuctionStart[tokenId] >= block.timestamp + auctionTimeout, "todo arefev: create a message");

        if (tokenIdToBidsCount < mindBidsNumber) {
            paymentToken.transferFrom(address(this), tokenIdToBidderAddress[tokenId], tokenIdToBid[tokenId]);
        } else {
            nft.transferFrom(tokenIdToOwner[tokenId], tokenIdToBidderAddress[tokenId], tokenId);
            paymentToken.transferFrom(address(this), tokenIdToOwner[tokenId], tokenIdToBid[tokenId]);
            tokenIdToOwner[tokenId] = tokenIdToBidderAddress[tokenId];
        }

        delete tokenIdToBidderAddress[tokenId];
        delete tokenIdToBid[tokenId];
        delete tokenIdToMinPrice[tokenId];
        delete tokenIdToAuctionStart[tokenId];
    }

    function setAuctionTimeout(uint256 _auctionTimeout) onlyOwner {
        require(_auctionTimeout > 0, "todo arefev: create a message");
        auctionTimeout = _auctionTimeout;
    }

    function setMinBidsNumber(uint256 _minBidsNumber) onlyOwner {
        require(_minBidsNumber > 0, "todo arefev: create a message");
        mindBidsNumber = _minBidsNumber;
    }
}
