

/// <reference path="./lib.wx.app.d.ts" />
/// <reference path="./lib.wx.page.d.ts" />
/// <reference path="./lib.wx.api.d.ts" />
/// <reference path="./lib.wx.cloud.d.ts" />
/// <reference path="./lib.wx.canvas.d.ts" />
/// <reference path="./lib.wx.component.d.ts" />
/// <reference path="./lib.wx.behavior.d.ts" />
/// <reference path="./lib.wx.event.d.ts" />
/// <reference path="./lib.wx.wasm.d.ts" />

declare namespace WechatMiniprogram {
    type IAnyObject = Record<string, any>
    type Optional<F> = F extends (arg: infer P) => infer R ? (arg?: P) => R : F
    type OptionalInterface<T> = { [K in keyof T]: Optional<T[K]> }
    interface AsyncMethodOptionLike {
        success?: (...args: any[]) => void
    }
    type PromisifySuccessResult<
        P,
        T extends AsyncMethodOptionLike
    > = P extends {
        success: any
    }
        ? void
        : P extends { fail: any }
        ? void
        : P extends { complete: any }
        ? void
        : Promise<Parameters<Exclude<T['success'], undefined>>[0]>

    
    type IIRFilterNode = any
    type WaveShaperNode = any
    type ConstantSourceNode = any
    type OscillatorNode = any
    type GainNode = any
    type BiquadFilterNode = any
    type PeriodicWaveNode = any
    type AudioNode = any
    type ChannelSplitterNode = any
    type ChannelMergerNode = any
    type DelayNode = any
    type DynamicsCompressorNode = any
    type ScriptProcessorNode = any
    type PannerNode = any
    type AnalyserNode = any
    type AudioListener = any
    type WebGLTexture = any
    type WebGLRenderingContext = any

    
    type WorkletFunction = (...args: any) => any
    type AnimationObject = any
    type SharedValue<T = any> = T
    type DerivedValue<T = any> = T
}

declare let console: WechatMiniprogram.Console

declare let wx: WechatMiniprogram.Wx

interface Require {
    (
        
        module: string,
        
        callback?: (moduleExport: any) => void,
        
        errorCallback?: (err: any) => void
    ): any
    
    async(
        
        module: string
    ): Promise<any>
}
declare const require: Require

interface RequirePlugin {
    (
        
        module: string,
        
        callback?: (pluginExport: any) => void
    ): any
    
    async(
        
        module: string
    ): Promise<any>
}
declare const requirePlugin: RequirePlugin

declare function requireMiniProgram(): any

declare let module: {
    
    exports: any
}

declare let exports: any


declare function clearInterval(
    
    intervalID: number
): void

declare function clearTimeout(
    
    timeoutID: number
): void

declare function setInterval(
    
    callback: (...args: any[]) => any,
    
    delay?: number,
    
    rest?: any
): number

declare function setTimeout(
    
    callback: (...args: any[]) => any,
    
    delay?: number,
    
    rest?: any
): number
