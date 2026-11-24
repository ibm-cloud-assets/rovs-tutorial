## Templates and InstanceTypes

OpenShift Virtualization provides **Templates** and **InstanceTypes** to simplify and standardize the deployment of virtual machines.

Although both help create consistent VM configurations, they serve different purposes:

- **Templates** provide a predefined VM configuration and can include the operating system, disks, networking, CPU, memory, and other VM properties.
- **InstanceTypes** provide standardized compute configurations, primarily CPU and memory, which can be combined with an operating system image and other VM-specific settings.

A simple way to remember the difference is:

> **Template = What should this VM look like?**  
> **InstanceType = How much compute should this VM have?**

In this tutorial, you will:

- Explore the predefined VM templates.
- Create a custom template based on a Red Hat-provided template.
- Customize the new template.
- Create a VM from the customized template.
- Explore predefined InstanceTypes.
- Create a VM using an InstanceType.
- Compare Templates and InstanceTypes.

---

## Prepare for the lab

1. The tasks that we are about to perform will require us to provision a few additional VMs. In preparation we are going to ask that you shut down the existing fedora01 and fedora02 virtual machines to ensure that your shared environment has enough resources to complete the lab.

1. Navigate to Virtualization persona in the left-side menu and then click on Virtualmachines.

1. The project assigned to vm-"your-name"-1, that is hosting VM workloads, will be listed in the center column treeview.

1. If any VMs are showing a status of Running, highlight the VM in the center tree column, and select the Stop button or option from the Actions dropdown menu.

Now all VMs should be in Stopped state.

![](images/template-image1.png)

---

## Clone and Customize a Template

OpenShift Virtualization provides predefined VM templates for commonly used operating systems. These templates provide standardized starting configurations for creating virtual machines.

Templates provided by Red Hat are managed by the OpenShift Virtualization Operator and cannot be edited directly. To customize a Red Hat-provided template, first create a custom template based on it. OpenShift creates the custom template by cloning the selected template into your own project. The original Red Hat template remains unchanged.

### Clone a Red Hat template

1. Go to **Virtualization → Templates** and set the project dropdown to **openshift**.
2. In the filter field, select **Name** and enter:   `centos9`
3. Find the template to start from, for example `centos-stream9-server-small`

![Details page of the Red Hat-provided template](images/image-1.png)

4. Open the **⋮** menu on its row and choose **Clone**.
5. Fill in the dialog:
   - **Template project:** `openshift`
   - **Display name:** something users will recognize, for example `Fedora VM - SAMI`
   - **Provider:** your team or company name
   - **Clone boot source:** leave unchecked, so the template keeps using the shared, auto-updated boot source
6. Click **Clone**.
7. The **Clone template** window opens.
8. Enter the following information:

  **Template name**

  `centos-stream9-server-small-"your name"`

  **Template project**

  Select your own project, for example:

  `vm-"your name"`

  Do not select the `openshift` project.

  **Template display name**

  `CentOS Stream 9 Database Server "your  name"`

  **Template provider**

  `ROVS Tutorial`

9. Click **Clone**.

> **Note:** OpenShift creates the custom template by cloning the selected Red Hat template into your project

![Clone template window](images/image-3.png)

### Alternative method to Clone a Red Hat template

1. Go to **Virtualization → Templates** and set the project dropdown to **openshift**.
2. In the filter field, select **Name** and enter:   `centos9`
3. Find the template to start from, for example `centos-stream9-server-small`
4. Click the template name:

  `centos-stream9-server-small`

5. Review the template details.

An information message at the top of the page explains that templates provided by Red Hat are not editable. The page provides a **Create a new custom Template** option for creating an editable template based on the selected Red Hat template.
6. Click **Create a new custom Template**.

7. The **Clone template** window opens.
8. Enter the following information:

  **Template name**

  `centos-stream9-server-small-"your name"`

  **Template project**

  Select your own project, for example:

  `vm-"your name"`

  Do not select the `openshift` project.

  **Template display name**

  `CentOS Stream 9 Database Server "your  name"`

  **Template provider**

  `ROVS Tutorial`

9. Click **Clone**.

> **Note:** Although the action on the template details page is called **Create a new custom Template**, OpenShift creates the custom template by cloning the selected Red Hat template into your project. The disabled **Clone** action in the Templates list does not prevent this workflow.

![Clone template window](images/image-3.png)

### Open the custom template

1. Go to **Virtualization → Templates** and set the project dropdown to: `vm-"your name"-1`
2. Find the template you just created `CentOS Stream 9 Database Server "your  name"`
3. Click the template name to open it.
4. Verify that the custom template is in your project and that the provider is shown as **ROVS Tutorial**.

The custom template can now be modified without changing the original Red Hat-provided template.

![Details page of the custom template](images/image-7.png)

### Customize the template

1. Review the available configuration tabs and settings for the custom template. Depending on the template and your permissions, these can include:

- CPU and memory
- Disks
- Network interfaces
- Boot configuration
- Scheduling
- Scripts
- Parameters
- Labels and annotations

2. For this tutorial, configure the custom template with:

- **CPU:** 2 vCPUs
- **Memory:** 4 GiB

3. Save the changes.

![Custom template CPU and memory settings](images/image-8.png)

![CPU and RAM](images/image-9.png)

4 .Next click on the Scripts tab at the top, and in the section called Cloud-init click the Edit button.

![script edit](images/image-17.png)
  
5. When the Cloud-init dialog opens, click the radio button to Configure in the **Scripts**. Replace the YAML with the following YAML snippet.

```yaml
userData: |-
 #cloud-config
 user: centos
 password: ${CLOUD_USER_PASSWORD}
 chpasswd: { expire: False }
 packages:
  - mariadb-server
  runcmd:
  - systemctl enable mariadb
  - systemctl start mariadb

```

### Remove the operator labels (Optional)

A clone can keep labels saying the virtualization operator manages it. Remove them so the operator treats your template as yours and not as Openshift provided.
You can change the `metadata.labels` from the details tab or from the **YAML** tab. We will make the change in the **YAML** tab

6. Open the template's **YAML** tab.
7. Under `metadata.labels`, delete any of these that are present:
   - `app.kubernetes.io/managed-by: ssp-operator`
   - `app.kubernetes.io/part-of`
   - `app.kubernetes.io/version`
   - `app.kubernetes.io/component`
8. Under `metadata.annotations` , delete `operator-sdk/primary-resource` and `operator-sdk/primary-resource-type`. **(not present in the example)**
9. Keep `template.kubevirt.io/type: vm`. The console needs it to list the template.
101. Click the **Save** button, you will see a green Saved prompt, then follow that by clicking the Apply button.

![Save](images/image-18.png)

---

### Create a VM from a customized template

> **Note:** Since OpenShift Virtualization 4.22, VM creation cannot start from the template details page anymore. Start from **Virtualization → VirtualMachines → Create**, and then select **Create from Template** in the creation wizard.

1. In the OpenShift web console, select **Virtualization → VirtualMachines**.
2. Select your project "vm-"your name"-1.
3. Click **Create**.

The VM creation wizard provides different creation methods, including creating a VM with a custom configuration, creating a VM from a template, and cloning an existing VM.

4. **Deployment details:** choose **Create from Template**, enter a VM name, and check that **Location** shows the target project. Click **Next**.

![Create VM](images/image-19.png)

5. **On the Templates page:** open the **Filter** dropdown and switch to **User templates** (or **All templates**). Keep the project selector on **All projects**. 

![Templates](images/image-22.png)

7. Select your template:  `centos-stream9-server-small-"your name"`

![Select](images/image-25.png)

- Click **Next**.

6. **Customization:** change CPU, memory, disk, or SSH key for this VM only, if needed. Click **Next**.
Verify that the VM has:
- **CPU:** 4 vCPUs
- **Memory:** 8 GiB

![Review](images/image-23.png)

- Click **Next**

7. **Review and create:** tick **Start this VirtualMachine after creation** (cloned templates create VMs stopped).

![Review](images/image-24.png)

click **Create VirtualMAchine**


### Verify the configuration

On the VM details page, verify:

- VM status
- CPU
- Memory
- Boot source
- Disks
- Network interfaces

Confirm that the VM received the configuration defined in the customized template.

You have now used a Red Hat-provided template as the basis for an editable custom template and created a VM from that template through the VM creation wizard.

---

## Working with InstanceTypes

Templates are useful when you want to standardize a broader VM configuration. **InstanceTypes** address a different requirement: **standardized compute sizing**.

An InstanceType defines CPU and memory resources so that users can select a predefined VM size rather than manually specifying CPU and memory for each VM.

For example, predefined InstanceType series can include general-purpose, memory-intensive, or compute-oriented configurations.

### Explore the Available InstanceTypes

1. In the OpenShift web console, select **Virtualization → InstanceTypes**.
2. Review the InstanceTypes available in the cluster.
3. Look at the different InstanceType series and sizes.

For this exercise, locate the **u1** series, which is intended for general-purpose workloads.

### Examine an InstanceType

OpenShift Virtualization provides predefined InstanceTypes that define reusable compute configurations for virtual machines.

An InstanceType can be either:

- **Cluster-wide:** `VirtualMachineClusterInstancetype`
- **Project-specific:** `VirtualMachineInstancetype`

The difference is mainly scope. Both define reusable VM compute characteristics such as CPU and memory, but one is available cluster-wide while the other belongs to a specific OpenShift project.
The predefined `u1.medium` InstanceType is a cluster-wide InstanceType.

### Open the InstanceType

- In the OpenShift web console, select **Virtualization → InstanceTypes**.
- Locate:

  `u1.medium`

- Click the InstanceType to open it.
- Review the **Details** tab.

The Details page mainly displays metadata about the InstanceType, including its name, labels, annotations, creation date, and owner. In the current OpenShift Virtualization console, the complete compute specification is not presented as separate fields on this page.

The labels provide a summary of the InstanceType. For `u1.medium`, the labels show:

- **Class:** General purpose
- **Size:** Medium
- **CPU:** 1 vCPU
- **Memory:** 4 GiB
- **Vendor:** Red Hat

![Details page for the u1.medium InstanceType](images/image-28.png)

> **Note:** It is normal that the Details page does not show the complete InstanceType configuration in a dedicated CPU and memory section. The YAML definition is the authoritative configuration.

### Review the InstanceType configuration

- Select the **YAML** tab.
- Locate the `spec` section.
- Review the CPU and memory values.

The YAML definition contains the resource configuration applied to a VM that uses this InstanceType. The relevant section is similar to the following example:

```yaml
spec:
  cpu:
    guest: 1
  memory:
    guest: 4Gi
```

![YAML configuration for the u1.medium InstanceType](images/image-29.png)

### Key takeaway

The **Details** tab provides a metadata summary, while the **YAML** tab contains the complete InstanceType specification. Learners do not need to understand every field in the YAML. For this tutorial, focus on the `spec.cpu.guest` and `spec.memory.guest` values and explain how these values determine the VM's compute size.

---

### Create a VM Using an InstanceType

Now create a second VM, this time using an InstanceType.

1.- Select **Virtualization → VirtualMachines**.
- Select your project: `vm-"your name"-1`
- Click **Create**.
2. Select the option for creating a VM using a **Custom configuration**.
3. fill in:
- Name: `fedora-"yourname"-it1`
- Description: `vm created using instancetype`
- Location: your project `vm-"your name"-1`

![VirtualMachines Create menu](images/image-33.png)

### Select the operating system

An InstanceType defines the compute configuration, but the VM still requires a boot source.

1. Select an operating system image available in the ROVS environment, for example:

- Guest Operating System; `other linux`
- Guest Opewrating System type: `fedora`

![Operating system selection](images/image-34.png)

2. Click next

> **Note:** The operating system images available to you depend on the boot sources configured in the cluster.

3. Choose the boot source 

- Volume Name: `fedora`
- Namespace: `openshift-virtualization-os-image`

![boot source](images/image-39.png)

4. Click next

### Select the Instancetype

1. Select: `u1 - medium`

![VM creation with u1.medium selected](images/image-37.png)

### Customization

1. Click Next

### Review and create

1 Review the VM configuration, including:

- VM name
- Storage
- Network interfaces

The **InstanceType controls the compute sizing**, while the remaining VM configuration is defined separately.

![Final VM configuration](images/image-40.png)

1. Click Create VirtualMachine


### Templates and InstanceTypes Compared

You have now created VMs using two different approaches.

| | **Template** | **InstanceType** |
|---|---|---|
| Purpose | Standardize VM configuration | Standardize compute sizing |
| CPU and memory | Can be predefined | Defined by the InstanceType |
| Operating system | Can be predefined | Selected separately |
| Disks | Can be predefined | Configured separately |
| Networking | Can be predefined | Configured separately |
| Typical use | Repeatable workload configuration | Standard VM sizes |

The key distinction is:

> **Templates standardize a VM configuration. InstanceTypes standardize the amount and characteristics of compute assigned to a VM.**

Templates and InstanceTypes are not necessarily competing approaches. InstanceTypes can also be used as building blocks in standardized VM deployment workflows.

---

### What You Have Learned

In this tutorial, you learned how to:

- Explore Red Hat-provided VM templates.
- Understand why Red Hat-provided templates cannot be edited directly.
- Create a custom template based on a Red Hat-provided template.
- Customize the new template for a specific workload.
- Create a VM from the customized template.
- Explore the InstanceTypes available in OpenShift Virtualization.
- Understand how InstanceTypes standardize CPU and memory.
- Create a VM using an InstanceType and an operating system image.
- Understand the different roles of Templates and InstanceTypes.
