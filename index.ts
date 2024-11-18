import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";

const config = new pulumi.Config();
const minClusterSize = config.getNumber("minClusterSize") || 3;
const maxClusterSize = config.getNumber("maxClusterSize") || 6;
const desiredClusterSize = config.getNumber("desiredClusterSize") || 3;
const eksNodeInstanceType = config.get("eksNodeInstanceType") || "t3.medium";
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

const eksVpc = new awsx.ec2.Vpc("eks-vpc", {
    enableDnsHostnames: true,
    cidrBlock: vpcNetworkCidr,
});

const eksCluster = new eks.Cluster("eks-cluster", {
    vpcId: eksVpc.vpcId, // Put the cluster in the new VPC created earlier
    authenticationMode: eks.AuthenticationMode.Api, // Use the "API" authentication mode to support access entries
    publicSubnetIds: eksVpc.publicSubnetIds, // Public subnets will be used for load balancers
    privateSubnetIds: eksVpc.privateSubnetIds,// Private subnets will be used for cluster nodes
    instanceType: eksNodeInstanceType,
    desiredCapacity: desiredClusterSize,
    minSize: minClusterSize,
    maxSize: maxClusterSize,
    nodeAssociatePublicIpAddress: false, // Do not give the worker nodes public IP addresses
    endpointPrivateAccess: false,
    endpointPublicAccess: true,
});

export const kubeconfig = eksCluster.kubeconfig;
export const vpcId = eksVpc.vpcId;
