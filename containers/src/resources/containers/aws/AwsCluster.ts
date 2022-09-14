import { TerraformStack } from "cdktf";
import { IamRole, IamRolePolicy } from "../../../../.gen/providers/aws/iam";
import { CloudwatchLogGroup } from "../../../../.gen/providers/aws/cloudwatch";
import { EcsService, EcsTaskDefinition, EcsCluster, EcsClusterCapacityProviders } from "../../../../.gen/providers/aws/ecs";
import { IContainerConfig } from "../container";

export class AWSCluster  {
    public id: string = '';

    constructor(private stack: TerraformStack, private name: string, private config: IContainerConfig) {
        const cluster = new EcsCluster(stack, name, {
            name,
            tags: this.config.aws!.tags
        });
        this.id = cluster.id; // TODO we will ultimately need more info...

        new EcsClusterCapacityProviders(stack, `${name}-ecs-cluster-provider`, {
            clusterName: cluster.name,
            capacityProviders: ["FARGATE"]
        });

        const execRole = this.createExecutionRole();
        const taskRole = this.createTaskRole();
        const logGroup = new CloudwatchLogGroup(stack, `${name}-cloudwatch-loggroup`, {
            name: `${cluster.name}/${name}`,
            retentionInDays: 30,
            tags: {}
        })
        const task = this.createTaskDefinition(execRole, taskRole, logGroup);
        this.createService(cluster, task);
    }

    createTaskDefinition(executionRole: IamRole, taskRole: IamRole, logGroup: CloudwatchLogGroup): EcsTaskDefinition {
        return new EcsTaskDefinition(this.stack, `${this.name}-task-definition`, {
            tags: {},
            cpu: `${this.config.aws!.container.cpu}`,
            memory: `${this.config.aws!.container.memory}`,
            requiresCompatibilities: ["EC2", "FARGATE"],
            networkMode: "awsvpc",
            executionRoleArn: executionRole.arn,
            taskRoleArn: taskRole.arn,
            containerDefinitions: JSON.stringify([{
                name: `${this.name}-task-definition`,
                image: this.config.image,
                cpu: this.config.aws!.container.cpu,
                memory: this.config.aws!.container.memory,
                environment: this.config.aws!.container.environment,
                portMappings: [{
                    containerPort: this.config.aws!.container.port,
                    hostPort: this.config.aws!.container.port
                }],
                logConfiguration:{
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": logGroup.name,
                        "awslogs-region": this.config.aws!.region,
                        "awslogs-stream-prefix": this.name
                    }
                }
            }]),
            family: "service"
        })
    }

    createService(cluster: EcsCluster, task: EcsTaskDefinition): EcsService {
        return new EcsService(this.stack, `${this.name}-ecs-service`, {
            tags: {},
            name: `${this.name}-ecs-service`,
            launchType: "FARGATE",
            cluster: cluster.id,
            desiredCount: this.config.aws!.container.count,
            taskDefinition: task.arn,
            networkConfiguration: {
                subnets: this.config.aws!.network.subnets,
                assignPublicIp: true,
                securityGroups: this.config.aws!.network.securityGroups
            }
        });
    }

    createTaskRole(): IamRole {
        const taskRole = this.createAssumeRole(`${this.name}-task-assume-role`)
        // attach execution role policy
        new IamRolePolicy(this.stack, `${this.name}-task-role`, {
            name: `${this.name}-task-role-policy`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Resource: '*',
                    Action: [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ]
                }]
            }),
            role: taskRole.name
        });
        return taskRole;
    }

    createExecutionRole(): IamRole {
        const executionRole = this.createAssumeRole(`${this.name}-execution-assume-role`)
        // attach execution role policy
        new IamRolePolicy(this.stack, `${this.name}-execution-role`, {
            name: `${this.name}-ecxecution-role-policy`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Resource: '*',
                    Action: [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ]
                }]
            }),
            role: executionRole.name
        });
        return executionRole;
    }

    createAssumeRole(roleName: string): IamRole {
        return new IamRole(this.stack, roleName, {
            name: roleName,
            tags: {},
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Sid: "",
                        Principal: {
                            Service: "ecs-tasks.amazonaws.com"
                        }
                    }
                ]
            })
        });
    }
}