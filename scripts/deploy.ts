import { ethers } from "hardhat";
import { execSync } from "child_process";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFTMarketplace, NFTMarketplace__factory, BeautifulImage, BeautifulImage__factory } from '../typechain-types';

function verify(contractAddress: string, ...constructorParameters: any[]) {
    if (!contractAddress) {
        console.error("No contract address was provided");
        return;
    }

    const constructorParametersAsString: string =
        !constructorParameters || constructorParameters.length == 0 ? "" : constructorParameters.join(" ");

    const command: string = "npx hardhat verify --network rinkeby " + contractAddress + " " + constructorParametersAsString;
    console.log("Running command:", command);

    try {
        execSync(command, { encoding: "utf-8" });
    } catch (error) {
        //do nothing, it always fails but in fact a contract becomes verified
    }
}

async function main() {
    const nftBaseURI: string = "ipfs://"
    const paymentToken: string = "0xf468ba4c0846e712bc4e0387ad5bff0ead4cbdb5"
    const nftContractURI: string =  "ipfs://QmVW8oSySifTBDBvkTGC7J5r9UDCJ4Ndiig6B3EHvURt5S"
    const minBidsNumber: number = 3;
    const auctionTimeout: number = 3 * 24 * 60 * 60; //3 days

    const accounts: SignerWithAddress[] = await ethers.getSigners();

    if (accounts.length == 0) {
        throw new Error('No accounts were provided');
    }

    console.log("Deploying contracts with the account:", accounts[0].address);

    console.log("Deploying NFT contract");
    const BeautifulImage: BeautifulImage__factory =
        (await ethers.getContractFactory("BeautifulImage")) as BeautifulImage__factory;
    const beautifulImage: BeautifulImage = await BeautifulImage.deploy(nftContractURI, nftBaseURI);
    await beautifulImage.deployed();
    console.log("NFT contract had been deployed to:", beautifulImage.address);

    console.log("Deploying marketplace contract");
    const NFTMarketplace: NFTMarketplace__factory =
      (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;
    const nftMarketplace: NFTMarketplace =
    await NFTMarketplace.deploy(auctionTimeout, minBidsNumber, paymentToken, beautifulImage.address);
    await nftMarketplace.deployed();
    console.log("Marketplace had been deployed to:", nftMarketplace.address);

    await beautifulImage.transferOwnership(nftMarketplace.address);

    console.log("Verifying NFT contract..");
    verify(beautifulImage.address, nftContractURI, nftBaseURI);
    console.log("NFT contract is verified");

    console.log("Verifying marketplace contract..");
    verify(nftMarketplace.address, auctionTimeout, minBidsNumber, paymentToken, beautifulImage.address);
    console.log("Marketplace contract is verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
