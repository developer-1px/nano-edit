void bootstrap()

async function bootstrap(): Promise<void> {
  if (isNano2ExamplesPath(window.location.pathname)) {
    await import('./nano2/examples/main')
    return
  }

  await import('./demo/main')
}

function isNano2ExamplesPath(pathname: string): boolean {
  return pathname === '/nano2'
    || pathname === '/nano2/'
    || pathname.startsWith('/nano2/')
}
