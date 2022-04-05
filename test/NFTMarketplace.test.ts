import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { NFTMarketplace, NFTMarketplace__factory } from "../typechain-types";
import { deployMockContract, MockContract } from "ethereum-waffle";

import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import IERC721Mintable from "../artifacts/contracts/IERC721Mintable.sol/IERC721Mintable.json";

describe("NFTMarketplace", function () {

   let bob: Signer;
   let alice: Signer;
   let nftMock: MockContract;
   let paymentTokenMock: MockContract;
   let nftMarketplace: NFTMarketplace;

    const listItem: (tokenId: number, price: number) => void = async (tokenId: number, price: number) => {
        const aliceAddress: string = await alice.getAddress();
        await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);
        await nftMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, tokenId).returns();

        await nftMarketplace.listItem(tokenId, price);
    }

    const listItemOnAuction: (tokenId: number, price: number) => void = async (tokenId: number, price: number) => {
        const aliceAddress: string = await alice.getAddress();
        await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);
        await nftMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, tokenId).returns();

        await nftMarketplace.listItemOnAuction(tokenId, price);
    }

   beforeEach("Deploying contract", async function () {
     [alice, bob] = await ethers.getSigners();

     paymentTokenMock = await deployMockContract(alice, IERC20.abi);
     nftMock = await deployMockContract(alice, IERC721Mintable.abi);

     const NFTMarketplaceFactory: NFTMarketplace__factory =
       (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;

     nftMarketplace = await NFTMarketplaceFactory.deploy(paymentTokenMock.address, nftMock.address);
   });

   describe("mint", async function() {
       it("Should allow for the owner to mint tokens", async function() {
            const tokenURI: string = "random";
            const aliceAddress: string = await alice.getAddress();
            await nftMock.mock.mint.withArgs(aliceAddress, tokenURI).returns();

            await nftMarketplace.createItem(tokenURI, aliceAddress);
       });

       it("Should not allow for non-owner to mint tokens", async function() {
            const tokenURI: string = "random";
            const aliceAddress: string = await alice.getAddress();
            await nftMock.mock.mint.withArgs(aliceAddress, tokenURI).returns();

            const mintTxPromise: Promise<any> = nftMarketplace.connect(bob).createItem(tokenURI, aliceAddress);

            await expect(mintTxPromise).to.be.revertedWith("Ownable: caller is not the owner");
       });
   });

   describe("listing", async function() {
        /*
            todo arefev:
             ✓ 1. Should not allow to list non-existent token
             ✓ 2. Should not allow to list non-belonging token
             ✓ 3. Should emit `Listed` event
             x 4. Should transfer a token => Waffle's calledOnContractWith is not supported by Hardhat
             ✓ 5. Should not allow to list with 0 price
         */
        describe("listItem", async function() {
            it("Should not allow to list non-existent token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                await nftMock.mock.ownerOf.withArgs(tokenId).revertsWithReason("ERC721: owner query for nonexistent token");

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("ERC721: owner query for nonexistent token");
            });

            it("Should not allow to list with 0 price", async function () {
                const tokenId: number = 1;
                const price: number = 0;

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("Price can not be set to 0");
            });

            it("Should not allow to list non-belonging token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const bobAddress: string = await bob.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(bobAddress);

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            it("Should emit `Listed` event", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);
                await nftMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, tokenId).returns();

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.emit(nftMarketplace, "Listed").withArgs(tokenId, aliceAddress, price);
            });
        });

        /*
            todo arefev:
                ✓ 1. Should not allow to cancel non-existent token
                ✓ 2. Should not allow to cancel non-belonging token
                ✓ 3. Should emit `Delisted` event
                x 4. Should transfer a token back to it's owner => Waffle's calledOnContractWith is not supported by Hardhat
         */
        describe("cancel", async function() {
            it("Should not allow to cancel non-existent token", async function() {
                const tokenId: number = 1;

                const cancelTxPromise: Promise<any> = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.be.revertedWith("Token does not exist");
            });

            it("Should not allow to cancel non-belonging token", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);

                const cancelTxPromise: Promise<any> = nftMarketplace.connect(bob).cancel(tokenId);

                await expect(cancelTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            it("Should emit `Delisted` event", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, tokenId).returns();

                const cancelTxPromise: Promise<any> = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.emit(nftMarketplace, "Delisted").withArgs(tokenId);
            });
        });

        /* todo arefev:
            ✓ 1. Should not allow to buy non-existent token
            ✓ 2. Should not allow to buy for sender with insufficient balance
            ✓ 3. Should emit `Sold` event
            x 4. Should transfer nft to buyer and erc20 to seller => Waffle's calledOnContractWith is not supported by Hardhat
        */
        describe("buyItem", async function() {
            it("Should not allow to buy non-existent token", async function() {
                const tokenId: number = 1;

                const buyItemTxPromise: Promise<any> = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Token does not exist");
            });

            it("Should not allow to buy for sender with insufficient balance", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const balanceOfAlice: number = 0;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(balanceOfAlice);

                const buyItemTxPromise: Promise<any> = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Insufficient sender's balance");
            });

            it("Should emit `Sold` event", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.mock.balanceOf.withArgs(bobAddress).returns(price);
                await paymentTokenMock.mock.transferFrom.withArgs(bobAddress, aliceAddress, price).returns(true);

                const buyItemTxPromise: Promise<any> = nftMarketplace.connect(bob).buyItem(tokenId);

                await expect(buyItemTxPromise).to.emit(nftMarketplace, "Sold").withArgs(tokenId, price, bobAddress, aliceAddress);
            });
        });
   });

   describe("auction listing", async function() {
        /*
            todo arefev:
             ✓ 1. Should not allow to list non-existent token
             ✓ 2. Should not allow to list non-belonging token
             ✓ 3. Should emit `ListedOnAuction` event
             x 4. Should transfer an nft to the contract => Waffle's calledOnContractWith is not supported by Hardhat
             ✓ 5. Should not allow to list with 0 minimum price
         */
        describe("listItemOnAuction", async function() {
            it("Should not allow to list non-existent token", async function() {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await nftMock.mock.ownerOf.withArgs(tokenId).revertsWithReason("ERC721: owner query for nonexistent token");

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.be.revertedWith("ERC721: owner query for nonexistent token");
            });

            it("Should not allow to list non-belonging token", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                const bobAddress: string = await bob.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(bobAddress);

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            it("Should not allow to list with 0 minimum price", async function () {
                const tokenId: number = 1;
                const minPrice: number = 0;

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.be.revertedWith("Minimum price can not be zero");
            });

            it("Should emit `ListedOnAuction` event", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);
                await nftMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, tokenId).returns();

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.emit(nftMarketplace, "ListedOnAuction").withArgs(tokenId, aliceAddress, minPrice);
            });
        });

         /*
             todo arefev:
                ✓ 1. Should not allow to make a bid if an auction has not started
                ✓ 2. Should not allow to make a bid if an auction is closed
                ✓ 3. Should not allow to make a bid if the given price is less than the minimum price
                ✓ 4. Should not allow to make a bid if the given price is less than the last bid's price
                ✓ 5. Should not allow to make a bid if the sender has no sufficient balance
                ✓ 6. Should emit `BidderChanged` event
                x 7. Should transfer payment tokens to the marketplace balance => Waffle's calledOnContractWith is not supported by Hardhat
                x 8. Should transfer payment tokens back to the last bidder => Waffle's calledOnContractWith is not supported by Hardhat
         */
        describe("makeBid", async function() {
            it("Should not allow to make a bid if an auction has not started", async function() {
                const tokenId: number = 1;
                const price: number = 1;

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, price);

                await expect(makeBidTxPromise).to.be.revertedWith("No auction found");
            });

            it("Should not allow to make a bid if an auction is closed", async function() {
                const auctionTimeout: number = 10;
                await nftMarketplace.setAuctionTimeout(auctionTimeout);
                const tokenId: number = 1;
                const price: number = 1;
                await listItemOnAuction(tokenId, price);

                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, price);

                await expect(makeBidTxPromise).to.be.revertedWith("Auction is closed");
            });

            it("Should not allow to make a bid if the given price is less than the minimum price", async function() {
                const tokenId: number = 1;
                const minPrice: number = 2;
                await listItemOnAuction(tokenId, minPrice);
                const price: number = 1;

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, price);

                await expect(makeBidTxPromise).to.be.revertedWith("Price is less than required");
            });

            it("Should not allow to make a bid if the given price is less than the last bid's price", async function() {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const firstBidPrice: number = 3;
                const secondBidPrice: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(firstBidPrice);
                await paymentTokenMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, firstBidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, firstBidPrice);
                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, secondBidPrice);

                await expect(makeBidTxPromise).to.be.revertedWith("Last bid had >= price");
            });

            it("Should not allow to make a bid if the sender has no sufficient balance", async function() {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 0;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(aliceBalance);

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, bidPrice);

                await expect(makeBidTxPromise).to.be.revertedWith("Insufficient sender's balance");
            });

            it("Should emit `BidderChanged` event", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, bidPrice).returns(true);

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, bidPrice);

                await expect(makeBidTxPromise).to.emit(nftMarketplace, "BidderChanged").withArgs(aliceAddress, tokenId, bidPrice);
            });
        });

        /*
            todo arefev:
                ✓ 1. Should not allow to finish the auction if it's still in progress
                ✓ 2. Should emit `Delisted` event if the minimum bids number treshold was not reached
                x 3. Should transfer payment tokens back to the last bidder if the minimum bids number treshold was not reached => Waffle's calledOnContractWith is not supported by Hardhat
                ✓ 4. Should emit `Sold` event on finishing the auction
                x 5. Should transfer an nft to a buyer on finishing the auction => Waffle's calledOnContractWith is not supported by Hardhat
                x 6. Should transfer payment tokens to a seller on finishing the auction => Waffle's calledOnContractWith is not supported by Hardhat
        */
        describe("finishAuction", async function() {
            it("Should not allow to finish the auction if it's still in progress", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);

                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.be.revertedWith("Auction is in progress");
            });

            it("Should emit `Delisted` event if the minimum bids number treshold was not reached", async function () {
                const auctionTimeout: number = 10;
                await nftMarketplace.setAuctionTimeout(auctionTimeout);
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, tokenId).returns();

                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.emit(nftMarketplace, "Delisted").withArgs(tokenId);
            });

            it("Should emit `Sold` event on finishing the auction", async function () {
                const auctionTimeout: number = 10;
                await nftMarketplace.setAuctionTimeout(auctionTimeout);
                const minBidsNumber: number = 1;
                await nftMarketplace.setMinBidsNumber(minBidsNumber);
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);

                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, tokenId).returns();
                await paymentTokenMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, bidPrice).returns(true);

                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.emit(nftMarketplace, "Sold")
                    .withArgs(tokenId, bidPrice, aliceAddress, aliceAddress);
            });
        });
   });
 });
