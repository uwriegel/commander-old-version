export enum RendererMsgType {
    SetColumns = 1,
    ItemsSource,
    Items,
    RefreshView,
    Restrict,
    RestrictClose,
    BacktrackEnd,
    SendPath
}

export interface ShowHidden {
    show: boolean
    selectedIndex: number
}

export interface Sort {
    column: number
    descending: boolean
    subItem: boolean
    selectedIndex: number
}


export enum MainMsgType {
    Init,
    // GetItems = "GetItems",
    // Action = "Action",
    // ColumnsWidths = "ColumnsWidths",
    // ShowHidden = "ShowHidden",
    // Refresh = "Refresh",
    // Sort = "Sort",
    // ChangePath = "ChangePath",
    // Restrict = "Restrict",
    // RestrictClose = "RestrictClose",
    // Backtrack = "Backtrack",
    // ToggleSelection = "ToggleSelection",
    // SelectAll = "SelectAll",
    // UnselectAll = "UnselectAll",
    // SelectTo = "SelectTo",
    // SelectFrom = "SelectFrom",
    // GetItemPath = "GetItemPath" 
}

export interface RendererMsg {
    method: RendererMsgType
}

export interface MainMsg {
    method: MainMsgType
    fields?: string[] | Range[] | number[] | (string[])[] | ShowHidden[] | Sort[] | boolean[] | undefined
}

export interface ColumnsMsg extends RendererMsg {
    value: Column[]
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
    isSortable: boolean,
    width: string,
    rightAligned: boolean
    isExif: boolean
}

