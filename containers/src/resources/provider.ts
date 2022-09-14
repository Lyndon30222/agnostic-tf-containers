import { TerraformStack } from "cdktf";
import { AwsProvider, AwsProviderConfig } from "../../.gen/providers/aws";
import {
  AzurermProvider,
  AzurermProviderConfig,
} from "../../.gen/providers/azurerm";
import { AgnosticResource } from "./AgnosticResource";
import { TerraformProvider  } from "cdktf";

export type ProviderConfig = AwsProviderConfig | AzurermProviderConfig;

export class Provider extends AgnosticResource<TerraformProvider> {
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
    console.info('Build Azure Provider');
    return new AzurermProvider(
        stack,
        this.name,
        this.config as AzurermProviderConfig
      );
  }
}
