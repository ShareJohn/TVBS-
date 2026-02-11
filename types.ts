
export interface PhotoSettings {
  x: number;
  y: number;
  scale: number;
}

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextLayout {
  x: number;
  y: number;
  w: number; // Max Width
  size: number; // Font Size (Base size for title)
}

export interface NewsCardData {
  solidTemplate: string;          // 實底圖 (最底層)
  transparentTemplate: string;    // 透底圖 (中間層，疊加用)

  reporterName: string;           // 新增：記者姓名
  reporterTitle: string;          // 新增：記者職稱 (預設 '記者')
  reporterPhoto: string | null;
  reporterSettings: PhotoSettings;
  reporterFrame: FrameRect;
  reporterTextLayout: TextLayout;

  intervieweeName: string;        // 受訪者姓名
  intervieweeTitle: string;       // 受訪者職稱
  intervieweePhoto: string | null;
  intervieweeSettings: PhotoSettings;
  intervieweeFrame: FrameRect;
  intervieweeTextLayout: TextLayout;

  photoCredit: string;
  isTransparentMode: boolean;
  isVoiceAltered: boolean; // 新增：是否變音處理
  mapImage: string | null; // 新增：地圖圖片 (全螢幕)
}
