// Import libraries from npm-installed modules (bundled via webpack)
import { ethers } from "ethers";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction
} from "@solana/web3.js";

// Global wallet storage
let walletData = {
  Ethereum: null,
  Solana: null
};

// Load stored Ethereum wallet if available.
chrome.storage.local.get(["ethereumWallet"], (data) => {
  if (data.ethereumWallet) {
    walletData.Ethereum = data.ethereumWallet;
  }
});

// Load stored Solana wallet if available.
chrome.storage.local.get(["solanaWallet"], (data) => {
  if (data.solanaWallet) {
    walletData.Solana = data.solanaWallet;
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // --------- Ethereum Handling ---------
  if (request.network === "Ethereum") {
    if (request.type === "CREATE_WALLET") {
      try {
        const wallet = ethers.Wallet.createRandom();
        walletData.Ethereum = {
          privateKey: wallet.privateKey,
          address: wallet.address,
          mnemonic: wallet.mnemonic.phrase
        };
        chrome.storage.local.set({ ethereumWallet: walletData.Ethereum });
        sendResponse({ success: true, wallet: walletData.Ethereum });
      } catch (e) {
        sendResponse({ success: false, error: "Error creating Ethereum wallet." });
      }
    } else if (request.type === "SIGN_IN_WALLET") {
      // Validate that a private key is provided.
      if (typeof request.privateKey !== "string" || request.privateKey.trim() === "") {
        sendResponse({ success: false, error: "Invalid private key provided." });
        return;
      }
      try {
        const wallet = new ethers.Wallet(request.privateKey);
        walletData.Ethereum = {
          privateKey: wallet.privateKey,
          address: wallet.address,
          mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : ""
        };
        chrome.storage.local.set({ ethereumWallet: walletData.Ethereum });
        sendResponse({ success: true, wallet: walletData.Ethereum });
      } catch (e) {
        sendResponse({ success: false, error: "Invalid Ethereum private key." });
      }
    } else if (request.type === "GET_ACCOUNTS") {
      if (walletData.Ethereum) {
        sendResponse({ accounts: [walletData.Ethereum.address] });
      } else {
        sendResponse({ accounts: [] });
      }
    } else if (request.type === "SIGN_TRANSACTION") {
      const { txData } = request;
      try {
        const wallet = new ethers.Wallet(walletData.Ethereum.privateKey);
        const signedTx = await wallet.signTransaction(txData);
        sendResponse({ signature: signedTx });
      } catch (e) {
        sendResponse({ error: "Failed to sign Ethereum transaction." });
      }
    }
  }
  // --------- Solana Handling ---------
  else if (request.network === "Solana") {
    if (request.type === "CREATE_WALLET") {
      try {
        const keypair = Keypair.generate();
        walletData.Solana = {
          privateKey: Array.from(keypair.secretKey),
          address: keypair.publicKey.toBase58()
        };
        chrome.storage.local.set({ solanaWallet: walletData.Solana });
        // For demo purposes, we do not derive a mnemonic for Solana.
        sendResponse({ success: true, wallet: walletData.Solana, mnemonic: "Not available" });
      } catch (e) {
        sendResponse({ success: false, error: "Error creating Solana wallet." });
      }
    } else if (request.type === "SIGN_IN_WALLET") {
      // Validate that a private key is provided.
      if (typeof request.privateKey !== "string" || request.privateKey.trim() === "") {
        sendResponse({ success: false, error: "Invalid private key provided." });
        return;
      }
      try {
        // Assume the private key is provided as a comma-separated string of numbers.
        let keyArr = request.privateKey.split(',').map(Number);
        const keypair = Keypair.fromSecretKey(new Uint8Array(keyArr));
        walletData.Solana = {
          privateKey: Array.from(keypair.secretKey),
          address: keypair.publicKey.toBase58()
        };
        chrome.storage.local.set({ solanaWallet: walletData.Solana });
        sendResponse({ success: true, wallet: walletData.Solana });
      } catch (e) {
        sendResponse({ success: false, error: "Invalid Solana private key." });
      }
    } else if (request.type === "GET_ACCOUNTS") {
      if (walletData.Solana) {
        sendResponse({ accounts: [walletData.Solana.address] });
      } else {
        sendResponse({ accounts: [] });
      }
    } else if (request.type === "SIGN_TRANSACTION") {
      const { txData } = request;
      try {
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const keypair = Keypair.fromSecretKey(new Uint8Array(walletData.Solana.privateKey));
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(txData.to),
            lamports: txData.amount * 1000000000 // Convert SOL to lamports.
          })
        );
        const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        sendResponse({ signature });
      } catch (e) {
        sendResponse({ error: "Failed to sign Solana transaction." });
      }
    }
  }
  return true;
});
