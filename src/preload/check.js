const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  // 定义检查的函数
  const checkCode = () => {
    const urlParams = new URLSearchParams(window.location.search) // 获取URL的查询字符串
    const code = urlParams.get("code") // 获取"code"参数

    if (code) {
      // 如果获取到了code值，则通过ipcRenderer发送回主进程
      ipcRenderer.send('auth-code', code)
    } else {
      // 如果没有code值，继续检查
      setTimeout(checkCode, 1000) // 每隔1秒检查一次
    }
  }

  // 开始检查
  checkCode()
})
