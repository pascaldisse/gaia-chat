import React, { useState } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import './styles/Sidebar.css';
import './App.css';
import './styles/Chat.css';
import { MODELS } from './config';

function App() {
  const [currentChat, setCurrentChat] = useState([]);
  const [model, setModel] = useState(MODELS.LLAMA3_70B);

  return (
    <div className="app">
      <Sidebar setCurrentChat={setCurrentChat} model={model} setModel={setModel} />
      <Chat currentChat={currentChat} setCurrentChat={setCurrentChat} model={model} />
    </div>
  );
}

export default App;

