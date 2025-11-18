// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

const {themes: prismThemes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TOSS Documentation',
  tagline: 'Crypto Fund System with AI Integration',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  // Production: https://docs.toss.fi
  // Staging: https://staging.docs.toss.fi
  // Vercel automatically sets VERCEL_URL, but we override with DOCUSAURUS_URL for specific domains
  url: process.env.DOCUSAURUS_URL || 
       (process.env.VERCEL_ENV === 'production' ? 'https://docs.toss.fi' : 'https://staging.docs.toss.fi') ||
       (process.env.NODE_ENV === 'production' ? 'https://docs.toss.fi' : 'https://staging.docs.toss.fi') ||
       'https://docs.toss.fi',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'toss', // Usually your GitHub org/user name.
  projectName: 'toss-docs', // Usually your repo name.

  onBrokenLinks: 'warn',

  markdown: {
    mermaid: true,
    emoji: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    }
  },
  themes: ['@docusaurus/theme-mermaid'],


  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
     // 'classic',
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          path: 'docs',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/TOSS-Platform/docs/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/TOSS-Platform/docs/tree/main/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [
    '@docusaurus/theme-live-codeblock'
  ],

  // plugins: [
  //   [
  //     'docusaurus-plugin-openapi-docs',
  //     {
  //       id: 'api',
  //       docsPluginId: 'classic',
  //       config: {
  //         toss: {
  //           specPath: 'openapi/toss-api.yaml',
  //           outputDir: 'docs/api',
  //           sidebarOptions: {
  //             groupPathsBy: 'tag',
  //             categoryLinkSource: 'tag',
  //           },
  //         },
  //         mcp: {
  //           specPath: 'openapi/mcp-protocol.yaml',
  //           outputDir: 'docs/mcp/reference',
  //           sidebarOptions: {
  //             groupPathsBy: 'tag',
  //             categoryLinkSource: 'tag',
  //           },
  //         },
  //       },
  //     },
  //   ],
  // ],

  // themes: ['docusaurus-theme-openapi-docs'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/toss-social-card.jpg',
      liveCodeBlock: {
        playgroundPosition: 'bottom',
      },
      navbar: {
        logo: {
          alt: 'TOSS',
          src: 'img/toss-dark.svg',
          srcDark: 'img/toss-dark.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'protocolSidebar',
            position: 'right',
            label: 'Protocol',
          },
          {
            type: 'docSidebar',
            sidebarId: 'technicalSidebar',
            position: 'right',
            label: 'Technical',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'right',
            label: 'API Reference',
          },
          {
            type: 'docSidebar',
            sidebarId: 'investorSidebar',
            position: 'right',
            label: 'Investor Deck',
          },
          {
            href: 'https://github.com/TOSS-Platform/docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        logo: {
          alt: 'TOSS Logo',
          src: 'img/toss-dark.svg',
          srcDark: 'img/toss-dark.svg',
          style: {
            width: '100px',
            height: '100px',
          },
        },
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Protocol Documentation',
                to: '/protocol/intro',
              },
              {
                label: 'Technical Guide',
                to: '/technical/intro',
              },
              {
                label: 'API Reference',
                to: '/api/overview',
              },
              {
                label: 'Investor Deck',
                to: '/investor-deck/problem-statement',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: '#',
              },
              {
                label: 'Twitter',
                href: '#',
              },
              {
                label: 'Telegram',
                href: '#',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '#',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/TOSS-Platform/docs',
              },
              {
                label: 'Status',
                href: 'https://status.toss.finance',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} TOSS Crypto Fund System.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'python', 'typescript', 'javascript', 'solidity'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      // algolia: {
      //   // Configure Algolia after getting API keys
      //   appId: 'YOUR_APP_ID',
      //   apiKey: 'YOUR_SEARCH_API_KEY',
      //   indexName: 'toss_docs',
      // },
    }),
};

module.exports = config;

