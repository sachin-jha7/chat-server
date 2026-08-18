
import { Route, Routes } from 'react-router-dom'
import './App.css'
import GetStarted from './pages/GetStarted'
import Auth from './pages/Auth'
import Chat from './pages/Chat'
import { DataProvider } from './context/DataContext'

function App() {


  return (
    <>
      <DataProvider>
        <Routes>
          <Route path='/' element={<GetStarted />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/auth' element={<Auth />} />
        </Routes>
      </DataProvider>
    </>
  )
}

export default App
