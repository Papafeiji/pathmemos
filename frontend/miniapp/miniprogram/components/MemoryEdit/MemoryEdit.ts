import dayjs from '../../lib/dayjs';
import { safeDayjs } from '../../utils/util';
import request, { getErrorMessage, createCancelToken } from '../../utils/request';
import i18nBehavior from '../../behaviors/i18n';
import { i18n } from '../../utils/i18n';

function formatDisplayDate(d: dayjs.Dayjs) {
  return i18n.t('noteEdit.dateFormat', {
    year: d.year(),
    month: d.month() + 1,
    day: d.date(),
  });
}

function formatDisplayTime(timeStr: string) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  let periodKey = '';
  if (hour === 0) {
    periodKey = 'timePicker.period.midnight';
  } else if (hour >= 1 && hour <= 4) {
    periodKey = 'timePicker.period.earlyMorning';
  } else if (hour >= 5 && hour <= 8) {
    periodKey = 'timePicker.period.morning';
  } else if (hour >= 9 && hour <= 11) {
    periodKey = 'timePicker.period.forenoon';
  } else if (hour === 12) {
    periodKey = 'timePicker.period.noon';
  } else if (hour >= 13 && hour <= 18) {
    periodKey = 'timePicker.period.afternoon';
  } else {
    periodKey = 'timePicker.period.evening';
  }
  const period = i18n.t(periodKey);
  const displayHour = hour === 0 ? 12 : (hour <= 12 ? hour : hour - 12);
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${period} ${displayHour}:${displayMinute}`;
}

Component({
  behaviors: [i18nBehavior],
  properties: {
    info: Object,
  },

  data: {
    form: {
      title: '',
      content: '',
      date: dayjs().format('YYYY-MM-DD'),
      time: dayjs().format('HH:mm'),
    } as { title: string; content: string; date: string; time: string },
    formatDate: formatDisplayDate(dayjs()),
    formatTime: formatDisplayTime(dayjs().format('HH:mm')),
    calendarVisible: false,
    timePickerVisible: false,
    isCreate: false,
  },

  observers: {
    info: function (info) {
      if (!info) return;
      const isCreate = !info.id;
      const recordTime = info.recordTime;
      const d = recordTime ? safeDayjs(recordTime) || dayjs() : dayjs();
      const dateStr = d.format('YYYY-MM-DD');
      const timeStr = d.format('HH:mm');
      this._safeSetData({
        form: {
          title: info.diaryAddress || info.title || '',
          content: info.recordText || info.content || '',
          date: dateStr,
          time: timeStr,
        },
        formatDate: formatDisplayDate(d),
        formatTime: formatDisplayTime(timeStr),
        isCreate,
      });
    },
  },

  lifetimes: {
    attached: function () {
      // 新建/无 id 时，若父页面未指定日期，把日期时间重置为当前时刻；
      // 避免 data 初始值只在组件定义时求值一次，导致抽屉多次打开后仍显示页面加载时的时间/格式。
      if (!this.data.info?.id && !this.data.info?.recordTime) {
        const now = dayjs();
        const date = now.format('YYYY-MM-DD');
        const time = now.format('HH:mm');
        (this as any)._safeSetData({
          form: { ...this.data.form, date, time },
          formatDate: formatDisplayDate(now),
          formatTime: formatDisplayTime(time),
        });
      }
    },
    detached: function () {
      (this as any)._isDestroyed = true;
      if ((this as any)._saveCancelToken) {
        try { (this as any)._saveCancelToken.cancel(); } catch {}
        (this as any)._saveCancelToken = null;
      }
    },
  },

  pageLifetimes: {
    hide() {
      // 保存是用户主动发起的写操作，不应在 page hide（包括切后台、系统调用）时取消。
      // saveCancelToken 在 detached / 用户主动取消 / 完成时清理。
      (this as any)._forceSetData({
        calendarVisible: false,
        timePickerVisible: false,
      });
    },
  },

  methods: {
    onLocaleChange() {
      const form = this.data.form || {};
      this._safeSetData({
        formatDate: formatDisplayDate(safeDayjs(form.date) || dayjs()),
        formatTime: formatDisplayTime(form.time || dayjs().format('HH:mm')),
      });
    },

    onTitleInput(e: any) {
      this._safeSetData({ 'form.title': e.detail.value });
    },

    onContentInput(e: any) {
      this._safeSetData({ 'form.content': e.detail.value });
    },

    goMemoryConfig() {
      wx.navigateTo({ url: '/pages/sub/Mcp/Mcp' });
    },

    openCalendar() {
      this._safeSetData({ calendarVisible: true });
    },

    onCalendarConfirm(e: { detail: { value: string } }) {
      const date = e.detail.value;
      this._safeSetData({
        'form.date': date,
        formatDate: formatDisplayDate(safeDayjs(date) || dayjs()),
        calendarVisible: false,
      });
    },

    onCalendarClose() {
      this._safeSetData({ calendarVisible: false });
    },

    openTimePicker() {
      this._safeSetData({ timePickerVisible: true });
    },

    onTimeConfirm(e: { detail: { value: string } }) {
      const time = e.detail.value;
      this._safeSetData({
        'form.time': time,
        formatTime: formatDisplayTime(time),
        timePickerVisible: false,
      });
    },

    onTimeClose() {
      this._safeSetData({ timePickerVisible: false });
    },

    hidden() {
      this.triggerEvent('hidden');
    },

    cancel() {
      if ((this as any)._saveCancelToken) {
        try { (this as any)._saveCancelToken.cancel(); } catch {}
        (this as any)._saveCancelToken = null;
      }
      this.hidden();
    },

    async submit() {
      const self = this as any;
      if (self._isDestroyed || self._isDetached) return;

      const title = (this.data.form.title || '').trim();
      const finalTitle = title;
      if (!finalTitle) {
        wx.showToast({ title: (this as any).$t('memoryEdit.titlePlaceholder'), icon: 'none' });
        return;
      }
      if ([...finalTitle].length > 50) {
        wx.showToast({ title: (this as any).$t('memoryEdit.titleMaxLength'), icon: 'none' });
        return;
      }
      const content = (this.data.form.content || '').trim();
      if ([...content].length > 10000) {
        wx.showToast({ title: (this as any).$t('memoryEdit.contentTooLong'), icon: 'none' });
        return;
      }
      if (!this.data.form.date || !this.data.form.time) {
        wx.showToast({ title: (this as any).$t('memoryEdit.requiredFields'), icon: 'none' });
        return;
      }
      const recordDateTime = safeDayjs([this.data.form.date, this.data.form.time].join(' '));
      if (!recordDateTime) {
        wx.showToast({ title: (this as any).$t('memoryEdit.invalidDateTime'), icon: 'none' });
        return;
      }

      // 按 FP072/FP076：记忆创建为普通业务，不做函数级防重入锁；重复提交由后端兜底。
      self._submitting = true;
      const isCreate = !!this.data.isCreate;
      try {
        if (self._saveCancelToken) {
          try { self._saveCancelToken.cancel(); } catch {}
        }
        self._saveCancelToken = createCancelToken();
        const payload: any = {
          title: finalTitle,
          content,
          recordTime: recordDateTime.toISOString(),
        };
        if (isCreate) {
          await request.post('/diary/details/memory', {
            data: payload,
            cancelToken: self._saveCancelToken,
          }, true);
        } else {
          payload.id = this.data.info.id;
          await request.put('/diary/details/memory', {
            data: payload,
            cancelToken: self._saveCancelToken,
          }, true);
        }
        self._saveCancelToken = null;

        if (self._isDestroyed || self._isDetached) return;
        this.triggerEvent('submit', {
          id: isCreate ? undefined : this.data.info.id,
          title,
          content,
          recordTime: recordDateTime.format('YYYY-MM-DD HH:mm:ss'),
          isCreate,
        });
        this.cancel();
      } catch (error: any) {
        if (!self._isAlive()) return;
        if (error?.message === 'request:abort') return;
        if (!error?._handledByModal) {
          wx.showToast({ title: getErrorMessage(error, (this as any).$t('memoryEdit.saveFail')), icon: 'none' });
        }
      } finally {
        self._saveCancelToken = null;
        self._submitting = false;
      }
    },
  },
});
