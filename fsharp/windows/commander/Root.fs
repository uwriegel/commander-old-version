module Root
// open Model
// open System.IO

// let getDrives () = 
//     DriveInfo.GetDrives ()
//     |> Seq.filter (fun n -> n.IsReady)
//     |> Seq.sortBy (fun n -> n.Name)
//     |> Seq.mapi (fun i n -> {
//         Name = n.Name
//         Description = n.VolumeLabel
//         Type = RootType.HardDrive
//         Size = n.TotalSize
//     })
//     |> Seq.toArray     
    
// let getItems (items: DriveItem array) startRange endRange = 
//     let startRange = min startRange (items.Length - 1)
//     let endRange = min endRange (items.Length - 1)
//     items.[startRange..endRange]
//     |> Array.mapi (fun i item -> {
//         IconPath = ""
//         Type = ItemType.Drive
//         Index = i + startRange
//         Name = item.Name
//         IsExif = false
//         IsHidden = false
//         Columns = [| 
//             item.Description
//             Helpers.formatSize item.Size
//         |]})

// let getItemsSource session = 
//     let drives = getDrives ()
//     { 
//         session with 
//             ProcessorId = sprintf "%s-%s" session.Id "root"
//             Items = DriveItems drives
//             Path = "root"
//             ItemsCount = drives.Length 
//     }

// let enter session = 
//     let widths = 
//         match Settings.get<string> (sprintf "%s-root-widths" session.Id) with
//         | Some str -> Json.deserialize<string array> str
//         | None -> [|"25%"; "25%"; "25%"; "25%"|]
//     let payload = { Method = Method.SetColumns; Value = 
//         [| 
//             { Name = "Beschreibung"; IsSortable = false; Width = widths.[0]; RightAligned = false; IsExif = false }
//             { Name = "Name"; IsSortable = false; Width = widths.[1]; RightAligned = false; IsExif = false }
//             { Name = "Größe"; IsSortable = false; Width = widths.[3]; RightAligned = true; IsExif = false }
//             // TODO: drive type: icon
//         |]
//     } 
//     session.Send (payload :> obj)
    
//     getItemsSource session

// let action session (items: DriveItem array) selectedIndex = 
//     ToFileSystemPath items.[selectedIndex].Name

