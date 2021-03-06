## Overview
The simple implentation of NFT marketplace. Allows trading and running auctions for ERC721 tokens.

## Configuring a secret
In the root folder create *.env* file and fill it the following properties:<br/>
```
{
    ALCHEMY_API_KEY=[ALCHEMY API KEY]
    PRIVATE_KEY=[YOUR ACCOUNT's PRIVATE KEY]
    ETHERSCAN_API_KEY=[YOUR ETHERSCAN APY KEY]
}
```

## How to deploy
1. From the root folder run ``` npm run deploy ```
2. Save the contract address for future interactions

## How to run a task
From the root folder run<br/>``` npx hardhat [task name] --network rinkeby --contract-address [contract address] --argument [argument value] ```<br/>Example:<br/>``` npx hardhat createItem --network rinkeby --contract-address 0xa9F8A1d1235De819CA9F0419AB257071e467fBb9 --token-identifier QmVW8oSySifTBDBvkTGC7J5r9UDCJ4Ndiig6B3EHvURt5S --token-owner 0x12D8F31923Aa0ACC543b96733Bc0ed348Ef44970 ```

## The list of available tasks
| Task name  | Description                                                             | Options                                                                                                                                                |
|------------|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| createItem | Mints a new nft with the provided `tokenIdentifier` to the `tokenOwner` | --contract-address => An address of a contract</br>--tokenIdentifier => A CID of a token's metadata file in IPFS</br>--tokenOwner => A new token owner |

## How to run tests and evaluate the coverage
From the root folder run ``` npx hardhat coverage ```
## Current test and coverage results for *i7-8550U 1.80GHz/16Gb RAM/WIN10 x64*
```
NFTMarketplace
    mint
      √ Should allow for the owner to mint tokens (66ms)
      √ Should not allow for non-owner to mint tokens (45ms)
    listing
      listItem
        √ Should not allow to list non-existent token
        √ Should not allow to list with 0 price
        √ Should not allow to list non-belonging token
        √ Should emit `Listed` event (42ms)
        √ Should transfer a token to the contract (51ms)
      cancel
        √ Should not allow to cancel non-existent token
        √ Should not allow to cancel non-belonging token (47ms)
        √ Should emit `Delisted` event (99ms)
        √ Should transfer a token back to it's owner (67ms)
      buyItem
        √ Should not allow to buy non-existent token
        √ Should not allow to buy for sender with insufficient balance (64ms)
        √ Should emit `Sold` event (91ms)
        √ Should not allow to buy when payment token contract fails at transferring (65ms)
        √ Should transfer nft to buyer (70ms)
        √ Should transfer payment tokens to seller (70ms)
    auction listing
      listItemOnAuction
        √ Should not allow to list non-existent token
        √ Should not allow to list non-belonging token
        √ Should not allow to list with 0 minimum price
        √ Should emit `ListedOnAuction` event (47ms)
        √ Should transfer an nft to the contract (38ms)
      makeBid
        √ Should not allow to make a bid if an auction has not started
        √ Should not allow to make a bid if an auction is closed (57ms)
        √ Should not allow to make a bid if the given price is less than the minimum price (64ms)
        √ Should not allow to make a bid if the given price is less than the last bid's price (81ms)
        √ Should not allow to make a bid if the sender has no sufficient balance (64ms)
        √ Should emit `BidderChanged` event (82ms)
        √ Should not allow to make a bid if the payment token contract failed at transferring tokens from bidder to contract (70ms)
        √ Should not allow to make a bid if the payment token contract failed at transferring tokens from contract to bidder (95ms)
        √ Should transfer payment tokens to the marketplace balance (58ms)
        √ Should transfer payment tokens back to the last bidder (129ms)
      finishAuction
        √ Should not allow to finish the auction if it's still in progress (66ms)
        √ Should emit `Delisted` event if the minimum bids number threshold was not reached (84ms)
        √ Should emit `Sold` event on finishing the auction (138ms)
        √ Should transfer payment tokens back to the last bidder if the minimum bids number threshold was not reached (127ms)
        √ Should transfer an nft to a buyer on finishing the auction (142ms)
        √ Should transfer payment tokens to a seller on finishing the auction (149ms)
    misc
      √ Should not allow to set auction timeout to 0
      √ Should not allow to change auction timeout (40ms)
      √ Should not allow to minimum bids number to 0
      √ Should not allow to change minimum bids number (60ms)

  42 passing (7s)
```
| File                   | % Stmts    | % Branch   | % Funcs    | % Lines    | Uncovered Lines  |
|------------------------|------------|------------|------------|------------|------------------|
| contracts\             | 100        | 100        | 100        | 100        |                  |
| IERC721Mintable.sol    | 100        | 100        | 100        | 100        |                  |
| NFTMarketplace.sol     | 100        | 100        | 100        | 100        |                  |
| ---------------------- | ---------- | ---------- | ---------- | ---------- | ---------------- |
| All files              | 100        | 100        | 100        | 100        |                  |

## Project dependencies
* @defi-wonderland/smock#2.0.7
* @m.arefev/nft#1.0.1
* @nomiclabs/ethereumjs-vm#4.2.2
* @nomiclabs/hardhat-ethers#2.0.5
* @nomiclabs/hardhat-etherscan#3.0.3
* @nomiclabs/hardhat-waffle#2.0.3
* @nomiclabs/hardhat-web3#2.0.0
* @openzeppelin/contracts#4.5.0
* @typechain/ethers-v5#10.0.0
* @typechain/hardhat#6.0.0
* @types/chai#4.3.0
* @types/mocha#9.1.0
* @types/node#17.0.23
* @typescript-eslint/eslint-plugin#5.18.0
* @typescript-eslint/parser#5.18.0
* chai#4.3.6
* dotenv#16.0.0
* eslint#8.12.0
* ethereum-waffle#3.4.4
* hardhat#2.9.2
* solhint#3.3.7
* solidity-coverage#0.7.20
* ts-node#10.7.0
* typechain#8.0.0
* typescript#4.6.3
