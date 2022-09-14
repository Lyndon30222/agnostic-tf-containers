import { App } from "cdktf";
import { ContainerStack } from "./src/stacks/container-stack";

// process.env.PROVIDER = 'azure';
const app = new App();

new ContainerStack(app, "agnostic-containers");

app.synth();
