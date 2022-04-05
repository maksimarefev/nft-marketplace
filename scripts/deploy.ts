import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import { NFTMarketplace, NFTMarketplace__factory } from '../typechain-types';

async function main() {
  const paymentToken: string = "0xf468ba4c0846e712bc4e0387ad5bff0ead4cbdb5"
  const nft: string = "0xBDDFF04CAa62bd06cfA63EcD2AD89aF78943f0ce"

  const accounts: SignerWithAddress[] = await ethers.getSigners();

  if (accounts.length == 0) {
    throw new Error('No accounts were provided');
  }

  console.log("Deploying contracts with the account:", accounts[0].address);

  const NFTMarketplace: NFTMarketplace__factory =
      (await ethers.getContractFactory("NFTMarketplace")) as NFTMarketplace__factory;
  const nftMarketplace: NFTMarketplace = await NFTMarketplace.deploy(paymentToken, nft);

  await nftMarketplace.deployed();

  //todo arefev: deploy nft as well
  //todo arefev: transfer ownership of the nft to the newly created marketplace

  console.log("NFTMarketplace deployed to:", nftMarketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });