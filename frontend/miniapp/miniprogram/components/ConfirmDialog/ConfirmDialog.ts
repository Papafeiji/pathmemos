import i18nBehavior from '../../behaviors/i18n';

Component({
  behaviors: [i18nBehavior],
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ title: '' }); },
    },
    content: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ content: '' }); },
    },
    cancelText: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ cancelText: '' }); },
    },
    confirmText: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ confirmText: '' }); },
    },
    confirmType: {
      type: String,
      value: 'default',
    },
    confirmDisabled: {
      type: Boolean,
      value: false,
    },
    showInput: {
      type: Boolean,
      value: false,
    },
    inputDisplayValue: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ inputDisplayValue: '' }); },
    },
    inputValue: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ inputValue: '' }); },
    },
    inputPlaceholder: {
      type: String,
      value: '',
      observer(this: any, newVal: any) { if (newVal == null) (this as any)._safeSetData({ inputPlaceholder: '' }); },
    },
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close');
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      if (this.data.confirmDisabled) return;
      this.triggerEvent('confirm');
    },
    onInput(e: any) {
      this.triggerEvent('input', { value: e.detail.value });
    },
    onCopy() {
      const value = this.data.inputDisplayValue || this.data.inputValue;
      if (!value) return;
      wx.setClipboardData({
        data: value,
        success: () => {
          wx.showToast({ title: (this as any).$t('common.copied'), icon: 'none' });
        },
      });
    },
  },

  pageLifetimes: {
    hide(this: any) {
      if (this.data.visible) {
        this.triggerEvent('cancel');
      }
    },
  },
});
