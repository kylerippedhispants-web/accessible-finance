'use strict';

// Editorial diagrams. Phone artwork reflows the same data instead of shrinking
// a desktop illustration. Exact values also remain available as HTML text.
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[character]);
const palette = { ink: '#203c32', muted: '#52645b', line: '#d8dfd2', paper: '#fffdf6', canvas: '#f8f3e7', green: '#24664e', tint: '#e6eadc' };

function formatValue(value, unit = '') {
  if (typeof value !== 'number') return String(value);
  const number = new Intl.NumberFormat('en-CA', { minimumFractionDigits: unit === '$' && !Number.isInteger(value) ? 2 : 0, maximumFractionDigits: 2 }).format(value);
  if (unit === '$') return `$${number}`;
  if (unit === '%') return `${number}%`;
  return `${number}${unit ? ` ${unit}` : ''}`;
}

function wrap(value, limit) {
  const lines = [''];
  for (const word of String(value || '').split(/\s+/)) {
    const current = lines.length - 1;
    if (lines[current] && lines[current].length + word.length + 1 > limit) lines.push(word);
    else lines[current] += `${lines[current] ? ' ' : ''}${word}`;
  }
  return lines;
}

function text(lines, x, y, size, options = {}) {
  const { colour = palette.ink, serif = false, weight = 400, anchor = 'start', leading = size * 1.35 } = options;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${colour}" text-anchor="${anchor}"${serif ? ' font-family="Georgia, Times New Roman, serif"' : ''}>${lines.map((line, index) => `<tspan x="${x}" dy="${index ? leading : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

function layout(visual, mobile) {
  const width = mobile ? 360 : 640;
  const inset = mobile ? 24 : 36;
  const columns = visual.type === 'compare' && visual.items.length === 2 && !mobile;
  const rows = visual.items.map((item) => {
    const label = wrap(item.label, mobile ? 24 : columns ? 23 : 42);
    const formatted = formatValue(item.value, visual.unit);
    const value = columns && formatted.includes(' / ')
      ? formatted.split(' / ').map((part, index) => index ? part : `${part} /`)
      : wrap(formatted, columns ? 16 : mobile ? 18 : 32);
    const detail = wrap(item.detail, mobile ? (visual.type === 'bars' ? 29 : 25) : columns ? 26 : visual.type === 'flow' ? 48 : 58);
    const height = visual.type === 'bars'
      ? (mobile ? 130 : 100) + detail.length * (mobile ? 28 : 24)
      : 70 + label.length * (mobile ? 28 : 25) + value.length * 42 + detail.length * (mobile ? 28 : 24);
    return { item, label, value, detail, height };
  });
  const labelLines = Math.max(...rows.map((row) => row.label.length));
  const valueLines = Math.max(...rows.map((row) => row.value.length));
  const detailLines = Math.max(...rows.map((row) => row.detail.length));
  const height = inset * 2 + (columns ? 70 + labelLines * 25 + valueLines * 42 + detailLines * 24 : rows.reduce((sum, row) => sum + row.height, 0));
  return { width, height, inset, columns, rows, labelLines, valueLines };
}

function getGuideVisualDimensions(visual, mobile = false) {
  const { width, height } = layout(visual, mobile);
  return { width, height };
}

function createGuideVisual(id, visual, mobile = false) {
  if (!visual || !['bars', 'flow', 'compare'].includes(visual.type)) throw new Error(`${id}: unknown visual type`);
  if (!visual.title || !visual.description || visual.items.length < 2 || visual.items.length > 4) throw new Error(`${id}: incomplete visual`);
  const isChart = visual.type === 'bars';
  if (isChart && visual.items.some((item) => typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0)) {
    throw new Error(`${id}: bars require finite nonnegative numeric values`);
  }
  const { width, height, inset, columns, rows, labelLines, valueLines } = layout(visual, mobile);
  const maximum = isChart ? Math.max(...visual.items.map((item) => item.value), 1) : 1;
  const contentWidth = width - inset * 2;
  let top = inset;
  const drawings = rows.map((row, index) => {
    const { item, label, value, detail } = row;
    const last = index === rows.length - 1;
    let drawing;
    if (isChart) {
      const barY = top + (mobile ? 84 : 48);
      const barWidth = item.value / maximum * contentWidth;
      drawing = `<g data-value="${item.value}" data-row="${index}">
        ${text(label, inset, top + 22, mobile ? 22 : 21, { weight: 500, leading: 28 })}
        ${text(value, width - inset, top + (mobile ? 65 : 24), mobile ? 34 : 32, { serif: true, colour: palette.green, anchor: 'end' })}
        <path d="M${inset} ${barY - 5}v32 M${width - inset} ${barY - 5}v32" stroke="${palette.line}"/>
        <rect x="${inset}" y="${barY}" width="${contentWidth}" height="22" rx="3" fill="${palette.tint}"/>
        <rect data-bar="true" x="${inset}" y="${barY}" width="${barWidth.toFixed(3)}" height="22" rx="3" fill="${palette.green}"/>
        ${text(detail, inset, barY + 51, mobile ? 21 : 18, { colour: palette.muted, leading: mobile ? 28 : 24 })}
      </g>`;
    } else if (visual.type === 'flow') {
      const railX = inset + 15;
      const x = inset + 54;
      const labelY = top + 21;
      const valueY = labelY + label.length * (mobile ? 28 : 25) + 15;
      const detailY = valueY + value.length * 42;
      drawing = `<g data-row="${index}">
        ${!last ? `<path d="M${railX} ${top + 42}V${top + row.height - 7}" stroke="#b7cbbd" stroke-width="1.5"/>
        <path d="m${railX - 4} ${top + row.height - 12} 4 5 4-5" fill="none" stroke="${palette.green}" stroke-width="1.5"/>` : ''}
        <circle cx="${railX}" cy="${top + 15}" r="15" fill="${last ? palette.green : palette.paper}" stroke="${palette.green}"/>
        ${text([String(index + 1)], railX, top + 20, 14, { anchor: 'middle', colour: last ? '#fff' : palette.green, weight: 600 })}
        ${text(label, x, labelY, mobile ? 22 : 20, { weight: 500, leading: 28 })}
        ${text(value, x, valueY, mobile ? 34 : 36, { serif: true, colour: palette.green, leading: 42 })}
        ${text(detail, x, detailY, mobile ? 21 : 18, { colour: palette.muted, leading: mobile ? 28 : 24 })}
        ${!last ? `<path d="M${x} ${top + row.height - 20}H${width - inset}" stroke="${palette.line}"/>` : ''}
      </g>`;
    } else {
      const cardX = columns ? inset + index * (contentWidth + 20) / 2 : inset;
      const cardWidth = columns ? (contentWidth - 20) / 2 : contentWidth;
      const y = columns ? inset : top;
      const padding = columns ? 20 : 22;
      const labelY = y + 35;
      const valueY = labelY + (columns ? labelLines : label.length) * (mobile ? 28 : 25) + 18;
      const detailY = valueY + (columns ? valueLines : value.length) * 42 + 5;
      drawing = `<g data-row="${index}">
        <rect x="${cardX}" y="${y}" width="${cardWidth}" height="${columns ? height - inset * 2 : row.height - 16}" rx="8" fill="${palette.paper}" stroke="${palette.line}"/>
        <path d="M${cardX + padding} ${y + 14}h28" stroke="${palette.green}" stroke-width="2"/>
        ${text(label, cardX + padding, labelY + 8, mobile ? 22 : 20, { weight: 500, leading: 28 })}
        ${text(value, cardX + padding, valueY + 8, mobile ? 34 : 32, { serif: true, colour: palette.green, leading: 42 })}
        ${text(detail, cardX + padding, detailY + 8, mobile ? 21 : 18, { colour: palette.muted, leading: mobile ? 28 : 24 })}
      </g>`;
    }
    top += row.height;
    return drawing;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-layout="${visual.type}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(visual.title)}</title>
  <desc id="description">${escapeXml(visual.description)} ${visual.items.map((item) => escapeXml(`${item.label}: ${formatValue(item.value, visual.unit)}. ${item.detail || ''}`)).join(' ')}</desc>
  <rect width="${width}" height="${height}" fill="${palette.canvas}"/>
  <g font-family="Arial, Helvetica, sans-serif">${drawings}</g>
</svg>\n`;
}

module.exports = { createGuideVisual, formatValue, getGuideVisualDimensions };
