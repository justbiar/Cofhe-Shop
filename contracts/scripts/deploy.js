const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    console.error("Deployer account not found. Please ensure PRIVATE_KEY is correctly set in your .env file and funded.");
    process.exit(1);
  }

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy GameToken
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy(); // No arguments for GameToken constructor
  console.log("GameToken deployed to:", gameToken.target);

  // Deploy GameNFT
  const GameNFT = await ethers.getContractFactory("GameNFT");
  const gameNFT = await GameNFT.deploy(); // No arguments for GameNFT constructor
  console.log("GameNFT deployed to:", gameNFT.target);

  // Deploy Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  console.log("Voting deployed to:", voting.target);

  console.log("All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
