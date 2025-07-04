// scripts/deploy.js
async function main() {
  const CRID = await hre.ethers.getContractFactory("Crid");
  const crid = await CRID.deploy();
  await crid.waitForDeployment();

  console.log(`Contrato CRID deployado em: ${crid.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});