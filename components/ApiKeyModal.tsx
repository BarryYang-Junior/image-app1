import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink } from 'lucide-react';
import { Button } from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialKey }) => {
  const [key, setKey] = useState(initialKey);

  useEffect(() => {
    setKey(initialKey);
  }, [initialKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">设置 API Key</h2>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          为了正常使用去水印服务，请配置您的 Google Gemini API Key。您的 Key 仅存储在本地浏览器中，直接发送给 Google，不会经过任何第三方服务器。
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Gemini API Key
            </label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            获取免费的 API Key <ExternalLink size={12} className="ml-1" />
          </a>

          <div className="pt-2">
            <Button 
              onClick={() => {
                onSave(key);
                onClose();
              }} 
              className="w-full"
            >
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};