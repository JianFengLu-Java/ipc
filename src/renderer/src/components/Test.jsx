import React, { useEffect } from 'react'
import { ProCard } from '@ant-design/pro-components'

function Test() {
  useEffect(() => {
    const webview = document.getElementById('webview2')
    if (webview) {
      webview.addEventListener('dom-ready', () => {
        console.log('Webview is ready!')

        webview.insertCSS(`
  .el-input__inner {
    width: 150px !important;
  }
  .el-textarea__inner{
    width: 150px !important;
    height: 32px !important;
    }
        #app > div > div.main-container > section > div > form > div:nth-child(5) > div > div{
        display: none !important;
        }
        #app > div > div.main-container > section > div > form > div:nth-child(3) > div > div.tips{
        display: none !important;
        }
        #app > div > div.main-container > section > div > form > div:nth-child(2) > div > div.tips{
        display: none !important;
        }
          #app > div > div.main-container > div > div {
            display: none !important;
          }
          #app > div > div.sidebar-container{
            display: none !important;
          }
          #app > div > div.main-container > section > div > form > div:nth-child(1) > div > div.upload-container > div:nth-child(3){
          display: none !important;
          }
          #app > div > div.main-container > section > div > form > div:nth-child(1) > div > div.upload-container > div:nth-child(4){
          display: none !important;
          }`)
      })
    }
  }, [])
  return (
    <>
      <ProCard style={{ height: '85vh', borderRadius: '25px', overflow: 'auto' }} bordered={true}>
        <webview
          id="webview2"
          src={'https://vincent2.lexinshengwen.com/#/vectorize'}
          style={{ width: '100%', height: '100%', overflow: 'auto' }}
          allowpopups
        />
      </ProCard>
    </>
  )
}

export default Test
