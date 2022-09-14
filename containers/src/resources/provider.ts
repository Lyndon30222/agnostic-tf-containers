import { TerraformStack } from "cdktf";
import { AwsProvider, AwsProviderConfig } from "../../.gen/providers/aws";
import {
  AzurermProvider,
  AzurermProviderConfig,
} from "../../.gen/providers/azurerm";
import { AgnosticResource } from "./AgnosticResource";
import { TerraformProvider  } from "cdktf";

type ProviderConfig = AwsProviderConfig | AzurermProviderConfig;

export class Provider extends AgnosticResource {
  constructor(private name: string, private config: ProviderConfig) {
    super();
  }

  buildAWS(stack: TerraformStack): AwsProvider {
    return new AwsProvider(
        stack,
        this.name,
        this.config as AwsProviderConfig
      );
  }

  buildAzure(stack: TerraformStack): AzurermProvider {
    return new AzurermProvider(
        stack,
        this.name,
        this.config as AzurermProviderConfig
      );
  }

  build(stack: TerraformStack): TerraformProvider {
    const { PROVIDER } = process.env;

    if (PROVIDER === "aws") {
      return this.buildAWS(stack);
    } else if (PROVIDER === "azure") {
      return this.buildAzure(stack);
    }
    
    throw new Error(`Unknown provider:  ${PROVIDER} - unable to create provider`);
  }
}
