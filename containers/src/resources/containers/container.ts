import { TerraformStack } from "cdktf";
import { AgnosticResource } from "../AgnosticResource";
import { AWSCluster } from "./aws/AwsCluster";
import { AzureContainers } from "./azure/AzureContainers";

export interface IContainerConfig {
    aws?: {
        tags: { [key: string]: string };
        region: string;
        container: {
            cpu: number;
            memory: number;
            count: number;
            environment: { [key: string]: string };
            port: number;
        };
        network: {
            subnets: string[];
            securityGroups: string[];
        }
        // probably some permission based stuff
    };
    azure?: {
        location: string;
    };
    image: string;
}

export class Container extends AgnosticResource<{ id: string }> {
    constructor(private name: string, private config: IContainerConfig) {
        super();
    }

    buildAWS(stack: TerraformStack): { id: string } {
        const { id } = new AWSCluster(stack, this.name, this.config);
        return { id };
    }

    buildAzure(stack: TerraformStack): { id: string } {
        console.info('Build Azure Container Stack');
        const { id } = new AzureContainers(stack, this.name, this.config);
        return { id };
    }
}