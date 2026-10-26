'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { type, line: lineHeight, spacing } = require('./type-scale.cjs');
const labelLeading = Math.ceil(type.body * lineHeight.label / spacing[4]) * spacing[4];
const detailLeading = type.compact * lineHeight.label;
const valueLeading = type.value * lineHeight.label;

// Editorial diagrams. Phone artwork reflows the same data instead of shrinking
// a desktop illustration. Exact values also remain available as HTML text.
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[character]);
const palette = { ink: '#203c32', muted: '#52645b', line: '#d8dfd2', paper: '#fffdf6', canvas: '#f8f3e7', green: '#24664e', tint: '#e6eadc' };
let embeddedFonts;

function fontStyles(id, visual) {
  embeddedFonts ||= JSON.parse(fs.readFileSync(path.join(__dirname, 'guide-fonts.json'), 'utf8'));
  const fonts = embeddedFonts.guides[id];
  const required = {
    sans: visual.items.map((item) => `${item.label} ${item.detail || ''}`).join(' '),
    serif: visual.items.map((item) => formatValue(item.value, visual.unit)).join(' '),
  };
  for (const [role, value] of Object.entries(required)) {
    if (!fonts?.[role] || [...value].some((character) => !fonts[role].characters.includes(character))) {
      throw new Error(`${id}: refresh guide font subsets with scripts/subset-guide-fonts.py before regenerating images`);
    }
  }
  // SVGs loaded through <img> cannot inherit the page's web fonts. Embedding
  // only the required glyphs keeps each image self-contained and lazy-loadable.
  return `<style>
    @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400 500; src: url(data:font/woff2;base64,${fonts.sans.woff2}) format('woff2'); }
    @font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; src: url(data:font/woff2;base64,${fonts.serif.woff2}) format('woff2'); }
  </style>`;
}

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
  const { colour = palette.ink, serif = false, weight = 400, anchor = 'start', leading = size * 1.5, role = serif ? 'value' : weight === 500 ? 'label' : 'detail' } = options;
  return `<text data-text-role="${role}" x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${colour}" text-anchor="${anchor}"${serif ? ' font-family="Instrument Serif, Georgia, serif"' : ''}>${lines.map((line, index) => `<tspan x="${x}" dy="${index ? leading : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

function layout(visual, mobile) {
  const width = mobile ? 320 : 640;
  const inset = mobile ? spacing[20] : spacing[24];
  const columns = visual.type === 'compare' && visual.items.length === 2 && !mobile;
  const detailSize = type.compact;
  // Reserve the font's descenders, then apply the same bottom inset as the top.
  // A final row does not need the inter-row space used by its predecessors.
  const descender = Math.ceil(detailSize * 0.3);
  const rows = visual.items.map((item) => {
    const label = wrap(item.label, mobile ? 24 : columns ? 23 : 42);
    const formatted = formatValue(item.value, visual.unit);
    const value = columns && formatted.includes(' / ')
      ? formatted.split(' / ').map((part, index) => index ? part : `${part} /`)
      : wrap(formatted, columns ? 16 : mobile ? 18 : 32);
    const detail = wrap(item.detail, mobile ? (visual.type === 'bars' ? 29 : 25) : columns ? 26 : visual.type === 'flow' ? 48 : 58);
    return { item, label, value, detail };
  });
  const labelLines = Math.max(...rows.map((row) => row.label.length));
  const valueLines = Math.max(...rows.map((row) => row.value.length));
  const detailLines = Math.max(...rows.map((row) => row.detail.length));
  let top = inset;
  for (const row of rows) {
    row.top = columns ? inset : top;
    if (visual.type === 'bars') {
      row.labelY = 24;
      row.valueY = mobile ? row.labelY + row.label.length * labelLeading + spacing[12] : 24;
      row.barY = mobile ? row.valueY + 16 : 48;
      row.detailY = row.barY + 48;
      row.height = row.detailY + (row.detail.length - 1) * detailLeading + descender + spacing[32];
    } else if (visual.type === 'flow') {
      row.labelY = 20;
      row.valueY = row.labelY + row.label.length * labelLeading + spacing[12];
      row.detailY = row.valueY + row.value.length * valueLeading;
      row.height = row.detailY + (row.detail.length - 1) * detailLeading + descender + spacing[32];
    } else {
      row.labelY = 48;
      row.valueY = row.labelY + (columns ? labelLines : row.label.length) * labelLeading + spacing[12];
      row.detailY = row.valueY + (columns ? valueLines : row.value.length) * valueLeading;
      const finalLine = row.detailY + ((columns ? detailLines : row.detail.length) - 1) * detailLeading;
      row.cardHeight = finalLine + descender + (mobile ? spacing[20] : spacing[24]);
      row.height = row.cardHeight + spacing[16];
    }
    row.contentBottom = row.detailY + (row.detail.length - 1) * detailLeading + descender;
    top += row.height;
  }
  const last = rows[rows.length - 1];
  const height = columns
    ? inset * 2 + rows[0].cardHeight
    : last.top + (visual.type === 'compare' ? last.cardHeight : last.contentBottom) + inset;
  return { width, height, inset, columns, rows };
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
  const { width, height, inset, columns, rows } = layout(visual, mobile);
  const maximum = isChart ? Math.max(...visual.items.map((item) => item.value), 1) : 1;
  const contentWidth = width - inset * 2;
  const drawings = rows.map((row, index) => {
    const { item, label, value, detail, top } = row;
    const last = index === rows.length - 1;
    let drawing;
    if (isChart) {
      const barY = top + row.barY;
      const barWidth = item.value / maximum * contentWidth;
      drawing = `<g data-value="${item.value}" data-row="${index}">
        ${text(label, inset, top + row.labelY, type.body, { weight: 500, leading: labelLeading })}
        ${text(value, width - inset, top + row.valueY, type.value, { serif: true, colour: palette.green, anchor: 'end' })}
        <path d="M${inset} ${barY - 5}v32 M${width - inset} ${barY - 5}v32" stroke="${palette.line}"/>
        <rect x="${inset}" y="${barY}" width="${contentWidth}" height="22" rx="3" fill="${palette.tint}"/>
        <rect data-bar="true" x="${inset}" y="${barY}" width="${barWidth.toFixed(3)}" height="22" rx="3" fill="${palette.green}"/>
        ${text(detail, inset, top + row.detailY, type.compact, { colour: palette.muted, leading: detailLeading })}
      </g>`;
    } else if (visual.type === 'flow') {
      const railX = inset + 15;
      const x = inset + 40;
      drawing = `<g data-row="${index}">
        ${!last ? `<path d="M${railX} ${top + 29}V${top + row.height + 1}" stroke="#b7cbbd" stroke-width="1.5"/>
        <path d="m${railX - 4} ${top + row.height - 4} 4 5 4-5" fill="none" stroke="${palette.green}" stroke-width="1.5"/>` : ''}
        <circle cx="${railX}" cy="${top + 15}" r="7" fill="${last ? palette.green : palette.paper}" stroke="${palette.green}" stroke-width="1.5"/>
        ${text(label, x, top + row.labelY, type.body, { weight: 500, leading: labelLeading })}
        ${text(value, x, top + row.valueY, type.value, { serif: true, colour: palette.green, leading: valueLeading })}
        ${text(detail, x, top + row.detailY, type.compact, { colour: palette.muted, leading: detailLeading })}
        ${!last ? `<path d="M${x} ${top + row.height - 20}H${width - inset}" stroke="${palette.line}"/>` : ''}
      </g>`;
    } else {
      const cardX = columns ? inset + index * (contentWidth + 20) / 2 : inset;
      const cardWidth = columns ? (contentWidth - 20) / 2 : contentWidth;
      const y = top;
      const padding = mobile ? spacing[20] : spacing[24];
      drawing = `<g data-row="${index}">
        <rect x="${cardX}" y="${y}" width="${cardWidth}" height="${row.cardHeight}" rx="8" fill="${palette.paper}" stroke="${palette.line}"/>
        <path d="M${cardX + padding} ${y + 20}h24" stroke="${palette.green}" stroke-width="2"/>
        ${text(label, cardX + padding, y + row.labelY, type.body, { weight: 500, leading: labelLeading })}
        ${text(value, cardX + padding, y + row.valueY, type.value, { serif: true, colour: palette.green, leading: valueLeading })}
        ${text(detail, cardX + padding, y + row.detailY, type.compact, { colour: palette.muted, leading: detailLeading })}
      </g>`;
    }
    return drawing;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-layout="${visual.type}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(visual.title)}</title>
  <desc id="description">${escapeXml(visual.description)} ${visual.items.map((item) => escapeXml(`${item.label}: ${formatValue(item.value, visual.unit)}. ${item.detail || ''}`)).join(' ')}</desc>
  <metadata>Embedded subsets of Inter and Instrument Serif, licensed under SIL OFL 1.1. Copyright and license records: https://accessible-finance.com/assets/fonts/Inter-OFL.txt and https://accessible-finance.com/assets/fonts/Instrument-Serif-OFL.txt</metadata>
  ${fontStyles(id, visual)}
  <rect width="${width}" height="${height}" fill="${palette.canvas}"/>
  <g font-family="Inter, sans-serif">${drawings}</g>
</svg>\n`;
}

module.exports = { createGuideVisual, formatValue, getGuideVisualDimensions };
