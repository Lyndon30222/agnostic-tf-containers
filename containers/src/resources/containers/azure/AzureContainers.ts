import { TerraformStack } from "cdktf";
import { ResourceGroup, AppServicePlan, AppService } from "../../../../.gen/providers/azurerm";
import { IContainerConfig } from "../container";

export class AzureContainers {
    public id: string = '';

    constructor(private stack: TerraformStack, private name: string, private config: IContainerConfig) {
        const groupName = `${this.name}-container-group`
        const containerGroup = new ResourceGroup(stack, groupName, {
            name: groupName,
            location: this.config.azure!.location
        });

        const appServicePlan = new AppServicePlan(this.stack, `${this.name}-app-service-plan`, {
            kind: 'Linux',
            reserved: true,
            resourceGroupName: containerGroup.name,
            location: containerGroup.location,
            name: `${this.name}-app-service-plan`,
            sku: { size: "F1", tier: "free" }
        });

        const app = new AppService(this.stack, `${this.name}-app-service`, {
            name: `${this.name}-app-service`,
            location: containerGroup.location,
            appServicePlanId: appServicePlan.id,
            resourceGroupName: containerGroup.name,
            clientAffinityEnabled: false,
            httpsOnly: true,
            siteConfig: {
                linuxFxVersion: `DOCKER|${this.config.image}`,
                use32BitWorkerProcess: true // required for free tier
            }
        });

        this.id = app.id;
    }
}