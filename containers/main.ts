import { App } from "cdktf";
import { ContainerStack } from "./src/stacks/container-stack";

process.env.PROVIDER = 'aws';
const app = new App();

new ContainerStack(app, "agnostic-containers");

app.synth();
