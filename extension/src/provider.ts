import * as createMetaMaskProvider from "metamask-extension-provider";
import Web3 from "web3";
import { provider } from "web3-core";

const web3Provider = createMetaMaskProvider.default();
const web3 = new Web3(web3Provider as provider);

export { web3, web3Provider };
