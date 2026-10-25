'use strict';

// Small, deterministic editorial figures. Values are repeated in each guide's
// worked steps and caption; the picture is never the only explanation.
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[character]);

function formatValue(value, unit = '') {
  if (typeof value !== 'number') return String(value);
  const number = new Intl.NumberFormat('en-CA', { minimumFractionDigits: unit === '$' && !Number.isInteger(value) ? 2 : 0, maximumFractionDigits: 2 }).format(value);
  if (unit === '$') return `$${number}`;
  if (unit === '%') return `${number}%`;
  return `${number}${unit ? ` ${unit}` : ''}`;
}

function createGuideVisual(id, visual) {
  if (!visual || !['bars', 'flow', 'compare'].includes(visual.type)) throw new Error(`${id}: unknown visual type`);
  if (!visual.title || !visual.description || visual.items.length < 2 || visual.items.length > 4) throw new Error(`${id}: incomplete visual`);
  const height = 48 + visual.items.length * 128;
  const isChart = visual.type === 'bars';
  if (isChart && visual.items.some((item) => typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0)) {
    throw new Error(`${id}: bars require finite nonnegative numeric values`);
  }
  const maximum = isChart ? Math.max(...visual.items.map((item) => item.value), 1) : 1;
  const rows = visual.items.map((item, index) => {
    const y = 24 + index * 128;
    const value = formatValue(item.value, visual.unit);
    const label = escapeXml(item.label);
    const colour = index % 2 ? '#8b642b' : '#1d6b45';
    if (isChart) {
      // All bars share a zero baseline and the same scale. No minimum-width bars.
      const width = (item.value / maximum * 576).toFixed(3);
      return `<g data-value="${item.value}">
        <text x="32" y="${y + 32}" font-size="34" font-weight="600">${label}</text>
        <text x="608" y="${y + 72}" text-anchor="end" font-size="34" font-weight="600" fill="${colour}">${escapeXml(value)}</text>
        <rect x="32" y="${y + 90}" width="576" height="20" rx="4" fill="#efede6"/>
        <rect x="32" y="${y + 90}" width="${width}" height="20" rx="4" fill="${colour}"/>
      </g>`;
    }
    const valueSize = value.length > 26 ? 28 : value.length > 20 ? 32 : 36;
    return `<g>
      <rect x="24" y="${y}" width="592" height="108" rx="10" fill="${index % 2 ? '#f4f0e7' : '#eef5f0'}"/>
      ${visual.type === 'flow' && index < visual.items.length - 1 ? `<path d="M58 ${y + 108}v18m-5-5 5 5 5-5" fill="none" stroke="#8b642b" stroke-width="2"/>` : ''}
      <circle cx="58" cy="${y + 36}" r="18" fill="${colour}"/>
      <text x="58" y="${y + 43}" font-size="20" text-anchor="middle" fill="#fff">${index + 1}</text>
      <text x="92" y="${y + 36}" font-size="32" font-weight="600">${label}</text>
      <text x="92" y="${y + 79}" font-size="${valueSize}" fill="${colour}">${escapeXml(value)}</text>
    </g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${height}" viewBox="0 0 640 ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(visual.title)}</title>
  <desc id="description">${escapeXml(visual.description)} ${visual.items.map((item) => escapeXml(`${item.label}: ${formatValue(item.value, visual.unit)}. ${item.detail || ''}`)).join(' ')}</desc>
  <rect width="640" height="${height}" fill="#fff"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#1a1816">${rows}</g>
</svg>\n`;
}

module.exports = { createGuideVisual, formatValue };
