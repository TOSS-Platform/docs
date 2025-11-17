/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Protocol Documentation sidebar
  protocolSidebar: [
    {
      type: 'doc',
      id: 'protocol/intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsible: true,
      collapsed: false,
      items: [
        'protocol/architecture/overview',
        'protocol/architecture/layered-system',
        'protocol/architecture/l1-l2-communication',
        'protocol/architecture/security-model',
      ],
    },
    {
      type: 'category',
      label: 'Smart Contracts',
      collapsible: true,
      collapsed: true,
      items: [
        'protocol/contracts/overview',
        {
          type: 'category',
          label: 'Core Contracts',
          items: [
            'protocol/contracts/core/TOSS',
            'protocol/contracts/core/TOSSTreasury',
            'protocol/contracts/core/RewardDistributor',
            'protocol/contracts/core/BridgeGateway',
            'protocol/contracts/core/TOSSChainState',
            'protocol/contracts/core/DAOConfigCore',
          ],
        },
        {
          type: 'category',
          label: 'Fund Layer',
          items: [
            'protocol/contracts/fund/FundFactory',
            'protocol/contracts/fund/FundRegistry',
            'protocol/contracts/fund/FundManagerVault',
            'protocol/contracts/fund/FundConfig',
            'protocol/contracts/fund/FundTradeExecutor',
          ],
        },
        {
          type: 'category',
          label: 'Risk Layer',
          items: [
            'protocol/contracts/risk/RiskEngine',
            'protocol/contracts/risk/ProtocolRiskDomain',
            'protocol/contracts/risk/FundRiskDomain',
            'protocol/contracts/risk/InvestorRiskDomain',
            'protocol/contracts/risk/SlashingEngine',
            'protocol/contracts/risk/PenaltyEngine',
            'protocol/contracts/risk/IntentDetection',
            'protocol/contracts/risk/RiskMathLib',
          ],
        },
        {
          type: 'category',
          label: 'Governance Layer',
          items: [
            'protocol/contracts/governance-layer',
            'protocol/contracts/governance/FundGovernance',
            'protocol/contracts/governance/FMGovernance',
            'protocol/contracts/governance/ProtocolGovernance',
            'protocol/contracts/governance/VoterRegistry',
          ],
        },
        {
          type: 'category',
          label: 'Investor Layer',
          items: [
            'protocol/contracts/investor/InvestorRegistry',
            'protocol/contracts/investor/InvestorScoreCalculator',
            'protocol/contracts/investor/InvestorStateMachine',
            'protocol/contracts/investor/InvestorPenaltyEngine',
            'protocol/contracts/investor/InvestorRewardEngine',
          ],
        },
        {
          type: 'category',
          label: 'Utilities',
          items: [
            'protocol/contracts/utilities/PriceOracleRouter',
            'protocol/contracts/utilities/AnalyticsHub',
            'protocol/contracts/utilities/AMLGuard',
            'protocol/contracts/utilities/GasVault',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Tokenomics & Risk Engine',
      collapsible: true,
      collapsed: true,
      items: [
        'protocol/tokenomics/overview',
        'protocol/tokenomics/immutable-layer',
        'protocol/tokenomics/config-layer',
        'protocol/tokenomics/logic-layer',
      ],
    },
    {
      type: 'doc',
      id: 'protocol/zksync/overview',
      label: 'zkSync Integration',
    },
    {
      type: 'category',
      label: 'Governance',
      collapsible: true,
      collapsed: true,
      items: [
        'protocol/governance/overview',
        'protocol/governance/dao-structure',
        'protocol/governance/proposal-lifecycle',
        'protocol/governance/voting-mechanism',
      ],
    },
    {
      type: 'doc',
      id: 'protocol/security/overview',
      label: 'Security',
    },
    {
      type: 'doc',
      id: 'protocol/standards/overview',
      label: 'Fund Standards',
    },
    {
      type: 'category',
      label: 'Processes & Workflows',
      collapsible: true,
      collapsed: true,
      items: [
        'protocol/processes/overview',
        {
          type: 'category',
          label: 'Fund Manager Processes',
          items: [
            'protocol/processes/fund-manager/create-fund',
            'protocol/processes/fund-manager/execute-trade',
            'protocol/processes/fund-manager/update-config',
            'protocol/processes/fund-manager/collect-fees',
            'protocol/processes/fund-manager/close-fund',
            'protocol/processes/fund-manager/manage-stake',
          ],
        },
        {
          type: 'category',
          label: 'Investor Processes',
          items: [
            'protocol/processes/investor/onboarding',
            'protocol/processes/investor/deposit',
            'protocol/processes/investor/withdraw',
            'protocol/processes/investor/upgrade-class',
            'protocol/processes/investor/emergency-exit',
          ],
        },
        {
          type: 'category',
          label: 'Risk & Compliance',
          items: [
            'protocol/processes/risk-compliance/risk-validation',
            'protocol/processes/risk-compliance/slashing-execution',
            'protocol/processes/risk-compliance/penalty-application',
            'protocol/processes/risk-compliance/intent-detection',
            'protocol/processes/risk-compliance/circuit-breaker',
          ],
        },
        {
          type: 'category',
          label: 'Governance Processes',
          items: [
            'protocol/processes/governance/fund-proposal',
            'protocol/processes/governance/fm-proposal',
            'protocol/processes/governance/protocol-proposal',
            'protocol/processes/governance/voting',
            'protocol/processes/governance/execution',
          ],
        },
        {
          type: 'category',
          label: 'System Processes',
          items: [
            'protocol/processes/system/nav-update',
            'protocol/processes/system/daily-settlement',
            'protocol/processes/system/fee-distribution',
            'protocol/processes/system/emergency-procedures',
          ],
        },
        {
          type: 'category',
          label: 'Integration Processes',
          items: [
            'protocol/processes/integration/l1-to-l2-deposit',
            'protocol/processes/integration/l2-to-l1-withdrawal',
            'protocol/processes/integration/offchain-sync',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'MCP Integration',
      collapsible: true,
      collapsed: true,
      items: [
        'mcp-integration/overview',
        'mcp-integration/tools/overview',
        'mcp-integration/resources/overview',
        'mcp-integration/integration-guide',
        'mcp-integration/examples/overview',
      ],
    },
  ],

  // Technical Guide sidebar
  technicalSidebar: [
    {
      type: 'doc',
      id: 'technical/intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsible: true,
      collapsed: false,
      items: [
        'technical/getting-started/prerequisites',
        'technical/getting-started/quick-start',
        'technical/getting-started/environment-setup',
      ],
    },
    {
      type: 'doc',
      id: 'technical/offchain/overview',
      label: 'Off-Chain Services',
    },
    {
      type: 'doc',
      id: 'technical/infrastructure/overview',
      label: 'Infrastructure',
    },
    {
      type: 'doc',
      id: 'technical/testing/overview',
      label: 'Testing & QA',
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    {
      type: 'doc',
      id: 'api/overview',
      label: 'API Overview',
    },
    {
      type: 'category',
      label: 'REST API',
      collapsible: true,
      collapsed: false,
      items: [
        'api/rest/introduction',
        'api/rest/authentication',
        'api/rest/rate-limits',
      ],
    },
    {
      type: 'doc',
      id: 'api/abis/overview',
      label: 'Smart Contract ABIs',
    },
    {
      type: 'doc',
      id: 'api/sdk/overview',
      label: 'SDK Reference',
    },
    {
      type: 'doc',
      id: 'api/websocket/overview',
      label: 'WebSocket Events',
    },
  ],

  // Investor Deck sidebar
  investorSidebar: [
    {
      type: 'category',
      label: 'Problem & Solution',
      collapsible: true,
      collapsed: false,
      items: [
        'investor-deck/problem-statement',
        'investor-deck/solution-overview',
      ],
    },
    {
      type: 'category',
      label: 'Market Opportunity',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/market-size',
        'investor-deck/target-segments',
      ],
    },
    {
      type: 'category',
      label: 'Product & Technology',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/platform-overview',
        'investor-deck/technical-architecture',
        'investor-deck/competitive-advantage',
      ],
    },
    {
      type: 'category',
      label: 'Business Model',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/tokenomics',
        'investor-deck/revenue-streams',
        'investor-deck/unit-economics',
      ],
    },
    {
      type: 'category',
      label: 'Go-to-Market',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/gtm-strategy',
        'investor-deck/competitive-analysis',
      ],
    },
    {
      type: 'category',
      label: 'Team & Roadmap',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/team',
        'investor-deck/roadmap',
      ],
    },
    {
      type: 'category',
      label: 'Investment',
      collapsible: true,
      collapsed: true,
      items: [
        'investor-deck/financials',
        'investor-deck/investment-opportunity',
      ],
    },
  ],
};

export default sidebars;

