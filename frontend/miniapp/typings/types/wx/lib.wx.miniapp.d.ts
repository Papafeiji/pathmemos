

type IAnyObject = Record<string, any>
interface IdaasError {
    
    errMsg: string
     errCode: number
}

interface WeixinAppLoginOption {
    
    complete?: WeixinAppLoginCompleteCallback
    
    fail?: WeixinAppLoginFailCallback
    
    success?: WeixinAppLoginSuccessCallback
}

interface WeixinMiniProgramLoginOption {
    
    complete?: WeixinMiniProgramLoginCompleteCallback
    
    fail?: WeixinMiniProgramLoginFailCallback
    
    redirectPath?: string
    
    success?: WeixinMiniProgramLoginSuccessCallback
}

type WeixinMiniProgramLoginCompleteCallback = (res: IdaasError) => void
type WeixinMiniProgramLoginFailCallback = (res: IdaasError) => void
type WeixinMiniProgramLoginSuccessCallback = (
    result: WeixinAppLoginSuccessCallbackResult
) => void

interface WeixinAppLoginSuccessCallbackResult {
    
    code: string
    errMsg: string
}

type WeixinAppLoginSuccessCallback = (
    result: WeixinAppLoginSuccessCallbackResult
) => void
type WeixinAppLoginCompleteCallback = (res: IdaasError) => void
type WeixinAppLoginFailCallback = (res: IdaasError) => void

interface GetMiniProgramCodeOption {
    
    complete?: GetMiniProgramCodeCompleteCallback
    
    fail?: GetMiniProgramCodeFailCallback
    
    success?: GetMiniProgramCodeSuccessCallback
}

type GetMiniProgramCodeCompleteCallback = (res: IdaasError) => void

type GetMiniProgramCodeFailCallback = (res: IdaasError) => void

type GetMiniProgramCodeSuccessCallback = (
    result: GetMiniProgramCodeSuccessCallbackResult
) => void

interface GetMiniProgramCodeSuccessCallbackResult {
    
    code: string
    errMsg: string
}

interface PhoneSmsLoginOption {
    
    phoneNumber: string
    
    verifyCode: string
    
    complete?: PhoneSmsLoginCompleteCallback
    
    fail?: PhoneSmsLoginFailCallback
    
    success?: PhoneSmsLoginSuccessCallback
}

type PhoneSmsLoginCompleteCallback = (res: IdaasError) => void

type PhoneSmsLoginFailCallback = (res: IdaasError) => void

type PhoneSmsLoginSuccessCallback = (
    result: PhoneSmsLoginSuccessCallbackResult
) => void

interface PhoneSmsLoginSuccessCallbackResult {
    
    code: string
    errMsg: string
}

interface GetPhoneMaskOption {
    
    complete?: GetPhoneMaskCompleteCallback
    
    fail?: GetPhoneMaskFailCallback
    
    success?: GetPhoneMaskSuccessCallback
}

type GetPhoneMaskCompleteCallback = (res: IdaasError) => void

type GetPhoneMaskFailCallback = (res: IdaasError) => void

type GetPhoneMaskSuccessCallback = (
    res: IAnyObject,
    
    phoneMask: string
) => void

interface AppleLoginOption {
    
    complete?: AppleLoginCompleteCallback
    
    fail?: AppleLoginFailCallback
    
    success?: AppleLoginSuccessCallback
}

type AppleLoginCompleteCallback = (res: IdaasError) => void

type AppleLoginFailCallback = (res: IdaasError) => void

type AppleLoginSuccessCallback = (
    res: IAnyObject,
    
    code: string
) => void
type CheckIdentitySessionCompleteCallback = (res: GeneralCallbackResult) => void

type CheckIdentitySessionFailCallback = (res: GeneralCallbackResult) => void

type CheckIdentitySessionSuccessCallback = (res: GeneralCallbackResult) => void

interface CheckIdentitySessionOption {
    
    complete?: CheckIdentitySessionCompleteCallback
    
    fail?: CheckIdentitySessionFailCallback
    
    success?: CheckIdentitySessionSuccessCallback
}

interface GetIdentityCodeOption {
    
    complete?: GetIdentityCodeCompleteCallback
    
    fail?: GetIdentityCodeFailCallback
    
    success?: GetIdentityCodeSuccessCallback
}

type GetIdentityCodeCompleteCallback = (res: IdaasError) => void

type GetIdentityCodeFailCallback = (res: IdaasError) => void

type GetIdentityCodeSuccessCallback = (
    result: PhoneSmsLoginSuccessCallbackResult
) => void

interface LogoutOption {
    
    complete?: LogoutCompleteCallback
    
    fail?: LogoutFailCallback
    
    success?: LogoutSuccessCallback
}

type LogoutCompleteCallback = (res: GeneralCallbackResult) => void

type LogoutFailCallback = (res: GeneralCallbackResult) => void

type LogoutSuccessCallback = (res: GeneralCallbackResult) => void
declare namespace WechatMiniprogram {
    
    interface Wx {
        miniapp: any

        weixinAppLogin(option?: WeixinAppLoginOption): void

        weixinMiniProgramLogin(option: WeixinMiniProgramLoginOption): void

        getMiniProgramCode(option?: GetMiniProgramCodeOption): void

        phoneSmsLogin(option: PhoneSmsLoginOption): void

        getPhoneMask(option?: GetPhoneMaskOption): void

        appleLogin(option?: AppleLoginOption): void

        checkIdentitySession(option?: CheckIdentitySessionOption): void

        getIdentityCode(option?: GetIdentityCodeOption): void

        logout(option?: LogoutOption): void
    }
}

interface AddPaymentByProductIdentifiersOption {
    
    applicationUsername: string
    
    discount: DiscountOption
    
    productIdentifier: string
    
    quantity: number
    
    simulatesAskToBuyInSandbox: boolean
    
    complete?: AddPaymentByProductIdentifiersCompleteCallback
    
    fail?: AddPaymentByProductIdentifiersFailCallback
    
    success?: AddPaymentByProductIdentifiersSuccessCallback
}
interface AddTransactionObserverOption {
    
    didRevokeEntitlementsForProductIdentifiers?: (...args: any[]) => any
    
    paymentQueueDidChangeStorefront?: (...args: any[]) => any
    
    paymentQueueRestoreCompletedTransactionsFinished?: (...args: any[]) => any
    
    restoreCompletedTransactionsFailedWithError?: (...args: any[]) => any
    
    shouldAddStorePayment?: (...args: any[]) => any
    
    updatedTransactions?: (...args: any[]) => any
}
interface AgreePrivacyAuthorizationOption {
    
    complete?: AgreePrivacyAuthorizationCompleteCallback
    
    fail?: AgreePrivacyAuthorizationFailCallback
    
    success?: AgreePrivacyAuthorizationSuccessCallback
}
interface BindAppleOption {
    
    complete?: BindAppleCompleteCallback
    
    fail?: BindAppleFailCallback
    
    success?: BindAppleSuccessCallback
}
interface BindPhoneOption {
    
    phoneNumber: string
    
    verifyCode: string
    
    complete?: BindPhoneCompleteCallback
    
    fail?: BindPhoneFailCallback
    
    success?: BindPhoneSuccessCallback
}
interface BindWeixinOption {
    
    complete?: BindWeixinCompleteCallback
    
    fail?: BindWeixinFailCallback
    
    success?: BindWeixinSuccessCallback
}
interface CanMakePaymentsOption {
    
    complete?: CanMakePaymentsCompleteCallback
    
    fail?: CanMakePaymentsFailCallback
    
    success?: CanMakePaymentsSuccessCallback
}
interface CheckBindInfoOption {
    
    complete?: CheckBindInfoCompleteCallback
    
    fail?: CheckBindInfoFailCallback
    
    success?: CheckBindInfoSuccessCallback
}
interface CheckBindInfoSuccessCallbackResult {
    
    hasBoundApple: boolean
    
    hasBoundPhone: boolean
    
    hasBoundWeixin: boolean
    errMsg: string
}

interface ChooseFile {
    
    name: string
    
    path: string
    
    size: number
}
interface ChooseFileOption {
    
    allowsMultipleSelection?: boolean
    
    complete?: ChooseFileCompleteCallback
    
    fail?: ChooseFileFailCallback
    
    success?: ChooseFileSuccessCallback
}
interface ChooseFileSuccessCallbackResult {
    
    tempFiles: ChooseFile[]
    errMsg: string
}
interface CloseAppModuleOption {
    
    allowBackgroundRunning?: boolean
    
    complete?: CloseAppModuleCompleteCallback
    
    fail?: CloseAppModuleFailCallback
    
    success?: CloseAppModuleSuccessCallback
}
interface CloseAppOption {
    
    complete?: CloseAppCompleteCallback
    
    fail?: CloseAppFailCallback
    
    success?: CloseAppSuccessCallback
}
interface CopyNativeFileToWxOption {
    nativeFilePath: string
    
    complete?: CopyNativeFileToWxCompleteCallback
    
    fail?: CopyNativeFileToWxFailCallback
    
    success?: CopyNativeFileToWxSuccessCallback
}
interface CopyWxFileToNativeOption {
    wxFilePath: string
    
    complete?: CopyWxFileToNativeCompleteCallback
    
    fail?: CopyWxFileToNativeFailCallback
    
    success?: CopyWxFileToNativeSuccessCallback
}
interface CreateRewardedVideoAdOption {
    
    adUnitId: string
}

interface DiscountOption {
    
    identifier: string
    
    keyIdentifier: string
    
    nonce: string
    
    signature: string
    
    timestamp: string
}
interface FinishTransactionOption {
    
    transactionIdentifier: any[]
    
    complete?: FinishTransactionCompleteCallback
    
    fail?: FinishTransactionFailCallback
    
    success?: FinishTransactionSuccessCallback
}
interface GetAppStoreReceiptDataOption {
    
    complete?: GetAppStoreReceiptDataCompleteCallback
    
    fail?: GetAppStoreReceiptDataFailCallback
    
    success?: GetAppStoreReceiptDataSuccessCallback
}
interface GetAppStoreReceiptURLOption {
    
    complete?: GetAppStoreReceiptURLCompleteCallback
    
    fail?: GetAppStoreReceiptURLFailCallback
    
    success?: GetAppStoreReceiptURLSuccessCallback
}
interface GetMetaDataOption {
    
    complete?: GetMetaDataCompleteCallback
    
    fail?: GetMetaDataFailCallback
    
    success?: GetMetaDataSuccessCallback
}
interface GetPrivacySettingOption {
    
    complete?: GetPrivacySettingCompleteCallback
    
    fail?: GetPrivacySettingFailCallback
    
    success?: GetPrivacySettingSuccessCallback
}
interface GetSDKVersionOption {
    
    complete?: GetSDKVersionCompleteCallback
    
    fail?: GetSDKVersionFailCallback
    
    success?: GetSDKVersionSuccessCallback
}
interface GetStorefrontOption {
    
    complete?: GetStorefrontCompleteCallback
    
    fail?: GetStorefrontFailCallback
    
    success?: GetStorefrontSuccessCallback
}
interface GetTransactionsOption {
    
    complete?: GetTransactionsCompleteCallback
    
    fail?: GetTransactionsFailCallback
    
    success?: GetTransactionsSuccessCallback
}
interface GoogleLoginOption {
    
    complete?: GoogleLoginCompleteCallback
    
    fail?: GoogleLoginFailCallback
    
    success?: GoogleLoginSuccessCallback
}
interface GoogleLoginSuccessCallbackResult {
    
    idToken: string
    
    userID: string
    errMsg: string
}
interface GoogleLogoutOption {
    
    complete?: GoogleLogoutCompleteCallback
    
    fail?: GoogleLogoutFailCallback
    
    success?: GoogleLogoutSuccessCallback
}
interface GoogleRestoreLoginOption {
    
    complete?: GoogleRestoreLoginCompleteCallback
    
    fail?: GoogleRestoreLoginFailCallback
    
    success?: GoogleRestoreLoginSuccessCallback
}
interface HasWechatInstallOption {
    
    complete?: HasWechatInstallCompleteCallback
    
    fail?: HasWechatInstallFailCallback
    
    success?: HasWechatInstallSuccessCallback
}
interface HideStatusBarOption {
    
    complete?: HideStatusBarCompleteCallback
    
    fail?: HideStatusBarFailCallback
    
    success?: HideStatusBarSuccessCallback
}
interface InstallAppOption {
    
    filePath: string
    
    complete?: InstallAppCompleteCallback
    
    fail?: InstallAppFailCallback
    
    success?: InstallAppSuccessCallback
}
interface JumpToAppStoreOption {
    action?: 'write-review'
    
    complete?: JumpToAppStoreCompleteCallback
    
    fail?: JumpToAppStoreFailCallback
    
    success?: JumpToAppStoreSuccessCallback
}
interface JumpToGooglePlayOption {
    
    complete?: JumpToGooglePlayCompleteCallback
    
    fail?: JumpToGooglePlayFailCallback
    
    success?: JumpToGooglePlaySuccessCallback
}
interface LaunchMiniProgramOption {
    
    miniProgramType: 0 | 1 | 2
    
    userName: string
    
    complete?: LaunchMiniProgramCompleteCallback
    
    fail?: LaunchMiniProgramFailCallback
    
    path?: string
    
    success?: LaunchMiniProgramSuccessCallback
}
interface LoadNativePluginOption {
    
    pluginId: string
    
    complete?: LoadNativePluginCompleteCallback
    
    fail?: LoadNativePluginFailCallback
    
    success?: LoadNativePluginSuccessCallback
}
interface LoginOption {
    
    complete?: LoginCompleteCallback
    
    fail?: LoginFailCallback
    
    success?: LoginSuccessCallback
}

interface OffAdSplashErrorFunction {
    
    complete?: OffAdSplashErrorCompleteCallback
    
    fail?: OffAdSplashErrorFailCallback
    
    success?: OffAdSplashErrorSuccessCallback
}

interface OffOpensdkLogFunction {
    
    complete?: OffOpensdkLogCompleteCallback
    
    fail?: OffOpensdkLogFailCallback
    
    success?: OffOpensdkLogSuccessCallback
}

interface OnAdSplashErrorFunction {
    
    complete?: OnAdSplashErrorCompleteCallback
    
    fail?: OnAdSplashErrorFailCallback
    
    success?: OnAdSplashErrorSuccessCallback
}

interface OnOpensdkLogFunction {
    
    complete?: OnOpensdkLogCompleteCallback
    
    fail?: OnOpensdkLogFailCallback
    
    success?: OnOpensdkLogSuccessCallback
}
interface OpenAppStoreRatingOption {
    
    complete?: OpenAppStoreRatingCompleteCallback
    
    fail?: OpenAppStoreRatingFailCallback
    
    success?: OpenAppStoreRatingSuccessCallback
}
interface OpenCustomerServiceChatOption {
    
    corpId: string
    
    url: string
    
    complete?: OpenCustomerServiceChatCompleteCallback
    
    fail?: OpenCustomerServiceChatFailCallback
    
    success?: OpenCustomerServiceChatSuccessCallback
}
interface OpenSaaAActionSheetOption {
    
    complete?: OpenSaaAActionSheetCompleteCallback
    
    fail?: OpenSaaAActionSheetFailCallback
    
    success?: OpenSaaAActionSheetSuccessCallback
}
interface OpenUrlOption {
    
    url: string
    
    complete?: OpenUrlCompleteCallback
    
    fail?: OpenUrlFailCallback
    
    success?: OpenUrlSuccessCallback
}
interface RequestPaymentOption {
    
    mchid: string
    
    nonceStr: string
    
    package: string
    
    prepayId: string
    
    sign: string
    
    timeStamp: string
    
    complete?: RequestPaymentCompleteCallback
    
    fail?: RequestPaymentFailCallback
    
    success?: RequestPaymentSuccessCallback
}
interface RequestSKProductsOption {
    
    productIdentifiers: any[]
    
    complete?: RequestSKProductsCompleteCallback
    
    fail?: RequestSKProductsFailCallback
    
    success?: RequestSKProductsSuccessCallback
}
interface RequestSKReceiptRefreshRequestOption {
    
    complete?: RequestSKReceiptRefreshRequestCompleteCallback
    
    fail?: RequestSKReceiptRefreshRequestFailCallback
    
    success?: RequestSKReceiptRefreshRequestSuccessCallback
}
interface RequestSubscribeMessageOption {
    
    reserved: string
    
    scene: 0 | 1 | 2
    
    templateId: string
    
    complete?: RequestSubscribeMessageCompleteCallback
    
    fail?: RequestSubscribeMessageFailCallback
    
    success?: RequestSubscribeMessageSuccessCallback
}
interface RestoreCompletedTransactionsOption {
    
    complete?: RestoreCompletedTransactionsCompleteCallback
    
    fail?: RestoreCompletedTransactionsFailCallback
    
    success?: RestoreCompletedTransactionsSuccessCallback
}
interface RevokePrivacySettingOption {
    
    complete?: RevokePrivacySettingCompleteCallback
    
    fail?: RevokePrivacySettingFailCallback
    
    success?: RevokePrivacySettingSuccessCallback
}
interface SetEnableAdSplashOption {
    enable: boolean
}
interface SetSaaAUserIdOption {
    userId: string
}
interface ShareFileOption {
    
    filePath: string
    
    complete?: ShareFileCompleteCallback
    
    fail?: ShareFileFailCallback
    
    success?: ShareFileSuccessCallback
}
interface ShareImageMessageOption {
    
    imagePath: string
    
    scene: 0 | 1 | 2
    
    thumbPath: string
    
    complete?: ShareImageMessageCompleteCallback
    
    entranceMiniProgramPath?: string
    
    entranceMiniProgramUsername?: string
    
    fail?: ShareImageMessageFailCallback
    
    success?: ShareImageMessageSuccessCallback
}
interface ShareMiniProgramMessageOption {
    
    imagePath: string
    
    miniprogramType: number
    
    path: string
    
    scene: 0
    
    userName: string
    
    webpageUrl: string
    
    withShareTicket: boolean
    
    complete?: ShareMiniProgramMessageCompleteCallback
    
    fail?: ShareMiniProgramMessageFailCallback
    
    success?: ShareMiniProgramMessageSuccessCallback
}
interface ShareTextMessageOption {
    
    scene: 0 | 1 | 2
    
    text: string
    
    complete?: ShareTextMessageCompleteCallback
    
    fail?: ShareTextMessageFailCallback
    
    success?: ShareTextMessageSuccessCallback
}
interface ShareVideoMessageOption {
    
    description: string
    
    scene: 0 | 1 | 2
    
    thumbPath: string
    
    title: string
    
    videoLowBandUrl: string
    
    videoUrl: string
    
    complete?: ShareVideoMessageCompleteCallback
    
    fail?: ShareVideoMessageFailCallback
    
    success?: ShareVideoMessageSuccessCallback
}
interface ShareWebPageMessageOption {
    
    description: string
    
    scene: 0 | 1 | 2
    
    thumbPath: string
    
    title: string
    
    webpageUrl: string
    
    complete?: ShareWebPageMessageCompleteCallback
    
    fail?: ShareWebPageMessageFailCallback
    
    success?: ShareWebPageMessageSuccessCallback
}
interface ShowStatusBarOption {
    
    complete?: ShowStatusBarCompleteCallback
    
    fail?: ShowStatusBarFailCallback
    
    success?: ShowStatusBarSuccessCallback
}
interface IdaasError {
     errMsg: string
     errCode: number
}
interface RewardedVideoAd {
    
    load(): Promise<any>
    
    show(): Promise<any>
    
    destroy(): void
}
interface WxMiniApp {
    
    createRewardedVideoAd(option: CreateRewardedVideoAdOption): RewardedVideoAd
    
    agreePrivacyAuthorization(option?: AgreePrivacyAuthorizationOption): void
    
    bindApple(option?: BindAppleOption): void
    
    bindPhone(option: BindPhoneOption): void
    
    bindWeixin(option?: BindWeixinOption): void
    
    checkBindInfo(option?: CheckBindInfoOption): void
    
    chooseFile(option: ChooseFileOption): void
    
    closeApp(option: CloseAppOption): void
    
    closeAppModule<T extends CloseAppModuleOption = CloseAppModuleOption>(
        option: T
    ): PromisifySuccessResult<T, CloseAppModuleOption>
    
    copyNativeFileToWx(option: CopyNativeFileToWxOption): void
    
    copyWxFileToNative(option: CopyWxFileToNativeOption): void
    
    getMetaData(option?: GetMetaDataOption): void
    
    getPrivacySetting(option?: GetPrivacySettingOption): void
    
    getSDKVersion<T extends GetSDKVersionOption = GetSDKVersionOption>(
        option: T
    ): PromisifySuccessResult<T, GetSDKVersionOption>
    
    googleLogin(option?: GoogleLoginOption): void
    
    googleLogout(option?: GoogleLogoutOption): void
    
    googleRestoreLogin(option?: GoogleRestoreLoginOption): void
    
    hasWechatInstall(option: HasWechatInstallOption): void
    
    hideStatusBar(option?: HideStatusBarOption): void
    
    installApp(option: InstallAppOption): void
    
    jumpToAppStore(option: JumpToAppStoreOption): void
    
    jumpToGooglePlay(option?: JumpToGooglePlayOption): void
    
    launchMiniProgram<
        T extends LaunchMiniProgramOption = LaunchMiniProgramOption
    >(
        option: T
    ): PromisifySuccessResult<T, LaunchMiniProgramOption>
    
    loadNativePlugin(option: LoadNativePluginOption): void
    
    login<T extends LoginOption = LoginOption>(
        option: T
    ): PromisifySuccessResult<T, LoginOption>
    
    offAdSplashError(
        
        fn: OffAdSplashErrorFunction
    ): void
    
    offOpensdkLog(
        
        fn: OffOpensdkLogFunction
    ): void
    
    onAdSplashError(
        
        fn: OnAdSplashErrorFunction
    ): void
    
    onOpensdkLog(
        
        fn: OnOpensdkLogFunction
    ): void
    
    openAppStoreRating(option: OpenAppStoreRatingOption): void
    
    openCustomerServiceChat<
        T extends OpenCustomerServiceChatOption = OpenCustomerServiceChatOption
    >(
        option: T
    ): PromisifySuccessResult<T, OpenCustomerServiceChatOption>
    
    openSaaAActionSheet(option: OpenSaaAActionSheetOption): void
    
    openUrl(option: OpenUrlOption): void
    
    registOpenURL(
        
        callback: RegistOpenURLCallback
    ): void
    
    requestPayment<T extends RequestPaymentOption = RequestPaymentOption>(
        option: T
    ): PromisifySuccessResult<T, RequestPaymentOption>
    
    requestSubscribeMessage<
        T extends RequestSubscribeMessageOption = RequestSubscribeMessageOption
    >(
        option: T
    ): PromisifySuccessResult<T, RequestSubscribeMessageOption>
    
    revokePrivacySetting(option?: RevokePrivacySettingOption): void
    
    setEnableAdSplash(option: SetEnableAdSplashOption): void
    
    setSaaAUserId(args: SetSaaAUserIdOption): void
    
    shareFile(option: ShareFileOption): void
    
    shareImageMessage<
        T extends ShareImageMessageOption = ShareImageMessageOption
    >(
        option: T
    ): PromisifySuccessResult<T, ShareImageMessageOption>
    
    shareMiniProgramMessage<
        T extends ShareMiniProgramMessageOption = ShareMiniProgramMessageOption
    >(
        option: T
    ): PromisifySuccessResult<T, ShareMiniProgramMessageOption>
    
    shareTextMessage<T extends ShareTextMessageOption = ShareTextMessageOption>(
        option: T
    ): PromisifySuccessResult<T, ShareTextMessageOption>
    
    shareVideoMessage<
        T extends ShareVideoMessageOption = ShareVideoMessageOption
    >(
        option: T
    ): PromisifySuccessResult<T, ShareVideoMessageOption>
    
    shareWebPageMessage<
        T extends ShareWebPageMessageOption = ShareWebPageMessageOption
    >(
        option: T
    ): PromisifySuccessResult<T, ShareWebPageMessageOption>
    
    showStatusBar(option?: ShowStatusBarOption): void
    
    unRegistOpenURL(
        
        callback: RegistOpenURLCallback
    ): void
    IAP: IAP
}


type AddPaymentByProductIdentifiersCompleteCallback = (
    res: GeneralCallbackResult
) => void

type AddPaymentByProductIdentifiersFailCallback = (
    res: GeneralCallbackResult
) => void

type AddPaymentByProductIdentifiersSuccessCallback = (
    res: GeneralCallbackResult
) => void

type AgreePrivacyAuthorizationCompleteCallback = (
    res: GeneralCallbackResult
) => void

type AgreePrivacyAuthorizationFailCallback = (
    res: GeneralCallbackResult
) => void

type AgreePrivacyAuthorizationSuccessCallback = (
    res: GeneralCallbackResult
) => void

type BindAppleCompleteCallback = (res: IdaasError) => void

type BindAppleFailCallback = (res: IdaasError) => void

type BindAppleSuccessCallback = (res: IdaasError) => void

type BindPhoneCompleteCallback = (res: IdaasError) => void

type BindPhoneFailCallback = (res: IdaasError) => void

type BindPhoneSuccessCallback = (res: IdaasError) => void

type BindWeixinCompleteCallback = (res: IdaasError) => void

type BindWeixinFailCallback = (res: IdaasError) => void

type BindWeixinSuccessCallback = (res: IdaasError) => void

type CanMakePaymentsCompleteCallback = (res: GeneralCallbackResult) => void

type CanMakePaymentsFailCallback = (res: GeneralCallbackResult) => void

type CanMakePaymentsSuccessCallback = (res: GeneralCallbackResult) => void

type CheckBindInfoCompleteCallback = (res: IdaasError) => void

type CheckBindInfoFailCallback = (res: IdaasError) => void

type CheckBindInfoSuccessCallback = (
    result: CheckBindInfoSuccessCallbackResult
) => void

type ChooseFileCompleteCallback = (res: GeneralCallbackResult) => void

type ChooseFileFailCallback = (res: GeneralCallbackResult) => void

type ChooseFileSuccessCallback = (
    result: ChooseFileSuccessCallbackResult
) => void

type CloseAppCompleteCallback = (res: GeneralCallbackResult) => void

type CloseAppFailCallback = (res: GeneralCallbackResult) => void

type CloseAppModuleCompleteCallback = (res: GeneralCallbackResult) => void

type CloseAppModuleFailCallback = (res: GeneralCallbackResult) => void

type CloseAppModuleSuccessCallback = (res: GeneralCallbackResult) => void

type CloseAppSuccessCallback = (res: GeneralCallbackResult) => void

type CopyNativeFileToWxCompleteCallback = (res: GeneralCallbackResult) => void

type CopyNativeFileToWxFailCallback = (res: GeneralCallbackResult) => void

type CopyNativeFileToWxSuccessCallback = (res: GeneralCallbackResult) => void

type CopyWxFileToNativeCompleteCallback = (res: GeneralCallbackResult) => void

type CopyWxFileToNativeFailCallback = (res: GeneralCallbackResult) => void

type CopyWxFileToNativeSuccessCallback = (res: GeneralCallbackResult) => void

type FinishTransactionCompleteCallback = (res: GeneralCallbackResult) => void

type FinishTransactionFailCallback = (res: GeneralCallbackResult) => void

type FinishTransactionSuccessCallback = (res: GeneralCallbackResult) => void

type GetAppStoreReceiptDataCompleteCallback = (
    res: GeneralCallbackResult
) => void

type GetAppStoreReceiptDataFailCallback = (res: GeneralCallbackResult) => void

type GetAppStoreReceiptDataSuccessCallback = (
    res: GeneralCallbackResult
) => void

type GetAppStoreReceiptURLCompleteCallback = (
    res: GeneralCallbackResult
) => void

type GetAppStoreReceiptURLFailCallback = (res: GeneralCallbackResult) => void

type GetAppStoreReceiptURLSuccessCallback = (res: GeneralCallbackResult) => void

type GetMetaDataCompleteCallback = (res: GeneralCallbackResult) => void

type GetMetaDataFailCallback = (res: GeneralCallbackResult) => void

type GetMetaDataSuccessCallback = (res: GeneralCallbackResult) => void

type GetPrivacySettingCompleteCallback = (res: GeneralCallbackResult) => void

type GetPrivacySettingFailCallback = (res: GeneralCallbackResult) => void

type GetPrivacySettingSuccessCallback = (res: GeneralCallbackResult) => void

type GetSDKVersionCompleteCallback = (res: GeneralCallbackResult) => void

type GetSDKVersionFailCallback = (res: GeneralCallbackResult) => void

type GetSDKVersionSuccessCallback = (res: GeneralCallbackResult) => void

type GetStorefrontCompleteCallback = (res: GeneralCallbackResult) => void

type GetStorefrontFailCallback = (res: GeneralCallbackResult) => void

type GetStorefrontSuccessCallback = (res: GeneralCallbackResult) => void

type GetTransactionsCompleteCallback = (res: GeneralCallbackResult) => void

type GetTransactionsFailCallback = (res: GeneralCallbackResult) => void

type GetTransactionsSuccessCallback = (res: GeneralCallbackResult) => void

type GoogleLoginCompleteCallback = (res: GeneralCallbackResult) => void

type GoogleLoginFailCallback = (res: GeneralCallbackResult) => void

type GoogleLoginSuccessCallback = (
    result: GoogleLoginSuccessCallbackResult
) => void

type GoogleLogoutCompleteCallback = (res: GeneralCallbackResult) => void

type GoogleLogoutFailCallback = (res: GeneralCallbackResult) => void

type GoogleLogoutSuccessCallback = (res: GeneralCallbackResult) => void

type GoogleRestoreLoginCompleteCallback = (res: GeneralCallbackResult) => void

type GoogleRestoreLoginFailCallback = (res: GeneralCallbackResult) => void

type GoogleRestoreLoginSuccessCallback = (
    result: GoogleLoginSuccessCallbackResult
) => void

type HasWechatInstallCompleteCallback = (res: GeneralCallbackResult) => void

type HasWechatInstallFailCallback = (res: GeneralCallbackResult) => void

type HasWechatInstallSuccessCallback = (res: GeneralCallbackResult) => void

type HideStatusBarCompleteCallback = (res: GeneralCallbackResult) => void

type HideStatusBarFailCallback = (res: GeneralCallbackResult) => void

type HideStatusBarSuccessCallback = (res: GeneralCallbackResult) => void

type InstallAppCompleteCallback = (res: GeneralCallbackResult) => void

type InstallAppFailCallback = (res: GeneralCallbackResult) => void

type InstallAppSuccessCallback = (res: GeneralCallbackResult) => void

type JumpToAppStoreCompleteCallback = (res: GeneralCallbackResult) => void

type JumpToAppStoreFailCallback = (res: GeneralCallbackResult) => void

type JumpToAppStoreSuccessCallback = (res: GeneralCallbackResult) => void

type JumpToGooglePlayCompleteCallback = (res: GeneralCallbackResult) => void

type JumpToGooglePlayFailCallback = (res: GeneralCallbackResult) => void

type JumpToGooglePlaySuccessCallback = (res: GeneralCallbackResult) => void

type LaunchMiniProgramCompleteCallback = (res: GeneralCallbackResult) => void

type LaunchMiniProgramFailCallback = (res: GeneralCallbackResult) => void

type LaunchMiniProgramSuccessCallback = (res: GeneralCallbackResult) => void

type LoadNativePluginCompleteCallback = (res: GeneralCallbackResult) => void

type LoadNativePluginFailCallback = (res: GeneralCallbackResult) => void

type LoadNativePluginSuccessCallback = (plugin: any) => void

type LoginCompleteCallback = (res: GeneralCallbackResult) => void

type LoginFailCallback = (res: GeneralCallbackResult) => void

type LoginSuccessCallback = (res: GeneralCallbackResult) => void

type OffAdSplashErrorCompleteCallback = (res: GeneralCallbackResult) => void

type OffAdSplashErrorFailCallback = (res: GeneralCallbackResult) => void

type OffAdSplashErrorSuccessCallback = (res: GeneralCallbackResult) => void

type OffOpensdkLogCompleteCallback = (res: GeneralCallbackResult) => void

type OffOpensdkLogFailCallback = (res: GeneralCallbackResult) => void

type OffOpensdkLogSuccessCallback = (res: GeneralCallbackResult) => void

type OnAdSplashErrorCompleteCallback = (res: GeneralCallbackResult) => void

type OnAdSplashErrorFailCallback = (res: GeneralCallbackResult) => void

type OnAdSplashErrorSuccessCallback = (res: GeneralCallbackResult) => void

type OnOpensdkLogCompleteCallback = (res: GeneralCallbackResult) => void

type OnOpensdkLogFailCallback = (res: GeneralCallbackResult) => void

type OnOpensdkLogSuccessCallback = (res: GeneralCallbackResult) => void

type OpenAppStoreRatingCompleteCallback = (res: GeneralCallbackResult) => void

type OpenAppStoreRatingFailCallback = (res: GeneralCallbackResult) => void

type OpenAppStoreRatingSuccessCallback = (res: GeneralCallbackResult) => void

type OpenCustomerServiceChatCompleteCallback = (
    res: GeneralCallbackResult
) => void

type OpenCustomerServiceChatFailCallback = (res: GeneralCallbackResult) => void

type OpenCustomerServiceChatSuccessCallback = (
    res: GeneralCallbackResult
) => void

type OpenSaaAActionSheetCompleteCallback = (res: GeneralCallbackResult) => void

type OpenSaaAActionSheetFailCallback = (res: GeneralCallbackResult) => void

type OpenSaaAActionSheetSuccessCallback = (res: GeneralCallbackResult) => void

type OpenUrlCompleteCallback = (res: GeneralCallbackResult) => void

type OpenUrlFailCallback = (res: GeneralCallbackResult) => void

type OpenUrlSuccessCallback = (res: GeneralCallbackResult) => void

type RegistOpenURLCallback = (
    
    action: 'scheme' | 'webpageURL' | 'opensdkOnRep',
    
    data: any
) => void

type RequestPaymentCompleteCallback = (res: GeneralCallbackResult) => void

type RequestPaymentFailCallback = (res: GeneralCallbackResult) => void

type RequestPaymentSuccessCallback = (res: GeneralCallbackResult) => void

type RequestSKProductsCompleteCallback = (res: GeneralCallbackResult) => void

type RequestSKProductsFailCallback = (res: GeneralCallbackResult) => void

type RequestSKProductsSuccessCallback = (res: GeneralCallbackResult) => void

type RequestSKReceiptRefreshRequestCompleteCallback = (
    res: GeneralCallbackResult
) => void

type RequestSKReceiptRefreshRequestFailCallback = (
    res: GeneralCallbackResult
) => void

type RequestSKReceiptRefreshRequestSuccessCallback = (
    res: GeneralCallbackResult
) => void

type RequestSubscribeMessageCompleteCallback = (
    res: GeneralCallbackResult
) => void

type RequestSubscribeMessageFailCallback = (res: GeneralCallbackResult) => void

type RequestSubscribeMessageSuccessCallback = (
    res: GeneralCallbackResult
) => void

type RestoreCompletedTransactionsCompleteCallback = (
    res: GeneralCallbackResult
) => void

type RestoreCompletedTransactionsFailCallback = (
    res: GeneralCallbackResult
) => void

type RestoreCompletedTransactionsSuccessCallback = (
    res: GeneralCallbackResult
) => void

type RevokePrivacySettingCompleteCallback = (res: GeneralCallbackResult) => void

type RevokePrivacySettingFailCallback = (res: GeneralCallbackResult) => void

type RevokePrivacySettingSuccessCallback = (res: GeneralCallbackResult) => void

type ShareFileCompleteCallback = (res: GeneralCallbackResult) => void

type ShareFileFailCallback = (res: GeneralCallbackResult) => void

type ShareFileSuccessCallback = (res: GeneralCallbackResult) => void

type ShareImageMessageCompleteCallback = (res: GeneralCallbackResult) => void

type ShareImageMessageFailCallback = (res: GeneralCallbackResult) => void

type ShareImageMessageSuccessCallback = (res: GeneralCallbackResult) => void

type ShareMiniProgramMessageCompleteCallback = (
    res: GeneralCallbackResult
) => void

type ShareMiniProgramMessageFailCallback = (res: GeneralCallbackResult) => void

type ShareMiniProgramMessageSuccessCallback = (
    res: GeneralCallbackResult
) => void

type ShareTextMessageCompleteCallback = (res: GeneralCallbackResult) => void

type ShareTextMessageFailCallback = (res: GeneralCallbackResult) => void

type ShareTextMessageSuccessCallback = (res: GeneralCallbackResult) => void

type ShareVideoMessageCompleteCallback = (res: GeneralCallbackResult) => void

type ShareVideoMessageFailCallback = (res: GeneralCallbackResult) => void

type ShareVideoMessageSuccessCallback = (res: GeneralCallbackResult) => void

type ShareWebPageMessageCompleteCallback = (res: GeneralCallbackResult) => void

type ShareWebPageMessageFailCallback = (res: GeneralCallbackResult) => void

type ShareWebPageMessageSuccessCallback = (res: GeneralCallbackResult) => void

type ShowStatusBarCompleteCallback = (res: GeneralCallbackResult) => void

type ShowStatusBarFailCallback = (res: GeneralCallbackResult) => void

type ShowStatusBarSuccessCallback = (res: GeneralCallbackResult) => void
interface IAP {
    
    requestSKProducts(option: RequestSKProductsOption): IAnyObject
    
    canMakePayments(option?: CanMakePaymentsOption): boolean
    
    addPaymentByProductIdentifiers(
        option: AddPaymentByProductIdentifiersOption
    ): void
    
    addTransactionObserver(
        
        option: AddTransactionObserverOption
    ): void
    
    cancelRequestSKProducts(
        
        object: IAnyObject
    ): void
    
    finishTransaction(option: FinishTransactionOption): void
    
    getAppStoreReceiptData(option: GetAppStoreReceiptDataOption): void
    
    getAppStoreReceiptURL(option: GetAppStoreReceiptURLOption): void
    
    getStorefront(option: GetStorefrontOption): void
    
    getTransactions(option: GetTransactionsOption): void
    
    removeTransactionObserver(
        
        option: AddTransactionObserverOption
    ): void
    
    requestSKReceiptRefreshRequest(
        option: RequestSKReceiptRefreshRequestOption
    ): void
    
    restoreCompletedTransactions(
        option: RestoreCompletedTransactionsOption
    ): void
}
interface GeneralCallbackResult {
    
    errMsg: string
    errCode: number
}
interface AsyncMethodOptionLike {
    success?: (...args: any[]) => void
}
type PromisifySuccessResult<P, T extends AsyncMethodOptionLike> = P extends {
    success: any
}
    ? void
    : P extends { fail: any }
    ? void
    : P extends { complete: any }
    ? void
    : Promise<Parameters<Exclude<T['success'], undefined>>[0]>
