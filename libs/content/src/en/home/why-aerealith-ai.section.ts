import type { HomeWhyAerealithAiSectionContent } from '../../types'

export const aerealithDifferentiators = [
  {
    id: 'user-owned-data',
    title: 'User-Owned Data',
    description:
      'Aerealith AI is built around the principle that users own their data. The platform should support export, deletion, transparency, and clear boundaries around how data is used.',
    icon: '🛡️',
  },
  {
    id: 'contextual-memory',
    title: 'Contextual Memory',
    description:
      'Memory is designed to be layered across users, assistant identities, organizations, workspaces, projects, automations, and analytics preferences.',
    icon: '🧠',
  },
  {
    id: 'automation-with-boundaries',
    title: 'Automation With Boundaries',
    description:
      'Aerealith AI can help automate workflows, monitor systems, and assist with actions while preserving approval flows, permissions, and user control.',
    icon: '⚙️',
  },
  {
    id: 'connected-integrations',
    title: 'Connected Integrations',
    description:
      'The platform is designed to connect apps, services, developer tools, infrastructure, smart devices, and external workflows into one assistant experience.',
    icon: '🔗',
  },
  {
    id: 'dashboards-and-analytics',
    title: 'Dashboards and Analytics',
    description:
      'Aerealith AI is planned with user-fed dashboards, annotations, sharing, and operational insights so users can understand their systems at a glance.',
    icon: '📊',
  },
  {
    id: 'developer-ready-platform',
    title: 'Developer-Ready Platform',
    description:
      'Aerealith AI is being structured with SDKs, APIs, plugin manifests, marketplace support, automation hooks, and extensibility from the beginning.',
    icon: '🧑‍💻',
  },
  {
    id: 'cloud-local-and-air-gapped',
    title: 'Cloud, Local, and Air-Gapped',
    description:
      'The architecture is intended to support hosted SaaS, self-hosted deployments, and air-gapped environments where organizations need more control.',
    icon: '🏗️',
  },
  {
    id: 'transparent-ai-behavior',
    title: 'Transparent AI Behavior',
    description:
      'Aerealith AI should explain what it knows, where information came from, when it used a tool, and when a decision requires user approval.',
    icon: '🔍',
  },
] as const satisfies NonNullable<HomeWhyAerealithAiSectionContent['features']>

export const whyAerealithAiSection = {
  component: 'marketing-section',
  id: 'why-aerealith-ai-is-different',
  eyebrow: 'Why Aerealith AI',
  title: 'Built Different From the Start',
  description:
    'Aerealith AI combines assistant intelligence, user control, integrations, analytics, memory, and automation into one long-term platform vision.',
  body: 'Aerealith AI is being designed as more than a chatbot. It is a secure, extensible assistant platform built around user-owned data, contextual memory, automations, integrations, analytics, and transparent control. The goal is to make your digital systems easier to understand, easier to operate, and easier to trust.',
  features: aerealithDifferentiators,
} as const satisfies HomeWhyAerealithAiSectionContent

export const whyAerealithAiHighlights = [
  aerealithDifferentiators[0],
  aerealithDifferentiators[1],
  aerealithDifferentiators[2],
  aerealithDifferentiators[3],
] as const

export const DIFFERENT_SECTION = whyAerealithAiSection
export const HELIX_DIFFERENTIATORS = aerealithDifferentiators
export const AEREALITH_DIFFERENTIATORS = aerealithDifferentiators

export const differentSection = whyAerealithAiSection
