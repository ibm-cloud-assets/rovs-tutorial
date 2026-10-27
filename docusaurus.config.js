// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ROVS Tutorials',
  tagline: 'Red Hat OpenShift Virtualization Service on IBM Cloud',
  favicon: 'img/logo.svg',

  future: { v4: true },

  url: 'https://ibm-cloud-assets.github.io',
  baseUrl: '/rovs-tutorial/',
  organizationName: 'ibm-cloud-assets',
  projectName: 'rovs-tutorial',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
      onBrokenMarkdownImages: 'warn',
    },
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebar.js',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: false },
      navbar: {
        title: 'ROVS Tutorials',
        logo: { alt: 'OpenShift Virtualization', src: 'img/logo.svg', width: 28, height: 28 },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'labSidebar',
            position: 'left',
            label: 'Tutorials',
          },
          {
            type: 'dropdown',
            label: 'IBM Cloud Docs',
            position: 'left',
            items: [
              { label: 'ROVS Overview', href: 'https://cloud.ibm.com/docs/openshift?topic=openshift-rovs-overview' },
              { label: 'OpenShift Virtualization', href: 'https://cloud.ibm.com/docs/openshift?topic=openshift-about-openshift-virtualization' },
              { label: 'VNI for Virtualization', href: 'https://cloud.ibm.com/docs/openshift?topic=openshift-vni-virtualization' },
            ],
          },
          {
            href: 'https://github.com/ibm-cloud-assets/rovs-tutorial',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Tutorials',
            items: [
              { label: 'Introduction', to: '/docs/intro' },
              { label: '1. VM Management', to: '/docs/vm-management' },
              { label: '2. Storage Management', to: '/docs/storage-management' },
              { label: '3. Templates & InstanceTypes', to: '/docs/template-instancetype' },
              { label: '4. Networking', to: '/docs/networking' },
              { label: '5. VMs with YAML', to: '/docs/vm-yaml' },
            ],
          },
          {
            title: 'IBM Resources',
            items: [
              { label: 'ROVS on IBM Cloud', href: 'https://cloud.ibm.com/infrastructure/openshift-virtualization' },
              { label: 'Red Hat OpenShift Docs', href: 'https://docs.openshift.com/container-platform/latest/virt/about_virt/about-virt.html' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} IBM Corporation. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'yaml', 'shell-session'],
      },
    }),
};

export default config;
