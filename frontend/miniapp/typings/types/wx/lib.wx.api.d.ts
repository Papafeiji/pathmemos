

/// <reference path="./lib.wx.xr-frame.d.ts" />

declare namespace WechatMiniprogram {
    interface AccessOption {
        
        path: string
        
        complete?: AccessCompleteCallback
        
        fail?: AccessFailCallback
        
        success?: AccessSuccessCallback
    }
    
    interface AccountInfo {
        
        miniProgram: MiniProgram
        
        plugin: Plugin
    }
    interface AddArcOption {
        
        end: MapPostion
        
        id: number
        
        start: MapPostion
        
        angle?: number
        
        color?: number
        
        complete?: AddArcCompleteCallback
        
        fail?: AddArcFailCallback
        
        pass?: MapPostion
        
        success?: AddArcSuccessCallback
        
        width?: number
    }
    interface AddCardOption {
        
        cardList: AddCardRequestInfo[]
        
        complete?: AddCardCompleteCallback
        
        fail?: AddCardFailCallback
        
        success?: AddCardSuccessCallback
    }
    
    interface AddCardRequestInfo {
        
        cardExt: string
        
        cardId: string
    }
    
    interface AddCardResponseInfo {
        
        cardExt: string
        
        cardId: string
        
        code: string
        
        isSuccess: boolean
    }
    interface AddCardSuccessCallbackResult {
        
        cardList: AddCardResponseInfo[]
        errMsg: string
    }
    interface AddCustomLayerOption {
        
        layerId: string
        
        complete?: AddCustomLayerCompleteCallback
        
        fail?: AddCustomLayerFailCallback
        
        success?: AddCustomLayerSuccessCallback
    }
    interface AddFileToFavoritesOption {
        
        filePath: string
        
        complete?: AddFileToFavoritesCompleteCallback
        
        fail?: AddFileToFavoritesFailCallback
        
        fileName?: string
        
        success?: AddFileToFavoritesSuccessCallback
    }
    interface AddGroundOverlayOption {
        
        bounds: MapBounds
        
        id: string
        
        src: string
        
        complete?: AddGroundOverlayCompleteCallback
        
        fail?: AddGroundOverlayFailCallback
        
        opacity?: number
        
        success?: AddGroundOverlaySuccessCallback
        
        visible?: boolean
        
        zIndex?: number
    }
    interface AddMarkersOption {
        
        markers: any[]
        
        clear?: boolean
        
        complete?: AddMarkersCompleteCallback
        
        fail?: AddMarkersFailCallback
        
        success?: AddMarkersSuccessCallback
    }
    interface AddPhoneCalendarOption {
        
        startTime: number
        
        title: string
        
        alarm?: boolean
        
        alarmOffset?: number
        
        allDay?: boolean
        
        complete?: AddPhoneCalendarCompleteCallback
        
        description?: string
        
        endTime?: string
        
        fail?: AddPhoneCalendarFailCallback
        
        location?: string
        
        success?: AddPhoneCalendarSuccessCallback
    }
    interface AddPhoneContactOption {
        
        firstName: string
        
        addressCity?: string
        
        addressCountry?: string
        
        addressPostalCode?: string
        
        addressState?: string
        
        addressStreet?: string
        
        complete?: AddPhoneContactCompleteCallback
        
        email?: string
        
        fail?: AddPhoneContactFailCallback
        
        homeAddressCity?: string
        
        homeAddressCountry?: string
        
        homeAddressPostalCode?: string
        
        homeAddressState?: string
        
        homeAddressStreet?: string
        
        homeFaxNumber?: string
        
        homePhoneNumber?: string
        
        hostNumber?: string
        
        lastName?: string
        
        middleName?: string
        
        mobilePhoneNumber?: string
        
        nickName?: string
        
        organization?: string
        
        photoFilePath?: string
        
        remark?: string
        
        success?: AddPhoneContactSuccessCallback
        
        title?: string
        
        url?: string
        
        weChatNumber?: string
        
        workAddressCity?: string
        
        workAddressCountry?: string
        
        workAddressPostalCode?: string
        
        workAddressState?: string
        
        workAddressStreet?: string
        
        workFaxNumber?: string
        
        workPhoneNumber?: string
    }
    interface AddPhoneRepeatCalendarOption {
        
        startTime: number
        
        title: string
        
        alarm?: boolean
        
        alarmOffset?: number
        
        allDay?: boolean
        
        complete?: AddPhoneRepeatCalendarCompleteCallback
        
        description?: string
        
        endTime?: string
        
        fail?: AddPhoneRepeatCalendarFailCallback
        
        location?: string
        
        repeatEndTime?: number
        
        repeatInterval?: 'day' | 'week' | 'month' | 'year'
        
        success?: AddPhoneRepeatCalendarSuccessCallback
    }
    interface AddServiceOption {
        
        service: BLEPeripheralService
        
        complete?: AddServiceCompleteCallback
        
        fail?: AddServiceFailCallback
        
        success?: AddServiceSuccessCallback
    }
    interface AddVideoToFavoritesOption {
        
        videoPath: string
        
        complete?: AddVideoToFavoritesCompleteCallback
        
        fail?: AddVideoToFavoritesFailCallback
        
        success?: AddVideoToFavoritesSuccessCallback
        
        thumbPath?: string
    }
    interface AddVisualLayerOption {
        
        layerId: string
        
        complete?: AddVisualLayerCompleteCallback
        
        fail?: AddVisualLayerFailCallback
        
        interval?: number
        
        opacity?: number
        
        success?: AddVisualLayerSuccessCallback
        
        zIndex?: number
    }
    
    interface AdvertiseReqObj {
        
        beacon?: BeaconInfoObj
        
        connectable?: boolean
        
        deviceName?: string
        
        manufacturerData?: ManufacturerData[]
        
        serviceUuids?: string[]
    }
    
    interface AnimationExportResult {
        actions: IAnyObject[]
    }
    
    interface AnimationOption {
        
        duration?: number
        
        timingFunc?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    }
    interface AppAuthorizeSetting {
        
        albumAuthorized: 'authorized' | 'denied' | 'not determined'
        
        bluetoothAuthorized: 'authorized' | 'denied' | 'not determined'
        
        cameraAuthorized: 'authorized' | 'denied' | 'not determined'
        
        locationAuthorized: 'authorized' | 'denied' | 'not determined'
        
        locationReducedAccuracy: boolean
        
        microphoneAuthorized: 'authorized' | 'denied' | 'not determined'
        
        notificationAlertAuthorized: 'authorized' | 'denied' | 'not determined'
        
        notificationAuthorized: 'authorized' | 'denied' | 'not determined'
        
        notificationBadgeAuthorized: 'authorized' | 'denied' | 'not determined'
        
        notificationSoundAuthorized: 'authorized' | 'denied' | 'not determined'
        
        phoneCalendarAuthorized: 'authorized' | 'denied' | 'not determined'
    }
    interface AppBaseInfo {
        
        SDKVersion: string
        
        enableDebug: boolean
        
        host: AppBaseInfoHost
        
        language: string
        
        version: string
        
        theme?: 'dark' | 'light'
    }
    
    interface AppBaseInfoHost {
        
        appId: string
    }
    interface AppendFileOption {
        
        data: string | ArrayBuffer
        
        filePath: string
        
        complete?: AppendFileCompleteCallback
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        fail?: AppendFileFailCallback
        
        success?: AppendFileSuccessCallback
    }
    interface ApplyBlusherStickMakeupOption {
        
        alpha: number
        blendMode: string
        
        path: string
        
        complete?: ApplyBlusherStickMakeupCompleteCallback
        
        fail?: ApplyBlusherStickMakeupFailCallback
        
        success?: ApplyBlusherStickMakeupSuccessCallback
    }
    interface ApplyEyeBrowMakeupOption {
        
        alpha: number
        blendMode: string
        path: string
        shrinkRate: number
        
        complete?: ApplyEyeBrowMakeupCompleteCallback
        
        fail?: ApplyEyeBrowMakeupFailCallback
        
        success?: ApplyEyeBrowMakeupSuccessCallback
    }
    interface ApplyEyeShadowMakeupOption {
        
        alpha: number
        blendMode: string
        
        path: string
        
        complete?: ApplyEyeShadowMakeupCompleteCallback
        
        fail?: ApplyEyeShadowMakeupFailCallback
        
        shimmerPosition?: string
        
        shimmerPositionMD5?: string
        
        success?: ApplyEyeShadowMakeupSuccessCallback
    }
    interface ApplyFaceContourMakeupOption {
        alpha: number
        
        path: string
        
        complete?: ApplyFaceContourMakeupCompleteCallback
        
        fail?: ApplyFaceContourMakeupFailCallback
        
        success?: ApplyFaceContourMakeupSuccessCallback
    }
    interface ApplyFilterOption {
        
        alpha: number
        
        path: string
        
        complete?: ApplyFilterCompleteCallback
        
        fail?: ApplyFilterFailCallback
        
        md5?: string
        
        success?: ApplyFilterSuccessCallback
    }
    interface ApplyLipStickMakeupOption {
        
        alpha: number
        blendMode: string
        faceModel: string
        path: string
        shimmerPath: string
        shimmerType: string
        
        complete?: ApplyLipStickMakeupCompleteCallback
        
        fail?: ApplyLipStickMakeupFailCallback
        
        success?: ApplyLipStickMakeupSuccessCallback
    }
    interface ApplyStickerOption {
        
        stickers: Sticker[]
        
        type: string
        
        complete?: ApplyStickerCompleteCallback
        
        fail?: ApplyStickerFailCallback
        
        success?: ApplyStickerSuccessCallback
        templateTransSet?: IAnyObject
    }
    interface Asset {
        src: string
        
        type: 'font' | 'image'
    }
    
    interface AudioBuffer {
        
        duration: number
        
        length: number
        
        numberOfChannels: number
        
        sampleRate: number
        
        copyFromChannel(): void
        
        copyToChannel(
            
            source: Float32Array,
            
            channelNumber: number,
            
            startInChannel: number
        ): void
        
        getChannelData(
            
            channel: number
        ): Float32Array
    }
    
    interface AudioParam {
        
        defaultValue: number
        
        maxValue: number
        
        minValue: number
        
        value: number
    }
    interface AuthPrivateMessageOption {
        
        shareTicket: string
        
        complete?: AuthPrivateMessageCompleteCallback
        
        fail?: AuthPrivateMessageFailCallback
        
        success?: AuthPrivateMessageSuccessCallback
    }
    interface AuthPrivateMessageSuccessCallbackResult {
        
        encryptedData: string
        
        errMsg: string
        
        iv: string
        
        valid: boolean
    }
    
    interface AuthSetting {
        
        'scope.addPhoneCalendar'?: boolean
        
        'scope.addPhoneContact'?: boolean
        
        'scope.address'?: boolean
        
        'scope.bluetooth'?: boolean
        
        'scope.camera'?: boolean
        
        'scope.invoice'?: boolean
        
        'scope.invoiceTitle'?: boolean
        
        'scope.record'?: boolean
        
        'scope.userFuzzyLocation'?: boolean
        
        'scope.userInfo'?: boolean
        
        'scope.userLocation'?: boolean
        
        'scope.werun'?: boolean
        
        'scope.writePhotosAlbum'?: boolean
    }
    interface AuthorizeForMiniProgramOption {
        
        scope: 'scope.record' | 'scope.writePhotosAlbum' | 'scope.camera'
        
        complete?: AuthorizeForMiniProgramCompleteCallback
        
        fail?: AuthorizeForMiniProgramFailCallback
        
        success?: AuthorizeForMiniProgramSuccessCallback
    }
    interface AuthorizeOption {
        
        scope: string
        
        complete?: AuthorizeCompleteCallback
        
        fail?: AuthorizeFailCallback
        
        success?: AuthorizeSuccessCallback
    }
    
    interface BLECharacteristic {
        
        properties: BLECharacteristicProperties
        
        uuid: string
    }
    
    interface BLECharacteristicProperties {
        
        indicate: boolean
        
        notify: boolean
        
        read: boolean
        
        write: boolean
        
        writeDefault: boolean
        
        writeNoResponse: boolean
    }
    interface BLEPeripheralServerCloseOption {
        
        complete?: SocketTaskCloseCompleteCallback
        
        fail?: SocketTaskCloseFailCallback
        
        success?: SocketTaskCloseSuccessCallback
    }
    
    interface BLEPeripheralService {
        
        characteristics: Characteristic[]
        
        uuid: string
    }
    
    interface BLEService {
        
        isPrimary: boolean
        
        uuid: string
    }
    
    interface BackgroundAudioManager {
        
        buffered: number
        
        coverImgUrl: string
        
        currentTime: number
        
        duration: number
        
        epname: string
        
        paused: boolean
        
        playbackRate: number
        
        protocol: string
        
        referrerPolicy: string
        
        singer: string
        
        src: string
        
        startTime: number
        
        title: string
        
        webUrl: string
        
        onCanplay(
            
            listener: OnCanplayCallback
        ): void
        
        onEnded(
            
            listener: OnEndedCallback
        ): void
        
        onError(
            
            listener: BackgroundAudioManagerOnErrorCallback
        ): void
        
        onNext(
            
            listener: OnNextCallback
        ): void
        
        onPause(
            
            listener: OnPauseCallback
        ): void
        
        onPlay(
            
            listener: OnPlayCallback
        ): void
        
        onPrev(
            
            listener: OnPrevCallback
        ): void
        
        onSeeked(
            
            listener: OnSeekedCallback
        ): void
        
        onSeeking(
            
            listener: OnSeekingCallback
        ): void
        
        onStop(
            
            listener: InnerAudioContextOnStopCallback
        ): void
        
        onTimeUpdate(
            
            listener: OnTimeUpdateCallback
        ): void
        
        onWaiting(
            
            listener: OnWaitingCallback
        ): void
        
        pause(): void
        
        play(): void
        
        seek(
            
            currentTime: number
        ): void
        
        stop(): void
    }
    interface BatchGetStorageOption {
        
        keyList: string[]
        
        complete?: BatchGetStorageCompleteCallback
        
        fail?: BatchGetStorageFailCallback
        
        success?: BatchGetStorageSuccessCallback
    }
    interface BatchSetStorageOption {
        
        kvList: any[]
        
        complete?: BatchSetStorageCompleteCallback
        
        fail?: BatchSetStorageFailCallback
        
        success?: BatchSetStorageSuccessCallback
    }
    
    interface BeaconInfo {
        
        accuracy: number
        
        major: number
        
        minor: number
        
        proximity: 0 | 1 | 2 | 3
        
        rssi: number
        
        uuid: string
    }
    
    interface BeaconInfoObj {
        
        major: number
        
        minor: number
        
        uuid: string
        
        measuredPower?: number
    }
    interface BindWifiOption {
        
        BSSID: string
    }
    interface BlueToothDevice {
        
        RSSI: number
        
        advertisData: ArrayBuffer
        
        advertisServiceUUIDs: string[]
        
        connectable: boolean
        
        deviceId: string
        
        localName: string
        
        name: string
        
        serviceData: IAnyObject
    }
    
    interface BluetoothDeviceInfo {
        
        deviceId: string
        
        name: string
    }
    interface BlurOption {
        
        complete?: BlurCompleteCallback
        
        fail?: BlurFailCallback
        
        success?: BlurSuccessCallback
    }
    
    interface BodyTrack {
        
        mode: 1 | 2
    }
    interface BoundingClientRectCallbackResult {
        
        bottom: number
        
        dataset: IAnyObject
        
        height: number
        
        id: string
        
        left: number
        
        right: number
        
        top: number
        
        width: number
    }
    
    interface BoundingClientRectResult {
        
        bottom: number
        
        height: number
        
        left: number
        
        right: number
        
        top: number
        
        width: number
    }
    
    interface BufferSourceNode {
        
        buffer: AudioBuffer
        
        loop?: boolean
        
        loopEnd?: number
        
        loopStart?: number
        
        onended?: (...args: any[]) => any
        
        playbackRate?: AudioParam
        
        connect(
            
            destination: AudioNode | AudioParam
        ): void
        
        disconnect(): void
        
        start(
            
            when?: number,
            
            offset?: number,
            
            duration?: number
        ): void
        
        stop(
            
            when?: number
        ): void
    }
    
    interface CacheManager {
        
        maxAge: number
        
        mode: 'weakNetwork' | 'always' | 'none'
        
        origin: string
        
        state: 0 | 1 | 2
        
        addRules(
            
            rules: IAnyObject
        ): string[]
        
        clearCaches(): void
        
        clearRules(): void
        
        deleteCache(
            
            id: string
        ): void
        
        deleteCaches(
            
            ids: string[]
        ): void
        
        deleteRule(
            
            id: string
        ): void
        
        deleteRules(
            
            ids: string[]
        ): void
        
        off(
            
            eventName: string,
            
            handler: (...args: any[]) => any
        ): void
        
        on(
            
            eventName: 'request' | 'enterWeakNetwork' | 'exitWeakNetwork',
            
            handler: (...args: any[]) => any
        ): void
        
        start(): void
        
        stop(): void
        
        match(
            
            evt: IAnyObject
        ): MatchCache
        
        addRule(
            
            rule: IAnyObject
        ): string
    }
    interface CameraContextSetZoomOption {
        
        zoom: number
        
        complete?: SetZoomCompleteCallback
        
        fail?: SetZoomFailCallback
        
        success?: CameraContextSetZoomSuccessCallback
    }
    interface CameraContextStartRecordOption {
        
        complete?: StartRecordCompleteCallback
        
        fail?: StartRecordFailCallback
        
        selfieMirror?: boolean
        
        success?: CameraContextStartRecordSuccessCallback
        
        timeout?: number
        
        timeoutCallback?: StartRecordTimeoutCallback
    }
    interface CameraContextStopRecordOption {
        
        complete?: StopRecordCompleteCallback
        
        compressed?: boolean
        
        fail?: StopRecordFailCallback
        
        success?: CameraContextStopRecordSuccessCallback
    }
    interface CameraFrameListenerStartOption {
        
        complete?: StartCompleteCallback
        
        fail?: StartFailCallback
        
        success?: StartSuccessCallback
        
        worker?: Worker
    }
    
    interface Canvas {
        
        height: number
        
        width: number
        
        cancelAnimationFrame(requestID: number): void
        
        createImageData(): ImageData
        
        createImage(): Image
        
        createPath2D(
            
            path: Path2D
        ): Path2D
        
        getContext(
            
            contextType: '2d'
        ): CanvasRenderingContext.CanvasRenderingContext2D
        
        getContext(
            
            contextType: 'webgl'
        ): CanvasRenderingContext.WebGLRenderingContext
        
        getContext(
            
            contextType: 'webgl2'
        ): CanvasRenderingContext.WebGL2RenderingContext
        
        requestAnimationFrame(
            
            callback: (...args: any[]) => any
        ): number
        
        toDataURL(
            
            type: string,
            
            encoderOptions: number
        ): string
    }
    
    interface CanvasContext {
        
        fillStyle: string | CanvasGradient
        
        font: string
        
        globalAlpha: number
        
        globalCompositeOperation: string
        
        lineCap: string
        
        lineDashOffset: number
        
        lineJoin: 'bevel' | 'round' | 'miter'
        
        lineWidth: number
        
        miterLimit: number
        
        shadowBlur: number
        
        shadowColor: number
        
        shadowOffsetX: number
        
        shadowOffsetY: number
        
        strokeStyle: string | CanvasGradient
        
        arc(
            
            x: number,
            
            y: number,
            
            r: number,
            
            sAngle: number,
            
            eAngle: number,
            
            counterclockwise?: boolean
        ): void
        
        arcTo(
            
            x1: number,
            
            y1: number,
            
            x2: number,
            
            y2: number,
            
            radius: number
        ): void
        
        beginPath(): void
        
        bezierCurveTo(
            
            cp1x: number,
            
            cp1y: number,
            
            cp2x: number,
            
            cp2y: number,
            
            x: number,
            
            y: number
        ): void
        
        clearRect(
            
            x: number,
            
            y: number,
            
            width: number,
            
            height: number
        ): void
        
        clip(): void
        
        closePath(): void
        
        createPattern(
            
            image: string,
            
            repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
        ): void
        
        draw(
            
            reserve?: boolean,
            
            callback?: (...args: any[]) => any
        ): void
        
        drawImage(
            
            imageResource: string,
            
            dx: number,
            
            dy: number
        ): void
        
        drawImage(
            
            imageResource: string,
            
            dx: number,
            
            dy: number,
            
            dWidth: number,
            
            dHeight: number
        ): void
        
        drawImage(
            
            imageResource: string,
            
            sx: number,
            
            sy: number,
            
            sWidth: number,
            
            sHeight: number,
            
            dx: number,
            
            dy: number,
            
            dWidth: number,
            
            dHeight: number
        ): void
        
        fill(): void
        
        fillRect(
            
            x: number,
            
            y: number,
            
            width: number,
            
            height: number
        ): void
        
        fillText(
            
            text: string,
            
            x: number,
            
            y: number,
            
            maxWidth?: number
        ): void
        
        lineTo(
            
            x: number,
            
            y: number
        ): void
        
        moveTo(
            
            x: number,
            
            y: number
        ): void
        
        quadraticCurveTo(
            
            cpx: number,
            
            cpy: number,
            
            x: number,
            
            y: number
        ): void
        
        rect(
            
            x: number,
            
            y: number,
            
            width: number,
            
            height: number
        ): void
        
        restore(): void
        
        rotate(
            
            rotate: number
        ): void
        
        save(): void
        
        scale(
            
            scaleWidth: number,
            
            scaleHeight: number
        ): void
        
        setFillStyle(
            
            color: string | CanvasGradient
        ): void
        
        setFontSize(
            
            fontSize: number
        ): void
        
        setGlobalAlpha(
            
            alpha: number
        ): void
        
        setLineCap(
            
            lineCap: 'butt' | 'round' | 'square'
        ): void
        
        setLineDash(
            
            pattern: number[],
            
            offset: number
        ): void
        
        setLineJoin(
            
            lineJoin: 'bevel' | 'round' | 'miter'
        ): void
        
        setLineWidth(
            
            lineWidth: number
        ): void
        
        setMiterLimit(
            
            miterLimit: number
        ): void
        
        setShadow(
            
            offsetX: number,
            
            offsetY: number,
            
            blur: number,
            
            color: string
        ): void
        
        setStrokeStyle(
            
            color: string | CanvasGradient
        ): void
        
        setTextAlign(
            
            align: 'left' | 'center' | 'right'
        ): void
        
        setTextBaseline(
            
            textBaseline: 'top' | 'bottom' | 'middle' | 'normal'
        ): void
        
        setTransform(
            
            scaleX: number,
            
            skewX: number,
            
            skewY: number,
            
            scaleY: number,
            
            translateX: number,
            
            translateY: number
        ): void
        
        stroke(): void
        
        strokeRect(
            
            x: number,
            
            y: number,
            
            width: number,
            
            height: number
        ): void
        
        strokeText(
            
            text: string,
            
            x: number,
            
            y: number,
            
            maxWidth?: number
        ): void
        
        transform(
            
            scaleX: number,
            
            skewX: number,
            
            skewY: number,
            
            scaleY: number,
            
            translateX: number,
            
            translateY: number
        ): void
        
        translate(
            
            x: number,
            
            y: number
        ): void
        
        measureText(
            
            text: string
        ): TextMetrics
        
        createCircularGradient(
            
            x: number,
            
            y: number,
            
            r: number
        ): CanvasGradient
        
        createLinearGradient(
            
            x0: number,
            
            y0: number,
            
            x1: number,
            
            y1: number
        ): CanvasGradient
    }
    interface CanvasGetImageDataOption {
        
        canvasId: string
        
        height: number
        
        width: number
        
        x: number
        
        y: number
        
        complete?: CanvasGetImageDataCompleteCallback
        
        fail?: CanvasGetImageDataFailCallback
        
        success?: CanvasGetImageDataSuccessCallback
    }
    interface CanvasGetImageDataSuccessCallbackResult {
        
        data: Uint8ClampedArray
        
        height: number
        
        width: number
        errMsg: string
    }
    interface CanvasPutImageDataOption {
        
        canvasId: string
        
        data: Uint8ClampedArray
        
        height: number
        
        width: number
        
        x: number
        
        y: number
        
        complete?: CanvasPutImageDataCompleteCallback
        
        fail?: CanvasPutImageDataFailCallback
        
        success?: CanvasPutImageDataSuccessCallback
    }
    interface CanvasToTempFilePathOption {
        
        canvas?: IAnyObject
        
        canvasId?: string
        
        complete?: CanvasToTempFilePathCompleteCallback
        
        destHeight?: number
        
        destWidth?: number
        
        fail?: CanvasToTempFilePathFailCallback
        
        fileType?: 'jpg' | 'png'
        
        height?: number
        
        quality?: number
        
        success?: CanvasToTempFilePathSuccessCallback
        
        width?: number
        
        x?: number
        
        y?: number
    }
    interface CanvasToTempFilePathSuccessCallbackResult {
        
        tempFilePath: string
        errMsg: string
    }
    
    interface Characteristic {
        
        uuid: string
        
        descriptors?: CharacteristicDescriptor[]
        
        permission?: CharacteristicPermission
        
        properties?: CharacteristicProperties
        
        value?: ArrayBuffer
    }
    
    interface CharacteristicDescriptor {
        
        uuid: string
        
        permission?: DescriptorPermission
        
        value?: ArrayBuffer
    }
    
    interface CharacteristicPermission {
        
        readEncryptionRequired?: boolean
        
        readable?: boolean
        
        writeEncryptionRequired?: boolean
        
        writeable?: boolean
    }
    
    interface CharacteristicProperties {
        
        indicate?: boolean
        
        notify?: boolean
        
        read?: boolean
        
        write?: boolean
        
        writeNoResponse?: boolean
    }
    interface CheckIsAddedToMyMiniProgramOption {
        
        complete?: CheckIsAddedToMyMiniProgramCompleteCallback
        
        fail?: CheckIsAddedToMyMiniProgramFailCallback
        
        success?: CheckIsAddedToMyMiniProgramSuccessCallback
    }
    interface CheckIsAddedToMyMiniProgramSuccessCallbackResult {
        
        added: boolean
        errMsg: string
    }
    interface CheckIsOpenAccessibilityOption {
        
        complete?: CheckIsOpenAccessibilityCompleteCallback
        
        fail?: CheckIsOpenAccessibilityFailCallback
        
        success?: CheckIsOpenAccessibilitySuccessCallback
    }
    interface CheckIsOpenAccessibilitySuccessCallbackOption {
        
        open: boolean
        errMsg: string
    }
    interface CheckIsSoterEnrolledInDeviceOption {
        
        checkAuthMode: 'fingerPrint' | 'facial' | 'speech'
        
        complete?: CheckIsSoterEnrolledInDeviceCompleteCallback
        
        fail?: CheckIsSoterEnrolledInDeviceFailCallback
        
        success?: CheckIsSoterEnrolledInDeviceSuccessCallback
    }
    interface CheckIsSoterEnrolledInDeviceSuccessCallbackResult {
        
        errMsg: string
        
        isEnrolled: boolean
    }
    interface CheckIsSupportSoterAuthenticationOption {
        
        complete?: CheckIsSupportSoterAuthenticationCompleteCallback
        
        fail?: CheckIsSupportSoterAuthenticationFailCallback
        
        success?: CheckIsSupportSoterAuthenticationSuccessCallback
    }
    interface CheckIsSupportSoterAuthenticationSuccessCallbackResult {
        
        supportMode: Array<'fingerPrint' | 'facial' | 'speech'>
        errMsg: string
    }
    interface CheckSessionOption {
        
        complete?: CheckSessionCompleteCallback
        
        fail?: CheckSessionFailCallback
        
        success?: CheckSessionSuccessCallback
    }
    interface ChooseAddressOption {
        
        complete?: ChooseAddressCompleteCallback
        
        fail?: ChooseAddressFailCallback
        
        success?: ChooseAddressSuccessCallback
    }
    interface ChooseAddressSuccessCallbackResult {
        
        cityName: string
        
        countyName: string
        
        detailInfo: string
        
        detailInfoNew: string
        
        errMsg: string
        
        nationalCode: string
        
        postalCode: string
        
        provinceName: string
        
        streetName: string
        
        telNumber: string
        
        userName: string
    }
    interface ChooseContactOption {
        
        complete?: ChooseContactCompleteCallback
        
        fail?: ChooseContactFailCallback
        
        success?: ChooseContactSuccessCallback
    }
    interface ChooseContactSuccessCallbackOption {
        
        displayName: string
        
        phoneNumber: string
        
        phoneNumberList: string
        errMsg: string
    }
    
    interface ChooseFile {
        
        name: string
        
        path: string
        
        size: number
        
        time: number
        
        type: 'video' | 'image' | 'file'
    }
    interface ChooseImageOption {
        
        complete?: ChooseImageCompleteCallback
        
        count?: number
        
        fail?: ChooseImageFailCallback
        
        sizeType?: Array<'original' | 'compressed'>
        
        sourceType?: Array<'album' | 'camera'>
        
        success?: ChooseImageSuccessCallback
    }
    interface ChooseImageSuccessCallbackResult {
        
        tempFilePaths: string[]
        
        tempFiles: ImageFile[]
        errMsg: string
    }
    interface ChooseInvoiceOption {
        
        complete?: ChooseInvoiceCompleteCallback
        
        fail?: ChooseInvoiceFailCallback
        
        success?: ChooseInvoiceSuccessCallback
    }
    interface ChooseInvoiceSuccessCallbackResult {
        
        invoiceInfo: string
        errMsg: string
    }
    interface ChooseInvoiceTitleOption {
        
        complete?: ChooseInvoiceTitleCompleteCallback
        
        fail?: ChooseInvoiceTitleFailCallback
        
        success?: ChooseInvoiceTitleSuccessCallback
    }
    interface ChooseInvoiceTitleSuccessCallbackResult {
        
        bankAccount: string
        
        bankName: string
        
        companyAddress: string
        
        errMsg: string
        
        taxNumber: string
        
        telephone: string
        
        title: string
        
        type: 0 | 1
    }
    interface ChooseLicensePlateOption {
        
        complete?: ChooseLicensePlateCompleteCallback
        
        fail?: ChooseLicensePlateFailCallback
        
        success?: ChooseLicensePlateSuccessCallback
    }
    interface ChooseLicensePlateSuccessCallbackResult {
        
        plateNumber: string
        errMsg: string
    }
    interface ChooseLocationOption {
        
        complete?: ChooseLocationCompleteCallback
        
        fail?: ChooseLocationFailCallback
        
        latitude?: number
        
        longitude?: number
        
        success?: ChooseLocationSuccessCallback
    }
    interface ChooseLocationSuccessCallbackResult {
        
        address: string
        
        latitude: number
        
        longitude: number
        
        name: string
        errMsg: string
    }
    interface ChooseMediaOption {
        
        camera?: 'back' | 'front'
        
        complete?: ChooseMediaCompleteCallback
        
        count?: number
        
        fail?: ChooseMediaFailCallback
        
        maxDuration?: number
        
        mediaType?: Array<'image' | 'video' | 'mix'>
        
        sizeType?: string[]
        
        sourceType?: Array<'album' | 'camera'>
        
        success?: ChooseMediaSuccessCallback
    }
    interface ChooseMediaSuccessCallbackResult {
        
        tempFiles: MediaFile[]
        
        type: string
        errMsg: string
    }
    interface ChooseMessageFileOption {
        
        count: number
        
        complete?: ChooseMessageFileCompleteCallback
        
        extension?: string[]
        
        fail?: ChooseMessageFileFailCallback
        
        success?: ChooseMessageFileSuccessCallback
        
        type?: 'all' | 'video' | 'image' | 'file'
    }
    interface ChooseMessageFileSuccessCallbackResult {
        
        tempFiles: ChooseFile[]
        errMsg: string
    }
    interface ChoosePoiOption {
        
        complete?: ChoosePoiCompleteCallback
        
        fail?: ChoosePoiFailCallback
        
        success?: ChoosePoiSuccessCallback
    }
    interface ChoosePoiSuccessCallbackResult {
        
        address: string
        
        city: number
        
        latitude: number
        
        longitude: number
        
        name: string
        
        type: number
        errMsg: string
    }
    interface ChooseVideoOption {
        
        camera?: 'back' | 'front'
        
        complete?: ChooseVideoCompleteCallback
        
        compressed?: boolean
        
        fail?: ChooseVideoFailCallback
        
        maxDuration?: number
        
        sourceType?: Array<'album' | 'camera'>
        
        success?: ChooseVideoSuccessCallback
    }
    interface ChooseVideoSuccessCallbackResult {
        
        duration: number
        
        height: number
        
        size: number
        
        tempFilePath: string
        
        width: number
        errMsg: string
    }
    interface ClearFiltersOption {
        
        complete?: ClearFiltersCompleteCallback
        
        fail?: ClearFiltersFailCallback
        
        success?: ClearFiltersSuccessCallback
    }
    interface ClearMakeupsOption {
        
        complete?: ClearMakeupsCompleteCallback
        
        fail?: ClearMakeupsFailCallback
        
        success?: ClearMakeupsSuccessCallback
    }
    interface ClearOption {
        
        complete?: ClearCompleteCallback
        
        fail?: ClearFailCallback
        
        success?: ClearSuccessCallback
    }
    interface ClearStickersOption {
        
        complete?: ClearStickersCompleteCallback
        
        fail?: ClearStickersFailCallback
        
        success?: ClearStickersSuccessCallback
    }
    interface ClearStorageOption {
        
        complete?: ClearStorageCompleteCallback
        
        fail?: ClearStorageFailCallback
        
        success?: ClearStorageSuccessCallback
    }
    
    interface ClientRect {
        
        bottom: number
        
        height: number
        
        left: number
        
        right: number
        
        top: number
        
        width: number
    }
    interface CloseBLEConnectionOption {
        
        deviceId: string
        
        complete?: CloseBLEConnectionCompleteCallback
        
        fail?: CloseBLEConnectionFailCallback
        
        success?: CloseBLEConnectionSuccessCallback
    }
    interface CloseBluetoothAdapterOption {
        
        complete?: CloseBluetoothAdapterCompleteCallback
        
        fail?: CloseBluetoothAdapterFailCallback
        
        success?: CloseBluetoothAdapterSuccessCallback
    }
    interface CloseSocketOption {
        
        code?: number
        
        complete?: CloseSocketCompleteCallback
        
        fail?: CloseSocketFailCallback
        
        reason?: string
        
        success?: CloseSocketSuccessCallback
    }
    interface CloseSyncOption {
        
        fd: string
    }
    
    interface Color {}
    interface CompressImageOption {
        
        src: string
        
        complete?: CompressImageCompleteCallback
        
        compressedHeight?: number
        
        compressedWidth?: number
        
        fail?: CompressImageFailCallback
        
        quality?: number
        
        success?: CompressImageSuccessCallback
    }
    interface CompressImageSuccessCallbackResult {
        
        tempFilePath: string
        errMsg: string
    }
    interface CompressVideoOption {
        
        bitrate: number
        
        fps: number
        
        resolution: number
        
        src: string
        
        complete?: CompressVideoCompleteCallback
        
        fail?: CompressVideoFailCallback
        
        quality?: 'low' | 'medium' | 'high'
        
        success?: CompressVideoSuccessCallback
    }
    interface CompressVideoSuccessCallbackResult {
        
        size: string
        
        tempFilePath: string
        errMsg: string
    }
    interface ConnectSocketOption {
        
        url: string
        
        complete?: ConnectSocketCompleteCallback
        
        fail?: ConnectSocketFailCallback
        
        forceCellularNetwork?: boolean
        
        header?: IAnyObject
        
        perMessageDeflate?: boolean
        
        protocols?: string[]
        
        success?: ConnectSocketSuccessCallback
        
        tcpNoDelay?: boolean
        
        timeout?: number
    }
    interface ConnectWifiOption {
        
        SSID: string
        
        password: string
        
        BSSID?: string
        
        complete?: ConnectWifiCompleteCallback
        
        fail?: ConnectWifiFailCallback
        
        maunal?: boolean
        
        partialInfo?: boolean
        
        success?: ConnectWifiSuccessCallback
    }
    
    interface Constraints {
        
        disableNormalization?: boolean
    }
    interface ContextCallbackResult {
        
        context: IAnyObject
    }
    interface CopyFileOption {
        
        destPath: string
        
        srcPath: string
        
        complete?: CopyFileCompleteCallback
        
        fail?: CopyFileFailCallback
        
        success?: CopyFileSuccessCallback
    }
    interface CreateBLEConnectionOption {
        
        deviceId: string
        
        complete?: CreateBLEConnectionCompleteCallback
        
        fail?: CreateBLEConnectionFailCallback
        
        success?: CreateBLEConnectionSuccessCallback
        
        timeout?: number
    }
    interface CreateBLEPeripheralServerOption {
        
        complete?: CreateBLEPeripheralServerCompleteCallback
        
        fail?: CreateBLEPeripheralServerFailCallback
        
        success?: CreateBLEPeripheralServerSuccessCallback
    }
    interface CreateBLEPeripheralServerSuccessCallbackResult {
        
        server: BLEPeripheralServer
        errMsg: string
    }
    interface CreateCacheManagerOption {
        
        extra?: ExtraOption
        
        maxAge?: number
        
        mode?: 'weakNetwork' | 'always' | 'none'
        
        origin?: string
    }
    interface CreateInferenceSessionOption {
        
        model: string
        
        allowNPU?: boolean
        
        allowQuantize?: boolean
        
        precesionLevel?: 0 | 1 | 2 | 3 | 4
        
        typicalShape?: IAnyObject
    }
    interface CreateInnerAudioContextOption {
        
        useWebAudioImplement?: boolean
    }
    
    interface CreateIntersectionObserverOption {
        
        initialRatio?: number
        
        observeAll?: boolean
        
        thresholds?: number[]
    }
    interface CreateInterstitialAdOption {
        
        adUnitId: string
    }
    interface CreateMediaRecorderOption {
        
        duration?: number
        
        fps?: number
        
        gop?: number
        
        height?: number
        
        videoBitsPerSecond?: number
        
        width?: number
    }
    interface CreateOffscreenCanvasOption {
        
        compInst?: Component.TrivialInstance | Page.TrivialInstance
        
        height?: number
        
        type?: 'webgl' | '2d'
        
        width?: number
    }
    interface CreateRewardedVideoAdOption {
        
        adUnitId: string
        
        multiton?: boolean
    }
    
    interface CreateWorkerOption {
        
        useExperimentalWorker?: boolean
    }
    interface CropImageOption {
        
        cropScale: '16:9' | '9:16' | '4:3' | '3:4' | '5:4' | '4:5' | '1:1'
        
        src: string
        
        complete?: CropImageCompleteCallback
        
        fail?: CropImageFailCallback
        
        success?: CropImageSuccessCallback
    }
    interface CropImageSuccessCallbackResult {
        
        tempFilePath: string
        errMsg: string
    }
    interface CurrentState {
        
        logCount: number
        
        maxLogCount: number
        
        maxSize: number
        
        size: number
    }
    
    interface CustomRouteConfig {
        
        barrierColor: string
        
        barrierDismissible: boolean
        
        barrierLabel: string
        
        canTransitionFrom: boolean
        
        canTransitionTo: boolean
        
        maintainState: boolean
        
        opaque: boolean
        
        reverseTransitionDuration: number
        
        transitionDuration: number
    }
    
    interface CustomRouteContext {
        
        didPop: (...args: any[]) => any
        
        primaryAnimation: SharedValue<number>
        
        primaryAnimationStatus: SharedValue<number>
        
        secondaryAnimation: SharedValue<number>
        
        secondaryAnimationStatus: SharedValue<number>
        
        startUserGesture: (...args: any[]) => any
        
        stopUserGesture: (...args: any[]) => any
        
        userGestureInProgress: SharedValue<number>
    }
    
    interface Danmu {
        
        text: string
        
        color?: string
    }
    
    interface DecayOption {
        
        clamp?: any[]
        
        deceleration?: number
        
        velocity?: number
    }
    
    interface DepthTrack {
        
        mode: 1 | 2
    }
    
    interface DescOption {
        
        style?: string
        
        variant?: string
        
        weight?: string
    }
    
    interface DescriptorPermission {
        
        read?: boolean
        
        write?: boolean
    }
    
    interface DestinationOption {
        
        latitude: number
        
        longitude: number
    }
    interface DetectBodyOption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
        
        scoreThreshold?: number
        
        sourceType?: 1 | 0
    }
    interface DetectDepthOption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
    }
    interface DetectFaceOption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
        
        modelModel?: 0 | 1 | 2
        
        scoreThreshold?: number
        
        sourceType?: 1 | 0
    }
    interface DetectHandOption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
        
        algoMode?: 0 | 1 | 2
        
        scoreThreshold?: number
    }
    interface DeviceInfo {
        
        abi: string
        
        benchmarkLevel: number
        
        brand: string
        
        cpuType: string
        
        deviceAbi: string
        
        memorySize: string
        
        model: string
        
        platform: string
        
        system: string
    }
    interface DeviceVoIPInfo {
        
        group_id: string
        
        model_id: string
        
        sn: string
        
        status: number
    }
    interface DisableAlertBeforeUnloadOption {
        
        complete?: DisableAlertBeforeUnloadCompleteCallback
        
        fail?: DisableAlertBeforeUnloadFailCallback
        
        success?: DisableAlertBeforeUnloadSuccessCallback
    }
    interface DownloadFileOption {
        
        url: string
        
        complete?: DownloadFileCompleteCallback
        
        fail?: DownloadFileFailCallback
        
        filePath?: string
        
        header?: IAnyObject
        
        success?: DownloadFileSuccessCallback
        
        timeout?: number
    }
    interface DownloadFileSuccessCallbackResult {
        
        filePath: string
        
        profile: RequestProfile
        
        statusCode: number
        
        tempFilePath: string
        errMsg: string
    }
    interface DownloadTaskOnHeadersReceivedListenerResult {
        
        header: IAnyObject
    }
    interface DownloadTaskOnProgressUpdateListenerResult {
        
        progress: number
        
        totalBytesExpectedToWrite: number
        
        totalBytesWritten: number
    }
    interface DraggableSheetContextScrollToOption {
        
        animated?: boolean
        
        duration?: number
        
        easingFunction?: string
        
        pixels?: number
        
        size?: number
    }
    interface EditImageOption {
        
        src: string
        
        complete?: EditImageCompleteCallback
        
        fail?: EditImageFailCallback
        
        success?: EditImageSuccessCallback
    }
    interface EnableAlertBeforeUnloadOption {
        
        message: string
        
        complete?: EnableAlertBeforeUnloadCompleteCallback
        
        fail?: EnableAlertBeforeUnloadFailCallback
        
        success?: EnableAlertBeforeUnloadSuccessCallback
    }
    
    interface EntriesResult {
        
        [path: string]: ZipFileItem
    }
    
    interface EntryItem {
        
        path: string
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        length?: number
        
        position?: number
    }
    
    interface EraseLineOptions {
        
        id: number
        
        index: number
        
        point: MapPostion
        
        clear?: boolean
    }
    interface EraseLinesOption {
        
        lines: EraseLineOptions[]
        
        complete?: EraseLinesCompleteCallback
        
        fail?: EraseLinesFailCallback
        
        success?: EraseLinesSuccessCallback
    }
    
    interface Error {
        
        message: string
        
        stack: string
    }
    
    interface ExceptionReason {
        
        errMsg: string
        
        errno: string
    }
    interface ExecuteVisualLayerCommandOption {
        
        command: string
        
        layerId: string
        
        complete?: ExecuteVisualLayerCommandCompleteCallback
        
        fail?: ExecuteVisualLayerCommandFailCallback
        
        success?: ExecuteVisualLayerCommandSuccessCallback
    }
    interface ExecuteVisualLayerCommandSuccessCallbackResult {
        
        data: string
        
        errMsg: string
    }
    interface ExitCastingOption {
        
        complete?: ExitCastingCompleteCallback
        
        fail?: ExitCastingFailCallback
        
        success?: ExitCastingSuccessCallback
    }
    interface ExitFullScreenOption {
        
        complete?: ExitFullScreenCompleteCallback
        
        fail?: ExitFullScreenFailCallback
        
        success?: ExitFullScreenSuccessCallback
    }
    interface ExitMiniProgramOption {
        
        complete?: ExitMiniProgramCompleteCallback
        
        fail?: ExitMiniProgramFailCallback
        
        success?: ExitMiniProgramSuccessCallback
    }
    interface ExitPictureInPictureOption {
        
        complete?: ExitPictureInPictureCompleteCallback
        
        fail?: ExitPictureInPictureFailCallback
        
        success?: ExitPictureInPictureSuccessCallback
    }
    interface ExitVoIPChatOption {
        
        complete?: ExitVoIPChatCompleteCallback
        
        fail?: ExitVoIPChatFailCallback
        
        success?: ExitVoIPChatSuccessCallback
    }
    
    interface ExtInfoOption {
        
        url: string
    }
    
    interface ExtraOption {
        
        apiList?: Array<'wx.login' | 'wx.checkSession' | 'wx.getSetting'>
    }
    interface ExtractDataSourceOption {
        
        source: string
    }
    
    interface FaceAngel {
        
        pitch: number
        
        roll: number
        
        yaw: number
    }
    
    interface FaceConf {
        
        global: number
        
        leftEye: number
        
        mouth: number
        
        nose: number
        
        rightEye: number
    }
    interface FaceDetectOption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
        
        complete?: FaceDetectCompleteCallback
        
        enableAngle?: boolean
        
        enableConf?: boolean
        
        enableMultiFace?: boolean
        
        enablePoint?: boolean
        
        fail?: FaceDetectFailCallback
        
        success?: FaceDetectSuccessCallback
    }
    interface FaceDetectSuccessCallbackResult {
        
        angleArray: FaceAngel
        
        confArray: FaceConf
        
        detectRect: IAnyObject
        
        faceInfo: IAnyObject[]
        
        pointArray: IAnyObject[]
        
        x: number
        
        y: number
        errMsg: string
    }
    
    interface FaceTrack {
        
        mode: 1 | 2
    }
    interface Fields {
        
        computedStyle?: string[]
        
        context?: boolean
        
        dataset?: boolean
        
        id?: boolean
        
        mark?: boolean
        
        node?: boolean
        
        properties?: string[]
        
        rect?: boolean
        
        scrollOffset?: boolean
        
        size?: boolean
    }
    
    interface FileItem {
        
        createTime: number
        
        filePath: string
        
        size: number
    }
    
    interface FileStats {
        
        path: string
        
        stats: Stats
    }
    interface FileSystemManagerCloseOption {
        
        fd: string
        
        complete?: FileSystemManagerCloseCompleteCallback
        
        fail?: FileSystemManagerCloseFailCallback
        
        success?: FileSystemManagerCloseSuccessCallback
    }
    
    interface ForwardMaterials {
        
        name: string
        
        path: string
        
        size: number
        
        type: string
    }
    
    interface FrameDataOptions {
        
        data: ArrayBuffer
        
        height: number
        
        pkDts: number
        
        pkPts: number
        
        width: number
    }
    interface FromScreenLocationOption {
        
        x: number
        
        y: number
        
        complete?: FromScreenLocationCompleteCallback
        
        fail?: FromScreenLocationFailCallback
        
        success?: FromScreenLocationSuccessCallback
    }
    interface FstatOption {
        
        fd: string
        
        complete?: FstatCompleteCallback
        
        fail?: FstatFailCallback
        
        success?: FstatSuccessCallback
    }
    interface FstatSuccessCallbackResult {
        
        stats: Stats
        errMsg: string
    }
    interface FstatSyncOption {
        
        fd: string
    }
    interface FtruncateOption {
        
        fd: string
        
        length: number
        
        complete?: FtruncateCompleteCallback
        
        fail?: FtruncateFailCallback
        
        success?: FtruncateSuccessCallback
    }
    interface FtruncateSyncOption {
        
        fd: string
        
        length: number
    }
    interface GeneralCallbackResult {
        
        errMsg: string
    }
    interface GetAtqaOption {
        
        complete?: GetAtqaCompleteCallback
        
        fail?: GetAtqaFailCallback
        
        success?: GetAtqaSuccessCallback
    }
    interface GetAtqaSuccessCallbackResult {
        
        atqa: ArrayBuffer
        errMsg: string
    }
    interface GetAvailableAudioSourcesOption {
        
        complete?: GetAvailableAudioSourcesCompleteCallback
        
        fail?: GetAvailableAudioSourcesFailCallback
        
        success?: GetAvailableAudioSourcesSuccessCallback
    }
    interface GetAvailableAudioSourcesSuccessCallbackResult {
        
        audioSources: Array<
            | 'auto'
            | 'buildInMic'
            | 'headsetMic'
            | 'mic'
            | 'camcorder'
            | 'voice_communication'
            | 'voice_recognition'
        >
        errMsg: string
    }
    interface GetBLEDeviceCharacteristicsOption {
        
        deviceId: string
        
        serviceId: string
        
        complete?: GetBLEDeviceCharacteristicsCompleteCallback
        
        fail?: GetBLEDeviceCharacteristicsFailCallback
        
        success?: GetBLEDeviceCharacteristicsSuccessCallback
    }
    interface GetBLEDeviceCharacteristicsSuccessCallbackResult {
        
        characteristics: BLECharacteristic[]
        errMsg: string
    }
    interface GetBLEDeviceRSSIOption {
        
        deviceId: string
        
        complete?: GetBLEDeviceRSSICompleteCallback
        
        fail?: GetBLEDeviceRSSIFailCallback
        
        success?: GetBLEDeviceRSSISuccessCallback
    }
    interface GetBLEDeviceRSSISuccessCallbackResult {
        
        RSSI: number
        errMsg: string
    }
    interface GetBLEDeviceServicesOption {
        
        deviceId: string
        
        complete?: GetBLEDeviceServicesCompleteCallback
        
        fail?: GetBLEDeviceServicesFailCallback
        
        success?: GetBLEDeviceServicesSuccessCallback
    }
    interface GetBLEDeviceServicesSuccessCallbackResult {
        
        services: BLEService[]
        errMsg: string
    }
    interface GetBLEMTUOption {
        
        deviceId: string
        
        complete?: GetBLEMTUCompleteCallback
        
        fail?: GetBLEMTUFailCallback
        
        success?: GetBLEMTUSuccessCallback
        
        writeType?: 'write' | 'writeNoResponse'
    }
    interface GetBLEMTUSuccessCallbackResult {
        
        mtu: number
        errMsg: string
    }
    interface GetBackgroundAudioPlayerStateOption {
        
        complete?: GetBackgroundAudioPlayerStateCompleteCallback
        
        fail?: GetBackgroundAudioPlayerStateFailCallback
        
        success?: GetBackgroundAudioPlayerStateSuccessCallback
    }
    interface GetBackgroundAudioPlayerStateSuccessCallbackResult {
        
        currentPosition: number
        
        dataUrl: string
        
        downloadPercent: number
        
        duration: number
        
        status: 0 | 1 | 2
        errMsg: string
    }
    interface GetBackgroundFetchDataOption {
        
        fetchType: string
        
        complete?: GetBackgroundFetchDataCompleteCallback
        
        fail?: GetBackgroundFetchDataFailCallback
        
        success?: GetBackgroundFetchDataSuccessCallback
    }
    interface GetBackgroundFetchDataSuccessCallbackResult {
        
        fetchedData: string
        
        path: string
        
        query: string
        
        scene: number
        
        timeStamp: number
        errMsg: string
    }
    interface GetBackgroundFetchTokenOption {
        
        complete?: GetBackgroundFetchTokenCompleteCallback
        
        fail?: GetBackgroundFetchTokenFailCallback
        
        success?: GetBackgroundFetchTokenSuccessCallback
    }
    interface GetBackgroundFetchTokenSuccessCallbackResult {
        
        errMsg: string
        
        token: string
    }
    interface GetBatteryInfoOption {
        
        complete?: GetBatteryInfoCompleteCallback
        
        fail?: GetBatteryInfoFailCallback
        
        success?: GetBatteryInfoSuccessCallback
    }
    interface GetBatteryInfoSuccessCallbackResult {
        
        isCharging: boolean
        
        level: number
        errMsg: string
    }
    interface GetBatteryInfoSyncResult {
        
        isCharging: boolean
        
        level: number
    }
    interface GetBeaconsOption {
        
        complete?: GetBeaconsCompleteCallback
        
        fail?: GetBeaconsFailCallback
        
        success?: GetBeaconsSuccessCallback
    }
    interface GetBeaconsSuccessCallbackResult {
        
        beacons: BeaconInfo[]
        errMsg: string
    }
    interface GetBluetoothAdapterStateOption {
        
        complete?: GetBluetoothAdapterStateCompleteCallback
        
        fail?: GetBluetoothAdapterStateFailCallback
        
        success?: GetBluetoothAdapterStateSuccessCallback
    }
    interface GetBluetoothAdapterStateSuccessCallbackResult {
        
        available: boolean
        
        discovering: boolean
        errMsg: string
    }
    interface GetBluetoothDevicesOption {
        
        complete?: GetBluetoothDevicesCompleteCallback
        
        fail?: GetBluetoothDevicesFailCallback
        
        success?: GetBluetoothDevicesSuccessCallback
    }
    interface GetBluetoothDevicesSuccessCallbackResult {
        
        devices: BlueToothDevice[]
        errMsg: string
    }
    interface GetCenterLocationOption {
        
        complete?: GetCenterLocationCompleteCallback
        
        fail?: GetCenterLocationFailCallback
        
        iconPath?: string
        
        success?: GetCenterLocationSuccessCallback
    }
    interface GetCenterLocationSuccessCallbackResult {
        
        latitude: number
        
        longitude: number
        errMsg: string
    }
    interface GetChannelsLiveInfoOption {
        
        finderUserName: string
        
        complete?: GetChannelsLiveInfoCompleteCallback
        
        endTime?: number
        
        fail?: GetChannelsLiveInfoFailCallback
        
        startTime?: number
        
        success?: GetChannelsLiveInfoSuccessCallback
    }
    interface GetChannelsLiveInfoSuccessCallbackResult {
        
        description: string
        
        feedId: string
        
        headUrl: string
        
        nickname: string
        
        nonceId: string
        
        otherInfos: any[]
        
        replayStatus: 0 | 1 | 3 | 6
        
        status: 2 | 3
        errMsg: string
    }
    interface GetChannelsLiveNoticeInfoOption {
        
        finderUserName: string
        
        complete?: GetChannelsLiveNoticeInfoCompleteCallback
        
        fail?: GetChannelsLiveNoticeInfoFailCallback
        
        success?: GetChannelsLiveNoticeInfoSuccessCallback
    }
    interface GetChannelsLiveNoticeInfoSuccessCallbackResult {
        
        headUrl: string
        
        nickname: string
        
        noticeId: string
        
        otherInfos: any[]
        
        reservable: boolean
        
        startTime: string
        
        status: number
        errMsg: string
    }
    interface GetChannelsShareKeyOption {
        
        complete?: GetChannelsShareKeyCompleteCallback
        
        fail?: GetChannelsShareKeyFailCallback
        
        success?: GetChannelsShareKeySuccessCallback
    }
    interface GetChannelsShareKeySuccessCallbackResult {
        
        promoter: PromoterResult
        
        sharerOpenId: string
        errMsg: string
    }
    interface GetClipboardDataOption {
        
        complete?: GetClipboardDataCompleteCallback
        
        fail?: GetClipboardDataFailCallback
        
        success?: GetClipboardDataSuccessCallback
    }
    interface GetClipboardDataSuccessCallbackOption {
        
        data: string
        errMsg: string
    }
    interface GetCommonConfigOption {
        
        mode: number
        
        complete?: GetCommonConfigCompleteCallback
        
        fail?: GetCommonConfigFailCallback
        
        keys?: string[]
        
        success?: GetCommonConfigSuccessCallback
    }
    interface GetCommonConfigSuccessCallbackResult {
        
        conf: string
        
        conf_type: number
        
        errcode: number
        
        errmsg: string
        
        expire_sec: number
        errMsg: string
    }
    interface GetConnectedBluetoothDevicesOption {
        
        services: string[]
        
        complete?: GetConnectedBluetoothDevicesCompleteCallback
        
        fail?: GetConnectedBluetoothDevicesFailCallback
        
        success?: GetConnectedBluetoothDevicesSuccessCallback
    }
    interface GetConnectedBluetoothDevicesSuccessCallbackResult {
        
        devices: BluetoothDeviceInfo[]
        errMsg: string
    }
    interface GetConnectedWifiOption {
        
        complete?: GetConnectedWifiCompleteCallback
        
        fail?: GetConnectedWifiFailCallback
        
        partialInfo?: boolean
        
        success?: GetConnectedWifiSuccessCallback
    }
    interface GetConnectedWifiSuccessCallbackResult {
        
        wifi: WifiInfo
        errMsg: string
    }
    interface GetContentsOption {
        
        complete?: GetContentsCompleteCallback
        
        fail?: GetContentsFailCallback
        
        success?: GetContentsSuccessCallback
    }
    interface GetContentsSuccessCallbackResult {
        
        delta: IAnyObject
        
        html: string
        
        text: string
        errMsg: string
    }
    interface GetDeviceVoIPListOption {
        
        complete?: GetDeviceVoIPListCompleteCallback
        
        fail?: GetDeviceVoIPListFailCallback
        
        success?: GetDeviceVoIPListSuccessCallback
    }
    interface GetDeviceVoIPListSuccessCallbackResult {
        list: DeviceVoIPInfo[]
        errMsg: string
    }
    interface GetExtConfigOption {
        
        complete?: GetExtConfigCompleteCallback
        
        fail?: GetExtConfigFailCallback
        
        success?: GetExtConfigSuccessCallback
    }
    interface GetExtConfigSuccessCallbackResult {
        
        extConfig: IAnyObject
        errMsg: string
    }
    interface GetFileInfoOption {
        
        filePath: string
        
        complete?: GetFileInfoCompleteCallback
        
        digestAlgorithm?: 'md5' | 'sha1'
        
        fail?: GetFileInfoFailCallback
        
        success?: GetFileInfoSuccessCallback
    }
    interface GetFileInfoSuccessCallbackResult {
        
        digest: string
        
        size: number
        errMsg: string
    }
    interface GetFuzzyLocationOption {
        
        complete?: GetFuzzyLocationCompleteCallback
        
        fail?: GetFuzzyLocationFailCallback
        
        success?: GetFuzzyLocationSuccessCallback
        
        type?: 'wgs84' | 'gcj02'
    }
    interface GetFuzzyLocationSuccessCallbackResult {
        
        latitude: number
        
        longitude: number
        errMsg: string
    }
    interface GetGroupEnterInfoOption {
        
        complete?: GetGroupEnterInfoCompleteCallback
        
        fail?: GetGroupEnterInfoFailCallback
        
        success?: GetGroupEnterInfoSuccessCallback
    }
    interface GetGroupEnterInfoSuccessCallbackResult {
        
        cloudID: string
        
        encryptedData: string
        
        errMsg: string
        
        iv: string
    }
    interface GetHCEStateOption {
        
        complete?: GetHCEStateCompleteCallback
        
        fail?: GetHCEStateFailCallback
        
        success?: GetHCEStateSuccessCallback
    }
    interface GetHistoricalBytesOption {
        
        complete?: GetHistoricalBytesCompleteCallback
        
        fail?: GetHistoricalBytesFailCallback
        
        success?: GetHistoricalBytesSuccessCallback
    }
    interface GetHistoricalBytesSuccessCallbackResult {
        
        histBytes: ArrayBuffer
        errMsg: string
    }
    interface GetImageInfoOption {
        
        src: string
        
        complete?: GetImageInfoCompleteCallback
        
        fail?: GetImageInfoFailCallback
        
        success?: GetImageInfoSuccessCallback
    }
    interface GetImageInfoSuccessCallbackResult {
        
        height: number
        
        orientation:
            | 'up'
            | 'up-mirrored'
            | 'down'
            | 'down-mirrored'
            | 'left-mirrored'
            | 'right'
            | 'right-mirrored'
            | 'left'
        
        path: string
        
        type: 'unknown' | 'jpeg' | 'png' | 'gif' | 'tiff'
        
        width: number
        errMsg: string
    }
    interface GetInferenceEnvInfoOption {
        
        complete?: GetInferenceEnvInfoCompleteCallback
        
        fail?: GetInferenceEnvInfoFailCallback
        
        success?: GetInferenceEnvInfoSuccessCallback
    }
    interface GetInferenceEnvInfoSuccessCallbackResult {
        
        ver: string
        errMsg: string
    }
    interface GetLatestUserKeyOption {
        
        complete?: GetLatestUserKeyCompleteCallback
        
        fail?: GetLatestUserKeyFailCallback
        
        success?: GetLatestUserKeySuccessCallback
    }
    interface GetLatestUserKeySuccessCallbackResult {
        
        encryptKey: string
        
        expireTime: number
        
        iv: string
        
        version: number
        errMsg: string
    }
    interface GetLocalIPAddressOption {
        
        complete?: GetLocalIPAddressCompleteCallback
        
        fail?: GetLocalIPAddressFailCallback
        
        success?: GetLocalIPAddressSuccessCallback
    }
    interface GetLocalIPAddressSuccessCallbackResult {
        
        errMsg: string
        
        localip: string
        
        netmask: string
    }
    interface GetLocationOption {
        
        altitude?: boolean
        
        complete?: GetLocationCompleteCallback
        
        fail?: GetLocationFailCallback
        
        highAccuracyExpireTime?: number
        
        isHighAccuracy?: boolean
        
        success?: GetLocationSuccessCallback
        
        type?: string
    }
    interface GetLocationSuccessCallbackResult {
        
        accuracy: number
        
        altitude: number
        
        horizontalAccuracy: number
        
        latitude: number
        
        longitude: number
        
        speed: number
        
        verticalAccuracy: number
        errMsg: string
    }
    interface GetLogManagerOption {
        
        level?: number
    }
    interface GetMaxTransceiveLengthOption {
        
        complete?: GetMaxTransceiveLengthCompleteCallback
        
        fail?: GetMaxTransceiveLengthFailCallback
        
        success?: GetMaxTransceiveLengthSuccessCallback
    }
    interface GetMaxTransceiveLengthSuccessCallbackResult {
        
        length: number
        errMsg: string
    }
    interface GetMaxZoomOption {
        
        complete?: GetMaxZoomCompleteCallback
        
        fail?: GetMaxZoomFailCallback
        
        success?: GetMaxZoomSuccessCallback
    }
    interface GetMaxZoomSuccessCallbackResult {
        
        maxZoom: string
        errMsg: string
    }
    interface GetNetworkTypeOption {
        
        complete?: GetNetworkTypeCompleteCallback
        
        fail?: GetNetworkTypeFailCallback
        
        success?: GetNetworkTypeSuccessCallback
    }
    interface GetNetworkTypeSuccessCallbackResult {
        
        hasSystemProxy: boolean
        
        networkType: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none'
        
        signalStrength: number
        errMsg: string
    }
    interface GetPrivacySettingOption {
        
        complete?: GetPrivacySettingCompleteCallback
        
        fail?: GetPrivacySettingFailCallback
        
        success?: GetPrivacySettingSuccessCallback
    }
    interface GetPrivacySettingSuccessCallbackResult {
        
        needAuthorization: boolean
        
        privacyContractName: string
        errMsg: string
    }
    interface GetRandomValuesOption {
        
        length: number
        
        complete?: GetRandomValuesCompleteCallback
        
        fail?: GetRandomValuesFailCallback
        
        success?: GetRandomValuesSuccessCallback
    }
    interface GetRandomValuesSuccessCallbackResult {
        
        randomValues: ArrayBuffer
        errMsg: string
    }
    interface GetRegionOption {
        
        complete?: GetRegionCompleteCallback
        
        fail?: GetRegionFailCallback
        
        success?: GetRegionSuccessCallback
    }
    interface GetRegionSuccessCallbackResult {
        
        northeast: MapPostion
        
        southwest: MapPostion
        errMsg: string
    }
    interface GetRendererUserAgentOption {
        
        complete?: GetRendererUserAgentCompleteCallback
        
        fail?: GetRendererUserAgentFailCallback
        
        success?: GetRendererUserAgentSuccessCallback
    }
    interface GetRotateOption {
        
        complete?: GetRotateCompleteCallback
        
        fail?: GetRotateFailCallback
        
        success?: GetRotateSuccessCallback
    }
    interface GetRotateSuccessCallbackResult {
        
        rotate: number
        errMsg: string
    }
    interface GetSakOption {
        
        complete?: GetSakCompleteCallback
        
        fail?: GetSakFailCallback
        
        success?: GetSakSuccessCallback
    }
    interface GetSakSuccessCallbackResult {
        
        sak: number
        errMsg: string
    }
    interface GetSavedFileListOption {
        
        complete?: GetSavedFileListCompleteCallback
        
        fail?: GetSavedFileListFailCallback
        
        success?: GetSavedFileListSuccessCallback
    }
    interface GetSavedFileListSuccessCallbackResult {
        
        fileList: FileItem[]
        errMsg: string
    }
    interface GetScaleOption {
        
        complete?: GetScaleCompleteCallback
        
        fail?: GetScaleFailCallback
        
        success?: GetScaleSuccessCallback
    }
    interface GetScaleSuccessCallbackResult {
        
        scale: number
        errMsg: string
    }
    interface GetScreenBrightnessOption {
        
        complete?: GetScreenBrightnessCompleteCallback
        
        fail?: GetScreenBrightnessFailCallback
        
        success?: GetScreenBrightnessSuccessCallback
    }
    interface GetScreenBrightnessSuccessCallbackOption {
        
        value: number
        errMsg: string
    }
    interface GetScreenRecordingStateOption {
        
        complete?: GetScreenRecordingStateCompleteCallback
        
        fail?: GetScreenRecordingStateFailCallback
        
        success?: GetScreenRecordingStateSuccessCallback
    }
    interface GetScreenRecordingStateSuccessCallbackResult {
        
        state: 'on' | 'off'
        errMsg: string
    }
    interface GetSelectedTextRangeOption {
        
        complete?: GetSelectedTextRangeCompleteCallback
        
        fail?: GetSelectedTextRangeFailCallback
        
        success?: GetSelectedTextRangeSuccessCallback
    }
    interface GetSelectedTextRangeSuccessCallbackResult {
        
        end: number
        
        start: number
        errMsg: string
    }
    interface GetSelectionTextOption {
        
        complete?: GetSelectionTextCompleteCallback
        
        fail?: GetSelectionTextFailCallback
        
        success?: GetSelectionTextSuccessCallback
    }
    interface GetSelectionTextSuccessCallbackResult {
        
        text: string
        errMsg: string
    }
    interface GetSettingOption {
        
        complete?: GetSettingCompleteCallback
        
        fail?: GetSettingFailCallback
        
        success?: GetSettingSuccessCallback
        
        withSubscriptions?: boolean
    }
    interface GetSettingSuccessCallbackResult {
        
        authSetting: AuthSetting
        
        subscriptionsSetting: SubscriptionsSetting
        
        miniprogramAuthSetting?: AuthSetting
        errMsg: string
    }
    interface GetShareInfoOption {
        
        shareTicket: string
        
        complete?: GetShareInfoCompleteCallback
        
        fail?: GetShareInfoFailCallback
        
        success?: GetShareInfoSuccessCallback
        
        timeout?: number
    }
    interface GetSkewOption {
        
        complete?: GetSkewCompleteCallback
        
        fail?: GetSkewFailCallback
        
        success?: GetSkewSuccessCallback
    }
    interface GetSkewSuccessCallbackResult {
        
        skew: number
        errMsg: string
    }
    interface GetSkylineInfoOption {
        
        complete?: GetSkylineInfoCompleteCallback
        
        fail?: GetSkylineInfoFailCallback
        
        success?: GetSkylineInfoSuccessCallback
    }
    interface GetStorageInfoOption {
        
        complete?: GetStorageInfoCompleteCallback
        
        fail?: GetStorageInfoFailCallback
        
        success?: GetStorageInfoSuccessCallback
    }
    interface GetStorageInfoSuccessCallbackOption {
        
        currentSize: number
        
        keys: string[]
        
        limitSize: number
        errMsg: string
    }
    interface GetStorageInfoSyncOption {
        
        currentSize: number
        
        keys: string[]
        
        limitSize: number
    }
    interface GetStorageOption<T = any> {
        
        key: string
        
        complete?: GetStorageCompleteCallback
        
        encrypt?: boolean
        
        fail?: GetStorageFailCallback
        
        success?: GetStorageSuccessCallback<T>
    }
    interface GetStorageSuccessCallbackResult<T = any> {
        
        data: T
        errMsg: string
    }
    interface GetSystemInfoAsyncOption {
        
        complete?: GetSystemInfoAsyncCompleteCallback
        
        fail?: GetSystemInfoAsyncFailCallback
        
        success?: GetSystemInfoAsyncSuccessCallback
    }
    interface GetSystemInfoOption {
        
        complete?: GetSystemInfoCompleteCallback
        
        fail?: GetSystemInfoFailCallback
        
        success?: GetSystemInfoSuccessCallback
    }
    interface GetUserInfoOption {
        
        complete?: GetUserInfoCompleteCallback
        
        fail?: GetUserInfoFailCallback
        
        lang?: 'en' | 'zh_CN' | 'zh_TW'
        
        success?: GetUserInfoSuccessCallback
        
        withCredentials?: boolean
    }
    interface GetUserInfoSuccessCallbackResult {
        
        cloudID: string
        
        encryptedData: string
        
        iv: string
        
        rawData: string
        
        signature: string
        
        userInfo: UserInfo
        errMsg: string
    }
    interface GetUserProfileOption {
        
        desc: string
        
        complete?: GetUserProfileCompleteCallback
        
        fail?: GetUserProfileFailCallback
        
        lang?: 'en' | 'zh_CN' | 'zh_TW'
        
        success?: GetUserProfileSuccessCallback
    }
    interface GetUserProfileSuccessCallbackResult {
        
        cloudID: string
        
        encryptedData: string
        
        iv: string
        
        rawData: string
        
        signature: string
        
        userInfo: UserInfo
        errMsg: string
    }
    interface GetVideoInfoOption {
        
        src: string
        
        complete?: GetVideoInfoCompleteCallback
        
        fail?: GetVideoInfoFailCallback
        
        success?: GetVideoInfoSuccessCallback
    }
    interface GetVideoInfoSuccessCallbackResult {
        
        bitrate: number
        
        duration: number
        
        fps: number
        
        height: number
        
        orientation:
            | 'up'
            | 'down'
            | 'left'
            | 'right'
            | 'up-mirrored'
            | 'down-mirrored'
            | 'left-mirrored'
            | 'right-mirrored'
        
        size: number
        
        type: string
        
        width: number
        errMsg: string
    }
    interface GetWeRunDataOption {
        
        complete?: GetWeRunDataCompleteCallback
        
        fail?: GetWeRunDataFailCallback
        
        success?: GetWeRunDataSuccessCallback
    }
    interface GetWeRunDataSuccessCallbackResult {
        
        cloudID: string
        
        encryptedData: string
        
        iv: string
        errMsg: string
    }
    interface GetWifiListOption {
        
        complete?: GetWifiListCompleteCallback
        
        fail?: GetWifiListFailCallback
        
        success?: GetWifiListSuccessCallback
    }
    
    interface HandTrack {
        
        mode: 1 | 2
    }
    interface HideHomeButtonOption {
        
        complete?: HideHomeButtonCompleteCallback
        
        fail?: HideHomeButtonFailCallback
        
        success?: HideHomeButtonSuccessCallback
    }
    interface HideKeyboardOption {
        
        complete?: HideKeyboardCompleteCallback
        
        fail?: HideKeyboardFailCallback
        
        success?: HideKeyboardSuccessCallback
    }
    interface HideLoadingOption {
        
        complete?: HideLoadingCompleteCallback
        
        fail?: HideLoadingFailCallback
        
        noConflict?: boolean
        
        success?: HideLoadingSuccessCallback
    }
    interface HideNavigationBarLoadingOption {
        
        complete?: HideNavigationBarLoadingCompleteCallback
        
        fail?: HideNavigationBarLoadingFailCallback
        
        success?: HideNavigationBarLoadingSuccessCallback
    }
    interface HideShareMenuOption {
        
        complete?: HideShareMenuCompleteCallback
        
        fail?: HideShareMenuFailCallback
        
        menus?: string[]
        
        success?: HideShareMenuSuccessCallback
    }
    interface HideTabBarOption {
        
        animation?: boolean
        
        complete?: HideTabBarCompleteCallback
        
        fail?: HideTabBarFailCallback
        
        success?: HideTabBarSuccessCallback
    }
    interface HideTabBarRedDotOption {
        
        index: number
        
        complete?: HideTabBarRedDotCompleteCallback
        
        fail?: HideTabBarRedDotFailCallback
        
        success?: HideTabBarRedDotSuccessCallback
    }
    interface HideToastOption {
        
        complete?: HideToastCompleteCallback
        
        fail?: HideToastFailCallback
        
        noConflict?: boolean
        
        success?: HideToastSuccessCallback
    }
    
    interface HitTestRes {
        
        transform: Float32Array
    }
    
    interface Image {
        
        height: number
        
        onerror: (...args: any[]) => any
        
        onload: (...args: any[]) => any
        
        referrerPolicy: string
        
        src: string
        
        width: number
    }
    
    interface ImageData {
        
        data: Uint8ClampedArray
        
        height: number
        
        width: number
    }
    
    interface ImageFile {
        
        path: string
        
        size: number
    }
    interface IncludePointsOption {
        
        points: MapPostion[]
        
        complete?: IncludePointsCompleteCallback
        
        fail?: IncludePointsFailCallback
        
        padding?: number[]
        
        success?: IncludePointsSuccessCallback
    }
    interface InitFaceDetectOption {
        
        complete?: InitFaceDetectCompleteCallback
        
        fail?: InitFaceDetectFailCallback
        
        success?: InitFaceDetectSuccessCallback
    }
    interface InitMarkerClusterOption {
        
        complete?: InitMarkerClusterCompleteCallback
        
        enableDefaultStyle?: boolean
        
        fail?: InitMarkerClusterFailCallback
        
        gridSize?: number
        
        success?: InitMarkerClusterSuccessCallback
        
        zoomOnClick?: boolean
    }
    
    interface InnerAudioContext {
        
        autoplay: boolean
        
        buffered: number
        
        currentTime: number
        
        duration: number
        
        loop: boolean
        
        obeyMuteSwitch: boolean
        
        paused: boolean
        
        playbackRate: number
        
        referrerPolicy: string
        
        src: string
        
        startTime: number
        
        volume: number
        
        destroy(): void
        
        offCanplay(
            
            listener?: OffCanplayCallback
        ): void
        
        offEnded(
            
            listener?: OffEndedCallback
        ): void
        
        offError(
            
            listener?: InnerAudioContextOffErrorCallback
        ): void
        
        offPause(
            
            listener?: OffPauseCallback
        ): void
        
        offPlay(
            
            listener?: OffPlayCallback
        ): void
        
        offSeeked(
            
            listener?: OffSeekedCallback
        ): void
        
        offSeeking(
            
            listener?: OffSeekingCallback
        ): void
        
        offStop(
            
            listener?: OffStopCallback
        ): void
        
        offTimeUpdate(
            
            listener?: OffTimeUpdateCallback
        ): void
        
        offWaiting(
            
            listener?: OffWaitingCallback
        ): void
        
        onCanplay(
            
            listener: OnCanplayCallback
        ): void
        
        onEnded(
            
            listener: OnEndedCallback
        ): void
        
        onError(
            
            listener: InnerAudioContextOnErrorCallback
        ): void
        
        onPause(
            
            listener: OnPauseCallback
        ): void
        
        onPlay(
            
            listener: OnPlayCallback
        ): void
        
        onSeeked(
            
            listener: OnSeekedCallback
        ): void
        
        onSeeking(
            
            listener: OnSeekingCallback
        ): void
        
        onStop(
            
            listener: InnerAudioContextOnStopCallback
        ): void
        
        onTimeUpdate(
            
            listener: OnTimeUpdateCallback
        ): void
        
        onWaiting(
            
            listener: OnWaitingCallback
        ): void
        
        pause(): void
        
        play(): void
        
        seek(
            
            position: number
        ): void
        
        stop(): void
    }
    interface InnerAudioContextOnErrorListenerResult {
        
        errCode: 10001 | 10002 | 10003 | 10004 | -1
        errMsg: string
    }
    interface InsertDividerOption {
        
        complete?: InsertDividerCompleteCallback
        
        fail?: InsertDividerFailCallback
        
        success?: InsertDividerSuccessCallback
    }
    interface InsertImageOption {
        
        src: string
        
        alt?: string
        
        complete?: InsertImageCompleteCallback
        
        data?: IAnyObject
        
        extClass?: string
        
        fail?: InsertImageFailCallback
        
        height?: string
        
        nowrap?: boolean
        
        success?: InsertImageSuccessCallback
        
        width?: string
    }
    interface InsertTextOption {
        
        complete?: InsertTextCompleteCallback
        
        fail?: InsertTextFailCallback
        
        success?: InsertTextSuccessCallback
        
        text?: string
    }
    interface IntersectionObserverObserveCallbackResult {
        
        boundingClientRect: BoundingClientRectResult
        
        dataset: Record<string, any>
        
        id: string
        
        intersectionRatio: number
        
        intersectionRect: IntersectionRectResult
        
        relativeRect: RelativeRectResult
        
        time: number
    }
    
    interface IntersectionRectResult {
        
        bottom: number
        
        height: number
        
        left: number
        
        right: number
        
        top: number
        
        width: number
    }
    interface InterstitialAdOnErrorListenerResult {
        
        errCode: 1000 | 1001 | 1002 | 1003 | 1004 | 1005 | 1006 | 1007 | 1008
        
        errMsg: string
    }
    interface IsBluetoothDevicePairedOption {
        
        deviceId: string
        
        complete?: IsBluetoothDevicePairedCompleteCallback
        
        fail?: IsBluetoothDevicePairedFailCallback
        
        success?: IsBluetoothDevicePairedSuccessCallback
    }
    interface IsConnectedOption {
        
        complete?: IsConnectedCompleteCallback
        
        fail?: IsConnectedFailCallback
        
        success?: IsConnectedSuccessCallback
    }
    interface Join1v1ChatOption {
        
        caller: VoIP1v1ChatUser
        
        listener: VoIP1v1ChatUser
        
        backgroundType?: 0 | 1 | 2 | 3 | 4 | 5
        
        complete?: Join1v1ChatCompleteCallback
        
        disableSwitchVoice?: boolean
        
        fail?: Join1v1ChatFailCallback
        
        minWindowType?: number
        
        roomType?: 'voice' | 'video'
        
        success?: Join1v1ChatSuccessCallback
    }
    interface JoinVoIPChatOption {
        
        groupId: string
        
        nonceStr: string
        
        signature: string
        
        timeStamp: number
        
        complete?: JoinVoIPChatCompleteCallback
        
        fail?: JoinVoIPChatFailCallback
        
        forceCellularNetwork?: boolean
        
        muteConfig?: MuteConfig
        
        roomType?: 'voice' | 'video'
        
        success?: JoinVoIPChatSuccessCallback
    }
    interface JoinVoIPChatSuccessCallbackResult {
        
        errCode: number
        
        errMsg: string
        
        openIdList: string[]
    }
    interface KvList {
        
        key: string
        
        value: any
    }
    
    interface LaunchOptionsApp {
        
        apiCategory:
            | 'default'
            | 'nativeFunctionalized'
            | 'browseOnly'
            | 'embedded'
        
        forwardMaterials: ForwardMaterials[]
        
        path: string
        
        query: Record<string, string>
        
        referrerInfo: ReferrerInfo
        
        scene: number
        
        chatType?: 1 | 2 | 3 | 4
        
        shareTicket?: string
    }
    interface LivePlayerContextRequestFullScreenOption {
        
        complete?: RequestFullScreenCompleteCallback
        
        direction?: 0 | 90 | -90
        
        fail?: RequestFullScreenFailCallback
        
        success?: RequestFullScreenSuccessCallback
    }
    interface LivePlayerContextSnapshotOption {
        
        complete?: SnapshotCompleteCallback
        
        fail?: SnapshotFailCallback
        
        quality?: 'raw' | 'compressed'
        
        sourceType?: 'stream' | 'view'
        
        success?: LivePlayerContextSnapshotSuccessCallback
    }
    interface LivePlayerContextSnapshotSuccessCallbackResult {
        
        height: string
        
        tempImagePath: string
        
        width: string
        errMsg: string
    }
    interface LivePusherContextSetZoomOption {
        
        zoom: number
        
        complete?: SetZoomCompleteCallback
        
        fail?: SetZoomFailCallback
        
        success?: LivePusherContextSetZoomSuccessCallback
    }
    interface LivePusherContextSnapshotOption {
        
        complete?: SnapshotCompleteCallback
        
        fail?: SnapshotFailCallback
        
        quality?: 'raw' | 'compressed'
        
        sourceType?: 'stream' | 'view'
        
        success?: LivePusherContextSnapshotSuccessCallback
    }
    interface LivePusherContextSnapshotSuccessCallbackResult {
        
        height: string
        
        tempImagePath: string
        
        width: string
        errMsg: string
    }
    interface LivePusherContextStartOption {
        
        complete?: StartCompleteCallback
        
        fail?: StartFailCallback
        
        success?: StartSuccessCallback
    }
    interface LoadFontFaceCompleteCallbackResult {
        
        status: string
    }
    interface LoadFontFaceOption {
        
        family: string
        
        source: string
        
        complete?: LoadFontFaceCompleteCallback
        
        desc?: DescOption
        
        fail?: LoadFontFaceFailCallback
        
        global?: boolean
        
        scopes?: any[]
        
        success?: LoadFontFaceSuccessCallback
    }
    interface LocalInfo {
        
        address: string
        
        family: string
        
        port: number
    }
    interface LoginOption {
        
        complete?: LoginCompleteCallback
        
        fail?: LoginFailCallback
        
        success?: LoginSuccessCallback
        
        timeout?: number
    }
    interface LoginSuccessCallbackResult {
        
        code: string
        errMsg: string
    }
    interface MakeBluetoothPairOption {
        
        deviceId: string
        
        pin: string
        
        complete?: MakeBluetoothPairCompleteCallback
        
        fail?: MakeBluetoothPairFailCallback
        
        success?: MakeBluetoothPairSuccessCallback
        
        timeout?: number
    }
    interface MakePhoneCallOption {
        
        phoneNumber: string
        
        complete?: MakePhoneCallCompleteCallback
        
        fail?: MakePhoneCallFailCallback
        
        success?: MakePhoneCallSuccessCallback
    }
    
    interface ManufacturerData {
        
        manufacturerId: string
        
        manufacturerSpecificData?: ArrayBuffer
    }
    
    interface MapBounds {
        
        northeast: MapPostion
        
        southwest: MapPostion
    }
    interface MapPostion {
        
        latitude: number
        
        longitude: number
    }
    
    interface Margins {
        
        bottom?: number
        
        left?: number
        
        right?: number
        
        top?: number
    }
    
    interface MatchCache {
        
        cacheId: string
        
        createTime: number
        
        data: any
        
        maxAge: number
        
        ruleId: string
    }
    
    interface MediaAudioPlayer {
        
        volume: number
        
        addAudioSource(
            
            source: VideoDecoder
        ): Promise<any>
        
        destroy(): Promise<any>
        
        removeAudioSource(
            
            source: VideoDecoder
        ): Promise<any>
        
        start(): Promise<any>
        
        stop(): Promise<any>
    }
    
    interface MediaFile {
        
        duration: number
        
        fileType: 'image' | 'video'
        
        height: number
        
        size: number
        
        tempFilePath: string
        
        thumbTempFilePath: string
        
        width: number
    }
    interface MediaQueryObserverObserveCallbackResult {
        
        matches: boolean
    }
    
    interface MediaSource {
        
        url: string
        
        poster?: string
        
        type?: 'image' | 'video'
    }
    
    interface MediaTrack {
        
        duration: number
        
        kind: 'audio' | 'video'
        
        volume: number
    }
    
    interface MiniProgram {
        
        appId: string
        
        envVersion: 'develop' | 'trial' | 'release'
        
        version: string
    }
    interface MkdirOption {
        
        dirPath: string
        
        complete?: MkdirCompleteCallback
        
        fail?: MkdirFailCallback
        
        recursive?: boolean
        
        success?: MkdirSuccessCallback
    }
    interface MoveAlongOption {
        
        duration: number
        
        markerId: number
        
        path: any[]
        
        precision: IAnyObject
        
        autoRotate?: boolean
        
        complete?: MoveAlongCompleteCallback
        
        fail?: MoveAlongFailCallback
        
        success?: MoveAlongSuccessCallback
    }
    interface MoveToLocationOption {
        
        complete?: MoveToLocationCompleteCallback
        
        fail?: MoveToLocationFailCallback
        
        latitude?: number
        
        longitude?: number
        
        success?: MoveToLocationSuccessCallback
    }
    
    interface MuteConfig {
        
        muteEarphone?: boolean
        
        muteMicrophone?: boolean
    }
    interface MuteOption {
        
        complete?: MuteCompleteCallback
        
        fail?: MuteFailCallback
        
        success?: MuteSuccessCallback
    }
    
    interface NFCAdapter {
        
        tech: TechType
        
        offDiscovered(
            
            listener?: OffDiscoveredCallback
        ): void
        
        onDiscovered(
            
            listener: OnDiscoveredCallback
        ): void
        
        startDiscovery(option?: StartDiscoveryOption): void
        
        stopDiscovery(option?: StopDiscoveryOption): void
        
        getIsoDep(): IsoDep
        
        getMifareClassic(): MifareClassic
        
        getMifareUltralight(): MifareUltralight
        
        getNdef(): Ndef
        
        getNfcA(): NfcA
        
        getNfcB(): NfcB
        
        getNfcF(): NfcF
        
        getNfcV(): NfcV
    }
    interface NavigateBackMiniProgramOption {
        
        complete?: NavigateBackMiniProgramCompleteCallback
        
        extraData?: IAnyObject
        
        fail?: NavigateBackMiniProgramFailCallback
        
        success?: NavigateBackMiniProgramSuccessCallback
    }
    interface NavigateBackOption {
        
        complete?: NavigateBackCompleteCallback
        
        delta?: number
        
        fail?: NavigateBackFailCallback
        
        success?: NavigateBackSuccessCallback
    }
    interface NavigateToMiniProgramOption {
        
        appId?: string
        
        complete?: NavigateToMiniProgramCompleteCallback
        
        envVersion?: 'develop' | 'trial' | 'release'
        
        extraData?: IAnyObject
        
        fail?: NavigateToMiniProgramFailCallback
        
        noRelaunchIfPathUnchanged?: boolean
        
        path?: string
        
        shortLink?: string
        
        success?: NavigateToMiniProgramSuccessCallback
    }
    interface NavigateToOption {
        
        url: string
        
        complete?: NavigateToCompleteCallback
        
        events?: IAnyObject
        
        fail?: NavigateToFailCallback
        
        routeType?: string
        
        success?: NavigateToSuccessCallback
    }
    interface NavigateToSuccessCallbackResult {
        
        eventChannel: EventChannel
        errMsg: string
    }
    interface NdefCloseOption {
        
        complete?: NdefCloseCompleteCallback
        
        fail?: NdefCloseFailCallback
        
        success?: NdefCloseSuccessCallback
    }
    interface NdefConnectOption {
        
        complete?: ConnectCompleteCallback
        
        fail?: ConnectFailCallback
        
        success?: ConnectSuccessCallback
    }
    interface NodeCallbackResult {
        
        node: IAnyObject
    }
    interface NotifyBLECharacteristicValueChangeOption {
        
        characteristicId: string
        
        deviceId: string
        
        serviceId: string
        
        state: boolean
        
        complete?: NotifyBLECharacteristicValueChangeCompleteCallback
        
        fail?: NotifyBLECharacteristicValueChangeFailCallback
        
        success?: NotifyBLECharacteristicValueChangeSuccessCallback
        
        type?: string
    }
    
    interface OCRTrack {
        
        mode: 1 | 2
    }
    
    interface ObserveDescriptor {
        
        height: number
        
        maxHeight: number
        
        maxWidth: number
        
        minHeight: number
        
        minWidth: number
        
        orientation: string
        
        width: number
    }
    
    interface ObserveOption {
        
        entryTypes?: string[]
        
        type?: 'navigation' | 'render' | 'script'
    }
    
    interface OffscreenCanvas {
        
        height: number
        
        width: number
        
        createImage(): Image
        
        getContext(
            
            contextType: 'webgl' | '2d'
        ): any
    }
    interface OnAccelerometerChangeListenerResult {
        
        x: number
        
        y: number
        
        z: number
    }
    interface OnApiCategoryChangeListenerResult {
        
        apiCategory:
            | 'default'
            | 'nativeFunctionalized'
            | 'browseOnly'
            | 'embedded'
    }
    interface OnBLECharacteristicValueChangeListenerResult {
        
        characteristicId: string
        
        deviceId: string
        
        serviceId: string
        
        value: ArrayBuffer
    }
    interface OnBLEConnectionStateChangeListenerResult {
        
        connected: boolean
        
        deviceId: string
    }
    interface OnBLEMTUChangeListenerResult {
        
        deviceId: string
        
        mtu: number
    }
    interface OnBLEPeripheralConnectionStateChangedListenerResult {
        
        connected: boolean
        
        deviceId: string
        
        serverId: string
    }
    interface OnBackgroundFetchDataListenerResult {
        
        fetchType: string
        
        fetchedData: string
        
        path: string
        
        query: string
        
        scene: number
        
        timeStamp: number
    }
    interface OnBeaconServiceChangeListenerResult {
        
        available: boolean
        
        discovering: boolean
    }
    interface OnBeaconUpdateListenerResult {
        
        beacons: BeaconInfo[]
    }
    interface OnBluetoothAdapterStateChangeListenerResult {
        
        available: boolean
        
        discovering: boolean
    }
    interface OnBluetoothDeviceFoundListenerResult {
        
        devices: BlueToothDevice[]
    }
    interface OnCameraFrameCallbackResult {
        
        data: ArrayBuffer
        
        height: number
        
        width: number
    }
    interface OnCharacteristicReadRequestListenerResult {
        
        callbackId: number
        
        characteristicId: string
        
        serviceId: string
    }
    interface OnCharacteristicSubscribedListenerResult {
        
        characteristicId: string
        
        serviceId: string
    }
    interface OnCharacteristicWriteRequestListenerResult {
        
        callbackId: number
        
        characteristicId: string
        
        serviceId: string
        
        value: ArrayBuffer
    }
    interface OnCheckForUpdateListenerResult {
        
        hasUpdate: boolean
    }
    interface OnChunkReceivedListenerResult {
        
        data: ArrayBuffer
    }
    interface OnCompassChangeListenerResult {
        
        accuracy: number | string
        
        direction: number
    }
    interface OnCopyUrlListenerResult {
        
        query: string
    }
    interface OnCustomRendererEventCallbackResult {
        
        height: number
        
        width: number
    }
    interface OnDeviceMotionChangeListenerResult {
        
        alpha: number
        
        beta: number
        
        gamma: number
    }
    interface OnDiscoveredListenerResult {
        id: ArrayBuffer
        
        messages: any[]
        
        techs: any[]
    }
    interface OnEmbeddedMiniProgramHeightChangeListenerResult {
        
        height: number
        
        initialHeight: number
    }
    interface OnFrameRecordedListenerResult {
        
        frameBuffer: ArrayBuffer
        
        isLastFrame: boolean
    }
    interface OnGetWifiListListenerResult {
        
        wifiList: WifiInfo[]
    }
    interface OnGyroscopeChangeListenerResult {
        
        x: number
        
        y: number
        
        z: number
    }
    interface OnHCEMessageListenerResult {
        
        data: ArrayBuffer
        
        messageType: 1 | 2
        
        reason: number
    }
    interface OnKeyboardHeightChangeListenerResult {
        
        height: number
    }
    interface OnLazyLoadErrorListenerResult {
        
        errMsg: string
        
        subpackage: any[]
        
        type: string
    }
    interface OnLocalServiceFoundListenerResult {
        
        ip: string
        
        port: number
        
        serviceName: string
        
        serviceType: string
    }
    interface OnLocalServiceLostListenerResult {
        
        serviceName: string
        
        serviceType: string
    }
    interface OnLocationChangeErrorListenerResult {
        
        errCode: number
    }
    interface OnLocationChangeListenerResult {
        
        accuracy: number
        
        altitude: number
        
        horizontalAccuracy: number
        
        latitude: number
        
        longitude: number
        
        speed: number
        
        verticalAccuracy: number
    }
    interface OnMemoryWarningListenerResult {
        
        level: 5 | 10 | 15
    }
    interface OnNetworkStatusChangeListenerResult {
        
        isConnected: boolean
        
        networkType: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none'
    }
    interface OnNetworkWeakChangeListenerResult {
        
        networkType: string
        
        weakNet: boolean
    }
    interface OnOpenListenerResult {
        
        header: IAnyObject
        
        profile: SocketProfile
    }
    interface OnPageNotFoundListenerResult {
        
        isEntryPage: boolean
        
        path: string
        
        query: Record<string, string>
    }
    interface OnScreenRecordingStateChangedListenerResult {
        
        state: 'start' | 'stop'
    }
    interface OnSocketOpenListenerResult {
        
        header: IAnyObject
    }
    interface OnStopListenerResult {
        
        duration: number
        
        fileSize: number
        
        tempFilePath: string
    }
    interface OnThemeChangeListenerResult {
        
        theme: 'dark' | 'light'
    }
    interface OnUnhandledRejectionListenerResult {
        
        promise: Promise<any>
        
        reason: string
    }
    interface OnVoIPChatInterruptedListenerResult {
        
        errCode: number
        
        errMsg: string
    }
    interface OnVoIPChatMembersChangedListenerResult {
        
        errCode: number
        
        errMsg: string
        
        openIdList: string[]
    }
    interface OnVoIPChatSpeakersChangedListenerResult {
        
        errCode: number
        
        errMsg: string
        
        openIdList: string[]
    }
    interface OnVoIPChatStateChangedListenerResult {
        
        code: number
        
        data: IAnyObject
        
        errCode: number
        
        errMsg: string
    }
    interface OnVoIPVideoMembersChangedListenerResult {
        
        errCode: number
        
        errMsg: string
        
        openIdList: string[]
    }
    interface OnWifiConnectedListenerResult {
        
        wifi: WifiInfo
    }
    interface OnWifiConnectedWithPartialInfoListenerResult {
        
        wifi: WifiInfo
    }
    interface OnWindowResizeListenerResult {
        size: Size
    }
    interface OpenAppAuthorizeSettingOption {
        
        complete?: OpenAppAuthorizeSettingCompleteCallback
        
        fail?: OpenAppAuthorizeSettingFailCallback
        
        success?: OpenAppAuthorizeSettingSuccessCallback
    }
    interface OpenBluetoothAdapterOption {
        
        complete?: OpenBluetoothAdapterCompleteCallback
        
        fail?: OpenBluetoothAdapterFailCallback
        
        mode?: 'central' | 'peripheral'
        
        success?: OpenBluetoothAdapterSuccessCallback
    }
    interface OpenCardOption {
        
        cardList: OpenCardRequestInfo[]
        
        complete?: OpenCardCompleteCallback
        
        fail?: OpenCardFailCallback
        
        success?: OpenCardSuccessCallback
    }
    
    interface OpenCardRequestInfo {
        
        cardId: string
        
        code: string
    }
    interface OpenChannelsActivityOption {
        
        feedId: string
        
        finderUserName: string
        
        complete?: OpenChannelsActivityCompleteCallback
        
        fail?: OpenChannelsActivityFailCallback
        
        success?: OpenChannelsActivitySuccessCallback
    }
    interface OpenChannelsEventOption {
        
        eventId: string
        
        finderUserName: string
        
        complete?: OpenChannelsEventCompleteCallback
        
        fail?: OpenChannelsEventFailCallback
        
        success?: OpenChannelsEventSuccessCallback
    }
    interface OpenChannelsLiveOption {
        
        finderUserName: string
        
        complete?: OpenChannelsLiveCompleteCallback
        
        fail?: OpenChannelsLiveFailCallback
        
        feedId?: string
        
        nonceId?: string
        
        success?: OpenChannelsLiveSuccessCallback
    }
    interface OpenChannelsUserProfileOption {
        
        finderUserName: string
        
        complete?: OpenChannelsUserProfileCompleteCallback
        
        fail?: OpenChannelsUserProfileFailCallback
        
        success?: OpenChannelsUserProfileSuccessCallback
    }
    interface OpenCustomerServiceChatOption {
        
        corpId: string
        
        extInfo: ExtInfoOption
        
        complete?: OpenCustomerServiceChatCompleteCallback
        
        fail?: OpenCustomerServiceChatFailCallback
        
        sendMessageImg?: string
        
        sendMessagePath?: string
        
        sendMessageTitle?: string
        
        showMessageCard?: boolean
        
        success?: OpenCustomerServiceChatSuccessCallback
    }
    interface OpenDocumentOption {
        
        filePath: string
        
        complete?: OpenDocumentCompleteCallback
        
        fail?: OpenDocumentFailCallback
        
        fileType?: 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'pdf'
        
        showMenu?: boolean
        
        success?: OpenDocumentSuccessCallback
    }
    interface OpenEmbeddedMiniProgramOption {
        
        appId: string
        
        allowFullScreen?: boolean
        
        complete?: OpenEmbeddedMiniProgramCompleteCallback
        
        envVersion?: 'develop' | 'trial' | 'release'
        
        extraData?: IAnyObject
        
        fail?: OpenEmbeddedMiniProgramFailCallback
        
        noRelaunchIfPathUnchanged?: boolean
        
        path?: string
        
        shortLink?: string
        
        success?: OpenEmbeddedMiniProgramSuccessCallback
        
        verify?: 'binding' | 'unionProduct'
    }
    interface OpenLocationOption {
        
        latitude: number
        
        longitude: number
        
        address?: string
        
        complete?: OpenLocationCompleteCallback
        
        fail?: OpenLocationFailCallback
        
        name?: string
        
        scale?: number
        
        success?: OpenLocationSuccessCallback
    }
    interface OpenMapAppOption {
        
        destination: string
        
        latitude: number
        
        longitude: number
        
        complete?: OpenMapAppCompleteCallback
        
        fail?: OpenMapAppFailCallback
        
        success?: OpenMapAppSuccessCallback
    }
    interface OpenOption {
        
        filePath: string
        
        complete?: OpenCompleteCallback
        
        fail?: OpenFailCallback
        
        flag?:
            | 'a'
            | 'ax'
            | 'a+'
            | 'ax+'
            | 'as'
            | 'as+'
            | 'r'
            | 'r+'
            | 'w'
            | 'wx'
            | 'w+'
            | 'wx+'
        
        success?: OpenSuccessCallback
    }
    interface OpenPrivacyContractOption {
        
        complete?: OpenPrivacyContractCompleteCallback
        
        fail?: OpenPrivacyContractFailCallback
        
        success?: OpenPrivacyContractSuccessCallback
    }
    interface OpenSettingOption {
        
        complete?: OpenSettingCompleteCallback
        
        fail?: OpenSettingFailCallback
        
        success?: OpenSettingSuccessCallback
        
        withSubscriptions?: boolean
    }
    interface OpenSettingSuccessCallbackResult {
        
        authSetting: AuthSetting
        
        subscriptionsSetting: SubscriptionsSetting
        errMsg: string
    }
    interface OpenSingleStickerViewOption {
        
        url: IAnyObject
        
        complete?: OpenSingleStickerViewCompleteCallback
        
        fail?: OpenSingleStickerViewFailCallback
        
        success?: OpenSingleStickerViewSuccessCallback
    }
    interface OpenStickerIPViewOption {
        
        url: IAnyObject
        
        complete?: OpenStickerIPViewCompleteCallback
        
        fail?: OpenStickerIPViewFailCallback
        
        success?: OpenStickerIPViewSuccessCallback
    }
    interface OpenStickerSetViewOption {
        
        url: IAnyObject
        
        complete?: OpenStickerSetViewCompleteCallback
        
        fail?: OpenStickerSetViewFailCallback
        
        success?: OpenStickerSetViewSuccessCallback
    }
    interface OpenSuccessCallbackResult {
        
        fd: string
        errMsg: string
    }
    interface OpenSyncOption {
        
        filePath: string
        
        flag?:
            | 'a'
            | 'ax'
            | 'a+'
            | 'ax+'
            | 'as'
            | 'as+'
            | 'r'
            | 'r+'
            | 'w'
            | 'wx'
            | 'w+'
            | 'wx+'
    }
    interface OpenSystemBluetoothSettingOption {
        
        complete?: OpenSystemBluetoothSettingCompleteCallback
        
        fail?: OpenSystemBluetoothSettingFailCallback
        
        success?: OpenSystemBluetoothSettingSuccessCallback
    }
    interface OpenVideoEditorOption {
        
        filePath: string
        
        maxDuration: string
        
        minDuration: string
        
        complete?: OpenVideoEditorCompleteCallback
        
        fail?: OpenVideoEditorFailCallback
        
        success?: OpenVideoEditorSuccessCallback
    }
    interface OpenVideoEditorSuccessCallbackResult {
        
        duration: number
        
        size: number
        
        tempFilePath: string
        
        tempThumbPath: string
        errMsg: string
    }
    interface PageScrollToOption {
        
        complete?: PageScrollToCompleteCallback
        
        duration?: number
        
        fail?: PageScrollToFailCallback
        
        offsetTop?: number
        
        scrollTop?: number
        
        selector?: string
        
        success?: PageScrollToSuccessCallback
    }
    interface PauseBGMOption {
        
        complete?: PauseBGMCompleteCallback
        
        fail?: PauseBGMFailCallback
        
        success?: PauseBGMSuccessCallback
    }
    interface PauseBackgroundAudioOption {
        
        complete?: PauseBackgroundAudioCompleteCallback
        
        fail?: PauseBackgroundAudioFailCallback
        
        success?: PauseBackgroundAudioSuccessCallback
    }
    interface PauseOption {
        
        complete?: PauseCompleteCallback
        
        fail?: PauseFailCallback
        
        success?: PauseSuccessCallback
    }
    interface PauseVoiceOption {
        
        complete?: PauseVoiceCompleteCallback
        
        fail?: PauseVoiceFailCallback
        
        success?: PauseVoiceSuccessCallback
    }
    
    interface PerformanceEntry {
        
        domainLookupEnd: number
        
        domainLookupStart: number
        
        duration: number
        
        entryType: 'navigation' | 'render' | 'script'
        
        fileList: string[]
        
        initDataRecvTime: number
        
        initDataSendTime: number
        
        initiatorType: 'audio' | 'cover-image' | 'image' | 'open-data'
        
        moduleName: string
        
        name:
            | 'appLaunch'
            | 'route'
            | 'firstRender'
            | 'firstPaint'
            | 'firstContentfulPaint'
            | 'largestContentfulPaint'
            | 'evaluateScript'
            | 'downloadPackage'
            | 'resourceTiming'
        
        navigationStart: number
        
        navigationType: string
        
        packageName: string
        
        packageSize: number
        
        pageId: number
        
        path: string
        
        referrerPageId: number
        
        referrerPath: number
        
        startTime: number
        
        transferSize: number
        
        uri: string
        
        viewLayerReadyTime: number
        
        viewLayerRenderEndTime: number
        
        viewLayerRenderStartTime: number
    }
    
    interface PerformanceObserver {
        
        supportedEntryTypes: any[]
        
        disconnect(): void
        
        observe(
            
            options: ObserveOption
        ): void
    }
    
    interface PlaneTrack {
        
        mode: 1 | 2 | 3
    }
    interface PlayBGMOption {
        
        url: string
        
        complete?: PlayBGMCompleteCallback
        
        endTimeMs?: number
        
        fail?: PlayBGMFailCallback
        
        startTimeMs?: number
        
        success?: PlayBGMSuccessCallback
    }
    interface PlayBackgroundAudioOption {
        
        dataUrl: string
        
        complete?: PlayBackgroundAudioCompleteCallback
        
        coverImgUrl?: string
        
        fail?: PlayBackgroundAudioFailCallback
        
        success?: PlayBackgroundAudioSuccessCallback
        
        title?: string
    }
    interface PlayOption {
        
        complete?: PlayCompleteCallback
        
        fail?: PlayFailCallback
        
        success?: PlaySuccessCallback
    }
    interface PlayVoiceOption {
        
        filePath: string
        
        complete?: PlayVoiceCompleteCallback
        
        duration?: number
        
        fail?: PlayVoiceFailCallback
        
        success?: PlayVoiceSuccessCallback
    }
    
    interface Plugin {
        
        appId: string
        
        version: string
    }
    interface PluginLoginOption {
        
        complete?: PluginLoginCompleteCallback
        
        fail?: PluginLoginFailCallback
        
        success?: PluginLoginSuccessCallback
    }
    interface PluginLoginSuccessCallbackResult {
        
        code: string
        errMsg: string
    }
    interface PreDownloadSubpackageOption {
        
        complete: (...args: any[]) => any
        
        fail: (...args: any[]) => any
        
        packageType: string
        
        success: (...args: any[]) => any
    }
    interface PreDownloadSubpackageTaskOnProgressUpdateListenerResult {
        
        progress: number
        
        totalBytesExpectedToWrite: number
        
        totalBytesWritten: number
    }
    interface PreloadAssetsOption {
        data: Asset[]
        
        complete?: PreloadAssetsCompleteCallback
        
        fail?: PreloadAssetsFailCallback
        
        success?: PreloadAssetsSuccessCallback
    }
    interface PreloadSkylineViewOption {
        
        complete?: PreloadSkylineViewCompleteCallback
        
        fail?: PreloadSkylineViewFailCallback
        
        success?: PreloadSkylineViewSuccessCallback
    }
    interface PreloadWebviewOption {
        
        complete?: PreloadWebviewCompleteCallback
        
        fail?: PreloadWebviewFailCallback
        
        success?: PreloadWebviewSuccessCallback
    }
    interface PreviewImageOption {
        
        urls: string[]
        
        complete?: PreviewImageCompleteCallback
        
        current?: string
        
        fail?: PreviewImageFailCallback
        
        referrerPolicy?: string
        
        showmenu?: boolean
        
        success?: PreviewImageSuccessCallback
    }
    interface PreviewMediaOption {
        
        sources: MediaSource[]
        
        complete?: PreviewMediaCompleteCallback
        
        current?: number
        
        fail?: PreviewMediaFailCallback
        
        referrerPolicy?: string
        
        showmenu?: boolean
        
        success?: PreviewMediaSuccessCallback
    }
    
    interface PromoterResult {
        
        finderNickname: string
        
        promoterId: string
        
        promoterOpenId: string
    }
    interface ReLaunchOption {
        
        url: string
        
        complete?: ReLaunchCompleteCallback
        
        fail?: ReLaunchFailCallback
        
        success?: ReLaunchSuccessCallback
    }
    interface ReadBLECharacteristicValueOption {
        
        characteristicId: string
        
        deviceId: string
        
        serviceId: string
        
        complete?: ReadBLECharacteristicValueCompleteCallback
        
        fail?: ReadBLECharacteristicValueFailCallback
        
        success?: ReadBLECharacteristicValueSuccessCallback
    }
    interface ReadCompressedFileOption {
        
        compressionAlgorithm: 'br'
        
        filePath: string
        
        complete?: ReadCompressedFileCompleteCallback
        
        fail?: ReadCompressedFileFailCallback
        
        success?: ReadCompressedFileSuccessCallback
    }
    interface ReadCompressedFileSuccessCallbackResult {
        
        data: ArrayBuffer
        errMsg: string
    }
    interface ReadCompressedFileSyncOption {
        
        compressionAlgorithm: 'br'
        
        filePath: string
    }
    interface ReadFileOption {
        
        filePath: string
        
        complete?: ReadFileCompleteCallback
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        fail?: ReadFileFailCallback
        
        length?: number
        
        position?: number
        
        success?: ReadFileSuccessCallback
    }
    interface ReadFileSuccessCallbackResult {
        
        data: string | ArrayBuffer
        errMsg: string
    }
    interface ReadOption {
        
        arrayBuffer: ArrayBuffer
        
        fd: string
        
        complete?: ReadCompleteCallback
        
        fail?: ReadFailCallback
        
        length?: number
        
        offset?: number
        
        position?: number
        
        success?: ReadSuccessCallback
    }
    
    interface ReadResult {
        
        arrayBuffer: ArrayBuffer
        
        bytesRead: number
    }
    interface ReadSuccessCallbackResult {
        
        arrayBuffer: ArrayBuffer
        
        bytesRead: number
        errMsg: string
    }
    interface ReadSyncOption {
        
        arrayBuffer: ArrayBuffer
        
        fd: string
        
        length?: number
        
        offset?: number
        
        position?: number
    }
    interface ReadZipEntryOption {
        
        entries: EntryItem[] | 'all'
        
        filePath: string
        
        complete?: ReadZipEntryCompleteCallback
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        fail?: ReadZipEntryFailCallback
        
        success?: ReadZipEntrySuccessCallback
    }
    interface ReadZipEntrySuccessCallbackResult {
        
        entries: EntriesResult
        errMsg: string
    }
    interface ReaddirOption {
        
        dirPath: string
        
        complete?: ReaddirCompleteCallback
        
        fail?: ReaddirFailCallback
        
        success?: ReaddirSuccessCallback
    }
    interface ReaddirSuccessCallbackResult {
        
        files: string[]
        errMsg: string
    }
    interface ReconnectCastingOption {
        
        complete?: ReconnectCastingCompleteCallback
        
        fail?: ReconnectCastingFailCallback
        
        success?: ReconnectCastingSuccessCallback
    }
    interface RecorderManagerStartOption {
        
        audioSource?:
            | 'auto'
            | 'buildInMic'
            | 'headsetMic'
            | 'mic'
            | 'camcorder'
            | 'voice_communication'
            | 'voice_recognition'
        
        duration?: number
        
        encodeBitRate?: number
        
        format?: 'mp3' | 'aac' | 'wav' | 'PCM'
        
        frameSize?: number
        
        numberOfChannels?: 1 | 2
        
        sampleRate?:
            | 8000
            | 11025
            | 12000
            | 16000
            | 22050
            | 24000
            | 32000
            | 44100
            | 48000
    }
    interface RedirectToOption {
        
        url: string
        
        complete?: RedirectToCompleteCallback
        
        fail?: RedirectToFailCallback
        
        success?: RedirectToSuccessCallback
    }
    interface RedoOption {
        
        complete?: RedoCompleteCallback
        
        fail?: RedoFailCallback
        
        success?: RedoSuccessCallback
    }
    
    interface ReferrerInfo {
        
        appId: string
        
        extraData: IAnyObject
    }
    
    interface RelativeRectResult {
        
        bottom: number
        
        left: number
        
        right: number
        
        top: number
    }
    
    interface RemoteInfo {
        
        address: string
        
        family: string
        
        port: number
        
        size: number
    }
    interface RemoveArcOption {
        
        id: number
        
        complete?: RemoveArcCompleteCallback
        
        fail?: RemoveArcFailCallback
        
        success?: RemoveArcSuccessCallback
    }
    interface RemoveCustomLayerOption {
        
        layerId: string
        
        complete?: RemoveCustomLayerCompleteCallback
        
        fail?: RemoveCustomLayerFailCallback
        
        success?: RemoveCustomLayerSuccessCallback
    }
    interface RemoveFormatOption {
        
        complete?: RemoveFormatCompleteCallback
        
        fail?: RemoveFormatFailCallback
        
        success?: RemoveFormatSuccessCallback
    }
    interface RemoveGroundOverlayOption {
        
        id: string
        
        complete?: RemoveGroundOverlayCompleteCallback
        
        fail?: RemoveGroundOverlayFailCallback
        
        success?: RemoveGroundOverlaySuccessCallback
    }
    interface RemoveMarkersOption {
        
        markerIds: any[]
        
        complete?: RemoveMarkersCompleteCallback
        
        fail?: RemoveMarkersFailCallback
        
        success?: RemoveMarkersSuccessCallback
    }
    interface RemoveSavedFileOption {
        
        filePath: string
        
        complete?: RemoveSavedFileCompleteCallback
        
        fail?: RemoveSavedFileFailCallback
        
        success?: RemoveSavedFileSuccessCallback
    }
    interface RemoveServiceOption {
        
        serviceId: string
        
        complete?: RemoveServiceCompleteCallback
        
        fail?: RemoveServiceFailCallback
        
        success?: RemoveServiceSuccessCallback
    }
    interface RemoveStorageOption {
        
        key: string
        
        complete?: RemoveStorageCompleteCallback
        
        fail?: RemoveStorageFailCallback
        
        success?: RemoveStorageSuccessCallback
    }
    interface RemoveTabBarBadgeOption {
        
        index: number
        
        complete?: RemoveTabBarBadgeCompleteCallback
        
        fail?: RemoveTabBarBadgeFailCallback
        
        success?: RemoveTabBarBadgeSuccessCallback
    }
    interface RemoveVisualLayerOption {
        
        layerId: string
        
        complete?: RemoveVisualLayerCompleteCallback
        
        fail?: RemoveVisualLayerFailCallback
        
        success?: RemoveVisualLayerSuccessCallback
    }
    interface RenameOption {
        
        newPath: string
        
        oldPath: string
        
        complete?: RenameCompleteCallback
        
        fail?: RenameFailCallback
        
        success?: RenameSuccessCallback
    }
    
    interface RenderingContext {}
    interface RequestCommonPaymentFailCallbackErr {
        
        errCode: number
        
        errMsg: string
    }
    interface RequestCommonPaymentOption {
        
        mode: string
        
        paySig: string
        
        signData: SignData
        
        signature: string
        
        complete?: RequestCommonPaymentCompleteCallback
        
        fail?: RequestCommonPaymentFailCallback
        
        success?: RequestCommonPaymentSuccessCallback
    }
    interface RequestCommonPaymentSuccessCallbackResult {
        
        errMsg: string
    }
    interface RequestDeviceVoIPOption {
        
        deviceName: string
        
        groupId: string
        
        modelId: string
        
        sn: string
        
        snTicket: string
        
        complete?: RequestDeviceVoIPCompleteCallback
        
        fail?: RequestDeviceVoIPFailCallback
        
        isGroup?: boolean
        
        success?: RequestDeviceVoIPSuccessCallback
    }
    
    interface RequestException {
        
        reasons: ExceptionReason[]
        
        retryCount: number
    }
    interface RequestFailCallbackErr {
        
        errMsg: string
        
        errno: number
    }
    interface RequestOption<
        T extends string | IAnyObject | ArrayBuffer =
            | string
            | IAnyObject
            | ArrayBuffer
    > {
        
        url: string
        
        complete?: RequestCompleteCallback
        
        data?: string | IAnyObject | ArrayBuffer
        
        dataType?: 'json' | '其他'
        
        enableCache?: boolean
        
        enableChunked?: boolean
        
        enableHttp2?: boolean
        
        enableHttpDNS?: boolean
        
        enableQuic?: boolean
        
        fail?: RequestFailCallback
        
        forceCellularNetwork?: boolean
        
        header?: IAnyObject
        
        httpDNSServiceId?: string
        
        method?:
            | 'OPTIONS'
            | 'GET'
            | 'HEAD'
            | 'POST'
            | 'PUT'
            | 'DELETE'
            | 'TRACE'
            | 'CONNECT'
        
        redirect?: 'follow' | 'manual'
        
        responseType?: 'text' | 'arraybuffer'
        
        success?: RequestSuccessCallback<T>
        
        timeout?: number
    }
    interface RequestOrderPaymentOption {
        
        nonceStr: string
        
        package: string
        
        paySign: string
        
        timeStamp: string
        
        complete?: RequestOrderPaymentCompleteCallback
        
        extUserUin?: string
        
        fail?: RequestOrderPaymentFailCallback
        
        orderInfo?: IAnyObject
        
        signType?: 'MD5' | 'HMAC-SHA256' | 'RSA'
        
        success?: RequestOrderPaymentSuccessCallback
    }
    interface RequestPaymentOption {
        
        nonceStr: string
        
        package: string
        
        paySign: string
        
        timeStamp: string
        
        complete?: RequestPaymentCompleteCallback
        
        fail?: RequestPaymentFailCallback
        
        signType?: 'MD5' | 'HMAC-SHA256' | 'RSA'
        
        success?: RequestPaymentSuccessCallback
    }
    interface RequestPictureInPictureOption {
        
        complete?: RequestPictureInPictureCompleteCallback
        
        fail?: RequestPictureInPictureFailCallback
        
        success?: RequestPictureInPictureSuccessCallback
    }
    interface RequestPluginPaymentOption {
        
        fee: number
        
        paymentArgs: IAnyObject
        
        version: 'develop' | 'trial' | 'release'
        
        complete?: RequestPluginPaymentCompleteCallback
        
        currencyType?: string
        
        fail?: RequestPluginPaymentFailCallback
        
        success?: RequestPluginPaymentSuccessCallback
    }
    
    interface RequestProfile {
        
        SSLconnectionEnd: number
        
        SSLconnectionStart: number
        
        connectEnd: number
        
        connectStart: number
        
        domainLookUpEnd: number
        
        domainLookUpStart: number
        
        downstreamThroughputKbpsEstimate: number
        
        estimate_nettype: number
        
        fetchStart: number
        
        httpRttEstimate: number
        
        peerIP: string
        
        port: number
        
        protocol: string
        
        receivedBytedCount: number
        
        redirectEnd: number
        
        redirectStart: number
        
        requestEnd: number
        
        requestStart: number
        
        responseEnd: number
        
        responseStart: number
        
        rtt: number
        
        sendBytesCount: number
        
        socketReused: boolean
        
        throughputKbps: number
        
        transportRttEstimate: number
    }
    interface RequestSubscribeDeviceMessageFailCallbackResult {
        
        errCode: number
        
        errMsg: string
    }
    interface RequestSubscribeDeviceMessageOption {
        
        modelId: string
        
        sn: string
        
        snTicket: string
        
        tmplIds: any[]
        
        complete?: RequestSubscribeDeviceMessageCompleteCallback
        
        fail?: RequestSubscribeDeviceMessageFailCallback
        
        success?: RequestSubscribeDeviceMessageSuccessCallback
    }
    interface RequestSubscribeDeviceMessageSuccessCallbackResult {
        
        [TEMPLATE_ID: string]: string
        
        errMsg: string
    }
    interface RequestSubscribeMessageFailCallbackResult {
        
        errCode: number
        
        errMsg: string
    }
    interface RequestSubscribeMessageOption {
        
        tmplIds: any[]
        
        complete?: RequestSubscribeMessageCompleteCallback
        
        fail?: RequestSubscribeMessageFailCallback
        
        success?: RequestSubscribeMessageSuccessCallback
    }
    interface RequestSubscribeMessageSuccessCallbackResult {
        
        [TEMPLATE_ID: string]: string
        
        errMsg: string
    }
    interface RequestSuccessCallbackResult<
        T extends string | IAnyObject | ArrayBuffer =
            | string
            | IAnyObject
            | ArrayBuffer
    > {
        
        cookies: string[]
        
        data: T
        
        exception: RequestException
        
        header: IAnyObject
        
        profile: RequestProfile
        
        statusCode: number
        errMsg: string
    }
    interface RequestTaskOnHeadersReceivedListenerResult {
        
        cookies: string[]
        
        header: IAnyObject
        
        statusCode: number
    }
    interface RequestVirtualPaymentOption {
        
        mode: 'short_series_goods' | 'short_series_coin'
        
        paySig: string
        
        signData: SignData
        
        signature: string
        
        complete?: RequestVirtualPaymentCompleteCallback
        
        fail?: RequestVirtualPaymentFailCallback
        
        success?: RequestVirtualPaymentSuccessCallback
    }
    interface RequirePrivacyAuthorizeOption {
        
        complete?: RequirePrivacyAuthorizeCompleteCallback
        
        fail?: RequirePrivacyAuthorizeFailCallback
        
        success?: RequirePrivacyAuthorizeSuccessCallback
    }
    interface ReserveChannelsLiveOption {
        
        noticeId: string
    }
    interface RestartMiniProgramOption {
        
        path: string
        
        complete?: RestartMiniProgramCompleteCallback
        
        fail?: RestartMiniProgramFailCallback
        
        success?: RestartMiniProgramSuccessCallback
    }
    interface ResumeBGMOption {
        
        complete?: ResumeBGMCompleteCallback
        
        fail?: ResumeBGMFailCallback
        
        success?: ResumeBGMSuccessCallback
    }
    interface ResumeOption {
        
        complete?: ResumeCompleteCallback
        
        fail?: ResumeFailCallback
        
        success?: ResumeSuccessCallback
    }
    interface RewardedVideoAdOnCloseListenerResult {
        
        isEnded: boolean
    }
    interface RewardedVideoAdOnErrorListenerResult {
        
        errCode: 1000 | 1001 | 1002 | 1003 | 1004 | 1005 | 1006 | 1007 | 1008
        
        errMsg: string
    }
    interface RmdirOption {
        
        dirPath: string
        
        complete?: RmdirCompleteCallback
        
        fail?: RmdirFailCallback
        
        recursive?: boolean
        
        success?: RmdirSuccessCallback
    }
    interface RunOCROption {
        
        frameBuffer: ArrayBuffer
        
        height: number
        
        width: number
    }
    interface SafeArea {
        
        bottom: number
        
        height: number
        
        left: number
        
        right: number
        
        top: number
        
        width: number
    }
    interface SaveFileOption {
        
        tempFilePath: string
        
        complete?: SaveFileCompleteCallback
        
        fail?: SaveFileFailCallback
        
        filePath?: string
        
        success?: SaveFileSuccessCallback
    }
    interface SaveFileSuccessCallbackResult {
        
        savedFilePath: string
        errMsg: string
    }
    interface SaveFileToDiskOption {
        
        filePath: string
        
        complete?: SaveFileToDiskCompleteCallback
        
        fail?: SaveFileToDiskFailCallback
        
        success?: SaveFileToDiskSuccessCallback
    }
    interface SaveImageToPhotosAlbumOption {
        
        filePath: string
        
        complete?: SaveImageToPhotosAlbumCompleteCallback
        
        fail?: SaveImageToPhotosAlbumFailCallback
        
        success?: SaveImageToPhotosAlbumSuccessCallback
    }
    interface SaveVideoToPhotosAlbumOption {
        
        filePath: string
        
        complete?: SaveVideoToPhotosAlbumCompleteCallback
        
        fail?: SaveVideoToPhotosAlbumFailCallback
        
        success?: SaveVideoToPhotosAlbumSuccessCallback
    }
    interface ScanCodeOption {
        
        complete?: ScanCodeCompleteCallback
        
        fail?: ScanCodeFailCallback
        
        onlyFromCamera?: boolean
        
        scanType?: Array<'barCode' | 'qrCode' | 'datamatrix' | 'pdf417'>
        
        success?: ScanCodeSuccessCallback
    }
    interface ScanCodeSuccessCallbackResult {
        
        charSet: string
        
        path: string
        
        rawData: string
        
        result: string
        
        scanType:
            | 'QR_CODE'
            | 'AZTEC'
            | 'CODABAR'
            | 'CODE_39'
            | 'CODE_93'
            | 'CODE_128'
            | 'DATA_MATRIX'
            | 'EAN_8'
            | 'EAN_13'
            | 'ITF'
            | 'MAXICODE'
            | 'PDF_417'
            | 'RSS_14'
            | 'RSS_EXPANDED'
            | 'UPC_A'
            | 'UPC_E'
            | 'UPC_EAN_EXTENSION'
            | 'WX_CODE'
            | 'CODE_25'
        errMsg: string
    }
    interface ScrollOffsetCallbackResult {
        
        dataset: IAnyObject
        
        id: string
        
        scrollLeft: number
        
        scrollTop: number
    }
    
    interface ScrollViewContext {
        
        bounces: boolean
        
        decelerationDisabled: boolean
        
        fastDeceleration: boolean
        
        pagingEnabled: boolean
        
        scrollEnabled: boolean
        
        showScrollbar: boolean
        
        closeRefresh(): void
        
        closeTwoLevel(option: TriggerRefreshOption): void
        
        scrollIntoView(
            
            selector: string,
            
            ScrollIntoViewOptions: IAnyObject
        ): void
        
        scrollTo(option: ScrollViewContextScrollToOption): void
        
        triggerRefresh(option: TriggerRefreshOption): void
        
        triggerTwoLevel(option: TriggerRefreshOption): void
    }
    interface ScrollViewContextScrollToOption {
        
        animated?: boolean
        
        duration?: number
        
        left?: number
        
        top?: number
        
        velocity?: number
    }
    interface SeekBackgroundAudioOption {
        
        position: number
        
        complete?: SeekBackgroundAudioCompleteCallback
        
        fail?: SeekBackgroundAudioFailCallback
        
        success?: SeekBackgroundAudioSuccessCallback
    }
    interface SendHCEMessageOption {
        
        data: ArrayBuffer
        
        complete?: SendHCEMessageCompleteCallback
        
        fail?: SendHCEMessageFailCallback
        
        success?: SendHCEMessageSuccessCallback
    }
    interface SendMessageOption {
        
        msg: string
        
        complete?: SendMessageCompleteCallback
        
        fail?: SendMessageFailCallback
        
        success?: SendMessageSuccessCallback
    }
    interface SendSmsOption {
        
        complete?: SendSmsCompleteCallback
        
        content?: string
        
        fail?: SendSmsFailCallback
        
        phoneNumber?: string
        
        success?: SendSmsSuccessCallback
    }
    interface SendSocketMessageOption {
        
        data: string | ArrayBuffer
        
        complete?: SendSocketMessageCompleteCallback
        
        fail?: SendSocketMessageFailCallback
        
        success?: SendSocketMessageSuccessCallback
    }
    interface SetBGMVolumeOption {
        
        volume: string
        
        complete?: SetBGMVolumeCompleteCallback
        
        fail?: SetBGMVolumeFailCallback
        
        success?: SetBGMVolumeSuccessCallback
    }
    interface SetBLEMTUFailCallbackResult {
        
        mtu: number
    }
    interface SetBLEMTUOption {
        
        deviceId: string
        
        mtu: number
        
        complete?: SetBLEMTUCompleteCallback
        
        fail?: SetBLEMTUFailCallback
        
        success?: SetBLEMTUSuccessCallback
    }
    interface SetBLEMTUSuccessCallbackResult {
        
        mtu: number
        errMsg: string
    }
    interface SetBackgroundColorOption {
        
        backgroundColor?: string
        
        backgroundColorBottom?: string
        
        backgroundColorTop?: string
        
        complete?: SetBackgroundColorCompleteCallback
        
        fail?: SetBackgroundColorFailCallback
        
        success?: SetBackgroundColorSuccessCallback
    }
    interface SetBackgroundFetchTokenOption {
        
        token: string
        
        complete?: SetBackgroundFetchTokenCompleteCallback
        
        fail?: SetBackgroundFetchTokenFailCallback
        
        success?: SetBackgroundFetchTokenSuccessCallback
    }
    interface SetBackgroundTextStyleOption {
        
        textStyle: 'dark' | 'light'
        
        complete?: SetBackgroundTextStyleCompleteCallback
        
        fail?: SetBackgroundTextStyleFailCallback
        
        success?: SetBackgroundTextStyleSuccessCallback
    }
    interface SetBoundaryOption {
        
        northeast: MapPostion
        
        southwest: MapPostion
        
        complete?: SetBoundaryCompleteCallback
        
        fail?: SetBoundaryFailCallback
        
        success?: SetBoundarySuccessCallback
    }
    interface SetCenterOffsetOption {
        
        offset: number[]
        
        complete?: SetCenterOffsetCompleteCallback
        
        fail?: SetCenterOffsetFailCallback
        
        success?: SetCenterOffsetSuccessCallback
    }
    interface SetClipboardDataOption {
        
        data: string
        
        complete?: SetClipboardDataCompleteCallback
        
        fail?: SetClipboardDataFailCallback
        
        success?: SetClipboardDataSuccessCallback
    }
    interface SetContentsOption {
        
        complete?: SetContentsCompleteCallback
        
        delta?: IAnyObject
        
        fail?: SetContentsFailCallback
        
        html?: string
        
        success?: SetContentsSuccessCallback
    }
    interface SetEnable1v1ChatOption {
        
        enable: boolean
        
        backgroundType?: 0 | 1 | 2 | 3 | 4 | 5
        
        complete?: SetEnable1v1ChatCompleteCallback
        
        fail?: SetEnable1v1ChatFailCallback
        
        minWindowType?: number
        
        success?: SetEnable1v1ChatSuccessCallback
    }
    interface SetEnableDebugOption {
        
        enableDebug: boolean
        
        complete?: SetEnableDebugCompleteCallback
        
        fail?: SetEnableDebugFailCallback
        
        success?: SetEnableDebugSuccessCallback
    }
    interface SetInnerAudioOption {
        
        complete?: SetInnerAudioOptionCompleteCallback
        
        fail?: SetInnerAudioOptionFailCallback
        
        mixWithOther?: boolean
        
        obeyMuteSwitch?: boolean
        
        speakerOn?: boolean
        
        success?: SetInnerAudioOptionSuccessCallback
    }
    interface SetKeepScreenOnOption {
        
        keepScreenOn: boolean
        
        complete?: SetKeepScreenOnCompleteCallback
        
        fail?: SetKeepScreenOnFailCallback
        
        success?: SetKeepScreenOnSuccessCallback
    }
    interface SetLocMarkerIconOption {
        
        complete?: SetLocMarkerIconCompleteCallback
        
        fail?: SetLocMarkerIconFailCallback
        
        iconPath?: string
        
        success?: SetLocMarkerIconSuccessCallback
    }
    interface SetMICVolumeOption {
        
        volume: number
        
        complete?: SetMICVolumeCompleteCallback
        
        fail?: SetMICVolumeFailCallback
        
        success?: SetMICVolumeSuccessCallback
    }
    interface SetNavigationBarColorOption {
        
        backgroundColor: string
        
        frontColor: string
        
        animation?: AnimationOption
        
        complete?: SetNavigationBarColorCompleteCallback
        
        fail?: SetNavigationBarColorFailCallback
        
        success?: SetNavigationBarColorSuccessCallback
    }
    interface SetNavigationBarTitleOption {
        
        title: string
        
        complete?: SetNavigationBarTitleCompleteCallback
        
        fail?: SetNavigationBarTitleFailCallback
        
        success?: SetNavigationBarTitleSuccessCallback
    }
    interface SetScreenBrightnessOption {
        
        value: number
        
        complete?: SetScreenBrightnessCompleteCallback
        
        fail?: SetScreenBrightnessFailCallback
        
        success?: SetScreenBrightnessSuccessCallback
    }
    interface SetStorageOption<T = any> {
        
        data: T
        
        key: string
        
        complete?: SetStorageCompleteCallback
        
        encrypt?: boolean
        
        fail?: SetStorageFailCallback
        
        success?: SetStorageSuccessCallback
    }
    interface SetTabBarBadgeOption {
        
        index: number
        
        text: string
        
        complete?: SetTabBarBadgeCompleteCallback
        
        fail?: SetTabBarBadgeFailCallback
        
        success?: SetTabBarBadgeSuccessCallback
    }
    interface SetTabBarItemOption {
        
        index: number
        
        complete?: SetTabBarItemCompleteCallback
        
        fail?: SetTabBarItemFailCallback
        
        iconPath?: string
        
        selectedIconPath?: string
        
        success?: SetTabBarItemSuccessCallback
        
        text?: string
    }
    interface SetTabBarStyleOption {
        
        backgroundColor?: string
        
        borderStyle?: string
        
        color?: string
        
        complete?: SetTabBarStyleCompleteCallback
        
        fail?: SetTabBarStyleFailCallback
        
        selectedColor?: string
        
        success?: SetTabBarStyleSuccessCallback
    }
    interface SetTimeoutOption {
        
        timeout: number
        
        complete?: SetTimeoutCompleteCallback
        
        fail?: SetTimeoutFailCallback
        
        success?: SetTimeoutSuccessCallback
    }
    interface SetTopBarTextOption {
        
        text: string
        
        complete?: SetTopBarTextCompleteCallback
        
        fail?: SetTopBarTextFailCallback
        
        success?: SetTopBarTextSuccessCallback
    }
    interface SetVisualEffectOnCaptureOption {
        
        complete?: SetVisualEffectOnCaptureCompleteCallback
        
        fail?: SetVisualEffectOnCaptureFailCallback
        
        success?: SetVisualEffectOnCaptureSuccessCallback
        
        visualEffect?: string
    }
    interface SetWifiListOption {
        
        wifiList: WifiData[]
        
        complete?: SetWifiListCompleteCallback
        
        fail?: SetWifiListFailCallback
        
        success?: SetWifiListSuccessCallback
    }
    interface SetWindowSizeOption {
        
        height: number
        
        width: number
        
        complete?: SetWindowSizeCompleteCallback
        
        fail?: SetWindowSizeFailCallback
        
        success?: SetWindowSizeSuccessCallback
    }
    interface SetZoomSuccessCallbackResult {
        
        zoom: number
        errMsg: string
    }
    interface ShareFileMessageOption {
        
        filePath: string
        
        complete?: ShareFileMessageCompleteCallback
        
        fail?: ShareFileMessageFailCallback
        
        fileName?: string
        
        success?: ShareFileMessageSuccessCallback
    }
    interface ShareToWeRunOption {
        
        recordList: WxaSportRecord[]
        
        complete?: ShareToWeRunCompleteCallback
        
        fail?: ShareToWeRunFailCallback
        
        success?: ShareToWeRunSuccessCallback
    }
    interface ShareVideoMessageOption {
        
        videoPath: string
        
        complete?: ShareVideoMessageCompleteCallback
        
        fail?: ShareVideoMessageFailCallback
        
        success?: ShareVideoMessageSuccessCallback
        
        thumbPath?: string
    }
    interface ShowActionSheetOption {
        
        itemList: string[]
        
        alertText?: string
        
        complete?: ShowActionSheetCompleteCallback
        
        fail?: ShowActionSheetFailCallback
        
        itemColor?: string
        
        success?: ShowActionSheetSuccessCallback
    }
    interface ShowActionSheetSuccessCallbackResult {
        
        tapIndex: number
        errMsg: string
    }
    interface ShowLoadingOption {
        
        title: string
        
        complete?: ShowLoadingCompleteCallback
        
        fail?: ShowLoadingFailCallback
        
        mask?: boolean
        
        success?: ShowLoadingSuccessCallback
    }
    interface ShowModalOption {
        
        cancelColor?: string
        
        cancelText?: string
        
        complete?: ShowModalCompleteCallback
        
        confirmColor?: string
        
        confirmText?: string
        
        content?: string
        
        editable?: boolean
        
        fail?: ShowModalFailCallback
        
        placeholderText?: string
        
        showCancel?: boolean
        
        success?: ShowModalSuccessCallback
        
        title?: string
    }
    interface ShowModalSuccessCallbackResult {
        
        cancel: boolean
        
        confirm: boolean
        
        content: string
        errMsg: string
    }
    interface ShowNavigationBarLoadingOption {
        
        complete?: ShowNavigationBarLoadingCompleteCallback
        
        fail?: ShowNavigationBarLoadingFailCallback
        
        success?: ShowNavigationBarLoadingSuccessCallback
    }
    interface ShowRedPackageOption {
        
        url: string
        
        complete?: ShowRedPackageCompleteCallback
        
        fail?: ShowRedPackageFailCallback
        
        success?: ShowRedPackageSuccessCallback
    }
    interface ShowShareImageMenuOption {
        
        path: string
        
        complete?: ShowShareImageMenuCompleteCallback
        
        entrancePath?: string
        
        fail?: ShowShareImageMenuFailCallback
        
        needShowEntrance?: string
        
        style?: string
        
        success?: ShowShareImageMenuSuccessCallback
    }
    interface ShowShareMenuOption {
        
        complete?: ShowShareMenuCompleteCallback
        
        fail?: ShowShareMenuFailCallback
        
        menus?: string[]
        
        success?: ShowShareMenuSuccessCallback
        
        withShareTicket?: boolean
    }
    interface ShowTabBarOption {
        
        animation?: boolean
        
        complete?: ShowTabBarCompleteCallback
        
        fail?: ShowTabBarFailCallback
        
        success?: ShowTabBarSuccessCallback
    }
    interface ShowTabBarRedDotOption {
        
        index: number
        
        complete?: ShowTabBarRedDotCompleteCallback
        
        fail?: ShowTabBarRedDotFailCallback
        
        success?: ShowTabBarRedDotSuccessCallback
    }
    interface ShowToastOption {
        
        title: string
        
        complete?: ShowToastCompleteCallback
        
        duration?: number
        
        fail?: ShowToastFailCallback
        
        icon?: 'success' | 'error' | 'loading' | 'none'
        
        image?: string
        
        mask?: boolean
        
        success?: ShowToastSuccessCallback
    }
    
    interface SignData {
        
        attach: string
        
        buyQuantity: number
        
        currencyType: 'CNY'
        
        goodsPrice: number
        
        offerId: string
        
        outTradeNo: string
        
        productId: string
        
        env?: number
        
        platform?: 'android'
    }
    interface Size {
        
        windowHeight: number
        
        windowWidth: number
    }
    
    interface SkylineInfo {
        
        isSupported: boolean
        
        version: string
        
        reason?:
            | 'client not supported)) 当前微信客户端不支持 [Skyline 渲染引擎]((skyline/introduction'
            | 'baselib not supported)) 当前基础库不支持 [Skyline 渲染引擎]((skyline/introduction'
            | 'a-b test not enabled)) 命中了 _We 分析_ 平台上的 AB 实验关闭的情况。详细可以查看 [Skyline 起步 > 配置 We 分析 AB 实验]((skyline/migration#%E9%85%8D%E7%BD%AE-We-%E5%88%86%E6%9E%90-AB-%E5%AE%9E%E9%AA%8C'
            | 'SwitchRender option set to webview)) 本地调试的快捷切换入口被设置为了强制使用 Webview. 详情可以查看 [Skyline 起步 > 快捷切换入口]((skyline/migration#快捷切换入口'
    }
    
    interface Snapshot {
        
        height: number
        
        width: number
        
        takeSnapshot(option: TakeSnapshotOption): void
    }
    
    interface SocketProfile {
        
        connectEnd: number
        
        connectStart: number
        
        cost: number
        
        domainLookupEnd: number
        
        domainLookupStart: number
        
        fetchStart: number
        
        handshakeCost: number
        
        rtt: number
    }
    interface SocketTaskCloseOption {
        
        code?: number
        
        complete?: SocketTaskCloseCompleteCallback
        
        fail?: SocketTaskCloseFailCallback
        
        reason?: string
        
        success?: SocketTaskCloseSuccessCallback
    }
    interface SocketTaskOnCloseListenerResult {
        
        code: number
        
        reason: string
    }
    interface SocketTaskOnMessageListenerResult {
        
        data: string | ArrayBuffer
    }
    interface SocketTaskSendOption {
        
        data: string | ArrayBuffer
        
        complete?: SendCompleteCallback
        
        fail?: SendFailCallback
        
        success?: SendSuccessCallback
    }
    
    interface SpringOption {
        
        damping?: number
        
        mass?: number
        
        overshootClamping?: boolean
        
        restDisplacementThreshold?: number
        
        restSpeedThreshold?: number
        
        stiffness?: number
        
        velocity?: number
    }
    interface StartAccelerometerOption {
        
        complete?: StartAccelerometerCompleteCallback
        
        fail?: StartAccelerometerFailCallback
        
        interval?: 'game' | 'ui' | 'normal'
        
        success?: StartAccelerometerSuccessCallback
    }
    interface StartAdvertisingObject {
        
        advertiseRequest: AdvertiseReqObj
        
        complete?: StartAdvertisingCompleteCallback
        
        fail?: StartAdvertisingFailCallback
        
        powerLevel?: 'low' | 'medium' | 'high'
        
        success?: StartAdvertisingSuccessCallback
    }
    interface StartBeaconDiscoveryOption {
        
        uuids: string[]
        
        complete?: StartBeaconDiscoveryCompleteCallback
        
        fail?: StartBeaconDiscoveryFailCallback
        
        ignoreBluetoothAvailable?: boolean
        
        success?: StartBeaconDiscoverySuccessCallback
    }
    interface StartBluetoothDevicesDiscoveryOption {
        
        allowDuplicatesKey?: boolean
        
        complete?: StartBluetoothDevicesDiscoveryCompleteCallback
        
        fail?: StartBluetoothDevicesDiscoveryFailCallback
        
        interval?: number
        
        powerLevel?: 'low' | 'medium' | 'high'
        
        services?: string[]
        
        success?: StartBluetoothDevicesDiscoverySuccessCallback
    }
    interface StartCastingOption {
        
        complete?: StartCastingCompleteCallback
        
        fail?: StartCastingFailCallback
        
        success?: StartCastingSuccessCallback
    }
    interface StartCompassOption {
        
        complete?: StartCompassCompleteCallback
        
        fail?: StartCompassFailCallback
        
        success?: StartCompassSuccessCallback
    }
    interface StartDeviceMotionListeningOption {
        
        complete?: StartDeviceMotionListeningCompleteCallback
        
        fail?: StartDeviceMotionListeningFailCallback
        
        interval?: 'game' | 'ui' | 'normal'
        
        success?: StartDeviceMotionListeningSuccessCallback
    }
    interface StartDiscoveryOption {
        
        complete?: StartDiscoveryCompleteCallback
        
        fail?: StartDiscoveryFailCallback
        
        success?: StartDiscoverySuccessCallback
    }
    interface StartGyroscopeOption {
        
        complete?: StartGyroscopeCompleteCallback
        
        fail?: StartGyroscopeFailCallback
        
        interval?: 'game' | 'ui' | 'normal'
        
        success?: StartGyroscopeSuccessCallback
    }
    interface StartHCEOption {
        
        aid_list: string[]
        
        complete?: StartHCECompleteCallback
        
        fail?: StartHCEFailCallback
        
        success?: StartHCESuccessCallback
    }
    interface StartLocalServiceDiscoveryFailCallbackResult {
        
        errMsg: string
    }
    interface StartLocalServiceDiscoveryOption {
        
        serviceType: string
        
        complete?: StartLocalServiceDiscoveryCompleteCallback
        
        fail?: StartLocalServiceDiscoveryFailCallback
        
        success?: StartLocalServiceDiscoverySuccessCallback
    }
    interface StartLocationUpdateBackgroundOption {
        
        complete?: StartLocationUpdateBackgroundCompleteCallback
        
        fail?: StartLocationUpdateBackgroundFailCallback
        
        success?: StartLocationUpdateBackgroundSuccessCallback
        
        type?: string
    }

    interface StartPreviewOption {
        
        complete?: StartPreviewCompleteCallback
        
        fail?: StartPreviewFailCallback
        
        success?: StartPreviewSuccessCallback
    }
    interface StartPullDownRefreshOption {
        
        complete?: StartPullDownRefreshCompleteCallback
        
        fail?: StartPullDownRefreshFailCallback
        
        success?: StartPullDownRefreshSuccessCallback
    }
    interface StartRecordSuccessCallbackResult {
        
        tempFilePath: string
        errMsg: string
    }
    interface StartRecordTimeoutCallbackResult {
        
        tempThumbPath: string
        
        tempVideoPath: string
    }
    interface StartSoterAuthenticationOption {
        
        challenge: string
        
        requestAuthModes: Array<'fingerPrint' | 'facial' | 'speech'>
        
        authContent?: string
        
        complete?: StartSoterAuthenticationCompleteCallback
        
        fail?: StartSoterAuthenticationFailCallback
        
        success?: StartSoterAuthenticationSuccessCallback
    }
    interface StartSoterAuthenticationSuccessCallbackResult {
        
        authMode: string
        
        errCode: number
        
        errMsg: string
        
        resultJSON: string
        
        resultJSONSignature: string
    }
    interface StartWifiOption {
        
        complete?: StartWifiCompleteCallback
        
        fail?: StartWifiFailCallback
        
        success?: StartWifiSuccessCallback
    }
    interface StatOption {
        
        path: string
        
        complete?: StatCompleteCallback
        
        fail?: StatFailCallback
        
        recursive?: boolean
        
        success?: StatSuccessCallback
    }
    interface StatSuccessCallbackResult {
        
        stats: Stats | FileStats[]
        errMsg: string
    }
    
    interface Stats {
        
        lastAccessedTime: number
        
        lastModifiedTime: number
        
        mode: number
        
        size: number
        
        isDirectory(): boolean
        
        isFile(): boolean
    }
    interface StepOption {
        
        delay?: number
        
        duration?: number
        
        timingFunction?:
            | 'linear'
            | 'ease'
            | 'ease-in'
            | 'ease-in-out'
            | 'ease-out'
            | 'step-start'
            | 'step-end'
        transformOrigin?: string
    }
    
    interface Sticker {
        
        len: number
        
        path: string
        
        title: string
        
        active?:
            | -1
            | 10
            | 11
            | 12
            | 13
            | 14
            | 15
            | 16
            | 17
            | 100
            | 101
            | 102
            | 103
            | 104
            | 105
            | 106
            | 107
            | 108
            | 109
            | 110
            | 111
            | 112
        
        id?: string
        
        md5?: string
        
        pos?: string[]
        
        segtype?: 0 | 1
    }
    interface StopAccelerometerOption {
        
        complete?: StopAccelerometerCompleteCallback
        
        fail?: StopAccelerometerFailCallback
        
        success?: StopAccelerometerSuccessCallback
    }
    interface StopAdvertisingOption {
        
        complete?: StopAdvertisingCompleteCallback
        
        fail?: StopAdvertisingFailCallback
        
        success?: StopAdvertisingSuccessCallback
    }
    interface StopBGMOption {
        
        complete?: StopBGMCompleteCallback
        
        fail?: StopBGMFailCallback
        
        success?: StopBGMSuccessCallback
    }
    interface StopBackgroundAudioOption {
        
        complete?: StopBackgroundAudioCompleteCallback
        
        fail?: StopBackgroundAudioFailCallback
        
        success?: StopBackgroundAudioSuccessCallback
    }
    interface StopBeaconDiscoveryOption {
        
        complete?: StopBeaconDiscoveryCompleteCallback
        
        fail?: StopBeaconDiscoveryFailCallback
        
        success?: StopBeaconDiscoverySuccessCallback
    }
    interface StopBluetoothDevicesDiscoveryOption {
        
        complete?: StopBluetoothDevicesDiscoveryCompleteCallback
        
        fail?: StopBluetoothDevicesDiscoveryFailCallback
        
        success?: StopBluetoothDevicesDiscoverySuccessCallback
    }
    interface StopCompassOption {
        
        complete?: StopCompassCompleteCallback
        
        fail?: StopCompassFailCallback
        
        success?: StopCompassSuccessCallback
    }
    interface StopDeviceMotionListeningOption {
        
        complete?: StopDeviceMotionListeningCompleteCallback
        
        fail?: StopDeviceMotionListeningFailCallback
        
        success?: StopDeviceMotionListeningSuccessCallback
    }
    interface StopDiscoveryOption {
        
        complete?: StopDiscoveryCompleteCallback
        
        fail?: StopDiscoveryFailCallback
        
        success?: StopDiscoverySuccessCallback
    }
    interface StopFaceDetectOption {
        
        complete?: StopFaceDetectCompleteCallback
        
        fail?: StopFaceDetectFailCallback
        
        success?: StopFaceDetectSuccessCallback
    }
    interface StopGyroscopeOption {
        
        complete?: StopGyroscopeCompleteCallback
        
        fail?: StopGyroscopeFailCallback
        
        success?: StopGyroscopeSuccessCallback
    }
    interface StopHCEOption {
        
        complete?: StopHCECompleteCallback
        
        fail?: StopHCEFailCallback
        
        success?: StopHCESuccessCallback
    }
    interface StopLocalServiceDiscoveryFailCallbackResult {
        
        errMsg: string
    }
    interface StopLocalServiceDiscoveryOption {
        
        complete?: StopLocalServiceDiscoveryCompleteCallback
        
        fail?: StopLocalServiceDiscoveryFailCallback
        
        success?: StopLocalServiceDiscoverySuccessCallback
    }
    interface StopLocationUpdateOption {
        
        complete?: StopLocationUpdateCompleteCallback
        
        fail?: StopLocationUpdateFailCallback
        
        success?: StopLocationUpdateSuccessCallback
    }
    interface StopOption {
        
        complete?: StopCompleteCallback
        
        fail?: StopFailCallback
        
        success?: StopSuccessCallback
    }
    interface StopPreviewOption {
        
        complete?: StopPreviewCompleteCallback
        
        fail?: StopPreviewFailCallback
        
        success?: StopPreviewSuccessCallback
    }
    interface StopPullDownRefreshOption {
        
        complete?: StopPullDownRefreshCompleteCallback
        
        fail?: StopPullDownRefreshFailCallback
        
        success?: StopPullDownRefreshSuccessCallback
    }
    interface StopRecordSuccessCallbackResult {
        
        tempThumbPath: string
        
        tempVideoPath: string
        errMsg: string
    }
    interface StopVoiceOption {
        
        complete?: StopVoiceCompleteCallback
        
        fail?: StopVoiceFailCallback
        
        success?: StopVoiceSuccessCallback
    }
    interface StopWifiOption {
        
        complete?: StopWifiCompleteCallback
        
        fail?: StopWifiFailCallback
        
        success?: StopWifiSuccessCallback
    }
    interface SubscribeVoIPVideoMembersOption {
        
        openIdList: string[]
        
        complete?: SubscribeVoIPVideoMembersCompleteCallback
        
        fail?: SubscribeVoIPVideoMembersFailCallback
        
        success?: SubscribeVoIPVideoMembersSuccessCallback
    }
    
    interface SubscriptionsSetting {
        
        mainSwitch: boolean
        
        itemSettings?: IAnyObject
    }
    interface SwitchCameraOption {
        
        complete?: SwitchCameraCompleteCallback
        
        fail?: SwitchCameraFailCallback
        
        success?: SwitchCameraSuccessCallback
    }
    interface SwitchCastingOption {
        
        complete?: SwitchCastingCompleteCallback
        
        fail?: SwitchCastingFailCallback
        
        success?: SwitchCastingSuccessCallback
    }
    interface SwitchTabOption {
        
        url: string
        
        complete?: SwitchTabCompleteCallback
        
        fail?: SwitchTabFailCallback
        
        success?: SwitchTabSuccessCallback
    }
    interface SystemInfo {
        
        SDKVersion: string
        
        albumAuthorized: boolean
        
        benchmarkLevel: number
        
        bluetoothEnabled: boolean
        
        brand: string
        
        cameraAuthorized: boolean
        
        deviceOrientation: 'portrait' | 'landscape'
        
        enableDebug: boolean
        
        fontSizeSetting: number
        
        host: SystemInfoHost
        
        language: string
        
        locationAuthorized: boolean
        
        locationEnabled: boolean
        
        locationReducedAccuracy: boolean
        
        microphoneAuthorized: boolean
        
        model: string
        
        notificationAlertAuthorized: boolean
        
        notificationAuthorized: boolean
        
        notificationBadgeAuthorized: boolean
        
        notificationSoundAuthorized: boolean
        
        phoneCalendarAuthorized: boolean
        
        pixelRatio: number
        
        platform: 'ios' | 'android' | 'windows' | 'mac' | 'devtools'
        
        safeArea: SafeArea
        
        screenHeight: number
        
        screenWidth: number
        
        statusBarHeight: number
        
        system: string
        
        version: string
        
        wifiEnabled: boolean
        
        windowHeight: number
        
        windowWidth: number
        
        theme?: 'dark' | 'light'
    }
    
    interface SystemInfoHost {
        
        appId: string
    }
    interface SystemSetting {
        
        bluetoothEnabled: boolean
        
        deviceOrientation: 'portrait' | 'landscape'
        
        locationEnabled: boolean
        
        wifiEnabled: boolean
    }
    interface TCPSocketConnectOption {
        
        address: string
        
        port: number
        
        timeout?: number
    }
    interface TCPSocketOnMessageListenerResult {
        
        localInfo: LocalInfo
        
        message: ArrayBuffer
        
        remoteInfo: RemoteInfo
    }
    interface TakePhotoOption {
        
        complete?: TakePhotoCompleteCallback
        
        fail?: TakePhotoFailCallback
        
        quality?: 'high' | 'normal' | 'low' | 'original'
        
        selfieMirror?: boolean
        
        success?: TakePhotoSuccessCallback
    }
    interface TakePhotoSuccessCallbackResult {
        
        tempImagePath: string
        errMsg: string
    }
    interface TakeSnapshotOption {
        
        format: string
        
        type: string
        
        complete?: TakeSnapshotCompleteCallback
        
        fail?: TakeSnapshotFailCallback
        
        success?: TakeSnapshotSuccessCallback
    }
    interface TakeSnapshotSuccessCallbackResult {
        
        data: ArrayBuffer
        
        tempFilePath: string
        errMsg: string
    }
    
    interface TechType {
        
        isoDep: string
        
        mifareClassic: string
        
        mifareUltralight: string
        
        ndef: string
        
        nfcA: string
        
        nfcB: string
        
        nfcF: string
        
        nfcV: string
    }
    
    interface Tensor {
        
        data: ArrayBuffer
        
        shape: number[]
        
        type: string
    }
    
    interface Tensors {
        
        key: Tensor
    }
    interface TextMetrics {
        
        width: number
    }
    
    interface TimingOption {
        
        duration?: number
        
        easing?: (...args: any[]) => any
    }
    interface ToScreenLocationOption {
        
        latitude: number
        
        longitude: number
        
        complete?: ToScreenLocationCompleteCallback
        
        fail?: ToScreenLocationFailCallback
        
        success?: ToScreenLocationSuccessCallback
    }
    interface ToScreenLocationSuccessCallbackResult {
        
        x: number
        
        y: number
        errMsg: string
    }
    interface ToggleTorchOption {
        
        complete?: ToggleTorchCompleteCallback
        
        fail?: ToggleTorchFailCallback
        
        success?: ToggleTorchSuccessCallback
    }
    
    interface Track {
        
        plane: PlaneTrack
        
        OCR?: OCRTrack
        
        OSD?: boolean
        
        body?: BodyTrack
        
        depth?: DepthTrack
        
        face?: FaceTrack
        
        hand?: HandTrack
        
        marker?: boolean
        
        threeDof?: boolean
    }
    interface TransceiveOption {
        
        data: ArrayBuffer
        
        complete?: TransceiveCompleteCallback
        
        fail?: TransceiveFailCallback
        
        success?: TransceiveSuccessCallback
    }
    interface TransceiveSuccessCallbackResult {
        data: ArrayBuffer
        errMsg: string
    }
    interface TranslateMarkerOption {
        
        autoRotate: boolean
        
        destination: DestinationOption
        
        markerId: number
        
        rotate: number
        
        animationEnd?: (...args: any[]) => any
        
        complete?: TranslateMarkerCompleteCallback
        
        duration?: number
        
        fail?: TranslateMarkerFailCallback
        
        moveWithRotate?: boolean
        
        success?: TranslateMarkerSuccessCallback
    }
    interface TriggerRefreshOption {
        
        duration?: number
        
        easingFunction?: string
    }
    interface TruncateOption {
        
        filePath: string
        
        complete?: TruncateCompleteCallback
        
        fail?: TruncateFailCallback
        
        length?: number
        
        success?: TruncateSuccessCallback
    }
    interface TruncateSyncOption {
        
        filePath: string
        
        length?: number
    }
    interface UDPSocketConnectOption {
        
        address: string
        
        port: number
    }
    interface UDPSocketOnMessageListenerResult {
        
        localInfo: LocalInfo
        
        message: ArrayBuffer
        
        remoteInfo: RemoteInfo
    }
    interface UDPSocketSendOption {
        
        address: string
        
        message: string | ArrayBuffer
        
        port: number
        
        length?: number
        
        offset?: number
        
        setBroadcast?: boolean
    }
    interface UndoOption {
        
        complete?: UndoCompleteCallback
        
        fail?: UndoFailCallback
        
        success?: UndoSuccessCallback
    }
    interface UnlinkOption {
        
        filePath: string
        
        complete?: UnlinkCompleteCallback
        
        fail?: UnlinkFailCallback
        
        success?: UnlinkSuccessCallback
    }
    interface UnzipOption {
        
        targetPath: string
        
        zipFilePath: string
        
        complete?: UnzipCompleteCallback
        
        fail?: UnzipFailCallback
        
        success?: UnzipSuccessCallback
    }
    
    interface UpdatableMessageFrontEndParameter {
        
        name: string
        
        value: string
    }
    
    interface UpdatableMessageFrontEndTemplateInfo {
        
        parameterList: UpdatableMessageFrontEndParameter[]
    }
    interface UpdateGroundOverlayOption {
        
        bounds: MapBounds
        
        id: string
        
        src: string
        
        complete?: UpdateGroundOverlayCompleteCallback
        
        fail?: UpdateGroundOverlayFailCallback
        
        opacity?: number
        
        success?: UpdateGroundOverlaySuccessCallback
        
        visible?: boolean
        
        zIndex?: number
    }
    interface UpdateShareMenuOption {
        
        activityId?: string
        
        complete?: UpdateShareMenuCompleteCallback
        
        fail?: UpdateShareMenuFailCallback
        
        isPrivateMessage?: boolean
        
        isUpdatableMessage?: boolean
        
        success?: UpdateShareMenuSuccessCallback
        
        templateInfo?: UpdatableMessageFrontEndTemplateInfo
        
        toDoActivityId?: string
        
        withShareTicket?: boolean
    }
    interface UpdateVoIPChatMuteConfigOption {
        
        muteConfig: MuteConfig
        
        complete?: UpdateVoIPChatMuteConfigCompleteCallback
        
        fail?: UpdateVoIPChatMuteConfigFailCallback
        
        success?: UpdateVoIPChatMuteConfigSuccessCallback
    }
    interface UpdateWeChatAppOption {
        
        complete?: UpdateWeChatAppCompleteCallback
        
        fail?: UpdateWeChatAppFailCallback
        
        success?: UpdateWeChatAppSuccessCallback
    }
    interface UploadFileOption {
        
        filePath: string
        
        name: string
        
        url: string
        
        complete?: UploadFileCompleteCallback
        
        fail?: UploadFileFailCallback
        
        formData?: IAnyObject
        
        header?: IAnyObject
        
        success?: UploadFileSuccessCallback
        
        timeout?: number
    }
    interface UploadFileSuccessCallbackResult {
        
        data: string
        
        statusCode: number
        errMsg: string
    }
    interface UploadTaskOnProgressUpdateListenerResult {
        
        progress: number
        
        totalBytesExpectedToSend: number
        
        totalBytesSent: number
    }
    
    interface UserInfo {
        
        avatarUrl: string
        
        city: string
        
        country: string
        
        gender: 0 | 1 | 2
        
        language: 'en' | 'zh_CN' | 'zh_TW'
        
        nickName: string
        
        province: string
    }
    
    interface VKBodyAnchor {
        
        confidence: number[]
        
        detectId: number
        
        id: number
        
        origin: VKOrigin
        
        points: VKOrigin[]
        
        score: number
        
        size: VKSize
        
        type: 5
    }
    
    interface VKCamera {
        
        intrinsics: Float32Array
        
        viewMatrix: Float32Array
        
        getProjectionMatrix(
            
            near: number,
            
            far: number
        ): Float32Array
    }
    interface VKConfig {
        
        track: Track
        
        gl?: WebGLRenderingContext
        
        version?: 'v1' | 'v2'
    }
    
    interface VKDepthAnchor {
        
        depthArray: number[]
        
        id: number
        
        size: VKSize
        
        type: 8
    }
    
    interface VKFaceAnchor {
        
        angle: number[]
        
        confidence: number[]
        
        detectId: number
        
        id: number
        
        origin: VKOrigin
        
        points: VKPoint[]
        
        size: VKSize
        
        type: 3
    }
    
    interface VKFrame {
        
        camera: VKCamera
        
        timestamp: number
        
        getCameraBuffer(
            
            width: number,
            
            height: number
        ): ArrayBuffer
        
        getDisplayTransform(): Float32Array
        
        getCameraTexture(
            
            gl: WebGLRenderingContext
        ): YUVTextureRes
    }
    
    interface VKHandAnchor {
        
        confidence: number[]
        
        detectId: number
        
        gesture:
            | 0
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6
            | 7
            | 8
            | 9
            | 10
            | 11
            | 12
            | 13
            | 14
            | 15
            | 16
            | 17
            | 18
            | -1
        
        id: number
        
        origin: VKOrigin
        
        points: VKOrigin[]
        
        score: number
        
        size: VKSize
        
        type: 7
    }
    interface VKMarker {
        
        markerId: number
        
        path: string
    }
    
    interface VKMarkerAnchor {
        
        id: number
        
        markerId: number
        
        path: string
        
        transform: Float32Array
        
        type: 1
    }
    
    interface VKOCRAnchor {
        
        id: number
        
        text: string
        
        type: 6
    }
    
    interface VKOSDAnchor {
        
        id: number
        
        markerId: number
        
        origin: VKOrigin
        
        path: string
        
        size: VKSize
        
        type: 2
    }
    interface VKOrigin {
        
        x: number
        
        y: number
    }
    
    interface VKPlaneAnchor {
        
        alignment: number
        
        id: number
        
        size: VKSize
        
        transform: Float32Array
        
        type: 0
    }
    
    interface VKPoint {
        
        x: number
        
        y: number
    }
    
    interface VKSession {
        
        cameraSize: VKSize
        
        config: VKConfig
        
        state: 0 | 1 | 2 | 3
        
        getAllMarker(): VKMarker[]
        
        getAllOSDMarker(): VKMarker[]
        
        hitTest(
            
            x: number,
            
            y: number,
            
            reset: IAnyObject
        ): HitTestRes[]
        
        cancelAnimationFrame(requestID: number): void
        
        destroy(): void
        
        detectBody(option: DetectBodyOption): void
        
        detectDepth(option: DetectDepthOption): void
        
        detectFace(option: DetectFaceOption): void
        
        detectHand(option: DetectHandOption): void
        
        off(
            
            eventName: string,
            
            fn: (...args: any[]) => any
        ): void
        
        on(
            
            eventName:
                | 'resize'
                | 'addAnchors'
                | 'updateAnchors'
                | 'removeAnchors',
            
            fn: (...args: any[]) => any
        ): void
        
        removeMarker(
            
            markerId: number
        ): void
        
        removeOSDMarker(
            
            markerId: number
        ): void
        
        runOCR(option: RunOCROption): void
        
        start(
            
            callback: VKSessionStartCallback
        ): void
        
        stop(): void
        
        update3DMode(
            
            open3d: boolean
        ): void
        
        updateOSDThreshold(
            
            threshold: number
        ): void
        
        getVKFrame(
            
            width: number,
            
            height: number
        ): VKFrame
        
        addMarker(
            
            path: string
        ): number
        
        addOSDMarker(
            
            path: string
        ): number
        
        requestAnimationFrame(
            
            callback: (...args: any[]) => any
        ): number
    }
    interface VKSize {
        
        height: number
        
        width: number
    }
    interface VibrateLongOption {
        
        complete?: VibrateLongCompleteCallback
        
        fail?: VibrateLongFailCallback
        
        success?: VibrateLongSuccessCallback
    }
    interface VibrateShortFailCallbackResult {
        
        errMsg: string
    }
    interface VibrateShortOption {
        
        type: string
        
        complete?: VibrateShortCompleteCallback
        
        fail?: VibrateShortFailCallback
        
        success?: VibrateShortSuccessCallback
    }
    interface VideoContextRequestFullScreenOption {
        
        direction?: 0 | 90 | -90
    }
    interface VideoDecoderStartOption {
        
        source: string
        
        abortAudio?: boolean
        
        abortVideo?: boolean
        
        mode?: number
    }
    interface VoIP1v1ChatUser {
        
        nickname: string
        
        openid: string
        
        headImage?: string
    }
    
    interface WebAudioContext {
        
        currentTime: number
        
        destination: WebAudioContextNode
        
        listener: AudioListener
        
        onstatechange: (...args: any[]) => any
        
        sampleRate: number
        
        state: string
        
        createAnalyser(): AnalyserNode
        
        createBiquadFilter(): BiquadFilterNode
        
        createChannelMerger(
            
            numberOfInputs: number
        ): ChannelMergerNode
        
        createChannelSplitter(
            
            numberOfOutputs: number
        ): ChannelSplitterNode
        
        createConstantSource(): ConstantSourceNode
        
        createDelay(
            
            maxDelayTime: number
        ): DelayNode
        
        createDynamicsCompressor(): DynamicsCompressorNode
        
        createGain(): GainNode
        
        createIIRFilter(
            
            feedforward: number[],
            
            feedback: number[]
        ): IIRFilterNode
        
        createOscillator(): OscillatorNode
        
        createPanner(): PannerNode
        
        createPeriodicWave(
            
            real: Float32Array,
            
            imag: Float32Array,
            
            constraints: Constraints
        ): PeriodicWaveNode
        
        close(): Promise<any>
        
        resume(): Promise<any>
        
        suspend(): Promise<any>
        
        createScriptProcessor(
            
            bufferSize: number,
            
            numberOfInputChannels: number,
            
            numberOfOutputChannels: number
        ): ScriptProcessorNode
        
        createWaveShaper(): WaveShaperNode
        
        createBuffer(
            
            numOfChannels: number,
            
            length: number,
            
            sampleRate: number
        ): AudioBuffer
        
        decodeAudioData(): AudioBuffer
        
        createBufferSource(): BufferSourceNode
    }
    
    interface WebAudioContextNode {
        
        forwardX: number
        
        forwardY: number
        
        forwardZ: number
        
        positionX: number
        
        positionY: number
        
        positionZ: number
        
        setOrientation: (...args: any[]) => any
        
        setPosition: (...args: any[]) => any
        
        upX: number
        
        upY: number
        
        upZ: number
    }
    
    interface WifiData {
        
        BSSID?: string
        
        SSID?: string
        
        password?: string
    }
    
    interface WifiInfo {
        
        BSSID: string
        
        SSID: string
        
        frequency: number
        
        secure: boolean
        
        signalStrength: number
    }
    interface WindowInfo {
        
        pixelRatio: number
        
        safeArea: SafeArea
        
        screenHeight: number
        
        screenTop: number
        
        screenWidth: number
        
        statusBarHeight: number
        
        windowHeight: number
        
        windowWidth: number
    }
    
    interface Worker {
        
        env: WorkerEnv
        
        getCameraFrameData(): ArrayBuffer
        
        onMessage(
            
            listener: WorkerOnMessageCallback
        ): void
        
        onProcessKilled(
            
            listener: OnProcessKilledCallback
        ): void
        
        postMessage(
            
            message: IAnyObject
        ): void
        
        terminate(): void
        
        testOnProcessKilled(): void
    }
    
    interface WorkerEnv {
        
        USER_DATA_PATH: string
    }
    interface WorkerOnMessageListenerResult {
        
        message: IAnyObject
    }
    
    interface WorkletEasing {}
    interface WriteBLECharacteristicValueOption {
        
        characteristicId: string
        
        deviceId: string
        
        serviceId: string
        
        value: ArrayBuffer
        
        complete?: WriteBLECharacteristicValueCompleteCallback
        
        fail?: WriteBLECharacteristicValueFailCallback
        
        success?: WriteBLECharacteristicValueSuccessCallback
        
        writeType?: 'write' | 'writeNoResponse'
    }
    interface WriteCharacteristicValueObject {
        
        characteristicId: string
        
        needNotify: boolean
        
        serviceId: string
        
        value: ArrayBuffer
        
        callbackId?: number
        
        complete?: WriteCharacteristicValueCompleteCallback
        
        fail?: WriteCharacteristicValueFailCallback
        
        success?: WriteCharacteristicValueSuccessCallback
    }
    interface WriteFileOption {
        
        data: string | ArrayBuffer
        
        filePath: string
        
        complete?: WriteFileCompleteCallback
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        fail?: WriteFileFailCallback
        
        success?: WriteFileSuccessCallback
    }
    interface WriteNdefMessageOption {
        
        complete?: WriteNdefMessageCompleteCallback
        
        fail?: WriteNdefMessageFailCallback
        
        records?: any[]
        
        success?: WriteNdefMessageSuccessCallback
        
        texts?: any[]
        
        uris?: any[]
    }
    interface WriteOption {
        
        data: string | ArrayBuffer
        
        fd: string
        
        complete?: WriteCompleteCallback
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        fail?: WriteFailCallback
        
        length?: number
        
        offset?: number
        
        position?: number
        
        success?: WriteSuccessCallback
    }
    
    interface WriteResult {
        
        bytesWritten: number
    }
    interface WriteSuccessCallbackResult {
        
        bytesWritten: number
        errMsg: string
    }
    interface WriteSyncOption {
        
        data: string | ArrayBuffer
        
        fd: string
        
        encoding?:
            | 'ascii'
            | 'base64'
            | 'binary'
            | 'hex'
            | 'ucs2'
            | 'ucs-2'
            | 'utf16le'
            | 'utf-16le'
            | 'utf-8'
            | 'utf8'
            | 'latin1'
        
        length?: number
        
        offset?: number
        
        position?: number
    }
    interface WxStartRecordOption {
        
        complete?: StartRecordCompleteCallback
        
        fail?: StartRecordFailCallback
        
        success?: WxStartRecordSuccessCallback
    }
    interface WxStopRecordOption {
        
        complete?: StopRecordCompleteCallback
        
        fail?: StopRecordFailCallback
        
        success?: WxStopRecordSuccessCallback
    }
    
    interface WxaSportRecord {
        
        calorie: number
        
        distance: number
        
        time: number
        
        typeId: number
    }
    
    interface YUVTextureRes {
        
        uvTexture: WebGLTexture
        
        yTexture: WebGLTexture
    }
    
    interface ZipFileItem {
        
        data: string | ArrayBuffer
        
        errMsg: string
    }
    interface Animation {
        
        export(): AnimationExportResult
        
        backgroundColor(
            
            value: string
        ): Animation
        
        bottom(
            
            value: number | string
        ): Animation
        
        height(
            
            value: number | string
        ): Animation
        
        left(
            
            value: number | string
        ): Animation
        
        matrix(): Animation
        
        matrix3d(): Animation
        
        opacity(
            
            value: number
        ): Animation
        
        right(
            
            value: number | string
        ): Animation
        
        rotate(
            
            angle: number
        ): Animation
        
        rotate3d(
            
            x: number,
            
            y: number,
            
            z: number,
            
            angle: number
        ): Animation
        
        rotateX(
            
            angle: number
        ): Animation
        
        rotateY(
            
            angle: number
        ): Animation
        
        rotateZ(
            
            angle: number
        ): Animation
        
        scale(
            
            sx: number,
            
            sy?: number
        ): Animation
        
        scale3d(
            
            sx: number,
            
            sy: number,
            
            sz: number
        ): Animation
        
        scaleX(
            
            scale: number
        ): Animation
        
        scaleY(
            
            scale: number
        ): Animation
        
        scaleZ(
            
            scale: number
        ): Animation
        
        skew(
            
            ax: number,
            
            ay: number
        ): Animation
        
        skewX(
            
            angle: number
        ): Animation
        
        skewY(
            
            angle: number
        ): Animation
        
        step(option?: StepOption): Animation
        
        top(
            
            value: number | string
        ): Animation
        
        translate(
            
            tx?: number,
            
            ty?: number
        ): Animation
        
        translate3d(
            
            tx?: number,
            
            ty?: number,
            
            tz?: number
        ): Animation
        
        translateX(
            
            translation: number
        ): Animation
        
        translateY(
            
            translation: number
        ): Animation
        
        translateZ(
            
            translation: number
        ): Animation
        
        width(
            
            value: number | string
        ): Animation
    }
    interface AudioContext {
        
        pause(): void
        
        play(): void
        
        seek(
            
            position: number
        ): void
        
        setSrc(
            
            src: string
        ): void
    }
    interface BLEPeripheralServer {
        
        addService(option: AddServiceOption): void
        
        close(option?: BLEPeripheralServerCloseOption): void
        
        offCharacteristicReadRequest(
            
            listener?: OffCharacteristicReadRequestCallback
        ): void
        
        offCharacteristicSubscribed(
            
            listener?: OffCharacteristicSubscribedCallback
        ): void
        
        offCharacteristicUnsubscribed(
            
            listener?: OffCharacteristicUnsubscribedCallback
        ): void
        
        offCharacteristicWriteRequest(
            
            listener?: OffCharacteristicWriteRequestCallback
        ): void
        
        onCharacteristicReadRequest(
            
            listener: OnCharacteristicReadRequestCallback
        ): void
        
        onCharacteristicSubscribed(
            
            listener: OnCharacteristicSubscribedCallback
        ): void
        
        onCharacteristicUnsubscribed(
            
            listener: OnCharacteristicUnsubscribedCallback
        ): void
        
        onCharacteristicWriteRequest(
            
            listener: OnCharacteristicWriteRequestCallback
        ): void
        
        removeService(option: RemoveServiceOption): void
        
        startAdvertising(Object: StartAdvertisingObject): void
        
        stopAdvertising(option?: StopAdvertisingOption): void
        
        writeCharacteristicValue(Object: WriteCharacteristicValueObject): void
    }
    interface BackgroundAudioError {
         errMsg: string
         errCode: number
    }
    interface BeaconError {
         errMsg: string
         errCode: number
    }
    interface BluetoothError {
         errMsg: string
         errCode: number
    }
    interface CameraContext {
        
        setZoom(option: CameraContextSetZoomOption): void
        
        startRecord(option: CameraContextStartRecordOption): void
        
        stopRecord(option: CameraContextStopRecordOption): void
        
        takePhoto(option: TakePhotoOption): void
        
        onCameraFrame(
            
            callback: OnCameraFrameCallback
        ): CameraFrameListener
    }
    interface CameraFrameListener {
        
        start(option?: CameraFrameListenerStartOption): void
        
        stop(option?: StopOption): void
    }
    interface CanvasGradient {
        
        addColorStop(
            
            stop: number,
            
            color: string
        ): void
    }
    interface CommonPaymentError {
         errMsg: string
         errCode: number
    }
    interface Console {
        
        debug(
            
            ...args: any[]
        ): void
        
        error(
            
            ...args: any[]
        ): void
        
        group(
            
            label?: string
        ): void
        
        groupEnd(): void
        
        info(
            
            ...args: any[]
        ): void
        
        log(
            
            ...args: any[]
        ): void
        
        warn(
            
            ...args: any[]
        ): void
    }
    interface DownloadTask {
        
        abort(): void
        
        offHeadersReceived(
            
            listener?: DownloadTaskOffHeadersReceivedCallback
        ): void
        
        offProgressUpdate(
            
            listener?: DownloadTaskOffProgressUpdateCallback
        ): void
        
        onHeadersReceived(
            
            listener: DownloadTaskOnHeadersReceivedCallback
        ): void
        
        onProgressUpdate(
            
            listener: DownloadTaskOnProgressUpdateCallback
        ): void
    }
    interface DraggableSheetContext {
        
        scrollTo(option: DraggableSheetContextScrollToOption): void
    }
    interface EditorContext {
        
        blur(option?: BlurOption): void
        
        clear(option?: ClearOption): void
        
        format(
            
            name: string,
            
            value?: string
        ): void
        
        getContents(option?: GetContentsOption): void
        
        getSelectionText(option?: GetSelectionTextOption): void
        
        insertDivider(option?: InsertDividerOption): void
        
        insertImage(option: InsertImageOption): void
        
        insertText(option: InsertTextOption): void
        
        redo(option?: RedoOption): void
        
        removeFormat(option?: RemoveFormatOption): void
        
        scrollIntoView(): void
        
        setContents(option: SetContentsOption): void
        
        undo(option?: UndoOption): void
    }
    interface EntryList {
        
        getEntries(): PerformanceEntry[]
        
        getEntriesByName(
            name: string,
            entryType?: string
        ): PerformanceEntry[]
        
        getEntriesByType(entryType: string): PerformanceEntry[]
    }
    interface EventChannel {
        
        emit(
            
            eventName: string,
            
            ...args: any
        ): void
        
        off(
            
            eventName: string,
            
            fn: EventCallback
        ): void
        
        on(
            
            eventName: string,
            
            fn: EventCallback
        ): void
        
        once(
            
            eventName: string,
            
            fn: EventCallback
        ): void
    }
    interface FileError {
         errMsg: string
         errCode: number
    }
    interface FileSystemManager {
        
        readdirSync(
            
            dirPath: string
        ): string[]
        
        readCompressedFileSync(
            option: ReadCompressedFileSyncOption
        ): ArrayBuffer
        
        access(option: AccessOption): void
        
        accessSync(
            
            path: string
        ): void
        
        appendFile(option: AppendFileOption): void
        
        appendFileSync(
            
            filePath: string,
            
            data: string | ArrayBuffer,
            
            encoding?:
                | 'ascii'
                | 'base64'
                | 'binary'
                | 'hex'
                | 'ucs2'
                | 'ucs-2'
                | 'utf16le'
                | 'utf-16le'
                | 'utf-8'
                | 'utf8'
                | 'latin1'
        ): void
        
        close(option: FileSystemManagerCloseOption): void
        
        copyFile(option: CopyFileOption): void
        
        copyFileSync(
            
            srcPath: string,
            
            destPath: string
        ): void
        
        fstat(option: FstatOption): void
        
        ftruncate(option: FtruncateOption): void
        
        getFileInfo(option: GetFileInfoOption): void
        
        getSavedFileList(option?: GetSavedFileListOption): void
        
        mkdir(option: MkdirOption): void
        
        mkdirSync(
            
            dirPath: string,
            
            recursive?: boolean
        ): void
        
        open(option: OpenOption): void
        
        read(option: ReadOption): void
        
        readCompressedFile(option: ReadCompressedFileOption): void
        
        readFile(option: ReadFileOption): void
        
        readZipEntry(option: ReadZipEntryOption): void
        
        readdir(option: ReaddirOption): void
        
        removeSavedFile(option: RemoveSavedFileOption): void
        
        rename(option: RenameOption): void
        
        renameSync(
            
            oldPath: string,
            
            newPath: string
        ): void
        
        rmdir(option: RmdirOption): void
        
        rmdirSync(
            
            dirPath: string,
            
            recursive?: boolean
        ): void
        
        saveFile(option: SaveFileOption): void
        
        stat(option: StatOption): void
        
        truncate(option: TruncateOption): void
        
        unlink(option: UnlinkOption): void
        
        unlinkSync(
            
            filePath: string
        ): void
        
        unzip(option: UnzipOption): void
        
        write(option: WriteOption): void
        
        writeFile(option: WriteFileOption): void
        
        writeFileSync(
            
            filePath: string,
            
            data: string | ArrayBuffer,
            
            encoding?:
                | 'ascii'
                | 'base64'
                | 'binary'
                | 'hex'
                | 'ucs2'
                | 'ucs-2'
                | 'utf16le'
                | 'utf-16le'
                | 'utf-8'
                | 'utf8'
                | 'latin1'
        ): void
        
        readSync(option: ReadSyncOption): ReadResult
        
        fstatSync(option: FstatSyncOption): Stats
        
        statSync(
            
            path: string,
            
            recursive?: boolean
        ): Stats | FileStats[]
        
        writeSync(option: WriteSyncOption): WriteResult
        
        openSync(option: OpenSyncOption): string
        
        saveFileSync(
            
            tempFilePath: string,
            
            filePath?: string
        ): string
        
        readFileSync(
            
            filePath: string,
            
            encoding?:
                | 'ascii'
                | 'base64'
                | 'binary'
                | 'hex'
                | 'ucs2'
                | 'ucs-2'
                | 'utf16le'
                | 'utf-16le'
                | 'utf-8'
                | 'utf8'
                | 'latin1',
            
            position?: number,
            
            length?: number
        ): string | ArrayBuffer
        
        closeSync(option: CloseSyncOption): undefined
        
        ftruncateSync(option: FtruncateSyncOption): undefined
        
        truncateSync(option: TruncateSyncOption): undefined
    }
    interface InferenceSession {
        
        destroy(): void
        
        offError(
            
            callback: (...args: any[]) => any
        ): void
        
        offLoad(
            
            callback: (...args: any[]) => any
        ): void
        
        onError(
            
            callback: (...args: any[]) => any
        ): void
        
        onLoad(
            
            callback: (...args: any[]) => any
        ): void
        
        run(
            
            tensors: Tensors
        ): Promise<Tensors>
    }
    interface IntersectionObserver {
        
        disconnect(): void
        
        observe(
            
            targetSelector: string,
            
            callback: IntersectionObserverObserveCallback
        ): void
        
        relativeTo(
            
            selector: string,
            
            margins?: Margins
        ): IntersectionObserver
        
        relativeToViewport(
            
            margins?: Margins
        ): IntersectionObserver
    }
    interface InterstitialAd {
        
        destroy(): void
        
        offClose(
            
            listener?: UDPSocketOffCloseCallback
        ): void
        
        offError(
            
            listener?: InterstitialAdOffErrorCallback
        ): void
        
        offLoad(
            
            listener?: OffLoadCallback
        ): void
        
        onClose(
            
            listener: UDPSocketOnCloseCallback
        ): void
        
        onError(
            
            listener: InterstitialAdOnErrorCallback
        ): void
        
        onLoad(
            
            listener: OnLoadCallback
        ): void
        
        load(): Promise<any>
        
        show(): Promise<any>
    }
    interface IsoDep {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getHistoricalBytes(option?: GetHistoricalBytesOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface Join1v1ChatError {
         errMsg: string
         errCode: number
    }
    interface JoinVoIPChatError {
         errMsg: string
         errCode: number
    }
    interface LivePlayerContext {
        
        exitCasting(option?: ExitCastingOption): void
        
        exitFullScreen(option?: ExitFullScreenOption): void
        
        exitPictureInPicture(option?: ExitPictureInPictureOption): void
        
        mute(option?: MuteOption): void
        
        pause(option?: PauseOption): void
        
        play(option?: PlayOption): void
        
        reconnectCasting(option?: ReconnectCastingOption): void
        
        requestFullScreen(
            option: LivePlayerContextRequestFullScreenOption
        ): void
        
        requestPictureInPicture(option?: RequestPictureInPictureOption): void
        
        resume(option?: ResumeOption): void
        
        snapshot(option: LivePlayerContextSnapshotOption): void
        
        startCasting(option?: StartCastingOption): void
        
        stop(option?: StopOption): void
        
        switchCasting(option?: SwitchCastingOption): void
    }
    interface LivePusherContext {
        
        applyBlusherStickMakeup(option: ApplyBlusherStickMakeupOption): void
        
        applyEyeBrowMakeup(option: ApplyEyeBrowMakeupOption): void
        
        applyEyeShadowMakeup(option: ApplyEyeShadowMakeupOption): void
        
        applyFaceContourMakeup(option: ApplyFaceContourMakeupOption): void
        
        applyFilter(option: ApplyFilterOption): void
        
        applyLipStickMakeup(option: ApplyLipStickMakeupOption): void
        
        applySticker(option: ApplyStickerOption): void
        
        clearFilters(option?: ClearFiltersOption): void
        
        clearMakeups(option?: ClearMakeupsOption): void
        
        clearStickers(option?: ClearStickersOption): void
        
        createOffscreenCanvas(
            
            options: IAnyObject
        ): void
        
        exitPictureInPicture(option?: ExitPictureInPictureOption): void
        
        getMaxZoom(option?: GetMaxZoomOption): void
        
        onCustomRendererEvent(
            
            event: 'frame' | 'update',
            
            callback: CustomRendererFrameEventCallback
        ): void
        
        pause(option?: PauseOption): void
        
        pauseBGM(option?: PauseBGMOption): void
        
        playBGM(option: PlayBGMOption): void
        
        resume(option?: ResumeOption): void
        
        resumeBGM(option?: ResumeBGMOption): void
        
        sendMessage(option: SendMessageOption): void
        
        setBGMVolume(option: SetBGMVolumeOption): void
        
        setMICVolume(option: SetMICVolumeOption): void
        
        setZoom(option: LivePusherContextSetZoomOption): void
        
        snapshot(option: LivePusherContextSnapshotOption): void
        
        start(option?: LivePusherContextStartOption): void
        
        startPreview(option?: StartPreviewOption): void
        
        stop(option?: StopOption): void
        
        stopBGM(option?: StopBGMOption): void
        
        stopPreview(option?: StopPreviewOption): void
        
        switchCamera(option?: SwitchCameraOption): void
        
        toggleTorch(option?: ToggleTorchOption): void
    }
    interface LogManager {
        
        debug(
            
            ...args: any[]
        ): void
        
        info(
            
            ...args: any[]
        ): void
        
        log(
            
            ...args: any[]
        ): void
        
        warn(
            
            ...args: any[]
        ): void
    }
    interface MapContext {
        
        addArc(option: AddArcOption): void
        
        addCustomLayer(option: AddCustomLayerOption): void
        
        addGroundOverlay(option: AddGroundOverlayOption): void
        
        addMarkers(option: AddMarkersOption): void
        
        addVisualLayer(option: AddVisualLayerOption): void
        
        eraseLines(option: EraseLinesOption): void
        
        executeVisualLayerCommand(option: ExecuteVisualLayerCommandOption): void
        
        fromScreenLocation(option: FromScreenLocationOption): void
        
        getCenterLocation(option: GetCenterLocationOption): void
        
        getRegion(option?: GetRegionOption): void
        
        getRotate(option?: GetRotateOption): void
        
        getScale(option?: GetScaleOption): void
        
        getSkew(option?: GetSkewOption): void
        
        includePoints(option: IncludePointsOption): void
        
        initMarkerCluster(option: InitMarkerClusterOption): void
        
        moveAlong(option: MoveAlongOption): void
        
        moveToLocation(option?: MoveToLocationOption): void
        
        on(
            
            event:
                | 'markerClusterCreate'
                | 'markerClusterClick'
                | 'visualLayerEvent',
            
            callback: (...args: any[]) => any
        ): void
        
        openMapApp(option: OpenMapAppOption): void
        
        removeArc(option: RemoveArcOption): void
        
        removeCustomLayer(option: RemoveCustomLayerOption): void
        
        removeGroundOverlay(option: RemoveGroundOverlayOption): void
        
        removeMarkers(option: RemoveMarkersOption): void
        
        removeVisualLayer(option: RemoveVisualLayerOption): void
        
        setBoundary(option: SetBoundaryOption): void
        
        setCenterOffset(option: SetCenterOffsetOption): void
        
        setLocMarkerIcon(option: SetLocMarkerIconOption): void
        
        toScreenLocation(option: ToScreenLocationOption): void
        
        translateMarker(option: TranslateMarkerOption): void
        
        updateGroundOverlay(option: UpdateGroundOverlayOption): void
    }
    interface MediaContainer {
        
        addTrack(
            
            track: MediaTrack
        ): void
        
        destroy(): void
        
        export(): void
        
        extractDataSource(option: ExtractDataSourceOption): void
        
        removeTrack(
            
            track: MediaTrack
        ): void
    }
    interface MediaQueryObserver {
        
        disconnect(): void
        
        observe(
            
            descriptor: ObserveDescriptor,
            
            callback: MediaQueryObserverObserveCallback
        ): void
    }
    interface MediaRecorder {
        
        off(
            
            eventName: string,
            
            callback: (...args: any[]) => any
        ): void
        
        on(
            
            eventName: 'start' | 'stop' | 'pause' | 'resume' | 'timeupdate',
            
            callback: (...args: any[]) => any
        ): void
        
        destroy(): Promise<any>
        
        pause(): Promise<any>
        
        requestFrame(callback: (...args: any[]) => any): Promise<any>
        
        resume(): Promise<any>
        
        start(): Promise<any>
        
        stop(): Promise<any>
    }
    interface MifareClassic {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface MifareUltralight {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface NFCError {
         errMsg: string
         errCode: number
    }
    interface Ndef {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        offNdefMessage(callback: (...args: any[]) => any): void
        
        onNdefMessage(callback: (...args: any[]) => any): void
        
        setTimeout(option: SetTimeoutOption): void
        
        writeNdefMessage(option: WriteNdefMessageOption): void
    }
    interface NfcA {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getAtqa(option?: GetAtqaOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        getSak(option?: GetSakOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface NfcB {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface NfcF {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface NfcV {
        
        close(option?: NdefCloseOption): void
        
        connect(option?: NdefConnectOption): void
        
        getMaxTransceiveLength(option?: GetMaxTransceiveLengthOption): void
        
        isConnected(option?: IsConnectedOption): void
        
        setTimeout(option: SetTimeoutOption): void
        
        transceive(option: TransceiveOption): void
    }
    interface Nfcrwerror {
         errMsg: string
         errCode: number
    }
    interface NodesRef {
        
        boundingClientRect(
            
            callback?: BoundingClientRectCallback
        ): SelectorQuery
        
        context(
            
            callback?: ContextCallback
        ): SelectorQuery
        
        fields(
            fields: Fields,
            
            callback?: FieldsCallback
        ): SelectorQuery
        
        node(
            
            callback?: NodeCallback
        ): SelectorQuery
        
        scrollOffset(
            
            callback?: ScrollOffsetCallback
        ): SelectorQuery
    }
    interface Path2D {
        
        addPath(
            
            path: Path2D
        ): void
        
        arc(
            
            x: number,
            
            y: number,
            
            radius: number,
            
            startAngle: number,
            
            endAngle: number,
            
            counterclockwise?: boolean
        ): void
        
        arcTo(
            
            x1: number,
            
            y1: number,
            
            x2: number,
            
            y2: number,
            
            radius: number
        ): void
        
        bezierCurveTo(
            
            cp1x: number,
            
            cp1y: number,
            
            cp2x: number,
            
            cp2y: number,
            
            x: number,
            
            y: number
        ): void
        
        closePath(): void
        
        ellipse(
            
            x: number,
            
            y: number,
            
            radiusX: number,
            
            radiusY: number,
            
            rotation: number,
            
            startAngle: number,
            
            endAngle: number,
            
            counterclockwise?: boolean
        ): void
        
        lineTo(
            
            x: number,
            
            y: number
        ): void
        
        moveTo(
            
            x: number,
            
            y: number
        ): void
        
        quadraticCurveTo(
            
            cpx: number,
            
            cpy: number,
            
            x: number,
            
            y: number
        ): void
        
        rect(
            
            x: number,
            
            y: number,
            
            width: number,
            
            height: number
        ): void
    }
    interface Performance {
        
        getEntries(): PerformanceEntry[]
        
        getEntriesByName(
            
            name: string,
            
            entryType?: string
        ): PerformanceEntry[]
        
        getEntriesByType(
            
            entryType: string
        ): PerformanceEntry[]
        
        setBufferSize(size: number): void
        
        createObserver(
            
            callback: (...args: any[]) => any
        ): PerformanceObserver
    }
    interface PreDownloadSubpackageTask {
        
        onProgressUpdate(
            
            listener: PreDownloadSubpackageTaskOnProgressUpdateCallback
        ): void
    }
    interface RealtimeLogManager {
        
        getCurrentState(): CurrentState
        
        addFilterMsg(
            
            msg: string
        ): void
        
        error(
            
            ...args: any[]
        ): void
        
        in(
            
            pageInstance: Page.TrivialInstance
        ): void
        
        info(
            
            ...args: any[]
        ): void
        
        setFilterMsg(
            
            msg: string
        ): void
        
        warn(
            
            ...args: any[]
        ): void
        
        tag(
            
            tagName: string
        ): RealtimeTagLogManager
    }
    interface RealtimeTagLogManager {
        
        addFilterMsg(
            
            msg: string
        ): void
        
        error(
            
            key: string,
            
            value: IAnyObject | any[] | number | string
        ): void
        
        info(
            
            key: string,
            
            value: IAnyObject | any[] | number | string
        ): void
        
        setFilterMsg(
            
            msg: string
        ): void
        
        warn(
            
            key: string,
            
            value: IAnyObject | any[] | number | string
        ): void
    }
    interface RecorderManager {
        
        onError(
            
            listener: UDPSocketOnErrorCallback
        ): void
        
        onFrameRecorded(
            
            listener: OnFrameRecordedCallback
        ): void
        
        onInterruptionBegin(
            
            listener: OnInterruptionBeginCallback
        ): void
        
        onInterruptionEnd(
            
            listener: OnInterruptionEndCallback
        ): void
        
        onPause(
            
            listener: OnPauseCallback
        ): void
        
        onResume(
            
            listener: OnResumeCallback
        ): void
        
        onStart(
            
            listener: OnStartCallback
        ): void
        
        onStop(
            
            listener: RecorderManagerOnStopCallback
        ): void
        
        pause(): void
        
        resume(): void
        
        start(option: RecorderManagerStartOption): void
        
        stop(): void
    }
    interface RequestTask {
        
        abort(): void
        
        offChunkReceived(
            
            listener?: OffChunkReceivedCallback
        ): void
        
        offHeadersReceived(
            
            listener?: RequestTaskOffHeadersReceivedCallback
        ): void
        
        onChunkReceived(
            
            listener: OnChunkReceivedCallback
        ): void
        
        onHeadersReceived(
            
            listener: RequestTaskOnHeadersReceivedCallback
        ): void
    }
    interface RewardedVideoAd {
        
        load(): Promise<any>
        
        show(): Promise<any>
        
        destroy(): void
        
        offClose(
            
            listener?: RewardedVideoAdOffCloseCallback
        ): void
        
        offError(
            
            listener?: RewardedVideoAdOffErrorCallback
        ): void
        
        offLoad(
            
            listener?: OffLoadCallback
        ): void
        
        onClose(
            
            listener: RewardedVideoAdOnCloseCallback
        ): void
        
        onError(
            
            listener: RewardedVideoAdOnErrorCallback
        ): void
        
        onLoad(
            
            listener: OnLoadCallback
        ): void
    }
    interface Router {
        
        addRouteBuilder(
            
            routeType: string,
            
            routeBuilder: CustomRouteBuilder
        ): void
        
        getRouteContext(
            
            component: Component.TrivialInstance | Page.TrivialInstance
        ): void
        
        removeRouteBuilder(
            
            routeType: string
        ): void
    }
    interface SelectorQuery {
        
        exec(
            
            callback?: (...args: any[]) => any
        ): NodesRef
        
        select(
            
            selector: string
        ): NodesRef
        
        selectAll(
            
            selector: string
        ): NodesRef
        
        selectViewport(): NodesRef
        
        in(
            
            component: Component.TrivialInstance | Page.TrivialInstance
        ): SelectorQuery
    }
    interface SocketTask {
        
        close(option: SocketTaskCloseOption): void
        
        onClose(
            
            listener: SocketTaskOnCloseCallback
        ): void
        
        onError(
            
            listener: UDPSocketOnErrorCallback
        ): void
        
        onMessage(
            
            listener: SocketTaskOnMessageCallback
        ): void
        
        onOpen(
            
            listener: OnOpenCallback
        ): void
        
        send(option: SocketTaskSendOption): void
    }
    interface TCPSocket {
        
        bindWifi(options: BindWifiOption): void
        
        close(): void
        
        connect(options: TCPSocketConnectOption): void
        
        offBindWifi(
            
            listener?: OffBindWifiCallback
        ): void
        
        offClose(
            
            listener?: UDPSocketOffCloseCallback
        ): void
        
        offConnect(
            
            listener?: OffConnectCallback
        ): void
        
        offError(
            
            listener?: UDPSocketOffErrorCallback
        ): void
        
        offMessage(
            
            listener?: TCPSocketOffMessageCallback
        ): void
        
        onBindWifi(
            
            listener: OnBindWifiCallback
        ): void
        
        onClose(
            
            listener: UDPSocketOnCloseCallback
        ): void
        
        onConnect(
            
            listener: OnConnectCallback
        ): void
        
        onError(
            
            listener: UDPSocketOnErrorCallback
        ): void
        
        onMessage(
            
            listener: TCPSocketOnMessageCallback
        ): void
        
        write(
            
            data: string | ArrayBuffer
        ): void
    }
    interface UDPSocket {
        
        close(): void
        
        connect(option: UDPSocketConnectOption): void
        
        offClose(
            
            listener?: UDPSocketOffCloseCallback
        ): void
        
        offError(
            
            listener?: UDPSocketOffErrorCallback
        ): void
        
        offListening(
            
            listener?: OffListeningCallback
        ): void
        
        offMessage(
            
            listener?: UDPSocketOffMessageCallback
        ): void
        
        onClose(
            
            listener: UDPSocketOnCloseCallback
        ): void
        
        onError(
            
            listener: UDPSocketOnErrorCallback
        ): void
        
        onListening(
            
            listener: OnListeningCallback
        ): void
        
        onMessage(
            
            listener: UDPSocketOnMessageCallback
        ): void
        
        send(option: UDPSocketSendOption): void
        
        setTTL(
            
            ttl: number
        ): void
        
        write(): void
        
        bind(
            
            port?: number
        ): number
    }
    interface UpdateManager {
        
        applyUpdate(): void
        
        onCheckForUpdate(
            
            listener: OnCheckForUpdateCallback
        ): void
        
        onUpdateFailed(
            
            listener: OnUpdateFailedCallback
        ): void
        
        onUpdateReady(
            
            listener: OnUpdateReadyCallback
        ): void
    }
    interface UploadTask {
        
        abort(): void
        
        offHeadersReceived(
            
            listener?: DownloadTaskOffHeadersReceivedCallback
        ): void
        
        offProgressUpdate(
            
            listener?: UploadTaskOffProgressUpdateCallback
        ): void
        
        onHeadersReceived(
            
            listener: DownloadTaskOnHeadersReceivedCallback
        ): void
        
        onProgressUpdate(
            
            listener: UploadTaskOnProgressUpdateCallback
        ): void
    }
    interface UserCryptoManager {
        
        getLatestUserKey(option?: GetLatestUserKeyOption): void
        
        getRandomValues(option: GetRandomValuesOption): void
    }
    interface VideoContext {
        
        exitBackgroundPlayback(): void
        
        exitCasting(): void
        
        exitFullScreen(): void
        
        exitPictureInPicture(option?: ExitPictureInPictureOption): void
        
        hideStatusBar(): void
        
        pause(): void
        
        play(): void
        
        playbackRate(
            
            rate: number
        ): void
        
        reconnectCasting(): void
        
        requestBackgroundPlayback(): void
        
        requestFullScreen(option: VideoContextRequestFullScreenOption): void
        
        seek(
            
            position: number
        ): void
        
        sendDanmu(
            
            data: Danmu
        ): void
        
        showStatusBar(): void
        
        startCasting(): void
        
        stop(): void
        
        switchCasting(): void
    }
    interface VideoDecoder {
        
        getFrameData(): FrameDataOptions
        
        remove(): Promise<any>
        
        seek(
            
            position: number
        ): Promise<any>
        
        start(option: VideoDecoderStartOption): Promise<any>
        
        stop(): Promise<any>
        
        off(
            
            eventName: string,
            
            callback: (...args: any[]) => any
        ): void
        
        on(
            
            eventName: 'start' | 'stop' | 'seek' | 'bufferchange' | 'ended',
            
            callback: (...args: any[]) => any
        ): void
    }
    interface VirtualPaymentError {
         errMsg: string
         errCode: number
    }
    interface WifiError {
         errMsg: string
         errCode: number
    }
    interface Worklet {
        
        Easing: WorkletEasing
        
        decay(
            
            options: DecayOption,
            
            callback: (...args: any[]) => any
        ): AnimationObject
        
        delay(
            
            delayMS: number,
            
            delayedAnimation: AnimationObject
        ): AnimationObject
        
        repeat(
            
            animation: AnimationObject,
            
            numberOfReps?: number,
            
            reverse?: boolean,
            
            callback?: (...args: any[]) => any
        ): AnimationObject
        
        sequence(
            
            animationN: AnimationObject
        ): AnimationObject
        
        spring(
            
            toValue: number | string,
            
            options: SpringOption,
            
            callback: (...args: any[]) => any
        ): AnimationObject
        
        timing(
            
            toValue: number,
            
            options: TimingOption,
            
            callback: (...args: any[]) => any
        ): AnimationObject
        
        derived(
            
            updaterWorklet: WorkletFunction
        ): DerivedValue
        
        shared(
            
            initialValue: any
        ): SharedValue
        
        runOnJS(
            
            fn: (...args: any[]) => any
        ): (...args: any[]) => any
        
        runOnUI(
            
            fn: (...args: any[]) => any
        ): (...args: any[]) => any
        
        cancelAnimation(
            
            SharedValue: SharedValue
        ): void
    }
    interface Wx {
        miniapp: any
        serviceMarket: any
        
        batchGetStorageSync(
            
            keyList: string[]
        ): any[]
        
        base64ToArrayBuffer(
            
            base64: string
        ): ArrayBuffer
        
        getAccountInfoSync(): AccountInfo
        
        getAppAuthorizeSetting(): AppAuthorizeSetting
        
        getAppBaseInfo(): AppBaseInfo
        
        getBatteryInfoSync(): GetBatteryInfoSyncResult
        
        getDeviceInfo(): DeviceInfo
        
        getEnterOptionsSync(): LaunchOptionsApp
        
        getExptInfoSync(
            
            keys?: string[]
        ): IAnyObject
        
        getExtConfigSync(): IAnyObject
        
        getLaunchOptionsSync(): LaunchOptionsApp
        
        getMenuButtonBoundingClientRect(): ClientRect
        
        getSkylineInfoSync(): SkylineInfo
        
        getStorageInfoSync(): GetStorageInfoSyncOption
        
        getSystemInfoSync(): SystemInfo
        
        getSystemSetting(): SystemSetting
        
        getWindowInfo(): WindowInfo
        
        getRendererUserAgent(
            option?: GetRendererUserAgentOption
        ): Promise<string>
        
        createAnimation(option: StepOption): Animation
        
        createAudioContext(
            
            id: string,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): AudioContext
        
        getBackgroundAudioManager(): BackgroundAudioManager
        
        createCacheManager(option: CreateCacheManagerOption): CacheManager
        
        createCameraContext(): CameraContext
        
        createCanvasContext(
            
            canvasId: string,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): CanvasContext
        
        downloadFile(option: DownloadFileOption): DownloadTask
        
        getFileSystemManager(): FileSystemManager
        
        createInferenceSession(
            option: CreateInferenceSessionOption
        ): InferenceSession
        
        createInnerAudioContext(
            option?: CreateInnerAudioContextOption
        ): InnerAudioContext
        
        createIntersectionObserver(
            
            component: IAnyObject,
            
            options?: CreateIntersectionObserverOption
        ): IntersectionObserver
        
        createInterstitialAd(option: CreateInterstitialAdOption): InterstitialAd
        
        createLivePlayerContext(
            
            id: string,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): LivePlayerContext
        
        createLivePusherContext(): LivePusherContext
        
        getLogManager(option: GetLogManagerOption): LogManager
        
        createMapContext(
            
            mapId: string,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): MapContext
        
        createMediaAudioPlayer(): MediaAudioPlayer
        
        createMediaContainer(): MediaContainer
        
        createMediaRecorder(
            
            canvas: IAnyObject,
            options: CreateMediaRecorderOption
        ): MediaRecorder
        
        getNFCAdapter(): NFCAdapter
        
        createOffscreenCanvas(
            
            width: number,
            
            height: number,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): OffscreenCanvas
        
        createOffscreenCanvas(
            option: CreateOffscreenCanvasOption
        ): OffscreenCanvas
        
        getPerformance(): Performance
        
        preDownloadSubpackage(
            option: PreDownloadSubpackageOption
        ): PreDownloadSubpackageTask
        
        getRealtimeLogManager(): RealtimeLogManager
        
        getRecorderManager(): RecorderManager
        
        request<
            T extends string | IAnyObject | ArrayBuffer =
                | string
                | IAnyObject
                | ArrayBuffer
        >(
            option: RequestOption<T>
        ): RequestTask
        
        createRewardedVideoAd(
            option: CreateRewardedVideoAdOption
        ): RewardedVideoAd
        
        createSelectorQuery(): SelectorQuery
        
        connectSocket(option: ConnectSocketOption): SocketTask
        
        createTCPSocket(): TCPSocket
        
        createUDPSocket(): UDPSocket
        
        getUpdateManager(): UpdateManager
        
        uploadFile(option: UploadFileOption): UploadTask
        
        getUserCryptoManager(): UserCryptoManager
        
        createVKSession(option: VKConfig): VKSession
        
        createVideoContext(
            
            id: string,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): VideoContext
        
        createVideoDecoder(): VideoDecoder
        
        createWebAudioContext(): WebAudioContext
        
        createWorker(
            
            scriptPath: string,
            
            options?: CreateWorkerOption
        ): Worker
        
        getStorageSync<T = any>(
            
            key: string
        ): T
        
        canIUse(
            
            schema: string
        ): boolean
        
        checkIsPictureInPictureActive(): boolean
        
        isVKSupport(
            
            version: 'v1' | 'v2'
        ): boolean
        
        arrayBufferToBase64(
            
            arrayBuffer: ArrayBuffer
        ): string
        
        createBufferURL(
            
            buffer:
                | ArrayBuffer
                | Int8Array
                | Uint8Array
                | Uint8ClampedArray
                | Int16Array
                | Uint16Array
                | Int32Array
                | Uint32Array
                | Float32Array
                | Float64Array
        ): string
        
        getApiCategory(): string
        
        addCard<T extends AddCardOption = AddCardOption>(
            option: T
        ): PromisifySuccessResult<T, AddCardOption>
        
        addFileToFavorites<
            T extends AddFileToFavoritesOption = AddFileToFavoritesOption
        >(
            option: T
        ): PromisifySuccessResult<T, AddFileToFavoritesOption>
        
        addPhoneCalendar<
            T extends AddPhoneCalendarOption = AddPhoneCalendarOption
        >(
            option: T
        ): PromisifySuccessResult<T, AddPhoneCalendarOption>
        
        addPhoneContact<
            T extends AddPhoneContactOption = AddPhoneContactOption
        >(
            option: T
        ): PromisifySuccessResult<T, AddPhoneContactOption>
        
        addPhoneRepeatCalendar<
            T extends AddPhoneRepeatCalendarOption = AddPhoneRepeatCalendarOption
        >(
            option: T
        ): PromisifySuccessResult<T, AddPhoneRepeatCalendarOption>
        
        addVideoToFavorites<
            T extends AddVideoToFavoritesOption = AddVideoToFavoritesOption
        >(
            option: T
        ): PromisifySuccessResult<T, AddVideoToFavoritesOption>
        
        authPrivateMessage(option?: AuthPrivateMessageOption): void
        
        authorize<T extends AuthorizeOption = AuthorizeOption>(
            option: T
        ): PromisifySuccessResult<T, AuthorizeOption>
        
        authorizeForMiniProgram(option: AuthorizeForMiniProgramOption): void
        
        batchGetStorage<
            T extends BatchGetStorageOption = BatchGetStorageOption
        >(
            option: T
        ): PromisifySuccessResult<T, BatchGetStorageOption>
        
        batchSetStorage<
            T extends BatchSetStorageOption = BatchSetStorageOption
        >(
            option: T
        ): PromisifySuccessResult<T, BatchSetStorageOption>
        
        batchSetStorageSync(kvList: KvList[]): void
        
        canvasGetImageData<
            T extends CanvasGetImageDataOption = CanvasGetImageDataOption
        >(
            option: T,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): PromisifySuccessResult<T, CanvasGetImageDataOption>
        
        canvasPutImageData<
            T extends CanvasPutImageDataOption = CanvasPutImageDataOption
        >(
            option: T,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): PromisifySuccessResult<T, CanvasPutImageDataOption>
        
        canvasToTempFilePath<
            T extends CanvasToTempFilePathOption = CanvasToTempFilePathOption
        >(
            option: T,
            
            component?: Component.TrivialInstance | Page.TrivialInstance
        ): PromisifySuccessResult<T, CanvasToTempFilePathOption>
        
        checkIsAddedToMyMiniProgram(
            option: CheckIsAddedToMyMiniProgramOption
        ): void
        
        checkIsOpenAccessibility<
            T extends CheckIsOpenAccessibilityOption = CheckIsOpenAccessibilityOption
        >(
            option?: T
        ): PromisifySuccessResult<T, CheckIsOpenAccessibilityOption>
        
        checkIsSoterEnrolledInDevice<
            T extends CheckIsSoterEnrolledInDeviceOption = CheckIsSoterEnrolledInDeviceOption
        >(
            option: T
        ): PromisifySuccessResult<T, CheckIsSoterEnrolledInDeviceOption>
        
        checkIsSupportSoterAuthentication<
            T extends CheckIsSupportSoterAuthenticationOption = CheckIsSupportSoterAuthenticationOption
        >(
            option?: T
        ): PromisifySuccessResult<T, CheckIsSupportSoterAuthenticationOption>
        
        checkSession<T extends CheckSessionOption = CheckSessionOption>(
            option?: T
        ): PromisifySuccessResult<T, CheckSessionOption>
        
        chooseAddress<T extends ChooseAddressOption = ChooseAddressOption>(
            option?: T
        ): PromisifySuccessResult<T, ChooseAddressOption>
        
        chooseContact(option?: ChooseContactOption): void
        
        chooseImage<T extends ChooseImageOption = ChooseImageOption>(
            option?: T
        ): PromisifySuccessResult<T, ChooseImageOption>
        
        chooseInvoice<T extends ChooseInvoiceOption = ChooseInvoiceOption>(
            option?: T
        ): PromisifySuccessResult<T, ChooseInvoiceOption>
        
        chooseInvoiceTitle<
            T extends ChooseInvoiceTitleOption = ChooseInvoiceTitleOption
        >(
            option?: T
        ): PromisifySuccessResult<T, ChooseInvoiceTitleOption>
        
        chooseLicensePlate<
            T extends ChooseLicensePlateOption = ChooseLicensePlateOption
        >(
            option?: T
        ): PromisifySuccessResult<T, ChooseLicensePlateOption>
        
        chooseLocation<T extends ChooseLocationOption = ChooseLocationOption>(
            option: T
        ): PromisifySuccessResult<T, ChooseLocationOption>
        
        chooseMedia<T extends ChooseMediaOption = ChooseMediaOption>(
            option: T
        ): PromisifySuccessResult<T, ChooseMediaOption>
        
        chooseMessageFile<
            T extends ChooseMessageFileOption = ChooseMessageFileOption
        >(
            option: T
        ): PromisifySuccessResult<T, ChooseMessageFileOption>
        
        choosePoi<T extends ChoosePoiOption = ChoosePoiOption>(
            option: T
        ): PromisifySuccessResult<T, ChoosePoiOption>
        
        chooseVideo<T extends ChooseVideoOption = ChooseVideoOption>(
            option: T
        ): PromisifySuccessResult<T, ChooseVideoOption>
        
        clearStorage<T extends ClearStorageOption = ClearStorageOption>(
            option?: T
        ): PromisifySuccessResult<T, ClearStorageOption>
        
        clearStorageSync(): void
        
        closeBLEConnection<
            T extends CloseBLEConnectionOption = CloseBLEConnectionOption
        >(
            option: T
        ): PromisifySuccessResult<T, CloseBLEConnectionOption>
        
        closeBluetoothAdapter<
            T extends CloseBluetoothAdapterOption = CloseBluetoothAdapterOption
        >(
            option?: T
        ): PromisifySuccessResult<T, CloseBluetoothAdapterOption>
        
        closeSocket<T extends CloseSocketOption = CloseSocketOption>(
            option?: T
        ): PromisifySuccessResult<T, CloseSocketOption>
        
        compressImage<T extends CompressImageOption = CompressImageOption>(
            option: T
        ): PromisifySuccessResult<T, CompressImageOption>
        
        compressVideo<T extends CompressVideoOption = CompressVideoOption>(
            option: T
        ): PromisifySuccessResult<T, CompressVideoOption>
        
        connectWifi<T extends ConnectWifiOption = ConnectWifiOption>(
            option: T
        ): PromisifySuccessResult<T, ConnectWifiOption>
        
        createBLEConnection<
            T extends CreateBLEConnectionOption = CreateBLEConnectionOption
        >(
            option: T
        ): PromisifySuccessResult<T, CreateBLEConnectionOption>
        
        createBLEPeripheralServer<
            T extends CreateBLEPeripheralServerOption = CreateBLEPeripheralServerOption
        >(
            option?: T
        ): PromisifySuccessResult<T, CreateBLEPeripheralServerOption>
        
        cropImage(option: CropImageOption): void
        
        disableAlertBeforeUnload(option?: DisableAlertBeforeUnloadOption): void
        
        editImage(option: EditImageOption): void
        
        enableAlertBeforeUnload(option: EnableAlertBeforeUnloadOption): void
        
        exitMiniProgram<
            T extends ExitMiniProgramOption = ExitMiniProgramOption
        >(
            option?: T
        ): PromisifySuccessResult<T, ExitMiniProgramOption>
        
        exitVoIPChat<T extends ExitVoIPChatOption = ExitVoIPChatOption>(
            option?: T
        ): PromisifySuccessResult<T, ExitVoIPChatOption>
        
        faceDetect(option: FaceDetectOption): void
        
        getAvailableAudioSources<
            T extends GetAvailableAudioSourcesOption = GetAvailableAudioSourcesOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetAvailableAudioSourcesOption>
        
        getBLEDeviceCharacteristics<
            T extends GetBLEDeviceCharacteristicsOption = GetBLEDeviceCharacteristicsOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetBLEDeviceCharacteristicsOption>
        
        getBLEDeviceRSSI<
            T extends GetBLEDeviceRSSIOption = GetBLEDeviceRSSIOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetBLEDeviceRSSIOption>
        
        getBLEDeviceServices<
            T extends GetBLEDeviceServicesOption = GetBLEDeviceServicesOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetBLEDeviceServicesOption>
        
        getBLEMTU<T extends GetBLEMTUOption = GetBLEMTUOption>(
            option: T
        ): PromisifySuccessResult<T, GetBLEMTUOption>
        
        getBackgroundAudioPlayerState<
            T extends GetBackgroundAudioPlayerStateOption = GetBackgroundAudioPlayerStateOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetBackgroundAudioPlayerStateOption>
        
        getBackgroundFetchData<
            T extends GetBackgroundFetchDataOption = GetBackgroundFetchDataOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetBackgroundFetchDataOption>
        
        getBackgroundFetchToken<
            T extends GetBackgroundFetchTokenOption = GetBackgroundFetchTokenOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetBackgroundFetchTokenOption>
        
        getBatteryInfo<T extends GetBatteryInfoOption = GetBatteryInfoOption>(
            option?: T
        ): PromisifySuccessResult<T, GetBatteryInfoOption>
        
        getBeacons<T extends GetBeaconsOption = GetBeaconsOption>(
            option?: T
        ): PromisifySuccessResult<T, GetBeaconsOption>
        
        getBluetoothAdapterState<
            T extends GetBluetoothAdapterStateOption = GetBluetoothAdapterStateOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetBluetoothAdapterStateOption>
        
        getBluetoothDevices<
            T extends GetBluetoothDevicesOption = GetBluetoothDevicesOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetBluetoothDevicesOption>
        
        getChannelsLiveInfo(option: GetChannelsLiveInfoOption): void
        
        getChannelsLiveNoticeInfo(option: GetChannelsLiveNoticeInfoOption): void
        
        getChannelsShareKey(option?: GetChannelsShareKeyOption): void
        
        getClipboardData<
            T extends GetClipboardDataOption = GetClipboardDataOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetClipboardDataOption>
        
        getCommonConfig(option: GetCommonConfigOption): void
        
        getConnectedBluetoothDevices<
            T extends GetConnectedBluetoothDevicesOption = GetConnectedBluetoothDevicesOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetConnectedBluetoothDevicesOption>
        
        getConnectedWifi<
            T extends GetConnectedWifiOption = GetConnectedWifiOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetConnectedWifiOption>
        
        getDeviceVoIPList(option?: GetDeviceVoIPListOption): void
        
        getExtConfig<T extends GetExtConfigOption = GetExtConfigOption>(
            option?: T
        ): PromisifySuccessResult<T, GetExtConfigOption>
        
        getFuzzyLocation(option: GetFuzzyLocationOption): void
        
        getGroupEnterInfo(option: GetGroupEnterInfoOption): void
        
        getHCEState<T extends GetHCEStateOption = GetHCEStateOption>(
            option?: T
        ): PromisifySuccessResult<T, GetHCEStateOption>
        
        getImageInfo<T extends GetImageInfoOption = GetImageInfoOption>(
            option: T
        ): PromisifySuccessResult<T, GetImageInfoOption>
        
        getInferenceEnvInfo(option?: GetInferenceEnvInfoOption): void
        
        getLocalIPAddress(option: GetLocalIPAddressOption): void
        
        getLocation<T extends GetLocationOption = GetLocationOption>(
            option: T
        ): PromisifySuccessResult<T, GetLocationOption>
        
        getNetworkType<T extends GetNetworkTypeOption = GetNetworkTypeOption>(
            option?: T
        ): PromisifySuccessResult<T, GetNetworkTypeOption>
        
        getPrivacySetting(option: GetPrivacySettingOption): void
        
        getRandomValues<
            T extends GetRandomValuesOption = GetRandomValuesOption
        >(
            option: T
        ): PromisifySuccessResult<T, GetRandomValuesOption>
        
        getScreenBrightness<
            T extends GetScreenBrightnessOption = GetScreenBrightnessOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetScreenBrightnessOption>
        
        getScreenRecordingState(option?: GetScreenRecordingStateOption): void
        
        getSelectedTextRange<
            T extends GetSelectedTextRangeOption = GetSelectedTextRangeOption
        >(
            option?: T
        ): PromisifySuccessResult<T, GetSelectedTextRangeOption>
        
        getSetting<T extends GetSettingOption = GetSettingOption>(
            option?: T
        ): PromisifySuccessResult<T, GetSettingOption>
        
        getShareInfo<T extends GetShareInfoOption = GetShareInfoOption>(
            option: T
        ): PromisifySuccessResult<T, GetShareInfoOption>
        
        getSkylineInfo(option?: GetSkylineInfoOption): void
        
        getStorage<
            T = any,
            U extends GetStorageOption<T> = GetStorageOption<T>
        >(
            option: U
        ): PromisifySuccessResult<U, GetStorageOption<T>>
        
        getStorageInfo<T extends GetStorageInfoOption = GetStorageInfoOption>(
            option?: T
        ): PromisifySuccessResult<T, GetStorageInfoOption>
        
        getSystemInfo<T extends GetSystemInfoOption = GetSystemInfoOption>(
            option?: T
        ): PromisifySuccessResult<T, GetSystemInfoOption>
        
        getSystemInfoAsync(option?: GetSystemInfoAsyncOption): void
        
        getUserInfo<T extends GetUserInfoOption = GetUserInfoOption>(
            option: T
        ): PromisifySuccessResult<T, GetUserInfoOption>
        
        getUserProfile<T extends GetUserProfileOption = GetUserProfileOption>(
            option: T
        ): PromisifySuccessResult<T, GetUserProfileOption>
        
        getVideoInfo<T extends GetVideoInfoOption = GetVideoInfoOption>(
            option: T
        ): PromisifySuccessResult<T, GetVideoInfoOption>
        
        getWeRunData<T extends GetWeRunDataOption = GetWeRunDataOption>(
            option?: T
        ): PromisifySuccessResult<T, GetWeRunDataOption>
        
        getWifiList<T extends GetWifiListOption = GetWifiListOption>(
            option?: T
        ): PromisifySuccessResult<T, GetWifiListOption>
        
        hideHomeButton<T extends HideHomeButtonOption = HideHomeButtonOption>(
            option?: T
        ): PromisifySuccessResult<T, HideHomeButtonOption>
        
        hideKeyboard<T extends HideKeyboardOption = HideKeyboardOption>(
            option?: T
        ): PromisifySuccessResult<T, HideKeyboardOption>
        
        hideLoading<T extends HideLoadingOption = HideLoadingOption>(
            option?: T
        ): PromisifySuccessResult<T, HideLoadingOption>
        
        hideNavigationBarLoading<
            T extends HideNavigationBarLoadingOption = HideNavigationBarLoadingOption
        >(
            option?: T
        ): PromisifySuccessResult<T, HideNavigationBarLoadingOption>
        
        hideShareMenu<T extends HideShareMenuOption = HideShareMenuOption>(
            option?: T
        ): PromisifySuccessResult<T, HideShareMenuOption>
        
        hideTabBar<T extends HideTabBarOption = HideTabBarOption>(
            option: T
        ): PromisifySuccessResult<T, HideTabBarOption>
        
        hideTabBarRedDot<
            T extends HideTabBarRedDotOption = HideTabBarRedDotOption
        >(
            option: T
        ): PromisifySuccessResult<T, HideTabBarRedDotOption>
        
        hideToast<T extends HideToastOption = HideToastOption>(
            option?: T
        ): PromisifySuccessResult<T, HideToastOption>
        
        initFaceDetect(option?: InitFaceDetectOption): void
        
        isBluetoothDevicePaired<
            T extends IsBluetoothDevicePairedOption = IsBluetoothDevicePairedOption
        >(
            option: T
        ): PromisifySuccessResult<T, IsBluetoothDevicePairedOption>
        
        join1v1Chat(option: Join1v1ChatOption): void
        
        joinVoIPChat<T extends JoinVoIPChatOption = JoinVoIPChatOption>(
            option: T
        ): PromisifySuccessResult<T, JoinVoIPChatOption>
        
        loadFontFace<T extends LoadFontFaceOption = LoadFontFaceOption>(
            option: T
        ): PromisifySuccessResult<T, LoadFontFaceOption>
        
        login<T extends LoginOption = LoginOption>(
            option?: T
        ): PromisifySuccessResult<T, LoginOption>
        
        makeBluetoothPair<
            T extends MakeBluetoothPairOption = MakeBluetoothPairOption
        >(
            option: T
        ): PromisifySuccessResult<T, MakeBluetoothPairOption>
        
        makePhoneCall<T extends MakePhoneCallOption = MakePhoneCallOption>(
            option: T
        ): PromisifySuccessResult<T, MakePhoneCallOption>
        
        navigateBack<T extends NavigateBackOption = NavigateBackOption>(
            option?: T
        ): PromisifySuccessResult<T, NavigateBackOption>
        
        navigateBackMiniProgram<
            T extends NavigateBackMiniProgramOption = NavigateBackMiniProgramOption
        >(
            option: T
        ): PromisifySuccessResult<T, NavigateBackMiniProgramOption>
        
        navigateTo<T extends NavigateToOption = NavigateToOption>(
            option: T
        ): PromisifySuccessResult<T, NavigateToOption>
        
        navigateToMiniProgram<
            T extends NavigateToMiniProgramOption = NavigateToMiniProgramOption
        >(
            option: T
        ): PromisifySuccessResult<T, NavigateToMiniProgramOption>
        
        nextTick(callback: (...args: any[]) => any): void
        
        notifyBLECharacteristicValueChange<
            T extends NotifyBLECharacteristicValueChangeOption = NotifyBLECharacteristicValueChangeOption
        >(
            option: T
        ): PromisifySuccessResult<T, NotifyBLECharacteristicValueChangeOption>
        
        offAccelerometerChange(
            
            listener?: OffAccelerometerChangeCallback
        ): void
        
        offApiCategoryChange(
            
            listener?: OffApiCategoryChangeCallback
        ): void
        
        offAppHide(
            
            listener?: OffAppHideCallback
        ): void
        
        offAppShow(
            
            listener?: OffAppShowCallback
        ): void
        
        offAudioInterruptionBegin(
            
            listener?: OffAudioInterruptionBeginCallback
        ): void
        
        offAudioInterruptionEnd(
            
            listener?: OffAudioInterruptionEndCallback
        ): void
        
        offBLECharacteristicValueChange(): void
        
        offBLEConnectionStateChange(
            
            listener?: OffBLEConnectionStateChangeCallback
        ): void
        
        offBLEMTUChange(
            
            listener?: OffBLEMTUChangeCallback
        ): void
        
        offBLEPeripheralConnectionStateChanged(
            
            listener?: OffBLEPeripheralConnectionStateChangedCallback
        ): void
        
        offBeaconServiceChange(): void
        
        offBeaconUpdate(): void
        
        offBluetoothAdapterStateChange(): void
        
        offBluetoothDeviceFound(): void
        
        offCompassChange(
            
            listener?: OffCompassChangeCallback
        ): void
        
        offCopyUrl(): void
        
        offDeviceMotionChange(
            
            listener?: OffDeviceMotionChangeCallback
        ): void
        
        offEmbeddedMiniProgramHeightChange(
            
            listener?: OffEmbeddedMiniProgramHeightChangeCallback
        ): void
        
        offError(
            
            listener?: WxOffErrorCallback
        ): void
        
        offGetWifiList(
            
            listener?: OffGetWifiListCallback
        ): void
        
        offGyroscopeChange(
            
            listener?: OffGyroscopeChangeCallback
        ): void
        
        offHCEMessage(
            
            listener?: OffHCEMessageCallback
        ): void
        
        offKeyboardHeightChange(
            
            listener?: OffKeyboardHeightChangeCallback
        ): void
        
        offLazyLoadError(
            
            listener?: OffLazyLoadErrorCallback
        ): void
        
        offLocalServiceDiscoveryStop(
            
            listener?: OffLocalServiceDiscoveryStopCallback
        ): void
        
        offLocalServiceFound(
            
            listener?: OffLocalServiceFoundCallback
        ): void
        
        offLocalServiceLost(
            
            listener?: OffLocalServiceLostCallback
        ): void
        
        offLocalServiceResolveFail(
            
            listener?: OffLocalServiceResolveFailCallback
        ): void
        
        offLocationChange(
            
            listener?: OffLocationChangeCallback
        ): void
        
        offLocationChangeError(
            
            listener?: OffLocationChangeErrorCallback
        ): void
        
        offMemoryWarning(
            
            listener?: OffMemoryWarningCallback
        ): void
        
        offNetworkStatusChange(
            
            listener?: OffNetworkStatusChangeCallback
        ): void
        
        offNetworkWeakChange(
            
            listener?: OffNetworkWeakChangeCallback
        ): void
        
        offPageNotFound(
            
            listener?: OffPageNotFoundCallback
        ): void
        
        offScreenRecordingStateChanged(
            
            listener?: OffScreenRecordingStateChangedCallback
        ): void
        
        offThemeChange(
            
            listener?: OffThemeChangeCallback
        ): void
        
        offUnhandledRejection(
            
            listener?: OffUnhandledRejectionCallback
        ): void
        
        offUserCaptureScreen(
            
            callback?: (...args: any[]) => any
        ): void
        
        offVoIPChatInterrupted(
            
            listener?: OffVoIPChatInterruptedCallback
        ): void
        
        offVoIPChatMembersChanged(
            
            listener?: OffVoIPChatMembersChangedCallback
        ): void
        
        offVoIPChatSpeakersChanged(
            
            listener?: OffVoIPChatSpeakersChangedCallback
        ): void
        
        offVoIPChatStateChanged(
            
            listener?: OffVoIPChatStateChangedCallback
        ): void
        
        offVoIPVideoMembersChanged(
            
            listener?: OffVoIPVideoMembersChangedCallback
        ): void
        
        offWifiConnected(
            
            listener?: OffWifiConnectedCallback
        ): void
        
        offWifiConnectedWithPartialInfo(
            
            listener?: OffWifiConnectedWithPartialInfoCallback
        ): void
        
        offWindowResize(
            
            listener?: OffWindowResizeCallback
        ): void
        
        onAccelerometerChange(
            
            listener: OnAccelerometerChangeCallback
        ): void
        
        onApiCategoryChange(
            
            listener: OnApiCategoryChangeCallback
        ): void
        
        onAppHide(
            
            listener: OnAppHideCallback
        ): void
        
        onAppShow(
            
            listener: OnAppShowCallback
        ): void
        
        onAudioInterruptionBegin(
            
            listener: OnAudioInterruptionBeginCallback
        ): void
        
        onAudioInterruptionEnd(
            
            listener: OnAudioInterruptionEndCallback
        ): void
        
        onBLECharacteristicValueChange(
            
            listener: OnBLECharacteristicValueChangeCallback
        ): void
        
        onBLEConnectionStateChange(
            
            listener: OnBLEConnectionStateChangeCallback
        ): void
        
        onBLEMTUChange(
            
            listener: OnBLEMTUChangeCallback
        ): void
        
        onBLEPeripheralConnectionStateChanged(
            
            listener: OnBLEPeripheralConnectionStateChangedCallback
        ): void
        
        onBackgroundAudioPause(
            
            listener: OnBackgroundAudioPauseCallback
        ): void
        
        onBackgroundAudioPlay(
            
            listener: OnBackgroundAudioPlayCallback
        ): void
        
        onBackgroundAudioStop(
            
            listener: OnBackgroundAudioStopCallback
        ): void
        
        onBackgroundFetchData(
            
            listener: OnBackgroundFetchDataCallback
        ): void
        
        onBeaconServiceChange(
            
            listener: OnBeaconServiceChangeCallback
        ): void
        
        onBeaconUpdate(
            
            listener: OnBeaconUpdateCallback
        ): void
        
        onBluetoothAdapterStateChange(
            
            listener: OnBluetoothAdapterStateChangeCallback
        ): void
        
        onBluetoothDeviceFound(
            
            listener: OnBluetoothDeviceFoundCallback
        ): void
        
        onCompassChange(
            
            listener: OnCompassChangeCallback
        ): void
        
        onCopyUrl(
            
            listener: OnCopyUrlCallback
        ): void
        
        onDeviceMotionChange(
            
            listener: OnDeviceMotionChangeCallback
        ): void
        
        onEmbeddedMiniProgramHeightChange(
            
            listener: OnEmbeddedMiniProgramHeightChangeCallback
        ): void
        
        onError(
            
            listener: WxOnErrorCallback
        ): void
        
        onGetWifiList(
            
            listener: OnGetWifiListCallback
        ): void
        
        onGyroscopeChange(
            
            listener: OnGyroscopeChangeCallback
        ): void
        
        onHCEMessage(
            
            listener: OnHCEMessageCallback
        ): void
        
        onKeyboardHeightChange(
            
            listener: OnKeyboardHeightChangeCallback
        ): void
        
        onLazyLoadError(
            
            listener: OnLazyLoadErrorCallback
        ): void
        
        onLocalServiceDiscoveryStop(
            
            listener: OnLocalServiceDiscoveryStopCallback
        ): void
        
        onLocalServiceFound(
            
            listener: OnLocalServiceFoundCallback
        ): void
        
        onLocalServiceLost(
            
            listener: OnLocalServiceLostCallback
        ): void
        
        onLocalServiceResolveFail(
            
            listener: OnLocalServiceResolveFailCallback
        ): void
        
        onLocationChange(
            
            listener: OnLocationChangeCallback
        ): void
        
        onLocationChangeError(
            
            listener: OnLocationChangeErrorCallback
        ): void
        
        onMemoryWarning(
            
            listener: OnMemoryWarningCallback
        ): void
        
        onNeedPrivacyAuthorization(
            
            listener: OnNeedPrivacyAuthorizationCallback
        ): void
        
        onNetworkStatusChange(
            
            listener: OnNetworkStatusChangeCallback
        ): void
        
        onNetworkWeakChange(
            
            listener: OnNetworkWeakChangeCallback
        ): void
        
        onPageNotFound(
            
            listener: OnPageNotFoundCallback
        ): void
        
        onScreenRecordingStateChanged(
            
            listener: OnScreenRecordingStateChangedCallback
        ): void
        
        onSocketClose(
            
            listener: OnSocketCloseCallback
        ): void
        
        onSocketError(
            
            listener: OnSocketErrorCallback
        ): void
        
        onSocketMessage(
            
            listener: OnSocketMessageCallback
        ): void
        
        onSocketOpen(
            
            listener: OnSocketOpenCallback
        ): void
        
        onThemeChange(
            
            listener: OnThemeChangeCallback
        ): void
        
        onUnhandledRejection(
            
            listener: OnUnhandledRejectionCallback
        ): void
        
        onUserCaptureScreen(
            
            listener: OnUserCaptureScreenCallback
        ): void
        
        onVoIPChatInterrupted(
            
            listener: OnVoIPChatInterruptedCallback
        ): void
        
        onVoIPChatMembersChanged(
            
            listener: OnVoIPChatMembersChangedCallback
        ): void
        
        onVoIPChatSpeakersChanged(
            
            listener: OnVoIPChatSpeakersChangedCallback
        ): void
        
        onVoIPChatStateChanged(
            
            listener: OnVoIPChatStateChangedCallback
        ): void
        
        onVoIPVideoMembersChanged(
            
            listener: OnVoIPVideoMembersChangedCallback
        ): void
        
        onWifiConnected(
            
            listener: OnWifiConnectedCallback
        ): void
        
        onWifiConnectedWithPartialInfo(
            
            listener: OnWifiConnectedWithPartialInfoCallback
        ): void
        
        onWindowResize(
            
            listener: OnWindowResizeCallback
        ): void
        
        openAppAuthorizeSetting<
            T extends OpenAppAuthorizeSettingOption = OpenAppAuthorizeSettingOption
        >(
            option?: T
        ): PromisifySuccessResult<T, OpenAppAuthorizeSettingOption>
        
        openBluetoothAdapter<
            T extends OpenBluetoothAdapterOption = OpenBluetoothAdapterOption
        >(
            option?: T
        ): PromisifySuccessResult<T, OpenBluetoothAdapterOption>
        
        openCard<T extends OpenCardOption = OpenCardOption>(
            option: T
        ): PromisifySuccessResult<T, OpenCardOption>
        
        openChannelsActivity(option: OpenChannelsActivityOption): void
        
        openChannelsEvent(option: OpenChannelsEventOption): void
        
        openChannelsLive(option: OpenChannelsLiveOption): void
        
        openChannelsUserProfile(option: OpenChannelsUserProfileOption): void
        
        openCustomerServiceChat(option: OpenCustomerServiceChatOption): void
        
        openDocument<T extends OpenDocumentOption = OpenDocumentOption>(
            option: T
        ): PromisifySuccessResult<T, OpenDocumentOption>
        
        openEmbeddedMiniProgram<
            T extends OpenEmbeddedMiniProgramOption = OpenEmbeddedMiniProgramOption
        >(
            option: T
        ): PromisifySuccessResult<T, OpenEmbeddedMiniProgramOption>
        
        openLocation<T extends OpenLocationOption = OpenLocationOption>(
            option: T
        ): PromisifySuccessResult<T, OpenLocationOption>
        
        openPrivacyContract(option: OpenPrivacyContractOption): void
        
        openSetting<T extends OpenSettingOption = OpenSettingOption>(
            option?: T
        ): PromisifySuccessResult<T, OpenSettingOption>
        
        openSingleStickerView(option: OpenSingleStickerViewOption): void
        
        openStickerIPView(option: OpenStickerIPViewOption): void
        
        openStickerSetView(option: OpenStickerSetViewOption): void
        
        openSystemBluetoothSetting<
            T extends OpenSystemBluetoothSettingOption = OpenSystemBluetoothSettingOption
        >(
            option?: T
        ): PromisifySuccessResult<T, OpenSystemBluetoothSettingOption>
        
        openVideoEditor(option: OpenVideoEditorOption): void
        
        pageScrollTo<T extends PageScrollToOption = PageScrollToOption>(
            option: T
        ): PromisifySuccessResult<T, PageScrollToOption>
        
        pauseBackgroundAudio<
            T extends PauseBackgroundAudioOption = PauseBackgroundAudioOption
        >(
            option?: T
        ): PromisifySuccessResult<T, PauseBackgroundAudioOption>
        
        pauseVoice<T extends PauseVoiceOption = PauseVoiceOption>(
            option?: T
        ): PromisifySuccessResult<T, PauseVoiceOption>
        
        playBackgroundAudio<
            T extends PlayBackgroundAudioOption = PlayBackgroundAudioOption
        >(
            option: T
        ): PromisifySuccessResult<T, PlayBackgroundAudioOption>
        
        playVoice<T extends PlayVoiceOption = PlayVoiceOption>(
            option: T
        ): PromisifySuccessResult<T, PlayVoiceOption>
        
        pluginLogin(args?: PluginLoginOption): void
        
        preloadAssets(option: PreloadAssetsOption): void
        
        preloadSkylineView(option?: PreloadSkylineViewOption): void
        
        preloadWebview(option?: PreloadWebviewOption): void
        
        previewImage<T extends PreviewImageOption = PreviewImageOption>(
            option: T
        ): PromisifySuccessResult<T, PreviewImageOption>
        
        previewMedia<T extends PreviewMediaOption = PreviewMediaOption>(
            option: T
        ): PromisifySuccessResult<T, PreviewMediaOption>
        
        reLaunch<T extends ReLaunchOption = ReLaunchOption>(
            option: T
        ): PromisifySuccessResult<T, ReLaunchOption>
        
        readBLECharacteristicValue<
            T extends ReadBLECharacteristicValueOption = ReadBLECharacteristicValueOption
        >(
            option: T
        ): PromisifySuccessResult<T, ReadBLECharacteristicValueOption>
        
        redirectTo<T extends RedirectToOption = RedirectToOption>(
            option: T
        ): PromisifySuccessResult<T, RedirectToOption>
        
        removeStorage<T extends RemoveStorageOption = RemoveStorageOption>(
            option: T
        ): PromisifySuccessResult<T, RemoveStorageOption>
        
        removeStorageSync(
            
            key: string
        ): void
        
        removeTabBarBadge<
            T extends RemoveTabBarBadgeOption = RemoveTabBarBadgeOption
        >(
            option: T
        ): PromisifySuccessResult<T, RemoveTabBarBadgeOption>
        
        reportAnalytics(
            
            eventName: string,
            
            data: IAnyObject
        ): void
        
        reportEvent(
            
            eventId: string,
            
            data?: IAnyObject
        ): void
        
        reportMonitor(
            
            name: string,
            
            value: number
        ): void
        
        reportPerformance(
            
            id: number,
            
            value: number,
            
            dimensions?: string | any[]
        ): void
        
        requestCommonPayment(option: RequestCommonPaymentOption): void
        
        requestDeviceVoIP(option: RequestDeviceVoIPOption): void
        
        requestOrderPayment<
            T extends RequestOrderPaymentOption = RequestOrderPaymentOption
        >(
            args: T
        ): PromisifySuccessResult<T, RequestOrderPaymentOption>
        
        requestPayment<T extends RequestPaymentOption = RequestPaymentOption>(
            option: T
        ): PromisifySuccessResult<T, RequestPaymentOption>
        
        requestPluginPayment(option: RequestPluginPaymentOption): void
        
        requestSubscribeDeviceMessage<
            T extends RequestSubscribeDeviceMessageOption = RequestSubscribeDeviceMessageOption
        >(
            option: T
        ): PromisifySuccessResult<T, RequestSubscribeDeviceMessageOption>
        
        requestSubscribeMessage<
            T extends RequestSubscribeMessageOption = RequestSubscribeMessageOption
        >(
            option: T
        ): PromisifySuccessResult<T, RequestSubscribeMessageOption>
        
        requestVirtualPayment(option: RequestVirtualPaymentOption): void
        
        requirePrivacyAuthorize(option: RequirePrivacyAuthorizeOption): void
        
        reserveChannelsLive(option: ReserveChannelsLiveOption): void
        
        restartMiniProgram(option: RestartMiniProgramOption): void
        
        revokeBufferURL(
            
            url: string
        ): void
        
        saveFileToDisk(option: SaveFileToDiskOption): void
        
        saveImageToPhotosAlbum<
            T extends SaveImageToPhotosAlbumOption = SaveImageToPhotosAlbumOption
        >(
            option: T
        ): PromisifySuccessResult<T, SaveImageToPhotosAlbumOption>
        
        saveVideoToPhotosAlbum<
            T extends SaveVideoToPhotosAlbumOption = SaveVideoToPhotosAlbumOption
        >(
            option: T
        ): PromisifySuccessResult<T, SaveVideoToPhotosAlbumOption>
        
        scanCode<T extends ScanCodeOption = ScanCodeOption>(
            option: T
        ): PromisifySuccessResult<T, ScanCodeOption>
        
        seekBackgroundAudio<
            T extends SeekBackgroundAudioOption = SeekBackgroundAudioOption
        >(
            option: T
        ): PromisifySuccessResult<T, SeekBackgroundAudioOption>
        
        sendHCEMessage<T extends SendHCEMessageOption = SendHCEMessageOption>(
            option: T
        ): PromisifySuccessResult<T, SendHCEMessageOption>
        
        sendSms(option: SendSmsOption): void
        
        sendSocketMessage<
            T extends SendSocketMessageOption = SendSocketMessageOption
        >(
            option: T
        ): PromisifySuccessResult<T, SendSocketMessageOption>
        
        setBLEMTU<T extends SetBLEMTUOption = SetBLEMTUOption>(
            option: T
        ): PromisifySuccessResult<T, SetBLEMTUOption>
        
        setBackgroundColor<
            T extends SetBackgroundColorOption = SetBackgroundColorOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetBackgroundColorOption>
        
        setBackgroundFetchToken<
            T extends SetBackgroundFetchTokenOption = SetBackgroundFetchTokenOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetBackgroundFetchTokenOption>
        
        setBackgroundTextStyle<
            T extends SetBackgroundTextStyleOption = SetBackgroundTextStyleOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetBackgroundTextStyleOption>
        
        setClipboardData<
            T extends SetClipboardDataOption = SetClipboardDataOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetClipboardDataOption>
        
        setEnable1v1Chat(option: SetEnable1v1ChatOption): void
        
        setEnableDebug<T extends SetEnableDebugOption = SetEnableDebugOption>(
            option: T
        ): PromisifySuccessResult<T, SetEnableDebugOption>
        
        setInnerAudioOption<
            T extends SetInnerAudioOption = SetInnerAudioOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetInnerAudioOption>
        
        setKeepScreenOn<
            T extends SetKeepScreenOnOption = SetKeepScreenOnOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetKeepScreenOnOption>
        
        setNavigationBarColor<
            T extends SetNavigationBarColorOption = SetNavigationBarColorOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetNavigationBarColorOption>
        
        setNavigationBarTitle<
            T extends SetNavigationBarTitleOption = SetNavigationBarTitleOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetNavigationBarTitleOption>
        
        setScreenBrightness<
            T extends SetScreenBrightnessOption = SetScreenBrightnessOption
        >(
            option: T
        ): PromisifySuccessResult<T, SetScreenBrightnessOption>
        
        setStorage<
            T = any,
            U extends SetStorageOption<T> = SetStorageOption<T>
        >(
            option: U
        ): PromisifySuccessResult<U, SetStorageOption<T>>
        
        setStorageSync<T = any>(
            
            key: string,
            
            data: T
        ): void
        
        setTabBarBadge<T extends SetTabBarBadgeOption = SetTabBarBadgeOption>(
            option: T
        ): PromisifySuccessResult<T, SetTabBarBadgeOption>
        
        setTabBarItem<T extends SetTabBarItemOption = SetTabBarItemOption>(
            option: T
        ): PromisifySuccessResult<T, SetTabBarItemOption>
        
        setTabBarStyle<T extends SetTabBarStyleOption = SetTabBarStyleOption>(
            option?: T
        ): PromisifySuccessResult<T, SetTabBarStyleOption>
        
        setTopBarText<T extends SetTopBarTextOption = SetTopBarTextOption>(
            option: T
        ): PromisifySuccessResult<T, SetTopBarTextOption>
        
        setVisualEffectOnCapture(option: SetVisualEffectOnCaptureOption): void
        
        setWifiList<T extends SetWifiListOption = SetWifiListOption>(
            option: T
        ): PromisifySuccessResult<T, SetWifiListOption>
        
        setWindowSize(option: SetWindowSizeOption): void
        
        shareFileMessage<
            T extends ShareFileMessageOption = ShareFileMessageOption
        >(
            option: T
        ): PromisifySuccessResult<T, ShareFileMessageOption>
        
        shareToWeRun<T extends ShareToWeRunOption = ShareToWeRunOption>(
            option: T
        ): PromisifySuccessResult<T, ShareToWeRunOption>
        
        shareVideoMessage<
            T extends ShareVideoMessageOption = ShareVideoMessageOption
        >(
            option: T
        ): PromisifySuccessResult<T, ShareVideoMessageOption>
        
        showActionSheet<
            T extends ShowActionSheetOption = ShowActionSheetOption
        >(
            option: T
        ): PromisifySuccessResult<T, ShowActionSheetOption>
        
        showLoading<T extends ShowLoadingOption = ShowLoadingOption>(
            option: T
        ): PromisifySuccessResult<T, ShowLoadingOption>
        
        showModal<T extends ShowModalOption = ShowModalOption>(
            option: T
        ): PromisifySuccessResult<T, ShowModalOption>
        
        showNavigationBarLoading<
            T extends ShowNavigationBarLoadingOption = ShowNavigationBarLoadingOption
        >(
            option?: T
        ): PromisifySuccessResult<T, ShowNavigationBarLoadingOption>
        
        showRedPackage<T extends ShowRedPackageOption = ShowRedPackageOption>(
            option: T
        ): PromisifySuccessResult<T, ShowRedPackageOption>
        
        showShareImageMenu<
            T extends ShowShareImageMenuOption = ShowShareImageMenuOption
        >(
            option: T
        ): PromisifySuccessResult<T, ShowShareImageMenuOption>
        
        showShareMenu<T extends ShowShareMenuOption = ShowShareMenuOption>(
            option: T
        ): PromisifySuccessResult<T, ShowShareMenuOption>
        
        showTabBar<T extends ShowTabBarOption = ShowTabBarOption>(
            option: T
        ): PromisifySuccessResult<T, ShowTabBarOption>
        
        showTabBarRedDot<
            T extends ShowTabBarRedDotOption = ShowTabBarRedDotOption
        >(
            option: T
        ): PromisifySuccessResult<T, ShowTabBarRedDotOption>
        
        showToast<T extends ShowToastOption = ShowToastOption>(
            option: T
        ): PromisifySuccessResult<T, ShowToastOption>
        
        startAccelerometer<
            T extends StartAccelerometerOption = StartAccelerometerOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StartAccelerometerOption>
        
        startBeaconDiscovery<
            T extends StartBeaconDiscoveryOption = StartBeaconDiscoveryOption
        >(
            option: T
        ): PromisifySuccessResult<T, StartBeaconDiscoveryOption>
        
        startBluetoothDevicesDiscovery<
            T extends StartBluetoothDevicesDiscoveryOption = StartBluetoothDevicesDiscoveryOption
        >(
            option: T
        ): PromisifySuccessResult<T, StartBluetoothDevicesDiscoveryOption>
        
        startCompass<T extends StartCompassOption = StartCompassOption>(
            option?: T
        ): PromisifySuccessResult<T, StartCompassOption>
        
        startDeviceMotionListening<
            T extends StartDeviceMotionListeningOption = StartDeviceMotionListeningOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StartDeviceMotionListeningOption>
        
        startGyroscope<T extends StartGyroscopeOption = StartGyroscopeOption>(
            option?: T
        ): PromisifySuccessResult<T, StartGyroscopeOption>
        
        startHCE<T extends StartHCEOption = StartHCEOption>(
            option: T
        ): PromisifySuccessResult<T, StartHCEOption>
        
        startLocalServiceDiscovery<
            T extends StartLocalServiceDiscoveryOption = StartLocalServiceDiscoveryOption
        >(
            option: T
        ): PromisifySuccessResult<T, StartLocalServiceDiscoveryOption>
        
        startLocationUpdateBackground<
            T extends StartLocationUpdateBackgroundOption = StartLocationUpdateBackgroundOption
        >(
            option: T
        ): PromisifySuccessResult<T, StartLocationUpdateBackgroundOption>
        
        startPullDownRefresh<
            T extends StartPullDownRefreshOption = StartPullDownRefreshOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StartPullDownRefreshOption>
        
        startRecord<T extends WxStartRecordOption = WxStartRecordOption>(
            option?: T
        ): PromisifySuccessResult<T, WxStartRecordOption>
        
        startSoterAuthentication<
            T extends StartSoterAuthenticationOption = StartSoterAuthenticationOption
        >(
            option: T
        ): PromisifySuccessResult<T, StartSoterAuthenticationOption>
        
        startWifi<T extends StartWifiOption = StartWifiOption>(
            option?: T
        ): PromisifySuccessResult<T, StartWifiOption>
        
        stopAccelerometer<
            T extends StopAccelerometerOption = StopAccelerometerOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopAccelerometerOption>
        
        stopBackgroundAudio<
            T extends StopBackgroundAudioOption = StopBackgroundAudioOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopBackgroundAudioOption>
        
        stopBeaconDiscovery<
            T extends StopBeaconDiscoveryOption = StopBeaconDiscoveryOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopBeaconDiscoveryOption>
        
        stopBluetoothDevicesDiscovery<
            T extends StopBluetoothDevicesDiscoveryOption = StopBluetoothDevicesDiscoveryOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopBluetoothDevicesDiscoveryOption>
        
        stopCompass<T extends StopCompassOption = StopCompassOption>(
            option?: T
        ): PromisifySuccessResult<T, StopCompassOption>
        
        stopDeviceMotionListening<
            T extends StopDeviceMotionListeningOption = StopDeviceMotionListeningOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopDeviceMotionListeningOption>
        
        stopFaceDetect(option?: StopFaceDetectOption): void
        
        stopGyroscope<T extends StopGyroscopeOption = StopGyroscopeOption>(
            option?: T
        ): PromisifySuccessResult<T, StopGyroscopeOption>
        
        stopHCE<T extends StopHCEOption = StopHCEOption>(
            option?: T
        ): PromisifySuccessResult<T, StopHCEOption>
        
        stopLocalServiceDiscovery<
            T extends StopLocalServiceDiscoveryOption = StopLocalServiceDiscoveryOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopLocalServiceDiscoveryOption>
        
        stopLocationUpdate<
            T extends StopLocationUpdateOption = StopLocationUpdateOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopLocationUpdateOption>
        
        stopPullDownRefresh<
            T extends StopPullDownRefreshOption = StopPullDownRefreshOption
        >(
            option?: T
        ): PromisifySuccessResult<T, StopPullDownRefreshOption>
        
        stopRecord<T extends WxStopRecordOption = WxStopRecordOption>(
            option?: T
        ): PromisifySuccessResult<T, WxStopRecordOption>
        
        stopVoice<T extends StopVoiceOption = StopVoiceOption>(
            option?: T
        ): PromisifySuccessResult<T, StopVoiceOption>
        
        stopWifi<T extends StopWifiOption = StopWifiOption>(
            option?: T
        ): PromisifySuccessResult<T, StopWifiOption>
        
        subscribeVoIPVideoMembers<
            T extends SubscribeVoIPVideoMembersOption = SubscribeVoIPVideoMembersOption
        >(
            option: T
        ): PromisifySuccessResult<T, SubscribeVoIPVideoMembersOption>
        
        switchTab<T extends SwitchTabOption = SwitchTabOption>(
            option: T
        ): PromisifySuccessResult<T, SwitchTabOption>
        
        updateShareMenu<
            T extends UpdateShareMenuOption = UpdateShareMenuOption
        >(
            option: T
        ): PromisifySuccessResult<T, UpdateShareMenuOption>
        
        updateVoIPChatMuteConfig<
            T extends UpdateVoIPChatMuteConfigOption = UpdateVoIPChatMuteConfigOption
        >(
            option: T
        ): PromisifySuccessResult<T, UpdateVoIPChatMuteConfigOption>
        
        updateWeChatApp<
            T extends UpdateWeChatAppOption = UpdateWeChatAppOption
        >(
            option?: T
        ): PromisifySuccessResult<T, UpdateWeChatAppOption>
        
        vibrateLong<T extends VibrateLongOption = VibrateLongOption>(
            option?: T
        ): PromisifySuccessResult<T, VibrateLongOption>
        
        vibrateShort<T extends VibrateShortOption = VibrateShortOption>(
            option: T
        ): PromisifySuccessResult<T, VibrateShortOption>
        
        writeBLECharacteristicValue<
            T extends WriteBLECharacteristicValueOption = WriteBLECharacteristicValueOption
        >(
            option: T
        ): PromisifySuccessResult<T, WriteBLECharacteristicValueOption>
        
        cloud: WxCloud
        
        env: { USER_DATA_PATH: string }
        
        getXrFrameSystem(): import('XrFrame').IXrFrameSystem
        
        router: Router
        
        worklet: Worklet
    }

    
    type AccessCompleteCallback = (res: FileError) => void
    
    type AccessFailCallback = (res: FileError) => void
    
    type AccessSuccessCallback = (res: FileError) => void
    
    type AddArcCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddArcFailCallback = (res: GeneralCallbackResult) => void
    
    type AddArcSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddCardCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddCardFailCallback = (res: GeneralCallbackResult) => void
    
    type AddCardSuccessCallback = (result: AddCardSuccessCallbackResult) => void
    
    type AddCustomLayerCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddCustomLayerFailCallback = (res: GeneralCallbackResult) => void
    
    type AddCustomLayerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddFileToFavoritesCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddFileToFavoritesFailCallback = (res: GeneralCallbackResult) => void
    
    type AddFileToFavoritesSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddGroundOverlayCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddGroundOverlayFailCallback = (res: GeneralCallbackResult) => void
    
    type AddGroundOverlaySuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddMarkersCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddMarkersFailCallback = (res: GeneralCallbackResult) => void
    
    type AddMarkersSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneCalendarCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneCalendarFailCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneCalendarSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneContactCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneContactFailCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneContactSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddPhoneRepeatCalendarCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddPhoneRepeatCalendarFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddPhoneRepeatCalendarSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddServiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddServiceFailCallback = (res: GeneralCallbackResult) => void
    
    type AddServiceSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AddVideoToFavoritesCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddVideoToFavoritesFailCallback = (res: GeneralCallbackResult) => void
    
    type AddVideoToFavoritesSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AddVisualLayerCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AddVisualLayerFailCallback = (res: GeneralCallbackResult) => void
    
    type AddVisualLayerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AppendFileCompleteCallback = (res: FileError) => void
    
    type AppendFileFailCallback = (res: FileError) => void
    
    type AppendFileSuccessCallback = (res: FileError) => void
    
    type ApplyBlusherStickMakeupCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyBlusherStickMakeupFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyBlusherStickMakeupSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyEyeBrowMakeupCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyEyeBrowMakeupFailCallback = (res: GeneralCallbackResult) => void
    
    type ApplyEyeBrowMakeupSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyEyeShadowMakeupCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyEyeShadowMakeupFailCallback = (res: GeneralCallbackResult) => void
    
    type ApplyEyeShadowMakeupSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyFaceContourMakeupCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyFaceContourMakeupFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyFaceContourMakeupSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyFilterCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ApplyFilterFailCallback = (res: GeneralCallbackResult) => void
    
    type ApplyFilterSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ApplyLipStickMakeupCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyLipStickMakeupFailCallback = (res: GeneralCallbackResult) => void
    
    type ApplyLipStickMakeupSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ApplyStickerCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ApplyStickerFailCallback = (res: GeneralCallbackResult) => void
    
    type ApplyStickerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type AuthPrivateMessageCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AuthPrivateMessageFailCallback = (res: GeneralCallbackResult) => void
    
    type AuthPrivateMessageSuccessCallback = (
        result: AuthPrivateMessageSuccessCallbackResult
    ) => void
    
    type AuthorizeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type AuthorizeFailCallback = (res: GeneralCallbackResult) => void
    
    type AuthorizeForMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AuthorizeForMiniProgramFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AuthorizeForMiniProgramSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type AuthorizeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type BackgroundAudioManagerOnErrorCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type BatchGetStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type BatchGetStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type BatchGetStorageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type BatchSetStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type BatchSetStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type BatchSetStorageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type BlurCompleteCallback = (res: GeneralCallbackResult) => void
    
    type BlurFailCallback = (res: GeneralCallbackResult) => void
    
    type BlurSuccessCallback = (res: GeneralCallbackResult) => void
    
    type BoundingClientRectCallback = (
        result: BoundingClientRectCallbackResult
    ) => void
    
    type CameraContextSetZoomSuccessCallback = (
        result: SetZoomSuccessCallbackResult
    ) => void
    
    type CameraContextStartRecordSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CameraContextStopRecordSuccessCallback = (
        result: StopRecordSuccessCallbackResult
    ) => void
    
    type CanvasGetImageDataCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CanvasGetImageDataFailCallback = (res: GeneralCallbackResult) => void
    
    type CanvasGetImageDataSuccessCallback = (
        result: CanvasGetImageDataSuccessCallbackResult
    ) => void
    
    type CanvasPutImageDataCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CanvasPutImageDataFailCallback = (res: GeneralCallbackResult) => void
    
    type CanvasPutImageDataSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CanvasToTempFilePathCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CanvasToTempFilePathFailCallback = (res: GeneralCallbackResult) => void
    
    type CanvasToTempFilePathSuccessCallback = (
        result: CanvasToTempFilePathSuccessCallbackResult
    ) => void
    
    type CheckIsAddedToMyMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsAddedToMyMiniProgramFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsAddedToMyMiniProgramSuccessCallback = (
        result: CheckIsAddedToMyMiniProgramSuccessCallbackResult
    ) => void
    
    type CheckIsOpenAccessibilityCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsOpenAccessibilityFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsOpenAccessibilitySuccessCallback = (
        option: CheckIsOpenAccessibilitySuccessCallbackOption
    ) => void
    
    type CheckIsSoterEnrolledInDeviceCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsSoterEnrolledInDeviceFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsSoterEnrolledInDeviceSuccessCallback = (
        result: CheckIsSoterEnrolledInDeviceSuccessCallbackResult
    ) => void
    
    type CheckIsSupportSoterAuthenticationCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsSupportSoterAuthenticationFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CheckIsSupportSoterAuthenticationSuccessCallback = (
        result: CheckIsSupportSoterAuthenticationSuccessCallbackResult
    ) => void
    
    type CheckSessionCompleteCallback = (res: GeneralCallbackResult) => void
    
    type CheckSessionFailCallback = (res: GeneralCallbackResult) => void
    
    type CheckSessionSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ChooseAddressCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseAddressFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseAddressSuccessCallback = (
        result: ChooseAddressSuccessCallbackResult
    ) => void
    
    type ChooseContactCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseContactFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseContactSuccessCallback = (
        option: ChooseContactSuccessCallbackOption
    ) => void
    
    type ChooseImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseImageFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseImageSuccessCallback = (
        result: ChooseImageSuccessCallbackResult
    ) => void
    
    type ChooseInvoiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseInvoiceFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseInvoiceSuccessCallback = (
        result: ChooseInvoiceSuccessCallbackResult
    ) => void
    
    type ChooseInvoiceTitleCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ChooseInvoiceTitleFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseInvoiceTitleSuccessCallback = (
        result: ChooseInvoiceTitleSuccessCallbackResult
    ) => void
    
    type ChooseLicensePlateCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ChooseLicensePlateFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseLicensePlateSuccessCallback = (
        result: ChooseLicensePlateSuccessCallbackResult
    ) => void
    
    type ChooseLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseLocationSuccessCallback = (
        result: ChooseLocationSuccessCallbackResult
    ) => void
    
    type ChooseMediaCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseMediaFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseMediaSuccessCallback = (
        result: ChooseMediaSuccessCallbackResult
    ) => void
    
    type ChooseMessageFileCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ChooseMessageFileFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseMessageFileSuccessCallback = (
        result: ChooseMessageFileSuccessCallbackResult
    ) => void
    
    type ChoosePoiCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChoosePoiFailCallback = (res: GeneralCallbackResult) => void
    
    type ChoosePoiSuccessCallback = (
        result: ChoosePoiSuccessCallbackResult
    ) => void
    
    type ChooseVideoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ChooseVideoFailCallback = (res: GeneralCallbackResult) => void
    
    type ChooseVideoSuccessCallback = (
        result: ChooseVideoSuccessCallbackResult
    ) => void
    
    type ClearCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ClearFailCallback = (res: GeneralCallbackResult) => void
    
    type ClearFiltersCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ClearFiltersFailCallback = (res: GeneralCallbackResult) => void
    
    type ClearFiltersSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ClearMakeupsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ClearMakeupsFailCallback = (res: GeneralCallbackResult) => void
    
    type ClearMakeupsSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ClearStickersCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ClearStickersFailCallback = (res: GeneralCallbackResult) => void
    
    type ClearStickersSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ClearStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ClearStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type ClearStorageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ClearSuccessCallback = (res: GeneralCallbackResult) => void
    
    type CloseBLEConnectionCompleteCallback = (res: BluetoothError) => void
    
    type CloseBLEConnectionFailCallback = (res: BluetoothError) => void
    
    type CloseBLEConnectionSuccessCallback = (res: BluetoothError) => void
    
    type CloseBluetoothAdapterCompleteCallback = (res: BluetoothError) => void
    
    type CloseBluetoothAdapterFailCallback = (res: BluetoothError) => void
    
    type CloseBluetoothAdapterSuccessCallback = (res: BluetoothError) => void
    
    type CloseSocketCompleteCallback = (res: GeneralCallbackResult) => void
    
    type CloseSocketFailCallback = (res: GeneralCallbackResult) => void
    
    type CloseSocketSuccessCallback = (res: GeneralCallbackResult) => void
    
    type CompressImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type CompressImageFailCallback = (res: GeneralCallbackResult) => void
    
    type CompressImageSuccessCallback = (
        result: CompressImageSuccessCallbackResult
    ) => void
    
    type CompressVideoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type CompressVideoFailCallback = (res: GeneralCallbackResult) => void
    
    type CompressVideoSuccessCallback = (
        result: CompressVideoSuccessCallbackResult
    ) => void
    
    type ConnectCompleteCallback = (res: Nfcrwerror) => void
    
    type ConnectFailCallback = (res: Nfcrwerror) => void
    
    type ConnectSocketCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ConnectSocketFailCallback = (res: GeneralCallbackResult) => void
    
    type ConnectSocketSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ConnectSuccessCallback = (res: Nfcrwerror) => void
    
    type ConnectWifiCompleteCallback = (res: WifiError) => void
    
    type ConnectWifiFailCallback = (res: WifiError) => void
    
    type ConnectWifiSuccessCallback = (res: WifiError) => void
    
    type ContextCallback = (result: ContextCallbackResult) => void
    
    type CopyFileCompleteCallback = (res: FileError) => void
    
    type CopyFileFailCallback = (res: FileError) => void
    
    type CopyFileSuccessCallback = (res: FileError) => void
    
    type CreateBLEConnectionCompleteCallback = (res: BluetoothError) => void
    
    type CreateBLEConnectionFailCallback = (res: BluetoothError) => void
    
    type CreateBLEConnectionSuccessCallback = (res: BluetoothError) => void
    
    type CreateBLEPeripheralServerCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CreateBLEPeripheralServerFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type CreateBLEPeripheralServerSuccessCallback = (
        result: CreateBLEPeripheralServerSuccessCallbackResult
    ) => void
    
    type CropImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type CropImageFailCallback = (res: GeneralCallbackResult) => void
    
    type CropImageSuccessCallback = (
        result: CropImageSuccessCallbackResult
    ) => void
    
    type CustomRendererFrameEventCallback = (
        result: OnCustomRendererEventCallbackResult
    ) => void
    
    type CustomRouteBuilder = (
        
        customRouteContext: CustomRouteContext
    ) => CustomRouteConfig
    
    type DisableAlertBeforeUnloadCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type DisableAlertBeforeUnloadFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type DisableAlertBeforeUnloadSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type DownloadFileCompleteCallback = (res: GeneralCallbackResult) => void
    
    type DownloadFileFailCallback = (res: GeneralCallbackResult) => void
    
    type DownloadFileSuccessCallback = (
        result: DownloadFileSuccessCallbackResult
    ) => void
    
    type DownloadTaskOffHeadersReceivedCallback = (
        result: DownloadTaskOnHeadersReceivedListenerResult
    ) => void
    
    type DownloadTaskOffProgressUpdateCallback = (
        result: DownloadTaskOnProgressUpdateListenerResult
    ) => void
    
    type DownloadTaskOnHeadersReceivedCallback = (
        result: DownloadTaskOnHeadersReceivedListenerResult
    ) => void
    
    type DownloadTaskOnProgressUpdateCallback = (
        result: DownloadTaskOnProgressUpdateListenerResult
    ) => void
    
    type EditImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type EditImageFailCallback = (res: GeneralCallbackResult) => void
    
    type EditImageSuccessCallback = (
        result: CropImageSuccessCallbackResult
    ) => void
    
    type EnableAlertBeforeUnloadCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type EnableAlertBeforeUnloadFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type EnableAlertBeforeUnloadSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type EraseLinesCompleteCallback = (res: GeneralCallbackResult) => void
    
    type EraseLinesFailCallback = (res: GeneralCallbackResult) => void
    
    type EraseLinesSuccessCallback = (res: GeneralCallbackResult) => void
    
    type EventCallback = (
        
        ...args: any
    ) => void
    
    type ExecuteVisualLayerCommandCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ExecuteVisualLayerCommandFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ExecuteVisualLayerCommandSuccessCallback = (
        result: ExecuteVisualLayerCommandSuccessCallbackResult
    ) => void
    
    type ExitCastingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ExitCastingFailCallback = (res: GeneralCallbackResult) => void
    
    type ExitCastingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ExitFullScreenCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ExitFullScreenFailCallback = (res: GeneralCallbackResult) => void
    
    type ExitFullScreenSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ExitMiniProgramCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ExitMiniProgramFailCallback = (res: GeneralCallbackResult) => void
    
    type ExitMiniProgramSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ExitPictureInPictureCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ExitPictureInPictureFailCallback = (res: GeneralCallbackResult) => void
    
    type ExitPictureInPictureSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ExitVoIPChatCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ExitVoIPChatFailCallback = (res: GeneralCallbackResult) => void
    
    type ExitVoIPChatSuccessCallback = (res: GeneralCallbackResult) => void
    
    type FaceDetectCompleteCallback = (res: GeneralCallbackResult) => void
    
    type FaceDetectFailCallback = (res: GeneralCallbackResult) => void
    
    type FaceDetectSuccessCallback = (
        result: FaceDetectSuccessCallbackResult
    ) => void
    
    type FieldsCallback = (
        
        res: IAnyObject
    ) => void
    
    type FileSystemManagerCloseCompleteCallback = (res: FileError) => void
    
    type FileSystemManagerCloseFailCallback = (res: FileError) => void
    
    type FileSystemManagerCloseSuccessCallback = (res: FileError) => void
    
    type FromScreenLocationCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type FromScreenLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type FromScreenLocationSuccessCallback = (
        result: GetCenterLocationSuccessCallbackResult
    ) => void
    
    type FstatCompleteCallback = (res: FileError) => void
    
    type FstatFailCallback = (res: FileError) => void
    
    type FstatSuccessCallback = (result: FstatSuccessCallbackResult) => void
    
    type FtruncateCompleteCallback = (res: FileError) => void
    
    type FtruncateFailCallback = (res: FileError) => void
    
    type FtruncateSuccessCallback = (res: FileError) => void
    
    type GetAtqaCompleteCallback = (res: Nfcrwerror) => void
    
    type GetAtqaFailCallback = (res: Nfcrwerror) => void
    
    type GetAtqaSuccessCallback = (result: GetAtqaSuccessCallbackResult) => void
    
    type GetAvailableAudioSourcesCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetAvailableAudioSourcesFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetAvailableAudioSourcesSuccessCallback = (
        result: GetAvailableAudioSourcesSuccessCallbackResult
    ) => void
    
    type GetBLEDeviceCharacteristicsCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type GetBLEDeviceCharacteristicsFailCallback = (res: BluetoothError) => void
    
    type GetBLEDeviceCharacteristicsSuccessCallback = (
        result: GetBLEDeviceCharacteristicsSuccessCallbackResult
    ) => void
    
    type GetBLEDeviceRSSICompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetBLEDeviceRSSIFailCallback = (res: GeneralCallbackResult) => void
    
    type GetBLEDeviceRSSISuccessCallback = (
        result: GetBLEDeviceRSSISuccessCallbackResult
    ) => void
    
    type GetBLEDeviceServicesCompleteCallback = (res: BluetoothError) => void
    
    type GetBLEDeviceServicesFailCallback = (res: BluetoothError) => void
    
    type GetBLEDeviceServicesSuccessCallback = (
        result: GetBLEDeviceServicesSuccessCallbackResult
    ) => void
    
    type GetBLEMTUCompleteCallback = (res: BluetoothError) => void
    
    type GetBLEMTUFailCallback = (res: BluetoothError) => void
    
    type GetBLEMTUSuccessCallback = (
        result: GetBLEMTUSuccessCallbackResult
    ) => void
    
    type GetBackgroundAudioPlayerStateCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundAudioPlayerStateFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundAudioPlayerStateSuccessCallback = (
        result: GetBackgroundAudioPlayerStateSuccessCallbackResult
    ) => void
    
    type GetBackgroundFetchDataCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundFetchDataFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundFetchDataSuccessCallback = (
        result: GetBackgroundFetchDataSuccessCallbackResult
    ) => void
    
    type GetBackgroundFetchTokenCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundFetchTokenFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetBackgroundFetchTokenSuccessCallback = (
        result: GetBackgroundFetchTokenSuccessCallbackResult
    ) => void
    
    type GetBatteryInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetBatteryInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetBatteryInfoSuccessCallback = (
        result: GetBatteryInfoSuccessCallbackResult
    ) => void
    
    type GetBeaconsCompleteCallback = (res: BeaconError) => void
    
    type GetBeaconsFailCallback = (res: BeaconError) => void
    
    type GetBeaconsSuccessCallback = (
        result: GetBeaconsSuccessCallbackResult
    ) => void
    
    type GetBluetoothAdapterStateCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type GetBluetoothAdapterStateFailCallback = (res: BluetoothError) => void
    
    type GetBluetoothAdapterStateSuccessCallback = (
        result: GetBluetoothAdapterStateSuccessCallbackResult
    ) => void
    
    type GetBluetoothDevicesCompleteCallback = (res: BluetoothError) => void
    
    type GetBluetoothDevicesFailCallback = (res: BluetoothError) => void
    
    type GetBluetoothDevicesSuccessCallback = (
        result: GetBluetoothDevicesSuccessCallbackResult
    ) => void
    
    type GetCenterLocationCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetCenterLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type GetCenterLocationSuccessCallback = (
        result: GetCenterLocationSuccessCallbackResult
    ) => void
    
    type GetChannelsLiveInfoCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetChannelsLiveInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetChannelsLiveInfoSuccessCallback = (
        result: GetChannelsLiveInfoSuccessCallbackResult
    ) => void
    
    type GetChannelsLiveNoticeInfoCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetChannelsLiveNoticeInfoFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetChannelsLiveNoticeInfoSuccessCallback = (
        result: GetChannelsLiveNoticeInfoSuccessCallbackResult
    ) => void
    
    type GetChannelsShareKeyCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetChannelsShareKeyFailCallback = (res: GeneralCallbackResult) => void
    
    type GetChannelsShareKeySuccessCallback = (
        result: GetChannelsShareKeySuccessCallbackResult
    ) => void
    
    type GetClipboardDataCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetClipboardDataFailCallback = (res: GeneralCallbackResult) => void
    
    type GetClipboardDataSuccessCallback = (
        option: GetClipboardDataSuccessCallbackOption
    ) => void
    
    type GetCommonConfigCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetCommonConfigFailCallback = (res: GeneralCallbackResult) => void
    
    type GetCommonConfigSuccessCallback = (
        result: GetCommonConfigSuccessCallbackResult
    ) => void
    
    type GetConnectedBluetoothDevicesCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type GetConnectedBluetoothDevicesFailCallback = (
        res: BluetoothError
    ) => void
    
    type GetConnectedBluetoothDevicesSuccessCallback = (
        result: GetConnectedBluetoothDevicesSuccessCallbackResult
    ) => void
    
    type GetConnectedWifiCompleteCallback = (res: WifiError) => void
    
    type GetConnectedWifiFailCallback = (res: WifiError) => void
    
    type GetConnectedWifiSuccessCallback = (
        result: GetConnectedWifiSuccessCallbackResult
    ) => void
    
    type GetContentsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetContentsFailCallback = (res: GeneralCallbackResult) => void
    
    type GetContentsSuccessCallback = (
        result: GetContentsSuccessCallbackResult
    ) => void
    
    type GetDeviceVoIPListCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetDeviceVoIPListFailCallback = (res: GeneralCallbackResult) => void
    
    type GetDeviceVoIPListSuccessCallback = (
        result: GetDeviceVoIPListSuccessCallbackResult
    ) => void
    
    type GetExtConfigCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetExtConfigFailCallback = (res: GeneralCallbackResult) => void
    
    type GetExtConfigSuccessCallback = (
        result: GetExtConfigSuccessCallbackResult
    ) => void
    
    type GetFileInfoCompleteCallback = (res: FileError) => void
    
    type GetFileInfoFailCallback = (res: FileError) => void
    
    type GetFileInfoSuccessCallback = (
        result: GetFileInfoSuccessCallbackResult
    ) => void
    
    type GetFuzzyLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetFuzzyLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type GetFuzzyLocationSuccessCallback = (
        result: GetFuzzyLocationSuccessCallbackResult
    ) => void
    
    type GetGroupEnterInfoCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetGroupEnterInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetGroupEnterInfoSuccessCallback = (
        result: GetGroupEnterInfoSuccessCallbackResult
    ) => void
    
    type GetHCEStateCompleteCallback = (res: NFCError) => void
    
    type GetHCEStateFailCallback = (res: NFCError) => void
    
    type GetHCEStateSuccessCallback = (res: NFCError) => void
    
    type GetHistoricalBytesCompleteCallback = (res: Nfcrwerror) => void
    
    type GetHistoricalBytesFailCallback = (res: Nfcrwerror) => void
    
    type GetHistoricalBytesSuccessCallback = (
        result: GetHistoricalBytesSuccessCallbackResult
    ) => void
    
    type GetImageInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetImageInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetImageInfoSuccessCallback = (
        result: GetImageInfoSuccessCallbackResult
    ) => void
    
    type GetInferenceEnvInfoCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetInferenceEnvInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetInferenceEnvInfoSuccessCallback = (
        result: GetInferenceEnvInfoSuccessCallbackResult
    ) => void
    
    type GetLatestUserKeyCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetLatestUserKeyFailCallback = (res: GeneralCallbackResult) => void
    
    type GetLatestUserKeySuccessCallback = (
        result: GetLatestUserKeySuccessCallbackResult
    ) => void
    
    type GetLocalIPAddressCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetLocalIPAddressFailCallback = (res: GeneralCallbackResult) => void
    
    type GetLocalIPAddressSuccessCallback = (
        result: GetLocalIPAddressSuccessCallbackResult
    ) => void
    
    type GetLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type GetLocationSuccessCallback = (
        result: GetLocationSuccessCallbackResult
    ) => void
    
    type GetMaxTransceiveLengthCompleteCallback = (res: Nfcrwerror) => void
    
    type GetMaxTransceiveLengthFailCallback = (res: Nfcrwerror) => void
    
    type GetMaxTransceiveLengthSuccessCallback = (
        result: GetMaxTransceiveLengthSuccessCallbackResult
    ) => void
    
    type GetMaxZoomCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetMaxZoomFailCallback = (res: GeneralCallbackResult) => void
    
    type GetMaxZoomSuccessCallback = (
        result: GetMaxZoomSuccessCallbackResult
    ) => void
    
    type GetNetworkTypeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetNetworkTypeFailCallback = (res: GeneralCallbackResult) => void
    
    type GetNetworkTypeSuccessCallback = (
        result: GetNetworkTypeSuccessCallbackResult
    ) => void
    
    type GetPrivacySettingCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetPrivacySettingFailCallback = (res: GeneralCallbackResult) => void
    
    type GetPrivacySettingSuccessCallback = (
        result: GetPrivacySettingSuccessCallbackResult
    ) => void
    
    type GetRandomValuesCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetRandomValuesFailCallback = (res: GeneralCallbackResult) => void
    
    type GetRandomValuesSuccessCallback = (
        result: GetRandomValuesSuccessCallbackResult
    ) => void
    
    type GetRegionCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetRegionFailCallback = (res: GeneralCallbackResult) => void
    
    type GetRegionSuccessCallback = (
        result: GetRegionSuccessCallbackResult
    ) => void
    
    type GetRendererUserAgentCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetRendererUserAgentFailCallback = (res: GeneralCallbackResult) => void
    
    type GetRendererUserAgentSuccessCallback = (
        
        userAgent: string
    ) => void
    
    type GetRotateCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetRotateFailCallback = (res: GeneralCallbackResult) => void
    
    type GetRotateSuccessCallback = (
        result: GetRotateSuccessCallbackResult
    ) => void
    
    type GetSakCompleteCallback = (res: Nfcrwerror) => void
    
    type GetSakFailCallback = (res: Nfcrwerror) => void
    
    type GetSakSuccessCallback = (result: GetSakSuccessCallbackResult) => void
    
    type GetSavedFileListCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSavedFileListFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSavedFileListSuccessCallback = (
        result: GetSavedFileListSuccessCallbackResult
    ) => void
    
    type GetScaleCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetScaleFailCallback = (res: GeneralCallbackResult) => void
    
    type GetScaleSuccessCallback = (
        result: GetScaleSuccessCallbackResult
    ) => void
    
    type GetScreenBrightnessCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetScreenBrightnessFailCallback = (res: GeneralCallbackResult) => void
    
    type GetScreenBrightnessSuccessCallback = (
        option: GetScreenBrightnessSuccessCallbackOption
    ) => void
    
    type GetScreenRecordingStateCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetScreenRecordingStateFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetScreenRecordingStateSuccessCallback = (
        result: GetScreenRecordingStateSuccessCallbackResult
    ) => void
    
    type GetSelectedTextRangeCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetSelectedTextRangeFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSelectedTextRangeSuccessCallback = (
        result: GetSelectedTextRangeSuccessCallbackResult
    ) => void
    
    type GetSelectionTextCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSelectionTextFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSelectionTextSuccessCallback = (
        result: GetSelectionTextSuccessCallbackResult
    ) => void
    
    type GetSettingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSettingFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSettingSuccessCallback = (
        result: GetSettingSuccessCallbackResult
    ) => void
    
    type GetShareInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetShareInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetShareInfoSuccessCallback = (
        result: GetGroupEnterInfoSuccessCallbackResult
    ) => void
    
    type GetSkewCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSkewFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSkewSuccessCallback = (result: GetSkewSuccessCallbackResult) => void
    
    type GetSkylineInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSkylineInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSkylineInfoSuccessCallback = (
        
        result: SkylineInfo
    ) => void
    
    type GetStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type GetStorageInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetStorageInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetStorageInfoSuccessCallback = (
        option: GetStorageInfoSuccessCallbackOption
    ) => void
    
    type GetStorageSuccessCallback<T = any> = (
        result: GetStorageSuccessCallbackResult<T>
    ) => void
    
    type GetSystemInfoAsyncCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type GetSystemInfoAsyncFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSystemInfoAsyncSuccessCallback = (result: SystemInfo) => void
    
    type GetSystemInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetSystemInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetSystemInfoSuccessCallback = (result: SystemInfo) => void
    
    type GetUserInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetUserInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetUserInfoSuccessCallback = (
        result: GetUserInfoSuccessCallbackResult
    ) => void
    
    type GetUserProfileCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetUserProfileFailCallback = (res: GeneralCallbackResult) => void
    
    type GetUserProfileSuccessCallback = (
        result: GetUserProfileSuccessCallbackResult
    ) => void
    
    type GetVideoInfoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetVideoInfoFailCallback = (res: GeneralCallbackResult) => void
    
    type GetVideoInfoSuccessCallback = (
        result: GetVideoInfoSuccessCallbackResult
    ) => void
    
    type GetWeRunDataCompleteCallback = (res: GeneralCallbackResult) => void
    
    type GetWeRunDataFailCallback = (res: GeneralCallbackResult) => void
    
    type GetWeRunDataSuccessCallback = (
        result: GetWeRunDataSuccessCallbackResult
    ) => void
    
    type GetWifiListCompleteCallback = (res: WifiError) => void
    
    type GetWifiListFailCallback = (res: WifiError) => void
    
    type GetWifiListSuccessCallback = (res: WifiError) => void
    
    type HideHomeButtonCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideHomeButtonFailCallback = (res: GeneralCallbackResult) => void
    
    type HideHomeButtonSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideKeyboardCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideKeyboardFailCallback = (res: GeneralCallbackResult) => void
    
    type HideKeyboardSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideLoadingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideLoadingFailCallback = (res: GeneralCallbackResult) => void
    
    type HideLoadingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideNavigationBarLoadingCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type HideNavigationBarLoadingFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type HideNavigationBarLoadingSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type HideShareMenuCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideShareMenuFailCallback = (res: GeneralCallbackResult) => void
    
    type HideShareMenuSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarFailCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarRedDotCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarRedDotFailCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarRedDotSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideTabBarSuccessCallback = (res: GeneralCallbackResult) => void
    
    type HideToastCompleteCallback = (res: GeneralCallbackResult) => void
    
    type HideToastFailCallback = (res: GeneralCallbackResult) => void
    
    type HideToastSuccessCallback = (res: GeneralCallbackResult) => void
    
    type IncludePointsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type IncludePointsFailCallback = (res: GeneralCallbackResult) => void
    
    type IncludePointsSuccessCallback = (res: GeneralCallbackResult) => void
    
    type InitFaceDetectCompleteCallback = (res: GeneralCallbackResult) => void
    
    type InitFaceDetectFailCallback = (res: GeneralCallbackResult) => void
    
    type InitFaceDetectSuccessCallback = (res: GeneralCallbackResult) => void
    
    type InitMarkerClusterCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type InitMarkerClusterFailCallback = (res: GeneralCallbackResult) => void
    
    type InitMarkerClusterSuccessCallback = (res: GeneralCallbackResult) => void
    
    type InnerAudioContextOffErrorCallback = (
        result: InnerAudioContextOnErrorListenerResult
    ) => void
    
    type InnerAudioContextOnErrorCallback = (
        result: InnerAudioContextOnErrorListenerResult
    ) => void
    type InnerAudioContextOnStopCallback = (res: GeneralCallbackResult) => void
    
    type InsertDividerCompleteCallback = (res: GeneralCallbackResult) => void
    
    type InsertDividerFailCallback = (res: GeneralCallbackResult) => void
    
    type InsertDividerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type InsertImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type InsertImageFailCallback = (res: GeneralCallbackResult) => void
    
    type InsertImageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type InsertTextCompleteCallback = (res: GeneralCallbackResult) => void
    
    type InsertTextFailCallback = (res: GeneralCallbackResult) => void
    
    type InsertTextSuccessCallback = (res: GeneralCallbackResult) => void
    
    type IntersectionObserverObserveCallback = (
        result: IntersectionObserverObserveCallbackResult
    ) => void
    
    type InterstitialAdOffErrorCallback = (
        result: InterstitialAdOnErrorListenerResult
    ) => void
    
    type InterstitialAdOnErrorCallback = (
        result: InterstitialAdOnErrorListenerResult
    ) => void
    
    type IsBluetoothDevicePairedCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type IsBluetoothDevicePairedFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type IsBluetoothDevicePairedSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type IsConnectedCompleteCallback = (res: Nfcrwerror) => void
    
    type IsConnectedFailCallback = (res: Nfcrwerror) => void
    
    type IsConnectedSuccessCallback = (res: Nfcrwerror) => void
    
    type Join1v1ChatCompleteCallback = (res: Join1v1ChatError) => void
    
    type Join1v1ChatFailCallback = (res: Join1v1ChatError) => void
    
    type Join1v1ChatSuccessCallback = (res: Join1v1ChatError) => void
    
    type JoinVoIPChatCompleteCallback = (res: JoinVoIPChatError) => void
    
    type JoinVoIPChatFailCallback = (res: JoinVoIPChatError) => void
    
    type JoinVoIPChatSuccessCallback = (
        result: JoinVoIPChatSuccessCallbackResult
    ) => void
    
    type LivePlayerContextSnapshotSuccessCallback = (
        result: LivePlayerContextSnapshotSuccessCallbackResult
    ) => void
    
    type LivePusherContextSetZoomSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type LivePusherContextSnapshotSuccessCallback = (
        result: LivePusherContextSnapshotSuccessCallbackResult
    ) => void
    
    type LoadFontFaceCompleteCallback = (
        result: LoadFontFaceCompleteCallbackResult
    ) => void
    
    type LoadFontFaceFailCallback = (
        result: LoadFontFaceCompleteCallbackResult
    ) => void
    
    type LoadFontFaceSuccessCallback = (
        result: LoadFontFaceCompleteCallbackResult
    ) => void
    
    type LoginCompleteCallback = (res: GeneralCallbackResult) => void
    
    type LoginFailCallback = (err: RequestFailCallbackErr) => void
    
    type LoginSuccessCallback = (result: LoginSuccessCallbackResult) => void
    
    type MakeBluetoothPairCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type MakeBluetoothPairFailCallback = (res: GeneralCallbackResult) => void
    
    type MakeBluetoothPairSuccessCallback = (res: GeneralCallbackResult) => void
    
    type MakePhoneCallCompleteCallback = (res: GeneralCallbackResult) => void
    
    type MakePhoneCallFailCallback = (res: GeneralCallbackResult) => void
    
    type MakePhoneCallSuccessCallback = (res: GeneralCallbackResult) => void
    
    type MediaQueryObserverObserveCallback = (
        result: MediaQueryObserverObserveCallbackResult
    ) => void
    
    type MkdirCompleteCallback = (res: FileError) => void
    
    type MkdirFailCallback = (res: FileError) => void
    
    type MkdirSuccessCallback = (res: FileError) => void
    
    type MoveAlongCompleteCallback = (res: GeneralCallbackResult) => void
    
    type MoveAlongFailCallback = (res: GeneralCallbackResult) => void
    
    type MoveAlongSuccessCallback = (res: GeneralCallbackResult) => void
    
    type MoveToLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type MoveToLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type MoveToLocationSuccessCallback = (res: GeneralCallbackResult) => void
    
    type MuteCompleteCallback = (res: GeneralCallbackResult) => void
    
    type MuteFailCallback = (res: GeneralCallbackResult) => void
    
    type MuteSuccessCallback = (res: GeneralCallbackResult) => void
    
    type NavigateBackCompleteCallback = (res: GeneralCallbackResult) => void
    
    type NavigateBackFailCallback = (res: GeneralCallbackResult) => void
    
    type NavigateBackMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateBackMiniProgramFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateBackMiniProgramSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateBackSuccessCallback = (res: GeneralCallbackResult) => void
    
    type NavigateToCompleteCallback = (res: GeneralCallbackResult) => void
    
    type NavigateToFailCallback = (res: GeneralCallbackResult) => void
    
    type NavigateToMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateToMiniProgramFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateToMiniProgramSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type NavigateToSuccessCallback = (
        result: NavigateToSuccessCallbackResult
    ) => void
    
    type NdefCloseCompleteCallback = (res: Nfcrwerror) => void
    
    type NdefCloseFailCallback = (res: Nfcrwerror) => void
    
    type NdefCloseSuccessCallback = (res: Nfcrwerror) => void
    
    type NodeCallback = (result: NodeCallbackResult) => void
    
    type NotifyBLECharacteristicValueChangeCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type NotifyBLECharacteristicValueChangeFailCallback = (
        res: BluetoothError
    ) => void
    
    type NotifyBLECharacteristicValueChangeSuccessCallback = (
        res: BluetoothError
    ) => void
    
    type OffAccelerometerChangeCallback = (res: GeneralCallbackResult) => void
    
    type OffApiCategoryChangeCallback = (
        result: OnApiCategoryChangeListenerResult
    ) => void
    
    type OffAppHideCallback = (res: GeneralCallbackResult) => void
    
    type OffAppShowCallback = (res: GeneralCallbackResult) => void
    
    type OffAudioInterruptionBeginCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OffAudioInterruptionEndCallback = (res: GeneralCallbackResult) => void
    
    type OffBLEConnectionStateChangeCallback = (
        result: OnBLEConnectionStateChangeListenerResult
    ) => void
    
    type OffBLEMTUChangeCallback = (
        result: OnBLEMTUChangeListenerResult
    ) => void
    
    type OffBLEPeripheralConnectionStateChangedCallback = (
        result: OnBLEPeripheralConnectionStateChangedListenerResult
    ) => void
    
    type OffBindWifiCallback = (res: GeneralCallbackResult) => void
    
    type OffCanplayCallback = (res: GeneralCallbackResult) => void
    
    type OffCharacteristicReadRequestCallback = (
        result: OnCharacteristicReadRequestListenerResult
    ) => void
    
    type OffCharacteristicSubscribedCallback = (
        result: OnCharacteristicSubscribedListenerResult
    ) => void
    
    type OffCharacteristicUnsubscribedCallback = (
        result: OnCharacteristicSubscribedListenerResult
    ) => void
    
    type OffCharacteristicWriteRequestCallback = (
        result: OnCharacteristicWriteRequestListenerResult
    ) => void
    
    type OffChunkReceivedCallback = (
        result: OnChunkReceivedListenerResult
    ) => void
    
    type OffCompassChangeCallback = (res: GeneralCallbackResult) => void
    
    type OffConnectCallback = (res: GeneralCallbackResult) => void
    
    type OffDeviceMotionChangeCallback = (res: GeneralCallbackResult) => void
    
    type OffDiscoveredCallback = (result: OnDiscoveredListenerResult) => void
    
    type OffEmbeddedMiniProgramHeightChangeCallback = (
        result: OnEmbeddedMiniProgramHeightChangeListenerResult
    ) => void
    
    type OffEndedCallback = (res: GeneralCallbackResult) => void
    
    type OffGetWifiListCallback = (result: OnGetWifiListListenerResult) => void
    
    type OffGyroscopeChangeCallback = (res: GeneralCallbackResult) => void
    
    type OffHCEMessageCallback = (result: OnHCEMessageListenerResult) => void
    
    type OffKeyboardHeightChangeCallback = (
        result: OnKeyboardHeightChangeListenerResult
    ) => void
    
    type OffLazyLoadErrorCallback = (
        result: OnLazyLoadErrorListenerResult
    ) => void
    
    type OffListeningCallback = (res: GeneralCallbackResult) => void
    
    type OffLoadCallback = (res: GeneralCallbackResult) => void
    
    type OffLocalServiceDiscoveryStopCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OffLocalServiceFoundCallback = (
        result: OnLocalServiceFoundListenerResult
    ) => void
    
    type OffLocalServiceLostCallback = (
        result: OnLocalServiceLostListenerResult
    ) => void
    
    type OffLocalServiceResolveFailCallback = (
        result: OnLocalServiceLostListenerResult
    ) => void
    
    type OffLocationChangeCallback = (
        result: OnLocationChangeListenerResult
    ) => void
    
    type OffLocationChangeErrorCallback = (
        result: OnLocationChangeErrorListenerResult
    ) => void
    
    type OffMemoryWarningCallback = (
        result: OnMemoryWarningListenerResult
    ) => void
    
    type OffNetworkStatusChangeCallback = (res: GeneralCallbackResult) => void
    
    type OffNetworkWeakChangeCallback = (
        result: OnNetworkWeakChangeListenerResult
    ) => void
    
    type OffPageNotFoundCallback = (
        result: OnPageNotFoundListenerResult
    ) => void
    
    type OffPauseCallback = (res: GeneralCallbackResult) => void
    
    type OffPlayCallback = (res: GeneralCallbackResult) => void
    
    type OffScreenRecordingStateChangedCallback = (
        result: OnScreenRecordingStateChangedListenerResult
    ) => void
    
    type OffSeekedCallback = (res: GeneralCallbackResult) => void
    
    type OffSeekingCallback = (res: GeneralCallbackResult) => void
    
    type OffStopCallback = (res: GeneralCallbackResult) => void
    
    type OffThemeChangeCallback = (result: OnThemeChangeListenerResult) => void
    
    type OffTimeUpdateCallback = (res: GeneralCallbackResult) => void
    
    type OffUnhandledRejectionCallback = (
        result: OnUnhandledRejectionListenerResult
    ) => void
    
    type OffVoIPChatInterruptedCallback = (
        result: OnVoIPChatInterruptedListenerResult
    ) => void
    
    type OffVoIPChatMembersChangedCallback = (
        result: OnVoIPChatMembersChangedListenerResult
    ) => void
    
    type OffVoIPChatSpeakersChangedCallback = (
        result: OnVoIPChatSpeakersChangedListenerResult
    ) => void
    
    type OffVoIPChatStateChangedCallback = (
        result: OnVoIPChatStateChangedListenerResult
    ) => void
    
    type OffVoIPVideoMembersChangedCallback = (
        result: OnVoIPVideoMembersChangedListenerResult
    ) => void
    
    type OffWaitingCallback = (res: GeneralCallbackResult) => void
    
    type OffWifiConnectedCallback = (
        result: OnWifiConnectedListenerResult
    ) => void
    
    type OffWifiConnectedWithPartialInfoCallback = (
        result: OnWifiConnectedWithPartialInfoListenerResult
    ) => void
    
    type OffWindowResizeCallback = (
        result: OnWindowResizeListenerResult
    ) => void
    
    type OnAccelerometerChangeCallback = (
        result: OnAccelerometerChangeListenerResult
    ) => void
    
    type OnApiCategoryChangeCallback = (
        result: OnApiCategoryChangeListenerResult
    ) => void
    
    type OnAppHideCallback = (res: GeneralCallbackResult) => void
    
    type OnAppShowCallback = (
        
        options: LaunchOptionsApp
    ) => void
    
    type OnAudioInterruptionBeginCallback = (res: GeneralCallbackResult) => void
    
    type OnAudioInterruptionEndCallback = (res: GeneralCallbackResult) => void
    
    type OnBLECharacteristicValueChangeCallback = (
        result: OnBLECharacteristicValueChangeListenerResult
    ) => void
    
    type OnBLEConnectionStateChangeCallback = (
        result: OnBLEConnectionStateChangeListenerResult
    ) => void
    
    type OnBLEMTUChangeCallback = (result: OnBLEMTUChangeListenerResult) => void
    
    type OnBLEPeripheralConnectionStateChangedCallback = (
        result: OnBLEPeripheralConnectionStateChangedListenerResult
    ) => void
    
    type OnBackgroundAudioPauseCallback = (res: GeneralCallbackResult) => void
    
    type OnBackgroundAudioPlayCallback = (res: GeneralCallbackResult) => void
    
    type OnBackgroundAudioStopCallback = (res: GeneralCallbackResult) => void
    
    type OnBackgroundFetchDataCallback = (
        result: OnBackgroundFetchDataListenerResult
    ) => void
    
    type OnBeaconServiceChangeCallback = (
        result: OnBeaconServiceChangeListenerResult
    ) => void
    
    type OnBeaconUpdateCallback = (result: OnBeaconUpdateListenerResult) => void
    
    type OnBindWifiCallback = (res: GeneralCallbackResult) => void
    
    type OnBluetoothAdapterStateChangeCallback = (
        result: OnBluetoothAdapterStateChangeListenerResult
    ) => void
    
    type OnBluetoothDeviceFoundCallback = (
        result: OnBluetoothDeviceFoundListenerResult
    ) => void
    
    type OnCameraFrameCallback = (result: OnCameraFrameCallbackResult) => void
    type OnCanplayCallback = (res: GeneralCallbackResult) => void
    
    type OnCharacteristicReadRequestCallback = (
        result: OnCharacteristicReadRequestListenerResult
    ) => void
    
    type OnCharacteristicSubscribedCallback = (
        result: OnCharacteristicSubscribedListenerResult
    ) => void
    
    type OnCharacteristicUnsubscribedCallback = (
        result: OnCharacteristicSubscribedListenerResult
    ) => void
    
    type OnCharacteristicWriteRequestCallback = (
        result: OnCharacteristicWriteRequestListenerResult
    ) => void
    
    type OnCheckForUpdateCallback = (
        result: OnCheckForUpdateListenerResult
    ) => void
    
    type OnChunkReceivedCallback = (
        result: OnChunkReceivedListenerResult
    ) => void
    
    type OnCompassChangeCallback = (
        result: OnCompassChangeListenerResult
    ) => void
    
    type OnConnectCallback = (res: GeneralCallbackResult) => void
    
    type OnCopyUrlCallback = (result: OnCopyUrlListenerResult) => void
    
    type OnDeviceMotionChangeCallback = (
        result: OnDeviceMotionChangeListenerResult
    ) => void
    
    type OnDiscoveredCallback = (result: OnDiscoveredListenerResult) => void
    
    type OnEmbeddedMiniProgramHeightChangeCallback = (
        result: OnEmbeddedMiniProgramHeightChangeListenerResult
    ) => void
    type OnEndedCallback = (res: GeneralCallbackResult) => void
    
    type OnFrameRecordedCallback = (
        result: OnFrameRecordedListenerResult
    ) => void
    
    type OnGetWifiListCallback = (result: OnGetWifiListListenerResult) => void
    
    type OnGyroscopeChangeCallback = (
        result: OnGyroscopeChangeListenerResult
    ) => void
    
    type OnHCEMessageCallback = (result: OnHCEMessageListenerResult) => void
    
    type OnInterruptionBeginCallback = (res: GeneralCallbackResult) => void
    
    type OnInterruptionEndCallback = (res: GeneralCallbackResult) => void
    
    type OnKeyboardHeightChangeCallback = (
        result: OnKeyboardHeightChangeListenerResult
    ) => void
    
    type OnLazyLoadErrorCallback = (
        result: OnLazyLoadErrorListenerResult
    ) => void
    
    type OnListeningCallback = (res: GeneralCallbackResult) => void
    type OnLoadCallback = (res: GeneralCallbackResult) => void
    
    type OnLocalServiceDiscoveryStopCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OnLocalServiceFoundCallback = (
        result: OnLocalServiceFoundListenerResult
    ) => void
    
    type OnLocalServiceLostCallback = (
        result: OnLocalServiceLostListenerResult
    ) => void
    
    type OnLocalServiceResolveFailCallback = (
        result: OnLocalServiceLostListenerResult
    ) => void
    
    type OnLocationChangeCallback = (
        result: OnLocationChangeListenerResult
    ) => void
    
    type OnLocationChangeErrorCallback = (
        result: OnLocationChangeErrorListenerResult
    ) => void
    
    type OnMemoryWarningCallback = (
        result: OnMemoryWarningListenerResult
    ) => void
    
    type OnNeedPrivacyAuthorizationCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OnNetworkStatusChangeCallback = (
        result: OnNetworkStatusChangeListenerResult
    ) => void
    
    type OnNetworkWeakChangeCallback = (
        result: OnNetworkWeakChangeListenerResult
    ) => void
    
    type OnNextCallback = (res: GeneralCallbackResult) => void
    
    type OnOpenCallback = (result: OnOpenListenerResult) => void
    
    type OnPageNotFoundCallback = (result: OnPageNotFoundListenerResult) => void
    type OnPauseCallback = (res: GeneralCallbackResult) => void
    type OnPlayCallback = (res: GeneralCallbackResult) => void
    
    type OnPrevCallback = (res: GeneralCallbackResult) => void
    
    type OnProcessKilledCallback = (res: GeneralCallbackResult) => void
    
    type OnResumeCallback = (res: GeneralCallbackResult) => void
    
    type OnScreenRecordingStateChangedCallback = (
        result: OnScreenRecordingStateChangedListenerResult
    ) => void
    type OnSeekedCallback = (res: GeneralCallbackResult) => void
    type OnSeekingCallback = (res: GeneralCallbackResult) => void
    
    type OnSocketCloseCallback = (
        result: SocketTaskOnCloseListenerResult
    ) => void
    
    type OnSocketErrorCallback = (result: GeneralCallbackResult) => void
    
    type OnSocketMessageCallback = (
        result: SocketTaskOnMessageListenerResult
    ) => void
    
    type OnSocketOpenCallback = (result: OnSocketOpenListenerResult) => void
    
    type OnStartCallback = (res: GeneralCallbackResult) => void
    
    type OnThemeChangeCallback = (result: OnThemeChangeListenerResult) => void
    type OnTimeUpdateCallback = (res: GeneralCallbackResult) => void
    
    type OnUnhandledRejectionCallback = (
        result: OnUnhandledRejectionListenerResult
    ) => void
    
    type OnUpdateFailedCallback = (res: GeneralCallbackResult) => void
    
    type OnUpdateReadyCallback = (res: GeneralCallbackResult) => void
    
    type OnUserCaptureScreenCallback = (res: GeneralCallbackResult) => void
    
    type OnVoIPChatInterruptedCallback = (
        result: OnVoIPChatInterruptedListenerResult
    ) => void
    
    type OnVoIPChatMembersChangedCallback = (
        result: OnVoIPChatMembersChangedListenerResult
    ) => void
    
    type OnVoIPChatSpeakersChangedCallback = (
        result: OnVoIPChatSpeakersChangedListenerResult
    ) => void
    
    type OnVoIPChatStateChangedCallback = (
        result: OnVoIPChatStateChangedListenerResult
    ) => void
    
    type OnVoIPVideoMembersChangedCallback = (
        result: OnVoIPVideoMembersChangedListenerResult
    ) => void
    
    type OnWaitingCallback = (res: GeneralCallbackResult) => void
    
    type OnWifiConnectedCallback = (
        result: OnWifiConnectedListenerResult
    ) => void
    
    type OnWifiConnectedWithPartialInfoCallback = (
        result: OnWifiConnectedWithPartialInfoListenerResult
    ) => void
    
    type OnWindowResizeCallback = (result: OnWindowResizeListenerResult) => void
    
    type OpenAppAuthorizeSettingCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenAppAuthorizeSettingFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenAppAuthorizeSettingSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenBluetoothAdapterCompleteCallback = (res: BluetoothError) => void
    
    type OpenBluetoothAdapterFailCallback = (res: BluetoothError) => void
    
    type OpenBluetoothAdapterSuccessCallback = (res: BluetoothError) => void
    
    type OpenCardCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenCardFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenCardSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsActivityCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenChannelsActivityFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsActivitySuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenChannelsEventCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenChannelsEventFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsEventSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsLiveCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsLiveFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsLiveSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenChannelsUserProfileCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenChannelsUserProfileFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenChannelsUserProfileSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenCompleteCallback = (res: FileError) => void
    
    type OpenCustomerServiceChatCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenCustomerServiceChatFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenCustomerServiceChatSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenDocumentCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenDocumentFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenDocumentSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenEmbeddedMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenEmbeddedMiniProgramFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenEmbeddedMiniProgramSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenFailCallback = (res: FileError) => void
    
    type OpenLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenLocationSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenMapAppCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenMapAppFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenMapAppSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenPrivacyContractCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenPrivacyContractFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenPrivacyContractSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSettingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenSettingFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenSettingSuccessCallback = (
        result: OpenSettingSuccessCallbackResult
    ) => void
    
    type OpenSingleStickerViewCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSingleStickerViewFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSingleStickerViewSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenStickerIPViewCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenStickerIPViewFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenStickerIPViewSuccessCallback = (res: GeneralCallbackResult) => void
    
    type OpenStickerSetViewCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenStickerSetViewFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenStickerSetViewSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSuccessCallback = (result: OpenSuccessCallbackResult) => void
    
    type OpenSystemBluetoothSettingCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSystemBluetoothSettingFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenSystemBluetoothSettingSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type OpenVideoEditorCompleteCallback = (res: GeneralCallbackResult) => void
    
    type OpenVideoEditorFailCallback = (res: GeneralCallbackResult) => void
    
    type OpenVideoEditorSuccessCallback = (
        result: OpenVideoEditorSuccessCallbackResult
    ) => void
    
    type PageScrollToCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PageScrollToFailCallback = (res: GeneralCallbackResult) => void
    
    type PageScrollToSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PauseBGMCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PauseBGMFailCallback = (res: GeneralCallbackResult) => void
    
    type PauseBGMSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PauseBackgroundAudioCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PauseBackgroundAudioFailCallback = (res: GeneralCallbackResult) => void
    
    type PauseBackgroundAudioSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PauseCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PauseFailCallback = (res: GeneralCallbackResult) => void
    
    type PauseSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PauseVoiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PauseVoiceFailCallback = (res: GeneralCallbackResult) => void
    
    type PauseVoiceSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PlayBGMCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PlayBGMFailCallback = (res: GeneralCallbackResult) => void
    
    type PlayBGMSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PlayBackgroundAudioCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PlayBackgroundAudioFailCallback = (res: GeneralCallbackResult) => void
    
    type PlayBackgroundAudioSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PlayCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PlayFailCallback = (res: GeneralCallbackResult) => void
    
    type PlaySuccessCallback = (res: GeneralCallbackResult) => void
    
    type PlayVoiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PlayVoiceFailCallback = (res: GeneralCallbackResult) => void
    
    type PlayVoiceSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PluginLoginCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PluginLoginFailCallback = (res: GeneralCallbackResult) => void
    
    type PluginLoginSuccessCallback = (
        result: PluginLoginSuccessCallbackResult
    ) => void
    
    type PreDownloadSubpackageTaskOnProgressUpdateCallback = (
        result: PreDownloadSubpackageTaskOnProgressUpdateListenerResult
    ) => void
    
    type PreloadAssetsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PreloadAssetsFailCallback = (res: GeneralCallbackResult) => void
    
    type PreloadAssetsSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PreloadSkylineViewCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PreloadSkylineViewFailCallback = (res: GeneralCallbackResult) => void
    
    type PreloadSkylineViewSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type PreloadWebviewCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PreloadWebviewFailCallback = (res: GeneralCallbackResult) => void
    
    type PreloadWebviewSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PreviewImageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PreviewImageFailCallback = (res: GeneralCallbackResult) => void
    
    type PreviewImageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type PreviewMediaCompleteCallback = (res: GeneralCallbackResult) => void
    
    type PreviewMediaFailCallback = (res: GeneralCallbackResult) => void
    
    type PreviewMediaSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ReLaunchCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ReLaunchFailCallback = (res: GeneralCallbackResult) => void
    
    type ReLaunchSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ReadBLECharacteristicValueCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type ReadBLECharacteristicValueFailCallback = (res: BluetoothError) => void
    
    type ReadBLECharacteristicValueSuccessCallback = (
        res: BluetoothError
    ) => void
    
    type ReadCompleteCallback = (res: FileError) => void
    
    type ReadCompressedFileCompleteCallback = (res: FileError) => void
    
    type ReadCompressedFileFailCallback = (res: FileError) => void
    
    type ReadCompressedFileSuccessCallback = (
        result: ReadCompressedFileSuccessCallbackResult
    ) => void
    
    type ReadFailCallback = (res: FileError) => void
    
    type ReadFileCompleteCallback = (res: FileError) => void
    
    type ReadFileFailCallback = (res: FileError) => void
    
    type ReadFileSuccessCallback = (
        result: ReadFileSuccessCallbackResult
    ) => void
    
    type ReadSuccessCallback = (result: ReadSuccessCallbackResult) => void
    
    type ReadZipEntryCompleteCallback = (res: FileError) => void
    
    type ReadZipEntryFailCallback = (res: FileError) => void
    
    type ReadZipEntrySuccessCallback = (
        result: ReadZipEntrySuccessCallbackResult
    ) => void
    
    type ReaddirCompleteCallback = (res: FileError) => void
    
    type ReaddirFailCallback = (res: FileError) => void
    
    type ReaddirSuccessCallback = (result: ReaddirSuccessCallbackResult) => void
    
    type ReconnectCastingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ReconnectCastingFailCallback = (res: GeneralCallbackResult) => void
    
    type ReconnectCastingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RecorderManagerOnStopCallback = (result: OnStopListenerResult) => void
    
    type RedirectToCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RedirectToFailCallback = (res: GeneralCallbackResult) => void
    
    type RedirectToSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RedoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RedoFailCallback = (res: GeneralCallbackResult) => void
    
    type RedoSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveArcCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RemoveArcFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveArcSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveCustomLayerCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RemoveCustomLayerFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveCustomLayerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveFormatCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RemoveFormatFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveFormatSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveGroundOverlayCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RemoveGroundOverlayFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveGroundOverlaySuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RemoveMarkersCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RemoveMarkersFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveMarkersSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveSavedFileCompleteCallback = (res: FileError) => void
    
    type RemoveSavedFileFailCallback = (res: FileError) => void
    
    type RemoveSavedFileSuccessCallback = (res: FileError) => void
    
    type RemoveServiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RemoveServiceFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveServiceSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RemoveStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveStorageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveTabBarBadgeCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RemoveTabBarBadgeFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveTabBarBadgeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RemoveVisualLayerCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RemoveVisualLayerFailCallback = (res: GeneralCallbackResult) => void
    
    type RemoveVisualLayerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RenameCompleteCallback = (res: FileError) => void
    
    type RenameFailCallback = (res: FileError) => void
    
    type RenameSuccessCallback = (res: FileError) => void
    
    type RequestCommonPaymentCompleteCallback = (
        res: CommonPaymentError
    ) => void
    
    type RequestCommonPaymentFailCallback = (
        err: RequestCommonPaymentFailCallbackErr
    ) => void
    
    type RequestCommonPaymentSuccessCallback = (
        result: RequestCommonPaymentSuccessCallbackResult
    ) => void
    
    type RequestCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RequestDeviceVoIPCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestDeviceVoIPFailCallback = (res: GeneralCallbackResult) => void
    
    type RequestDeviceVoIPSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RequestFailCallback = (err: RequestFailCallbackErr) => void
    
    type RequestFullScreenCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestFullScreenFailCallback = (res: GeneralCallbackResult) => void
    
    type RequestFullScreenSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RequestOrderPaymentCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestOrderPaymentFailCallback = (res: GeneralCallbackResult) => void
    
    type RequestOrderPaymentSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestPaymentCompleteCallback = (res: GeneralCallbackResult) => void
    
    type RequestPaymentFailCallback = (res: GeneralCallbackResult) => void
    
    type RequestPaymentSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RequestPictureInPictureCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestPictureInPictureFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestPictureInPictureSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestPluginPaymentCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestPluginPaymentFailCallback = (res: GeneralCallbackResult) => void
    
    type RequestPluginPaymentSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestSubscribeDeviceMessageCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestSubscribeDeviceMessageFailCallback = (
        result: RequestSubscribeDeviceMessageFailCallbackResult
    ) => void
    
    type RequestSubscribeDeviceMessageSuccessCallback = (
        result: RequestSubscribeDeviceMessageSuccessCallbackResult
    ) => void
    
    type RequestSubscribeMessageCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequestSubscribeMessageFailCallback = (
        result: RequestSubscribeMessageFailCallbackResult
    ) => void
    
    type RequestSubscribeMessageSuccessCallback = (
        result: RequestSubscribeMessageSuccessCallbackResult
    ) => void
    
    type RequestSuccessCallback<
        T extends string | IAnyObject | ArrayBuffer =
            | string
            | IAnyObject
            | ArrayBuffer
    > = (result: RequestSuccessCallbackResult<T>) => void
    
    type RequestTaskOffHeadersReceivedCallback = (
        result: RequestTaskOnHeadersReceivedListenerResult
    ) => void
    
    type RequestTaskOnHeadersReceivedCallback = (
        result: RequestTaskOnHeadersReceivedListenerResult
    ) => void
    
    type RequestVirtualPaymentCompleteCallback = (
        res: VirtualPaymentError
    ) => void
    
    type RequestVirtualPaymentFailCallback = (
        err: RequestCommonPaymentFailCallbackErr
    ) => void
    
    type RequestVirtualPaymentSuccessCallback = (
        result: RequestCommonPaymentSuccessCallbackResult
    ) => void
    
    type RequirePrivacyAuthorizeCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequirePrivacyAuthorizeFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RequirePrivacyAuthorizeSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RestartMiniProgramCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type RestartMiniProgramFailCallback = (res: GeneralCallbackResult) => void
    
    type RestartMiniProgramSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ResumeBGMCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ResumeBGMFailCallback = (res: GeneralCallbackResult) => void
    
    type ResumeBGMSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ResumeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ResumeFailCallback = (res: GeneralCallbackResult) => void
    
    type ResumeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type RewardedVideoAdOffCloseCallback = (
        result: RewardedVideoAdOnCloseListenerResult
    ) => void
    
    type RewardedVideoAdOffErrorCallback = (
        result: RewardedVideoAdOnErrorListenerResult
    ) => void
    
    type RewardedVideoAdOnCloseCallback = (
        result: RewardedVideoAdOnCloseListenerResult
    ) => void
    
    type RewardedVideoAdOnErrorCallback = (
        result: RewardedVideoAdOnErrorListenerResult
    ) => void
    
    type RmdirCompleteCallback = (res: FileError) => void
    
    type RmdirFailCallback = (res: FileError) => void
    
    type RmdirSuccessCallback = (res: FileError) => void
    
    type SaveFileCompleteCallback = (res: FileError) => void
    
    type SaveFileFailCallback = (res: FileError) => void
    
    type SaveFileSuccessCallback = (
        result: SaveFileSuccessCallbackResult
    ) => void
    
    type SaveFileToDiskCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SaveFileToDiskFailCallback = (res: GeneralCallbackResult) => void
    
    type SaveFileToDiskSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SaveImageToPhotosAlbumCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SaveImageToPhotosAlbumFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SaveImageToPhotosAlbumSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SaveVideoToPhotosAlbumCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SaveVideoToPhotosAlbumFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SaveVideoToPhotosAlbumSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ScanCodeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ScanCodeFailCallback = (res: GeneralCallbackResult) => void
    
    type ScanCodeSuccessCallback = (
        result: ScanCodeSuccessCallbackResult
    ) => void
    
    type ScrollOffsetCallback = (result: ScrollOffsetCallbackResult) => void
    
    type SeekBackgroundAudioCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SeekBackgroundAudioFailCallback = (res: GeneralCallbackResult) => void
    
    type SeekBackgroundAudioSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SendCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SendFailCallback = (res: GeneralCallbackResult) => void
    
    type SendHCEMessageCompleteCallback = (res: NFCError) => void
    
    type SendHCEMessageFailCallback = (res: NFCError) => void
    
    type SendHCEMessageSuccessCallback = (res: NFCError) => void
    
    type SendMessageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SendMessageFailCallback = (res: GeneralCallbackResult) => void
    
    type SendMessageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SendSmsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SendSmsFailCallback = (res: GeneralCallbackResult) => void
    
    type SendSmsSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SendSocketMessageCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SendSocketMessageFailCallback = (res: GeneralCallbackResult) => void
    
    type SendSocketMessageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SendSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetBGMVolumeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetBGMVolumeFailCallback = (res: GeneralCallbackResult) => void
    
    type SetBGMVolumeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetBLEMTUCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetBLEMTUFailCallback = (result: SetBLEMTUFailCallbackResult) => void
    
    type SetBLEMTUSuccessCallback = (
        result: SetBLEMTUSuccessCallbackResult
    ) => void
    
    type SetBackgroundColorCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundColorFailCallback = (res: GeneralCallbackResult) => void
    
    type SetBackgroundColorSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundFetchTokenCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundFetchTokenFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundFetchTokenSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundTextStyleCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundTextStyleFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBackgroundTextStyleSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetBoundaryCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetBoundaryFailCallback = (res: GeneralCallbackResult) => void
    
    type SetBoundarySuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetCenterOffsetCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetCenterOffsetFailCallback = (res: GeneralCallbackResult) => void
    
    type SetCenterOffsetSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetClipboardDataCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetClipboardDataFailCallback = (res: GeneralCallbackResult) => void
    
    type SetClipboardDataSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetContentsCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetContentsFailCallback = (res: GeneralCallbackResult) => void
    
    type SetContentsSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetEnable1v1ChatCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetEnable1v1ChatFailCallback = (res: GeneralCallbackResult) => void
    
    type SetEnable1v1ChatSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetEnableDebugCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetEnableDebugFailCallback = (res: GeneralCallbackResult) => void
    
    type SetEnableDebugSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetInnerAudioOptionCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetInnerAudioOptionFailCallback = (res: GeneralCallbackResult) => void
    
    type SetInnerAudioOptionSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetKeepScreenOnCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetKeepScreenOnFailCallback = (res: GeneralCallbackResult) => void
    
    type SetKeepScreenOnSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetLocMarkerIconCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetLocMarkerIconFailCallback = (res: GeneralCallbackResult) => void
    
    type SetLocMarkerIconSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetMICVolumeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetMICVolumeFailCallback = (res: GeneralCallbackResult) => void
    
    type SetMICVolumeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetNavigationBarColorCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetNavigationBarColorFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetNavigationBarColorSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetNavigationBarTitleCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetNavigationBarTitleFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetNavigationBarTitleSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetScreenBrightnessCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetScreenBrightnessFailCallback = (res: GeneralCallbackResult) => void
    
    type SetScreenBrightnessSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetStorageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetStorageFailCallback = (res: GeneralCallbackResult) => void
    
    type SetStorageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarBadgeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarBadgeFailCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarBadgeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarItemCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarItemFailCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarItemSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarStyleCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarStyleFailCallback = (res: GeneralCallbackResult) => void
    
    type SetTabBarStyleSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetTimeoutCompleteCallback = (res: Nfcrwerror) => void
    
    type SetTimeoutFailCallback = (res: Nfcrwerror) => void
    
    type SetTimeoutSuccessCallback = (res: Nfcrwerror) => void
    
    type SetTopBarTextCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetTopBarTextFailCallback = (res: GeneralCallbackResult) => void
    
    type SetTopBarTextSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetVisualEffectOnCaptureCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetVisualEffectOnCaptureFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetVisualEffectOnCaptureSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SetWifiListCompleteCallback = (res: WifiError) => void
    
    type SetWifiListFailCallback = (res: WifiError) => void
    
    type SetWifiListSuccessCallback = (res: WifiError) => void
    
    type SetWindowSizeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetWindowSizeFailCallback = (res: GeneralCallbackResult) => void
    
    type SetWindowSizeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SetZoomCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SetZoomFailCallback = (res: GeneralCallbackResult) => void
    
    type ShareFileMessageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShareFileMessageFailCallback = (res: GeneralCallbackResult) => void
    
    type ShareFileMessageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShareToWeRunCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShareToWeRunFailCallback = (res: GeneralCallbackResult) => void
    
    type ShareToWeRunSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShareVideoMessageCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShareVideoMessageFailCallback = (res: GeneralCallbackResult) => void
    
    type ShareVideoMessageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowActionSheetCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowActionSheetFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowActionSheetSuccessCallback = (
        result: ShowActionSheetSuccessCallbackResult
    ) => void
    
    type ShowLoadingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowLoadingFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowLoadingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowModalCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowModalFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowModalSuccessCallback = (
        result: ShowModalSuccessCallbackResult
    ) => void
    
    type ShowNavigationBarLoadingCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShowNavigationBarLoadingFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShowNavigationBarLoadingSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShowRedPackageCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowRedPackageFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowRedPackageSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowShareImageMenuCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShowShareImageMenuFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowShareImageMenuSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type ShowShareMenuCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowShareMenuFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowShareMenuSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarRedDotCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarRedDotFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarRedDotSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowTabBarSuccessCallback = (res: GeneralCallbackResult) => void
    
    type ShowToastCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ShowToastFailCallback = (res: GeneralCallbackResult) => void
    
    type ShowToastSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SnapshotCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SnapshotFailCallback = (res: GeneralCallbackResult) => void
    
    type SocketTaskCloseCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SocketTaskCloseFailCallback = (res: GeneralCallbackResult) => void
    
    type SocketTaskCloseSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SocketTaskOnCloseCallback = (
        result: SocketTaskOnCloseListenerResult
    ) => void
    
    type SocketTaskOnMessageCallback = (
        result: SocketTaskOnMessageListenerResult
    ) => void
    
    type StartAccelerometerCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartAccelerometerFailCallback = (res: GeneralCallbackResult) => void
    
    type StartAccelerometerSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartAdvertisingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartAdvertisingFailCallback = (res: GeneralCallbackResult) => void
    
    type StartAdvertisingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartBeaconDiscoveryCompleteCallback = (res: BeaconError) => void
    
    type StartBeaconDiscoveryFailCallback = (res: BeaconError) => void
    
    type StartBeaconDiscoverySuccessCallback = (res: BeaconError) => void
    
    type StartBluetoothDevicesDiscoveryCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type StartBluetoothDevicesDiscoveryFailCallback = (
        res: BluetoothError
    ) => void
    
    type StartBluetoothDevicesDiscoverySuccessCallback = (
        res: BluetoothError
    ) => void
    
    type StartCastingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartCastingFailCallback = (res: GeneralCallbackResult) => void
    
    type StartCastingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartCompassCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartCompassFailCallback = (res: GeneralCallbackResult) => void
    
    type StartCompassSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartDeviceMotionListeningCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartDeviceMotionListeningFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartDeviceMotionListeningSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartDiscoveryCompleteCallback = (res: Nfcrwerror) => void
    
    type StartDiscoveryFailCallback = (res: Nfcrwerror) => void
    
    type StartDiscoverySuccessCallback = (res: Nfcrwerror) => void
    
    type StartFailCallback = (res: GeneralCallbackResult) => void
    
    type StartGyroscopeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartGyroscopeFailCallback = (res: GeneralCallbackResult) => void
    
    type StartGyroscopeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartHCECompleteCallback = (res: NFCError) => void
    
    type StartHCEFailCallback = (res: NFCError) => void
    
    type StartHCESuccessCallback = (res: NFCError) => void
    
    type StartLocalServiceDiscoveryCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartLocalServiceDiscoveryFailCallback = (
        result: StartLocalServiceDiscoveryFailCallbackResult
    ) => void
    
    type StartLocalServiceDiscoverySuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartLocationUpdateBackgroundCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartLocationUpdateBackgroundFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartLocationUpdateBackgroundSuccessCallback = (
        res: GeneralCallbackResult
    ) => void

    
    type StartPreviewCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartPreviewFailCallback = (res: GeneralCallbackResult) => void
    
    type StartPreviewSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartPullDownRefreshCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartPullDownRefreshFailCallback = (res: GeneralCallbackResult) => void
    
    type StartPullDownRefreshSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartRecordCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StartRecordFailCallback = (res: GeneralCallbackResult) => void
    
    type StartRecordTimeoutCallback = (
        result: StartRecordTimeoutCallbackResult
    ) => void
    
    type StartSoterAuthenticationCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartSoterAuthenticationFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StartSoterAuthenticationSuccessCallback = (
        result: StartSoterAuthenticationSuccessCallbackResult
    ) => void
    
    type StartSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StartWifiCompleteCallback = (res: WifiError) => void
    
    type StartWifiFailCallback = (res: WifiError) => void
    
    type StartWifiSuccessCallback = (res: WifiError) => void
    
    type StatCompleteCallback = (res: FileError) => void
    
    type StatFailCallback = (res: FileError) => void
    
    type StatSuccessCallback = (result: StatSuccessCallbackResult) => void
    
    type StopAccelerometerCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopAccelerometerFailCallback = (res: GeneralCallbackResult) => void
    
    type StopAccelerometerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopAdvertisingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopAdvertisingFailCallback = (res: GeneralCallbackResult) => void
    
    type StopAdvertisingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopBGMCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopBGMFailCallback = (res: GeneralCallbackResult) => void
    
    type StopBGMSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopBackgroundAudioCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopBackgroundAudioFailCallback = (res: GeneralCallbackResult) => void
    
    type StopBackgroundAudioSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopBeaconDiscoveryCompleteCallback = (res: BeaconError) => void
    
    type StopBeaconDiscoveryFailCallback = (res: BeaconError) => void
    
    type StopBeaconDiscoverySuccessCallback = (res: BeaconError) => void
    
    type StopBluetoothDevicesDiscoveryCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type StopBluetoothDevicesDiscoveryFailCallback = (
        res: BluetoothError
    ) => void
    
    type StopBluetoothDevicesDiscoverySuccessCallback = (
        res: BluetoothError
    ) => void
    
    type StopCompassCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopCompassFailCallback = (res: GeneralCallbackResult) => void
    
    type StopCompassSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopDeviceMotionListeningCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopDeviceMotionListeningFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopDeviceMotionListeningSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopDiscoveryCompleteCallback = (res: Nfcrwerror) => void
    
    type StopDiscoveryFailCallback = (res: Nfcrwerror) => void
    
    type StopDiscoverySuccessCallback = (res: Nfcrwerror) => void
    
    type StopFaceDetectCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopFaceDetectFailCallback = (res: GeneralCallbackResult) => void
    
    type StopFaceDetectSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopFailCallback = (res: GeneralCallbackResult) => void
    
    type StopGyroscopeCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopGyroscopeFailCallback = (res: GeneralCallbackResult) => void
    
    type StopGyroscopeSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopHCECompleteCallback = (res: NFCError) => void
    
    type StopHCEFailCallback = (res: NFCError) => void
    
    type StopHCESuccessCallback = (res: NFCError) => void
    
    type StopLocalServiceDiscoveryCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopLocalServiceDiscoveryFailCallback = (
        result: StopLocalServiceDiscoveryFailCallbackResult
    ) => void
    
    type StopLocalServiceDiscoverySuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopLocationUpdateCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopLocationUpdateFailCallback = (res: GeneralCallbackResult) => void
    
    type StopLocationUpdateSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopPreviewCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopPreviewFailCallback = (res: GeneralCallbackResult) => void
    
    type StopPreviewSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopPullDownRefreshCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopPullDownRefreshFailCallback = (res: GeneralCallbackResult) => void
    
    type StopPullDownRefreshSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type StopRecordCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopRecordFailCallback = (res: GeneralCallbackResult) => void
    
    type StopSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopVoiceCompleteCallback = (res: GeneralCallbackResult) => void
    
    type StopVoiceFailCallback = (res: GeneralCallbackResult) => void
    
    type StopVoiceSuccessCallback = (res: GeneralCallbackResult) => void
    
    type StopWifiCompleteCallback = (res: WifiError) => void
    
    type StopWifiFailCallback = (res: WifiError) => void
    
    type StopWifiSuccessCallback = (res: WifiError) => void
    
    type SubscribeVoIPVideoMembersCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SubscribeVoIPVideoMembersFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SubscribeVoIPVideoMembersSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type SwitchCameraCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SwitchCameraFailCallback = (res: GeneralCallbackResult) => void
    
    type SwitchCameraSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SwitchCastingCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SwitchCastingFailCallback = (res: GeneralCallbackResult) => void
    
    type SwitchCastingSuccessCallback = (res: GeneralCallbackResult) => void
    
    type SwitchTabCompleteCallback = (res: GeneralCallbackResult) => void
    
    type SwitchTabFailCallback = (res: GeneralCallbackResult) => void
    
    type SwitchTabSuccessCallback = (res: GeneralCallbackResult) => void
    
    type TCPSocketOffMessageCallback = (
        result: TCPSocketOnMessageListenerResult
    ) => void
    
    type TCPSocketOnMessageCallback = (
        result: TCPSocketOnMessageListenerResult
    ) => void
    
    type TakePhotoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type TakePhotoFailCallback = (res: GeneralCallbackResult) => void
    
    type TakePhotoSuccessCallback = (
        result: TakePhotoSuccessCallbackResult
    ) => void
    
    type TakeSnapshotCompleteCallback = (res: GeneralCallbackResult) => void
    
    type TakeSnapshotFailCallback = (res: GeneralCallbackResult) => void
    
    type TakeSnapshotSuccessCallback = (
        result: TakeSnapshotSuccessCallbackResult
    ) => void
    
    type ToScreenLocationCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ToScreenLocationFailCallback = (res: GeneralCallbackResult) => void
    
    type ToScreenLocationSuccessCallback = (
        result: ToScreenLocationSuccessCallbackResult
    ) => void
    
    type ToggleTorchCompleteCallback = (res: GeneralCallbackResult) => void
    
    type ToggleTorchFailCallback = (res: GeneralCallbackResult) => void
    
    type ToggleTorchSuccessCallback = (res: GeneralCallbackResult) => void
    
    type TransceiveCompleteCallback = (res: Nfcrwerror) => void
    
    type TransceiveFailCallback = (res: Nfcrwerror) => void
    
    type TransceiveSuccessCallback = (
        result: TransceiveSuccessCallbackResult
    ) => void
    
    type TranslateMarkerCompleteCallback = (res: GeneralCallbackResult) => void
    
    type TranslateMarkerFailCallback = (res: GeneralCallbackResult) => void
    
    type TranslateMarkerSuccessCallback = (res: GeneralCallbackResult) => void
    
    type TruncateCompleteCallback = (res: FileError) => void
    
    type TruncateFailCallback = (res: FileError) => void
    
    type TruncateSuccessCallback = (res: FileError) => void
    
    type UDPSocketOffCloseCallback = (res: GeneralCallbackResult) => void
    
    type UDPSocketOffErrorCallback = (result: GeneralCallbackResult) => void
    
    type UDPSocketOffMessageCallback = (
        result: UDPSocketOnMessageListenerResult
    ) => void
    type UDPSocketOnCloseCallback = (res: GeneralCallbackResult) => void
    type UDPSocketOnErrorCallback = (result: GeneralCallbackResult) => void
    
    type UDPSocketOnMessageCallback = (
        result: UDPSocketOnMessageListenerResult
    ) => void
    
    type UndoCompleteCallback = (res: GeneralCallbackResult) => void
    
    type UndoFailCallback = (res: GeneralCallbackResult) => void
    
    type UndoSuccessCallback = (res: GeneralCallbackResult) => void
    
    type UnlinkCompleteCallback = (res: FileError) => void
    
    type UnlinkFailCallback = (res: FileError) => void
    
    type UnlinkSuccessCallback = (res: FileError) => void
    
    type UnzipCompleteCallback = (res: FileError) => void
    
    type UnzipFailCallback = (res: FileError) => void
    
    type UnzipSuccessCallback = (res: FileError) => void
    
    type UpdateGroundOverlayCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type UpdateGroundOverlayFailCallback = (res: GeneralCallbackResult) => void
    
    type UpdateGroundOverlaySuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type UpdateShareMenuCompleteCallback = (res: GeneralCallbackResult) => void
    
    type UpdateShareMenuFailCallback = (res: GeneralCallbackResult) => void
    
    type UpdateShareMenuSuccessCallback = (res: GeneralCallbackResult) => void
    
    type UpdateVoIPChatMuteConfigCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type UpdateVoIPChatMuteConfigFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type UpdateVoIPChatMuteConfigSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type UpdateWeChatAppCompleteCallback = (res: GeneralCallbackResult) => void
    
    type UpdateWeChatAppFailCallback = (res: GeneralCallbackResult) => void
    
    type UpdateWeChatAppSuccessCallback = (res: GeneralCallbackResult) => void
    
    type UploadFileCompleteCallback = (res: GeneralCallbackResult) => void
    
    type UploadFileFailCallback = (res: GeneralCallbackResult) => void
    
    type UploadFileSuccessCallback = (
        result: UploadFileSuccessCallbackResult
    ) => void
    
    type UploadTaskOffProgressUpdateCallback = (
        result: UploadTaskOnProgressUpdateListenerResult
    ) => void
    
    type UploadTaskOnProgressUpdateCallback = (
        result: UploadTaskOnProgressUpdateListenerResult
    ) => void
    
    type VKSessionStartCallback = (
        
        status:
            | 0
            | 104
            | 112
            | 1025
            | 1026
            | 2000001
            | 2003000
            | 2000000
            | 2000002
            | 2000003
            | 2000004
            | 2003001
            | 2003002
    ) => void
    
    type VibrateLongCompleteCallback = (res: GeneralCallbackResult) => void
    
    type VibrateLongFailCallback = (res: GeneralCallbackResult) => void
    
    type VibrateLongSuccessCallback = (res: GeneralCallbackResult) => void
    
    type VibrateShortCompleteCallback = (res: GeneralCallbackResult) => void
    
    type VibrateShortFailCallback = (
        result: VibrateShortFailCallbackResult
    ) => void
    
    type VibrateShortSuccessCallback = (res: GeneralCallbackResult) => void
    
    type WorkerOnMessageCallback = (
        result: WorkerOnMessageListenerResult
    ) => void
    
    type WriteBLECharacteristicValueCompleteCallback = (
        res: BluetoothError
    ) => void
    
    type WriteBLECharacteristicValueFailCallback = (res: BluetoothError) => void
    
    type WriteBLECharacteristicValueSuccessCallback = (
        res: BluetoothError
    ) => void
    
    type WriteCharacteristicValueCompleteCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type WriteCharacteristicValueFailCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type WriteCharacteristicValueSuccessCallback = (
        res: GeneralCallbackResult
    ) => void
    
    type WriteCompleteCallback = (res: FileError) => void
    
    type WriteFailCallback = (res: FileError) => void
    
    type WriteFileCompleteCallback = (res: FileError) => void
    
    type WriteFileFailCallback = (res: FileError) => void
    
    type WriteFileSuccessCallback = (res: FileError) => void
    
    type WriteNdefMessageCompleteCallback = (res: Nfcrwerror) => void
    
    type WriteNdefMessageFailCallback = (res: Nfcrwerror) => void
    
    type WriteNdefMessageSuccessCallback = (res: Nfcrwerror) => void
    
    type WriteSuccessCallback = (result: WriteSuccessCallbackResult) => void
    
    type WxOffErrorCallback = (res: GeneralCallbackResult) => void
    
    type WxOnErrorCallback = (
        
        error: Error
    ) => void
    
    type WxStartRecordSuccessCallback = (
        result: StartRecordSuccessCallbackResult
    ) => void
    
    type WxStopRecordSuccessCallback = (res: GeneralCallbackResult) => void
}
