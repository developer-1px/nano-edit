type ClipboardDataReader = Pick<DataTransfer, 'getData'>
type ClipboardDataWriter = Pick<DataTransfer, 'setData'>

const MARKDOWN_MIME_TYPE = 'text/markdown'
const PLAIN_TEXT_MIME_TYPE = 'text/plain'

export function markdownTextFromClipboardData(data: ClipboardDataReader): string {
  return data.getData(MARKDOWN_MIME_TYPE) || data.getData(PLAIN_TEXT_MIME_TYPE)
}

export function writeMarkdownTextToClipboardData(data: ClipboardDataWriter, markdown: string): void {
  data.setData(PLAIN_TEXT_MIME_TYPE, markdown)
  data.setData(MARKDOWN_MIME_TYPE, markdown)
}
