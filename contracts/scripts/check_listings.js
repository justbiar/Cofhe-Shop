const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '..', 'frontend', 'src', 'contracts', 'addresses.json'), 'utf8'));
  const gameNFT = await hre.ethers.getContractAt('GameNFT', addresses.GameNFT);
  const marketplace = await hre.ethers.getContractAt('GameMarketplace', addresses.GameMarketplace);

  for (let i = 1; i <= 6; i++) {
    try {
      const owner = await gameNFT.ownerOf(i);
      console.log(`Token ${i} owner: ${owner}`);
    } catch (err) {
      console.log(`Token ${i} owner: (nonexistent)`);
    }

    try {
      const listing = await marketplace.listings(i);
      console.log(`Token ${i} listing: seller=${listing.seller} price=${listing.price.toString()} active=${listing.active}`);
    } catch (err) {
      console.log(`Token ${i} listing: (error) ${err.message}`);
    }

    console.log('---');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
