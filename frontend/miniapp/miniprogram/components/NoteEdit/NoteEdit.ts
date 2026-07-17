
import dayjs from 'dayjs';
import { safeDayjs, getReverseAddress, flatDistanceMeters, type ReverseAddressResult } from '../../utils/util';
import request, { FILE_TYPE, getErrorMessage, createCancelToken, resetLoading } from '../../utils/request';
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
    hiddenAutoRecord: Boolean,
    openAutoRecord: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    form: {
      date: dayjs().format('YYYY-MM-DD'),
      time: dayjs().format('HH:mm'),
      diaryAddress: '',
      detailAddr: '',
      diaryLat: '',
      diaryLon: '',
      areaCode: '',
      areaName: '',
      recordText: '',
    } as any,
    formatDate: formatDisplayDate(dayjs()),
    formatTime: formatDisplayTime(dayjs().format('HH:mm')),
    calendarVisible: false,
    timePickerVisible: false,
    timeEditVisible: false,
    imgList: [] as any[],
    poiOptions: [] as { id: string; title: string; address: string; distance: number; lat: number; lng: number }[],
    confirmDialog: {
      visible: false,
      title: '',
      content: '',
      cancelText: '',
      confirmText: '',
      confirmType: 'default',
    },
  },

  observers: {
    info: function (info) {
      if (!info) return;
      const form = this.formatData(info);
      this._safeSetData({
        form,
        imgList: info.recordImages
          ? info.recordImages.map((item: { filePath: string; id: string }) => ({
              ...item,
              path: item.filePath,
              type: FILE_TYPE.UPLOADED,
            }))
          : [],
        formatDate: formatDisplayDate(safeDayjs(form.date) || dayjs()),
        formatTime: formatDisplayTime(form.time || dayjs().format('HH:mm')),
      });
    },
  },

  lifetimes: {
    attached: function () {
      (this as any)._isDestroyed = false;
      (this as any)._locationRequested = false;
      (this as any)._locating = false;
      // 新建/无 id 时，若父页面未指定日期，把日期时间重置为当前时刻；
      // 避免 data 初始值只在组件定义时求值一次，导致抽屉多次打开后仍显示页面加载时的时间/格式。
      if (!this.data.info?.id && !this.data.info?.date) {
        const now = dayjs();
        const date = now.format('YYYY-MM-DD');
        const time = now.format('HH:mm');
        (this as any)._safeSetData({
          form: { ...this.data.form, date, time },
          formatDate: formatDisplayDate(now),
          formatTime: formatDisplayTime(time),
        });
      }
      // _locationRequested 刚设为 false，无需再判断；只在新建/无定位信息时请求定位。
      if (!this.data.info?.id && !this.data.form.diaryLat) {
        (this as any)._locationRequested = true;
        this.requestLocation();
      }
    },
    detached: function () {
      (this as any)._locationRequested = false;
      if ((this as any)._locationTimeoutTimer) {
        clearTimeout((this as any)._locationTimeoutTimer);
        (this as any)._locationTimeoutTimer = null;
      }
      if ((this as any)._uploadCancelToken) {
        try { (this as any)._uploadCancelToken.cancel(); } catch {}
        (this as any)._uploadCancelToken = null;
      }
      if ((this as any)._saveCancelToken) {
        try { (this as any)._saveCancelToken.cancel(); } catch {}
        (this as any)._saveCancelToken = null;
      }
      (this as any)._isDestroyed = true;
      resetLoading();
    },
  },

  pageLifetimes: {
    hide() {
      if ((this as any)._locationTimeoutTimer) {
        clearTimeout((this as any)._locationTimeoutTimer);
        (this as any)._locationTimeoutTimer = null;
      }
      // 保存/上传是用户主动发起的写操作，不应在 page hide（包括切后台、系统调用）时取消，
      // 否则返回后保存失败且用户不知情。这些 token 在 detached / 用户主动取消 / 完成时清理。
      (this as any)._forceSetData({
        calendarVisible: false,
        timePickerVisible: false,
        timeEditVisible: false,
        'confirmDialog.visible': false,
      });
      resetLoading();
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

    onAutoRecordChange(e: any) {
      const next = e.detail?.openAutoRecorded === true;
      (getApp() as any).globalData.openAutoRecorded = next;
      this._safeSetData({ openAutoRecord: next });
    },

    requestLocation() {
      wx.getSetting({
        success: (res) => {
          const locationAuth = res.authSetting['scope.userLocation'];
          if (locationAuth === true || locationAuth === undefined) {
            this.doGetLocation();
          } else if (locationAuth === false) {
            this._safeSetData({
              confirmDialog: {
                visible: true,
                title: (this as any).$t('noteEdit.locationRequired'),
                content: (this as any).$t('noteEdit.locationRequiredDesc'),
                cancelText: (this as any).$t('common.cancel'),
                confirmText: (this as any).$t('noteEdit.openSettings'),
                confirmType: 'default',
              },
            });
          }
        },
        fail: () => {
          if (!(this as any)._isAlive()) return;
          wx.showToast({ title: (this as any).$t('noteEdit.openSettingsFail'), icon: 'none', duration: 2000 });
        },
      });
    },

    doGetLocation() {
      const self = this as any;
      if (self._isDestroyed || self._isDetached || self._locating) return;
      self._locating = true;
      // 立刻显示占位文案，让用户知道正在获取位置
      self._safeSetData({ 'form.diaryAddress': self.$t('noteEdit.locating') || '获取位置中...' });

      const LOCATION_TIMEOUT_MS = 15000;
      const locationPromise = new Promise<WechatMiniprogram.GetLocationSuccessCallbackResult>((resolve, reject) => {
        wx.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      });

      let timeoutTimer: any = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutTimer = setTimeout(() => reject(new Error('location timeout')), LOCATION_TIMEOUT_MS);
      });
      self._locationTimeoutTimer = timeoutTimer;

      Promise.race([locationPromise, timeoutPromise])
        .then(async ({ latitude, longitude }: any) => {
          if (self._isDestroyed || self._isDetached) return;
          // 逆向解析和常用地址查询互不依赖，并行请求
          const [result, commonRes] = await Promise.all([
            getReverseAddress(latitude, longitude),
            request.get('/user/common-addresses', {}, true).catch(() => ({ data: { addresses: [] } } as any)),
          ]);
          if (self._isDestroyed || self._isDetached) return;
          if (!result) {
            if (!self._isHidden) {
              wx.showToast({ title: (this as any).$t('noteEdit.locationFailNetwork'), icon: 'none', duration: 2000 });
            }
            return;
          }
          await this._fillLocation(result, (commonRes as any)?.data?.addresses || []);
        }).catch(() => {
          if (self._isDestroyed || self._isDetached || self._isHidden) return;
          wx.showToast({ title: (this as any).$t('noteEdit.locationFailPermission'), icon: 'none', duration: 2000 });
        }).finally(() => {
          clearTimeout(timeoutTimer);
          if ((this as any)._locationTimeoutTimer === timeoutTimer) {
            (this as any)._locationTimeoutTimer = null;
          }
          self._locating = false;
        });
    },

    async _fillLocation(result: ReverseAddressResult, commonAddresses: any[]) {
      let landmark = result.landmark || result.address;
      const lat = result.location.lat;
      const lon = result.location.lng;

      if (landmark) {
        for (const addr of commonAddresses) {
          if (flatDistanceMeters(lat, lon, addr.lat, addr.lon) <= 300) {
            landmark = addr.name;
            break;
          }
        }
      }

      this._safeSetData({
        form: {
          ...this.data.form,
          diaryAddress: landmark,
          detailAddr: result.address,
          diaryLat: lat,
          diaryLon: lon,
          areaCode: result.areaCode,
          areaName: result.areaName,
        },
        poiOptions: (result.pois || []).slice(0, 5),
      });
    },
    selectPOI(e: any) {
      const index = e.currentTarget.dataset.index;
      const poi = this.data.poiOptions[index];
      if (!poi) return;
      this._safeSetData({
        'form.diaryAddress': poi.title,
        'form.diaryLat': poi.lat,
        'form.diaryLon': poi.lng,
      });
    },

    goCommonAddresses() {
      wx.navigateTo({ url: '/pages/CommonAddresses/CommonAddresses' });
    },
    formatData(data: any) {
      const recordTime = data.recordTime;
      const timeStr = recordTime
        ? (safeDayjs(recordTime) || dayjs()).format('HH:mm')
        : (data.time || dayjs().format('HH:mm'));
      return {
        ...data,
        diaryAddress: data.diaryAddress || '',
        detailAddr: data.detailAddr || '',
        recordText: data.recordText || '',
        date: recordTime
          ? (safeDayjs(recordTime) || dayjs()).format('YYYY-MM-DD')
          : (data.date || dayjs().format('YYYY-MM-DD')),
        time: timeStr,
        diaryLat: data.diaryLat != null ? data.diaryLat : '',
        diaryLon: data.diaryLon != null ? data.diaryLon : '',
        areaCode: data.areaCode || '',
        areaName: data.areaName || '',
      };
    },
    chooseLocation() {
      const self = this as any;
      wx.chooseLocation({
        success: async ({ name, address, latitude, longitude }) => {
          if (self._isDestroyed || self._isDetached) return;
          try {
            const result = await getReverseAddress(latitude, longitude);
            if (self._isDestroyed || self._isDetached) return;
            if (!result) {
              wx.showToast({ title: (this as any).$t('noteEdit.locationFail'), icon: 'error', duration: 2000 });
              return;
            }
            if (self._isDestroyed || self._isDetached) return;
            // 选择地址后更新表单；若回调时页面仍处隐藏态，
            // _safeSetData 会暂存到 pending 并在 show 时统一 flush。
            this._safeSetData({
              form: {
                ...this.data.form,
                diaryAddress: name,
                detailAddr: address,
                diaryLat: latitude,
                diaryLon: longitude,
                areaCode: result.areaCode || this.data.form.areaCode,
                areaName: result.areaName || this.data.form.areaName,
              },
              poiOptions: (result.pois || []).slice(0, 5),
            });
          } catch {
            if (self._isDestroyed || self._isDetached || self._isHidden) return;
            wx.showToast({ title: (this as any).$t('noteEdit.locationRetryFail'), icon: 'none', duration: 2000 });
          }
        },
        fail: (err: any) => {
          if (self._isDestroyed || self._isDetached || self._isHidden) return;
          if (err?.errMsg?.includes('auth deny') || err?.errMsg?.includes('fail auth')) {
            wx.showToast({ title: (this as any).$t('noteEdit.locationPermissionDenied'), icon: 'none', duration: 2000 });
          }
        },
      });
    },
    openCalendar() {
      (this.selectComponent('#NoteEditRecord') as any)?.blur?.();
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
      (this.selectComponent('#NoteEditRecord') as any)?.blur?.();
      this._safeSetData({ timePickerVisible: true });
    },
    onTimeConfirm(e: { detail: { value: string; fromEdit?: boolean } }) {
      const time = e.detail.value;
      this._safeSetData({
        'form.time': time,
        formatTime: formatDisplayTime(time),
      });
      if (e.detail.fromEdit) {
        this._safeSetData({ timeEditVisible: false, timePickerVisible: false });
      } else {
        this._safeSetData({ timePickerVisible: false });
      }
    },
    onTimeClose() {
      this._safeSetData({ timePickerVisible: false });
    },
    onTimeEditOpen() {
      this._safeSetData({ timeEditVisible: true });
    },
    onTimeEditClose() {
      this._safeSetData({ timeEditVisible: false });
    },
    hidden() {
      (this as any)._locationRequested = false;
      this.triggerEvent('hidden');
    },

    onRecordTextInput(e: any) {
      this._safeSetData({ 'form.recordText': e.detail.value });
    },

    onConfirmDialogConfirm() {
      // 关闭弹窗是用户明确操作，使用 _safeSetData 统一做生命周期守卫。
      (this as any)._safeSetData({ 'confirmDialog.visible': false });
      wx.openSetting({
        success: (settingRes) => {
          if (settingRes.authSetting['scope.userLocation']) {
            this.doGetLocation();
          }
        },
        fail: () => {
          if ((this as any)._isDestroyed || (this as any)._isDetached) return;
          wx.showToast({ title: (this as any).$t('noteEdit.openSettingsFail'), icon: 'none', duration: 2000 });
        },
      });
    },

    onConfirmDialogCancel() {
      (this as any)._safeSetData({ 'confirmDialog.visible': false });
    },

    selectImage() {
      const MAX_IMAGES = 9;
      const remain = MAX_IMAGES - this.data.imgList.filter((i: any) => i.type !== FILE_TYPE.DELETE).length;
      if (remain <= 0) {
        wx.showToast({ title: (this as any).$t('noteEdit.maxImages', { count: MAX_IMAGES }), icon: 'none' });
        return;
      }
      wx.chooseMedia({
        count: Math.min(remain, 9),
        mediaType: ['image'],
        sizeType: ['compressed'],
        success: (res: any) => {
          if ((this as any)._isDestroyed || (this as any)._isDetached) return;

          const newFiles = res.tempFiles.map((item: { tempFilePath: string }) => ({
            path: item.tempFilePath,
            type: FILE_TYPE.TO_BE_UPLOADED,
          }));
          const total = this.data.imgList.filter((i: any) => i.type !== FILE_TYPE.DELETE).length + newFiles.length;
          if (total > MAX_IMAGES) {
            wx.showToast({ title: (this as any).$t('noteEdit.maxImages', { count: MAX_IMAGES }), icon: 'none' });
            return;
          }
          // 选择图片后更新 imgList；若回调时页面仍处隐藏态，
          // _safeSetData 会暂存到 pending 并在 show 时统一 flush，
          // 保证用户返回后能看到已选图片并正常上传。
          this._safeSetData({
            imgList: [...this.data.imgList, ...newFiles],
          });
        },
        fail: (error) => {
          if (!(this as any)._isAlive()) return;
          const errMsg = error?.errMsg || '';
          if (/cancel/i.test(errMsg)) return;
          if (/auth/i.test(errMsg) || /deny/i.test(errMsg)) {
            wx.showToast({ title: (this as any).$t('noteEdit.albumPermissionRequired'), icon: 'none' });
          } else {
            wx.showToast({ title: (this as any).$t('noteEdit.chooseImageFail'), icon: 'none' });
          }
        },
      });
    },
    delImage(e: { detail: any }) {
      const { index } = e.detail;
      const item = this.data.imgList[index];
      this._safeSetData({
        [`imgList[${index}]`]: { ...item, type: FILE_TYPE.DELETE },
      });
    },
    cancel() {
      if ((this as any)._uploadCancelToken) {
        try { (this as any)._uploadCancelToken.cancel(); } catch {}
        (this as any)._uploadCancelToken = null;
      }
      if ((this as any)._saveCancelToken) {
        try { (this as any)._saveCancelToken.cancel(); } catch {}
        (this as any)._saveCancelToken = null;
      }
      this._safeSetData({ poiOptions: [] });
      this.hidden();
    },
    async submit() {
      const self = this as any;
      if (self._isDestroyed || self._isDetached) return;

      const recordText = (this.data.form.recordText || '').trim();
      if ([...recordText].length > 140) {
        wx.showToast({ title: (this as any).$t('noteEdit.textMaxLength'), icon: 'none' });
        return;
      }
      if (!this.data.form.date || !this.data.form.time || !this.data.form.diaryAddress || !this.data.form.diaryLat) {
        wx.showToast({ title: (this as any).$t('noteEdit.requiredFields'), icon: 'none' });
        return;
      }
      const recordDateTime = safeDayjs([this.data.form.date, this.data.form.time].join(' '));
      if (!recordDateTime) {
        wx.showToast({ title: (this as any).$t('noteEdit.invalidDateTime'), icon: 'none' });
        return;
      }

      self._submitting = true;

      try {
        const hasUpload = this.data.imgList.some((item: any) => item.type === FILE_TYPE.TO_BE_UPLOADED);
        const hasDelete = this.data.imgList.some((item: any) => item.type === FILE_TYPE.DELETE);
        const existingUploadedIds: string[] = this.data.imgList
          .filter((item: any) => item.type === FILE_TYPE.UPLOADED && item.id)
          .map((item: any) => item.id);
        let imageIds: string[] = [];
        if (hasUpload || hasDelete) {
          if (self._uploadCancelToken) {
            try { self._uploadCancelToken.cancel(); } catch {}
          }
          self._uploadCancelToken = createCancelToken();
          imageIds = await request.uploadFile(this.data.imgList, { cancelToken: self._uploadCancelToken });
          self._uploadCancelToken = null;
          if (self._isDestroyed || self._isDetached) return;
          const newImgList = [...this.data.imgList];
          const existingUploadedCount = newImgList.filter((item: any) => item.type === FILE_TYPE.UPLOADED && item.id).length;
          const newIds = imageIds.slice(existingUploadedCount);
          let newIdIndex = 0;
          for (let i = 0; i < newImgList.length; i++) {
            if (newImgList[i].type === FILE_TYPE.TO_BE_UPLOADED) {
              newImgList[i] = { ...newImgList[i], type: FILE_TYPE.UPLOADED, id: newIds[newIdIndex++] };
            }
          }
          // 上传完成时组件处于存活状态，使用 _safeSetData 同步 imgList，
          // 由 behavior 在隐藏期间暂存、返回前台后统一 flush。
          (this as any)._safeSetData({ imgList: newImgList.filter((item: any) => item.type !== FILE_TYPE.DELETE) });
        } else {
          imageIds = existingUploadedIds;
        }
        const lat = this.data.form.diaryLat === '' ? undefined : Number(this.data.form.diaryLat);
        const lon = this.data.form.diaryLon === '' ? undefined : Number(this.data.form.diaryLon);
        const payload = {
          data: {
            id: this.data.form.id || undefined,
            recordTime: recordDateTime.toISOString(),
            text: recordText,
            imageIds,
            lat,
            lon,
            address: this.data.form.diaryAddress,
            detailAddress: this.data.form.detailAddr,
            areaCode: this.data.form.areaCode,
            areaName: this.data.form.areaName,
          },
        };
        if (self._saveCancelToken) {
          try { self._saveCancelToken.cancel(); } catch {}
        }
        self._saveCancelToken = createCancelToken();
        const res: any = this.data.form.id
          ? await request.put('/diary/details', { ...payload, cancelToken: self._saveCancelToken }, true)
          : await request.post('/diary/details', { ...payload, cancelToken: self._saveCancelToken }, true);
        self._saveCancelToken = null;

        if (self._isDestroyed || self._isDetached) return;
        this.triggerEvent('submit', { recordDate: this.data.form.date, card: res?.data?.card });
        this.cancel();
      } catch (error: any) {
        if (!self._isAlive()) return;
        if (error?.message === 'request:abort') return;
        if (!error?._handledByModal) {
          wx.showToast({ title: getErrorMessage(error, (this as any).$t('noteEdit.saveFail')), icon: 'none' });
        }
      } finally {
        self._saveCancelToken = null;
        self._uploadCancelToken = null;
        self._submitting = false;
      }
    },
  },
});
