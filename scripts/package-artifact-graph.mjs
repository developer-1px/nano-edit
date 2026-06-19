export function publicPackageSubpathExportKeys(packageJson, options = {}) {
  const includeStyle = options.includeStyle === true
  return Object.keys(packageJson.exports ?? {})
    .filter((key) => includeStyle || key !== './style.css')
}

export function packageImportSpecifier(packageJson, exportKey) {
  if (exportKey === '.') return packageJson.name
  if (exportKey.startsWith('./')) return `${packageJson.name}/${exportKey.slice(2)}`
  return `${packageJson.name}/${exportKey}`
}
