

declare namespace WechatMiniprogram.App {
    type SceneValues =
        | 1000
        | 1001
        | 1005
        | 1006
        | 1007
        | 1008
        | 1010
        | 1011
        | 1012
        | 1013
        | 1014
        | 1017
        | 1019
        | 1020
        | 1022
        | 1023
        | 1024
        | 1025
        | 1026
        | 1027
        | 1028
        | 1029
        | 1030
        | 1031
        | 1032
        | 1034
        | 1035
        | 1036
        | 1037
        | 1038
        | 1039
        | 1042
        | 1043
        | 1044
        | 1045
        | 1046
        | 1047
        | 1048
        | 1049
        | 1052
        | 1053
        | 1054
        | 1056
        | 1057
        | 1058
        | 1059
        | 1060
        | 1064
        | 1065
        | 1067
        | 1068
        | 1069
        | 1071
        | 1072
        | 1073
        | 1074
        | 1077
        | 1078
        | 1079
        | 1081
        | 1082
        | 1084
        | 1088
        | 1089
        | 1090
        | 1091
        | 1092
        | 1095
        | 1096
        | 1097
        | 1099
        | 1100
        | 1101
        | 1102
        | 1103
        | 1104
        | 1106
        | 1107
        | 1113
        | 1114
        | 1119
        | 1120
        | 1121
        | 1124
        | 1125
        | 1126
        | 1129
        | 1131
        | 1133
        | 1135
        | 1144
        | 1145
        | 1146
        | 1148
        | 1150
        | 1151
        | 1152
        | 1153
        | 1154
        | 1155
        | 1157
        | 1158
        | 1160
        | 1167
        | 1168
        | 1169
        | 1171
        | 1173
        | 1175
        | 1176
        | 1177
        | 1178
        | 1179
        | 1181
        | 1183
        | 1184
        | 1185
        | 1186
        | 1187
        | 1189
        | 1191
        | 1192
        | 1193
        | 1194
        | 1195
        | 1196
        | 1197
        | 1198
        | 1200
        | 1201
        | 1202
        | 1203
        | 1206
        | 1207
        | 1208
        | 1212
        | 1215
        | 1216
        | 1223
        | 1228
        | 1231

    interface LaunchShowOption {
        
        path: string
        
        query: IAnyObject
        
        scene: SceneValues
        
        shareTicket: string
        
        referrerInfo?: ReferrerInfo
    }

    interface PageNotFoundOption {
        
        path: string
        
        query: IAnyObject
        
        isEntryPage: boolean
    }

    interface Option {
        
        onLaunch(options: LaunchShowOption): void
        
        onShow(options: LaunchShowOption): void
        
        onHide(): void
        
        onError( error: string): void
        
        onPageNotFound(options: PageNotFoundOption): void
        
        onUnhandledRejection: OnUnhandledRejectionCallback
        
        onThemeChange: OnThemeChangeCallback
    }

    type Instance<T extends IAnyObject> = Option & T
    type Options<T extends IAnyObject> = Partial<Option> &
        T &
        ThisType<Instance<T>>
    type TrivialInstance = Instance<IAnyObject>

    interface Constructor {
        <T extends IAnyObject>(options: Options<T>): void
    }

    interface GetAppOption {
        
        allowDefault?: boolean
    }

    interface GetApp {
        <T extends IAnyObject = IAnyObject>(opts?: GetAppOption): Instance<T>
    }
}

declare let App: WechatMiniprogram.App.Constructor
declare let getApp: WechatMiniprogram.App.GetApp
