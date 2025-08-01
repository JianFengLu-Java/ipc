import React, { useEffect, useRef, useState } from 'react'
import { ProCard } from '@ant-design/pro-components'
import { ConfigProvider, message } from 'antd'

const Material = ({ height, margin, display }) => {
  const webviewRef = useRef(null)
  const [userName, setUserName] = useState('加载ing')
  electron.ipcRenderer.removeAllListeners('state')

  electron.ipcRenderer.on('state', () => {
    message.info('正在复制...请稍等')
  })
  const saveLastURL = (url) => {
    localStorage.setItem('lastVisitedURL_Material', url)
  }

  useEffect(() => {
    electron.ipcRenderer.invoke('get-name').then((data) => {
      setUserName(data)
    })
    const webview = document.getElementById('webview3')
    if (webview) {
      webview.addEventListener('dom-ready', () => {
        webview.insertCSS(`
        #mainContainer > div.navigation-bar-wrapper{
        display: none !important;
        }
      `)
      })
      webview.addEventListener('will-navigate', () => {
        webview.insertCSS(`
    #mainContainer > div.navigation-bar-wrapper {
      display: none !important;
    }
  `)
      })
      webview.addEventListener('did-navigate', (event) => {
        saveLastURL(event.url)
      })

      webview.addEventListener('did-navigate-in-page', (event) => {
        saveLastURL(event.url)
      })

      // 读取存储的 URL
      webview.src =
        localStorage.getItem('lastVisitedURL_Material') ||
        'https://learnings.feishu.cn/sheets/LFv1sy5aEhiCwCt704mcpgz9nYc?sheet=FfAQGO'

      webview.addEventListener('will-navigate', (e) => {
        webview.src = e.url
      })
      webview.addEventListener('new-window', (e) => {
        webview.src = e.url
      })
      webview.addEventListener('context-menu', (e) => {
        console.log('右键')
        e.preventDefault()
        console.log(e.params.srcURL)
        electron.ipcRenderer.invoke('right-menu', e).then(async (result) => {
          if (result.success) {
            message.success('复制成功！')
          }
        })
      })
    }
  }, [])

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            borderRadiusLG: 18
          }
        }}
      >
        <div style={{ display: 'flex', height: `85vh`, minHeight: '800px', overflow: 'visible' }}>
          <ProCard
            style={{ width: '100%', flex: 1, display: 'flex', borderRadius: 25 }}
            bordered={true}
          >
            <webview
              id="webview3"
              ref={webviewRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '600px',
                paddingBottom: `${margin}`,
                overflow: 'visible'
              }}
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
              allowpopups="true"
            ></webview>
          </ProCard>
        </div>
      </ConfigProvider>
    </>
  )
}
export default Material
