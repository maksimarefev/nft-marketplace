import { expect, use } from "chai";
import { Signer, Contract, BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { NFTMarketplace, NFTMarketplace__factory } from "../typechain-types";

import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import BeautifulImage from "../artifacts/@m.arefev/nft/contracts/BeautifulImage.sol/BeautifulImage.json";

use(smock.matchers);

describe("NFTMarketplace", function () {

   const minBidsNumber: number = 3;
   const auctionTimeout: number = 3 * 24 * 60 * 60; //3 days

   let bob: Signer;
   let alice: Signer;
   let nftMock: FakeContract<Contract>;
   let paymentTokenMock: FakeContract<Contract>;
   let nftMarketplace: NFTMarketplace;

    const listItem: (tokenId: number, price: number) => void = async (tokenId: number, price: number) => {
        const aliceAddress: string = await alice.getAddress();
        await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
        await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

        await nftMarketplace.listItem(tokenId, price);
    }

    const listItemOnAuction: (tokenId: number, price: number) => void = async (tokenId: number, price: number) => {
        const aliceAddress: string = await alice.getAddress();
        await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
        await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

        await nftMarketplace.listItemOnAuction(tokenId, price);
    }

   beforeEach("Deploying contract", async function () {
     [alice, bob] = await ethers.getSigners();

     paymentTokenMock = await smock.fake(IERC20.abi);
     nftMock = await smock.fake(BeautifulImage.abi);

     const NFTMarketplaceFactory: NFTMarketplace__factory =
       (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;

     nftMarketplace =
        await NFTMarketplaceFactory.deploy(auctionTimeout, minBidsNumber, paymentTokenMock.address, nftMock.address);
   });

   describe("mint", async function() {
       it("Should allow for the owner to mint tokens", async function() {
            const tokenURI: string = "random";
            const aliceAddress: string = await alice.getAddress();
            await nftMock.mint.whenCalledWith(aliceAddress, tokenURI).returns();

            await nftMarketplace.createItem(tokenURI, aliceAddress);
       });

       it("Should not allow for non-owner to mint tokens", async function() {
            const tokenURI: string = "random";
            const aliceAddress: string = await alice.getAddress();
            await nftMock.mint.whenCalledWith(aliceAddress, tokenURI).returns();

            const mintTxPromise: Promise<any> = nftMarketplace.connect(bob).createItem(tokenURI, aliceAddress);

            await expect(mintTxPromise).to.be.revertedWith("Ownable: caller is not the owner");
       });
   });

   describe("listing", async function() {
        describe("listItem", async function() {
            it("Should not allow to list non-existent token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                await nftMock.ownerOf.whenCalledWith(tokenId).reverts("ERC721: owner query for nonexistent token");

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.reverted;
                //await expect(listItemTxPromise).to.be.revertedWith("ERC721: owner query for nonexistent token"); //todo arefev
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
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(bobAddress);

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            it("Should emit `Listed` event", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
                await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

                const listItemTxPromise: Promise<any> = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.emit(nftMarketplace, "Listed").withArgs(tokenId, aliceAddress, price);
            });

            it("Should transfer a token to the contract", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
                await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

                await nftMarketplace.listItem(tokenId, price);

                expect(nftMock.transferFrom).to.be.calledOnceWith(aliceAddress, nftMarketplace.address, tokenId);
            });
        });

        describe("cancel", async function() {
            it("Should not allow to cancel non-existent token", async function() {
                const tokenId: number = 1;

                const cancelTxPromise: Promise<any> = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.be.revertedWith("Token is not listed");
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
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();

                const cancelTxPromise: Promise<any> = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.emit(nftMarketplace, "Delisted").withArgs(tokenId);
            });

            it("Should transfer a token back to it's owner", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                nftMock.transferFrom.reset();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();

                await nftMarketplace.cancel(tokenId);

                expect(nftMock.transferFrom).to.be.calledOnceWith(nftMarketplace.address, aliceAddress, tokenId);
            });
        });

        describe("buyItem", async function() {
            it("Should not allow to buy non-existent token", async function() {
                const tokenId: number = 1;

                const buyItemTxPromise: Promise<any> = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Token is not listed");
            });

            it("Should not allow to buy for sender with insufficient balance", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const balanceOfAlice: number = 0;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(balanceOfAlice);

                const buyItemTxPromise: Promise<any> = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Insufficient sender's balance");
            });

            it("Should emit `Sold` event", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(bobAddress).returns(price);
                await paymentTokenMock.transferFrom.whenCalledWith(bobAddress, aliceAddress, price).returns(true);

                const buyItemTxPromise: Promise<any> = nftMarketplace.connect(bob).buyItem(tokenId);

                await expect(buyItemTxPromise).to.emit(nftMarketplace, "Sold").withArgs(tokenId, price, bobAddress, aliceAddress);
            });

            it("Should not allow to buy when payment token contract fails at transferring", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(bobAddress).returns(price);
                await paymentTokenMock.transferFrom.whenCalledWith(bobAddress, aliceAddress, price).returns(false);

                const buyItemTxPromise: Promise<any> = nftMarketplace.connect(bob).buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Payment token transfer failed");
            });

            it("Should transfer nft to buyer", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(bobAddress).returns(price);
                await paymentTokenMock.transferFrom.whenCalledWith(bobAddress, aliceAddress, price).returns(true);

                await nftMarketplace.connect(bob).buyItem(tokenId);

                expect(nftMock.transferFrom).to.be.calledWith(nftMarketplace.address, bobAddress, tokenId);
            });

            it("Should transfer payment tokens to seller", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(bobAddress).returns(price);
                await paymentTokenMock.transferFrom.whenCalledWith(bobAddress, aliceAddress, price).returns(true);

                await nftMarketplace.connect(bob).buyItem(tokenId);

                expect(paymentTokenMock.transferFrom).to.be.calledWith(bobAddress, aliceAddress, price);
            });
        });
   });

   describe("auction listing", async function() {
        describe("listItemOnAuction", async function() {
            it("Should not allow to list non-existent token", async function() {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await nftMock.ownerOf.whenCalledWith(tokenId).reverts("ERC721: owner query for nonexistent token");

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.be.reverted; //todo arefev
                //await expect(listItemOnAuctionTxPromise).to.be.revertedWith("ERC721: owner query for nonexistent token");
            });

            it("Should not allow to list non-belonging token", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                const bobAddress: string = await bob.getAddress();
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(bobAddress);

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
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
                await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

                const listItemOnAuctionTxPromise: Promise<any> = nftMarketplace.listItemOnAuction(tokenId, minPrice);

                await expect(listItemOnAuctionTxPromise).to.emit(nftMarketplace, "ListedOnAuction").withArgs(tokenId, aliceAddress, minPrice);
            });

            it("Should transfer an nft to the contract", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.ownerOf.whenCalledWith(tokenId).returns(aliceAddress);
                await nftMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, tokenId).returns();

                await nftMarketplace.listItemOnAuction(tokenId, minPrice);

                expect(nftMock.transferFrom).to.be.calledOnceWith(aliceAddress, nftMarketplace.address, tokenId);
            });
        });

         describe("makeBid", async function() {
            it("Should not allow to make a bid if an auction has not started", async function() {
                const tokenId: number = 1;
                const price: number = 1;

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, price);

                await expect(makeBidTxPromise).to.be.revertedWith("No auction found");
            });

            it("Should not allow to make a bid if an auction is closed", async function() {
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
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(firstBidPrice);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, firstBidPrice).returns(true);

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
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);

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
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, bidPrice);

                await expect(makeBidTxPromise).to.emit(nftMarketplace, "BidderChanged").withArgs(aliceAddress, tokenId, bidPrice);
            });

            it("Should not allow to make a bid if the payment token contract failed at transferring", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(false);

                const makeBidTxPromise: Promise<any> = nftMarketplace.makeBid(tokenId, bidPrice);

                await expect(makeBidTxPromise).to.be.revertedWith("Payment token transfer failed");
            });

            it("Should transfer payment tokens to the marketplace balance", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);

                expect(paymentTokenMock.transferFrom).to.be.calledOnceWith(aliceAddress, nftMarketplace.address, bidPrice);
            });

            it("Should transfer payment tokens back to the last bidder", async function() {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const firstBidPrice: number = 3;
                const secondBidPrice: number = 4;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(secondBidPrice);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, firstBidPrice).returns(true);
                await paymentTokenMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, firstBidPrice).returns(true);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, secondBidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, firstBidPrice);
                await nftMarketplace.makeBid(tokenId, secondBidPrice);

                expect(paymentTokenMock.transferFrom).to.be.calledWith(nftMarketplace.address, aliceAddress, firstBidPrice);
            });
        });

        describe("finishAuction", async function() {
            it("Should not allow to finish the auction if it's still in progress", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);

                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.be.revertedWith("Auction is in progress");
            });

            it("Should emit `Delisted` event if the minimum bids number threshold was not reached", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const aliceAddress: string = await alice.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();

                await network.provider.send("evm_increaseTime", [auctionTimeout + 1]);
                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.emit(nftMarketplace, "Delisted").withArgs(tokenId);
            });

            it("Should emit `Sold` event on finishing the auction", async function () {
                const minBidsNumber: number = 1;
                await nftMarketplace.setMinBidsNumber(minBidsNumber);
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);

                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();
                await paymentTokenMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, bidPrice).returns(true);

                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                const finishAuctionTxPromise: Promise<any> = nftMarketplace.finishAuction(tokenId);

                await expect(finishAuctionTxPromise).to.emit(nftMarketplace, "Sold")
                    .withArgs(tokenId, bidPrice, aliceAddress, aliceAddress);
            });

            it("Should transfer payment tokens back to the last bidder if the minimum bids number threshold was not reached", async function () {
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);
                await paymentTokenMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);
                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                await nftMarketplace.finishAuction(tokenId);

                expect(paymentTokenMock.transferFrom).to.be.calledWith(nftMarketplace.address, aliceAddress, bidPrice);
            });

            it("Should transfer an nft to a buyer on finishing the auction", async function () {
                const minBidsNumber: number = 1;
                await nftMarketplace.setMinBidsNumber(minBidsNumber);
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);
                await paymentTokenMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);
                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                await nftMarketplace.finishAuction(tokenId);

                expect(nftMock.transferFrom).to.be.calledWith(nftMarketplace.address, aliceAddress, tokenId);
            });

            it("Should transfer payment tokens to a seller on finishing the auction", async function () {
                const minBidsNumber: number = 1;
                await nftMarketplace.setMinBidsNumber(minBidsNumber);
                const tokenId: number = 1;
                const minPrice: number = 1;
                await listItemOnAuction(tokenId, minPrice);
                const bidPrice: number = 2;
                const aliceBalance: number = 2;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, tokenId).returns();
                await paymentTokenMock.balanceOf.whenCalledWith(aliceAddress).returns(aliceBalance);
                await paymentTokenMock.transferFrom.whenCalledWith(aliceAddress, nftMarketplace.address, bidPrice).returns(true);
                await paymentTokenMock.transferFrom.whenCalledWith(nftMarketplace.address, aliceAddress, bidPrice).returns(true);

                await nftMarketplace.makeBid(tokenId, bidPrice);
                await network.provider.send("evm_increaseTime", [auctionTimeout]);
                await nftMarketplace.finishAuction(tokenId);

                expect(paymentTokenMock.transferFrom).to.be.calledWith(nftMarketplace.address, aliceAddress, bidPrice);
            });
        });
   });

   describe("misc", async function() {
        it("Should not allow to set auction timeout to 0", async function() {
            const setAuctionTimeoutTxPromise: Promise<any> = nftMarketplace.setAuctionTimeout(0);

            await expect(setAuctionTimeoutTxPromise).to.be.revertedWith("Can not be zero");
        });

        it("Should not allow to change auction timeout", async function() {
            const newAuctionTimeout: number = 10;

            await nftMarketplace.setAuctionTimeout(newAuctionTimeout);

            const setAuctionTimeout: BigNumber = await nftMarketplace.auctionTimeout();
            expect(newAuctionTimeout).to.equal(setAuctionTimeout.toNumber());
        });

        it("Should not allow to minimum bids number to 0", async function() {
            const setMinBidsTxPromise: Promise<any> = nftMarketplace.setMinBidsNumber(0);

            await expect(setMinBidsTxPromise).to.be.revertedWith("Can not be zero");
        });

        it("Should not allow to change minimum bids number", async function() {
            const newBidsNumber: number = 10;

            await nftMarketplace.setMinBidsNumber(newBidsNumber);

            const setMinBidsNumber: BigNumber = await nftMarketplace.minBidsNumber();
            expect(newBidsNumber).to.equal(setMinBidsNumber.toNumber());
        });
   });
 });
