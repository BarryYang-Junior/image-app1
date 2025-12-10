import React, { useState, useEffect } from 'react';
import { Eraser, Download, ArrowLeft, Wand2, Info, Settings, Key } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { removeWatermark } from './services/geminiService';
import { AppState, ProcessedImageResult } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessedImageResult>({
    originalUrl: '',
    processedUrl: null,
    isLoading: false,
    error: null,
  });
  const [customInstruction, setCustomInstruction] = useState('');
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (result.originalUrl) URL.revokeObjectURL(result.originalUrl);
    };
  }, [result.originalUrl]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleImageSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setResult({
      originalUrl: url,
      processedUrl: null,
      isLoading: false,
      error: null,
    });
    setAppState(AppState.PREVIEW);
    setCustomInstruction('');
  };

  const handleProcess = async () => {
    if (!imageFile || !result.originalUrl) return;

    // Check if we have a key (either user provided or env fallback)
    if (!apiKey && !process.env.API_KEY) {
      setIsSettingsOpen(true);
      return;
    }

    setAppState(AppState.PROCESSING);
    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data:image/xxx;base64, prefix
        const base64Data = base64String.split(',')[1];
        const mimeType = imageFile.type;

        try {
          const processedImageBase64 = await removeWatermark({
            imageBase64: base64Data,
            mimeType,
            instruction: customInstruction,
            apiKey: apiKey // Pass the user key
          });

          setResult((prev) => ({
            ...prev,
            processedUrl: processedImageBase64,
            isLoading: false,
          }));
          setAppState(AppState.SUCCESS);
        } catch (error: any) {
           // If error relates to API key, prompt user
           if (error.message.includes('API Key')) {
             setIsSettingsOpen(true);
           }
           setResult((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || "处理图片时出错，请重试。",
          }));
          setAppState(AppState.ERROR);
        }
      };
    } catch (error) {
      setResult((prev) => ({
        ...prev,
        isLoading: false,
        error: "读取文件失败",
      }));
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImageFile(null);
    setResult({
      originalUrl: '',
      processedUrl: null,
      isLoading: false,
      error: null,
    });
  };

  const handleDownload = () => {
    if (result.processedUrl) {
      const link = document.createElement('a');
      link.href = result.processedUrl;
      link.download = `removed-watermark-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col">
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveApiKey}
        initialKey={apiKey}
      />

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Eraser className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block">
              AI 智能去水印
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors border ${apiKey ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}
             >
                {apiKey ? <Settings className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                <span className="text-sm font-medium hidden sm:inline">{apiKey ? '设置' : '配置 API Key'}</span>
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        
        {/* HERO / UPLOAD STATE */}
        {appState === AppState.IDLE && (
          <div className="text-center w-full max-w-4xl space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                <span className="block text-white">瞬间移除</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                  图片水印与文字
                </span>
              </h2>
              <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
                上传图片，让先进的 Gemini AI 自动识别并擦除水印，智能填充背景，还原图片本真。
              </p>
            </div>

            <ImageUploader onImageSelect={handleImageSelect} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
              {[
                { title: '智能识别', desc: '自动检测并定位各类水印、Logo和时间戳' },
                { title: '无痕填充', desc: '根据周围背景纹理，智能生成缺失部分' },
                { title: '高清输出', desc: '保持原图分辨率，细节清晰不失真' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-2xl backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <Wand2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PREVIEW & PROCESSING STATE */}
        {(appState === AppState.PREVIEW || appState === AppState.PROCESSING || appState === AppState.ERROR) && (
          <div className="w-full max-w-6xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full flex justify-between items-center">
              <button 
                onClick={handleReset}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回上传
              </button>
              <div className="text-gray-400 text-sm">
                {appState === AppState.PROCESSING ? 'AI 正在思考中...' : '预览模式'}
              </div>
            </div>

            <div className="relative w-full aspect-auto max-h-[60vh] bg-gray-900 rounded-2xl border-4 border-gray-800 shadow-2xl overflow-hidden flex items-center justify-center">
               <img 
                 src={result.originalUrl} 
                 alt="Original" 
                 className="max-w-full max-h-[60vh] object-contain"
               />
               {appState === AppState.PROCESSING && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                   <div className="relative w-20 h-20">
                     <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                   </div>
                   <p className="mt-6 text-xl font-medium text-white animate-pulse">正在施展魔法...</p>
                   <p className="mt-2 text-sm text-gray-400">这通常需要 5-10 秒</p>
                 </div>
               )}
            </div>

            {appState === AppState.ERROR && (
               <div className="w-full bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl flex items-center justify-between">
                 <div className="flex items-center">
                    <Info className="w-5 h-5 mr-3" />
                    <span>{result.error}</span>
                 </div>
                 <Button variant="secondary" onClick={handleProcess} size="sm">重试</Button>
               </div>
            )}

            <div className="w-full max-w-2xl space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   额外指令 (可选)
                 </label>
                 <input 
                   type="text" 
                   value={customInstruction}
                   onChange={(e) => setCustomInstruction(e.target.value)}
                   placeholder="例如：去除右上角的文字，保留中间的Logo..."
                   className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   disabled={appState === AppState.PROCESSING}
                 />
                 <p className="text-xs text-gray-500 mt-2">
                   默认情况下，AI 会自动识别并去除所有水印。如果效果不佳，请尝试添加具体描述。
                 </p>
              </div>

              <Button 
                onClick={handleProcess} 
                className="w-full text-lg h-14"
                isLoading={appState === AppState.PROCESSING}
                icon={<Wand2 className="w-5 h-5" />}
              >
                开始一键去水印
              </Button>
            </div>
          </div>
        )}

        {/* SUCCESS / COMPARISON STATE */}
        {appState === AppState.SUCCESS && result.processedUrl && (
          <div className="w-full max-w-6xl flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
             <div className="w-full flex justify-between items-center">
              <button 
                onClick={handleReset}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                处理新图片
              </button>
              <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-400 font-medium">处理成功</span>
              </div>
            </div>

            <div className="w-full">
              <ComparisonView 
                originalUrl={result.originalUrl}
                processedUrl={result.processedUrl}
              />
              <p className="text-center text-gray-500 text-sm mt-4 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 mr-1" /> 拖动滑块对比效果 <ChevronRight className="w-4 h-4 ml-1" />
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-md">
              <Button 
                onClick={handleDownload} 
                className="flex-1"
                icon={<Download className="w-5 h-5" />}
              >
                下载处理后图片
              </Button>
               <Button 
                variant="outline"
                onClick={() => setAppState(AppState.PREVIEW)} 
                className="flex-1"
              >
                重新调整指令
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-800 text-center text-gray-600 text-sm">
        <p>Powered by Google Gemini Pro Vision</p>
      </footer>
    </div>
  );
}

// Helper icon
const ChevronLeft = ({ className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className} {...props}
  >
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = ({ className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className} {...props}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default App;