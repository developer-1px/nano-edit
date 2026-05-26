import {
  clickTarget,
  evaluate,
  scrollTargetIntoView,
  wait,
} from './browser-test-harness.mjs'

export async function appendText(browser, selector, text) {
  await focusEnd(browser, selector)
  await browser.send('Input.insertText', { text })
}

export async function composeText(browser, selector, text) {
  await focusEnd(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!(target instanceof HTMLElement)) throw new Error('Missing composition target: ${selector}')
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : document.createRange()
    if (!target.contains(range.endContainer)) {
      range.selectNodeContents(target)
      range.collapse(false)
    }
    range.insertNode(document.createTextNode(${JSON.stringify(text)}))
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    target.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: ${JSON.stringify(text)},
      inputType: 'insertCompositionText',
      isComposing: true,
    }))
    target.dispatchEvent(new CompositionEvent('compositionend', {
      bubbles: true,
      data: ${JSON.stringify(text)},
    }))
    return true
  })()`)
}

export async function pasteText(browser, selector, text) {
  await focusEnd(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!(target instanceof HTMLElement)) throw new Error('Missing paste target: ${selector}')
    let event
    if (typeof ClipboardEvent === 'function' && typeof DataTransfer === 'function') {
      const data = new DataTransfer()
      data.setData('text/plain', ${JSON.stringify(text)})
      event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })
    } else {
      event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: (type) => type === 'text/plain' ? ${JSON.stringify(text)} : '' },
      })
    }
    target.dispatchEvent(event)
    return event.defaultPrevented
  })()`)
}

export async function blurEditor(browser) {
  await evaluate(browser, `(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.getSelection()?.removeAllRanges()
    return true
  })()`)
  await wait(120)
}

async function focusEnd(browser, selector) {
  await scrollTargetIntoView(browser, selector)
  await clickTarget(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing focus target: ${selector}')
    if (target instanceof HTMLElement) target.focus()
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  })()`)
}
