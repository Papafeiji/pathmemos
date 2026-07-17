/// <reference path="./types/index.d.ts" />

interface TextDecoder {
  decode(input: Uint8Array | ArrayBuffer, options?: { stream?: boolean }): string;
}
declare const TextDecoder: {
  new(label?: string): TextDecoder;
};

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    openAutoRecorded: boolean;
    isDark?: boolean;
    [key: string]: any;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
  [key: string]: any;
}

declare namespace WechatMiniprogram.Component {
  interface InstanceMethods<D extends DataOption> {
    _safeSetData(data: Partial<D> & IAnyObject, callback?: () => void): void;
    _forceSetData(data: Partial<D> & IAnyObject, callback?: () => void): void;
    _isAlive(): boolean;
  }
}
