import { execSync } from "child_process";

const contractAddress: string = process.argv[2];
const constructorParameters: string = (() => {
    if (process.argv.length <= 3) {
        return "";
    } else {
        let result: string = "";

        for (let i: number = 3; i < process.argv.length; i++) {
            result += " " + process.argv[i];
        }

        return result;
    }
})();
const command: string = "npx hardhat verify --network rinkeby " + contractAddress + constructorParameters;
console.log("Running command:", command);

let output: string = execSync(command, { encoding: "utf-8" });
console.log(output);
