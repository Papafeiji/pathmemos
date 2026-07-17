import { logger } from '../../utils/logger';
import { getSystemInfo } from '../../utils/util';
import { i18n } from '../../utils/i18n';

const COLORS = {
  bg: '#F5F2ED',
  cardBg: '#FFFFFF',
  textMain: '#2C2419',
  textSub: '#7A7169',
  textContent: '#8A8179',
  textLight: '#A8A099',
  accent: '#8B6F4E',
  accentLight: '#F5F0E8',
  border: '#E5E0D8',
  white: '#FFFFFF',
  shadow: 'rgba(44, 36, 25, 0.06)',
};

const MAX_CANVAS_H = 8192;
const MAX_TEXT_LEN = 3000;
const MAX_RECORD_COUNT = 50;

export interface ShareRecordImage {
  filePath: string;
}

export interface ShareRecord {
  id: string;
  recordTime: string;
  recordText?: string;
  diaryAddress?: string;
  detailAddr?: string;
  familyMemberUserId?: string;
  familyMemberNickName?: string;
  recordImages?: ShareRecordImage[];
  dotColor?: string;
}

export interface ShareData {
  baseInfo: {
    coverImg?: string;
    dateName?: string;
  };
  headerDate: {
    yearMonth: string;
    day: string;
    weekDay: string;
  };
  tabList: Array<{ userId: string; nickName: string }>;
  activeTabId: string;
  filteredList: ShareRecord[];
  currentUserId: string;
  qrCodeUrl?: string;
}

function rpxToPx(rpx: number, screenWidth: number): number {
  return (rpx * screenWidth) / 750;
}

function loadCanvasImage(canvas: any, url: string, tasks: any[], isAborted?: () => boolean): Promise<any> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const task = wx.downloadFile({
      url,
      success: (res: any) => {
        if (isAborted?.()) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        const img = canvas.createImage();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = res.tempFilePath;
      },
      fail: () => resolve(null),
    });
    tasks.push(task);
  });
}

function loadLocalImage(canvas: any, path: string, isAborted?: () => boolean): Promise<any> {
  return new Promise((resolve) => {
    if (isAborted?.()) {
      resolve(null);
      return;
    }
    const img = canvas.createImage();
    img.onload = () => {
      if (isAborted?.()) {
        resolve(null);
        return;
      }
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number): string[] {
  if (!text) return [];
  const safeText = text.length > MAX_TEXT_LEN ? text.slice(0, MAX_TEXT_LEN) + '...' : text;
  ctx.font = `${fontSize}px sans-serif`;
  const chars = safeText.split('');
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawRoundRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  drawRoundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function drawImageAspectFill(ctx: any, img: any, x: number, y: number, w: number, h: number) {
  if (!img || !img.width || !img.height) return;
  const imgW = img.width;
  const imgH = img.height;
  const scale = Math.max(w / imgW, h / imgH);
  const sW = w / scale;
  const sH = h / scale;
  const sx = (imgW - sW) / 2;
  const sy = (imgH - sH) / 2;
  ctx.drawImage(img, sx, sy, sW, sH, x, y, w, h);
}

function drawImageAspectFit(ctx: any, img: any, x: number, y: number, w: number, h: number) {
  if (!img || !img.width || !img.height) return;
  const imgW = img.width;
  const imgH = img.height;
  const scale = Math.min(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const dx = x + (w - drawW) / 2;
  const dy = y + (h - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

interface RecordLayout {
  height: number;
  addressH: number;
  textLines: string[];
  textH: number;
  imageH: number;
}

interface Layout {
  height: number;
  coverH: number;
  titleH: number;
  tabsH: number;
  records: RecordLayout[];
}

function calcLayout(ctx: any, data: ShareData, innerWidth: number): Layout {
  const coverH = rpxToPx(520, innerWidth);
  const titleH = rpxToPx(132, innerWidth);
  const tabsH = data.tabList.length > 1 ? rpxToPx(96, innerWidth) : 0;
  const timeColW = rpxToPx(80, innerWidth);
  const timeGap = rpxToPx(24, innerWidth);
  const mainX = timeColW + timeGap;
  const mainW = innerWidth - mainX;
  const textSize = rpxToPx(26, innerWidth);
  const textLineH = rpxToPx(46, innerWidth);
  const imgH = rpxToPx(176, innerWidth);
  const singleImgH = rpxToPx(360, innerWidth);
  const imgGap = rpxToPx(12, innerWidth);
  const recordGap = rpxToPx(36, innerWidth);
  const recordTopPadding = rpxToPx(16, innerWidth);
  const addrTextGap = rpxToPx(20, innerWidth);
  const textImgGap = rpxToPx(22, innerWidth);

  const records: RecordLayout[] = data.filteredList.map((item) => {
    let addressH = 0;
    if (item.diaryAddress) {
      addressH = rpxToPx(48, innerWidth);
    }

    const textLines = wrapText(ctx, item.recordText || '', mainW, textSize);
    const textH = textLines.length * textLineH;

    const imgCount = (item.recordImages || []).length;
    let imageH = 0;
    if (imgCount === 1) {
      imageH = singleImgH + textImgGap;
    } else if (imgCount > 1) {
      const rows = Math.ceil(imgCount / 3);
      imageH = rows * imgH + (rows - 1) * imgGap + textImgGap;
    }

    const bodyH = recordTopPadding + (addressH ? addressH + addrTextGap : 0) + textH + imageH;
    return { height: bodyH, addressH, textLines, textH, imageH };
  });

  const recordsH = records.reduce((sum, r) => sum + r.height + recordGap, 0) - (records.length ? recordGap : 0);
  const contentTopMargin = records.length ? rpxToPx(32, innerWidth) : 0;
  const emptyH = records.length ? 0 : rpxToPx(480, innerWidth);
  const footerH = rpxToPx(210, innerWidth);
  const height = coverH + titleH + tabsH + contentTopMargin + recordsH + emptyH + footerH;
  return { height, coverH, titleH, tabsH, records };
}

async function asyncPool<T, R>(concurrency: number, items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const iter = items.entries();
  const workers = Array.from({ length: concurrency }, async () => {
    for (const [i, item] of iter) {
      results[i] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}

async function loadAllImages(canvas: any, data: ShareData, tasks: any[], isAborted?: () => boolean) {
  const coverPromise = loadCanvasImage(canvas, data.baseInfo.coverImg || '', tasks, isAborted);
  const emptyPromise = loadLocalImage(canvas, '/image/empty.png', isAborted);
  const addressIconPromise = loadLocalImage(canvas, '/image/icon_address.png', isAborted);
  const qrCodePromise = loadCanvasImage(canvas, data.qrCodeUrl || '', tasks, isAborted);

  const recordImageUrls: string[] = [];
  data.filteredList.forEach((item) => {
    (item.recordImages || []).forEach((img) => recordImageUrls.push(img.filePath));
  });

  const recordImages = await asyncPool(10, recordImageUrls, (url) => loadCanvasImage(canvas, url, tasks, isAborted));

  const [cover, emptyIcon, addressIcon, qrCode] = await Promise.all([
    coverPromise, emptyPromise, addressIconPromise, qrCodePromise,
  ]);
  if (data.qrCodeUrl && !qrCode) {
    logger.warn('二维码图片加载失败', { url: data.qrCodeUrl });
  }

  const records: any[][] = [];
  let offset = 0;
  data.filteredList.forEach((item) => {
    const count = (item.recordImages || []).length;
    records.push(recordImages.slice(offset, offset + count));
    offset += count;
  });

  return { cover, emptyIcon, addressIcon, qrCode, records };
}

function drawCover(ctx: any, contentX: number, innerWidth: number, y: number, height: number, coverImg: any) {
  const radius = rpxToPx(28, innerWidth);

  if (coverImg) {
    drawRoundRectPath(ctx, contentX, y, innerWidth, height, radius);
    ctx.save();
    ctx.clip();
    drawImageAspectFill(ctx, coverImg, contentX, y, innerWidth, height);
    ctx.restore();
  } else {
    ctx.fillStyle = '#E8E0D6';
    fillRoundRect(ctx, contentX, y, innerWidth, height, radius);
  }

  const grad = ctx.createLinearGradient(contentX, y, contentX, y + height);
  grad.addColorStop(0, 'rgba(0,0,0,0.06)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad;
  fillRoundRect(ctx, contentX, y, innerWidth, height, radius);
}

function drawTitleSection(ctx: any, data: ShareData, contentX: number, innerWidth: number, y: number) {
  const titleSize = rpxToPx(44, innerWidth);
  const subSize = rpxToPx(26, innerWidth);
  const titleY = y + rpxToPx(44, innerWidth);
  const subY = titleY + rpxToPx(58, innerWidth);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const title = data.baseInfo.dateName || i18n.t('noteDetail.shareTitleNoName', {
    yearMonth: data.headerDate.yearMonth,
    day: data.headerDate.day,
    daySuffix: i18n.t('noteDetail.daySuffix'),
  });
  ctx.fillStyle = COLORS.textMain;
  ctx.font = `700 ${titleSize}px sans-serif`;
  ctx.fillText(title, contentX, titleY);

  const fullDate = data.baseInfo.dateName
    ? `${data.headerDate.yearMonth}${data.headerDate.day}${i18n.t('noteDetail.daySuffix')}`
    : '';
  const subtitle = data.baseInfo.dateName
    ? i18n.t('noteDetail.shareSubtitle', { date: fullDate, weekday: data.headerDate.weekDay })
    : data.headerDate.weekDay;
  ctx.fillStyle = COLORS.textSub;
  ctx.font = `400 ${subSize}px sans-serif`;
  ctx.fillText(subtitle, contentX, subY);
}

function drawTabs(ctx: any, data: ShareData, contentX: number, innerWidth: number, y: number) {
  const tabH = rpxToPx(52, innerWidth);
  const gap = rpxToPx(12, innerWidth);
  const pillPaddingH = rpxToPx(22, innerWidth);
  const textSize = rpxToPx(26, innerWidth);
  const tabY = y + rpxToPx(28, innerWidth);

  ctx.font = `500 ${textSize}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  let x = contentX;
  const drawPill = (text: string, active: boolean, pillW: number) => {
    if (active) {
      ctx.fillStyle = COLORS.accentLight;
      fillRoundRect(ctx, x, tabY, pillW, tabH, tabH / 2);
      ctx.fillStyle = COLORS.textMain;
      ctx.font = `600 ${textSize}px sans-serif`;
    } else {
      ctx.fillStyle = COLORS.textSub;
      ctx.font = `500 ${textSize}px sans-serif`;
    }
    ctx.fillText(text, x + pillW / 2, tabY + tabH / 2);
    x += pillW + gap;
  };

  const allText = i18n.t('noteDetail.shareAll');
  const allTextW = ctx.measureText(allText).width;
  drawPill(allText, data.activeTabId === '', allTextW + pillPaddingH * 2);

  data.tabList.forEach((tab) => {
    const name = tab.nickName || '';
    const textW = ctx.measureText(name).width;
    drawPill(name, data.activeTabId === tab.userId, textW + pillPaddingH * 2);
  });
}

function drawRecords(ctx: any, data: ShareData, contentX: number, innerWidth: number, startY: number, layout: Layout, recordImages: any[][], addressIcon: any) {
  const timeColW = rpxToPx(80, innerWidth);
  const timeGap = rpxToPx(24, innerWidth);
  const mainX = contentX + timeColW + timeGap;
  const mainW = innerWidth - timeColW - timeGap;
  const textLineH = rpxToPx(46, innerWidth);
  const recordGap = rpxToPx(36, innerWidth);
  const recordTopPadding = rpxToPx(16, innerWidth);
  const addrSize = rpxToPx(28, innerWidth);
  const textSize = rpxToPx(26, innerWidth);
  const timeSize = rpxToPx(28, innerWidth);
  const familySize = rpxToPx(20, innerWidth);
  const imgH = rpxToPx(176, innerWidth);
  const singleImgH = rpxToPx(360, innerWidth);
  const imgGap = rpxToPx(12, innerWidth);
  const addrIconSize = rpxToPx(22, innerWidth);
  const addrTextGap = rpxToPx(20, innerWidth);
  const textImgGap = rpxToPx(22, innerWidth);

  let y = startY;

  data.filteredList.forEach((item, index) => {
    const recLayout = layout.records[index];
    const recImages = recordImages[index] || [];
    const isLast = index === data.filteredList.length - 1;

    const displayTime = item.recordTime
      ? (item.recordTime.split(' ')[1] || '').slice(0, 5)
      : '';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `600 ${timeSize}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(displayTime, contentX, y + recordTopPadding + rpxToPx(2, innerWidth));

    let mainY = y + recordTopPadding;

    if (item.diaryAddress) {
      let addrX = mainX;
      const iconY = mainY + (addrSize - addrIconSize) / 2;
      if (addressIcon) {
        drawImageAspectFill(ctx, addressIcon, addrX, iconY, addrIconSize, addrIconSize);
      } else {
        ctx.beginPath();
        ctx.arc(addrX + addrIconSize / 2, mainY + addrSize / 2, addrIconSize / 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.textSub;
        ctx.fill();
      }
      addrX += addrIconSize + rpxToPx(8, innerWidth);
      ctx.fillStyle = COLORS.textMain;
      ctx.font = `500 ${addrSize}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(item.diaryAddress, addrX, mainY);

      const showFamilyName = item.familyMemberUserId && item.familyMemberUserId !== data.currentUserId && !!item.familyMemberNickName;
      if (showFamilyName) {
        const addrWidth = ctx.measureText(item.diaryAddress).width;
        ctx.fillStyle = COLORS.textLight;
        ctx.font = `400 ${familySize}px sans-serif`;
        ctx.fillText(item.familyMemberNickName || '', addrX + addrWidth + rpxToPx(12, innerWidth), mainY + (addrSize - familySize) / 2);
      }
      mainY += recLayout.addressH + addrTextGap;
    }

    if (recLayout.textLines.length) {
      ctx.fillStyle = COLORS.textContent;
      ctx.font = `400 ${textSize}px sans-serif`;
      ctx.textBaseline = 'top';
      recLayout.textLines.forEach((line, lineIndex) => {
        ctx.fillText(line, mainX, mainY + lineIndex * textLineH);
      });
      mainY += recLayout.textH;
    }

    if (recImages.length) {
      mainY += textImgGap;
      const count = recImages.length;
      const cols = count === 1 ? 1 : Math.min(count, 3);
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const imgW = count === 1 ? mainW : (mainW - (cols - 1) * imgGap) / cols;
        const ih = count === 1 ? singleImgH : imgH;
        const ix = mainX + col * (imgW + imgGap);
        const iy = mainY + row * (ih + imgGap);
        const img = recImages[i];
        const imgRadius = rpxToPx(12, innerWidth);
        if (img) {
          drawRoundRectPath(ctx, ix, iy, imgW, ih, imgRadius);
          ctx.save();
          ctx.clip();
          drawImageAspectFill(ctx, img, ix, iy, imgW, ih);
          ctx.restore();
        } else {
          ctx.fillStyle = COLORS.border;
          fillRoundRect(ctx, ix, iy, imgW, ih, imgRadius);
        }
      }
    }

    y += recLayout.height + recordGap;

    if (!isLast) {
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const lineY = y - recordGap / 2;
      ctx.moveTo(mainX, lineY);
      ctx.lineTo(contentX + innerWidth, lineY);
      ctx.stroke();
    }
  });

  return y - recordGap;
}

function drawEmpty(ctx: any, contentX: number, innerWidth: number, y: number, emptyIcon: any) {
  const centerX = contentX + innerWidth / 2;
  const iconSize = rpxToPx(200, innerWidth);
  const iconY = y + rpxToPx(120, innerWidth);
  if (emptyIcon) {
    drawImageAspectFit(ctx, emptyIcon, centerX - iconSize / 2, iconY, iconSize, iconSize);
  }
  ctx.fillStyle = COLORS.textMain;
  ctx.font = `600 ${rpxToPx(32, innerWidth)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(i18n.t('noteDetail.shareEmptyTitle'), centerX, iconY + iconSize + rpxToPx(32, innerWidth));
  ctx.fillStyle = COLORS.textSub;
  ctx.font = `${rpxToPx(26, innerWidth)}px sans-serif`;
  ctx.fillText(i18n.t('noteDetail.shareEmptyTip'), centerX, iconY + iconSize + rpxToPx(88, innerWidth));
}

function drawFooter(ctx: any, contentX: number, innerWidth: number, y: number, qrCode: any) {
  const footerPaddingY = rpxToPx(24, innerWidth);
  const qrSize = rpxToPx(132, innerWidth);
  const sloganSize = rpxToPx(28, innerWidth);
  const sloganSubSize = rpxToPx(22, innerWidth);
  const labelSize = rpxToPx(18, innerWidth);
  const sloganLeft = rpxToPx(24, innerWidth);
  const qrRight = rpxToPx(24, innerWidth);
  const dividerY = y;

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, dividerY);
  ctx.lineTo(contentX + innerWidth, dividerY);
  ctx.stroke();

  const contentY = dividerY + footerPaddingY;
  const centerY = contentY + qrSize / 2;
  const lineGap = rpxToPx(40, innerWidth);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.textMain;
  ctx.font = `600 ${sloganSize}px sans-serif`;
  ctx.fillText(i18n.t('noteDetail.shareSlogan'), contentX + sloganLeft, centerY - lineGap / 2);
  ctx.fillStyle = COLORS.textSub;
  ctx.font = `400 ${sloganSubSize}px sans-serif`;
  ctx.fillText(i18n.t('noteDetail.shareSubSlogan'), contentX + sloganLeft, centerY + lineGap / 2);

  const qrCenterX = contentX + innerWidth - qrRight - qrSize / 2;
  const qrCenterY = centerY;
  const qrX = qrCenterX - qrSize / 2;
  const qrY = qrCenterY - qrSize / 2;
  if (qrCode) {
    drawRoundRectPath(ctx, qrX, qrY, qrSize, qrSize, rpxToPx(6, innerWidth));
    ctx.save();
    ctx.clip();
    ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.textLight;
    ctx.font = `${labelSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('noteDetail.qrLabel'), qrCenterX, qrCenterY);
  }
}

function draw(ctx: any, data: ShareData, layout: Layout, width: number, totalHeight: number, images: any) {
  const framePadding = rpxToPx(32, width);
  const cardRadius = rpxToPx(28, width);
  const contentPadding = rpxToPx(24, width);
  const contentX = framePadding + contentPadding;
  const innerWidth = width - framePadding * 2 - contentPadding * 2;
  const cardHeight = layout.height + contentPadding * 2;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, totalHeight);

  ctx.fillStyle = COLORS.shadow;
  drawRoundRectPath(ctx, framePadding + rpxToPx(4, width), framePadding + rpxToPx(6, width), width - framePadding * 2, cardHeight, cardRadius);
  ctx.fill();

  ctx.fillStyle = COLORS.cardBg;
  drawRoundRectPath(ctx, framePadding, framePadding, width - framePadding * 2, cardHeight, cardRadius);
  ctx.fill();

  let y = framePadding + contentPadding;
  drawCover(ctx, contentX, innerWidth, y, layout.coverH, images.cover);
  y += layout.coverH;

  drawTitleSection(ctx, data, contentX, innerWidth, y);
  y += layout.titleH;

  if (layout.tabsH > 0) {
    drawTabs(ctx, data, contentX, innerWidth, y);
    y += layout.tabsH;
  }

  if (data.filteredList.length === 0) {
    drawEmpty(ctx, contentX, innerWidth, y, images.emptyIcon);
    y += rpxToPx(480, innerWidth);
  } else {
    y += rpxToPx(48, innerWidth);
    y = drawRecords(ctx, data, contentX, innerWidth, y, layout, images.records, images.addressIcon);
  }

  y += rpxToPx(40, innerWidth);
  drawFooter(ctx, contentX, innerWidth, y, images.qrCode);
}

export function generateShareImage(page: any, data: ShareData, abortTasks: any[]): Promise<string> {
  const limitedData: ShareData = {
    ...data,
    filteredList: data.filteredList.slice(0, MAX_RECORD_COUNT),
  };
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery().in(page);
    query.select('#shareCanvas').fields({ node: true, size: true }).exec(async (res: any) => {
      if (page._isDestroyed || page._isHidden) {
        reject(new Error('page hidden or destroyed'));
        return;
      }
      if (!res || !res[0] || !res[0].node) {
        reject(new Error('canvas not ready'));
        return;
      }
      try {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const sysInfo = getSystemInfo();
        const logicalWidth = sysInfo.screenWidth;
        const dpr = sysInfo.pixelRatio || 1;
        const framePadding = rpxToPx(32, logicalWidth);
        const contentPadding = rpxToPx(24, logicalWidth);
        const innerWidth = logicalWidth - framePadding * 2 - contentPadding * 2;

        const layout = calcLayout(ctx, limitedData, innerWidth);
        const cardHeight = layout.height + contentPadding * 2;
        const totalHeight = cardHeight + framePadding * 2;
        let pixelRatio = dpr;
        if (totalHeight * pixelRatio > MAX_CANVAS_H) {
          pixelRatio = Math.max(0.5, MAX_CANVAS_H / totalHeight);
        }
        if (logicalWidth * pixelRatio > MAX_CANVAS_H) {
          pixelRatio = Math.max(0.5, MAX_CANVAS_H / logicalWidth);
        }

        canvas.width = Math.floor(logicalWidth * pixelRatio);
        canvas.height = Math.floor(totalHeight * pixelRatio);
        ctx.scale(pixelRatio, pixelRatio);

        const isAborted = () => page._isDestroyed || page._isHidden;
        const images = await loadAllImages(canvas, limitedData, abortTasks, isAborted);
        if (page._isDestroyed || page._isHidden) {
          reject(new Error('page hidden or destroyed'));
          return;
        }
        draw(ctx, limitedData, layout, logicalWidth, totalHeight, images);

        // canvasToTempFilePath 一旦开始无法取消，进入前再次检查页面状态，避免切后台后仍导出图片。
        if (page._isDestroyed || page._isHidden) {
          reject(new Error('page hidden or destroyed'));
          return;
        }
        wx.canvasToTempFilePath({
          canvas,
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          destWidth: canvas.width,
          destHeight: canvas.height,
          fileType: 'jpg',
          quality: 1,
          success: (res2: any) => {
            if (isAborted()) {
              reject(new Error('page hidden or destroyed'));
              return;
            }
            resolve(res2.tempFilePath);
          },
          fail: reject,
        });
      } catch (e) {
        logger.error('generateShareImage error', e);
        reject(e);
      }
    });
  });
}
