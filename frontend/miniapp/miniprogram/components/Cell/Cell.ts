
Component({
  behaviors: [],
  options: {
    multipleSlots: true,
  },
  properties: {
    showArrow: Boolean,
    suffix: String,
  },
  methods: {
    onTap() {
      this.triggerEvent('tap');
    },
  },
});
