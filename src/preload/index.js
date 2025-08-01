import { contextBridge, ipcMain, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { resolve } from 'path'

// Custom APIs for renderer
const api = {
  openFile: () => {
    ipcRenderer.invoke('help').then((res) => console.log(res))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      downloadFile: (params) => ipcRenderer.invoke('download-file', params)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

console.log("hello,i'm preload")

// document.addEventListener('DOMContentLoaded', () => {
//   const element = document.querySelector("#app > div > div.main-container > div > div")
//   if (element) {
//     element.remove(); // 移除元素
//     // 或者
//     // element.style.display = 'none'; // 隐藏元素
//   }
// });
