import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { AWSCluster } from "../resources/containers/aws/AwsCluster";
import { Provider } from "../resources/provider";

export class ContainerStack extends TerraformStack {
    constructor(scope: Construct, private name: string) {
        super(scope, name);
        const { PROVIDER } = process.env;

        // lets create a provider to run this stack with
        new Provider(`${name}-container-provider`, { region: 'eu-west-2' }).build(this);
        
        // based on provider let's create our container stack
        if(PROVIDER === 'aws') {
            this.buildAWS();
        } else if(PROVIDER === 'azure') {
            this.buildAzure();
        }
    }

    private buildAWS() {
        new AWSCluster(this, this.name);
    }

    private buildAzure() {

    }
}