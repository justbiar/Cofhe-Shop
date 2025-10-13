const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameToken", function () {
  let gameToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();
    await gameToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gameToken.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await gameToken.balanceOf(owner.address);
      expect(await gameToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await gameToken.name()).to.equal("GameToken");
      expect(await gameToken.symbol()).to.equal("GTK");
    });

    it("Should have correct initial supply", async function () {
      const initialSupply = ethers.parseEther("100000"); // 100k tokens
      expect(await gameToken.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await gameToken.mint(addr1.address, mintAmount);
      
      expect(await gameToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        gameToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(gameToken, "OwnableUnauthorizedAccount");
    });

    it("Should not exceed max supply", async function () {
      const maxSupply = ethers.parseEther("1000000");
      const currentSupply = await gameToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");
      
      await expect(
        gameToken.mint(addr1.address, excessAmount)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await gameToken.balanceOf(owner.address);
      
      await gameToken.burn(burnAmount);
      
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        initialBalance - burnAmount
      );
    });

    it("Should not allow users to burn more tokens than they have", async function () {
      const burnAmount = ethers.parseEther("1000000"); // More than total supply
      
      await expect(
        gameToken.burn(burnAmount)
      ).to.be.revertedWithCustomError(gameToken, "ERC20InsufficientBalance");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await gameToken.transfer(addr1.address, transferAmount);
      
      expect(await gameToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await gameToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("99000")
      );
    });

    it("Should emit Transfer event", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(gameToken.transfer(addr1.address, transferAmount))
        .to.emit(gameToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });
});


