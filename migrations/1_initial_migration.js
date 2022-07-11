const Migrations = artifacts.require("Migrations");
const SBT = artifacts.require("SBT");


module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(SBT);
};
