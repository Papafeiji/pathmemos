
import dayjs from '../../lib/dayjs';
import { safeDayjs, getSystemInfo } from '../../utils/util';
import request, { getBaseInfo, createCancelToken, resetLoading } from '../../utils/request';
import { logger } from '../../utils/logger';
import themeBehavior from '../../behaviors/theme';
import i18nBehavior from '../../behaviors/i18n';
import { i18n } from '../../utils/i18n';
import { generateShareImage, ShareData } from './shareCanvas';

function extractFamilyId(virtualID: string): string {
  const m = virtualID?.match(/^family:([^:]+):date:/);
  return m ? m[1] : '';
}

const PAGE_SIZE = 20;
const MAX_IMAGE_LIST = 50;
const MAX_FULL_LIST = 200;
const MAX_TAB_LIST = 50;

const DAY_COLORS = [
  '#8BC5E5',
  '#E58B9A',
  '#8BE5B5',
  '#E5C38B',
  '#B58CE5',
  '#8BB8E5',
  '#E58BC5',
  '#8BE5D6',
];

function _getDayColor(recordTime: string): string {
  if (!recordTime) return DAY_COLORS[0];
  const day = recordTime.split(' ')[0] || '';
  let hash = 0;
  for (let i = 0; i < day.length; i++) {
    hash = day.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DAY_COLORS.length;
  return DAY_COLORS[index];
}

function _normalizeEntry(entry: any): any {
  if (!entry) return entry;
  const recordImages = (entry.recordImages || []).map((img: any) => ({
    filePath: img.filePath,
    type: 0,
    id: img.id,
    createdAt: img.createdAt || 0,
  }));
  return {
    ...entry,
    dotColor: entry.color || _getDayColor(entry.recordTime),
    recordImages,
  };
}

Page({
  behaviors: [themeBehavior, i18nBehavior],
  data: {
    isLogin: false,
    baseInfo: {
      id: '',
      coverImg: '',
      coverImage: '',
      dateName: '',
      recordDate: '',
    } as {
      id: string;
      coverImg: string;
      coverImage: string;
      dateName: string;
      recordDate: string;
    },
    filteredList: [] as any[],
    tabList: [] as { userId: string; nickName: string; avatarUrl: string }[],
    activeTabId: '',
    imageList: [] as any[],
    nowInfo: {},
    memoryEditInfo: {},
    memoryCreateInfo: {},
    showCircleDrawer: false,
    showEditDrawer: false,
    showMemoryEditDrawer: false,
    showMemoryCreateDrawer: false,
    isScrollTop: true,
    showAIDrawer: false,
    showSubscribePrompt: false,
    isEmpty: false,
    _loading: false,
    _reloading: false,
    hasMore: true,
    page: 1,
    openAutoRecorded: false,
    currentUserId: '',
    headerDate: {
      yearMonth: '',
      day: '',
      weekDay: '',
    } as { yearMonth: string; day: string; weekDay: string },
    navStyle: {
      navHeight: 0,
      contentHeight: 0,
      statusBarHeight: 0,
      backStyle: '',
      innerStyle: '',
      shareFloatStyle: '',
    },
    _generatingShare: false,
    qrCodeUrl: '',
    _generatingQR: false,
  },

  _fullList: [] as any[],
  _memories: [] as any[],
  _cancelToken: null as any,
  _loginCancelToken: null as any,
  _qrCancelToken: null as any,
  _qrPromise: null as any,
  _isDestroyed: false,
  _isHidden: false,
  _coverPollTimer: null as any,
  _coverPollFallbackTimer: null as any,
  _needReloadOnShow: false,

  updateNavTitle() {
    wx.setNavigationBarTitle({ title: (this as any).$t('noteDetail.title') });
  },

  async onLoad(option) {
    this._isDestroyed = false;
    this._initSystemInfo();
    try {
      const parsed = JSON.parse(decodeURIComponent(option.baseInfo || '{}'));
      const recordDate = parsed.recordDate || '';
      if (!recordDate) {
        throw new Error('recordDate is required');
      }
      const d = safeDayjs(recordDate);
      if (!d) {
        throw new Error('invalid recordDate');
      }
      const headerDate = {
        yearMonth: i18n.t('noteDetail.yearMonthFormat', {
          year: d.year(),
          month: d.month() + 1,
        }),
        day: d.format('DD'),
        weekDay: i18n.t(`noteDetail.weekday${d.day()}`),
      };
      (this as any)._safeSetData({
        baseInfo: {
          id: parsed.id || '',
          coverImg: parsed.coverImg || '',
          coverImage: parsed.coverImage || '',
          dateName: parsed.dateName || '',
          recordDate,
        },
        headerDate,
      });
    } catch {
      if (this._isDestroyed) return;
      wx.showToast({ title: (this as any).$t('noteDetail.paramError'), icon: 'none' });
      if (getCurrentPages().length <= 1) {
        wx.redirectTo({ url: '/pages/index/index' });
      } else {
        wx.navigateBack();
      }
      return;
    }
    const isLogin = request.isLogin();
    if (this._isDestroyed) return;
    this._safeSetData({ isLogin });
    if (!isLogin) {
      await this._doLogin();
      if (this._isDestroyed) return;
    }
    this._safeSetData({ currentUserId: (getBaseInfo() || {}).userId || '' });
    if (this._isDestroyed) return;
    this.fetch();
  },

  onHide() {
    this._isHidden = true;
    // 切后台时关闭非编辑类 UI，保留 AI 抽屉以便从其他页面返回后继续对话；
    // 编辑抽屉（showEditDrawer/showMemoryEditDrawer/showMemoryCreateDrawer/showCircleDrawer）
    // 需要保留，因为 wx.chooseLocation / wx.chooseMedia 等系统调用也会触发 onHide，返回后应继续编辑。
    // AI 抽屉的 SSE 连接由 onPageHide() 独立清理，不需要销毁组件本身。
    // _generatingShare/_generatingQR/_reloading 不要在 onHide 复位，避免返回后可重复触发
    // 分享/二维码生成/reload，它们仅在生成完成/失败或 onUnload 时复位。
    (this as any)._forceSetData({
      showSubscribePrompt: false,
      _loading: false,
    });
    try {
      (this.selectComponent('#aiDrawer') as any)?.onPageHide?.();
    } catch {}
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }
    // request.login 是写操作（创建 session），不得在 onHide 中取消；页面真正销毁（onUnload）
    // 时再清理，避免系统调用触发 onHide 后返回时登录状态丢失（AGENTS.md §3.4）。
    if (this._qrCancelToken) {
      try { this._qrCancelToken.cancel(); } catch {}
      this._qrCancelToken = null;
      // 同时清空在途 Promise：否则其 finally 因 token 已置空而无法清 _qrPromise，
      // 残留旧 Promise 使后续 _ensureQRCode 永远返回空结果。
      this._qrPromise = null;
    }
    // 分享图生成不要在 onHide 中止，避免返回后 _generatingShare 处于 true 而按钮永久锁定；
    // 仅在 onUnload 中中止并复位状态。
    if ((this as any)._scrollThrottleTimer) {
      clearTimeout((this as any)._scrollThrottleTimer);
      (this as any)._scrollThrottleTimer = null;
    }
    try { wx.hideLoading(); } catch {}
    resetLoading();
  },

  onUnload() {
    this._isHidden = true;
    // 先执行必须持久化的 UI 清理，再标记销毁；否则 _forceSetData 会因 _isDestroyed 直接返回。
    (this as any)._forceSetData({
      showAIDrawer: false,
      showEditDrawer: false,
      showMemoryEditDrawer: false,
      showMemoryCreateDrawer: false,
      showCircleDrawer: false,
      showSubscribePrompt: false,
      _loading: false,
      _reloading: false,
      _generatingShare: false,
      _generatingQR: false,
    });
    this._isDestroyed = true;
    (this as any)._loggingIn = false;
    if (this._coverPollTimer) {
      clearInterval(this._coverPollTimer);
      this._coverPollTimer = null;
    }
    if ((this as any)._coverPollFallbackTimer) {
      clearTimeout((this as any)._coverPollFallbackTimer);
      (this as any)._coverPollFallbackTimer = null;
    }
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }
    if (this._loginCancelToken) {
      try { this._loginCancelToken.cancel(); } catch {}
      this._loginCancelToken = null;
    }
    if (this._qrCancelToken) {
      try { this._qrCancelToken.cancel(); } catch {}
      this._qrCancelToken = null;
      // 同时清空在途 Promise：否则其 finally 因 token 已置空而无法清 _qrPromise，
      // 残留旧 Promise 使后续 _ensureQRCode 永远返回空结果。
      this._qrPromise = null;
    }
    if ((this as any)._scrollThrottleTimer) {
      clearTimeout((this as any)._scrollThrottleTimer);
      (this as any)._scrollThrottleTimer = null;
    }
    try { wx.hideLoading(); } catch {}
    resetLoading();
    (this as any).unsubscribeTheme?.();
  },

  _setReloading(reloading: boolean) {
    this._safeSetData({ _reloading: reloading });
  },

  async onShow() {
    if (this._isDestroyed) return;
    this._isHidden = false;
    (this as any)._applyPendingSetData();
    // 切后台期间子组件触发的数据变更（设置封面、删除日记/记忆等）无法在 hidden 态刷新，
    // 返回前台后统一补一次 reload，保证不展示 stale UI（AGENTS.md §3.6）。
    if ((this as any)._needReloadOnShow) {
      const reloaded = await this.reload();
      if (reloaded) {
        (this as any)._needReloadOnShow = false;
      }
    }
    const app = getApp() as any;
    const enabled = app.globalData.openAutoRecorded === true;
    if (this.data.openAutoRecorded !== enabled) {
      this._safeSetData({ openAutoRecorded: enabled });
    }
    this._ensureQRCode();
  },

  onAutoRecordChange(e: any) {
    const next = e.detail?.openAutoRecorded === true;
    (getApp() as any).globalData.openAutoRecorded = next;
    this._safeSetData({ openAutoRecorded: next });
  },

  onSubscribeprompt(e: any) {
    if (e.detail?.visible) {
      this._safeSetData({ showSubscribePrompt: true });
    }
  },

  onSubscribeConfirm() {
    this._safeSetData({ showSubscribePrompt: false });
  },

  onSubscribeCancel() {
    this._safeSetData({ showSubscribePrompt: false });
  },

  async fetch(targetPage?: number, options?: { skipReloadGuard?: boolean }) {
    if (this._isDestroyed || this._isHidden) return;
    if (!this.data.isLogin) {
      await this._doLogin();
      if (this._isDestroyed) return;
      if (!this.data.isLogin) {
        this._safeSetData({ isEmpty: true, filteredList: [], imageList: [] });
        return;
      }
    }
    if (this._isDestroyed) return;
    if (this.data._loading || (this.data._reloading && !options?.skipReloadGuard)) return;

    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }

    const cancelToken = createCancelToken();
    this._cancelToken = cancelToken;

    const page = targetPage !== undefined ? targetPage : this.data.page;
    const didShowLoading = this._fullList.length === 0;
    this._safeSetData({ page, _loading: true });
    if (didShowLoading && !this._isHidden) {
      wx.showLoading({ title: (this as any).$t('common.loading'), mask: true });
    }

    try {
      const res = await request.get('/diary/details', {
        params: {
          diaryId: this.data.baseInfo.id,
          page,
          size: PAGE_SIZE,
        },
        cancelToken,
      }, true);

      this._cancelToken = null;

      const allData = (res.data || []).map(_normalizeEntry);
      const serverCoverImg = res.extra?.coverImg;
      const serverCoverImage = res.extra?.coverImage;
      const extraMemories = (res.extra?.memories || []).map(_normalizeEntry);
      const isFirstPage = page === 1;

      // 只要后端明确返回了 coverImg/coverImage（含空字符串），就按后端结果覆盖本地，避免展示 stale 封面。
      if (typeof serverCoverImg === 'string' || typeof serverCoverImage === 'string') {
        this._safeSetData({
          'baseInfo.coverImg': typeof serverCoverImg === 'string' ? serverCoverImg : this.data.baseInfo.coverImg,
          'baseInfo.coverImage': typeof serverCoverImage === 'string' ? serverCoverImage : this.data.baseInfo.coverImage,
        });
      }

      if (!allData.length && !extraMemories.length && isFirstPage) {
        this._safeSetData({ isEmpty: true, filteredList: [], tabList: [], imageList: [], _loading: false, hasMore: false });
        if (didShowLoading && !this._isDestroyed && !this._isHidden) wx.hideLoading();
        return;
      }

      if (isFirstPage) {
        this._fullList = allData;
      } else {
        this._fullList.push(...allData);
      }

      this._memories = extraMemories;

      let hasMore = allData.length === PAGE_SIZE;
      if (this._fullList.length > MAX_FULL_LIST) {
        this._fullList = this._fullList.slice(0, MAX_FULL_LIST);
        hasMore = false;
      }


      this._refreshFromFullList();


      this._safeSetData({ _loading: false, hasMore });
      if (didShowLoading && !this._isDestroyed && !this._isHidden) wx.hideLoading();
    } catch (e: any) {
      if (e?.message === 'request:abort') {
        this._safeSetData({ _loading: false });
        if (didShowLoading && !this._isDestroyed && !this._isHidden) wx.hideLoading();
        return;
      }
      if (this._isDestroyed || this._isHidden) {
        if (didShowLoading) wx.hideLoading();
        return;
      }
      wx.showToast({ title: (this as any).$t('noteDetail.loadFail'), icon: 'none' });
      // 请求失败回退页码，避免下次 loadMore 跳过当前页（page 在请求前已被置为目标页）。
      this._safeSetData({ _loading: false, page: Math.max(1, page - 1) });
      if (didShowLoading) wx.hideLoading();
    }
  },

  loadMore() {
    if (this.data._loading || this.data._reloading || !this.data.hasMore) return;
    this.fetch(this.data.page + 1);
  },

  _initSystemInfo() {
    const sysInfo = getSystemInfo();
    const menuRect = sysInfo.capsuleInfo || wx.getMenuButtonBoundingClientRect() || {};

    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const mbTop = menuRect.top || statusBarHeight + 6;
    const mbHeight = menuRect.height || 32;
    const mbLeft = menuRect.left || sysInfo.screenWidth - 100;
    const mbRight = menuRect.right || sysInfo.screenWidth - 7;
    const navHeight = (mbTop - statusBarHeight) * 2 + mbHeight;
    const contentHeight = navHeight - statusBarHeight;
    const buttonSize = mbHeight;
    const buttonTop = mbTop - statusBarHeight;
    const buttonRight = sysInfo.screenWidth - mbRight;
    const shareHeight = (56 * sysInfo.screenWidth) / 750;
    const shareFloatTop = mbTop + (mbHeight - shareHeight) / 2;
    const shareFloatRight = sysInfo.screenWidth - mbLeft + (16 * sysInfo.screenWidth) / 750;
    this._safeSetData({
      navStyle: {
        navHeight,
        contentHeight,
        statusBarHeight,
        backStyle: `width:${buttonSize}px;height:${buttonSize}px;margin-top:${buttonTop}px`,
        innerStyle: `height:${contentHeight}px;padding-right:${buttonRight}px`,
        shareFloatStyle: `top:${shareFloatTop}px;right:${shareFloatRight}px;height:${shareHeight}px;`,
      },
    });
  },

  bindCircle() {
    this._safeSetData({ showCircleDrawer: true });
  },

  hiddenCircleDrawer() {
    this._safeSetData({ showCircleDrawer: false });
  },

  bindEdit(e: any) {
    const info = e.detail;
    if (info.familyMemberUserId !== this.data.currentUserId) {
      wx.showToast({ title: (this as any).$t('noteDetail.editOthersFail'), icon: 'none' });
      return;
    }
    this._safeSetData({ showEditDrawer: true, nowInfo: info });
  },

  hiddenEditDrawer() {
    this._safeSetData({ showEditDrawer: false });
  },

  bindMemoryEdit(e: any) {
    const info = e.detail;
    this._safeSetData({ showMemoryEditDrawer: true, memoryEditInfo: info });
  },

  hiddenMemoryEditDrawer() {
    this._safeSetData({ showMemoryEditDrawer: false });
  },

  bindMemoryDel(e: any) {
    if (this._isDestroyed) return;
    const id = e.detail?.id;
    if (!id) {
      if (this._isHidden) {
        (this as any)._needReloadOnShow = true;
      } else {
        this.reload();
      }
      return;
    }
    const idx = this._memories.findIndex((item: any) => item.id === id);
    if (idx < 0) {
      if (this._isHidden) {
        (this as any)._needReloadOnShow = true;
      } else {
        this.reload();
      }
      return;
    }
    this._memories.splice(idx, 1);
    this._refreshFromFullList();
    // 记忆变更后同步服务端状态，并通知首页需要刷新（AGENTS.md §3.8）。
    (getApp() as any).globalData._needRefreshIndexList = true;
    if (this._isHidden) {
      (this as any)._needReloadOnShow = true;
      return;
    }
    this.reload();
  },

  onMemoryEditSubmit(e: any) {
    if (this._isDestroyed) return;
    const { id, title, content, recordTime } = e.detail || {};
    if (!id) return;
    const memIdx = this._memories.findIndex((item: any) => item.id === id);
    if (memIdx >= 0) {
      this._memories[memIdx] = {
        ...this._memories[memIdx],
        diaryAddress: title,
        recordText: content,
        recordTime: recordTime || this._memories[memIdx].recordTime,
      };
      this._refreshFromFullList();
      // 记忆变更后同步服务端状态，并通知首页需要刷新（AGENTS.md §3.8）。
      (getApp() as any).globalData._needRefreshIndexList = true;
      if (this._isHidden) {
        (this as any)._needReloadOnShow = true;
        return;
      }
      this.reload();
    }
  },

  doShowMemoryCreateDrawer() {
    const d = safeDayjs(this.data.baseInfo.recordDate) || dayjs();
    const now = dayjs();
    this._safeSetData({
      showMemoryCreateDrawer: true,
      memoryCreateInfo: {
        recordTime: `${d.format('YYYY-MM-DD')} ${now.format('HH:mm')}:00`,
      },
    });
  },

  hiddenMemoryCreateDrawer() {
    this._safeSetData({ showMemoryCreateDrawer: false });
  },

  onMemoryCreateSubmit() {
    if (this._isDestroyed) return;
    (getApp() as any).globalData._needRefreshIndexList = true;
    if (this._isHidden) {
      (this as any)._needReloadOnShow = true;
      return;
    }
    this.reload();
  },

  setCoverImg() {
    if (this._isDestroyed) return;
    (getApp() as any).globalData._needRefreshIndexList = true;
    if (this._isHidden) {
      (this as any)._needReloadOnShow = true;
      return;
    }
    this.reload();
  },

  scroll(e: any) {
    if ((this as any)._scrollThrottleTimer) return;
    (this as any)._scrollThrottleTimer = setTimeout(() => {
      (this as any)._scrollThrottleTimer = null;
    }, 16);
    if (this._isDestroyed) return;
    const { scrollTop } = e.detail;
    const isScrollTop = scrollTop < 10;
    if (this.data.isScrollTop !== isScrollTop) {
      this._safeSetData({ isScrollTop });
    }
  },

  scrollToUpper() {
    this._safeSetData({ isScrollTop: true });
  },

  bindDel() {
    if (this._isDestroyed) return;
    (getApp() as any).globalData._needRefreshIndexList = true;
    if (this._isHidden) {
      (this as any)._needReloadOnShow = true;
      return;
    }
    this.reload();
  },

  async reload(): Promise<boolean> {
    if (this.data._reloading || this._isHidden) return false;
    this._setReloading(true);
    this._fullList = [];
    this._memories = [];
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }
    if (this._qrCancelToken) {
      try { this._qrCancelToken.cancel(); } catch {}
      this._qrCancelToken = null;
      // 同时清空在途 Promise：否则其 finally 因 token 已置空而无法清 _qrPromise，
      // 残留旧 Promise 使后续 _ensureQRCode 永远返回空结果。
      this._qrPromise = null;
    }
    this._safeSetData({ filteredList: [], imageList: [], isEmpty: false, _loading: false, page: 1, hasMore: true });
    let ok = false;
    try {
      await this.fetch(undefined, { skipReloadGuard: true });
      ok = !(this as any)._isDestroyed && !(this as any)._isHidden;
    } catch (e) {
      logger.warn('NoteDetail reload failed', e);
    } finally {
      this._setReloading(false);
    }
    return ok;
  },

  async reloadAfterEdit() {
    if (this._isDestroyed) return;
    (getApp() as any).globalData._needRefreshIndexList = true;
    if (this._isHidden) {
      (this as any)._needReloadOnShow = true;
      return;
    }
    const ok = await this.reload();
    if (!ok) return;
    this._startCoverPolling();
    // 存待轮询数据，首页 onShow 时直接启动封面轮询
    const recordDate = this.data.baseInfo.recordDate;
    const cardID = this.data.baseInfo.id;
    (getApp() as any).globalData._pendingCoverPoll = { recordDate, cardID };
    // 10s 兜底清理：用户可能不返回首页（切后台/杀进程/跳其他页）。
    // F4-11：句柄必须保存并在二次编辑/销毁时先清掉旧定时器，否则旧句柄到期会
    // 误删新编辑设置的 _pendingCoverPoll（同 recordDate 场景）。
    if ((this as any)._coverPollFallbackTimer) {
      clearTimeout((this as any)._coverPollFallbackTimer);
      (this as any)._coverPollFallbackTimer = null;
    }
    (this as any)._coverPollFallbackTimer = setTimeout(() => {
      (this as any)._coverPollFallbackTimer = null;
      const p = (getApp() as any).globalData._pendingCoverPoll;
      if (p && p.recordDate === recordDate) {
        delete (getApp() as any).globalData._pendingCoverPoll;
      }
    }, 10000);
  },

  _startCoverPolling(this: any) {
    const baseInfo = this.data.baseInfo;
    if (!baseInfo?.id || !baseInfo?.recordDate) return;
    const familyId = extractFamilyId(baseInfo.id);
    const recordDate = baseInfo.recordDate;
    const initialCover = baseInfo.coverImg;
    let polls = 0;
    if (this._coverPollTimer) clearTimeout(this._coverPollTimer);
    // R2-F14：setTimeout 链式调度，弱网不并发叠加。
    const tick = async () => {
      if (++polls > 12 || this._isDestroyed || this._isHidden) {
        this._coverPollTimer = null;
        return;
      }
      try {
        // R3：封面轮询属后台请求，偶发 401 不踢登录态（由 catch 静默处理）。
        const res: any = await request.get('/diary/cover-url', { params: { familyId, recordDate } }, true, true);
        const newCover = res?.data?.coverImg;
        // R2-F11：封面被清空（空串）同样视为变更，提前停止轮询。
        if (newCover !== undefined && newCover !== initialCover) {
          this._safeSetData({ 'baseInfo.coverImg': newCover });
          (getApp() as any).globalData._needRefreshIndexList = true;
          this._coverPollTimer = null;
          return;
        }
      } catch { /* poll failure is tolerated */ }
      this._coverPollTimer = setTimeout(tick, 500);
    };
    this._coverPollTimer = setTimeout(tick, 500);

  },

  _filterListByTab(list: any[], activeTabId: string): any[] {
    if (!activeTabId) return list;
    return list.filter((item: any) => item.familyMemberUserId === activeTabId);
  },

  bindTabChange(e: any) {
    const userId = e.currentTarget.dataset.userid || '';
    // 与 _refreshFromFullList 共用合并视图：否则切换任意 tab 后记忆条目从时间线消失。
    const filteredList = this._filterListByTab(this._mergedFullList(), userId);
    (this as any)._safeSetData({ activeTabId: userId });
    this._chunkSetFilteredList(filteredList);
  },

  _mergedFullList(): any[] {
    let fullList = this._fullList || [];
    const memories = this._memories || [];
    if (memories.length) {
      fullList = [...fullList, ...memories].sort((a: any, b: any) => {
        const ta = a.recordTime || '';
        const tb = b.recordTime || '';
        if (ta !== tb) return ta.localeCompare(tb);
        return (a.source === 'memory' ? 1 : 0) - (b.source === 'memory' ? 1 : 0);
      });
    }
    return fullList;
  },

  _chunkSetFilteredList(list: any[]) {
    // 首片整替换（截断旧数组、天然处理列表缩短），后续分片增量追加；
    // 单次 setData 不超过 50 条（AGENTS.md §5.5 / 5.4-L018）。
    const CHUNK = 50;
    (this as any)._safeSetData({ filteredList: list.slice(0, CHUNK) });
    for (let i = CHUNK; i < list.length; i += CHUNK) {
      const patch: any = {};
      const end = Math.min(i + CHUNK, list.length);
      for (let j = i; j < end; j++) {
        patch[`filteredList[${j}]`] = list[j];
      }
      (this as any)._safeSetData(patch);
    }
  },

  _refreshFromFullList(): any[] {
    const fullList = this._mergedFullList();

    if (!fullList.length) {
      this._safeSetData({
        isEmpty: true,
        filteredList: [],
        tabList: [],
        imageList: [] as any,
        activeTabId: '',
      });
      return [];
    }

    const userMap = new Map<string, { userId: string; nickName: string; avatarUrl: string }>();
    fullList.forEach((item: any) => {
      const uid = item.familyMemberUserId;
      if (uid && !userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid,
          nickName: item.familyMemberNickName || '',
          avatarUrl: item.familyMemberAvatarUrl || '',
        });
      }
    });
    const tabList = Array.from(userMap.values());

    let activeTabId = this.data.activeTabId || '';
    if (activeTabId && !tabList.some((tab) => tab.userId === activeTabId)) {
      activeTabId = '';
    }

    const allImages: any[] = [];
    fullList.forEach((item: { recordImages: any[] }) => {
      (item.recordImages || []).forEach((img) => {
        allImages.push({ ...img, __ts: safeDayjs(img.createdAt)?.valueOf() || 0 });
      });
    });
    allImages.sort((a: any, b: any) => b.__ts - a.__ts);

    const userFilteredList = this._filterListByTab(fullList, activeTabId);

    this._safeSetData({
      tabList: tabList.slice(0, MAX_TAB_LIST),
      activeTabId,
      imageList: allImages.slice(0, MAX_IMAGE_LIST),
      isEmpty: false,
    });
    this._chunkSetFilteredList(userFilteredList);
    return allImages;
  },

  doShowEditDrawer() {
    const d = safeDayjs(this.data.baseInfo.recordDate) || dayjs();
    const now = dayjs();
    this._safeSetData({
      showEditDrawer: true,
      nowInfo: {
        date: d.format('YYYY-MM-DD'),
        time: now.format('HH:mm'),
      },
    });
  },

  doShowAIDrawer() {
    this._safeSetData({ showAIDrawer: true });
  },

  async _doLogin() {
    if ((this as any)._loggingIn) return;
    (this as any)._loggingIn = true;

    wx.showLoading({ title: (this as any).$t('noteDetail.loggingIn'), mask: true });
    try {
      // 登录是写操作，使用独立的 cancel token，避免 onHide 取消读请求时连带中断登录。
      if (this._loginCancelToken) {
        try { this._loginCancelToken.cancel(); } catch {}
      }
      const cancelToken = createCancelToken();
      this._loginCancelToken = cancelToken;
      await request.login(cancelToken);
      this._loginCancelToken = null;
      if (this._isDestroyed || this._isHidden) return;
      this._safeSetData({ isLogin: true });
    } catch (e: any) {
      if (this._isDestroyed || this._isHidden) return;
      const msg = e?.data?.msg || e?.message || (this as any).$t('noteDetail.loginFail');
      wx.showToast({ title: msg, icon: 'none', duration: 2000 });
      this._safeSetData({ isEmpty: true, imageList: [] });
    } finally {
      try { wx.hideLoading(); } catch {}
      (this as any)._loggingIn = false;
    }
  },

  _ensureQRCode() {
    if (this._isDestroyed || this._isHidden || this.data.qrCodeUrl || !this.data.isLogin) return;
    // F4-10：生成进行中时复用同一个 in-flight Promise，避免分享点击等重复调用
    // 因 _generatingQR 早退而误报"二维码未生成"。
    if (this._qrPromise) return this._qrPromise;
    if (this._qrCancelToken) {
      try { this._qrCancelToken.cancel(); } catch {}
    }
    const cancelToken = createCancelToken();
    this._qrCancelToken = cancelToken;
    this._safeSetData({ _generatingQR: true });
    const promise = (async () => {
      try {
        const qrRes = await request.post('/invite/qrcode', { data: { raw: true }, cancelToken });
        if (this._isDestroyed) return;
        const url = qrRes.data?.url || '';
        if (url) {
          this._safeSetData({ qrCodeUrl: url });
        }
      } catch (qrErr: any) {
        if (qrErr?.message === 'request:abort') return;
        logger.warn('预生成二维码失败', qrErr);
      } finally {
        this._safeSetData({ _generatingQR: false });
        // 仅当仍是最新一次生成（cancelToken 未被新调用替换）时清理句柄，
        // 避免新生成的 Promise 被旧任务的 finally 误清。
        if (this._qrCancelToken === cancelToken) {
          this._qrCancelToken = null;
          this._qrPromise = null;
        }
      }
    })();
    this._qrPromise = promise;
    return promise;
  },

  goBack() {
    if (getCurrentPages().length <= 1) {
      wx.redirectTo({ url: '/pages/index/index' });
    } else {
      wx.navigateBack();
    }
  },

  async onShareMoment() {
    if (this._isDestroyed || this.data._generatingShare) return;
    this._safeSetData({ _generatingShare: true });
    if (!this._isHidden) {
      wx.showLoading({ title: (this as any).$t('noteDetail.generating'), mask: true });
    }
    try {
      let qrCodeUrl = this.data.qrCodeUrl || '';
      if (!qrCodeUrl) {
        await this._ensureQRCode();
        if (this._isDestroyed || this._isHidden) {
          wx.hideLoading();
          return;
        }
        qrCodeUrl = this.data.qrCodeUrl || '';
      }
      if (!qrCodeUrl) {
        if (!this._isDestroyed && !this._isHidden) {
          wx.hideLoading();
          wx.showToast({ title: (this as any).$t('noteDetail.qrNotGenerated'), icon: 'none' });
        }
        this._safeSetData({ _generatingShare: false });
        return;
      }
      const shareData: ShareData = {
        baseInfo: this.data.baseInfo,
        headerDate: this.data.headerDate,
        tabList: this.data.tabList,
        activeTabId: this.data.activeTabId,
        filteredList: this.data.filteredList,
        currentUserId: this.data.currentUserId,
        qrCodeUrl,
      };
      const tempPath = await generateShareImage(this, shareData);
      if (this._isDestroyed || this._isHidden) {
        wx.hideLoading();
        return;
      }
      wx.hideLoading();
      wx.showShareImageMenu({
        path: tempPath,
        success: () => {},
        fail: (err: any) => {
          if (err?.errMsg?.includes('cancel')) return;
          wx.showToast({ title: (this as any).$t('noteDetail.shareFail'), icon: 'none' });
        },
      });
    } catch (e) {
      if (this._isDestroyed || this._isHidden) return;
      wx.hideLoading();
      logger.error('生成分享图失败', e);
      wx.showToast({ title: (this as any).$t('noteDetail.generateFail'), icon: 'none' });
    } finally {
      this._safeSetData({ _generatingShare: false });
    }
  },

  hiddenAIDrawer() {
    this._safeSetData({ showAIDrawer: false });
  },
});
