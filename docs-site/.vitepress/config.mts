import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'L33t Speak',
  description: 'Voice to Text for VS Code',
  base: '/',
  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Silkscreen&display=swap',
    }],
  ],

  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Install', link: '/install' },
      { text: 'GitHub', link: 'https://github.com/chaosloth/l33t-speak' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/install' },
          { text: 'Quick Start', link: '/guide/' },
          { text: 'Configuration', link: '/guide/configuration' },
        ],
      },
      {
        text: 'Usage',
        items: [
          { text: 'Editor Dictation', link: '/guide/editor' },
          { text: 'Terminal & Claude Code', link: '/guide/terminal' },
          { text: 'Microphone Selection', link: '/guide/microphone' },
        ],
      },
      {
        text: 'AI Gateway',
        items: [
          { text: 'Gateway Setup', link: '/guide/gateway' },
          { text: 'Processing Modes', link: '/guide/modes' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/chaosloth/l33t-speak' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Christopher Connolly',
    },
  },
})
