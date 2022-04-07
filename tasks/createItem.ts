import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import { task } from 'hardhat/config';
import { Contract, ContractFactory, Event } from "ethers";

task("createItem", "Mints a new nft with the provided `tokenURI` to the `tokenOwner`")
    .addParam("contractAddress", "An address of a contract")
    .addParam("tokenIdentifier", "A CID of a token's metadata file in IPFS")
    .addParam("tokenOwner", "A new token owner")
    .setAction(async function (taskArgs, hre) {
        const NFTMarketplace: ContractFactory = await hre.ethers.getContractFactory("NFTMarketplace");
        const nftMarketplace: Contract = await NFTMarketplace.attach(taskArgs.contractAddress);

        const createItemTx: any = await nftMarketplace.createItem(taskArgs.tokenIdentifier, taskArgs.tokenOwner);
        const createItemTxReceipt: any = await createItemTx.wait();

        const transferEvent: Event = createItemTxReceipt.events[0];
        console.log("Successfully created item token with uri %s and owner %s", taskArgs.tokenIdentifier, taskArgs.tokenOwner);
        console.log("Gas used: %d", createItemTxReceipt.gasUsed.toNumber() * createItemTxReceipt.effectiveGasPrice.toNumber());
    });
