import React, { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { uploadService } from '../services/uploadService';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB制限
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploading(true);
    
    try {
      // SSH経由でサーバーにアップロード
      const result = await uploadService.uploadImage(file);
      
      if (result.success && result.url) {
        onImageChange(result.url);
        console.log('Upload successful:', result.url);
      } else {
        console.error('Upload failed:', result.error);
        alert(result.error || 'アップロードに失敗しました');
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('アップロードに失敗しました');
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 画像アップロード */}
      <div>
        {/* 現在の画像表示 */}
        <div className="flex items-center space-x-4 mb-4">
          <div 
            onClick={handleBrowseClick}
            className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors"
            title="クリックして画像を選択"
          >
            {currentImage ? (
              <img 
                src={currentImage} 
                alt="プロフィール画像" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-3xl text-gray-400">📷</div>
            )}
          </div>
          
          {currentImage && (
            <button
              onClick={handleRemoveImage}
              className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
              title="画像を削除"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ドラッグ&ドロップエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">アップロード中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Camera className="h-12 w-12 text-gray-400 mb-2" />
              <button
                onClick={handleBrowseClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>ファイルを選択</span>
              </button>
            </div>
          )}
        </div>

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;