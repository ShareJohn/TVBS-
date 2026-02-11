
import React, { useState, useEffect, useMemo } from 'react';
import { NewsCardData, PhotoSettings, FrameRect, TextLayout } from './types';
import { NewsCardPreview } from './components/NewsCardPreview';
import { MapSelector } from './components/MapSelector';

const DEFAULT_SETTINGS: PhotoSettings = { x: 0, y: 0, scale: 1 };

// 內建地圖分類列表
const MAP_CATEGORIES = {
  '國內 (Domestic)': [
    { name: '台北市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/01台北市.png' },
    { name: '新北市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/02新北市.png' },
    { name: '基隆市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/03基隆市.png' },
    { name: '桃園市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/04桃園市.png' },
    { name: '新竹縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/05新竹縣.png' },
    { name: '新竹市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/06新竹市.png' },
    { name: '苗栗市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/07苗栗縣.png' },
    { name: '台中市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/08台中市.png' },
    { name: '彰化縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/09彰化縣.png' },
    { name: '南投縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/10南投縣.png' },
    { name: '雲林縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/11雲林縣.png' },
    { name: '嘉義縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/12嘉義縣.png' },
    { name: '嘉義市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/13嘉義市.png' },
    { name: '台南市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/14台南市.png' },
    { name: '高雄市', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/15高雄市.png' },
    { name: '屏東縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/16屏東縣.png' },
    { name: '宜蘭縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/17宜蘭縣.png' },
    { name: '花蓮縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/18花蓮縣.png' },
    { name: '台東縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/19台東縣.png' },
    { name: '澎湖縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/20澎湖縣.png' },
    { name: '金門縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/21金門縣.png' },
    { name: '連江縣', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/22連江縣.png' },
    { name: '綠島', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/23綠島.png' },
  ],
  '國外 (International)': [
    { name: '美國', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/美國.png' },
    { name: '中國', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/中國.png' },
    { name: '日本', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/日本.png' },
    { name: '香港', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/香港.png' },
    { name: '兩岸', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/兩岸.png' },
    { name: '泰國', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/泰國.png' },
    { name: '澳洲', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/澳洲.png' },
    { name: '菲律賓', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/菲律賓.png' },
    { name: '以色列', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/以色列.png' },
    { name: '新加坡', url: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/新加坡.png' }
  ]
};

// 預設的圖片框座標
const DEFAULT_FRAMES = {
  reporter: { x: 173, y: 238.68, w: 380.55, h: 405.39 },
  interviewee: { x: 572.70, y: 64.606, w: 1245.7, h: 690.34 }
};

// 預設的文字座標
const DEFAULT_TEXT_LAYOUTS = {
  reporter: { x: 360, y: 685, w: 375, size: 60 },
  interviewee: { x: 1330, y: 760, w: 1000, size: 60 }
};

const INITIAL_USER_DATA = {
  reporterName: '新聞中心',
  reporterTitle: 'TVBS',
  reporterPhoto: null,
  reporterSettings: { ...DEFAULT_SETTINGS },
  intervieweeName: '',
  intervieweeTitle: '',
  intervieweePhoto: null,
  intervieweeSettings: { ...DEFAULT_SETTINGS },
  photoCredit: '',
  isVoiceAltered: false,
  mapImage: null,
};

const App: React.FC = () => {
  const savedBg = localStorage.getItem('news_template_bg_solid');

  // 定義核心版型
  const templateConfig = useMemo(() => ({
    interview: {
      name: '電話訪問',
      solid: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/%E9%9B%BB%E8%A8%AA%E6%A1%8601.png',
      trans: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/%E9%9B%BB%E8%A8%AA%E6%A1%8600.png'
    },
    connection: {
      name: '電話連線',
      solid: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/%E9%9B%BB%E9%80%A3%E6%A1%8601.png',
      trans: 'https://raw.githubusercontent.com/ShareJohn/My_TVBS_Image/main/img/%E9%9B%BB%E9%80%A3%E6%A1%8600.png'
    }
  }), []);

  const [currentType, setCurrentType] = useState<'interview' | 'connection'>('interview');
  const [isTransparent, setIsTransparent] = useState(false);

  const [data, setData] = useState<NewsCardData>({
    solidTemplate: templateConfig.interview.solid,
    transparentTemplate: templateConfig.interview.trans,
    reporterFrame: { ...DEFAULT_FRAMES.reporter },
    reporterTextLayout: { ...DEFAULT_TEXT_LAYOUTS.reporter },
    intervieweeFrame: { ...DEFAULT_FRAMES.interviewee },
    intervieweeTextLayout: { ...DEFAULT_TEXT_LAYOUTS.interviewee },
    isTransparentMode: false,
    ...INITIAL_USER_DATA
  });



  const [showWelcome, setShowWelcome] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);

  useEffect(() => {
    if (!savedBg) {
      setShowWelcome(true);
    }
  }, [savedBg]);

  // Handle template updates when type changes (Sidebar switching preserves data)
  useEffect(() => {
    const config = templateConfig[currentType];
    setData(prev => ({
      ...prev,
      solidTemplate: config.solid,
      transparentTemplate: config.trans,
      isTransparentMode: isTransparent,
      // Note: We are preserving other fields (text, photos) here implicitly by spreading ...prev
    }));
  }, [currentType, isTransparent, templateConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingChange = (type: 'reporter' | 'interviewee', field: keyof PhotoSettings, value: number) => {
    setData(prev => ({
      ...prev,
      [`${type}Settings`]: {
        ...prev[`${type}Settings` as keyof NewsCardData] as PhotoSettings,
        [field]: value
      }
    }));
  };

  const handleTextLayoutChange = (type: 'reporter' | 'interviewee', field: keyof TextLayout, value: number) => {
    let newValue = value;
    if (type === 'interviewee' && field === 'x') {
      newValue = Math.max(600, Math.min(1800, value));
    }

    setData(prev => ({
      ...prev,
      [`${type}TextLayout`]: {
        ...prev[`${type}TextLayout` as keyof NewsCardData] as TextLayout,
        [field]: newValue
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'reporter' | 'interviewee' | 'template' | 'map') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'template') {
          setData(prev => ({ ...prev, solidTemplate: result, transparentTemplate: result }));
          try {
            if (result.length < 5000000) localStorage.setItem('news_template_bg_solid', result);
          } catch (e) { }
        } else if (type === 'reporter') {
          setData(prev => ({ ...prev, reporterPhoto: result, reporterSettings: { ...DEFAULT_SETTINGS } }));
        } else if (type === 'interviewee') {
          setData(prev => ({ ...prev, intervieweePhoto: result, intervieweeSettings: { ...DEFAULT_SETTINGS } }));
        } else if (type === 'map') {
          setData(prev => ({ ...prev, mapImage: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = (newType: 'interview' | 'connection') => {
    const config = templateConfig[newType];
    setData({
      solidTemplate: config.solid,
      transparentTemplate: config.trans,
      isTransparentMode: false, // Reset transparency
      reporterFrame: { ...DEFAULT_FRAMES.reporter },
      reporterTextLayout: { ...DEFAULT_TEXT_LAYOUTS.reporter },
      intervieweeFrame: { ...DEFAULT_FRAMES.interviewee },
      intervieweeTextLayout: { ...DEFAULT_TEXT_LAYOUTS.interviewee },
      ...INITIAL_USER_DATA
    });
    setCurrentType(newType);
    setIsTransparent(false);
  };

  const clearAll = () => {
    localStorage.removeItem('news_template_bg_solid');
    // Reset to default (current type)
    handleReset(currentType);
  };

  const handleWelcomeSelection = (type: 'interview' | 'connection') => {
    handleReset(type);
    setShowWelcome(false);
  };

  const renderTextLayoutInputs = (type: 'reporter' | 'interviewee') => {
    const layout = data[`${type}TextLayout`];
    return (
      <div className="grid grid-cols-4 gap-2 text-[10px] mt-1">
        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold uppercase">X</label>
          <input type="number" value={layout.x} onChange={(e) => handleTextLayoutChange(type, 'x', Number(e.target.value))} className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-slate-300 text-center outline-none focus:border-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold uppercase">Y</label>
          <input type="number" value={layout.y} onChange={(e) => handleTextLayoutChange(type, 'y', Number(e.target.value))} className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-slate-300 text-center outline-none focus:border-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold uppercase">字級 (基準)</label>
          <input type="number" value={layout.size} onChange={(e) => handleTextLayoutChange(type, 'size', Number(e.target.value))} className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-slate-300 text-center outline-none focus:border-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold uppercase">最大寬 (W)</label>
          <input type="number" value={layout.w} onChange={(e) => handleTextLayoutChange(type, 'w', Number(e.target.value))} className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-slate-300 text-center outline-none focus:border-blue-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 font-sans text-[15px]">
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-blue-500/30 rounded-[40px] shadow-[0_0_100px_rgba(59,130,246,0.2)] overflow-hidden p-12 text-center">
            <h3 className="text-4xl font-black text-white mb-4">請選擇今日鏡面類別</h3>
            <p className="text-slate-400 mb-12 text-lg">您可以隨時在編輯介面開啟「透明模式」。</p>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <button
                onClick={() => handleWelcomeSelection('interview')}
                className="group relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 hover:border-blue-500 transition-all bg-slate-950 shadow-2xl"
              >
                <img src={templateConfig.interview.solid} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="訪問" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                  <span className="text-2xl font-black text-white drop-shadow-lg">電話訪問</span>
                </div>
              </button>

              <button
                onClick={() => handleWelcomeSelection('connection')}
                className="group relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 hover:border-blue-500 transition-all bg-slate-950 shadow-2xl"
              >
                <img src={templateConfig.connection.solid} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="連線" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                  <span className="text-2xl font-black text-white drop-shadow-lg">電話連線</span>
                </div>
              </button>
            </div>

            <label className="hidden inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              我自己上傳空白圖卡 (100%可下載)
              <input type="file" className="hidden" onChange={(e) => { handleFileChange(e, 'template'); setShowWelcome(false); }} accept="image/*" />
            </label>
          </div>
        </div>
      )}

      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 py-4 px-10 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 px-3 py-1 font-black italic text-lg text-white skew-x-[-12deg] shadow-lg shadow-red-900/20">LIVE</div>
          <h1 className="font-black tracking-tight text-white text-xl">電訪產生器</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowWelcome(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-blue-400 transition-all">切換類別</button>
          <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-400 font-bold underline transition-colors">全部清除</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          <section className="bg-slate-900/50 p-8 rounded-[28px] border border-white/5 space-y-8 shadow-2xl backdrop-blur-sm">

            {/* 類別 */}
            <div className="space-y-4">
              <h2 className="text-blue-500 font-black text-xs tracking-widest uppercase">鏡面類別</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentType('interview')}
                  className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${currentType === 'interview' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                >電話訪問</button>
                <button
                  onClick={() => setCurrentType('connection')}
                  className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${currentType === 'connection' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                >電話連線</button>
              </div>
            </div>

            {/* 記者 */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <h2 className="text-blue-500 font-black text-xs tracking-widest uppercase mb-4">記者設定</h2>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setData(prev => ({ ...prev, reporterTitle: 'TVBS', reporterName: '新聞中心' }))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-bold text-slate-300 transition-colors"
                >
                  TVBS新聞中心
                </button>
                <button
                  onClick={() => setData(prev => ({ ...prev, reporterTitle: 'TVBS', reporterName: '採訪中心' }))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-bold text-slate-300 transition-colors"
                >
                  TVBS採訪中心
                </button>
                <button
                  onClick={() => setData(prev => ({ ...prev, reporterTitle: '記者', reporterName: '' }))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-bold text-slate-300 transition-colors"
                >
                  記者
                </button>
              </div>

              <div className="flex gap-5 mb-4">
                <label className="w-24 h-24 bg-slate-950 rounded-[20px] border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 group hover:border-blue-500 transition-all relative">
                  {data.reporterPhoto ?
                    <>
                      <img src={data.reporterPhoto} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setData(prev => ({ ...prev, reporterPhoto: null }));
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors z-10"
                        title="清除照片"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </> :
                    <div className="text-center space-y-1">
                      <svg className="w-6 h-6 mx-auto text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] text-slate-600 font-bold block">上傳照片</span>
                    </div>
                  }
                  <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'reporter')} />
                </label>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">職稱</label>
                      <input name="reporterTitle" value={data.reporterTitle} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-700" placeholder="職稱" />
                    </div>
                    <div className="flex-[1.5]">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">姓名</label>
                      <input name="reporterName" value={data.reporterName} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-700" placeholder="姓名" />
                    </div>
                  </div>
                  {data.reporterPhoto && (
                    <div className="bg-slate-950/50 p-3 rounded-xl space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase flex justify-between">
                        縮放 <span>{(data.reporterSettings.scale * 100).toFixed(0)}%</span>
                      </label>
                      <input
                        type="range" min="0.5" max="3" step="0.05"
                        value={data.reporterSettings.scale}
                        onChange={(e) => handleSettingChange('reporter', 'scale', parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
                  <h3 className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">【記者 稱謂姓名】位置與大小</h3>
                  {renderTextLayoutInputs('reporter')}
                </div>
              </div>
            </div>

            {/* 受訪者 */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-blue-500 font-black text-xs tracking-widest uppercase">受訪者設定</h2>

                <button
                  onClick={() => setIsTransparent(!isTransparent)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isTransparent ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${isTransparent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className="text-[10px] font-black uppercase">透明模式</span>
                </button>
              </div>

              <div className="flex gap-5 mb-4">
                {!isTransparent && (
                  <label className="w-24 h-24 bg-slate-950 rounded-[20px] border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 group hover:border-blue-500 transition-all relative">
                    {data.intervieweePhoto ?
                      <>
                        <img src={data.intervieweePhoto} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setData(prev => ({ ...prev, intervieweePhoto: null }));
                          }}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors z-10"
                          title="清除照片"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </> :
                      <div className="text-center space-y-1">
                        <svg className="w-6 h-6 mx-auto text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] text-slate-600 font-bold block">上傳照片</span>
                      </div>
                    }
                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'interviewee')} />
                  </label>
                )}

                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1 h-[21px]">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">職稱 (左)</label>
                      </div>
                      <input name="intervieweeTitle" value={data.intervieweeTitle} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-700" placeholder="職稱" />
                    </div>
                    <div className="flex-[1.5]">
                      <div className="flex justify-between items-end mb-1 h-[21px]">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">姓名 (右)</label>
                        <button
                          onClick={() => setData(prev => ({ ...prev, isVoiceAltered: !prev.isVoiceAltered }))}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${data.isVoiceAltered ? 'bg-blue-600 border-blue-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'}`}
                        >
                          變音
                        </button>
                      </div>
                      <input name="intervieweeName" value={data.intervieweeName} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-700" placeholder="姓名" />
                    </div>
                  </div>

                  {!isTransparent ? (
                    <>
                      <input name="photoCredit" value={data.photoCredit} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 outline-none placeholder:text-slate-700" placeholder="翻攝來源（例：翻攝 Threads）" />
                      {data.intervieweePhoto && (
                        <div className="bg-slate-950/50 p-3 rounded-xl space-y-2">
                          <label className="text-[10px] text-slate-500 font-black uppercase flex justify-between">
                            縮放 <span>{(data.intervieweeSettings.scale * 100).toFixed(0)}%</span>
                          </label>
                          <input
                            type="range" min="0.5" max="3" step="0.05"
                            value={data.intervieweeSettings.scale}
                            onChange={(e) => handleSettingChange('interviewee', 'scale', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <p className="text-[11px] text-emerald-400 font-bold leading-relaxed">
                        已啟用透明模式。受訪者框已挖空。
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 地圖設定 */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h2 className="text-blue-500 font-black text-xs tracking-widest uppercase mb-4">地圖設定</h2>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMapSelector(true)}
                    className="w-full px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 hover:border-indigo-500 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    選擇內建地圖
                  </button>
                </div>

                {data.mapImage && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                    <img src={data.mapImage} className="w-full h-full object-cover opacity-60" />
                    <button
                      onClick={() => setData(prev => ({ ...prev, mapImage: null }))}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all font-bold text-white text-sm"
                    >
                      移除地圖
                    </button>
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-[10px] text-white">預覽</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
                  <h3 className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">【受訪者 姓名職稱】位置與基準字級</h3>
                  {renderTextLayoutInputs('interviewee')}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 order-1 lg:order-2 space-y-8">
          <NewsCardPreview data={data} onUpdate={setData} />


        </div>
      </main>

      <MapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onSelect={(url) => setData(prev => ({ ...prev, mapImage: url }))}
        categories={MAP_CATEGORIES}
      />
    </div>
  );
};

export default App;
