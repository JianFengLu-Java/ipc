import { ConfigProvider, Row, Splitter, Col, Flex } from 'antd'
import Test from './Test'
import React, { useEffect, useRef, useState } from 'react'
import BarChart from './BarChart'

function Split(props) {
  return (
    <>
      <Splitter>
        <Splitter.Panel>
          <BarChart display={'none'} margin={'0'} height={'85vh'} />
        </Splitter.Panel>
        <Splitter.Panel defaultSize="25%" min="20%" max="30%">
          <Test />
        </Splitter.Panel>
      </Splitter>
    </>
  )
}

export default Split
