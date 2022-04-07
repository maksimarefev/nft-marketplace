import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFTMarketplace, NFTMarketplace__factory, BeautifulImage, BeautifulImage__factory } from '../typechain-types';

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

  const NFTMarketplace: NFTMarketplace__factory =
      (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;
  const nftMarketplace: NFTMarketplace =
    await NFTMarketplace.deploy(auctionTimeout, minBidsNumber, paymentToken, beautifulImage.address);
  await nftMarketplace.deployed();
  console.log("NFTMarketplace had been deployed to:", nftMarketplace.address);

  await beautifulImage.transferOwnership(nftMarketplace.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
