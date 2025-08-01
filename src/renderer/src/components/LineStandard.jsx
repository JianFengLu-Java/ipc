import React, { useState, useEffect, useRef } from 'react'
import { ProCard } from '@ant-design/pro-components'

const LineStandard = () => {
  const webviewRef = useRef(null)
  useEffect(() => {
    const webview = document.getElementById('webview')
    if (webview) {
      webview.addEventListener('dom-ready', () => {})
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
            electron.ipcRenderer.send('notification', result.message)
          }
        })
      })
    }
  }, [])
  return (
    <>
      <div style={{ display: 'flex', height: '85vh', minHeight: '800px' }}>
        <ProCard style={{ width: '100%', flex: 1, borderRadius: 25 }} bordered={true}>
          <div style={{ flex: 1 }}>
            <h3>
              <b style={{ color: 'red' }}>注意</b>严格执行生产标准
            </h3>
          </div>
          <webview
            id="webview"
            ref={webviewRef}
            style={{
              width: '100%',
              flex: 1,
              height: '100%',
              minHeight: '600px',
              paddingBottom: '80px'
            }}
            src={'https://learnings.feishu.cn/sheets/ElHzsIXZahsP9ltJlLpcuxJuneA?sheet=ke7oVR'}
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            allowpopups="true"
          ></webview>
        </ProCard>
      </div>
    </>
  )
}
export default LineStandard
