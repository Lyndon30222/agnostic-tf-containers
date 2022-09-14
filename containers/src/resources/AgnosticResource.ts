import { TerraformStack } from "cdktf";

export abstract class AgnosticResource {
    abstract buildAWS(stack: TerraformStack): unknown;
    abstract buildAzure(stack: TerraformStack): unknown;

    abstract build(stack: TerraformStack): unknown ;
}
