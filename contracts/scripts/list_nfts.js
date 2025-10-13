const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Listing NFTs from frontend/public/nfts...');

  // Resolve addresses.json relative to current working directory (robust with special chars)
  const addressesPath = path.resolve(process.cwd(), '..', 'frontend', 'src', 'contracts', 'addresses.json');
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

  const [deployer] = await hre.ethers.getSigners();
  console.log('Using deployer:', await deployer.getAddress());

  const gameNFT = await hre.ethers.getContractAt('GameNFT', addresses.GameNFT);
  const marketplace = await hre.ethers.getContractAt('GameMarketplace', addresses.GameMarketplace);

  // Set base URI to local frontend static folder
  const baseURI = 'http://localhost:3000/nfts/';
  console.log('Setting base URI to', baseURI);
  const txSet = await gameNFT.connect(deployer).setBaseURI(baseURI);
  await txSet.wait();

  // Read metadata files
  const nftFolder = path.resolve(process.cwd(), '..', 'frontend', 'public', 'nfts');
  const files = fs.readdirSync(nftFolder).filter(f => f.endsWith('.json'));

  for (let i = 0; i < files.length; i++) {
    const metadata = JSON.parse(fs.readFileSync(path.join(nftFolder, files[i]), 'utf8'));
    const tokenIndex = i + 1; // simple token id assignment

    console.log(`Minting token ${tokenIndex}:`, metadata.name);
    const tx = await gameNFT.connect(deployer).mint(
      await deployer.getAddress(),
      1, // level
      10, // power
      1, // rarity
      'Card'
    );
    await tx.wait();

    // Approve marketplace to transfer this token, then list it
  console.log(`Approving marketplace for token ${tokenIndex}...`);
  const approveTx = await gameNFT.connect(deployer).approve(addresses.GameMarketplace, tokenIndex);
    await approveTx.wait();

    // List on marketplace for a small price (e.g., 10 tokens)
    const price = hre.ethers.parseUnits('10', 18);
    console.log(`Listing token ${tokenIndex} for price ${price.toString()}`);
    const listTx = await marketplace.connect(deployer).listItem(tokenIndex, price);
    await listTx.wait();
  }

  console.log('All done. NFTs minted and listed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
