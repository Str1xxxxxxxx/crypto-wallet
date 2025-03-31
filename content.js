window.myWallet = {
    request: async (method) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ method }, resolve);
      });
    }
  };
  