import React, { useEffect } from 'react'

function TablePro(key) {
  // #app > div > div.main-container > section > div > div.el-dialog__wrapper.main-form > div > div.el-dialog__body > div:nth-child(1) > div > div:nth-child(5) > div:nth-child(1) > button
  useEffect(() => {
    const webview = document.getElementById('webview')
    if (webview) {
      webview.addEventListener('dom-ready', () => {
        console.log('Webview is ready!')

        webview.insertCSS(`
          #app > div > div.main-container > div > div {
            display: none !important;
          }
          #app > div > div.sidebar-container{
            display: none !important;
          }
          #app > div > div.main-container > section > div > form{
          display: none !important;
          }
          #app > div > div.main-container > section > div > div:nth-child(4){
          display: none !important;
          }
          #app > div > div.main-container > section > div > div:nth-child(7){

          display: none !important;
          }
          #app > div > div.main-container > section > div > div:nth-child(6) > div:nth-child(1) > div.el-card__body > div:nth-child(3) > button:nth-child(1){
          display: none !important;
          }

        `)
      })
    }
  }, [])
  const url = `https://vincent2.lexinshengwen.com/#/demand/edit/${key.name}`
  console.log(url)

  return (
    <>
      <div style={{ height: '800px', borderRadius: '20px' }}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <webview id="webview" src={url} style={{ width: '100%', height: '100%' }} allowpopups />
      </div>
    </>
  )
}

export default TablePro
