import { useEffect, useState } from 'react'
import { DefaultFooter, PageContainer, ProCard, ProLayout } from '@ant-design/pro-components'
import { Avatar, Button, Card, Divider, Layout, Menu, Modal, Popover, Slider, Splitter } from 'antd'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import {
  LogoutOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  CloudDownloadOutlined,
  SmileFilled,
  UserOutlined,
  BarChartOutlined,
  TabletFilled,
  InteractionOutlined,
  ToolOutlined
} from '@ant-design/icons'
import TablePro from './TablePro'
import DownLoad from './DownLoad'
import BarChart from './BarChart.jsx'
import LineStandard from './LineStandard'
import Test from './Test'
import Split from './Split'
import Material from './Material'
import SVGCanvas from './SVGCanvas'

function Home() {
  const [titleName, setTitleName] = useState('主页')
  let navigate = useNavigate()
  window.electron.ipcRenderer.removeAllListeners('getPDFData')
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [userName, setUserName] = useState('加载ing')
  const [serverStatus, setServerStatus] = useState('加载中...')
  // const socket = io("http://127.0.0.1:5000",{
  //   transports: ["websocket"],
  //   reconnection: true,  // 启用自动重连
  //   reconnectionAttempts: 10,  // 最多尝试 10 次
  //   reconnectionDelay: 3000
  // })
  // socket.on('connect', (data) => {
  //   setServerStatus('连接成功✅')
  // })
  // socket.on('disconnect', (data) => {
  //   setServerStatus('服务器断开')
  // })
  const getPDFData = () => window.electron.ipcRenderer.send('get-vincentPDFData')

  useEffect(() => {
    window.electron.ipcRenderer.send('set-window-size')
    electron.ipcRenderer.invoke('get-name').then((data) => {
      setUserName(data)
    })
  }, [])
  const exit = () => {
    Modal.confirm({
      title: '提示',
      content: '确定退出登录并关闭软件吗？',
      onOk: () => {
        window.electron.ipcRenderer.send('exit-ass')
      }
    })
  }

  const [pathname, setCurrentPath] = useState('/main') // 用来管理当前页面的状态

  const renderContent = () => {
    switch (pathname) {
      case '/main':
        return <Split />
      case '/download':
        return <DownLoad />
      case '/setting':
        return <LineStandard />
      case '/test':
        return <Material />
      case '/splitter':
        return <Split />
      case '/svgTools':
        return <SVGCanvas />
      default:
        return <BarChart />
    }
  }

  window.electron.ipcRenderer.on('getPDFData', (event, args) => {
    console.log(args)
  })
  return (
    <>
      <div className="top"></div>
      <ProLayout
        location={{ pathname }}
        layout={'mix'}
        title={'Hook 2 PDF'}
        fixedHeader={true}
        bgLayoutImgList={true}
        token={{
          header: {
            heightLayoutHeader: 95
          }
        }}
        headerRender={() => {
          const context = () => {
            return (
              <>
                <div className="list">
                  <Button size={'middle'} type={'text'} icon={<UserOutlined />}>
                    个人信息
                  </Button>
                  <Button
                    size={'middle'}
                    danger
                    type={'text'}
                    icon={<LogoutOutlined />}
                    onClick={exit}
                  >
                    退出登陆
                  </Button>
                </div>
              </>
            )
          }
          return (
            <>
              <div className="headerBar">
                <img className={'image'} src={'./Logo.png'} alt="logo" />
                <div className={'mid-div-test'}>
                  <h2 style={{ padding: 8, color: '#a7c2cf' }}>Hook 2 PDF {titleName}</h2>
                </div>

                <Popover placement="bottom" arrow={false} content={context}>
                  <Button
                    type={'text'}
                    size={'large'}
                    icon={<Avatar size={35} src={'https://http.cat/200'}></Avatar>}
                  >
                    {userName}
                  </Button>
                </Popover>
              </div>
            </>
          )
        }}
        collapsed={false}
        collapsedButtonRender={false}
        siderWidth={220}
        route={{
          routes: [
            {
              path: '/main',
              name: <b>查看需求&SVG转换</b>,
              icon: <InteractionOutlined />,
              component: './Welcome'
            },
            {
              path: '/download',
              name: <b>需求操作</b>,
              icon: <ToolOutlined />,
              component: './Admin'
            },
            // {
            //   path: '/upload',
            //   name: '上传',
            //   icon: <CloudUploadOutlined />,
            //   component: './Admin',
            // },
            {
              path: '/setting',
              name: <b>生产注意事项</b>,
              icon: <SettingOutlined />,
              component: './Setting'
            },
            {
              path: '/test',
              name: <b>素材库</b>,
              icon: (
                <b>
                  <BarChartOutlined />
                </b>
              ),
              component: './Test'
            },
            {
              path: '/svgTools',
              name: <b>SVG</b>,
              component: './Splitter'
            }
          ]
        }}
        menuItemRender={(item, dom) => (
          <a
            onClick={() => {
              setCurrentPath(item.path || '/welcome')
              setTitleName(item.name)
            }}
          >
            {dom}
          </a>
        )}
        menu={{
          type: 'group',
          // collapsedShowTitle: true,
          hideMenuWhenCollapsed: false
        }}
      >
        <PageContainer
          title={false}
          style={{ paddingBottom: '0', marginTop: '-35px', minHeight: '565px' }}
        >
          {renderContent()}
        </PageContainer>
      </ProLayout>
      <div className="bottom">
        <p className={'bottom_text'}>Lujianfeng | Hook 2 PDF Version 2.0.4</p>
        <div style={{ flex: 1 }}></div>
        <p className={'bottom_text'}>状态：{serverStatus} - </p>
        <p className={'bottom_text'}>@2025</p>
      </div>
    </>
  )
}

export default Home
