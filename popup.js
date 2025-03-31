// Global variables to store generated wallet data temporarily.
let generatedSeed = "";
let generatedPrivateKey = "";
let generatedWalletAddress = "";

// Helper to switch visible view.
function showView(viewId) {
  const views = ["initialView", "createWalletView", "usernameRegistrationView", "signInView", "mainView"];
  views.forEach(id => {
    document.getElementById(id).style.display = (id === viewId) ? "block" : "none";
  });
}

function hideHeader() {
  document.getElementById("headerContainer").style.display = "none";
}

document.getElementById("btnCreate").addEventListener("click", () => {
  hideHeader();
  showView("createWalletView");
});

document.getElementById("btnSignIn").addEventListener("click", () => {
  hideHeader();
  showView("signInView");
});


// ----- Initial Screen Handlers -----

document.getElementById("btnCreate").addEventListener("click", () => {
  // Call background to create wallet.
  chrome.runtime.sendMessage({ type: "CREATE_WALLET", network: "Ethereum" }, (response) => {
    if (response.success) {
      generatedSeed = response.wallet.mnemonic; // Unique seed phrase.
      generatedPrivateKey = response.wallet.privateKey; // Unique private key.
      generatedWalletAddress = response.wallet.address;
      // Display the seed phrase for the user to copy.
      document.getElementById("seedDisplay").innerText = generatedSeed;
      showView("createWalletView");
    } else {
      alert(response.error || "Failed to create wallet.");
    }
  });
});

document.getElementById("btnSignIn").addEventListener("click", () => {
  showView("signInView");
});


document.getElementById("btnBackFromSeed").addEventListener("click", () => {
  showView("initialView");
});
// ----- Create Wallet Flow: Seed Display Next -----

document.getElementById("btnNextFromSeed").addEventListener("click", () => {
  // Proceed to username & password registration.
  showView("usernameRegistrationView");
});

// ----- Username & Password Registration -----

document.getElementById("btnRegister").addEventListener("click", () => {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;
  const confirmPassword = document.getElementById("confirmPasswordInput").value;
  
  if (!username) {
    document.getElementById("regMsg").innerText = "Please enter a username.";
    return;
  }
  if (!password || !confirmPassword) {
    document.getElementById("regMsg").innerText = "Please enter and confirm your password.";
    return;
  }
  if (password !== confirmPassword) {
    document.getElementById("regMsg").innerText = "Passwords do not match.";
    return;
  }
  
  // Use chrome.storage.sync to store the user mapping for portability.
  chrome.storage.sync.get("userMapping", (data) => {
    let mapping = data.userMapping || {};
    if (mapping[username]) {
      document.getElementById("regMsg").innerText = "Username already taken. Choose another.";
    } else {
      // Save the mapping: attach the seed phrase, private key, address, and password to this username.
      mapping[username] = { 
        seedPhrase: generatedSeed, 
        privateKey: generatedPrivateKey, 
        address: generatedWalletAddress,
        password: password
      };
      chrome.storage.sync.set({ userMapping: mapping }, () => {
        document.getElementById("regMsg").innerText = "Registration successful!";
        // Show the "Proceed to Sign In" button.
        document.getElementById("btnProceedToSignIn").style.display = "block";
      });
    }
    chrome.storage.sync.get("userMapping", (data) => {
      console.log("User Mapping:", data.userMapping);
    });
    
  });
});

// Handler for "Proceed to Sign In" button.
document.getElementById("btnProceedToSignIn").addEventListener("click", () => {
  // Return to the initial screen (Task 1).
  showView("initialView");
});

// ----- Sign In Flow -----
// Now, the user enters username and password.
document.getElementById("btnSignInSubmit").addEventListener("click", () => {
  const username = document.getElementById("signInUsername").value.trim();
  const password = document.getElementById("signInPassword").value;
  
  if (!username || !password) {
    document.getElementById("signInMsg").innerText = "Please enter both username and password.";
    return;
  }
  
  chrome.storage.sync.get("userMapping", (data) => {
    let mapping = data.userMapping || {};
    let user = mapping[username];
    console.log("User Mapping",data.userMapping)
    if (!user) {
      document.getElementById("signInMsg").innerText = "No user found with that username.";
    } else {
      if (user.password === password) {
        document.getElementById("signInMsg").innerText = "Sign in successful!";
        // Show the main transaction page.
        document.getElementById("accountDisplay").innerText = `Connected: ${user.address}`;
        document.getElementById("from").value = user.address;
        showView("mainView");
      } else {
        document.getElementById("signInMsg").innerText = "Password does not match.";
      }
    }
  });
});

// ----- Transaction Signing (for demonstration) -----

document.getElementById("txForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const txData = {
    from: document.getElementById("from").value,
    to: document.getElementById("to").value,
    amount: parseFloat(document.getElementById("amount").value)
  };
  chrome.runtime.sendMessage({ type: "SIGN_TRANSACTION", network: "Ethereum", txData }, (response) => {
    if (response.signature) {
      document.getElementById("txMsg").innerText = `Transaction Signature: ${response.signature}`;
    } else {
      document.getElementById("txMsg").innerText = response.error || "Transaction signing failed.";
    }
  });
});
