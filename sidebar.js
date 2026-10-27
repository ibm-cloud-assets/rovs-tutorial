// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  labSidebar: [
    { type: 'doc', id: 'intro', label: 'Introduction' },
    {
      type: 'category',
      label: 'Tutorials',
      collapsible: false,
      items: [
        { type: 'doc', id: 'vm-management', label: '1. VM Management' },
        { type: 'doc', id: 'storage-management', label: '2. Storage Management' },
        { type: 'doc', id: 'template-instancetype', label: '3. Templates & InstanceTypes' },
        { type: 'doc', id: 'networking', label: '4. Networking' },
        { type: 'doc', id: 'vm-yaml', label: '5. VMs with YAML' },
      ],
    },
    {
      type: 'html',
      value: '<hr style="margin: 0.75rem 0.75rem; border-color: #dde5ee;" />',
    },
    {
      type: 'category',
      label: 'IBM Cloud Docs',
      collapsed: true,
      items: [
        { type: 'link', label: 'ROVS Overview', href: 'https://cloud.ibm.com/docs/openshift?topic=openshift-rovs-overview' },
        { type: 'link', label: 'VNI for Virtualization', href: 'https://cloud.ibm.com/docs/openshift?topic=openshift-vni-virtualization' },
      ],
    },
  ],
};

export default sidebars;