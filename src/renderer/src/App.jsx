import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Home from './components/Home'
import { Route, Router, Navigate, Routes } from 'react-router-dom'
import DownLoad from './components/DownLoad'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/context" element={<DownLoad />} />
    </Routes>
  )
}

export default App
