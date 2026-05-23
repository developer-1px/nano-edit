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
      const control = button(option.label, title, () => actions.runBlockPickerTemplate(option.template), blockPickerIcon(option.id))
      control.classList.add('block-picker-option')
      control.dataset.md = option.markdownTrigger ?? ''
      return control
    }),
  )
  return [
    ...markToolbarOptions().map((option) =>
      button(option.toolbar.label, option.toolbar.title, () => actions.runMarkCommand(option), markToolbarIcon(option.id)),
    ),
    ...blockToolbarButtons((option) => button(
      option.toolbar.label,
      option.toolbar.title,
      () => actions.runBlockTemplate(option.template),
      blockToolbarIcon(option.id),
    )),
    button('', 'Change', () => toggleBlockPicker('convert'), Pilcrow),
    button('', 'Add', () => toggleBlockPicker('insert'), Plus),
    ctx.blockPicker,
  ]
}

function markToolbarIcon(id: string): IconNode | undefined {
  switch (id) {
    case 'bold':
      return Bold
    case 'italic':
      return Italic
    case 'underline':
      return Underline
    case 'strike':
      return Strikethrough
    case 'highlight':
      return Highlighter
    case 'code':
      return Code2
    default:
      return undefined
  }
}

function blockToolbarIcon(id: string): IconNode | undefined {
  return blockPickerIcon(id)
}

function blockPickerIcon(id: string): IconNode | undefined {
  switch (id) {
    case 'paragraph':
      return Pilcrow
    case 'heading-1':
      return Heading1
    case 'heading-2':
      return Heading2
    case 'heading-3':
      return Heading3
    case 'heading-4':
      return Heading4
    case 'heading-5':
      return Heading5
    case 'heading-6':
      return Heading6
    case 'todo':
      return ListTodo
    case 'bullet':
      return ListIcon
    case 'ordered':
      return ListOrdered
    case 'footnote':
      return FileText
    case 'note-ref':
      return NotebookText
    case 'tag-ref':
      return Tags
    case 'quote':
      return Quote
    case 'callout-note':
      return Info
    case 'callout-tip':
      return Lightbulb
    case 'callout-important':
      return Diamond
    case 'callout-warning':
      return AlertTriangle
    case 'callout-caution':
      return MessageSquareWarning
    case 'code':
      return Code2
    case 'math':
      return Sigma
    case 'divider':
      return Minus
    case 'bookmark':
      return BookmarkIcon
    case 'attachment':
      return Paperclip
    case 'image':
      return ImageIcon
    case 'table':
      return TableIcon
    default:
      return undefined
  }
}
