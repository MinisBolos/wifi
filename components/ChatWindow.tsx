import React, { useEffect, useRef, useState } from 'react';
import { Message, User } from '../types';
import { Icons } from './Icon';

interface ChatWindowProps {
  peerUser: { id: string; name: string };
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
  currentUser: User;
  isTyping: boolean;
  sendTyping: (status: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  peerUser,
  messages,
  onSendMessage,
  onBack,
  currentUser,
  isTyping,
  sendTyping
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    sendTyping(true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-chat-pattern relative">
      {/* Chat Header */}
      <header className="bg-whatsapp-teal dark:bg-whatsapp-darkPanel p-3 flex items-center text-white shadow-sm z-10">
        <button onClick={onBack} className="mr-2 md:hidden">
          <Icons.ArrowLeft />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-gray-700 font-bold bg-gradient-to-br from-teal-400 to-blue-500 text-white">
           {peerUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-base leading-tight">{peerUser.name}</h2>
          <p className="text-xs opacity-90">
             {isTyping ? 'digitando...' : 'via Bluetooth'}
          </p>
        </div>
        <div className="flex gap-4 opacity-80">
           <Icons.Search size={20} />
           <Icons.MoreVertical size={20} />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-0">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
            >
              <div
                className={`
                  relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-sm
                  ${isMe 
                    ? 'bg-whatsapp-messageOut dark:bg-whatsapp-darkMessageOut rounded-tr-none' 
                    : 'bg-white dark:bg-whatsapp-darkMessageIn dark:text-white rounded-tl-none'}
                `}
              >
                <p className="break-words leading-relaxed pb-1 text-base">{msg.text}</p>
                <div className="flex justify-end items-center gap-1 opacity-70 mt-[-4px]">
                  <span className="text-[10px] uppercase">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span className={msg.status === 'read' ? 'text-blue-500' : ''}>
                       {msg.status === 'sent' ? <Icons.Check size={14} /> : <Icons.CheckCheck size={14} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-100 dark:bg-whatsapp-darkPanel p-2 flex items-center gap-2 z-10">
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
          <Icons.Smile size={24} />
        </button>
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition md:block hidden">
          <Icons.Paperclip size={24} />
        </button>
        
        <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-4 py-2 shadow-sm flex items-center">
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400"
            placeholder="Mensagem"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button 
          onClick={handleSend}
          className={`p-3 rounded-full text-white shadow-md transition transform active:scale-95 ${inputText.trim() ? 'bg-whatsapp-teal hover:bg-whatsapp-dark' : 'bg-gray-400'}`}
        >
          {inputText.trim() ? <Icons.Send size={20} /> : <Icons.Mic size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;