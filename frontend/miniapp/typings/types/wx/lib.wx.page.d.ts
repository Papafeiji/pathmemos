

declare namespace WechatMiniprogram.Page {
    type Instance<
        TData extends DataOption,
        TCustom extends CustomOption
    > = OptionalInterface<ILifetime> &
        InstanceProperties &
        InstanceMethods<TData> &
        Data<TData> &
        TCustom
    type Options<
        TData extends DataOption,
        TCustom extends CustomOption
    > = (TCustom &
        Partial<Data<TData>> &
        Partial<ILifetime> & {
            options?: Component.ComponentOptions
        }) &
        ThisType<Instance<TData, TCustom>>
    type TrivialInstance = Instance<IAnyObject, IAnyObject>
    interface Constructor {
        <TData extends DataOption, TCustom extends CustomOption>(
            options: Options<TData, TCustom>
        ): void
    }
    interface ILifetime {
        
        onLoad(
            
            query: Record<string, string | undefined>
        ): void | Promise<void>
        
        onShow(): void | Promise<void>
        
        onReady(): void | Promise<void>
        
        onHide(): void | Promise<void>
        
        onUnload(): void | Promise<void>
        
        onPullDownRefresh(): void | Promise<void>
        
        onReachBottom(): void | Promise<void>
        
        onShareAppMessage(
            
            options: IShareAppMessageOption
        ):
            | ICustomShareContent
            | IAsyncCustomShareContent
            | Promise<ICustomShareContent>
            | void
            | Promise<void>
        
        onShareTimeline(): ICustomTimelineContent | void

        
        onPageScroll(
            
            options: IPageScrollOption
        ): void | Promise<void>

        
        onTabItemTap(
            
            options: ITabItemTapOption
        ): void | Promise<void>

        
        onResize(
            
            options: IResizeOption
        ): void | Promise<void>

        
        onAddToFavorites(options: IAddToFavoritesOption): IAddToFavoritesContent
    }
    interface InstanceProperties {
        
        is: string

        
        route: string

        
        options: Record<string, string | undefined>
    }

    type DataOption = Record<string, any>
    type CustomOption = Record<string, any>

    type InstanceMethods<D extends DataOption> = Component.InstanceMethods<D>

    interface Data<D extends DataOption> {
        
        data: D
    }

    interface ICustomShareContent {
        
        title?: string
        
        path?: string
        
        imageUrl?: string
    }

    interface IAsyncCustomShareContent extends ICustomShareContent {
        promise: Promise<ICustomShareContent>
    }

    interface ICustomTimelineContent {
        
        title?: string
        
        query?: string
        
        imageUrl?: string
    }

    interface IPageScrollOption {
        
        scrollTop: number
    }

    interface IShareAppMessageOption {
        
        from: 'button' | 'menu'
        
        target: any
        
        webViewUrl?: string
    }

    interface ITabItemTapOption {
        
        index: string
        
        pagePath: string
        
        text: string
    }

    interface IResizeOption {
        size: {
            
            windowWidth: number
            
            windowHeight: number
        }
    }

    interface IAddToFavoritesOption {
        
        webviewUrl?: string
    }

    interface IAddToFavoritesContent {
        
        title?: string
        
        imageUrl?: string
        
        query?: string
    }

    interface GetCurrentPages {
        (): Array<Instance<IAnyObject, IAnyObject>>
    }
}


declare let Page: WechatMiniprogram.Page.Constructor

declare let getCurrentPages: WechatMiniprogram.Page.GetCurrentPages
