# Agnostic Deployments
## Info
---
The stack is initially declared in `main.ts`. Here you can add multiple stacks if you want to duplicate what's created assuming you give a unique name.

Inside `container-stack.ts` you can see we are declaring a provider and a container;

The provider is required by terraform to know what it's doing.

The container is using `container.ts` to request a container solution based on environment variable `PROVIDER`. 

Container extends `AgnosticResource` meaning that as long as `buildAWS` and `buildAzure` are defined then the decision of which to call is done behind the scenes.

## Planning
---
### AWS
PROVIDER=aws npm run plan
### AZURE
PROVIDER=azure npm run plan

After running a plan you can see the output of this in the `cdktf.out` folder. The output is fairly readable and similar to the output of a plan when running terraform CLI.

## Deploying
---
Before running this make sure you aer connected to the target cloud provider.

### AWS
PROVIDER=aws npm run apply
### AZURE
PROVIDER=azure npm run apply
