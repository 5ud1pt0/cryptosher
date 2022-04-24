import React, { useEffect, useState } from "react";
import './styles/App.css';
import { ethers } from "ethers";
import CryptoSher from './utils/CryptoSher.json';
import { toast } from "react-hot-toast"
import { networks } from './utils/network.js';
import gulzarPic from './assets/Gulzar.jpeg';

const TWITTER_HANDLE = 'anuraag_saxena';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/arz-kiya-hai-cryptosher';
const CONTRACT_LINK = 'https://mumbai.polygonscan.com/address/0x8e7A2eb29D8170728C80E0cA98f473dBD18D9c6F#code'

const CONTRACT_ADDRESS = "0x8e7A2eb29D8170728C80E0cA98f473dBD18D9c6F";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [totalMinted, settotalMinted] = useState(0);
  const [network, setNetwork] = useState('');

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}
		
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
      setupEventListener() 
		} else {
			console.log('No authorized account found');
		}
		
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);

   ethereum.on('accountsChanged', function (accounts) {
    window.location.reload();
  });

		function handleChainChanged(_chainId) {
			window.location.reload();
		}

	};



  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }],  
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {	
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai Testnet',
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                      name: "Mumbai Matic",
                      symbol: "MATIC",
                      decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    } 
  }
 
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        toast('Get MetaMask!');
        return;
      }

     
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      switchNetwork();
      
      setupEventListener() 
    } catch (error) {
      console.log(error)
    }
  }

  

  const setupEventListener = async () => {
     
    try {
      const { ethereum } = window;

      if (ethereum) {
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);

        const polygonChainId = "0x13881"; 
        if (chainId !== polygonChainId) {
          return;
        }
      
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CryptoSher.abi, signer);

        const total_minted = await connectedContract.getTotalNFTsMintedSoFar();
        
        settotalMinted( total_minted.toNumber() );
       
        connectedContract.on("CryptoSherMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          settotalMinted( total_minted.toNumber() );
          setErrorMessage("https://testnets.opensea.io/assets/mumbai/" + CONTRACT_ADDRESS + "/" + tokenId);
          
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      
      const polygonChainId = "0x13881"; 
      if (chainId !== polygonChainId) {
        toast("You are not connected to the Polygon Test Network!");
        return;
      }
     
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CryptoSher.abi, signer);


    const nftcount = await connectedContract.getTotalNFTsMintedSoFar();
    console.log(nftcount.toNumber())
     const price = .05;
     
     console.log(price);
      
      console.log("Going to pop wallet now to pay gas...")
      let nftTxn = await connectedContract.mintCryptoSher({ value: ethers.utils.parseEther(price.toString()) });
      //let nftTxn = await connectedContract.reserveShers();
      //let nftTxn = await connectedContract.withdraw();
      setMining(true);
      setErrorMessage('');
      console.log("Mining...please wait.")
      await nftTxn.wait();
      
      console.log(`Mined, see transaction: https://mumbai.polygonscan.com/tx/${nftTxn.hash}`);
     

    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
 finally {
  setMining(false);
}
  
}

  
  const renderNotConnectedContainer = () => (
    <div className="flex flex-col px-6 py-4 justify-center items-center">

    <button onClick={connectWallet} 
    className=" inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-sky-600 hover:bg-sky-700">
      Connect Wallet
    </button>
    </div>
  );
  
	useEffect(() => {
		checkIfWalletIsConnected();
	}, );


  return (
<div className="min-h-screen bg-gray-50 py-6 flex flex-col justify-center relative overflow-hidden sm:py-12">
<div className="absolute inset-0 bg-[url(./assets/grid.svg)] bg-center blur-2xl"></div>

    <div className=" relative px-6 pt-10 pb-2 bg-white shadow-xl ring-1 ring-gray-900/5 sm:max-w-2xl sm:mx-auto sm:rounded-lg sm:px-10">
    <div className="max-w-xl mx-auto  ">
    
        <div className=" text-base leading-7 space-y-5 text-gray-600 ">
        <div className="flex md:order-2  justify-end items-end ">
      
      { currentAccount  ? currentAccount && network === 'Polygon Mumbai Testnet' ?
      <div className=" text-gray-500 bg-gray-200 font-medium rounded-lg text-sm px-2.5 py-1.5 text-center mr-3 md:mr-0 ">
      <p>  {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> 
      </div>
      : <button className="text-gray-500 bg-gray-200 font-medium rounded-lg text-sm px-2.5 py-1.5 text-center mr-3 md:mr-0 hover:bg-gray-300" 
      onClick={switchNetwork}> Switch to Polygon </button> 
      :
      <div></div>
      }
    
     
  </div>

          <div className="flex justify-center items-center ">
          <svg width="259" height="71" viewBox="0 0 259 71" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M130.726 54.68C131.553 53.9867 132.466 53.64 133.466 53.64C134.586 53.64 135.426 54.0067 135.986 54.74C136.546 55.46 136.826 56.5067 136.826 57.88C136.826 59.24 136.553 60.48 136.006 61.6C135.473 62.7067 134.699 63.5867 133.686 64.24C132.686 64.88 131.519 65.2 130.186 65.2C129.479 65.2 128.693 65.06 127.826 64.78L126.406 65.2L128.246 50.5L127.226 50.08L127.426 49.26L130.926 48.88L131.446 49.16L130.726 54.68ZM129.546 63.74C129.813 63.82 130.113 63.86 130.446 63.86C131.499 63.86 132.279 63.28 132.786 62.12C133.306 60.9467 133.566 59.5333 133.566 57.88C133.566 57.1467 133.446 56.54 133.206 56.06C132.966 55.58 132.606 55.34 132.126 55.34C131.539 55.34 131.006 55.64 130.526 56.24L129.546 63.74ZM138.704 55.92C138.651 55.72 138.591 55.58 138.524 55.5C138.471 55.42 138.391 55.38 138.284 55.38C138.111 55.38 137.944 55.4333 137.784 55.54L137.484 54.78C137.658 54.5667 137.984 54.3267 138.464 54.06C138.958 53.78 139.478 53.64 140.024 53.64C140.598 53.64 141.031 53.7533 141.324 53.98C141.618 54.2067 141.798 54.54 141.864 54.98L143.084 62.66L143.364 64.6L144.004 63.26C145.044 61.02 145.564 59.18 145.564 57.74C145.564 57.4333 145.538 57.1733 145.484 56.96C145.444 56.7467 145.378 56.5133 145.284 56.26C145.191 56.0333 145.124 55.8333 145.084 55.66C145.044 55.4733 145.024 55.2467 145.024 54.98C145.024 54.5933 145.158 54.2733 145.424 54.02C145.691 53.7667 146.071 53.64 146.564 53.64C147.111 53.64 147.538 53.8467 147.844 54.26C148.164 54.66 148.324 55.1267 148.324 55.66C148.324 56.6067 148.198 57.4667 147.944 58.24C147.704 59 147.304 59.9533 146.744 61.1C146.251 62.1933 145.071 64.2467 143.204 67.26C142.564 68.3267 141.911 69.06 141.244 69.46C140.578 69.86 139.811 70.06 138.944 70.06C138.558 70.06 138.151 70.0133 137.724 69.92C137.298 69.8267 137.024 69.7267 136.904 69.62L137.644 67.66C137.791 67.8067 138.051 67.94 138.424 68.06C138.798 68.18 139.144 68.24 139.464 68.24C140.091 68.24 140.658 68.04 141.164 67.64C141.671 67.2533 142.204 66.6067 142.764 65.7H140.984L138.704 55.92ZM162.672 51.38C162.378 51.2733 162.058 51.22 161.712 51.22C160.725 51.22 159.898 51.5933 159.232 52.34C158.565 53.0733 158.078 54.0067 157.772 55.14C157.465 56.2733 157.325 57.42 157.352 58.58C157.405 60.26 157.645 61.52 158.072 62.36C158.512 63.1867 159.198 63.6 160.132 63.6C161.052 63.6 161.765 63.36 162.272 62.88C162.525 62.56 162.785 61.9 163.052 60.9H164.972L164.552 63.7C164.018 64.1133 163.378 64.46 162.632 64.74C161.885 65.02 160.878 65.16 159.612 65.16C157.545 65.16 156.025 64.5667 155.052 63.38C154.092 62.1933 153.605 60.66 153.592 58.78C153.592 56.9533 153.945 55.38 154.652 54.06C155.372 52.7267 156.378 51.7133 157.672 51.02C158.978 50.3133 160.498 49.96 162.232 49.96C163.005 49.96 163.605 49.9933 164.032 50.06C164.472 50.1133 164.912 50.2 165.352 50.32L165.752 50.42L166.072 50.5L165.472 54.42H163.052L162.672 51.38ZM170.508 56.54C170.748 55.7267 171.154 55.04 171.728 54.48C172.301 53.92 172.961 53.64 173.708 53.64C174.001 53.64 174.228 53.7067 174.388 53.84L173.728 57.26C173.674 57.1933 173.548 57.12 173.348 57.04C173.148 56.96 172.908 56.92 172.628 56.92C172.214 56.92 171.828 56.9667 171.468 57.06C171.121 57.14 170.854 57.26 170.668 57.42L169.628 65H166.548L167.808 55.58L166.768 55.02L166.928 54.16L170.128 53.64L170.648 53.98L170.548 55.82L170.508 56.54ZM175.228 55.92C175.174 55.72 175.114 55.58 175.048 55.5C174.994 55.42 174.914 55.38 174.808 55.38C174.634 55.38 174.468 55.4333 174.308 55.54L174.008 54.78C174.181 54.5667 174.508 54.3267 174.988 54.06C175.481 53.78 176.001 53.64 176.548 53.64C177.121 53.64 177.554 53.7533 177.848 53.98C178.141 54.2067 178.321 54.54 178.388 54.98L179.608 62.66L179.888 64.6L180.528 63.26C181.568 61.02 182.088 59.18 182.088 57.74C182.088 57.4333 182.061 57.1733 182.008 56.96C181.968 56.7467 181.901 56.5133 181.808 56.26C181.714 56.0333 181.648 55.8333 181.608 55.66C181.568 55.4733 181.548 55.2467 181.548 54.98C181.548 54.5933 181.681 54.2733 181.948 54.02C182.214 53.7667 182.594 53.64 183.088 53.64C183.634 53.64 184.061 53.8467 184.368 54.26C184.688 54.66 184.848 55.1267 184.848 55.66C184.848 56.6067 184.721 57.4667 184.468 58.24C184.228 59 183.828 59.9533 183.268 61.1C182.774 62.1933 181.594 64.2467 179.728 67.26C179.088 68.3267 178.434 69.06 177.768 69.46C177.101 69.86 176.334 70.06 175.468 70.06C175.081 70.06 174.674 70.0133 174.248 69.92C173.821 69.8267 173.548 69.7267 173.428 69.62L174.168 67.66C174.314 67.8067 174.574 67.94 174.948 68.06C175.321 68.18 175.668 68.24 175.988 68.24C176.614 68.24 177.181 68.04 177.688 67.64C178.194 67.2533 178.728 66.6067 179.288 65.7H177.508L175.228 55.92ZM189.969 54.72C190.769 54 191.682 53.64 192.709 53.64C193.829 53.64 194.676 54.0067 195.249 54.74C195.822 55.4733 196.109 56.52 196.109 57.88C196.109 59.2267 195.836 60.46 195.289 61.58C194.742 62.7 193.969 63.5867 192.969 64.24C191.969 64.88 190.822 65.2 189.529 65.2C189.236 65.2 188.902 65.1667 188.529 65.1L187.829 70.08H184.789L186.749 55.58L185.689 55L185.849 54.16L189.569 53.64L190.069 53.88L189.969 54.72ZM188.729 63.7C189.022 63.8067 189.376 63.86 189.789 63.86C190.802 63.86 191.549 63.28 192.029 62.12C192.522 60.96 192.769 59.5467 192.769 57.88C192.769 57.1467 192.649 56.54 192.409 56.06C192.169 55.58 191.816 55.34 191.349 55.34C190.776 55.34 190.249 55.6667 189.769 56.32L188.729 63.7ZM201.063 61.22C201.05 61.3533 201.036 61.4667 201.023 61.56C201.01 61.6533 200.996 61.7333 200.983 61.8C200.93 62.2267 200.903 62.48 200.903 62.56C200.903 63.0933 201.15 63.36 201.643 63.36C201.923 63.36 202.21 63.32 202.503 63.24C202.81 63.1467 203.076 63 203.303 62.8L203.543 63.56C203.156 63.9867 202.63 64.3667 201.963 64.7C201.31 65.0333 200.523 65.2 199.603 65.2C199.056 65.2 198.603 65.0667 198.243 64.8C197.896 64.52 197.723 64.0667 197.723 63.44C197.723 63.1867 197.81 62.4267 197.983 61.16L198.763 55.46H197.583L197.823 54.4L199.023 53.94C199.45 53.58 199.97 52.66 200.583 51.18H202.403L202.063 53.9H204.303L204.083 55.46H201.843L201.063 61.22ZM210.693 53.62C212.16 53.62 213.267 54.0267 214.013 54.84C214.773 55.64 215.153 56.82 215.153 58.38C215.153 59.6467 214.893 60.8067 214.373 61.86C213.853 62.9133 213.12 63.7467 212.173 64.36C211.227 64.9733 210.127 65.28 208.873 65.28C207.407 65.28 206.3 64.8733 205.553 64.06C204.807 63.2333 204.433 62.04 204.433 60.48C204.433 59.2133 204.693 58.06 205.213 57.02C205.733 55.9667 206.467 55.14 207.413 54.54C208.36 53.9267 209.453 53.62 210.693 53.62ZM210.333 54.98C209.76 54.98 209.287 55.28 208.913 55.88C208.54 56.4667 208.267 57.2067 208.093 58.1C207.933 58.9933 207.867 59.8933 207.893 60.8C207.933 61.96 208.06 62.7867 208.273 63.28C208.5 63.7733 208.853 64.02 209.333 64.02C210.12 64.02 210.7 63.4733 211.073 62.38C211.46 61.2867 211.653 60.0067 211.653 58.54C211.653 57.22 211.547 56.3 211.333 55.78C211.133 55.2467 210.8 54.98 210.333 54.98ZM224.224 51.66C224.011 51.4867 223.791 51.3667 223.564 51.3C223.338 51.22 223.058 51.18 222.724 51.18C222.031 51.18 221.484 51.34 221.084 51.66C220.684 51.98 220.484 52.4067 220.484 52.94C220.484 53.6067 220.691 54.18 221.104 54.66C221.518 55.14 222.238 55.7 223.264 56.34C224.198 56.94 224.938 57.5867 225.484 58.28C226.031 58.9733 226.304 59.7733 226.304 60.68C226.318 61.5067 226.111 62.2667 225.684 62.96C225.258 63.64 224.611 64.1867 223.744 64.6C222.891 65.0133 221.844 65.22 220.604 65.22C219.604 65.22 218.644 65.1133 217.724 64.9C216.818 64.6867 216.238 64.4733 215.984 64.26L216.544 61.18H218.544L218.644 63.36C219.124 63.7733 219.751 63.98 220.524 63.98C221.444 63.98 222.111 63.8 222.524 63.44C222.951 63.0667 223.164 62.5733 223.164 61.96C223.164 61.36 222.971 60.8333 222.584 60.38C222.211 59.9133 221.558 59.3867 220.624 58.8C219.638 58.1733 218.864 57.5 218.304 56.78C217.744 56.06 217.464 55.22 217.464 54.26C217.464 52.9 217.971 51.8467 218.984 51.1C220.011 50.34 221.338 49.96 222.964 49.96C224.738 49.96 226.038 50.2 226.864 50.68L226.344 53.62H224.504L224.224 51.66ZM232.113 56.08C232.567 55.3333 233.113 54.74 233.753 54.3C234.407 53.86 235.113 53.64 235.873 53.64C237.607 53.64 238.473 54.6267 238.473 56.6C238.473 57.1067 238.307 58.26 237.973 60.06L237.833 60.88C237.647 61.92 237.553 62.6267 237.553 63C237.553 63.36 237.68 63.54 237.933 63.54C238.04 63.54 238.153 63.5133 238.273 63.46C238.407 63.3933 238.587 63.2733 238.813 63.1L239.093 63.78C238.867 64.0867 238.513 64.4 238.033 64.72C237.553 65.04 236.947 65.2 236.213 65.2C235.427 65.2 234.9 65.0533 234.633 64.76C234.367 64.4667 234.233 64.0667 234.233 63.56C234.233 63.2 234.347 62.4533 234.573 61.32L234.693 60.68C234.987 59.0133 235.133 57.8067 235.133 57.06C235.133 56.4867 235.073 56.0933 234.953 55.88C234.833 55.6667 234.633 55.56 234.353 55.56C233.953 55.56 233.52 55.8067 233.053 56.3C232.587 56.7933 232.187 57.3933 231.853 58.1L231.013 65H227.833L229.573 50.52L228.333 50.1L228.493 49.3L232.453 48.88L232.953 49.16L232.113 56.08ZM249.19 62.92C248.83 63.4933 248.257 64.0333 247.47 64.54C246.683 65.0333 245.737 65.28 244.63 65.28C243.643 65.28 242.83 65.0733 242.19 64.66C241.55 64.2333 241.083 63.68 240.79 63C240.497 62.32 240.35 61.5867 240.35 60.8C240.35 59.44 240.623 58.2133 241.17 57.12C241.73 56.0267 242.49 55.1733 243.45 54.56C244.423 53.9333 245.497 53.62 246.67 53.62C247.763 53.62 248.57 53.86 249.09 54.34C249.61 54.82 249.87 55.44 249.87 56.2C249.87 57.1733 249.55 57.9867 248.91 58.64C248.27 59.28 247.483 59.7533 246.55 60.06C245.63 60.3667 244.717 60.5333 243.81 60.56C243.797 61.5467 243.95 62.2933 244.27 62.8C244.603 63.3067 245.063 63.56 245.65 63.56C246.33 63.56 246.897 63.4067 247.35 63.1C247.817 62.7933 248.223 62.4067 248.57 61.94L249.19 62.92ZM245.97 54.98C245.277 54.98 244.757 55.4267 244.41 56.32C244.077 57.2133 243.877 58.2333 243.81 59.38C244.223 59.3533 244.663 59.2267 245.13 59C245.597 58.76 245.99 58.42 246.31 57.98C246.63 57.54 246.79 57.0267 246.79 56.44C246.79 55.4667 246.517 54.98 245.97 54.98ZM255.117 56.54C255.357 55.7267 255.764 55.04 256.337 54.48C256.91 53.92 257.57 53.64 258.317 53.64C258.61 53.64 258.837 53.7067 258.997 53.84L258.337 57.26C258.284 57.1933 258.157 57.12 257.957 57.04C257.757 56.96 257.517 56.92 257.237 56.92C256.824 56.92 256.437 56.9667 256.077 57.06C255.73 57.14 255.464 57.26 255.277 57.42L254.237 65H251.157L252.417 55.58L251.377 55.02L251.537 54.16L254.737 53.64L255.257 53.98L255.157 55.82L255.117 56.54Z" fill="#365314"/>
<path d="M18.04 28.92C18.0133 29.0267 18 29.1867 18 29.4C18 30.0933 18.2667 30.44 18.8 30.44C19.2267 30.44 19.8267 30.12 20.6 29.48L21.16 30.72C20.8133 31.2533 20.1867 31.84 19.28 32.48C18.4 33.0933 17.3733 33.4 16.2 33.4C15.2933 33.4 14.5733 33.2 14.04 32.8C13.5067 32.4 13.2267 31.7867 13.2 30.96L13.28 30.28C12.5333 31.16 11.6267 31.9067 10.56 32.52C9.49333 33.1067 8.32 33.4 7.04 33.4C4.8 33.4 3.12 32.64 2 31.12C0.906667 29.5733 0.36 27.56 0.36 25.08C0.36 22.6267 0.866667 20.2667 1.88 18C2.92 15.7333 4.42667 13.88 6.4 12.44C8.37333 11 10.72 10.28 13.44 10.28C14.1333 10.28 14.88 10.36 15.68 10.52C16.5067 10.68 17.2267 10.8667 17.84 11.08L20.6 10.28L18.04 28.92ZM14.96 13.12C14.4533 12.88 13.8 12.76 13 12.76C11.4 12.76 10.0667 13.3733 9 14.6C7.93333 15.8 7.14667 17.3333 6.64 19.2C6.16 21.04 5.92 22.9067 5.92 24.8C5.92 26.56 6.18667 27.9333 6.72 28.92C7.25333 29.88 8.04 30.36 9.08 30.36C9.74667 30.36 10.4133 30.1333 11.08 29.68C11.7733 29.2267 12.3867 28.6933 12.92 28.08L14.96 13.12ZM31.5166 16.04C32.0232 14.52 32.8899 13.1867 34.1166 12.04C35.3699 10.8667 36.7699 10.28 38.3166 10.28C38.8499 10.28 39.3032 10.4 39.6766 10.64L38.5166 16.4C38.3566 16.2667 38.0899 16.1467 37.7166 16.04C37.3699 15.9067 36.9432 15.84 36.4366 15.84C35.4766 15.84 34.5566 16.0533 33.6766 16.48C32.7966 16.88 32.1166 17.4667 31.6366 18.24L29.6766 33H24.4766L26.9966 14L24.9566 12.88L25.2366 11.28L30.9566 10.32L31.8766 10.88L31.6766 14.52L31.5166 16.04ZM50.48 14.92C48.32 14.8667 46.9467 14.8533 46.36 14.88C45.48 14.9067 44.76 15.24 44.2 15.88C43.6667 16.4933 43.3733 17.2533 43.32 18.16H41.72C41.6667 17.5733 41.64 16.9733 41.64 16.36C41.64 15.0533 41.7467 13.8533 41.96 12.76C42.2 11.6667 42.5867 10.9867 43.12 10.72C43.5733 10.4533 44.2 10.32 45 10.32C46.4133 10.32 48.4933 10.44 51.24 10.68C51.8533 10.7067 52.72 10.76 53.84 10.84C54.9867 10.92 55.8267 10.96 56.36 10.96C57.2667 10.96 57.9733 10.7467 58.48 10.32L59.48 11.4L47.84 26.04L44.88 28.8L52.08 28.88C53.12 28.88 53.9333 28.5733 54.52 27.96C55.1067 27.32 55.4667 26.48 55.6 25.44H57.16C57.1867 25.7067 57.2 26.1733 57.2 26.84C57.2 28.2533 57.08 29.56 56.84 30.76C56.6267 31.9333 56.24 32.6933 55.68 33.04C55.3333 33.3067 54.6667 33.44 53.68 33.44C52.16 33.44 49.96 33.32 47.08 33.08C46.4133 33.0533 45.48 33 44.28 32.92C43.1067 32.84 42.2667 32.8 41.76 32.8C41.4133 32.8 41.04 32.8533 40.64 32.96C40.2667 33.0667 39.96 33.2267 39.72 33.44L38.56 32.32L51.36 16.68L53.52 14.96L50.48 14.92ZM79.4941 1.28L75.2541 33H69.9741L73.8141 3.84L71.3741 3.04L71.6941 1.56L78.4941 0.759998L79.4941 1.28ZM78.0141 20.48C79.1874 19.8133 80.1874 19.16 81.0141 18.52C81.8407 17.88 82.6674 17.0133 83.4941 15.92C84.1607 14.9867 84.5207 13.92 84.5741 12.72C84.6007 11.8933 84.8941 11.2933 85.4541 10.92C86.0407 10.5467 86.6807 10.36 87.3741 10.36C88.0674 10.36 88.6141 10.5733 89.0141 11C89.4141 11.4267 89.6141 11.96 89.6141 12.6C89.6407 13.56 89.3074 14.5333 88.6141 15.52C87.8941 16.4533 86.8941 17.3467 85.6141 18.2C84.3607 19.0533 83.0541 19.8 81.6941 20.44L86.0141 28.2C86.3341 28.76 86.6807 29.2 87.0541 29.52C87.4541 29.8133 87.8141 29.96 88.1341 29.96C88.4274 29.96 88.7607 29.8933 89.1341 29.76C89.5341 29.6 89.9074 29.3733 90.2541 29.08L90.8941 30.36C90.4407 31.0267 89.6807 31.6933 88.6141 32.36C87.5474 33.0267 86.3874 33.36 85.1341 33.36C84.2007 33.36 83.4407 33.1733 82.8541 32.8C82.2941 32.4267 81.8407 31.8667 81.4941 31.12L77.0541 21.08L78.0141 20.48ZM98.4463 29C98.4196 29.1333 98.4063 29.2933 98.4063 29.48C98.4063 30.12 98.6329 30.44 99.0863 30.44C99.3263 30.44 99.5929 30.36 99.8863 30.2C100.18 30.04 100.553 29.7733 101.006 29.4L101.526 30.64C101.073 31.2533 100.393 31.8667 99.4863 32.48C98.6063 33.0933 97.5263 33.4 96.2463 33.4C95.2063 33.4 94.3929 33.2 93.8063 32.8C93.2196 32.3733 92.9263 31.8 92.9263 31.08L92.9663 30.68C93.1263 29.2933 93.6729 25.2667 94.6063 18.6L95.2463 13.96L92.8863 12.84L93.1663 11.28L100.046 10.32L101.006 10.76L98.4463 29ZM98.8863 6.48C98.1663 6.48 97.5396 6.21333 97.0063 5.68C96.4996 5.12 96.2463 4.48 96.2463 3.76C96.2463 2.77333 96.5663 1.94667 97.2063 1.28C97.8729 0.613332 98.7129 0.279999 99.7263 0.279999C100.553 0.279999 101.206 0.546666 101.686 1.08C102.166 1.58666 102.406 2.2 102.406 2.92C102.406 3.93333 102.1 4.78667 101.486 5.48C100.873 6.14667 100.006 6.48 98.8863 6.48ZM106.137 14.6C106.03 14.1467 105.91 13.84 105.777 13.68C105.644 13.4933 105.47 13.4 105.257 13.4C104.91 13.4 104.51 13.5867 104.057 13.96L103.497 12.6C103.817 12.1733 104.417 11.6933 105.297 11.16C106.204 10.6 107.164 10.32 108.177 10.32C109.217 10.32 109.99 10.5467 110.497 11C111.004 11.4267 111.324 12.0933 111.457 13L113.777 28.2L114.337 32.6L116.217 28.8C117.364 26.4 118.23 24.2933 118.817 22.48C119.43 20.6667 119.737 18.9333 119.737 17.28C119.737 16.7733 119.697 16.3467 119.617 16C119.537 15.6533 119.417 15.2533 119.257 14.8C118.964 14.0533 118.817 13.3467 118.817 12.68C118.817 11.96 119.03 11.3867 119.457 10.96C119.91 10.5333 120.55 10.32 121.377 10.32C122.337 10.32 123.084 10.6933 123.617 11.44C124.177 12.1867 124.457 13.0933 124.457 14.16C124.457 16.0533 124.15 17.8533 123.537 19.56C122.924 21.24 121.99 23.3333 120.737 25.84C119.857 27.76 118.71 29.8933 117.297 32.24C115.91 34.56 114.684 36.52 113.617 38.12C112.524 39.8533 111.35 41.1067 110.097 41.88C108.87 42.6533 107.404 43.04 105.697 43.04C105.004 43.04 104.244 42.9467 103.417 42.76C102.617 42.6 102.07 42.4267 101.777 42.24L103.017 38.76C103.31 39.0267 103.804 39.2667 104.497 39.48C105.19 39.6933 105.87 39.8 106.537 39.8C107.737 39.8 108.884 39.3733 109.977 38.52C111.097 37.6933 112.204 36.3333 113.297 34.44H110.417L106.137 14.6ZM143.704 28.92C143.677 29.0267 143.664 29.1867 143.664 29.4C143.664 30.0933 143.931 30.44 144.464 30.44C144.891 30.44 145.491 30.12 146.264 29.48L146.824 30.72C146.477 31.2533 145.851 31.84 144.944 32.48C144.064 33.0933 143.037 33.4 141.864 33.4C140.957 33.4 140.237 33.2 139.704 32.8C139.171 32.4 138.891 31.7867 138.864 30.96L138.944 30.28C138.197 31.16 137.291 31.9067 136.224 32.52C135.157 33.1067 133.984 33.4 132.704 33.4C130.464 33.4 128.784 32.64 127.664 31.12C126.571 29.5733 126.024 27.56 126.024 25.08C126.024 22.6267 126.531 20.2667 127.544 18C128.584 15.7333 130.091 13.88 132.064 12.44C134.037 11 136.384 10.28 139.104 10.28C139.797 10.28 140.544 10.36 141.344 10.52C142.171 10.68 142.891 10.8667 143.504 11.08L146.264 10.28L143.704 28.92ZM140.624 13.12C140.117 12.88 139.464 12.76 138.664 12.76C137.064 12.76 135.731 13.3733 134.664 14.6C133.597 15.8 132.811 17.3333 132.304 19.2C131.824 21.04 131.584 22.9067 131.584 24.8C131.584 26.56 131.851 27.9333 132.384 28.92C132.917 29.88 133.704 30.36 134.744 30.36C135.411 30.36 136.077 30.1333 136.744 29.68C137.437 29.2267 138.051 28.6933 138.584 28.08L140.624 13.12ZM166.873 15.4C167.859 13.8533 169.033 12.6133 170.393 11.68C171.779 10.7467 173.246 10.28 174.793 10.28C176.366 10.28 177.579 10.7333 178.433 11.64C179.313 12.5467 179.753 14.0533 179.753 16.16C179.753 16.9867 179.593 18.2933 179.273 20.08C178.979 21.8667 178.819 22.88 178.793 23.12L178.553 24.4C178.393 25.28 178.233 26.1867 178.073 27.12C177.939 28.0533 177.873 28.8133 177.873 29.4C177.873 30.12 178.099 30.48 178.553 30.48C178.793 30.48 179.046 30.4133 179.313 30.28C179.579 30.12 179.953 29.8533 180.433 29.48L180.953 30.72C180.606 31.2533 179.966 31.84 179.033 32.48C178.099 33.0933 176.979 33.4 175.673 33.4C174.366 33.4 173.473 33.1467 172.993 32.64C172.513 32.1067 172.273 31.36 172.273 30.4C172.299 29.6 172.553 28.0133 173.033 25.64L173.273 24.28C173.326 24.04 173.433 23.4 173.593 22.36C173.779 21.32 173.926 20.3333 174.033 19.4C174.139 18.44 174.193 17.6133 174.193 16.92C174.193 15.6933 174.046 14.8533 173.753 14.4C173.459 13.9467 172.966 13.72 172.273 13.72C171.366 13.72 170.353 14.24 169.233 15.28C168.139 16.2933 167.206 17.5333 166.433 19L164.673 33H159.353L162.993 3.84L160.593 3.04L160.873 1.56L167.713 0.759998L168.673 1.28L166.873 15.4ZM201.634 28.92C201.607 29.0267 201.594 29.1867 201.594 29.4C201.594 30.0933 201.86 30.44 202.394 30.44C202.82 30.44 203.42 30.12 204.194 29.48L204.754 30.72C204.407 31.2533 203.78 31.84 202.874 32.48C201.994 33.0933 200.967 33.4 199.794 33.4C198.887 33.4 198.167 33.2 197.634 32.8C197.1 32.4 196.82 31.7867 196.794 30.96L196.874 30.28C196.127 31.16 195.22 31.9067 194.154 32.52C193.087 33.1067 191.914 33.4 190.634 33.4C188.394 33.4 186.714 32.64 185.594 31.12C184.5 29.5733 183.954 27.56 183.954 25.08C183.954 22.6267 184.46 20.2667 185.474 18C186.514 15.7333 188.02 13.88 189.994 12.44C191.967 11 194.314 10.28 197.034 10.28C197.727 10.28 198.474 10.36 199.274 10.52C200.1 10.68 200.82 10.8667 201.434 11.08L204.194 10.28L201.634 28.92ZM198.554 13.12C198.047 12.88 197.394 12.76 196.594 12.76C194.994 12.76 193.66 13.3733 192.594 14.6C191.527 15.8 190.74 17.3333 190.234 19.2C189.754 21.04 189.514 22.9067 189.514 24.8C189.514 26.56 189.78 27.9333 190.314 28.92C190.847 29.88 191.634 30.36 192.674 30.36C193.34 30.36 194.007 30.1333 194.674 29.68C195.367 29.2267 195.98 28.6933 196.514 28.08L198.554 13.12ZM214.11 29C214.084 29.1333 214.07 29.2933 214.07 29.48C214.07 30.12 214.297 30.44 214.75 30.44C214.99 30.44 215.257 30.36 215.55 30.2C215.844 30.04 216.217 29.7733 216.67 29.4L217.19 30.64C216.737 31.2533 216.057 31.8667 215.15 32.48C214.27 33.0933 213.19 33.4 211.91 33.4C210.87 33.4 210.057 33.2 209.47 32.8C208.884 32.3733 208.59 31.8 208.59 31.08L208.63 30.68C208.79 29.2933 209.337 25.2667 210.27 18.6L210.91 13.96L208.55 12.84L208.83 11.28L215.71 10.32L216.67 10.76L214.11 29ZM214.55 6.48C213.83 6.48 213.204 6.21333 212.67 5.68C212.164 5.12 211.91 4.48 211.91 3.76C211.91 2.77333 212.23 1.94667 212.87 1.28C213.537 0.613332 214.377 0.279999 215.39 0.279999C216.217 0.279999 216.87 0.546666 217.35 1.08C217.83 1.58666 218.07 2.2 218.07 2.92C218.07 3.93333 217.764 4.78667 217.15 5.48C216.537 6.14667 215.67 6.48 214.55 6.48Z" fill="#EC4899"/>
</svg>


          </div>

          <p className="pt-2 text-base text-center">A collection of 5,555 sher NFTs, the first-ever generative on-chain Hindi couplets.</p>
          <blockquote className="text-2xl font-semibold italic text-center text-slate-900 ">
          PUBLIC MINT IS LIVE!
          </blockquote>  
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (

            
            <div className="flex flex-col px-2  justify-center items-center ">
              <button onClick={askContractToMintNft} disabled={mining} className=" inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-sky-600 hover:bg-sky-700">
              
               {mining ?
               <span className="flex">
                  <svg className="motion-reduce:hidden animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
                 Minting...</span>
               :
               <span>Mint NFT</span>
              }
            </button>
            { errorMessage ?
            <div className="mt-5 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">Mint Successful! </strong>
                      {errorMessage && (
                          <span className="block sm:inline break-all"> Here's the link: <br/>
                          <a target="_blank" rel="noreferrer" className="no-underline hover:underline" href= {errorMessage}>{errorMessage}</a> 
                          </span>
                        )}
                      
                      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                       
                      </span>
                    </div>
                    :
                    <span></span>
                      }
                     <div className="flex justify-center mt-5">
                     
                    <span className="text-base dark:text-white text-slate-600"> Total Minted : { totalMinted } / 5,000</span>
                    
                                        
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 mt-2">
                     <div className="bg-sky-500 h-6 rounded-full" style={{width: (Math.round( ( totalMinted * 100 ) / 5000))+"%"}}> </div>
                   </div>
                   </div>
            )}

     
 

        <div className="py-3 text-base leading-7 font-semibold flex flex-col items-center">
          <p className="text-gray-900">Want to check out the collection?</p>
          <p>
            <a href={OPENSEA_LINK}  target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-700">View in Opensea</a>
          </p>
        </div>
        
        <div className="pb-3 text-base leading-7 space-y-6 text-gray-600 ">
          
          <ul className="space-y-4">
            <li className="flex items-center">
            <svg className="w-6 h-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"></path>
              </svg>
              <p className="ml-4">
              Each Sher is programmatically generated. 
              </p>
            </li>
            <li className="flex items-center">
            <svg className="w-6 h-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"></path>
              </svg>
              <p className="ml-4">
              High Quality SVG, with proof of ownership, entirely built on-chain.
              </p>
            </li>
            <li className="flex items-center">
            <svg className="w-6 h-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"></path>
              </svg>
              <p className="ml-4">
              All sher are beautiful, but some are rarer than others. 
              </p>
            </li>
            <li className="flex items-center">
            <svg className="w-6 h-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"></path>
              </svg>
              <p className="ml-4">
              The shers are stored as ERC-721 tokens on the Polygon blockchain. 
              </p>
            </li>
            <li className="flex items-center">
            <svg className="w-6 h-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none"></path>
              </svg>
              <p className="ml-4">
              Purchase of a sher will cost only 
                <code className="text-sm font-bold text-gray-900"> 5 MATIC.</code>  	
              </p>
            </li>
          </ul>
          <p className="text-center"> This project was inspired by the below tweet from 
          <a className="text-sky-600 hover:text-sky-700 font-bold"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{` Anuraag Saxena.`}</a></p>
          <img alt="Twitter Logo" className="ml-1 mr-2 " src={gulzarPic} />

          <p className="text-gray-900 font-semibold ">Frequently Asked Questions</p>
       

    <details className="open:bg-white dark:open:bg-slate-600 " open>
    <summary className="leading-6 text-slate-600 dark:text-white  select-none">
    What is the contract address?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 dark:text-slate-400">
     <a className="italic"
            href={CONTRACT_LINK}
            target="_blank"
            rel="noreferrer"
          >{CONTRACT_ADDRESS}</a> 
    </div>
  </details>

  <details className="open:bg-white dark:open:bg-slate-600 " >
    <summary className="leading-6 text-slate-600 dark:text-white  select-none">
    How many total shers can be minted?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 dark:text-slate-400">
      <p className="italic">5,555 shers can be minted by the contract. 5,000 are available for public mint. </p>
    </div>
  </details>


  <details className="open:bg-white dark:open:bg-slate-600 " >
    <summary className="leading-6 text-slate-600 dark:text-white  select-none">
    What does it cost to mint a sher NFT?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 dark:text-slate-400">
      <p className="italic">5 MATIC + gas.</p>
    </div>
  </details>


  <details className="open:bg-white dark:open:bg-slate-600 ">
    <summary className="leading-6 text-slate-600 dark:text-white select-none">
    How are the shers generated?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 dark:text-slate-400">
      <p className="italic">Each Sher is randomly generated based on a preset collection of words and poem structure.</p>
    </div>
  </details>

        </div>
      
        <div className="pb-3 text-base leading-7 space-y-6 text-gray-600">
          <p className="text-gray-900 font-semibold">Mint Milestone</p>
          <ul className="space-y-4">
            <li className="flex items-center">
            <svg className="fill-sky-500 w-4 h-4" viewBox="0 0 46 48" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M23.0002 0C12.5068 0 4.00017 8.50659 4.00017 19V32.5335C4.00017 32.8383 3.9145 33.1371 3.75292 33.3956L0.912672 37.94C0.0801118 39.2721 1.0378 41 2.60867 41H43.3917C44.9625 41 45.9202 39.2721 45.0877 37.94L42.2474 33.3956C42.0858 33.1371 42.0002 32.8383 42.0002 32.5335V19C42.0002 8.50659 33.4936 0 23.0002 0ZM23.0002 48C20.2388 48 18.0002 45.7614 18.0002 43H28.0002C28.0002 45.7614 25.7616 48 23.0002 48Z"></path></svg>

              <p className="ml-4">
              75% - Giveaway limited edition AKH headware and accessories to lucky NFT holders.
              </p>
            </li>
            <li className="flex items-center">
            <svg className="fill-sky-500 w-4 h-4" viewBox="0 0 46 48" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M23.0002 0C12.5068 0 4.00017 8.50659 4.00017 19V32.5335C4.00017 32.8383 3.9145 33.1371 3.75292 33.3956L0.912672 37.94C0.0801118 39.2721 1.0378 41 2.60867 41H43.3917C44.9625 41 45.9202 39.2721 45.0877 37.94L42.2474 33.3956C42.0858 33.1371 42.0002 32.8383 42.0002 32.5335V19C42.0002 8.50659 33.4936 0 23.0002 0ZM23.0002 48C20.2388 48 18.0002 45.7614 18.0002 43H28.0002C28.0002 45.7614 25.7616 48 23.0002 48Z"></path></svg>

              <p className="ml-4">
              100% - Giveaway limited edition AKH tees and hoodies to lucky NFT holders.
              </p>
            </li>
            </ul></div>




        <div className="flex p-3 justify-center items-center border-t text-slate-700 text-sm	 ">
        <blockquote className="font-semibold italic text-center text-slate-900  ">
            <span className="before:block before:absolute before:-inset-1 before:-skew-y-3 before:bg-sky-600 hover:skew-y-12 relative inline-block">
              <span className="relative text-white">© 2022 Cryptosher</span> 
            </span>
          </blockquote>
        </div>
        </div>

    </div>
    </div>
    </div>
  );
};

export default App;