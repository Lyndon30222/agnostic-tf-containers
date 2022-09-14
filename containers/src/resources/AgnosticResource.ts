import { TerraformStack } from "cdktf";

export abstract class AgnosticResource<T> {
    abstract buildAWS(stack: TerraformStack): T;
    abstract buildAzure(stack: TerraformStack): T;

    build(stack: TerraformStack): T {
        const { PROVIDER } = process.env;

        if (PROVIDER === "aws") {
            return this.buildAWS(stack);
        } else if (PROVIDER === "azure") {
            return this.buildAzure(stack);
        }
        
        throw new Error(`Unknown provider:  ${PROVIDER}`);
    } ;
}
