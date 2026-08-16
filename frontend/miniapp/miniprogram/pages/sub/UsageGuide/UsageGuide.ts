
import { openUrl } from '../../../utils/util';
import { getHelpBaseURL } from '../../../config/index';
import themeBehavior from '../../../behaviors/theme';
import i18nBehavior from '../../../behaviors/i18n';

Page({
  behaviors: [themeBehavior, i18nBehavior],
  _isDestroyed: false,
  _isHidden: false,
  data: {},

  onLoad() {
    this._isDestroyed = false;
  },

  onUnload() {
    this._isDestroyed = true;
    this._isHidden = true;
    (this as any).unsubscribeTheme?.();
  },

  onHide() {
    this._isHidden = true;
  },

  openTutorial0() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial0/`); },
  openTutorial1() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial1/`); },
  openTutorial2() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial2/`); },
  openTutorial3() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial3/`); },
  openTutorial4() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial4/`); },
  openTutorial5() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial5/`); },
  openTutorial6() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial6/`); },
  openTutorial7() { openUrl(`${getHelpBaseURL()}/tutorial/tutorial7/`); },
});
