
# Import Image to the OpenShift Registry (DRAFT)

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

1. If you're importing the image from the OpenShift internal registry, you need to create an Image Pull Secret so that the Containerized Data Importer (CDI) can authenticate itself against the internal registry and pull the image to create a DataVolume out of it. The secret is essentially the default service account image pull secret token which is meant for registry authentication.

    ```sh
    ./scripts/generate_image_pull_secret.sh
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


1. Let's provision this imported image Fedora VM

   ```sh
    cat <<EOF | oc apply -f -
    apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      name: fedora-stateful
      labels:
        app: fedora-stateful
    spec:
      runStrategy: Always # VM starts automatically and restarts if stopped
      dataVolumeTemplates:
        - apiVersion: cdi.kubevirt.io/v1
          kind: DataVolume
          metadata:
            name: fedora-stateful-disk-0
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
                name: fedora-stateful-disk-0
              name: disk-0
            - cloudInitNoCloud:
                userData: |
                  #cloud-config
                  ssh_pwauth: True
                  chpasswd:
                    list: |
                      root:password
                    expire: False
                  hostname: fedora-stateful
              name: cloudinitdisk
    EOF
    ```