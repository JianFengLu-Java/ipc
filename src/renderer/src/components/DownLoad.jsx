import {
  Card,
  Row,
  Statistic,
  Col,
  Table,
  Button,
  notification,
  ConfigProvider,
  Tag,
  Image,
  Flex,
  Popover,
  Watermark,
  Badge,
  Divider,
  Space,
  Descriptions,
  Collapse,
  Modal,
  message,
  Spin,
  Dropdown,
  Tooltip
} from 'antd'
import {
  DatabaseFilled,
  SafetyCertificateFilled,
  CloseCircleFilled,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckOutlined,
  DownOutlined,
  FilePdfFilled,
  UpCircleFilled,
  CheckCircleFilled
} from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { ProCard } from '@ant-design/pro-components'
import { io } from 'socket.io-client'
import TablePro from './TablePro'

let sum = 0
message.config({
  top: 100
})

function formatTimestamp(timestamp) {
  const date = new Date(timestamp) // 创建 Date 对象

  const year = date.getFullYear() // 获取年份
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // 获取月份，注意月份从0开始，需要加1并格式化为两位
  const day = date.getDate().toString().padStart(2, '0') // 获取日期并格式化为两位
  const hours = date.getHours().toString().padStart(2, '0') // 获取小时并格式化为两位
  const minutes = date.getMinutes().toString().padStart(2, '0') // 获取分钟并格式化为两位
  const seconds = date.getSeconds().toString().padStart(2, '0') // 获取秒钟并格式化为两位

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

let temp_origin_num = 0

function DownLoad() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [submit_id, setSubmit_id] = useState('')
  const [modal, contextHolder] = Modal.useModal()
  const [token, setToken] = useState('')

  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const divRef = useRef(null)
  /**
   * 给后端进行websocket通信，如果服务器断开，则无法使用上传测试功能
   *
   */
  const [serverStatus, setServerStatus] = useState(true)
  // const socket = io("http://127.0.0.1:5000",{
  //   transports: ["websocket"],
  //   reconnection: true,  // 启用自动重连
  //   // reconnectionAttempts: 10,  // 最多尝试 10 次
  //   reconnectionDelay: 3000
  // })
  // socket.on('connect', (data) => {
  //   setServerStatus(false)
  // })
  // socket.on('disconnect', (data) => {
  //   setServerStatus(true)
  // })
  useEffect(() => {
    electron.ipcRenderer.invoke('get-token').then((data) => {
      setToken(data.token)
    })
  }, [])
  const saveSVGToFile = (num) => {
    // 获取 <div> 元素
    const divElement = divRef.current

    if (!divElement) {
      console.error('<div> 元素未找到')
      return
    }

    // 获取 <div> 中的 SVG 元素
    const svgElement = divElement.querySelector('svg')

    if (!svgElement) {
      console.error('SVG 元素未找到')
      return
    }

    // 将 SVG 转换为字符串
    const svgString = new XMLSerializer().serializeToString(svgElement)
    electron.ipcRenderer.invoke('save-svg', svgString, num).then((result) => {
      if (result.success) {
        console.log('文件已保存到:', result.filePath)
      } else {
        console.log('保存失败:', result.message)
      }
    })
  }

  //TODO 驳回提示

  const submit = (id) => {
    setIsOpen(true)
    setSubmit_id(id)
    console.log(id)
  }

  const manual_upload = (key) => {
    Modal.confirm({
      title: '手动上传',
      content: (
        <div>
          <div style={{ display: 'flex' }}>
            <b>
              第一次登录需要扫码,如果登陆后一直加载，重新打开就好了,请手动上传，上传完成后请点击保存，否则结果会丢失！
            </b>
            <div style={{ flex: 1 }}></div>
            <b style={{ paddingRight: 70, color: '#ff0000' }}>测试完后，记得点这里的保存按钮⬇️⬇️</b>
          </div>
          <TablePro name={`${key.key}`} />
        </div>
      ),
      okText: '确认上传完成(已经手动保存)',
      width: 1700,
      centered: true,
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <CancelBtn />
          <Tooltip
            title={
              <div>
                <img style={{ width: 150, height: 150 }} src={'./images.jpeg'} />
                <br />
                <b>再次确定保存了！！！</b>
              </div>
            }
            color={'#ff0000'}
          >
            <Button
              onClick={() => {
                electron.ipcRenderer.send('close-doc', key.name)
                Modal.destroyAll()
                setTimeout(() => {
                  electron.ipcRenderer.send('sho-window')
                }, 5000)
              }}
            >
              确定保存(执行页面中的保存操作)
            </Button>
          </Tooltip>
        </>
      )
    })
  }

  const submit_send = (id) => {
    setLoading(true)
    electron.ipcRenderer.invoke('submit-origin', id).then((res) => {
      setLoading(false)
      console.log(res)
      if (res === '提交成功') {
        message.success(res).then((r) => console.log(r))
      } else if (res === '提交失败') {
        message.error(res).then((r) => console.log(r))
      }
    })
  }

  const handleOk = () => {
    setModalLoading(true)
    setTimeout(() => {
      setModalLoading(false)

      setIsOpen(false)
      console.log('submit_id>' + submit_id)
    }, 1500)
    submit_send(submit_id)
  }

  const handleCancel = () => {
    setIsOpen(false)
    setModalLoading(false)
  }

  const openFile = (id, num, name, size_min, size_max) => {
    electron.ipcRenderer.invoke('open-file').then((res) => {
      if (res) {
        const instance = modal.info({
          title: '信息',
          content: '正在自动操作,请耐心等待！',
          footer: false
        })
        window.electron.ipcRenderer.send('get-vincentPDFData-Off')
        setOption_loading(true)
        console.log(res)
        const data = {
          token: token,
          file_path: res,
          id: id,
          num: num
        }
        instance.update({
          content: '自动测试，请耐心等待....'
        })
        const result = fetch('http://127.0.0.1:5000/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          body: JSON.stringify(data)
        })
          .then((res) => {
            instance.destroy()
            console.log(res)
            window.electron.ipcRenderer.send('get-vincentPDFData')
            res.json().then((data) => {
              console.log(data)
              const items = [
                {
                  key: '4',
                  label: '需求名：',
                  children: <b>{name}</b>
                },
                {
                  key: '0',
                  label: '检测结果',
                  children: data.status
                },
                {
                  key: '1',
                  label: '色块总数',
                  children: (
                    <b>
                      {data.block_count} [{size_min}-{size_max}]
                    </b>
                  )
                },

                {
                  key: '2',
                  label: '小色块数量',
                  children: data.little_block_count
                },
                {
                  key: '3',
                  label: '色块类型信息',
                  children:
                    data.status === '通过' ? `${data.block_type}:通过` : `${data.block_type}`,
                  span: 2
                }
              ]

              if (data.status === '错误') {
                setOption_loading(false)
                modal.confirm({
                  centered: true,
                  title: '提示',
                  icon: <ExclamationCircleOutlined />,
                  content: <b>遇到错误！</b>,
                  okText: '确定'
                })
              }

              const confirm = () => {
                setOption_loading(false)
                const inst_modal = modal.confirm({
                  centered: true,
                  title: '提示',
                  icon: <ExclamationCircleOutlined />,
                  content: (
                    <div>
                      <Descriptions items={items} column={3}></Descriptions>
                      <div
                        ref={divRef}
                        dangerouslySetInnerHTML={{ __html: data.svg_context }}
                        style={{ width: 500 }}
                      ></div>
                      <Button
                        danger
                        disabled={data.status !== '通过' && data.status !== '不通过'}
                        onClick={() => {
                          saveSVGToFile(name)
                        }}
                      >
                        下载SVG检查色块
                      </Button>
                    </div>
                  ),
                  width: 700,
                  okText: '保存',
                  okButtonProps: {
                    disabled: data.status !== '通过' && data.status !== '不通过',
                    danger: data.status === '不通过'
                  },
                  cancelText: '不保存',
                  onOk: () => {
                    const tips = modal.info({
                      title: '状态',
                      content: '正在保存中....',
                      footer: false
                    })

                    setOption_loading(true)
                    electron.ipcRenderer.invoke('save-origin', name).then((res) => {
                      tips.destroy()
                      console.log(res)
                      if (res.message === 'success') {
                        setOption_loading(false)

                        message.success('上传成功')
                      } else if (res.message === 'error') {
                        setOption_loading(false)

                        message.error(res.message)
                      }
                      setTimeout(() => {
                        electron.ipcRenderer.send('show-window')
                      }, 4000)
                    })
                  },
                  onCancel: () => {
                    electron.ipcRenderer.send('cancel')
                    message.info('取消操作')
                  },
                  footer: (_, { OkBtn, CancelBtn }) => (
                    <>
                      <Button
                        onClick={() => {
                          instance.update({
                            content: '正在重新上传'
                          })
                          electron.ipcRenderer.invoke('open-file').then((res) => {
                            instance.destroy()
                            if (res) {
                              data = {
                                file_path: res
                              }
                              const result = fetch('http://127.0.0.1:5000/reUpload', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                cache: 'no-store',
                                body: JSON.stringify(data)
                              }).then((res) => {
                                res.json().then((data_new) => {
                                  const items = [
                                    {
                                      key: '4',
                                      label: '需求名：',
                                      children: <b>{name}</b>
                                    },
                                    {
                                      key: '0',
                                      label: '检测结果',
                                      children: data_new.status
                                    },
                                    {
                                      key: '1',
                                      label: '色块总数',
                                      children: (
                                        <b>
                                          {data_new.block_count} [{size_min}-{size_max}]
                                        </b>
                                      )
                                    },

                                    {
                                      key: '2',
                                      label: '小色块数量',
                                      children: data_new.little_block_count
                                    },
                                    {
                                      key: '3',
                                      label: '色块类型信息',
                                      children:
                                        data.status === '通过'
                                          ? `${data_new.block_type}:通过`
                                          : `${data_new.block_type}`,
                                      span: 2
                                    }
                                  ]
                                  inst_modal.update({
                                    content: (
                                      <div>
                                        <Descriptions items={items} column={3}></Descriptions>
                                        <div
                                          ref={divRef}
                                          dangerouslySetInnerHTML={{ __html: data_new.svg_context }}
                                          style={{ width: 500 }}
                                        ></div>
                                        <Button
                                          danger
                                          disabled={
                                            data_new.status !== '通过' &&
                                            data_new.status !== '不通过'
                                          }
                                          onClick={() => {
                                            saveSVGToFile(name)
                                          }}
                                        >
                                          下载SVG检查色块
                                        </Button>
                                      </div>
                                    )
                                  })
                                  electron.ipcRenderer.send('show-window')
                                })
                              })
                            }
                          })
                        }}
                      >
                        重新上传
                      </Button>
                      <CancelBtn />
                      <OkBtn />
                    </>
                  )
                })
                electron.ipcRenderer.send('show-window')
              }
              confirm()
            })
          })
          .catch(() => {
            setOption_loading(false)
            instance.destroy()
            modal.confirm({
              centered: true,
              title: '错误！',
              content: <div>无法连接到服务器！</div>,
              okText: '好'
            })
          })

        console.log(result)
      } else console.log('error')
    })
  }

  //TODO 图片数组
  const [imageUrls, setImageUrls] = useState([])

  let origin_number = 0

  const [origin, setOrigin] = useState(origin_number)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('null')
  const [dataSource, setDataSource] = useState([])
  const [num, setNum] = useState(0)
  const [uploaded, setUploaded] = useState(0)
  const [option_loading, setOption_loading] = useState(false)

  let switchJudge = false

  console.log(temp_origin_num)
  window.electron.ipcRenderer.removeAllListeners('getPDFData')
  window.electron.ipcRenderer.on('getPDFData', async (event, param) => {
    if (param.data.total > temp_origin_num + 1) {
      window.electron.ipcRenderer.send('notification', '有新的资源')
    }

    temp_origin_num = param.data.total //将长度赋值给缓存
    console.log('缓存长度' + temp_origin_num)
    console.log('资源长度' + param.data.total)

    sum += 1
    setDataSource([])
    console.log(param)
    setId(param.data.demand_list[0].id)
    setOrigin(param.data.demand_list.length)
    setLoading(false)
    const updateSourceData = []
    let up_num = 0
    let uploaded = 0
    //TODO  驳回内容的长度：
    let remarkLength = 0
    const upImageUrl = []
    for (let i = 0; i < param.data.total; i++) {
      const lining_result =
        param.data.demand_list[i]?.image_list[0]?.precheck_result?.lining_result ?? null
      //is_passed: true&false
      //results:色块类型检测 总数：results
      console.log(lining_result)

      const status =
        param.data.demand_list[i].image_list[0].material_list[0].material_remark_list.length > 0
          ? '驳回'
          : '未驳回'
      remarkLength =
        param.data.demand_list[i].image_list[0].material_list[0].material_remark_list.length

      console.log(param.data.demand_list[i].id)
      const pdf_url = param.data.demand_list[i].image_list[0].origin.pdf
      const jpeg_url = param.data.demand_list[i].image_list[0].origin.jpeg
      console.log()
      const block = param.data.demand_list[i].expect.block_count_range
      const cms_type = param.data.demand_list[i].cms_list[0].platform
      const is_update =
        param.data.demand_list[i].image_list[0].origin.pdf === null ? '未上传' : '已上传'
      updateSourceData.push({
        key: `${param.data.demand_list[i].demand.material_list[0]}`,
        name: `${param.data.demand_list[i].image_list[0].material_list[0].material.number}`,
        age: param.data.demand_list.length,
        address: `${i + 1}`,
        status: status,
        colorist: `${param.data.demand_list[i].user.color_painter}`,
        is_update: is_update,
        pdf_url: pdf_url, //String
        deadline_for_lining: formatTimestamp(
          param.data.demand_list[i].expect.deadline_for_lining * 1000
        ),
        block_count_range: `${block ? block[0] : 0}-${block ? block[1] : 0}`,
        min_block: `${block ? block[0] : '?'}`,
        max_block: `${block ? block[1] : '?'}`,
        png_url: jpeg_url, //String
        is_passed: lining_result ? lining_result.is_passed : null, //Boolean
        tag: lining_result ? lining_result.tag : null, //String
        errors: lining_result ? lining_result.errors : null, // 数组
        high_challenge_block_count: lining_result ? lining_result.results.高挑战色块.count : null, //Number
        challenge_block_count: lining_result ? lining_result.results.挑战色块.count : null, //Number
        high_density_block_count: lining_result ? lining_result.results.超密色块.count : null, //Number
        very_cool_block_count: lining_result ? lining_result.results.爽色块.count : null, //Number
        simple_block_count: lining_result ? lining_result.results.简单色块.count : null, //Number
        other_block_count: lining_result ? lining_result.results.其他色块.count : null, //Number
        cms_type: cms_type ? cms_type : null
      })
      for (let j = 0; j < remarkLength; j++) {
        const reject =
          param.data.demand_list[i].image_list[0].material_list[0].material_remark_list[j]
        const reject_png = []
        for (let k = 0; k < reject.reject_png_list.length; k++) {
          reject_png.push(`${reject.reject_png_list[k]}`)
        }

        upImageUrl.push({
          id: `${j}`,
          origin_name: `${param.data.demand_list[i].image_list[0].material_list[0].material.number}`,
          is_update: reject.is_update,
          user_reject: `${reject.user_name}`,
          reject_png: reject_png,
          detail: `${reject.detail}`,
          reject_time: reject.c_time * 1000,
          reject_from: `${reject.reject_from}`
        })
        setImageUrls(upImageUrl)
      }
      if (status === '驳回') {
        up_num += 1
      }
      if (pdf_url) {
        uploaded += 1
      }
    }
    setUploaded(uploaded)
    setNum(up_num)
    if (updateSourceData.length > dataSource.length && switchJudge) {
      openNotificationWithIcon('success')
    }
    setDataSource(updateSourceData)
    switchJudge = true

    // if(param.data.demand_list[0].image_list[0].material_list[0].material_remark_list.length > 0){
    //   console.log('被驳回')
    // }
    // console.log('begin 15s')
    // setTimeout(()=>{
    //   console.log('end 15s')
    //
    //   window.electron.ipcRenderer.send('get-vincentPDFData')
    // },15000)
  })
  //Hook Begin
  useEffect(() => {
    console.log('Render BarChart')
    window.electron.ipcRenderer.send('get-vincentPDFData')

    return () => {
      console.log('Render BarChart out')
      window.electron.ipcRenderer.send('get-vincentPDFData-Off')
    }
  }, [])

  const tips = () => {}

  const start = async (url, name) => {
    const params = {
      url: url,
      suggestedName: `${name}.pdf`
    }

    console.log(params)
    console.log(selectedRowKeys)

    const result = await window.electron.ipcRenderer.invoke('download-file', params)

    switch (result.status) {
      case 'success':
        alert(`文件已保存至：${result.path}`)
        break
      case 'cancelled':
        alert('用户取消保存')
        break
      case 'error':
        alert(`下载失败：${result.message}`)
        break
    }
  }

  const columns = [
    {
      title: 'No.',
      dataIndex: 'address',
      key: 'address',
      width: 60,
      align: 'center'
    },
    {
      title: '预览',
      render: (url, record) => {
        return (
          <>
            <Image
              width={80}
              height={80}
              src={record.png_url}
              fallback={'https://http.cat/404'}
              placeholder
            ></Image>
          </>
        )
      },
      align: 'center',
      width: 80
    },
    {
      title: '资源id',
      render: (name, record) => {
        return (
          <>
            <b>{record.name}</b>
          </>
        )
      },
      key: 'name',
      width: 100,
      align: 'center'
    },

    {
      title: '勾线截止时间',
      dataIndex: 'deadline_for_lining',
      key: 'time',
      width: 150,
      align: 'center'
    },
    {
      title: '色块区间',
      render: (url, record) => {
        return (
          <>
            <Tag>
              <b>{record.block_count_range}</b>
            </Tag>
          </>
        )
      },
      key: 'block',
      width: 100,
      align: 'center'
    },

    {
      title: '状态',
      key: 'action',
      align: 'center',

      render: (_, record) => (
        <div>
          <Tag
            style={{ marginBottom: 10 }}
            color={record.status === '未驳回' ? 'rgba(185,234,168,0.63)' : '#f50'}
          >
            {record.status}
          </Tag>
          <Tag color={record.is_update === '未上传' ? 'rgb(209,136,136)' : '#0077ff'}>
            {record.is_update}
          </Tag>
        </div>
      ),
      width: 70
    },
    {
      title: '需求类型',
      key: 'cms_type',
      align: 'center',
      width: 40,
      render: (_, record) => {
        return <Tag>{record.cms_type}</Tag>
      }
    },
    {
      title: '操作',
      render: (_, record) => {
        const onClick = ({ key }) => {
          switch (key) {
            case '1':
              start(record.pdf_url, record.name).then((r) => console.log(r))
              break
            case '2':
              let num = 1
              if (!record.pdf_url) {
                num = 2
              }
              openFile(record.key, num, record.name, record.min_block, record.max_block)
              break
            case '3':
              submit(record.key)
              break
            case '4':
              manual_upload(record)
              console.log(record.key)
          }
        }
        const items = [
          {
            label: record.pdf_url ? (
              <b style={{ color: '#ff0000' }}>
                <FilePdfFilled /> 下载PDF
              </b>
            ) : (
              <b style={{ color: '#b8b3b3' }}>
                <FilePdfFilled /> 下载PDF
              </b>
            ),
            key: '1',
            disabled: !record.pdf_url
          },
          {
            label: '自动上传测试',
            key: '2',
            disabled: serverStatus,
            extra: '需要自动上传脚本'
          },
          {
            label: (
              <b style={{ color: '#2b50af' }}>
                <UpCircleFilled /> 手动上传测试
              </b>
            ),
            key: '4',
            extra: '推荐方法'
          },
          {
            label: record.pdf_url ? (
              <b style={{ color: '#48af2b' }}>
                <CheckCircleFilled /> 提交资源
              </b>
            ) : (
              <b style={{ color: '#aaa7a7' }}>
                <CheckCircleFilled /> 提交资源
              </b>
            ),
            key: '3',
            disabled: !record.pdf_url
          }
        ]
        return (
          <ConfigProvider
            theme={{
              token: {
                borderRadiusLG: 5
              }
            }}
          >
            <Dropdown
              arrow
              placement={'top'}
              autoAdjustOverflow
              menu={{
                items,
                onClick
              }}
            >
              <a
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <Space>操作</Space>
              </a>
            </Dropdown>
          </ConfigProvider>
        )
      },
      key: 'link',
      align: 'center',
      width: 80
    },

    Table.EXPAND_COLUMN
  ]

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
      setSelectedRowKeys(selectedRows)
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === '未驳回',
      // Column configuration not to be checked
      name: record.name
    })
  }
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const handleExpand = (expanded, record) => {
    if (expanded) {
      // 展开当前行，收起其他行
      setExpandedRowKeys([record.key])
    } else {
      // 收起当前行
      setExpandedRowKeys([])
    }
  }
  const tableRef = useRef(null)
  const handlePageChange = (page, pageSize) => {
    console.log('当前页码:', page, '每页行数:', pageSize)
    // 滚动到表格顶部
    if (tableRef.current) {
      const element = tableRef.current
      const elementTop = element.getBoundingClientRect().top // 元素相对于视口的位置
      const offset = 100 // 间距
      const scrollTop = window.pageYOffset + elementTop - offset // 计算滚动位置
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth' // 平滑滚动
      })
    }
  }
  return (
    <>
      {contextHolder}

      <ConfigProvider
        theme={{
          token: {
            colorTextDescription: '#eae4e4',
            borderRadiusLG: 18,
            margin: 6
          }
        }}
      >
        <Modal
          confirmLoading={modalLoading}
          title={'提示'}
          open={isOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <p>确定提交吗？</p>
        </Modal>
        <ProCard style={{ borderRadius: 25 }} bordered={true}>
          <Space>
            <Badge count={num}>
              <div style={{ height: '15px' }}>
                <h2>总览</h2>
              </div>
            </Badge>
          </Space>
          <Divider orientation={'left'}>
            <p style={{ fontSize: 12, fontStyle: 'normal' }}>数据概览</p>
          </Divider>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card style={{ backgroundColor: 'rgb(227,76,47)' }}>
                <Statistic
                  prefix={<CloseCircleFilled />}
                  suffix={`张`}
                  loading={loading}
                  valueStyle={{ color: '#ffffff' }}
                  title={'被驳回'}
                  value={'\ ' + num + '\ '}
                ></Statistic>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ backgroundColor: 'rgb(28,79,165)' }}>
                <div>
                  <Statistic
                    prefix={<DatabaseFilled />}
                    suffix={'张'}
                    loading={loading}
                    title={'资源总数'}
                    valueStyle={{ color: '#fff' }}
                    value={origin}
                  ></Statistic>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ backgroundColor: 'rgb(156,165,28)' }}>
                <div>
                  <Statistic
                    prefix={<DatabaseFilled />}
                    suffix={'张'}
                    loading={loading}
                    title={'未提交'}
                    valueStyle={{ color: '#fff' }}
                    value={uploaded}
                  ></Statistic>
                </div>
              </Card>
            </Col>
          </Row>
        </ProCard>
        <Divider />
        <ProCard style={{ borderRadius: 25 }} bordered={true}>
          <div style={{ height: '45px' }}>
            <Flex wrap vertical={false} gap={10}>
              <h2>详情</h2>

              <InfoCircleOutlined style={{}} />
            </Flex>
          </div>

          <Divider orientation={'left'}>
            <p style={{ fontSize: 12, fontStyle: 'normal' }}>我的所有需求列表</p>
          </Divider>

          <div style={{ height: 'auto', paddingBottom: '35px' }}>
            <div>
              <Spin spinning={option_loading} delay={500} tip={'正在操作，请耐心等待...'}>
                <Table
                  pagination={{
                    pageSize: 5
                  }}
                  style={{ height: 'auto' }}
                  //      scroll={
                  // {
                  //   y:55*10
                  // }
                  //      }
                  loading={loading}
                  bordered
                  dataSource={dataSource}
                  columns={columns}
                  expandable={{
                    columnTitle: '展开',
                    align: 'center',
                    expandedRowKeys: expandedRowKeys,
                    onExpand: handleExpand,
                    expandedRowRender: (record) => (
                      //TODO 动态用户名
                      <Watermark content={record.name}>
                        <Collapse
                          defaultActiveKey={1}
                          accordion
                          bordered
                          items={[
                            {
                              key: '1',
                              label: '色块检测信息',
                              children: (
                                <Descriptions
                                  bordered
                                  column={2}
                                  items={[
                                    {
                                      key: '1',
                                      label: '状态',
                                      children: record.is_passed ? (
                                        <div style={{ color: '#63dc5f' }}>
                                          <CheckCircleOutlined /> 通过
                                        </div>
                                      ) : (
                                        <div style={{ color: '#e4110a' }}>
                                          <CloseCircleOutlined /> 不通过
                                        </div>
                                      )
                                    },
                                    {
                                      key: '2',
                                      label: '需求标签',
                                      children: record.tag ? (
                                        <Tag>{record.tag}</Tag>
                                      ) : (
                                        <Tag>未知</Tag>
                                      )
                                    },
                                    {
                                      key: '3',
                                      label: '错误信息',
                                      children:
                                        record.errors && record.errors.length !== 0 ? (
                                          record.errors.map((item, index) => (
                                            <p key={index}>
                                              {index + 1}. {item}
                                            </p>
                                          ))
                                        ) : (
                                          <p>暂无数据</p>
                                        ),
                                      span: 2
                                    },
                                    {
                                      key: '4',
                                      label: '高挑战色块',
                                      children: record.high_challenge_block_count
                                    },
                                    {
                                      key: '5',
                                      label: '挑战色块',
                                      children: record.challenge_block_count
                                    },
                                    {
                                      key: '6',
                                      label: '超密色块',
                                      children: record.high_density_block_count
                                    },
                                    {
                                      key: '7',
                                      label: '爽色块',
                                      children: record.very_cool_block_count
                                    },
                                    {
                                      key: '8',
                                      label: '简单色块',
                                      children: record.simple_block_count
                                    },
                                    {
                                      key: '9',
                                      label: '其他色块',
                                      children: record.other_block_count
                                    }
                                  ]}
                                ></Descriptions>
                              )
                            },

                            {
                              key: '2',
                              label: '驳回列表',
                              children: (
                                <div>
                                  <div ref={tableRef}></div>
                                  <Table
                                    onChange={handlePageChange}
                                    bordered
                                    pagination={{
                                      pageSize: 6
                                    }}
                                    dataSource={imageUrls.filter(
                                      (item) => item.origin_name === record.name
                                    )}
                                    columns={[
                                      {
                                        key: '1',
                                        title: '驳回人',
                                        dataIndex: 'user_reject',
                                        width: 80
                                      },
                                      {
                                        key: '5',
                                        title: '来源',
                                        render: (record) => {
                                          switch (record.reject_from) {
                                            case 'test':
                                              return <Tag>测试</Tag>
                                            case 'demand':
                                              return <Tag>填色</Tag>
                                            case 'publish':
                                              return <Tag>填色</Tag>
                                            case 'review':
                                              return <Tag>发布</Tag>
                                          }
                                        },
                                        width: 80
                                      },
                                      {
                                        key: '2',
                                        title: '驳回内容',
                                        dataIndex: 'detail',
                                        width: 350
                                      },
                                      {
                                        key: '4',
                                        title: '状态',
                                        render: (record) => {
                                          return (
                                            <Tag
                                              color={
                                                record.is_update === true
                                                  ? 'rgb(98,206,244)'
                                                  : '#ec1109'
                                              }
                                            >
                                              {record.is_update === true ? '已修改' : '未修改'}
                                            </Tag>
                                          )
                                        },
                                        align: 'center'
                                      },
                                      {
                                        key: '3',
                                        title: '驳回附图',
                                        align: 'center',
                                        render: (url, re_data) => {
                                          return (
                                            <Badge count={re_data.reject_png.length}>
                                              <div style={{ width: 100, height: 100 }}>
                                                <Image.PreviewGroup items={re_data.reject_png}>
                                                  <Image
                                                    width={100}
                                                    height={100}
                                                    src={re_data.reject_png[0]}
                                                    fallback={'https://http.cat/400'}
                                                    placeholder
                                                  />
                                                </Image.PreviewGroup>
                                              </div>
                                            </Badge>
                                          )
                                        }
                                      }
                                    ]}
                                  ></Table>
                                </div>
                              )
                            }
                          ]}
                        ></Collapse>

                        {record.key}
                      </Watermark>
                    ),
                    rowExpandable: (record) => record.pdf !== null,
                    columnWidth: 80
                  }}
                  // rowSelection={{
                  //   type: 'checkbox',
                  //   ...rowSelection,
                  // }}
                />
              </Spin>
            </div>
          </div>
        </ProCard>
      </ConfigProvider>
    </>
  )
}

export default DownLoad
