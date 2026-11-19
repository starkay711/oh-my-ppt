import { app, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log/main.js'
import dayjs from 'dayjs'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { isRepeatedRendererCrash, shouldRecoverRenderer } from './renderer-recovery'

// Private fork: update check disabled on purpose.
// The upstream code fetched the author's version manifest on every launch.
// This build must never contact the author's server, so the whole
// version-check path (URL, fetch, version compare, notification) is removed.
// scheduleUpdateNotification is kept as a no-op so existing callers keep
// compiling, but it deliberately does nothing.

export function configureLogging(): void {
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 20 * 1024 * 1024
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  if (is.dev) {
    const logDir = join(process.cwd(), 'logs')
    mkdirSync(logDir, { recursive: true })
    log.transports.file.resolvePathFn = () => join(logDir, 'main.log')
  } else {
    log.transports.file.resolvePathFn = () => {
      const now = dayjs()
      const yearMonth = now.format('YYYY-MM')
      const yearMonthDay = now.format('YYYY-MM-DD')
      return join(
        app.getPath('userData'),
        'ohmyppt_logs',
        yearMonth,
        `${yearMonthDay}-v${app.getVersion()}.log`
      )
    }
  }

  log.initialize()
  log.info('[app] logger initialized', {
    env: is.dev ? 'dev' : 'prod',
    version: app.getVersion(),
    file: log.transports.file.getFile().path
  })
}

export function scheduleUpdateNotification(_window: BrowserWindow): void {
  // Disabled in this private fork: never fetch a new version, never notify.
  // Keeping the export (and the unused _window parameter) avoids touching
  // every caller; the call site in application.ts is also removed.
  return
}

export function attachRendererCrashRecovery(
  window: BrowserWindow,
  options: {
    isShuttingDown(): boolean
    loadHome(): void
  }
): void {
  let lastRendererCrashAt = 0
  window.webContents.on('render-process-gone', (_event, details) => {
    log.error('[renderer] process gone', details)
    if (options.isShuttingDown() || !shouldRecoverRenderer(details.reason)) return

    const now = Date.now()
    const repeatedCrash = isRepeatedRendererCrash(lastRendererCrashAt, now)
    lastRendererCrashAt = now

    setTimeout(() => {
      if (options.isShuttingDown() || window.isDestroyed() || window.webContents.isDestroyed()) return
      if (!repeatedCrash) {
        window.webContents.reload()
        return
      }

      log.warn('[renderer] repeated crash; recovering at home route')
      options.loadHome()
    }, 250)
  })
}
