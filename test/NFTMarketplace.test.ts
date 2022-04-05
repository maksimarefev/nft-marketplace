/*
const permissions = ['read', 'write', 'execute'] as const;
type Permission = typeof permissions[number]; // 'read' | 'write' | 'execute'

// you can iterate over permissions
for (const permission of permissions) {
  // do something
}
*/
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Event, BigNumber } from "ethers";
import { NFTMarketplace, NFTMarketplace__factory } from '../typechain-types';
import { deployMockContract, MockContract } from 'ethereum-waffle';

import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol';
import IERC721Mintable from '../artifacts/contracts/IERC721Mintable.sol/IERC721Mintable.json';

/*
    todo arefev:
    await mockContract.mock.<nameOfMethod>.returns(<value>)
    await mockContract.mock.<name>.withArgs(<args>).returns(<value>)
    await mockContract.mock.<nameOfMethod>.reverts()
    await mockContract.mock.<name>.withArgs(<args>).reverts()
*/
/*
    todo arefev:
      IERC20:
        1. balanceOf
        2. transferFrom
      IERC721Mintable:
        1. mint
        2. ownerOf
        3. transferFrom
*/
describe("NFTMarketplace", function () {

   let bob: Signer;
   let alice: Signer;
   let nft: MockContract;
   let paymentContract: MockContract;
   let nftMarketplace: NFTMarketplace;

    /*todo arefev:
        event Listed(uint256 indexed tokenId, uint256 price);
        event ListedOnAuction(uint256 indexed tokenId, uint256 minPrice);
        event Sold(uint256 indexed tokenId, uint256 price, address indexed buyer, address indexed seller);
        event Delisted(uint256 indexed tokenId);
        event BidderChanged(address indexed newBidder, uint256 indexed tokenId, uint256 price);
     */
   /*
   function assertTransferEvent(event: Event, from: string, to: string, value: number) {
       expect("Transfer").to.equal(event.event);
       expect(from).to.equal(event.args.from);
       expect(to).to.equal(event.args.to);
       expect(value).to.equal(event.args.tokenId.toNumber());
   }
   */

   beforeEach("Deploying contract", async function () {
     [alice, bob] = await ethers.getSigners();

     const paymentContract = deployMockContract(alice, IERC20.abi);
     const nft = deployMockContract(alice, MockIERC721Mintable.abi);

     const NFTMarketplaceFactory: NFTMarketplace__factory =
       (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;

     nftMarketplace = await NFTMarketplaceFactory.deploy(paymentContract.address, nft.address);
   });

    /* todo arefev:

     */
   describe("listing", async function() {
   });

    /* todo arefev:

     */
   describe("auction listing", async function() {
   });
 });
