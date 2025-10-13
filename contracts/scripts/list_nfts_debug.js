const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '..', 'frontend', 'src', 'contracts', 'addresses.json'), 'utf8'));
  const gameNFT = await hre.ethers.getContractAt('GameNFT', addresses.GameNFT);
  const marketplace = await hre.ethers.getContractAt('GameMarketplace', addresses.GameMarketplace);
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log('Marketplace address:', marketplace.address);
  console.log('GameNFT address:', gameNFT.address);
  console.log('Deployer:', deployerAddress);

  const tokenId = 1;
  const owner = await gameNFT.ownerOf(tokenId);
  console.log(`ownerOf(${tokenId}) =`, owner);

  try {
    const isApproved = await gameNFT.getApproved(tokenId);
    console.log('getApproved:', isApproved);
  } catch (e) {
    console.log('getApproved failed:', e.message);
  }

  try {
    console.log('Calling marketplace.listItem...');
    const price = hre.ethers.parseUnits('10', 18);
    const tx = await marketplace.connect(deployer).listItem(tokenId, price);
    const receipt = await tx.wait();
    console.log('listItem tx receipt:', receipt.transactionHash);
  } catch (err) {
    console.error('listItem error:', err);
    if (err.error) console.error('nested error:', err.error);
    if (err.data) console.error('data:', err.data);
  }
}

main().catch(err=>{console.error(err);process.exit(1);});
