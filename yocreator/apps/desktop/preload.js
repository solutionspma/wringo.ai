const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
  ping: () => ipcRenderer.invoke("ping")
});
