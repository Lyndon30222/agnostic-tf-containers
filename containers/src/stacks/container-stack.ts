import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { Container } from "../resources/containers/container";
import { Provider, ProviderConfig } from "../resources/provider";

const providerConfigs: { [key: string]: ProviderConfig } = {
    aws: { region: 'eu-west-2' },
    azure: { features:{} }
}

export class ContainerStack extends TerraformStack {
    constructor(scope: Construct, private name: string) {
        super(scope, name);
        const { PROVIDER = '' } = process.env;

        // lets create a provider to run this stack with
        const providerConfig = providerConfigs[PROVIDER];
        new Provider(`${name}-container-provider`, providerConfig).build(this);
        
        new Container(this.name, {
            image: 'nginx:latest',
            aws: {
                tags: {},
                region: 'eu-west-2',
                container: {
                    cpu: 256,
                    memory: 512,
                    count: 1,
                    environment: {},
                    port: 80
                },
                network: {
                    subnets: [
                        "subnet-a38972d8",
                        "subnet-92776ad8",
                        "subnet-abb676c2"
                    ],
                    securityGroups: [
                        "sg-cb66cfa2"
                    ]
                }
            },
            azure: {
                location: 'westeurope'
            }
        }).build(this);
    }
}