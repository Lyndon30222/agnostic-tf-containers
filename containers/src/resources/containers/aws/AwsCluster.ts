import { TerraformStack } from "cdktf";
import { EcsCluster, EcsClusterCapacityProviders } from "@cdktf/provider-aws/lib/ecs";
import { IamRole, IamRolePolicy } from "../../../../.gen/providers/aws/iam";
import { CloudwatchLogGroup } from "../../../../.gen/providers/aws/cloudwatch";
import { EcsService, EcsTaskDefinition } from "../../../../.gen/providers/aws/ecs";

export class AWSCluster  {
    public id: string = '';

    constructor(private stack: TerraformStack, private name: string) {
        const cluster = new EcsCluster(stack, name, {
            name,
            tags: {} // TODO how does this get passed in?
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
            cpu: "256",
            memory: "512",
            requiresCompatibilities: ["EC2", "FARGATE"],
            networkMode: "awsvpc",
            executionRoleArn: executionRole.arn,
            taskRoleArn: taskRole.arn,
            containerDefinitions: JSON.stringify([{
                name: `${this.name}-task-definition`,
                image: "351312122817.dkr.ecr.eu-west-2.amazonaws.com/httpd:latest",
                cpu: 256,
                memory: 512,
                environment: [{ name: 'foo', value: 'bar' }],
                portMappings: [{
                    containerPort: 80,
                    hostPort: 80
                }],
                logConfiguration:{
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": logGroup.name,
                        "awslogs-region": 'eu-west-2', // TODO
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
            desiredCount: 1,
            taskDefinition: task.arn,
            networkConfiguration: {
                subnets: [
                    "subnet-a38972d8",
                    "subnet-92776ad8",
                    "subnet-abb676c2"
                ],
                assignPublicIp: true,
                securityGroups: [
                    "sg-cb66cfa2"
                ]
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