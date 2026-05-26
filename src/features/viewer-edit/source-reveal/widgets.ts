import { Decoration } from 'prosemirror-view'

export function sourceWidgetDecoration(
  position: number,
  token: string,
  className: string,
  kind: string,
  key: string,
  side: number,
): Decoration {
  return Decoration.widget(
    position,
    () => sourceWidget(token, className),
    {
      key,
      side,
      nanoSourceKind: kind,
      nanoSourceToken: token,
    },
  )
}

function sourceWidget(token: string, className: string): HTMLElement {
  const element = document.createElement('span')
  element.className = `nano-source-widget ${className}`
  element.setAttribute('aria-hidden', 'true')
  element.setAttribute('contenteditable', 'false')
  element.textContent = token
  return element
}
