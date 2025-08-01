import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  shell
} from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import * as path from 'node:path'
import axios from 'axios'
import * as fs from 'node:fs'

const { session } = require('electron')
// const fs = require('fs').promises;
const { exec } = require('child_process')
let checkInterval //计时器
let mainWindow //主窗口
let setCookieHeader //Cookie头
let loginCookie //登陆时携带的Cookie
const userDataPath = app.getPath('userData')

async function getBase64FromURL(url) {
  return new Promise((resolve, reject) => {
    session.defaultSession.downloadURL(url)
    session.defaultSession.once('will-download', (event, item) => {
      item.setSavePath(app.getPath('temp') + '/' + item.getFilename()) // 临时保存
      item.once('done', async (event, state) => {
        if (state === 'completed') {
          const fs = require('fs')
          fs.readFile(item.getSavePath(), (err, data) => {
            if (err) reject(err)
            else resolve(`data:image/png;base64,${data.toString('base64')}`)
          })
        } else {
          reject(new Error('下载失败'))
        }
      })
    })
  })
}

/**
 * 保存Token到本地JSON文件中
 * @param key
 * @param data
 * @returns {Promise<void>}
 */
async function saveData(key, data) {
  const filePath = path.join(userDataPath, `${key}.json`) // 使用 path.join 拼接路径
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8') // 使用 fs.promises
    console.log(`Data saved successfully to ${filePath}`)
  } catch (err) {
    console.error('Error saving data:', err)
    throw err // 抛出错误
  }
}

/**
 * 关闭 Adobe Illustrator 中的指定文档
 * @param {string} docName - 要关闭的文档名称（例如 "2025W030001.pdf"）
 */
function closeAIDocument(docName) {
  const script = `
tell application "Adobe Illustrator"
    try
        activate
        set docList to documents
        set closedDocs to 0  -- 计数已关闭的文档
        set docCount to count of docList

        -- 从最后一个文档开始遍历
        repeat with i from docCount to 1 by -1
            set doc to item i of docList
            set docName to name of doc
            if docName is "${docName}.pdf" or docName ends with ".svg" then
                close doc saving no
                set closedDocs to closedDocs + 1
            end if
        end repeat

        if closedDocs > 0 then
            display dialog "当前需求${docName}.pdf 和多余 SVG 文档已关闭,保证线稿可以及时更新,即将拉起客户端，请对${docName}执行提交操作!"
        else
            display dialog "没有找到 PDF 或 SVG 文件可关闭"
        end if

    on error errMsg
        display dialog "发生错误: " & errMsg
    end try
end tell
  `

  // 使用 osascript 执行 AppleScript
  exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.error(`stderr: ${stderr}`)
  })
}

/**
 * 持久话化保存token
 * @param key
 * @returns {Promise<any|null>}
 */
async function loadData(key) {
  const filePath = path.join(userDataPath, `${key}.json`) // 使用 path.join 拼接路径
  try {
    const content = await fs.promises.readFile(filePath, 'utf8') // 使用 fs.promises
    return JSON.parse(content) // 解析 JSON 并返回
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`File ${filePath} does not exist. Returning null.`)
      return null // 文件不存在时返回 null
    }
    console.error('Error loading data:', err)
    throw err // 抛出错误
  }
}

//TODO 登陆逻辑：请求返回auth_temp_code,接着发送请求，获取cookie，持久化存储
async function loginVincent(token) {
  const myHeaders = new Headers()
  myHeaders.append('priority', 'u=1, i')
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)')
  myHeaders.append('content-type', 'application/json;charset=UTF-8')
  myHeaders.append('Accept', '*/*')
  myHeaders.append('Host', 'vincent2.lexinshengwen.com')
  myHeaders.append('Connection', 'keep-alive')
  //设置请求头
  const raw = '{"uacLoginToken":"' + token + '"}\n'
  //设置请求体body
  console.log(raw) //test

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
    credentials: 'include'
  } //请求方法

  return await fetch('https://vincent2.lexinshengwen.com/vincent/v1/user/uac/login', requestOptions)
    .then((response) => {
      const cookieHeaders = response.headers.get('Set-Cookie')
      console.log('获取到的cookie为：' + cookieHeaders)
      console.log('即将开始存储')
      loginCookie = cookieHeaders
      saveLoginCookie(cookieHeaders)
      return response.json()
    })
    .catch((error) => console.log('error', error))
}

/**
 * 储存LoginCookie
 * @param cookieHeaders
 */
function saveLoginCookie(cookieHeaders) {
  const cookies = parseCookies(cookieHeaders)
  cookies.forEach((cookie) => {
    const expirationDate = new Date().getTime() / 1000 + 86400 * 365
    session.defaultSession.cookies
      .set({
        url: 'https://vincent2.lexinshengwen.com',
        name: cookie.name,
        value: cookie.value,
        expirationDate: expirationDate
      })
      .then((r) => {
        console.log(r)
      })
    console.log('操作对象：' + cookie.name)
  })
  // console.log('cookie=>'+cookies);
}

/**
 * 解析登录的Cookie
 * @param cookieString
 * @returns {*}
 */
function parseCookies(cookieString) {
  const cookieStrings = cookieString.split(/,\s+(?=\w+=)/)
  const cookie = cookieStrings.map((cookieStr) => {
    const parts = cookieStr.split(/;\s*/)
    const nameValue = parts[0]
    const eqIndex = nameValue.indexOf('=')
    const name = nameValue.slice(0, eqIndex)
    let value = nameValue.slice(eqIndex + 1)
    return { name, value }
  })
  return cookie
}

/**
 * 发起请求，获取账户下的JSON数据
 * @returns {Promise<any>}
 */
async function getData() {
  //获取当前Session下中所有cookie
  const cookies = await session.defaultSession.cookies.get({
    url: 'https://vincent2.lexinshengwen.com'
  })
  // cookies.forEach((cookie) => {
  //   console.log("cookie=>"+cookie.name+cookie.value);
  // })

  const cookieStrings = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(';')
  console.log('cookies:' + cookieStrings)
  const myHeaders = new Headers()
  myHeaders.append('if-none-match', '"eca5cf370dff81f1154d6fd068bc18d8ca64b227"')
  myHeaders.append('priority', 'u=1, i')
  myHeaders.append('vincent_client_platform', 'web')
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)')
  myHeaders.append('Accept', '*/*')
  myHeaders.append('Host', 'vincent2.lexinshengwen.com')
  myHeaders.append('Connection', 'keep-alive')
  myHeaders.append('Cookie', cookieStrings)

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include'
  }
  const response = await fetch(
    'https://vincent2.lexinshengwen.com/vincent/v1/material/my?limit=50&offset=0&image_paint_from=&' +
      'image_outside_painter=&demand_intermediary=&demand_audit_painter=&demand_content_painter=&demand_color_painter=' +
      '&demand_line_painter=&demand=&demand_creator=&material=&fuzzy_search_numbers=&image=&cms_id=&image_paint_type=' +
      '&image_size_type=&image_production_type=&demand_status=&demand_deadline_for_lining_start=' +
      '&demand_deadline_for_lining_end=&demand_complete_time_start=&demand_complete_time_end=&demand_platform=' +
      '&demand_module=&demand_category=&demand_tag=&material_platform=&material_module=&material_category=&material_tag=' +
      '&material_supplement_tag=&material_content_tag=&demand_group=&demand_illustrator=&material_status=' +
      '&create_time_range=&publish_time_range=',
    requestOptions
  )
  if (!response.ok) {
    console.log(response.body)
  }
  return response.json()
}

/**
 * 清理所有的Cookie
 */
function clearCookie() {
  session.defaultSession
    .clearStorageData({
      storages: [
        'cookies',
        'localstorage',
        'sessionstorage',
        'cache',
        'indexdb',
        'websql',
        'fileSystems'
      ]
    })
    .then(() => {
      console.log('COOKIE=>' + '全部清理完毕')
    })
}

//TODO 检查Cookie是否过期 -- 如果没有过期则保持登陆状态
async function checkCookie() {
  let status = false
  await session.defaultSession.cookies.get({}).then((cookies) => {
    console.log('COOKIE[]=>' + cookies)
    cookies.forEach((cookie) => {
      console.log('COOKIE_NAME=>' + cookie.name)
      const target = 'user'
      if (cookie.name.toString() === target) {
        status = true
      }
    })
  })
  return status
}

//TODO 循环检查函数：在后台运行，每隔5s检查一次 （需要在窗口关闭时清理）（没有使用）
function checkStatus() {
  checkInterval = setInterval(checkCookie, 5000)
}

//TODO登陆函数
// @param：code
async function login(code) {
  const cookie = await fetch(
    `https://work.learnings.ai/work/v1/feishu_login?tmp_auth_code=${code}`,
    {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        priority: 'u=1, i',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      referrer: `https://work.learnings.ai/login/?next=https%3A%2F%2Fvincent2.lexinshengwen.com%2F%23%2Fdingding%3Fredirect%3D%252Fdashboard&code=${code}`,
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'include'
    }
  ).then((response) => {
    console.log('hhh:' + response)
    for (const [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`)
    }

    // If you're specifically looking for cookies
    const cookies = response.headers.get('Set-Cookie')
    if (cookies) {
      console.log('Cookies:', cookies)
    }
    return cookies
  })
  setCookieHeader = cookie
  console.log('test:' + setCookieHeader)
}

//TODO 存储Cookie【飞书】
function parseSetCookie(setCookieHeader) {
  const cookies = []
  setCookieHeader.split('\n').forEach((line) => {
    const parts = line.split(';')
    const [name, value] = parts[0].trim().split('=')
    const cookie = { name, value }

    parts.slice(1).forEach((part) => {
      const [key, val] = part.trim().split('=')
      switch (key.toLowerCase()) {
        case 'expires':
          cookie.expirationDate = new Date(val).getTime() / 1000 // 转换为 Unix 时间戳
          break
        case 'domain':
          cookie.domain = val
          break
        case 'path':
          cookie.path = val
          break
        case 'secure':
          cookie.secure = true
          break
        case 'httponly':
          cookie.httpOnly = true
          break
      }
    })

    cookies.push(cookie)
  })

  return cookies
}

//TODO 获取登陆TOKEN来登陆
async function getToken() {
  const cookieHeader = await session.defaultSession.cookies
    .get({ url: 'https://work.learnings.ai' })
    .then((cookies) => {
      const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(';')
      console.log(cookieHeader)
      return cookieHeader
    })

  const myHeaders = new Headers()
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)')
  myHeaders.append('Accept', '*/*')
  myHeaders.append('Host', 'work.learnings.ai')
  myHeaders.append('Connection', 'keep-alive')
  myHeaders.append('Cookie', cookieHeader)

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    credentials: 'include'
  }
  return await fetch(
    'https://work.learnings.ai/work/v1/sso/req?next=https://vincent2.lexinshengwen.com/',
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      console.log(result)
      const res = result.data
      console.log(res)
      return res
    })
    .catch((error) => console.log('error', error))
}

//TODO 打印Session中的全部Cookie
function getAllCookies() {
  let ses = session.defaultSession

  ses.cookies.get({}).then((cookies) => {
    console.log(cookies)
  })
}

//监听webview新建的窗口
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      contents.loadURL(url)
      return { action: 'deny' }
    })
  }
})

//TODO 提交填色
async function upload(id) {
  const cookieHeader = await session.defaultSession.cookies
    .get({ url: 'https://vincent2.lexinshengwen.com' })
    .then((cookies) => {
      const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(';')
      console.log(cookieHeader)
      return cookieHeader
    })
  const myHeaders = new Headers()
  myHeaders.append('priority', 'u=1, i')
  myHeaders.append('vincent_client_platform', 'web')
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)')
  myHeaders.append('content-type', 'application/json;charset=UTF-8')
  myHeaders.append('Accept', '*/*')
  myHeaders.append('Host', 'vincent2.lexinshengwen.com')
  myHeaders.append('Connection', 'keep-alive')
  myHeaders.append('Cookie', cookieHeader)
  console.log(id)
  const raw = '{"material_id":"' + id + '"}\n'

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  }

  return fetch('https://vincent2.lexinshengwen.com/vincent/v1/material/to_coloring', requestOptions)
    .then((response) => response.json())
    .catch((error) => console.log('error', error))
}

//TODO 主程序：创建Window窗口
function createWindow() {
  //TODO 创建browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      nodeIntegration: true, // 启用 Node.js 集成
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    resizable: false //TODO 关闭可调整窗口
  })

  //TODO 创建菜单栏
  //   mainWindow.webContents.openDevTools();
  const menu = Menu.buildFromTemplate([
    {
      label: '功能',
      submenu: [
        {
          click: () => {
            mainWindow.webContents.send('update-counter', 1)
            console.log('1')
            mainWindow.reload()
          },
          label: '刷新'
        },
        {
          click: async () => {},
          label: 'hello'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  //TODO 监听渲染进程‘set-window-size’  ：设置窗口大小
  ipcMain.on('set-window-size', () => {
    mainWindow.hide()
    mainWindow.setSize(1750, 1078)
    mainWindow.setMinimumSize(1550, 1000)
    mainWindow.setResizable(true)

    mainWindow.show()

    mainWindow.center()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  //TODO ipcMain.on监听

  //TODO channel:up-window
  ipcMain.on('up-window', async () => {
    const isValid = checkCookie()
    console.log(isValid)
    mainWindow.webContents.send('status-User', isValid)
    console.log('channel:up-window:状态发送成功')
  })
  //TODO channel:check-cookie
  ipcMain.on('check-cookie', async () => {
    mainWindow.webContents.send('check-cookie', true)
    console.log('channel:check-cookie:发送状态')
  })
  //TODO channel:get-vincentPDFData
  // TODO auth:lujianfeng time:2025-02-21 23:49
  // TODO Des:将获取数据改造成延时循环器
  // @const loopSwitch:true
  const loop = async () => {
    const json = await getData()
    console.log(json)
    mainWindow.webContents.send('getPDFData', json)
    return true
  }
  let loopSwitch = null
  ipcMain.on('get-vincentPDFData', async () => {
    console.log(`${Date.now().toString()}:开始执行`)
    loop().then((loopStatus) => {
      const beginTime = new Date().getTime()
      if (loopStatus) {
        clearInterval(loopSwitch)
        loopSwitch = setInterval(async () => {
          await loop()
        }, 7000)
      }
      const endTime = new Date().getTime()
      console.log(endTime - beginTime)
    })
  })

  //TODO channel:set-vincentPDFData-Off
  // TODO auth:lujianfeng time:2025-02-21 23:49
  // TODO Des:停止获取数据
  // @const loopSwitch:false
  ipcMain.on('get-vincentPDFData-Off', () => {
    clearInterval(loopSwitch)
    console.log(`${Date.now().toString()}:停止执行`)
  })

  //TODO channel:清除cookie
  ipcMain.on('clear-cookie', () => {
    clearCookie()
  })
}

//TODO channel:scanQr：扫码登录【飞书】
ipcMain.on('scanQr', () => {
  createModalWindow()
})

ipcMain.handle('submit-origin', (event, id) => {
  return upload(id)
    .then((result) => {
      if (result.status.message === 'OK') {
        return '提交成功'
      } else return '提交失败'
    })
    .catch((err) => {
      return err
    })
})

ipcMain.on('close-doc', (event, id) => {
  closeAIDocument(id)
})

ipcMain.on('show-window', () => {
  mainWindow.show()
  alert('ok')
})
/**
 * 保存资源
 */
ipcMain.handle('save-origin', (event, args) => {
  const controller = new AbortController()
  const single = controller.signal
  const timeoutID = setTimeout(() => controller.abort(), 50000)
  return fetch('http://127.0.0.1:5000/save', {
    signal: single,
    method: 'GET'
  })
    .then((res) => {
      //保存后需要关闭AI中的pdf文档,从渲染进程中传输
      closeAIDocument(args)
      clearTimeout(timeoutID)
      mainWindow.show()
      return res.json()
    })
    .catch((err) => {
      console.log('遇到错误')
    })
})

const open_file = async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'pdf',
        extensions: ['pdf']
      }
    ]
  })

  if (!result.canceled && result.filePaths.length > 0) {
    console.log('Selected file:', result.filePaths[0])
    return result.filePaths[0] // 返回文件路径
  } else {
    console.log('No file selected.')
    return false // 取消选择或未选择文件
  }
}

ipcMain.handle('open-file', async (event, args) => {
  return open_file()
})
ipcMain.handle('download-file', async (_, { url, suggestedName }) => {
  console.log(url)
  try {
    // 获取保存路径
    const defaultPath = path.join(app.getPath('downloads'), suggestedName)
    const result = dialog.showSaveDialogSync({
      defaultPath,
      title: '保存文件',
      buttonLabel: '保存'
    })

    if (!result) return { status: 'cancelled' }

    // 下载文件
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    })

    // 写入文件
    fs.writeFileSync(result, Buffer.from(response.data))
    await openWithAI(result)
    return { status: 'success', path: result }
  } catch (error) {
    console.log(url)

    return { status: 'error', message: error.message }
  }
})

let childWindow
ipcMain.on('create-window', () => {
  if (!childWindow) {
    childWindow = new BrowserWindow({
      width: 500,
      height: 400,
      parent: mainWindow, // 让它成为主窗口的子窗口
      modal: true, // 模态窗口（主窗口不可交互）
      show: false, // 先隐藏
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      childWindow.loadURL('https://localhost:5173/context')
    } else {
      childWindow.loadFile(join(__dirname, '../renderer/index.html#/home'))
    }
    childWindow.once('ready-to-show', () => childWindow.show())

    childWindow.on('closed', () => {
      childWindow = null
    })
  }
})
ipcMain.handle('save-svg', async (event, svgString, num) => {
  try {
    // 显示保存文件对话框
    const result = await dialog.showSaveDialog({
      title: '保存 SVG 文件',
      defaultPath: `${num}.svg`, // 默认文件名
      filters: [
        { name: 'SVG 文件', extensions: ['svg'] } // 文件类型过滤器
      ]
    })

    // 如果用户选择了保存路径
    if (!result.canceled && result.filePath) {
      // 将 SVG 字符串写入文件
      fs.writeFileSync(result.filePath, svgString)
      await openWithAI(`${result.filePath}`)
      return { success: true, filePath: result.filePath }
    } else {
      return { success: false, message: '用户取消保存' }
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

async function openWithAI(filePath) {
  exec(`open -a "Adobe Illustrator" "${filePath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Error opening file in Illustrator:', err)
      return
    }
    console.log('File opened successfully in Illustrator:', stdout)
  })
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test

  ipcMain.handle('right-menu', (event, args) => {
    if (args.params.mediaType === 'image') {
      return new Promise((resolve) => {
        const menu = Menu.buildFromTemplate([
          {
            label: '复制图片',
            click: async () => {
              mainWindow.webContents.send('state')
              console.log(`正在复制图片: ${args.params.srcURL}`)
              try {
                // 获取图片 Base64
                const base64 = await getBase64FromURL(args.params.srcURL)
                console.log('已获取图片 Base64')

                // 直接使用 `createFromDataURL`
                const image = nativeImage.createFromDataURL(base64)

                // 复制到剪切板
                clipboard.writeImage(image)
                console.log('图片复制成功！')

                resolve({ success: true, message: '图片复制成功！' })
              } catch (error) {
                console.error('复制图片失败:', error)
                resolve({ success: false, message: '复制图片失败' })
              }
            }
          },
          {
            label: '下载图片到本地',
            click: () => {
              console.log('下载图片功能待实现')
              resolve({ success: true, message: '下载功能待实现' })
            }
          }
        ])
        menu.popup()
      })
    }
  })

  ipcMain.on('notification', (event, args) => {
    new Notification({
      title: '通知',
      body: args
    }).show()
  })

  //TODO app退出

  ipcMain.on('exit-ass', () => {
    clearCookie()
    mainWindow.close()
  })

  ipcMain.on('ping', () => {
    fetch('https://http.cat/200').then((res) => {
      console.log(res)
    })

    console.log('pong')
  })
  /**
   * 取消保存
   */
  ipcMain.on('cancel', () => {
    fetch('http://127.0.0.1:5000/cancel').then((res) => {
      console.log(res)
    })
  })
  ipcMain.on('auth-code', async (event, args) => {
    modalWindow.close()
    mainWindow.webContents.send('set-loading', true)
    console.log(args)
    await login(args)
    getAllCookies()

    // 解析并存储 Cookie
    const cookies = parseSetCookie(setCookieHeader)
    const defaultSession = session.defaultSession

    cookies.forEach((cookie) => {
      defaultSession.cookies
        .set({
          url: `https://work.learnings.ai`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expirationDate: cookie.expirationDate,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly
        })
        .then(() => {
          console.log(`Cookie ${cookie.name} 存储成功`)
        })
        .catch((error) => {
          console.error(`存储 Cookie ${cookie.name} 失败:`, error)
        })
    })

    const token = await getToken()
    const json = await loginVincent(token)
    console.log(json)
    const data = { token: token }
    saveData('token', data).then(() => {})

    if (json.status.code === 0) {
      console.log(json.status.message)

      mainWindow.webContents.send('set-loading', true)
    }
  })

  //TODO 双向IPC通信

  ipcMain.handle('get-name', async (event, args) => {
    const token_file = await loadData('token')
    return loginVincent(token_file.token)
      .then((result) => {
        console.log(result)
        return result
      })
      .then((res) => {
        return res.data.name
      })
  })
  ipcMain.handle('get-token', async (event, args) => {
    return await loadData('token')
  })

  //TODO channel:help
  ipcMain.handle('help', async (event, args) => {
    await dialog.showMessageBox({ message: args })

    const res = await fetch('https://http.cat/200').then((res) => {
      return res
    })
    console.log(res)

    const result = login(args).then((result) => {
      return result
    })
    getAllCookies()
    return result
  })
  //TODO channel:status-User
  ipcMain.handle('status-User', async () => {
    console.log('channel:status-User:start')
    const status = await checkCookie()
    console.log(status)
    return status
  })

  createWindow()
  //TODO 测试
  // getAllCookies()
  // //TODO 测试
  // getData().then(r => console.log(r))

  //TODO 设置Docker图标
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, '../assets/icon.png')
    app.dock.setIcon(iconPath)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

let modalWindow

function createModalWindow() {
  // 如果已经打开了模态窗口，直接返回，不再创建
  if (modalWindow) {
    modalWindow.focus()
    return
  }

  modalWindow = new BrowserWindow({
    parent: mainWindow, // 让它成为主窗口的子窗口
    modal: true, // 设置为模态窗口
    width: 400,
    height: 650,
    webPreferences: {
      preload: join(__dirname, '../preload/check.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    resizable: false
  })

  // 模态窗口打开指定的页面
  modalWindow.loadURL(
    'https://accounts.feishu.cn/accounts/auth_login/oauth2/authorize?client_id=cli_a441a3c93531500b&response_type=code&state=&redirect_uri=https%3A%2F%2Fwork.learnings.ai%2Flogin%2F%3Fnext%3Dhttps%253A%252F%252Fvincent2.lexinshengwen.com%252F%2523%252Fdingding%253Fredirect%253D%25252Fdashboard&'
  )
  modalWindow.setWindowButtonVisibility(true)
  mainWindow.on('focus', () => {
    if (modalWindow) {
      modalWindow.close()
      modalWindow = null
    }
  })
  modalWindow.on('closed', () => {
    modalWindow = null // 窗口关闭时，释放资源
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
  clearInterval(checkInterval)
  app.quit()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
