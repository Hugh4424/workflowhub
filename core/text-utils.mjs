export function truncateWords(text, maxWords) {
  if (text === '') return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  if (maxWords === 0) return '…';
  return words.slice(0, maxWords).join(' ') + '…';
}
