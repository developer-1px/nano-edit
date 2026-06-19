export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (
      error?.code === 'ERR_MODULE_NOT_FOUND'
      && (specifier.startsWith('./') || specifier.startsWith('../'))
      && !/\.[A-Za-z0-9]+$/.test(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    if (
      error?.code === 'ERR_MODULE_NOT_FOUND'
      && (specifier.startsWith('./') || specifier.startsWith('../'))
      && specifier.endsWith('.js')
    ) {
      return nextResolve(`${specifier.slice(0, -3)}.ts`, context)
    }

    throw error
  }
}
