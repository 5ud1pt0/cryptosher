import React, { useEffect, useState } from "react";
import './styles/App.css';
import { ethers } from "ethers";
import CryptoSher from './utils/CryptoSher.json';
import { toast } from "react-hot-toast";

import { networks } from './utils/network.js';
import gulzarPic from './assets/Gulzar.jpeg';

const TWITTER_HANDLE = 'anuraag_saxena';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/cryptosher';
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
        toast("You are not connected to the Polygon Network!");
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
          <svg width="204" height="42" viewBox="0 0 204 42" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.76 5.8C17.96 5.42667 17.0133 5.24 15.92 5.24C13.8133 5.24 12.04 6 10.6 7.52C9.18667 9.04 8.13333 10.96 7.44 13.28C6.77333 15.5733 6.46667 17.8933 6.52 20.24C6.73333 27.12 8.8 30.56 12.72 30.56C13.5733 30.56 14.4267 30.4533 15.28 30.24C16.16 30 16.8933 29.5733 17.48 28.96C17.9067 28.2667 18.3867 26.92 18.92 24.92H22.2L21.36 30.76C18.8267 32.4667 15.64 33.32 11.8 33.32C9.13333 33.32 6.94667 32.7333 5.24 31.56C3.53333 30.3867 2.29333 28.84 1.52 26.92C0.746667 24.9733 0.36 22.8133 0.36 20.44C0.36 16.8667 1.05333 13.76 2.44 11.12C3.82667 8.48 5.76 6.45333 8.24 5.04C10.72 3.62666 13.56 2.92 16.76 2.92C18.28 2.92 19.48 2.98667 20.36 3.12C21.2667 3.25333 22 3.4 22.56 3.56C23.12 3.69333 23.5067 3.78667 23.72 3.84L24.44 4.04L23.24 11.64H19.32L18.76 5.8ZM33.0009 16.04C33.5076 14.52 34.3743 13.1867 35.6009 12.04C36.8543 10.8667 38.2543 10.28 39.8009 10.28C40.3343 10.28 40.7876 10.4 41.1609 10.64L40.0009 16.4C39.8409 16.2667 39.5743 16.1467 39.2009 16.04C38.8543 15.9067 38.4276 15.84 37.9209 15.84C36.9609 15.84 36.0409 16.0533 35.1609 16.48C34.2809 16.88 33.6009 17.4667 33.1209 18.24L31.1609 33H25.9609L28.4809 14L26.4409 12.88L26.7209 11.28L32.4409 10.32L33.3609 10.88L33.1609 14.52L33.0009 16.04ZM43.3244 14.6C43.2177 14.1467 43.0977 13.84 42.9644 13.68C42.831 13.4933 42.6577 13.4 42.4444 13.4C42.0977 13.4 41.6977 13.5867 41.2444 13.96L40.6844 12.6C41.0044 12.1733 41.6044 11.6933 42.4844 11.16C43.391 10.6 44.351 10.32 45.3644 10.32C46.4044 10.32 47.1777 10.5467 47.6844 11C48.191 11.4267 48.511 12.0933 48.6444 13L50.9644 28.2L51.5244 32.6L53.4044 28.8C54.551 26.4 55.4177 24.2933 56.0044 22.48C56.6177 20.6667 56.9244 18.9333 56.9244 17.28C56.9244 16.7733 56.8844 16.3467 56.8044 16C56.7244 15.6533 56.6044 15.2533 56.4444 14.8C56.151 14.0533 56.0044 13.3467 56.0044 12.68C56.0044 11.96 56.2177 11.3867 56.6444 10.96C57.0977 10.5333 57.7377 10.32 58.5644 10.32C59.5244 10.32 60.271 10.6933 60.8044 11.44C61.3644 12.1867 61.6444 13.0933 61.6444 14.16C61.6444 16.0533 61.3377 17.8533 60.7244 19.56C60.111 21.24 59.1777 23.3333 57.9244 25.84C57.0444 27.76 55.8977 29.8933 54.4844 32.24C53.0977 34.56 51.871 36.52 50.8044 38.12C49.711 39.8533 48.5377 41.1067 47.2844 41.88C46.0577 42.6533 44.591 43.04 42.8844 43.04C42.191 43.04 41.431 42.9467 40.6044 42.76C39.8044 42.6 39.2577 42.4267 38.9644 42.24L40.2044 38.76C40.4977 39.0267 40.991 39.2667 41.6844 39.48C42.3777 39.6933 43.0577 39.8 43.7244 39.8C44.9244 39.8 46.071 39.3733 47.1644 38.52C48.2844 37.6933 49.391 36.3333 50.4844 34.44H47.6044L43.3244 14.6ZM71.4116 12.92C72.1049 12.1467 72.9449 11.52 73.9316 11.04C74.9182 10.5333 75.9982 10.28 77.1716 10.28C79.3849 10.28 81.0649 11.0267 82.2116 12.52C83.3582 14.0133 83.9316 16.0933 83.9316 18.76C83.9316 21.2933 83.3982 23.68 82.3316 25.92C81.2649 28.16 79.7449 29.9733 77.7716 31.36C75.8249 32.72 73.5716 33.4 71.0116 33.4C70.3182 33.4 69.5316 33.3067 68.6516 33.12L67.2516 43.16H62.1316L66.0916 13.84L63.9716 12.84L64.2916 11.24L70.7716 10.28L71.6916 10.72L71.4116 12.92ZM69.0116 30.44C69.6249 30.76 70.4649 30.92 71.5316 30.92C73.0516 30.92 74.3182 30.3333 75.3316 29.16C76.3716 27.9867 77.1316 26.48 77.6116 24.64C78.1182 22.8 78.3716 20.8667 78.3716 18.84C78.3716 17.1867 78.0916 15.8533 77.5316 14.84C76.9982 13.8267 76.2116 13.32 75.1716 13.32C74.3449 13.32 73.5849 13.5733 72.8916 14.08C72.1982 14.56 71.5849 15.16 71.0516 15.88L69.0116 30.44ZM93.3291 25.68C93.1424 27.2267 93.0491 28.16 93.0491 28.48C93.0491 29.0933 93.1691 29.5333 93.4091 29.8C93.6491 30.04 94.0624 30.16 94.6491 30.16C95.1824 30.16 95.7824 30.04 96.4491 29.8C97.1424 29.5333 97.7157 29.2133 98.1691 28.84L98.6091 30.32C97.9157 31.0933 96.9291 31.8 95.6491 32.44C94.3691 33.08 92.9291 33.4 91.3291 33.4C90.2091 33.4 89.3157 33.12 88.6491 32.56C88.0091 31.9733 87.6891 31.0533 87.6891 29.8C87.6891 29.2667 87.8224 28.0133 88.0891 26.04L89.7691 13.64H87.3691L87.8091 11.72L90.2091 10.88C91.0091 10.1333 91.9557 8.29333 93.0491 5.36H96.0491L95.3691 10.8H100.169L99.7691 13.64H94.9691L93.3291 25.68ZM113.068 10.24C115.841 10.24 117.961 11.0533 119.428 12.68C120.894 14.28 121.628 16.5867 121.628 19.6C121.628 22.08 121.121 24.3867 120.108 26.52C119.094 28.6533 117.668 30.36 115.828 31.64C113.988 32.8933 111.881 33.52 109.508 33.52C106.734 33.52 104.614 32.7067 103.148 31.08C101.708 29.4267 100.988 27.08 100.988 24.04C100.988 21.5333 101.481 19.2267 102.468 17.12C103.481 15.0133 104.908 13.3467 106.748 12.12C108.588 10.8667 110.694 10.24 113.068 10.24ZM112.388 12.76C111.161 12.76 110.121 13.32 109.268 14.44C108.414 15.5333 107.774 16.9333 107.348 18.64C106.948 20.3467 106.748 22.0933 106.748 23.88C106.748 26.4133 107.028 28.2667 107.588 29.44C108.174 30.6133 109.081 31.2 110.308 31.2C111.508 31.2 112.521 30.64 113.348 29.52C114.174 28.4 114.788 26.9733 115.188 25.24C115.588 23.5067 115.788 21.7333 115.788 19.92C115.788 17.3867 115.508 15.56 114.948 14.44C114.414 13.32 113.561 12.76 112.388 12.76ZM138.263 14.6C137.943 14.2267 137.409 13.84 136.663 13.44C135.943 13.04 135.103 12.84 134.143 12.84C133.076 12.84 132.209 13.08 131.543 13.56C130.903 14.0133 130.583 14.6933 130.583 15.6C130.583 16.4 130.849 17.12 131.383 17.76C131.943 18.3733 132.836 19.12 134.063 20C135.423 21.0133 136.463 22 137.183 22.96C137.903 23.8933 138.263 25.0933 138.263 26.56C138.263 28.0267 137.863 29.28 137.063 30.32C136.263 31.3333 135.196 32.1067 133.863 32.64C132.529 33.1467 131.063 33.4 129.463 33.4C128.263 33.4 127.036 33.2667 125.783 33C124.529 32.7067 123.716 32.4 123.343 32.08L124.143 28.68C124.703 29.16 125.463 29.6133 126.423 30.04C127.383 30.4667 128.383 30.68 129.423 30.68C130.409 30.68 131.249 30.4533 131.943 30C132.663 29.5467 133.023 28.84 133.023 27.88C133.023 27.0533 132.716 26.3067 132.103 25.64C131.489 24.9733 130.569 24.2133 129.343 23.36C128.223 22.5867 127.276 21.68 126.503 20.64C125.756 19.5733 125.383 18.2933 125.383 16.8C125.383 15.52 125.743 14.3867 126.463 13.4C127.209 12.4133 128.223 11.6533 129.503 11.12C130.809 10.56 132.303 10.28 133.983 10.28C134.969 10.28 135.969 10.36 136.983 10.52C137.996 10.68 138.676 10.8533 139.023 11.04L138.263 14.6ZM149.373 15.4C150.359 13.8533 151.533 12.6133 152.893 11.68C154.279 10.7467 155.746 10.28 157.293 10.28C158.866 10.28 160.079 10.7333 160.933 11.64C161.813 12.5467 162.253 14.0533 162.253 16.16C162.253 16.9867 162.093 18.2933 161.773 20.08C161.479 21.8667 161.319 22.88 161.293 23.12L161.053 24.4C160.893 25.28 160.733 26.1867 160.573 27.12C160.439 28.0533 160.373 28.8133 160.373 29.4C160.373 30.12 160.599 30.48 161.053 30.48C161.293 30.48 161.546 30.4133 161.813 30.28C162.079 30.12 162.453 29.8533 162.933 29.48L163.453 30.72C163.106 31.2533 162.466 31.84 161.533 32.48C160.599 33.0933 159.479 33.4 158.173 33.4C156.866 33.4 155.973 33.1467 155.493 32.64C155.013 32.1067 154.773 31.36 154.773 30.4C154.799 29.6 155.053 28.0133 155.533 25.64L155.773 24.28C155.826 24.04 155.933 23.4 156.093 22.36C156.279 21.32 156.426 20.3333 156.533 19.4C156.639 18.44 156.693 17.6133 156.693 16.92C156.693 15.6933 156.546 14.8533 156.253 14.4C155.959 13.9467 155.466 13.72 154.773 13.72C153.866 13.72 152.853 14.24 151.733 15.28C150.639 16.2933 149.706 17.5333 148.933 19L147.173 33H141.853L145.493 3.84L143.093 3.04L143.373 1.56L150.213 0.759998L151.173 1.28L149.373 15.4ZM183.574 29C182.88 30.0933 181.747 31.12 180.174 32.08C178.627 33.04 176.827 33.52 174.774 33.52C172.854 33.52 171.267 33.1067 170.014 32.28C168.787 31.4533 167.894 30.3733 167.334 29.04C166.774 27.7067 166.494 26.2533 166.494 24.68C166.494 22.0133 167.027 19.5867 168.094 17.4C169.187 15.1867 170.667 13.44 172.534 12.16C174.4 10.88 176.48 10.24 178.774 10.24C180.827 10.24 182.347 10.72 183.334 11.68C184.347 12.6133 184.854 13.84 184.854 15.36C184.854 17.28 184.16 18.88 182.774 20.16C181.387 21.44 179.72 22.4 177.774 23.04C175.827 23.6533 173.987 23.9867 172.254 24.04C172.2 25.96 172.507 27.5067 173.174 28.68C173.867 29.8533 174.907 30.44 176.294 30.44C178.587 30.44 180.667 29.3733 182.534 27.24L183.574 29ZM177.574 12.72C176 12.72 174.76 13.6667 173.854 15.56C172.947 17.4533 172.414 19.56 172.254 21.88C173.294 21.8267 174.387 21.5467 175.534 21.04C176.707 20.5333 177.68 19.8267 178.454 18.92C179.254 17.9867 179.654 16.92 179.654 15.72C179.654 14.76 179.467 14.0267 179.094 13.52C178.747 12.9867 178.24 12.72 177.574 12.72ZM195.032 16.04C195.539 14.52 196.406 13.1867 197.632 12.04C198.886 10.8667 200.286 10.28 201.832 10.28C202.366 10.28 202.819 10.4 203.192 10.64L202.032 16.4C201.872 16.2667 201.606 16.1467 201.232 16.04C200.886 15.9067 200.459 15.84 199.952 15.84C198.992 15.84 198.072 16.0533 197.192 16.48C196.312 16.88 195.632 17.4667 195.152 18.24L193.192 33H187.992L190.512 14L188.472 12.88L188.752 11.28L194.472 10.32L195.392 10.88L195.192 14.52L195.032 16.04Z" fill="#EC4899"/>
</svg>

          </div>

          <p className="pt-2 text-base text-center">The first on-chain generative Hindi couplets with proof of ownership stored on the Polygon blockchain.</p>
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
                     
                    <span className="text-base  text-slate-600"> Total Minted : { totalMinted } / 5,000</span>
                    
                                        
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-6 mt-2">
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
              A collection of 5,555 programmatically generated sher NFTs.  
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
          <p className="text-center"> This project was inspired by  
          <a className="text-sky-600 hover:text-sky-700 font-bold"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{` Anuraag Saxena`}</a>'s - How to write like Gulzar.</p>
          <img alt="Twitter Logo" className="ml-1 mr-2 " src={gulzarPic} />

          <p className="text-gray-900 font-semibold ">Frequently Asked Questions</p>
       

    <details className="open:bg-white" open>
    <summary className="leading-6 text-slate-600   select-none">
    What is the contract address?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 ">
     <a className="italic"
            href={CONTRACT_LINK}
            target="_blank"
            rel="noreferrer"
          >{CONTRACT_ADDRESS}</a> 
    </div>
  </details>

  <details className="open:bg-white  " >
    <summary className="leading-6 text-slate-600   select-none">
    How many total shers can be minted?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 ">
      <p className="italic">5,555 shers can be minted by the contract. 5,000 are available for public mint. </p>
    </div>
  </details>


  <details className="open:bg-white  " >
    <summary className="leading-6 text-slate-600   select-none">
    What does it cost to mint a sher NFT?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 ">
      <p className="italic">5 MATIC + gas.</p>
    </div>
  </details>


  <details className="open:bg-white  ">
    <summary className="leading-6 text-slate-600  select-none">
    How are the shers generated?
    </summary>
    <div className="mt-3 leading-6 text-slate-600 ">
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
              85% - Giveaway limited edition merch to selected Cryptosher NFT holders.
              </p>
            </li>
            <li className="flex items-center">
            <svg className="fill-sky-500 w-4 h-4" viewBox="0 0 46 48" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M23.0002 0C12.5068 0 4.00017 8.50659 4.00017 19V32.5335C4.00017 32.8383 3.9145 33.1371 3.75292 33.3956L0.912672 37.94C0.0801118 39.2721 1.0378 41 2.60867 41H43.3917C44.9625 41 45.9202 39.2721 45.0877 37.94L42.2474 33.3956C42.0858 33.1371 42.0002 32.8383 42.0002 32.5335V19C42.0002 8.50659 33.4936 0 23.0002 0ZM23.0002 48C20.2388 48 18.0002 45.7614 18.0002 43H28.0002C28.0002 45.7614 25.7616 48 23.0002 48Z"></path></svg>

              <p className="ml-4">
              100% - Kickoff of Project Mahfil, a platform for sharing beautiful poetry on-chain.
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