# Manage VMs via YAML

> Estimated duration: 2 hours

In this tutorial you will learn how to manage VMs using YAML files and the command line `virtctl`. You will deploy two types of VMs:

* a stateless VM with a ContainerDisk, which is ephemeral storage. The basic steps here would be to create a container image and use it as the root disk for the Virtual Machine. The OpenShift's internal registry is used to store the container image.
* a stateful the VM with Persistent Volumes (PVs).

> This tutorial assumes you have access to an existing [ROVS cluster](https://cloud.ibm.com/infrastructure/openshift-virtualization).

## Agenda

* [Pre-Requisites](#pre-requisites)
* [Explore the existing golden images](#explore-the-existing-golden-images)
* [Provision a stateless VM](#provision-a-stateless-vm)
* [Provision a stateful VM](#provision-a-stateful-vm)
* [Access the VM via SSH](#access-the-vm-via-ssh)
* [Deploy NGinx on the VM and expose it as a route](#deploy-nginx-on-the-vm-and-expose-it-as-a-route)
* [Import Image to the OpenShift Registry](#import-image-to-the-openshift-registry)

## Pre-Requisites

Make sure you have the command line tools below and you are connected to the cluster as described in the section [Connect to cluster](./00-connect-to-cluster.md).

* docker or podman
* virtctl
* OC (OpenShift) command line

## Explore the existing golden images

OpenShift Virtualization stores its automatically managed **golden images** in the `openshift-virtualization-os-images` namespace. Here is the list of [Certified Guest OS Operating Systems in OpenShift Virtualization](https://access.redhat.com/articles/4234591).

1. List all available operating-system boot sources:

    ```sh
    oc get datasource -n openshift-virtualization-os-images
    ```

1. Check the Fedora DataSource

    ```sh
    oc get datasource fedora \
      -n openshift-virtualization-os-images \
      -o yaml
    ```

    > The DataSource provides a stable name, while its underlying PVC can be updated when a newer Fedora boot image is imported.

## Provision a stateless VM

Let's provision a Fedora VM with a YAML file.

1. Let's set the environment variable for the OpenShift project

    ```sh
    export OC_PROJECT = <your-openshift-project>
    ```

    For example:

    ```sh
    export OC_PROJECT=vm-mace-1
    ```

1. Let's use this project

    ```sh
    oc project $OC_PROJECT
    ```

1. Provision a stateless Fedora VM

    ```sh
    cat <<EOF | oc apply -n $OC_PROJECT -f -
    apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      name: fedora-stateless
      labels:
        app: fedora-stateless
    spec:
      runStrategy: Always # VM starts automatically and restarts if stopped
      template:
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - bootOrder: 1
                  disk:
                    bus: virtio
                  name: rootdisk
                - bootOrder: 4
                  disk:
                    bus: virtio
                  name: cloudinitdisk
              interfaces:
                - bootOrder: 2
                  masquerade: {}
                  model: virtio
                  name: nic0
              networkInterfaceMultiqueue: true
              rng: {}
            resources:
              requests:
                memory: 2Gi
          evictionStrategy: LiveMigrate
          hostname: fedora-stateless
          networks:
            - name: nic0
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - name: rootdisk
              containerDisk:
                image: quay.io/containerdisks/fedora:latest
                imagePullPolicy: Always

            - name: cloudinitdisk
              cloudInitNoCloud:
                userData: |
                  #cloud-config
                  user: fedora
                  password: password
                  chpasswd:
                    expire: false
                  ssh_pwauth: true
                  hostname: fedora-stateless
    EOF
    ```

    > The VM should start within a minute.

1. List of VM in this project

    ```sh
    oc get vmi -n $OC_PROJECT
    ```

    > You should see

    ```sh
    NAME                      AGE     PHASE     IP             NODENAME                                                READY
    fedora-stateless          2m12s   Running   172.17.1.221   kube-d8ufsksf04cd0s5gpp90-sharedrovs-default-00000693   True
    ```

1. List of events on a specific VM. This command is useful should you have any issues on the VM

    ```sh
    oc describe vmi fedora-stateless -n $OC_PROJECT
    ```

    > You should see

    ```sh
    Events:
    Type    Reason            Age   From                       Message
    ----    ------            ----  ----                       -------
    Normal  SuccessfulCreate  60s   virtualmachine-controller  Created virtual machine pod virt-launcher-fedora-stateless-v78m7
    Normal  Created           48s   virt-handler               VirtualMachineInstance defined.
    Normal  Started           48s   virt-handler               VirtualMachineInstance started.
    ```

1. Connect to VM via virctl console. Login with credentials as **Login:** `fedora` **Password:** `password`

    ```sh
    virtctl console fedora-stateless -n $OC_PROJECT
    ```

1. Navigate to Openshift Console → Virtualization → VirtualMachines.

1. Notice the new Virtual Machine been created and in Running state.

    ![Fedora VM](./images/05-openshift-fedora-vm.png)

1. You can also open the VNC console.

## Provision a stateful VM

Let's now provision a stateful VM. OpenShift Data Foundation (ODF) is installed in the ROVS cluster and it is recommend to use the storage class provided by ODF.

1. Retrieve and store the StorageClass name in a variable

    ```sh
    oc get sc
    ```

1. Let's use the storage class optimized for OpenShift Virtualization

    ```sh
    STORAGE_CLASS_NAME=ocs-storagecluster-ceph-rbd-virtualization
    ```

1. Create an Image Pull Secret so that the Containerized Data Importer (CDI) can authenticate itself against the internal registry and pull the image to create a DataVolume out of it. The secret is essentially the default service account image pull secret token which is meant for registry authentication.

    ```sh
    ./scripts/generate_image_pull_secret.sh
    ```

1. Apply the VirtualMachine manifest

    ```sh
    cat <<EOF | oc apply -f -
    apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      name: fedora-dv
      labels:
        app: fedora-dv
    spec:
      runStrategy: Always # VM starts automatically and restarts if stopped
      dataVolumeTemplates:
        - apiVersion: cdi.kubevirt.io/v1
          kind: DataVolume
          metadata:
            name: fedora-dv-disk-0
          spec:
            pvc:
              accessModes:
                - ReadWriteOnce
              resources:
                requests:
                  storage: 50G
              storageClassName: $STORAGE_CLASS_NAME
            source:
              registry:
                url: "docker://image-registry.openshift-image-registry.svc:5000/$OC_PROJECT/virt-fedora:32"
                secretRef: "internal-reg-pull-secret"
      template:
        metadata:
          labels:
            kubevirt.io/vm: vm-datavolume
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - bootOrder: 1
                  disk:
                    bus: virtio
                  name: disk-0
                - disk:
                    bus: virtio
                  name: cloudinitdisk
              interfaces:
                - bootOrder: 2
                  masquerade: {}
                  model: virtio
                  name: nic0
              networkInterfaceMultiqueue: true
              rng: {}
            machine:
              type: pc-q35-rhel8.2.0
            resources:
              requests:
                memory: 4Gi
          evictionStrategy: LiveMigrate
          hostname: fedora-pvc
          networks:
            - name: nic0
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - dataVolume:
                name: fedora-dv-disk-0
              name: disk-0
            - cloudInitNoCloud:
                userData: |
                  #cloud-config
                  ssh_pwauth: True
                  chpasswd:
                    list: |
                      root:password
                    expire: False
                  hostname: fedora-dv
              name: cloudinitdisk
    EOF
    ```

1. Navigate to Openshift Console → Virtualization → VirtualMachines.

1. Notice the new Virtual Machine been created and in **Provisioning** state.

    ![Fedora VM](./images/osv-vm-fedora-running.png)

1. Click on fedora-stateless → VNC Console. Login with credentials as: Username: root Password: password

## Access the Virtual Machine via the CLI OC and virtctl

1. Switch the context to the deployed namespace

    ```sh
    oc project -n $OC_PROJECT
    ```

1. List the Virtual Machines

    ```sh
    oc get vms
    ```

    Output

    ```sh
    NAME            AGE     VOLUME
    fedora-stateless   9m23s
    ```

1. List the Virtual Machine Instances

    ```sh
    oc get vmis
    ```

    Output

    ```sh
    NAME            AGE   PHASE     IP              NODENAME                                             READY
    fedora-stateless   12m   Running   172.17.57.108   kube-d0criacr0g0gtjirqeb0-osvroks-default-0000024f   True
    ```

1. Access the virtual machine instance via the virtctl cli. Use the credentials as root / password

    ```sh
    virtctl console fedora-stateless
    ```

    Output

    ```sh
    Successfully connected to fedora-stateless console. The escape sequence is ^]

    fedora-stateless login: root
    Password:
    Last login: Tue May 06 16:11:23 on tty1
    [root@fedora-stateless ~]#
    ```

## Access the VM via SSH

1. Store the SSH Key in an environment variable.

    ```sh
    export SSH_KEY=$(cat ~/.ssh/id_rsa.pub)
    ```

1. Create a Secret that contains the cloud-init userData with SSH key

    ```sh
    cat <<EOF | oc apply -f -
    apiVersion: v1
    kind: Secret
    metadata:
      name: fedora-cloudinit-secret
      namespace: $OC_PROJECT
    type: Opaque
    stringData:
      userData: |
        #cloud-config
        ssh_pwauth: false         # disable SSH password login
        users:
          - name: fedora          # or any user you want
            gecos: Fedora User
            groups: [wheel]
            sudo: ALL=(ALL) NOPASSWD:ALL
            shell: /bin/bash
            ssh_authorized_keys:
              - $SSH_KEY
        hostname: fedora-dv
    EOF
    ```

1. Provision a Stateless VM with a SSH key in a Secret

    ```sh
    cat <<EOF | oc apply -n $OC_PROJECT -f -
    apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      name: fedora-stateless-ssh
      labels:
        app: fedora-stateless-ssh
    spec:
      runStrategy: Always # VM starts automatically and restarts if stopped
      template:
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - bootOrder: 1
                  disk:
                    bus: virtio
                  name: rootdisk
                - bootOrder: 4
                  disk:
                    bus: virtio
                  name: cloudinitdisk
              interfaces:
                - bootOrder: 2
                  masquerade: {}
                  model: virtio
                  name: nic0
              networkInterfaceMultiqueue: true
              rng: {}
            machine:
              type: pc-q35-rhel8.1.0
            resources:
              requests:
                memory: 2Gi
          evictionStrategy: LiveMigrate
          hostname: fedora-stateless-ssh
          networks:
            - name: nic0
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - containerDisk:
                image: 'image-registry.openshift-image-registry.svc.cluster.local:5000/$OC_PROJECT/virt-fedora:32'
                imagePullPolicy: Always
              name: rootdisk
            - cloudInitNoCloud:
                secretRef:
                  name: fedora-cloudinit-secret
              name: cloudinitdisk
    EOF
    ```

1. Connect to the VM with virtctl

    ```sh
    virtctl ssh \
      --namespace $OC_PROJECT \
      --username fedora \
      --local-ssh-opts="-o StrictHostKeyChecking=accept-new" \
      vmi/fedora-stateless-ssh
    ```

## Deploy NGINX on the VM and expose it as a Route

1. Install nginx in Fedora. Inside the VM, become root

    ```sh
    sudo -i
    ```

1. Update packages (optional but recommended)

    ```sh
    dnf -y update
    ```

1. Install nginx

    ```sh
    dnf -y install nginx
    ```

1. Enable and start nginx

    ```sh
    systemctl enable nginx
    systemctl start nginx
    systemctl status nginx
    ```

1. You should see it active (running) and listening on port 80:

    ```sh
    ss -tulnp | grep nginx
    ```

1. Simplify the web page

    ```sh
    cat >/usr/share/nginx/html/index.html <<'EOF'
    <html>
      <head><title>Fedora VM - Nginx</title></head>
      <body>
        <h1>Hello from nginx in a Fedora VM on OpenShift Virtualization!</h1>
      </body>
    </html>
    EOF
    ````

1. Deploy a Service

    ```sh
    cat <<EOF | oc apply -f -
    apiVersion: v1
    kind: Service
    metadata:
      name: fedora-web
      namespace: $OC_PROJECT
    spec:
      selector:
        vm.kubevirt.io/name: fedora-stateless-ssh
      ports:
        - name: http
          port: 80        # Service port
          targetPort: 80  # nginx port in the VM
    EOF
    ```

1. Create a Route

    ```sh
    cat <<EOF | oc apply -f -
    apiVersion: route.openshift.io/v1
    kind: Route
    metadata:
      name: fedora-web-route
      namespace: $OC_PROJECT
      labels:
        app: hello
        tier: frontend
    spec:
      host: shared-virt-roks-5348c99e82c5c6b8edeec6aa250d032f-0000.eu-de.containers.appdomain.cloud
      secretName: shared-virt-roks-5348c99e82c5c6b8edeec6aa250d032f-0000
      to:
        kind: Service
        name: fedora-web
        weight: 100
      port:
        targetPort: 80
      tls:
        termination: edge
      wildcardPolicy: None
    EOF
    ```

1. Test the route

    ```sh
    curl https://shared-virt-roks-5348c99e82c5c6b8edeec6aa250d032f-0000.eu-de.containers.appdomain.cloud
    ```

1. You should see the following output

    ```html
    <html>
      <head><title>Fedora VM - Nginx</title></head>
      <body>
        <h1>Hello from nginx in a Fedora VM on OpenShift!</h1>
      </body>
    </html>
    ```

## Clean up the VM and the infrastructure

1. Delete the Virtual Machine

    ```sh
    oc delete vm/fedora-stateless
    ```

1. Delete the infrastructure

    ```sh
    terraform destroy
    ```

## Expose the Openshift Internal Image Registry

1. Expose the Openshift Internal Image Registry

    ```sh
    oc patch configs.imageregistry.operator.openshift.io/cluster --patch '{"spec":{"defaultRoute":true}}' --type=merge
    oc get routes -n openshift-image-registry
    OPENSHIFT_REGISTRY=$(oc get routes -n openshift-image-registry | grep default-route-openshift-image-registry | awk '{print $2}')
    ```

1. Login to the OpenShift Registry

    ```sh
    podman login -u kubeadmin -p `oc whoami -t` $OPENSHIFT_REGISTRY
    ````

## Import Image to the OpenShift Registry

1. Download image

    ```sh
    curl -LO https://download.fedoraproject.org/pub/fedora/linux/releases/42/Cloud/x86_64/images/Fedora-Cloud-Base-Generic-42-1.1.x86_64.qcow2
    ```

1. Create Dockerfile

    ```sh
    cat << END > Dockerfile
    FROM kubevirt/container-disk-v1alpha
    ADD Fedora-Cloud-Base-Generic-42-1.1.x86_64.qcow2 /disk
    END
    ```

1. Build the image

    ```sh
    podman build -t $OPENSHIFT_REGISTRY/$OC_PROJECT/virt-fedora:32 .
    ```

1. Push the image

    ```sh
    podman push $OPENSHIFT_REGISTRY/$OC_PROJECT/virt-fedora:32
    ```

1. Let's provision this imported image Fedora VM

    ```sh
    cat <<EOF | oc apply -n $OC_PROJECT -f -
    apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      name: fedora-stateless
      labels:
        app: fedora-stateless
    spec:
      runStrategy: Always # VM starts automatically and restarts if stopped
      template:
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - bootOrder: 1
                  disk:
                    bus: virtio
                  name: rootdisk
                - bootOrder: 4
                  disk:
                    bus: virtio
                  name: cloudinitdisk
              interfaces:
                - bootOrder: 2
                  masquerade: {}
                  model: virtio
                  name: nic0
              networkInterfaceMultiqueue: true
              rng: {}
            machine:
              type: pc-q35-rhel8.1.0
            resources:
              requests:
                memory: 2Gi
          evictionStrategy: LiveMigrate
          hostname: fedora-stateless
          networks:
            - name: nic0
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - containerDisk:
                image: 'image-registry.openshift-image-registry.svc.cluster.local:5000/$OC_PROJECT/virt-fedora:32'
                imagePullPolicy: Always
              name: rootdisk
            - cloudInitNoCloud:
                userData: |
                  #cloud-config
                  ssh_pwauth: True
                  chpasswd:
                    list: |
                      root:password
                    expire: False
                  hostname: fedora-stateless
              name: cloudinitdisk
    EOF
    ```

1. Verify the image is uploaded to the registry under the namespace

    ```sh
    oc get is
    oc describe is virt-fedora
    ```

1. Delete the local image

    ```sh
    rm Fedora-Cloud-Base-32-1.6.x86_64.qcow2
    ```

## Resources

* [Deploy Linux sysdig agent](https://cloud.ibm.com/docs/monitoring?topic=monitoring-agent_linux)
