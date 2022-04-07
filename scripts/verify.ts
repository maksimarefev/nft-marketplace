import { execSync } from "child_process";

function verify() {
    const contractAddress: string = process.argv[2];
    if (!contractAddress) {
        console.error("No contract address was provided");
        return;
    }

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

    const output: string = execSync(command, { encoding: "utf-8" });
    console.log(output);
}

verify();
