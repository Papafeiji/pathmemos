
const _MAX_MD_LENGTH = 5000;

export function markdownToHtml(md: string): string {
  try {
    return _markdownToHtml(md);
  } catch (e) {
    console.error('markdown parse error', e);
    return (md || '').replace(/\n/g, '<br>');
  }
}

function _markdownToHtml(md: string): string {
  if (!md) return '';

  
  if (md.length > _MAX_MD_LENGTH) {
    return md.replace(/\n/g, '<br>');
  }

  let html = md;

  
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `\0CODE_BLOCK_${codeBlocks.length - 1}\0`;
  });

  
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `\0INLINE_CODE_${inlineCodes.length - 1}\0`;
  });

  
  html = escapeHtml(html);

  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  
  html = html.replace(/\n/g, '<br>');

  
  html = html.replace(/\0CODE_BLOCK_(\d+)\0/g, (_, idx) => {
    const code = escapeHtml(codeBlocks[Number(idx)]);
    return `<pre style="background:#f6f8fa;padding:10px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.4;">${code}</pre>`;
  });

  
  html = html.replace(/\0INLINE_CODE_(\d+)\0/g, (_, idx) => {
    const code = escapeHtml(inlineCodes[Number(idx)]);
    return `<code style="background:#f1f3f4;padding:2px 5px;border-radius:3px;font-family:monospace;font-size:13px;">${code}</code>`;
  });

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
