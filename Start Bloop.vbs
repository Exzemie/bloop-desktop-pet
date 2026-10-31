' Double-click to start Bloop without a terminal window (needs "npm install" run once in this folder).
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run "cmd /c npm.cmd start", 0, False
