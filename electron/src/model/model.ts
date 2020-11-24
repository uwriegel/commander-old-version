export const ICON_SCHEME = 'icon'
export const CHANNEL_TO_RENDERER = "RENDERER"

export const THEME_BLUE = "blue"
export const THEME_YARU = "yaru"
export const THEME_YARUDARK = "yarudark"

export enum MainAppMsgType {
    SetTheme = 1,
    Refresh,
    SaveBounds,
} 

export enum RendererMsgType {
    SetColumns = 1,
    ItemsSource,
    Items,
    RefreshView,
    Restrict,
    RestrictClose,
    BacktrackEnd,
    SendPath,
}

export enum ItemType {
    Parent = 1,
    Drive,
    Folder,
    File
}

export interface Item {
    isSelected: boolean
    type: ItemType
    index: number
    name: string
    display: string
    isHidden: boolean|undefined
    iconPath?: string
    isExif?: boolean|null
    columns: string[]
}

export enum MainMsgType {
    Init,
    GetItems,
    Action,
    GetItemPath,
    ChangePath,
    Refresh,
    Restrict,
    RestrictClose,
    Sort,
    Backtrack,
    ColumnsWidths
    // ToggleSelection = "ToggleSelection",
    // SelectAll = "SelectAll",
    // UnselectAll = "UnselectAll",
    // SelectTo = "SelectTo",
    // SelectFrom = "SelectFrom",
}

export interface RendererMsg {
    method: RendererMsgType
}

export interface MainMsg { method: MainMsgType }

export interface GetItems extends MainMsg {
    reqId: number,
    startRange: number,
    endRange: number
}

export interface ActionMsg extends MainMsg {
    selectedIndex: number
}

export interface GetItemPathMsg extends MainMsg {
    selectedIndex: number
}

export interface ChangePathMsg extends MainMsg {
    path: string
}

export interface RestrictMsg extends MainMsg {
    value: string
}

export interface Sort extends MainMsg {
    column: number
    descending: boolean
    subItem: boolean
    selectedIndex: number
}

export interface BackTrackMsg extends MainMsg {
    direction: boolean
}

export interface ColumnsWidths extends MainMsg {
    widths: string[]
}

export interface ColumnsMsg extends RendererMsg {
    value: Column[]
}

export interface ItemsMsg extends RendererMsg {
    items: Item[]
    reqId: number
}

export interface ItemsSource extends RendererMsg {
    path: string,
    count: number
    indexToSelect: number
}

export interface Items extends RendererMsg {
    reqId: number
    path: string,
    isHidden: boolean
    items: any[]
}

export interface RestrictResult extends RendererMsg {
    restrictValue: string
    itemsCount: number
}

export interface RestrictClose extends RendererMsg {
    itemsCount: number
}

export interface SendPath extends RendererMsg {
    path: string
}

export interface Column {
    name: string,
    subItem?: string | null
    isSortable?: boolean,
    width: string,
    rightAligned?: boolean
    isExif?: boolean
}

