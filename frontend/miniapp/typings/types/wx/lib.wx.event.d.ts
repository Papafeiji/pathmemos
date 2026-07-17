

declare namespace WechatMiniprogram {
    interface Target<DataSet extends IAnyObject = IAnyObject> {
        
        id: string
        
        tagName?: string
        
        dataset: DataSet
        
        offsetTop: number
        
        offsetLeft: number
    }

    
    interface BaseEvent<
        Mark extends IAnyObject = IAnyObject,
        CurrentTargetDataset extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = CurrentTargetDataset
    > {
        
        type: string
        
        timeStamp: number
        
        mark?: Mark
        
        target: Target<TargetDataset>
        
        currentTarget: Target<CurrentTargetDataset>
    }

    
    interface CustomEvent<
        Detail extends IAnyObject = IAnyObject,
        Mark extends IAnyObject = IAnyObject,
        CurrentTargetDataset extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = CurrentTargetDataset
    > extends BaseEvent<Mark, CurrentTargetDataset, TargetDataset> {
        
        detail: Detail
    }

    
    interface TouchDetail {
        
        clientX: number
        
        clientY: number
        
        identifier: number
        
        pageX: number
        
        pageY: number
    }

    
    interface TouchCanvasDetail {
        
        identifier: number
        
        x: number
        
        y: number
    }

    
    interface Touch<
        Detail extends IAnyObject = IAnyObject,
        T extends TouchDetail | TouchCanvasDetail = TouchDetail,
        Mark extends IAnyObject = IAnyObject,
        CurrentTargetDataset extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = CurrentTargetDataset
    > extends CustomEvent<Detail, Mark, CurrentTargetDataset, TargetDataset> {
        
        touches: T[]
        
        changedTouches: T[]
    }

    
    type TouchEvent<
        Detail extends IAnyObject = IAnyObject,
        Mark extends IAnyObject = IAnyObject,
        CurrentTargetDataset extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = CurrentTargetDataset
    > = Touch<Detail, TouchDetail, Mark, CurrentTargetDataset, TargetDataset>

    
    interface TouchCanvas<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > extends Touch<never, TouchCanvasDetail, Mark, never, TargetDataset> {
        
        currentTarget: never
    }

    
    type CoverImageLoad<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            width: number
            
            height: number
        },
        Mark,
        TargetDataset
    >

    
    type CoverImageError = CustomEvent<GeneralCallbackResult>

    
    type MovableViewChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            x: number
            y: number
            
            source:
                | 'touch'
                | 'touch-out-of-bounds'
                | 'out-of-bounds'
                | 'friction'
                | ''
        },
        Mark,
        TargetDataset
    >

    
    type MovableViewScale<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            x: number
            
            y: number
            scale: number
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewDragStart<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            scrollTop: number
            scrollLeft: number
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewDragging<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            scrollTop: number
            scrollLeft: number
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewDragEnd<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            scrollTop: number
            scrollLeft: number
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewScrollToUpper<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            direction: 'top' | 'left'
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewScrollToLower<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            direction: 'bottom' | 'right'
        },
        Mark,
        TargetDataset
    >

    
    type ScrollViewScroll<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            scrollLeft: number
            scrollTop: number
            scrollHeight: number
            scrollWidth: number
            deltaX: number
            deltaY: number
        },
        Mark,
        TargetDataset
    >

    type ScrollViewRefresherPulling<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    type ScrollViewRefresherRefresh<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    type ScrollViewRefresherRestore<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    type ScrollViewRefresherAbort<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    
    type SwiperChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            current: number
            
            source: '' | 'autoplay' | 'touch'
            
            currentItemId: string
        },
        Mark,
        TargetDataset
    >

    
    type SwiperTransition<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            dx: number
            dy: number
        },
        Mark,
        TargetDataset
    >

    
    type SwiperAnimationFinish<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = SwiperChange<Mark, TargetDataset>

    
    type ProgressActiveEnd<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            curPercent: number
        },
        Mark,
        TargetDataset
    >

    
    type ButtonGetUserInfo = CustomEvent<
        GeneralCallbackResult & GetUserInfoSuccessCallbackResult
    >

    
    type ButtonContact = CustomEvent<GeneralCallbackResult>

    
    type ButtonGetPhoneNumber = CustomEvent<
        GeneralCallbackResult &
            Partial<GetWeRunDataSuccessCallbackResult> & {
                code: string
            }
    >

    
    type ButtonError = CustomEvent<GeneralCallbackResult>

    
    type ButtonOpenSetting = CustomEvent<
        GeneralCallbackResult & OpenSettingSuccessCallbackResult
    >

    
    type ButtonLaunchApp = CustomEvent<GeneralCallbackResult>

    
    type CheckboxGroupChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string[]
        },
        Mark,
        TargetDataset
    >

    
    type EditorReady<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    
    type EditorFocus<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            html: string
            text: string
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delta: any[]
        },
        Mark,
        TargetDataset
    >

    
    type EditorBlur<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = EditorFocus<Mark, TargetDataset>

    
    type EditorInput<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = EditorFocus<Mark, TargetDataset>

    
    type EditorStatusChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        Partial<{
            align: 'left' | 'center' | 'right' | 'justify'
            bold: 'strong'
            italic: 'em'
            underline: true
            strike: 'del'
            lineHeight: string
            letterSpacing: string
            marginTop: string
            marginBottom: string
            fontFamily: string
            fontSize: string
            color: string
            backgroundColor: string
            list: 'checked' | 'unchecked' | 'ordered' | 'bullet'
            indent: number
            header: number
            script: 'sub' | 'super'
            direction: 'rtl'
        }>,
        Mark,
        TargetDataset
    >

    
    type FormSubmit<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            formId?: unknown
            target: Target
            
            value: IAnyObject
        },
        Mark,
        TargetDataset
    >

    
    type FormReset<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            target: Target
        },
        Mark,
        TargetDataset
    >

    
    type Input<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string
            
            cursor: number
            
            keyCode?: number
        },
        Mark,
        TargetDataset
    >

    
    type InputFocus<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string
            
            height: number
        },
        Mark,
        TargetDataset
    >

    
    type InputBlur<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string
        },
        Mark,
        TargetDataset
    >

    
    type InputConfirm<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string
        },
        Mark,
        TargetDataset
    >

    
    type InputKeyboardHeightChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            height: number
            duration: number
        },
        Mark,
        TargetDataset
    >

    
    type PickerCancel<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    
    type PickerChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: string | number[] | [string, string, string]
            
            code: [string, string, string]
            
            postcode: string
        },
        Mark,
        TargetDataset
    >

    
    type PickerColumnChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            column: number
            value: number
        },
        Mark,
        TargetDataset
    >

    
    type PickerViewChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: number[]
        },
        Mark,
        TargetDataset
    >

    
    type PickerViewPickStart<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    
    type PickerViewPickEnd<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<never, Mark, TargetDataset>

    
    type RadioGroupChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        
        {
            value: string
        },
        Mark,
        TargetDataset
    >

    
    type SliderChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            value: number
        },
        Mark,
        TargetDataset
    >

    
    type SliderChanging<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = SliderChange<Mark, TargetDataset>

    
    type SwitchChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            value: boolean
        },
        Mark,
        TargetDataset
    >

    
    type TextareaFocus<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = InputFocus<Mark, TargetDataset>

    
    type TextareaBlur<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = InputBlur<Mark, TargetDataset>

    
    type TextareaLineChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = CustomEvent<
        {
            
            height: number
            
            heightRpx: number
            
            lineCount: number
            
            lineHeight: number
        },
        Mark,
        TargetDataset
    >

    
    type TextareaInput<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = Input<Mark, TargetDataset>

    
    type TextareaConfirm<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = InputConfirm<Mark, TargetDataset>

    
    type TextareaKeyboardHeightChange<
        Mark extends IAnyObject = IAnyObject,
        TargetDataset extends IAnyObject = IAnyObject
    > = InputKeyboardHeightChange<Mark, TargetDataset>

    
    type FunctionalNavigatorSuccess<Detail extends IAnyObject = IAnyObject> =
        CustomEvent<Detail, never, never>

    
    type FunctionalNavigatorFail<Detail extends IAnyObject = IAnyObject> =
        CustomEvent<Detail, never, never>

    
    type NavigatorSuccess = CustomEvent
    
    type NavigatorFail = CustomEvent
    
    type NavigatorComplete = CustomEvent

    
    type AudioError = CustomEvent<{
        
        errMsg: 1 | 2 | 3 | 4
    }>

    
    type AudioPlay = CustomEvent

    
    type AudioPause = CustomEvent

    
    type AudioTimeUpdate = CustomEvent<{
        currentTime: number
        duration: number
    }>

    
    type AudioEnded = CustomEvent

    
    type CameraStop = CustomEvent

    
    type CameraError = CustomEvent

    
    type CameraInitDone = CustomEvent

    
    type CameraScanCode = CustomEvent

    
    type ImageError = CoverImageError
    
    type ImageLoad = CoverImageLoad

    
    type LivePlayerStateChange = CustomEvent<{
        
        code: number
    }>

    
    type LivePlayerFullScreenChange = CustomEvent<{
        direction: 'vertical' | 'horizontal'
        fullScreen: boolean
    }>

    
    type LivePlayerNetStatus = CustomEvent<{
        
        info:
            | 'videoBitrate'
            | 'audioBitrate'
            | 'videoFPS'
            | 'videoGOP'
            | 'netSpeed'
            | 'netJitter'
            | 'videoWidth'
            | 'videoHeight'
    }>

    
    type LivePusherStateChange = CustomEvent<{
        
        code: number
    }>

    
    type LivePusherNetStatus = CustomEvent<{
        
        info:
            | 'videoBitrate'
            | 'audioBitrate'
            | 'videoFPS'
            | 'videoGOP'
            | 'netSpeed'
            | 'netJitter'
            | 'videoWidth'
            | 'videoHeight'
    }>

    
    type LivePusherError = CustomEvent<{
        errMsg: string
        
        errCode: number
    }>

    
    type LivePusherBgmStart = CustomEvent

    
    type LivePusherBgmProgress = CustomEvent<{
        progress: number
        duration: number
    }>

    
    type LivePusherBgmComplete = CustomEvent

    
    type VideoPlay = CustomEvent

    
    type VideoPause = CustomEvent

    
    type VideoEnded = CustomEvent

    
    type VideoTimeUpdate = CustomEvent<{
        currentTime: number
        duration: number
    }>

    
    type VideoFullScreenChange = CustomEvent<{
        fullScreen: boolean
        direction: 'vertical' | 'horizontal'
    }>

    
    type VideoWaiting = CustomEvent

    
    type VideoError = CustomEvent

    
    type VideoPregress = CustomEvent<{
        
        buffered: number
    }>

    
    type VoipRoomError = CustomEvent

    
    type MapTap = CustomEvent<{
        
        longitude: number
        
        latitude: number
    }>

    
    type MarkerTap = CustomEvent<{
        
        markerId: number
    }>

    
    type LabelTap = MarkerTap

    
    type ControlTap = CustomEvent<{
        
        controlId: number
    }>

    
    type CalloutTap = MarkerTap

    
    type MapUpdated = CustomEvent

    
    type RegionChange = CustomEvent<{
        
        rotate: number
        
        skew: number
    }> &
        (
            | {
                  
                  type: 'begin'
                  
                  causedBy: 'gesture' | 'update'
              }
            | {
                  
                  type: 'end'
                  
                  causedBy: 'drag' | 'scale' | 'update'
              }
        )

    
    type AdLoad = CustomEvent

    
    type AdError = CustomEvent<{
        
        errCode: number
    }>

    
    type AdClose = CustomEvent

    
    type WebviewMessage = CustomEvent<{
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any[]
    }>

    
    type WebviewLoad = CustomEvent<{
        src: string
    }>

    
    type WebviewError = CustomEvent<{
        src: string
    }>
}
