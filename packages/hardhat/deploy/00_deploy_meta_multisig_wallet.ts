import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a "MetaMultiSigWallet" contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMetaMultiSigWallet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("MetaMultiSigWallet", {
    from: deployer,
    // Contract constructor arguments
    args: [
      31337,
      [
        // buidlguidl.eth
        "0x97843608a00e2bbc75ab0C1911387E002565DEDE",

        // others
        "0xA30998C0588F80825681919b1C59cA3957ffCC02",
        "0x573e6D59e6B6dB3434f71baEA4F15f23b2633910",
      ],
      2,
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract
  // const metaMultiSigWallet = await hre.ethers.getContract("MetaMultiSigWallet", deployer);
};

export default deployMetaMultiSigWallet;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags MetaMultiSigWallet
deployMetaMultiSigWallet.tags = ["MetaMultiSigWallet"];
