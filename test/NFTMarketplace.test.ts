/*
    todo arefev:
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
import { NFTMarketplace, NFTMarketplace__factory } from "../typechain-types";
import { deployMockContract, MockContract } from "ethereum-waffle";

import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import IERC721Mintable from "../artifacts/contracts/IERC721Mintable.sol/IERC721Mintable.json";

/*
    todo arefev:
        await mockContract.mock.<nameOfMethod>.returns(<value>)
        await mockContract.mock.<name>.withArgs(<args>).returns(<value>)
        await mockContract.mock.<nameOfMethod>.reverts()
        await mockContract.mock.<name>.withArgs(<args>).reverts()

        await mockContract.mock.<nameOfMethod>.reverts()
        await mockContract.mock.<nameOfMethod>.revertsWithReason(<reason>)
        await mockContract.mock.<nameOfMethod>.withArgs(<arguments>).reverts()
        await mockContract.mock.<nameOfMethod>.withArgs(<arguments>).revertsWithReason(<reason>)

        await expect(splitter.split({ value: 50 })).to.emit(splitter, "Transfer")
        await expect(() => splitter.split({ value: 50 })).to.changeBalances([receiver1, receiver2], [25, 25])

        expect('balanceOf').to.be.calledOnContract(token);
        expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address]);
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
//todo arefev: solcover
//todo arefev: prettier plugin solidity
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

   beforeEach("Deploying contract", async function () {
     [alice, bob] = await ethers.getSigners();

     paymentTokenMock = await deployMockContract(alice, IERC20.abi);
     nftMock = await deployMockContract(alice, IERC721Mintable.abi);

     const NFTMarketplaceFactory: NFTMarketplace__factory =
       (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;

     nftMarketplace = await NFTMarketplaceFactory.deploy(paymentTokenMock.address, nftMock.address);
   });

   describe("mint", async function() {
       //todo arefev: implement
   });

   describe("listing", async function() {
        /*
            todo arefev:
             ✓ 1. Should not allow to list non-existent token
             ✓ 2. Should not allow to list non-belonging token
             ✓ 3. Should emit `Listed` event
             4. Should transfer a token
             ✓ 5. Should not allow to list with 0 price
         */
        describe("listItem", async function() {
            it("Should not allow to list non-existent token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                await nftMock.mock.ownerOf.withArgs(tokenId).revertsWithReason("ERC721: owner query for nonexistent token");

                const listItemTxPromise: any = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("ERC721: owner query for nonexistent token");
            });

            it("Should not allow to list with 0 price", async function () {
                const tokenId: number = 1;
                const price: number = 0;

                const listItemTxPromise: any = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("Price can not be set to 0");
            });

            it("Should not allow to list non-belonging token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(bobAddress);

                const listItemTxPromise: any = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            //todo arefev: Waffle's calledOnContractWith is not supported by Hardhat
            /* it("Should transfer a token", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);

                await nftMarketplace.listItem(tokenId, price);

                await expect('transferFrom').to.be.calledOnContractWith(nftMock, [aliceAddress, nftMarketplace.address, tokenId]);
            }); */

            it("Should emit `Listed` event", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.ownerOf.withArgs(tokenId).returns(aliceAddress);
                await nftMock.mock.transferFrom.withArgs(aliceAddress, nftMarketplace.address, tokenId).returns();

                const listItemTxPromise: any = nftMarketplace.listItem(tokenId, price);

                await expect(listItemTxPromise).to.emit(nftMarketplace, "Listed").withArgs(tokenId, aliceAddress, price);
            });
        });

        /*
            todo arefev:
                ✓ 1. Should not allow to cancel non-existent token
                ✓ 2. Should not allow to cancel non-belonging token
                ✓ 3. Should emit `Delisted` event
                4. Should transfer a token back to it's owner
         */
        describe("cancel", async function() {
            it("Should not allow to cancel non-existent token", async function() {
                const tokenId: number = 1;

                const cancelTxPromise: any = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.be.revertedWith("Token does not exist");
            });

            it("Should not allow to cancel non-belonging token", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);

                const cancelTxPromise: any = nftMarketplace.connect(bob).cancel(tokenId);

                await expect(cancelTxPromise).to.be.revertedWith("Sender is not the token owner");
            });

            it("Should emit `Delisted` event", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, tokenId).returns();

                const cancelTxPromise: any = nftMarketplace.cancel(tokenId);

                await expect(cancelTxPromise).to.emit(nftMarketplace, "Delisted").withArgs(tokenId);
            });

            //todo arefev: Waffle's calledOnContractWith is not supported by Hardhat
            /* it("Should transfer a token back to it's owner", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, aliceAddress, tokenId).returns();

                await nftMarketplace.cancel(tokenId);

                await expect('transferFrom').to.be.calledOnContractWith(nftMock, [nftMarketplace.address, aliceAddress, tokenId]);
            }); */
        });

        /* todo arefev:
            ✓ 1. Should not allow to buy non-existent token
            ✓ 2. Should not allow to buy for sender with insufficient balance
            ✓ 3. Should emit `Sold` event
            4. Should transfer nft to buyer and erc20 to seller
        */
        describe("buyItem", async function() {
            it("Should not allow to buy non-existent token", async function() {
                const tokenId: number = 1;

                const buyItemTxPromise: any = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Token does not exist");
            });

            it("Should not allow to buy for sender with insufficient balance", async function() {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const balanceOfAlice: number = 0;
                const aliceAddress: string = await alice.getAddress();
                await paymentTokenMock.mock.balanceOf.withArgs(aliceAddress).returns(balanceOfAlice);

                const buyItemTxPromise: any = nftMarketplace.buyItem(tokenId);

                await expect(buyItemTxPromise).to.be.revertedWith("Sender does not hold sufficient balance");
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

                const buyItemTxPromise: any = nftMarketplace.connect(bob).buyItem(tokenId);

                await expect(buyItemTxPromise).to.emit(nftMarketplace, "Sold").withArgs(tokenId, price, bobAddress, aliceAddress);
            });

            //todo arefev: Waffle's calledOnContractWith is not supported by Hardhat
            /* it("Should transfer nft to buyer and erc20 to seller", async function () {
                const tokenId: number = 1;
                const price: number = 1;
                await listItem(tokenId, price);
                const aliceAddress: string = await alice.getAddress();
                const bobAddress: string = await bob.getAddress();
                await nftMock.mock.transferFrom.withArgs(nftMarketplace.address, bobAddress, tokenId).returns();
                await paymentTokenMock.mock.balanceOf.withArgs(bobAddress).returns(price);
                await paymentTokenMock.mock.transferFrom.withArgs(bobAddress, aliceAddress, price).returns(true);

                const buyItemTxPromise: any = nftMarketplace.connect(bob).buyItem(tokenId);

                await expect('transferFrom').to.be.calledOnContractWith(nftMock, [nftMarketplace.address, bobAddress, tokenId]);
                await expect('transferFrom').to.be.calledOnContractWith(paymentTokenMock, [bobAddress, aliceAddress, price]);
            }); */
        });
   });

    /* todo arefev:

     */
   describe("auction listing", async function() {
        //todo arefev: implement
   });
 });
