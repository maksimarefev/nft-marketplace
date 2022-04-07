## Overview
The simple implentation of NFT marketplace. Allows trading and running auctions for ERC721 tokens.

## Configuring a secret
In the root folder create *.env* file and fill it the following properties:<br/>
```
{
    ALCHEMY_API_KEY=[ALCHEMY API KEY]
    PRIVATE_KEY=[YOUR ACCOUNT's PRIVATE KEY]
}
```

## How to deploy
1. From the root folder run ``` npm run deploy ```
2. Save the contract address for future interactions

## How to verify the contract
1. Add the following property to the *.env* file:<br/>
```
    ETHERSCAN_API_KEY=[YOUR ETHERSCAN APY KEY]
```
2. From the root folder run ``` npm run verify -- [contract address] [constructor arguments] ```<br/>Example:<br/>```npm run verify -- 0xe1401E3EB44fdB1743FBC7DAe0773BB6A3C991ca 259200 3 0xF468ba4C0846e712Bc4E0387aD5bfF0eAD4cBdB5 0x7F3AB1C685596509A5B592CEfBf68e5c503C2054 ```

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
      √ Should allow for the owner to mint tokens (59ms)
      √ Should not allow for non-owner to mint tokens (42ms)
    listing
      listItem
        √ Should not allow to list non-existent token (41ms)
        √ Should not allow to list with 0 price
        √ Should not allow to list non-belonging token
        √ Should emit `Listed` event (47ms)
        √ Should transfer a token to the contract (46ms)
      cancel
        √ Should not allow to cancel non-existent token
        √ Should not allow to cancel non-belonging token (59ms)
        √ Should emit `Delisted` event (79ms)
        √ Should transfer a token back to it's owner (76ms)
      buyItem
        √ Should not allow to buy non-existent token
        √ Should not allow to buy for sender with insufficient balance (60ms)
        √ Should emit `Sold` event (78ms)
        √ Should not allow to buy when payment token contract fails at transferring (71ms)
        √ Should transfer nft to buyer (77ms)
        √ Should transfer payment tokens to seller (79ms)
    auction listing
      listItemOnAuction
        √ Should not allow to list non-existent token
        √ Should not allow to list non-belonging token
        √ Should not allow to list with 0 minimum price
        √ Should emit `ListedOnAuction` event (47ms)
        √ Should transfer an nft to the contract (48ms)
      makeBid
        √ Should not allow to make a bid if an auction has not started
        √ Should not allow to make a bid if an auction is closed (58ms)
        √ Should not allow to make a bid if the given price is less than the minimum price (57ms)
        √ Should not allow to make a bid if the given price is less than the last bid's price (90ms)
        √ Should not allow to make a bid if the sender has no sufficient balance (64ms)
        √ Should emit `BidderChanged` event (79ms)
        √ Should not allow to make a bid if the payment token contract failed at transferring (65ms)
        √ Should transfer payment tokens to the marketplace balance (79ms)
        √ Should transfer payment tokens back to the last bidder (93ms)
      finishAuction
        √ Should not allow to finish the auction if it's still in progress (57ms)
        √ Should emit `Delisted` event if the minimum bids number threshold was not reached (108ms)
        √ Should emit `Sold` event on finishing the auction (127ms)
        √ Should transfer payment tokens back to the last bidder if the minimum bids number threshold was not reached (109ms)
        √ Should transfer an nft to a buyer on finishing the auction (124ms)
        √ Should transfer payment tokens to a seller on finishing the auction (125ms)
    misc
      √ Should not allow to set auction timeout to 0
      √ Should not allow to change auction timeout (40ms)
      √ Should not allow to minimum bids number to 0
      √ Should not allow to change minimum bids number

  41 passing (6s)
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
