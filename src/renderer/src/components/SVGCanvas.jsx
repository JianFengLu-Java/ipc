import React, { useEffect, useRef } from 'react'
import { SVG } from '@svgdotjs/svg.js'

const SvgCanvas = () => {
  const svgRef = useRef(null)

  useEffect(() => {
    // 初始化 SVG.js
    const draw = SVG().addTo(svgRef.current).size(2048, 2048)

    // 定义路径数据
    const pathData = `
      M913.55,579.48
      c2.513,0.107,5.333,0.12,8.46,0.04
      c7.847-0.193,15.747-0.747,23.7-1.66
      c61.89-7.12,116.24-43.45,148.31-96.56
      c14.413-23.86,23.387-50.903,26.92-81.13
      c0.547-4.68,0.827-9.957,0.84-15.83
      c0.027-9.587,0.017-14.857-0.03-15.81
      c-0.18-3.947-0.747-9.363-1.7-16.25
      c-7.45-53.8-36.55-100.96-80.33-132.98
      c-32.3-23.64-69.98-36.17-109.89-37.8
      c-39.91-1.64-78.49,7.78-112.62,28.7
      c-46.24,28.34-79.1,72.97-90.91,125.98
      c-1.513,6.787-2.52,12.14-3.02,16.06
      c-0.127,0.947-0.567,6.197-1.32,15.75
      c-0.467,5.853-0.62,11.137-0.46,15.85
      c1.053,30.413,7.79,58.097,20.21,83.05
      c27.62,55.56,78.83,96.2,139.93,108.35
      c7.853,1.56,15.683,2.757,23.49,3.59
      C908.237,579.163,911.043,579.38,913.55,579.48
    `

    const path2 = `M913.55,1021.48
\tc2.513,0.107,5.333,0.12,8.46,0.04c7.847-0.193,15.747-0.747,23.7-1.66c61.89-7.12,116.24-43.45,148.31-96.56
\tc14.413-23.86,23.387-50.903,26.92-81.13c0.547-4.68,0.827-9.957,0.84-15.83c0.027-9.587,0.017-14.857-0.03-15.81
\tc-0.18-3.947-0.747-9.363-1.7-16.25c-7.45-53.8-36.55-100.96-80.33-132.98c-32.3-23.64-69.98-36.17-109.89-37.8
\tc-39.91-1.64-78.49,7.78-112.62,28.7c-46.24,28.34-79.1,72.97-90.91,125.98c-1.513,6.787-2.52,12.14-3.02,16.06
\tc-0.127,0.947-0.567,6.197-1.32,15.75c-0.467,5.853-0.62,11.137-0.46,15.85c1.053,30.413,7.79,58.097,20.21,83.05
\tc27.62,55.56,78.83,96.2,139.93,108.35c7.853,1.56,15.683,2.757,23.49,3.59C908.237,1021.163,911.043,1021.38,913.55,1021.48`

    // 绘制路径
    const path = draw.path(pathData).attr({
      'vector-effect': 'non-scaling-stroke', // 设置 vector-effect
      style: 'fill:none;stroke:#FF0000;stroke-width:0.5;' // 设置样式
    })
    const path3 = draw.path(path2).attr({
      'vector-effect': 'non-scaling-stroke', // 设置 vector-effect
      style: 'fill:none;stroke:#FF0000;stroke-width:0.5;' // 设置样式
    })

    const points = parsePathData(pathData)
    console.log('Path Anchor Points:', points)
    const points1 = parsePathData(path2)
    console.log('Path Anchor Points2:', points)

    // 清理函数
    return () => {
      draw.clear()
    }
  }, [])

  return <div ref={svgRef}></div>
}
const parsePathData = (pathData) => {
  const fixedPathData = pathData
    .replace(/([a-zA-Z])(-?\d)/g, '$1 $2')
    .replace(/(\d)-(\d)/g, '$1 -$2')

  const commands = fixedPathData.match(/[MLCQAZmlcqaz][^MLCQAZmlcqaz]*/gi)
  const points = []
  let currentX = 0
  let currentY = 0

  if (!commands) {
    console.error('Invalid path data:', pathData)
    return points
  }

  commands.forEach((command) => {
    const type = command[0]
    const coords = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)

    if (coords.some(isNaN)) {
      console.warn(`Skipping invalid command: ${command}`)
      return
    }

    switch (type) {
      case 'M': // 绝对移动
        currentX = coords[0]
        currentY = coords[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'm': // 相对移动
        currentX += coords[0]
        currentY += coords[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'L': // 绝对直线
        currentX = coords[0]
        currentY = coords[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'l': // 相对直线
        currentX += coords[0]
        currentY += coords[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'C': // 绝对三次贝塞尔曲线
        currentX = coords[4]
        currentY = coords[5]
        points.push({ x: currentX, y: currentY })
        break
      case 'c': // 画三次贝塞尔曲线到点（相对或绝对）
        if (type === 'c') {
          currentX = coords[4]
          currentY = coords[5]
        } else {
          currentX += coords[4]
          currentY += coords[5]
        }
        points.push({ x: currentX, y: currentY })
        break
      case 'Q': // 绝对二次贝塞尔曲线
        currentX = coords[2]
        currentY = coords[3]
        points.push({ x: currentX, y: currentY })
        break
      case 'q': // 相对二次贝塞尔曲线
        currentX += coords[2]
        currentY += coords[3]
        points.push({ x: currentX, y: currentY })
        break
      case 'A': // 绝对椭圆弧
        currentX = coords[5]
        currentY = coords[6]
        points.push({ x: currentX, y: currentY })
        break
      case 'a': // 相对椭圆弧
        currentX += coords[5]
        currentY += coords[6]
        points.push({ x: currentX, y: currentY })
        break
      case 'Z': // 闭合路径
      case 'z':
        break
      default:
        console.warn('Unsupported command:', type)
        break
    }
  })

  return points
}

export default SvgCanvas
