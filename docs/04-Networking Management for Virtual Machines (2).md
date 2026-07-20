# Network Management for Virtual Machines

While the aim is to write this demo script in the general context of Red
Hat OpenShift Virtualization Network concepts, the specifics of IBM
Cloud VPC must be discussed as part of the script. We strongly advise
you to watch the network deep dives mentioned in the invitation to the
scripts to learn the specifics of OpenShift Virtualization on IBM Cloud

<https://cloud.ibm.com/docs/openshift?topic=openshift-rovs-overview>

[<span id="_Toc235193492" class="anchor"></span>Jump to the demo script from here](#review-environment)

# OpenShift Virtualization in the IBM Cloud VPC network

## Introduction

In the below chapters we will take you through and explain the layers of
the Red Hat OpenShift Virtualization Service (ROVS) architecture on IBM
Cloud VPC in this tutorial.

## ROVS

Red Hat OpenShift Virtualization Service (ROVS) on IBM Cloud is a
managed enterprise virtualization platform. It allows organizations to
host, manage, and modernize virtual machine (VM) workloads while easing
the transition to containers, Kubernetes, and AI-ready architectures

IBM Cloud ROVS runs exclusively on Bare Metal worker nodes. ROVS uses
nested virtualization to run Virtual Machines (VMs) inside an OpenShift
cluster, it requires direct, low-latency access to physical hardware
acceleration. Running it on standard virtualized cloud instances is not
supported due to performance penalties.

When you deploy a cluster through the IBM Cloud OpenShift Virtualization
Service, the system automatically locks in the following infrastructure
parameters to ensure bare metal compliance:

- Machine Type - Bare Metal Servers for VPC.

- Operating System - Red Hat Enterprise Linux CoreOS.

- Network Plugin - Open Virtual Network (OVN-Kubernetes) for advanced VM
  networking.

- Orchestrator Version: OpenShift 4.21 or later.

The following options can be chosen by the client:

- Multi Zone Region (MZR) location and [VPC](#vpc-subnet-concepts)
  (select or create)\
  **NOTE: A multi-zone ROKS/ROVS deployment distributes worker nodes
  across multiple availability zones within the same IBM Cloud region to
  improve infrastructure-level availability. Network latency between
  zones is higher and less predictable than within a single zone. The
  architecture is optimized for compute availability. Currently
  (July 26) only single zone deployments have been validated**\
  <img src="images/network1.png"
  style="width:5.58878in;height:3.68974in" />

- Worker pool – create

- Bare Metal profile -\
  <img src="images/network2.png"
  style="width:5.88785in;height:1.65755in" />

<!-- -->

- Network settings – Private only or public and private network

- Security features: traffic protection, encryption, …

- (Virtualization) Integrations: ACM, ODF, File storage, logging,
  monitoring, ……

IBM Cloud Bare Metal Servers for VPC are deployed with 2nd Gen Intel®
Xeon® Platinum 8260 processors and 4th Gen Intel® Xeon® Gold 6426Y and
Xeon® Platinum 8474C processors. Worker nodes are based on predefined
VPC BMS profiles and they are called flavours in ROKS/ROVS. Pay special
focus on sizing and especially optimizing existing VMware sizing.
Enhanced networking is enabled through [SmartNIC](#_SmartNIC) technology
providing throughput up to 200Gbps (initially only fixed 100Gbps
available for ROVS).

ROVS hosted VMs are attached to a [VPC subnet](#vpc-subnet-concepts)
like VPC VSIs or BMs. Each network interface attached to a VPC subnet
requires a [VNI and a VNI VLAN](#_VNI_(Virtual_Network) attachment to
the cluster. Inside OpenShift and OVN, this option creates a VLAN in an
**Open vSwitch** (OVS).

<img src="images/network3.png"
style="width:4.9486in;height:7.14976in" />

## VPC + Subnet Concepts

In Red Hat OpenShift Virtualization Service (ROVS) on IBM Cloud the
underlying network is the IBM Cloud VPC network. VPC deployed bare metal
Worker nodes in a ROVS cluster are attached to VPC subnets and uses
private IP addresses. Customer can decide what prefixes to use for the
subnets. Unlike Classic infrastructure, VPC clusters utilize subnets
instead of VLANs. VPC routing and network security is used. As part of
the cluster creation, you can select or create a VPC and a VPC subnet in
each zone intended for worker node deployment.

<img src="images/network4.png"
style="width:6.17757in;height:4.20713in" />

All worker nodes can communicate with each other through VPC subnets.
IBM Cloud VPC is designed as a **software-defined infrastructure** with:

- Virtual networking

- Isolated tenant environments

- High-performance traffic routing

Worker nodes have a SmartNIC with PCI and VLAN interfaces, which are
used for all communications. Any system connected to the private subnets
within the same VPC can communicate with the workers, VSI’s and VMs in
OpenShift through built-in VPC layer 3 routing

<span id="_VNI_(Virtual_Network" class="anchor"></span>

## <img src="images/network5.png"
style="width:6.26806in;height:4.49861in" />OVN

OVN-Kubernetes is required for OpenShift Virtualization. Features such
as VM live migration and VPC-connected virtual machines depend on
capabilities that are available only in OVN-Kubernetes.

OVN-Kubernetes (the default networking solution since OpenShift 4.12)
provides a modern and flexible network architecture. It uses a
distributed networking system that allows for better scalability,
isolation, and advanced networking features.

Many customers want more than overlay networking. With OVN it is also
possible for virtual machines to connect directly to one or more
physical networks, such as untagged network, VLANs or VPC subnets, when
needed. This is in addition to the Software Define Network (SDN), which
means that, for example, the administrator can connect to the VM from an
external IP address and VMs can connect directly using a Layer2 network.

At a high level, this is done by configuring the host networking, such
as an Open vSwitch (OVS). This workshop segment will walk through and
explain the steps in that process, creating a network attachment
definition to allow VMs to connect to that bridge and, therefore,
directly to the physical network.

<img src="images/network6.png"
style="width:6.26806in;height:0.52708in" />

## VNI (Virtual Network Interface)

<https://cloud.ibm.com/docs/openshift?topic=openshift-vni-virtualization&interface=ui>

A VNI is the entry point into a VPC and a VPC subnet. When you attach a
VNI to the ROVS worker node or cluster as a VLAN attachment, it allows
you to use VNIs on OpenShift hosted VMs.

- A VNI is attached to worker nodes

- It provides IP connectivity into the VPC subnet

- It is the bridge between cloud networking and the cluster

A virtual network interface (VNI) is a logical abstraction of a network
interface in a VPC subnet. It can be attached to a target resource,
providing that resource with network connectivity. It the script later
in this tutorial a VNI is attached to the OpenShift cluster, you will
logically attach a VM to a VPC subnet, configuring the VM network
configuration using the VNI's MAC (or a custom MAC) and its IP
addresses.

A VNI has the following properties that define networking policies:

- Primary IP and secondary IPs

- Security groups

- IP spoofing

- Infrastructure NAT

- Protocol state filtering

These policies are preserved when the VNI is detached from a target, in
our case a VM within the OpenShift localnet, and attached to a different
target. Permissions to change the properties are set on the VNI, and not
on the VNI's target.

Floating IPs and flow log collectors (note: not yet supported on bare
metal servers / ROVS) are resources that you can attach to a VNI. These
attached resources remain attached to the VNI when the VNI switches
attachment from one target to another. In addition:

- References to the floating IPs attached to a VNI are retrievable as a
  child collection of the VNI.

## Open vSwitch (node-level networking)

<https://cloud.ibm.com/docs/openshift?topic=openshift-vni-virtualization&interface=ui#vni-create-bridge>

OpenShift uses OVN-Kubernetes which is based on OVN + Open vSwitch (OVS,
below in the red square) and it supports multi-tenancy, NetworkPolicies,
and hybrid VM/pod networking.

<img src="images/network7.png"
style="width:6.26806in;height:2.15139in" />

The VNI is attached to an OVS on the worker node

This bridge allows:

- Pods / VMs to connect to the external subnet

- It is the actual dataplane implementation

## Multus

Multus provides the functionality to enhance pod and VM connectivity
through secondary networks and multiple CNI-plugins. Multus is commonly
used when you want a Direct attachment to VPC networking. Pods can get
additional interfaces tied to VPC subnets

In a standard Kubernetes setup:

- Each pod gets **one network interface** (via the default CNI)

With **Multus**:

- A pod can have:

  - a **primary interface** (cluster network)

  - plus **additional interfaces** (extra networks)

<https://www.redhat.com/en/blog/using-the-multus-cni-in-openshift>

## Localnet

<img src="images/network8.png"
style="width:5.94872in;height:4.19231in" />

OVN provides the base IBM Cloud compatible topologies for VMs, which
consist of (1) Localnet and (2) Layer 2 options. In this demo script we
will focus on the localnet setup and configuration

Localnet’s provide direct access to VPC subnets. Localnet is a
Multus/secondary network type that connects pods directly to a local
Layer‑2 network (bridge or physical network), bypassing the default
Kubernetes overlay.

With IBM Cloud VPC bare metal:

- Your SmartNIC already connects your server to the VPC fabric

- The default pod network is usually overlay-based
  (VXLAN/OVN-Kubernetes)

When you use localnet via Multus, Pods get an interface that is:

- directly connected to a local bridge or VLAN

- not encapsulated (no VXLAN)

- closer to the SmartNIC / hardware path

<img src="images/network9.png"
style="width:3.76635in;height:7.16114in" />

## NetworkAttachmentDefinition (NAD)

The NetworkAttachmentDefinition(NAD) is a Kubernetes abstraction. A NAD
defines additional networks using Multus. A NetworkAttachmentDefinition
(NAD) is **a way to configure a VM or pod to have an extra network
connection**.

In order to use the Linux Bridge with your VM you need to create
a Network Attachment Definition. This is what tells OpenShift about the
network and allows the virtual machines to connect to it. Network
Attachment Definitions are project scoped, to the project that they are
created in, and are only accessible to the virtual machines that are
deployed in that project. If a Network Attachment Definition is created
in the default project, then it becomes available globally. This gives
an administrator, the ability to control which networks are and aren’t
available to specific users who have access to manage their own VMs.

NAD (NetworkAttachmentDefinition)

- Lives in a namespace/project

- Describes how a pod or VM attaches to a network

- Used directly by workloads

As explained you are not an administrator in this shared demo account.
The network attachments required for the demo have been pre-configured
by the invitation script. Let’s run through the configuration to
understand what has been configured for you.

<span id="_UDN_(User_Defined" class="anchor"></span>

## UDN (User Defined Network)

Before the implementation of user-defined networks (UDN), the
OVN-Kubernetes CNI plugin for OpenShift Container Platform only
supported a Layer 3 topology on the primary or main network. Due to
Kubernetes design principles: all pods are attached to the main network,
all pods communicate with each other by their IP addresses, and
inter-pod traffic is restricted according to network policy. Learning a
new network architecture is often an expressed point of concern from
many traditional virtualization admins.

The introduction of UDN improves the flexibility and segmentation
capabilities of the default Layer 3 topology for a Kubernetes pod
network by enabling custom Layer 2, Layer 3, and localnet network
segments, where all these segments are isolated by default. These
segments act as either primary or secondary networks for container pods
and virtual machines that use the default OVN-Kubernetes CNI plugin.
UDNs enable a wide range of network architectures and topologies,
enhancing network flexibility, security, and performance.

A cluster administrator can use a UDN to create and define additional
networks that span multiple namespaces at the cluster level by
leveraging the ClusterUserDefinedNetwork (CUDN) custom resource (CR).
Additionally, a cluster administrator or a cluster user can use a UDN to
define additional networks at the namespace level with the
UserDefinedNetwork (UDN) CR.

**UDN (User Defined Network)**

- Scoped to a single namespace

- Defines a custom network

- Only workloads in that namespace can use it

“A private network just for this project”

**CUDN (Cluster User Defined Network)**

- Scoped to the entire cluster

- Defines a reusable network

- Can be used across multiple namespaces

“A shared network available anywhere in the cluster”

**\**

> **CUDN vs UDN**

<img src="images/network10.png"
style="width:6.26806in;height:2.78403in" />

**User-defined networks provide the following benefits:**

- Enhanced network isolation for security - Namespaces can have their
  own isolated primary network, similar to how tenants are isolated in
  Red Hat OpenStack Platform (RHOSP). This improves security by reducing
  the risk of cross-tenant traffic.

- Network flexibility - Cluster administrators can configure primary
  networks as layer 2 or layer 3 network types. This provides the
  flexibility of a secondary network to the primary network.

- Simplified network management - With user-defined networks, the need
  for complex network policies are eliminated because isolation can be
  achieved by grouping workloads in different networks.

- Advanced capabilities - The user-defined networking feature allows
  administrators to connect multiple namespaces to a single network, or
  to create distinct networks for different sets of namespaces. Users
  can also specify and reuse IP subnets across different namespaces and
  clusters, providing a consistent networking environment.

<img src="images/network11.png"
style="width:6.26806in;height:2.57639in" />

## Summary

**Forget:**

- Default networking – NAT and no native ingress is restrictive for VMs

- L3 — per-node subnets are a pod scaling pattern, not a VM pattern as
  VM IP will change on live-migration

- Primary - VMs don't need cluster services, VMs cannot use static IPs
  as you cannot disable IP Address Management (IPAM) on primary networks

**Use:**

- Secondary – VMs can use static IPs and only get MAC address from
  VPC/Localnet or OVN-K/Layer2. DHCP can be used but needs a DHCP
  server. Use MultiNetworkPolicy on secondary networks. Turn off IPAM as
  it is not needed on Localnet/VPC

- Localnet CUDN — when VMs need direct connectivity to physical
  infrastructure/VPC (localnet requires CUDN, no choice)

- L2 CUDN — use when production VMs only need VM-to-VM connectivity
  across the cluster and cluster admins control networking

- L2 UDN — use when test/dev VMs only need VM-to-VM connectivity across
  the cluster and enables namespace owner's self-service

**Remember:**

Localnet topology is CUDN-only, Localnet topology is secondary-only, and
UDN only supports Layer2 and Layer3.

**Networking and OpenShift projects**

It is possible to mix and match the discussed topologies in the same
ROVS cluster? Using these topologies do not exclude each other.

<img src="images/network12.png"
style="width:6.35047in;height:4.55917in" />

# Demo script

## Review environment

The demo environment is within the IBM Cloud tech zone and is a shared
demo account. Your user account does not have administrative privileges.
Some network configurations are pre-configured for the demo. Where able
the administrators have given you view privileges and this script will
run you through the preconfigured settings. Some configurations do not
have a “view only” option and will be shown in pictures.

**Note: Some of the below steps and pictures are recorded as an
administrator. Your privileges prevent access to the
“CustomResourceDefinitions” and you are not able to replay those
steps.**

## The ROVS Cluster

Log in to your account, click on the hamburger menu in the left top and
browse to the Virtualization page

1.  Select the “shared-rovs” cluster

<img src="images/network13.png"
style="width:6.12617in;height:2.58662in" />

2.  Browse through the “Overview” , “Worker nodes”, “Worker pools”,
    “Networking”, “ VNI attachments” and “Ingress” in the left of you
    window. Come back to this

> <img src="images/network14.png"
> style="width:5.76168in;height:2.63891in" />\
> **On the overview**: Check status of nodes, add-ons, master and
> Ingress, find the cluster details\
> At the right find and click the link to the VPC the cluster is
> deployed in. A new tab will open with the VPC details. Scroll down and
> find the subnets created for the VNIs and the localnet we are going to
> connect to later on.\
> Move back to the “shared-rovs” tab in your browser\
> **On the Worker nodes**: All the VNIs are spread across the nodes. The
> VNIs are configured to be able to float between nodes. When you later
> attach the VNI to a VM, the VM will be able to migrate between nodes.
> VNI is assigned to virt-subnet-01-vni-vlan100 with VLAN100 and it has
> an IP address assigned.\
> <img src="images/network15.png"
> style="width:6.26806in;height:2.08472in" />**On the Worker pool**: We
> have only 1 worker pool deployed\
> **On the VNI attachments**: See all the VNIs created for all the users
> in the shared account

3.  On the right upper corner click the OpenShift web console button,
    this will open console in a new browser tab. We will come back to
    the OpenShift portal later in this demo

<img src="images/network16.png"
style="width:6.26806in;height:0.79097in" />

## VNI attachment

As described in the introduction in chapter [VNI (Virtual Network
Interface)](#vni-virtual-network-interface) the VNI can be attached to a
target resource, providing that resource with network connectivity. For
our demo this means we need to attach the VNI to the OpenShift cluster.
This will enable you to attach a VM to a VPC subnet, configuring the VM
network configuration using the VNI's MAC and its IP addresses, later in
this tutorial.

Since IBM Cloud VPC does not have a granular privilege only for “attach
VNI” you do not have the ability to attach a VNI to the cluster with
your IBM Cloud user. You can however do all the steps. Attachment will
however fail.

1.  In your browser go to the IBM Cloud Portal go to the ROVS cluster.

> <img src="images/network17.png"
> style="width:5.40654in;height:7.89375in" />

2.  Select the “shared-rovs” cluster

> <img src="images/network18.png"
> style="width:6.26806in;height:1.5in" />

3.  Select VNI attachments and “attach VNIs”

> <img src="images/network19.png"
> style="width:6.26806in;height:0.77361in" />

4.  Configure the attachment to the cluster.

    - Select the VPC subnet “virt-subnet-01-vni-vlan100 (eu-de-1)” your
      administrator created for use with VLAN ID 100.

    - Fill in the VLAN ID 100 and select any of the VNI’s available for
      this.

    - **Click cancel.** As explained you do not have the right
      privileges to actually attach the VNI.\
      \
      \
      <img src="images/network20.png"
      style="width:6.26806in;height:6.60972in" />

## NMstate Operator 

To be able to perform some network activities the account administrator
pre-installed the Kubernetes NMState operator. The Kubernetes NMState
Operator provides a Kubernetes API for performing state-driven network
configuration across the OpenShift Container Platform cluster’s nodes
with NMState. The Kubernetes NMState Operator provides users with
functionality to configure various network interface types, DNS, and
routing on cluster nodes. Additionally, the daemons on the cluster nodes
periodically report on the state of each node’s network interfaces to
the API server.

<img src="images/network21.png"
style="width:6.26806in;height:2.37986in" />

1.  In the left-side menu, select Core Platform – Administration –
    CustomResourceDefinitions click. In the “Filter by Name” type
    “nmstate” and click NodeNetworkState.

> <img src="images/network22.png"
> style="width:4.54993in;height:5.71186in" />

2.  Select “Instances” and expand one of the nodes. As stated, you will
    notice that the worker nodes have a bridge already configured to be
    used for this module as part of the ROVS deployment.\
    Click on the bridge br-eth1 to gather more information about it.
    Find the Yaml code with the configuration details

<img src="images/network23.png"
style="width:6.26806in;height:3.79722in" />

3.  Close the bridge details by clicking on the X in the corner. This
    bridge named br-eth1 was created during ROVS provisioning. Move to
    the Virtualization context and select Network /
    NodeNetworkConfigurationPolicy in the left-side menu to explore
    more.

<img src="images/network24.png"
style="width:6.26806in;height:3.76806in" />

4.  Select br-eth1 to get information. The right screenshot is the admin
    user view

<img src="images/network25.png"
style="width:6.26806in;height:0.60625in" />
<img src="images/network26.png"
style="width:6.26806in;height:5.19444in" />

1.  To see how this bridge was created, you can switch to YAML to see
    the definition. As an administrator, you could create you a similar
    bridge with the yaml snippet below.:

<img src="images/network27.png"
style="width:6.26806in;height:2.85139in" />

## User Defined Networks

Lets take a look at the UDNs created by the administrator. As described
in the [UDN introduction chapter](#_UDN_(User_Defined) a cluster
administrator can use a UDN to create and define additional networks
that span multiple namespaces at the cluster level by leveraging the
ClusterUserDefinedNetwork (CUDN) custom resource (CR). Additionally, a
cluster administrator can define additional networks at the namespace
level with the UserDefinedNetwork (UDN) CR. Those additional networks
were created for you when you started the invitation script.

1.  Move to the Virtualization context and select “UserDefineNetworks”.
    Notice all the CUDNs, and specific the 2 CUDNs created for you.
    Notice that you miss the “Create” button at the top right.

<img src="images/network28.png"
style="width:6.26806in;height:2.16458in" />

<img src="images/network29.png"
style="width:6.26806in;height:2.57083in" />

## Network Attachment Definition

<img src="images/network30.png"
style="width:6.26806in;height:0.96667in" />

1.  From the left-side menu, select “Networking” followed
    by “NetworkAttachmentDefinitions” and click
    the “NetworkAttachmentDefinition” in your project “vm—your-name-1”.
    Notice again that you do not have the create option at the right top
    level.

> <img src="images/network31.png"
> style="width:6.26806in;height:0.43889in" /><img src="images/network32.png"
> style="width:6.26806in;height:2.20069in" />

2.  Examine the details of the network attachment definition
    “your-name-localnet-vlan100”. This was created in
    the ”vm-your-name-x” projects, it will not be available in other
    projects.

- Name: “your-name”-localnet-vlan100”

- Namespace: “vm-your-name”

- Cluster User Defined Network: “your-name-localnet-vlan100”\
  This is where the network attachment is made

- Add the right you see this is a secondary localnet network

<img src="images/network33.png"
style="width:5.95794in;height:2.98359in" />

<img src="images/network34.png"
style="width:6.26806in;height:0.90347in" />

## Create and attach a Virtual Machine(VM) to the localnet network

> If required learn how to create a VM in “Create a Linux Virtual
> Machine” from the
> <https://github.com/ibm-cloud-assets/rovs-tutorial/blob/main/docs/01-vm-management.md>
> tutorial

In the Multus and UDN introduction we explained the default primary
network as the POD network and the use of secondary networks for VM’s.
In the next steps we are going to configure the VM to use the secondary
network to connect to the localnet. **Remember:** The primary network is
an isolated POD only network.\
\
We explained the VNI as a top-level resource with a Cloud Resource Name
(CRN), with its own set of IAM permissions. We explained the creation of
the VNI for use by a VM in the OVN and some steps before we looked at
how to attach the VPC VNI to the cluster.\
\
You want the VM you are going to create, to use 1 of the VNI interfaces
for your VM. Normally you make this connection using terraform or YAML
but in this script we are using the GUI. To be able to attach the VM to
the VNI of our choice we need to look up the MAC address of the VNI to
use while creating the VM in the next step.\
In a separate browser tab open the IBM Cloud portal and go to the VNI
attachments and select vni-“your-name”-1

1.  Copy the Mac address and store for later use

<img src="images/network35.png"
style="width:6.26806in;height:1.04861in" />\
\
<img src="images/network36.png"
style="width:6.26806in;height:1.99028in" />

2.  Go back to previous tab with the Virtualization context on the
    Openshift Console, select “Catalog”:

- Template Catalog

- Fedora VM

- Name = fedora05-“your-name”-Select “Customize VirtualMachine” to
  configure the Network Interface (NIC) to make certain we connect the
  VM to the right network.\
  **Do not forget to select the right (vm-“your name”) name space**

> <img src="images/network37.png"
> style="width:5.08939in;height:2.59375in" />\
> <img src="images/network38.png"
> style="width:3.65802in;height:4.64324in" />

3.  Select “network Interfaces (1)”

> <img src="images/network39.png"
> style="width:5.77617in;height:3.53572in" />

4.  Notice there is already a default interface, this is the deafult POD
    network. Select “Add network interface”

> <img src="images/network40.png"
> style="width:6.26806in;height:1.18125in" />

5.  Fill in the Name =fedora05-your-name

- Select “your-name-vlan100”

- Now paste the MAC address of the VNI that you stored before and save

> <img src="images/network41.png"
> style="width:2.84324in;height:3.46486in" />

6.  Delete the primary network interface.\
    **Warning:** If you forget to do this the primary interface will
    remain the default NIC and that will have the default route. The VM
    will not be able to reach the localnet with out you adding manual
    routing. Since you don’t need the primary / POD network delete it.\
    Create the VM and accept the boot disk warning.

<img src="images/network42.png"
style="width:6.26806in;height:0.99375in" />\
<img src="images/network43.png"
style="width:6.26806in;height:1.12222in" />

<img src="images/network44.png"
style="width:6.26806in;height:0.67431in" />

7.  Create the VM. It should take less than a minute to provision and
    start the VM.

> <img src="images/network45.png"
> style="width:6.26806in;height:3.79028in" />

8.  Open the console of the VM

> <img src="images/network46.png"
> style="width:3.73832in;height:3.32837in" />

9.  Login with the user name “fedora” given at the top of your screen
    and paste the password using the “paste to Console” and press enter
    to login

<img src="images/network47.png"
style="width:6.26806in;height:0.72986in" />

10. Check if an interface is using DHCP\
    List connections and devices:

- \- nmcli device status Show\
  Then check the IPv4 method for a connection

- \- nmcli connection show\
  Get the connection name and inspect it

- \- nmcli connection show "\<connection-name\>" \| grep ipv4.method\
  Output should be: ipv4.method: auto\
  auto = DHCP enabled

- \- IP a\
  You should see that interface “enp1s0”has received the IP address that
  is assigned to the VNI attached to the cluster.

<img src="images/network48.png" style="width:6.2899in;height:3in" />

## Create and attach a Windows server VLAN 200

1.  Lookup the Mac address of vni-“ÿour-name”-2 and store for later use

<img src="images/network36.png"
style="width:6.26806in;height:1.99028in" />

2.  Return to the OpenShift console. Create another a Windows 2K17 VM
    from the template you created in the “Template and InstanceType
    management” tutorial you ran before. Use the cloned PVC as a boot
    source for quick-creating a new virtual machine by selecting the
    option for PVC (clone PVC) as the Disk source and selecting
    the Windows-2k19-Sysprep-Template PVC as the PVC name to clone, and
    click the Customize VirtualMachine button to configure the VM.

- Project = vm-“your-name”-2

- PVC Project = vm-“your-name”-2

- PVC name = windows-sysprep-2k19-bert-template

- Name = windows 2k19-“your-name”

- Windows 2k17

- Name = windows06-“your-name”

- Change CPU and Memory: 2CPU \| 8GB

- Select “Customize VirtualMachine”

<img src="images/network49.png"
style="width:6.26806in;height:3.46042in" />

3.  Configure BIOS and press Create VirtualMachine

<img src="images/network50.png"
style="width:6.26806in;height:3.33542in" />

4.  Configure the Network interface\
    Add network interface:

- Name = windows06-2k19-“your-name”-nic

- bert-localnet-vlan200

- advanced settings 🡺 paste the MAC address you stored before\
  Save

<img src="images/network51.png"
style="width:4.74766in;height:5.93857in" />

- Remove the default network interface

<img src="images/network52.png"
style="width:6.23832in;height:1.58619in" />

- Create VirtualMachine and the VM will start

5.  Open the web console

- At the righ bottom you see there is no network

<img src="images/network53.png"
style="width:6.26806in;height:4.58472in" />

- Go to the VM configuration on the OpenShift portal and check the model
  on the network interface. You will find this is “virtio” model.
  Windows does not install that automated.

- Change the “virtio” to “e1000e” and save.

<img src="images/network54.png"
style="width:5.1729in;height:4.84898in" />\
This will require a restart. The model will change after a restart.
After restart windows will install the NIC.\
**Note:** when doing a Vmware to ROVS migration situations with drives
like here may happen!\
\
<img src="images/network55.png"
style="width:6.26806in;height:2in" />

- Restart the VM

- After reboot start go to the web console of the VM.

- At the right bottom notice that the red X for the Network icon is gone

- Click the windows startup menu and typ “cmd” and press enter

<img src="images/network56.png"
style="width:4.87895in;height:3.74219in" />\
A command prompt will open

- type ipconfig. Notice the IP address of the VNI you used to configure
  the MAC address for the VM. That has connected the VM DHCP request to
  the VNI and assigned the IP address of that VNI.

- ping 9.9.9.9 (Google IP address on the internet). You should get a
  reply

- lookup the ip address of your fedora05-“your-name” in the OpenShift
  console (you should know how by now 😊)

- ping the IP address you just stored. You should get a reply. This
  means that you can ping the fedora VM that is assigned to another VLAN
  in another subnet in the same VPC. In the below example we ping from
  10.243.4.0/24 to 10.243.2.0/24.

<img src="images/network57.png"
style="width:5.98598in;height:6.29768in" />\
Now lets see if this works both ways

- Go to the web console of the fedora05-“your-name” and login

- type “ip a”

- lookup the ip address of the Windows06-2k19-“your-name”

- On the fedora VM console ping the IP address of the windows VM, it
  fails why? Don’t spend hours trying to find out 😊

<img src="images/network58.png"
style="width:5.86916in;height:3.38195in" />

Leave the Windows server running for the next step!

## Use a VPE from within OpenShift

### What is a VPE?

A Virtual Private Endpoint (VPE) is a private network endpoint that
allows resources in an IBM Cloud VPC to securely access IBM Cloud
services without traversing the public internet. Instead of connecting
to a service through a public IP address, a VPE assigns private IP
addresses from your own VPC subnet, ensuring that all traffic remains on
the IBM Cloud private backbone network.

A VPE is implemented through a Virtual Private Endpoint Gateway, which
acts as a highly available and scalable connection point between your
VPC and a supported IBM Cloud service. This approach improves security,
simplifies network controls, and helps organizations meet compliance
requirements by keeping service traffic private.

In simple terms: a VPE is like creating a private entrance from your VPC
directly into an IBM Cloud service, allowing your workloads to
communicate securely without exposing traffic to the public internet.

### Why use a VPE?:

- Keeps traffic on the IBM Cloud private network.

- Eliminates the need for public connectivity to supported services.

- Allows you to use your own VPC IP address space for service access.

- Integrates with VPC security controls such as Security Groups and
  Network ACLs.

- Provides a highly available and scalable connection architecture.

Find a list of all the available VPE enabled service
[here](https://cloud.ibm.com/docs/vpc?topic=vpc-vpe-supported-services).

<img src="images/network59.png"
style="width:6.26806in;height:4.06944in" />

### Review a VPE gateway setup

In this demo we will run through the setup of a VPE gateway in IBM Cloud
VPC. In the IBM Cloud portal go to the Virtual Private Endpoint Gateways
in the catalog.

<img src="images/network60.png"
style="width:4.64019in;height:6.31606in" />

Due to lack of privileges you do not see any VPE gateways. Below you can
see that we actually have many VPE gateways configured in the account of
which a gateway to the NTP service we are going to use later.

<img src="images/network61.png"
style="width:6.26806in;height:2.90625in" />

1.  Click “ Create”

<img src="images/network62.png"
style="width:6.26806in;height:0.65417in" />

2.  Choose

- Region =Frankfurt

- Name = demo-ntp

- Resource Group = Virtualization

- Virtual Private Cloud = virt-vpc

1.  Create security Group

> <img src="images/network63.png"
> style="width:5.56075in;height:7.02517in" />

2.  Review what you can configure. Typically you create a new security
    group and configure the inbound rules for the service. For the NTP
    service we select UTP for the protocol (A), select Port range ,
    enter 123 for both the Port min and Port max.

3.  Cancel the creation of the security group and instead select
    “[sg-vpe-ntp-virt](https://cloud.ibm.com/infrastructure/network/securityGroups/eu-de~r010-1a74b5a2-c5a0-42f7-a2d3-c93452865993/overview)”.

4.  Select “IBM Cloud service” and under Cloud Services select the
    service of your choice. For this demo we chose “ibm-ntp-server”.

- Reserve IP choose “Select for me”

- We only enable the gateway endpoint in “eu-de1”

  <img src="images/network64.png"
  style="width:6.26806in;height:0.78194in" />

  <img src="images/network65.png"
  style="width:5.66823in;height:9.03989in" />

- Now Cancel the creation of the NTP gateway by selecting “Virtual
  private gateways” at the top of the page to leave this page

  <img src="images/network66.png"
  style="width:6.13627in;height:1.40645in" />

### VPE to NTP demo

A virtual server in your OpenShift environment can access the IBM Cloud
NTP through a VPE gateway. The server communicates with a private IP
address inside the VPC, causing the traffic to remain entirely on the
IBM Cloud network.

We have configured the VPE Gateway for the VPC “virt-vpc”.

- Private IP: 10.134.219.4

- DNS name: time.adn.networklayer.com

<img src="images/network67.png"
style="width:6.26806in;height:3.85208in" />

We will now configure the NTP server for the Windows 2K19 server we
created in the previous step.

1.  Browse to the console of the Windows06-“your-name”

2.  Go to the start menu and type “cmd”. Richt click and start as
    administrator

3.  Query the status and the peers of the Windows time service

- W32tm /query / status

- W32tm /query peers

- Notice the ntp peer is time.windows.com

> <img src="images/network68.png"
> style="width:4.00446in;height:3.93792in" />

4.  Configure the IBM Cloud NTP service as NTP source. Normally you
    would use the DNS name “time.adn.networklayer.com” but for demo
    purposes we will now use the IP address “10.134.219.4” to proof that
    we are not accidentally using a public IP address.

- W32tm /config /manualpeerlist”10.134.219.4” /syncfromflags /update

- Net stop w32time

- Net start w32time

- W32tm /query peers 🡪 notice Peer: 10.134.219.4

- W32tm /query /status 🡪 notice the last successful sync

> <img src="images/network69.png"
> style="width:5.45794in;height:4.35499in" />

- Now do the same exercise but use the DNS name
  time.adn.networklayer.com

> <img src="images/network70.png"
> style="width:5.46262in;height:3.61673in" />

- Notice the last successful sync time

- Notice we are able to resolve the DNS name to a public and a private
  IP. We have received our DNS server configuration from the DHCP
  request through the VNI (remember we configured the VNI MAC address
  when adding the NIC during VM deployment). We are able to resolve IBM
  Cloud addresses like native VSIs in IBM Cloud

# Summary

In this tutorial we learned the key networking concepts used by Red Hat
OpenShift Virtualization Service (ROVS) on IBM Cloud VPC. We explored
how IBM Cloud VPC networking, SmartNICs, Virtual Network Interfaces
(VNIs), Virtual Private Endpoints (VPEs), OVN-Kubernetes, Open vSwitch
(OVS), Multus, Localnet, NetworkAttachmentDefinitions (NADs), and User
Defined Networks (UDNs) work together to provide secure, scalable, and
flexible networking for virtual machine workloads.

We reviewed how VNIs provide connectivity between IBM Cloud VPC subnets
and OpenShift Virtualization, and how Localnet networks allow virtual
machines to connect directly to VPC networks without relying on the
default pod networking model. In addition, we examined how VPEs enable
private access from workloads to IBM Cloud services without traversing
the public internet, improving security, compliance, and network control
for enterprise deployments. We also explored the role of NMState,
Cluster User Defined Networks (CUDNs), and UDNs in creating secure and
flexible network segmentation for VM workloads.

During the lab exercises, we inspected preconfigured networking
components, reviewed VNI attachments, VPE connectivity, and network
attachment definitions, and deployed both Linux and Windows virtual
machines connected to secondary Localnet networks. By assigning VNI MAC
addresses to VM network interfaces, we demonstrated how virtual machines
can obtain IP addresses directly from IBM Cloud VPC networking,
communicate across VPC subnets, and securely consume private IBM Cloud
services while maintaining support for virtualization capabilities such
as live migration.

We also learned how OpenShift Virtualization networking differs from
traditional virtualization networking by separating the primary pod
network from secondary VM networks. This approach enables administrators
to provide direct Layer 2 and Layer 3 connectivity where required, while
preserving the flexibility, isolation, and automation expected from a
cloud-native platform. User-defined networking extends these
capabilities by allowing network segmentation and self-service network
creation at both namespace and cluster scope.

Finally, we reinforced the networking design recommendations for
OpenShift Virtualization: use secondary networks for VM workloads, use
Localnet when direct VPC connectivity is required, leverage VPEs for
secure private access to IBM Cloud services, use CUDNs for centrally
managed production networks, and use UDNs for namespace-level
self-service environments. Together, these capabilities provide a robust
networking foundation for running traditional virtual machines alongside
containerized applications on a modern IBM Cloud and OpenShift platform.
