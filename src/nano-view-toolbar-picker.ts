import {
  AlertTriangle,
  Bold,
  Bookmark as BookmarkIcon,
  Code2,
  Diamond,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Highlighter,
  Image as ImageIcon,
  Info,
  Italic,
  Lightbulb,
  List as ListIcon,
  ListOrdered,
  ListTodo,
  MessageSquareWarning,
  Minus,
  NotebookText,
  Paperclip,
  Pilcrow,
  Plus,
  Quote,
  Sigma,
  Strikethrough,
  Table as TableIcon,
  Tags,
  Underline,
} from 'lucide'
import {
  blockOptions,
} from './nano-block-options'
import { blockOptionTitle } from './nano-block-ui'
import { markToolbarOptions } from './nano-mark-options'
import type { IconNode } from './nano-icons'
import type { BlockPickerMode, NanoViewContext } from './nano-view-context'
import {
  blockToolbarButtons,
  button,
} from './nano-view-toolbar-controls'
import type { NanoToolbarActions } from './nano-view-toolbar-types'

export function installToolbarBlockPicker(
  ctx: NanoViewContext,
  actions: NanoToolbarActions,
  toggleBlockPicker: (mode: BlockPickerMode) => void,
): HTMLElement[] {
  ctx.blockPicker.replaceChildren(
    ...blockOptions.map((option) => {
      const title = blockOptionTitle(option)
      const control = button(option.label, title, () => actions.runBlockPickerTemplate(option.template), blockPickerIcon(title))
      control.classList.add('block-picker-option')
      control.dataset.md = option.markdownTrigger ?? ''
      return control
    }),
  )
  return [
    ...markToolbarOptions().map((option) =>
      button(option.toolbar.label, option.toolbar.title, () => actions.runMarkCommand(option), markToolbarIcon(option.toolbar.title)),
    ),
    ...blockToolbarButtons((option) => button(
      option.toolbar.label,
      option.toolbar.title,
      () => actions.runBlockTemplate(option.template),
      blockToolbarIcon(option.toolbar.title),
    )),
    button('', 'Change', () => toggleBlockPicker('convert'), Pilcrow),
    button('', 'Add', () => toggleBlockPicker('insert'), Plus),
    ctx.blockPicker,
  ]
}

function markToolbarIcon(title: string): IconNode | undefined {
  switch (title) {
    case 'Bold':
      return Bold
    case 'Italic':
      return Italic
    case 'Underline':
      return Underline
    case 'Strikethrough':
      return Strikethrough
    case 'Highlight':
      return Highlighter
    case 'Inline Code':
      return Code2
    default:
      return undefined
  }
}

function blockToolbarIcon(title: string): IconNode | undefined {
  switch (title) {
    case 'Heading 1':
      return Heading1
    case 'Todo':
      return ListTodo
    case 'Bullet List':
      return ListIcon
    case 'Numbered List':
      return ListOrdered
    default:
      return undefined
  }
}

function blockPickerIcon(title: string): IconNode | undefined {
  switch (title) {
    case 'Paragraph':
      return Pilcrow
    case 'Heading 1':
      return Heading1
    case 'Heading 2':
      return Heading2
    case 'Heading 3':
      return Heading3
    case 'Heading 4':
      return Heading4
    case 'Heading 5':
      return Heading5
    case 'Heading 6':
      return Heading6
    case 'Todo':
      return ListTodo
    case 'Bullet List':
      return ListIcon
    case 'Numbered List':
      return ListOrdered
    case 'Footnote':
      return FileText
    case 'Note Reference':
      return NotebookText
    case 'Tag Reference':
      return Tags
    case 'Quote':
      return Quote
    case 'Callout note':
      return Info
    case 'Callout tip':
      return Lightbulb
    case 'Callout important':
      return Diamond
    case 'Callout warning':
      return AlertTriangle
    case 'Callout caution':
      return MessageSquareWarning
    case 'Code':
      return Code2
    case 'Math':
      return Sigma
    case 'Divider':
      return Minus
    case 'Bookmark':
      return BookmarkIcon
    case 'Attachment':
      return Paperclip
    case 'Image':
      return ImageIcon
    case 'Table':
      return TableIcon
    default:
      return undefined
  }
}
