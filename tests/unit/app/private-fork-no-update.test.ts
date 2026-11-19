import fs from 'fs'
import { describe, expect, it } from 'vitest'

// Private fork: the app must never check for updates or contact the
// author's server on its own. These are file-level guards so a future
// upstream merge cannot silently re-enable the update check.
describe('private fork: no update check, no author-server fetch', () => {
  it('removes the update manifest fetch from the main process', () => {
    const lifecycle = fs.readFileSync('src/main/app/lifecycle.ts', 'utf8')

    expect(lifecycle).not.toContain('version.json')
    expect(lifecycle).not.toContain('ohmyppt.cc')
    expect(lifecycle).not.toContain('fetchLatestRelease')
    expect(lifecycle).not.toContain('app:update-available')
    expect(lifecycle).not.toContain('fetch(')
    expect(lifecycle).toContain('scheduleUpdateNotification')
  })

  it('does not call the update notifier from the application bootstrap', () => {
    const application = fs.readFileSync('src/main/app/application.ts', 'utf8')

    expect(application).not.toContain('scheduleUpdateNotification(window)')
  })

  it('removes the auto-update publish channel and its dev config', () => {
    const builder = fs.readFileSync('electron-builder.yml', 'utf8')

    expect(builder).not.toContain('publish:')
    expect(builder).not.toContain('auto-updates')
    expect(fs.existsSync('dev-app-update.yml')).toBe(false)
  })

  it('never loads Chart.js from a CDN in the HTML editor', () => {
    const canvas = fs.readFileSync(
      'src/renderer/src/components/html-editor/HtmlEditorCanvas.tsx',
      'utf8'
    )

    expect(canvas).not.toContain('cdn.bootcdn.net')
    expect(canvas).not.toContain('chart.umd.min.js')
  })
})
