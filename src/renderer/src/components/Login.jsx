import {
  Button,
  Card,
  Flex,
  Image,
  Input,
  message,
  Skeleton,
  Avatar,
  Divider,
  Carousel,
  Spin
} from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  window.electron.ipcRenderer.removeAllListeners('set-loading')
  window.electron.ipcRenderer.removeAllListeners('getPDFData')

  let navigate = useNavigate()

  useEffect(() => {
    message.config({
      top: 50
    })
    window.electron.ipcRenderer.invoke('status-User').then((data) => {
      console.log(data)
      if (data) {
        setDisabled(data)
        setValue('正在登陆')
        message.success('已经登陆，即将跳转...')
        setLoading(true)
        const jump = setTimeout(() => {
          navigate('/home')
        }, 4000)
      }
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('status-User')
    }
  }, [])

  //TODO 事件监听
  window.electron.ipcRenderer.on('getPDFData', (event, args) => {
    console.log(args)
  })
  window.electron.ipcRenderer.removeAllListeners('status-User')
  const now = new Date()
  const get_PDFData = () => {
    window.electron.ipcRenderer.send('get-vincentPDFData')
  }
  window.electron.ipcRenderer.on('set-loading', (event, args) => {
    if (args) {
      setLoading(true)
      setDisabled(args)
      setValue('正在登陆')
      message.success('登陆成功')
      setLoading(true)
      setTimeout(() => {
        navigate('/home')
      }, 4000)
    }
  })

  const contentStyle = {
    margin: 0,
    height: '160px',
    color: '#000',
    lineHeight: '160px',
    textAlign: 'center',
    width: '100%'
  }

  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [value_a, setValue] = useState('通过飞书登陆')

  const { TextArea } = Input

  const sendHelp = async () => {
    setLoading(true)
    message.config({
      top: 50
    })
    message.info(666)
    const temp = {
      name: 'zhangsan'
    }
    const input = document.getElementById('input').value
    window.electron.ipcRenderer.invoke('help', input).then((res) => {
      console.log(res)
      if (res['status']['code'] == 500) {
        message.error(res['status']['code'])
        setLoading(false)
      } else if (res['status']['code'] == 0) {
        console.log(res['data']['name'])
        message.success(res['data']['name'])
        setLoading(false)
        setText(res['data']['name'])
        setDisabled(true)
        setValue('已登陆')
        window.electron.ipcRenderer.send('notification', '登陆成功！')
        navigate('/home')
      }
    })
  }

  const up_window = () => {
    window.electron.ipcRenderer.send('up-window')
  }
  const exit_window = () => {
    window.electron.ipcRenderer.send('exit-ass')
  }

  const scanQr = () => {
    window.electron.ipcRenderer.send('scanQr')
  }

  const clearCookie = () => {
    window.electron.ipcRenderer.send('clear-cookie')
  }

  return (
    <>
      <div className={'top'}></div>
      {/*<div className={'pic_display'}>*/}

      {/*  <Carousel autoplay>*/}
      {/*    <div>*/}
      {/*      <img src={'https://http.cat/200'} style={contentStyle}></img>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <img src={'https://http.cat/201'} style={contentStyle}></img>*/}

      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <img src={'https://http.cat/202'} style={contentStyle}></img>*/}

      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <img src={'https://http.cat/203'} style={contentStyle}></img>*/}

      {/*    </div>*/}
      {/*  </Carousel>*/}

      {/*</div>*/}
      <div className="container">
        <Spin spinning={loading} delay={500} tip={'正在加载...'}>
          <Card title={'登陆Hook2PDF'} style={{ width: '350px' }}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <Avatar size={100} shape={'square'} src={'./icon.png'} />
            </div>

            <Flex justify={'center'} vertical={true} gap={12}>
              <Button
                id={'btn_login'}
                type="primary"
                disabled={disabled}
                onClick={scanQr}
                size={'large'}
                loading={loading}
              >
                {value_a}
              </Button>
              <Button
                id={'btn_login'}
                type="default"
                disabled={disabled}
                onClick={clearCookie}
                size={'large'}
              >
                删除登录信息
              </Button>
              <Button
                id={'btn_login'}
                danger
                type="default"
                disabled={disabled}
                onClick={exit_window}
                size={'large'}
              >
                退出
              </Button>
              {/*<Button onClick={up_window}>窗口大小</Button>*/}
              {/*<Button onClick={exit_window}>退出</Button>*/}
              {/*<Button onClick={get_PDFData}>获取数据</Button>*/}

              {/*<Skeleton action loading={loading}>*/}
              {/*  <p>用户名：{text}</p>*/}
              {/*</Skeleton>*/}
            </Flex>
          </Card>
        </Spin>
      </div>
      <div className={'bottom'}>
        <p className={'bottom_text'}>@Lujianfeng | {now.getFullYear()} | </p>
      </div>
    </>
  )
}

export default Login
