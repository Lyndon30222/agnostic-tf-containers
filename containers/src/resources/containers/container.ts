import { TerraformStack } from "cdktf";
import { AgnosticResource } from "../AgnosticResource";
import { AWSCluster } from "./aws/AwsCluster";

export class Container extends AgnosticResource {
    constructor(private name: string) {
        super();
    }

    buildAWS(stack: TerraformStack): { id: string } {
        const { id } = new AWSCluster(stack, this.name);
        return { id };
    }

    buildAzure(stack: TerraformStack): { id: string } {
        throw new Error("Method not implemented.");
    }

    build(stack: TerraformStack): { id: string } {
        const { PROVIDER } = process.env;
        if(PROVIDER === 'aws') {
            return this.buildAWS(stack);
        } else if(PROVIDER === 'azure') {
            return this.buildAzure(stack);
        }

        throw new Error(`Unknown provider:  ${PROVIDER} - unable to create container stack`);
    }
}