const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '..', 'frontend', 'src', 'contracts', 'addresses.json'), 'utf8'));
  const gameNFT = await hre.ethers.getContractAt('GameNFT', addresses.GameNFT);
  const marketplace = await hre.ethers.getContractAt('GameMarketplace', addresses.GameMarketplace);
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const tokenId = 1;
  try {
    console.log('Attempting direct transferFrom by deployer...');
    const tx = await gameNFT.connect(deployer).transferFrom(deployerAddress, marketplace.address, tokenId);
    await tx.wait();
    console.log('transferFrom succeeded');
  } catch (err) {
    console.error('transferFrom error:', err);
  }
}

main().catch(err=>{console.error(err);process.exit(1);});
