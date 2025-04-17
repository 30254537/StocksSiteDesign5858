import React, { useState, useRef } from 'react';
import { Upload, X, Music, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isAudioFile } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface MusicUploadProps {
  onSuccess?: () => void;
  className?: string;
}

export default function MusicUpload({ onSuccess, className = '' }: MusicUploadProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trackTitle, setTrackTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [style, setStyle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const audioFiles = selectedFiles.filter(file => isAudioFile(file.name));
    
    if (audioFiles.length !== selectedFiles.length) {
      toast({
        title: language === 'en' ? "Invalid files" : "无效的文件",
        description: language === 'en' 
          ? "Only audio files (.mp3, .wav, .ogg, .m4a, .flac, .aac) are allowed" 
          : "只允许上传音频文件 (.mp3, .wav, .ogg, .m4a, .flac, .aac)",
        variant: "destructive"
      });
    }
    
    if (audioFiles.length > 0) {
      setFiles(prev => [...prev, ...audioFiles]);
      // Auto-fill track title from first file if no title set yet
      if (!trackTitle && audioFiles[0]) {
        const fileName = audioFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTrackTitle(fileName);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const audioFiles = droppedFiles.filter(file => isAudioFile(file.name));
    
    if (audioFiles.length !== droppedFiles.length) {
      toast({
        title: language === 'en' ? "Invalid files" : "无效的文件",
        description: language === 'en' 
          ? "Only audio files (.mp3, .wav, .ogg, .m4a, .flac, .aac) are allowed" 
          : "只允许上传音频文件 (.mp3, .wav, .ogg, .m4a, .flac, .aac)",
        variant: "destructive"
      });
    }
    
    if (audioFiles.length > 0) {
      setFiles(prev => [...prev, ...audioFiles]);
      // Auto-fill track title from first file if no title set yet
      if (!trackTitle && audioFiles[0]) {
        const fileName = audioFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTrackTitle(fileName);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: language === 'en' ? "No files selected" : "未选择文件",
        description: language === 'en' ? "Please select at least one audio file to upload" : "请至少选择一个音频文件上传",
        variant: "destructive"
      });
      return;
    }
    
    if (!trackTitle) {
      toast({
        title: language === 'en' ? "Missing information" : "缺少信息",
        description: language === 'en' ? "Please enter a track title" : "请输入歌曲标题",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 首先尝试使用直接上传API端点
      const apiEndpoint = '/api/direct-upload'; // 使用新的直接上传端点
      const fileFieldName = 'musicFile';
      
      // 我们只处理一个文件，如果有多个文件，只取第一个
      const file = files[0];
      
      const formData = new FormData();
      formData.append(fileFieldName, file);
      formData.append('title', trackTitle);
      formData.append('artist', artist || 'Unknown Artist');
      formData.append('style', style || 'General');
      
      console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
          console.log('上传进度:', percentComplete + '%');
        }
      });
      
      xhr.onload = async () => {
        console.log('上传响应状态:', xhr.status);
        console.log('上传响应内容:', xhr.responseText);
        
        try {
          // 尝试解析响应JSON
          const responseData = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300 && responseData.success) {
            console.log('上传成功，文件URL:', responseData.file.url);
            
            // 在全局对象上存储上传的音乐URL，以便管理页面可以使用
            if (window) {
              (window as any).uploadedMusicUrl = responseData.file.url;
              console.log('保存uploadedMusicUrl:', responseData.file.url);
            }
            
            toast({
              title: language === 'en' ? "Upload successful" : "上传成功",
              description: language === 'en' ? "Your music has been uploaded" : "音乐已成功上传",
              variant: "default"
            });
            
            // 重置表单
            setFiles([]);
            setTrackTitle('');
            setArtist('');
            setStyle('');
            
            // 调用成功回调
            if (onSuccess) onSuccess();
          } else {
            console.error('上传失败:', responseData.message || '未知错误');
            
            toast({
              title: language === 'en' ? "Upload failed" : "上传失败",
              description: responseData.message || (language === 'en' ? "Server error" : "服务器错误"),
              variant: "destructive"
            });
          }
        } catch (parseError) {
          console.error('解析响应失败:', parseError);
          toast({
            title: language === 'en' ? "Upload failed" : "上传失败",
            description: language === 'en' ? "Server error" : "服务器错误",
            variant: "destructive"
          });
        }
        
        setIsUploading(false);
      };
      
      xhr.onerror = (error) => {
        console.error('上传错误:', error);
        toast({
          title: language === 'en' ? "Upload failed" : "上传失败",
          description: language === 'en' ? "An error occurred during upload" : "上传过程中发生错误",
          variant: "destructive"
        });
        setIsUploading(false);
      };
      
      console.log('准备发送请求到:', apiEndpoint);
      xhr.open('POST', apiEndpoint);
      xhr.send(formData);
      
    } catch (error: any) {
      toast({
        title: t('music.uploadError'),
        description: error.message || "An error occurred during upload",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  
  return (
    <div className={`p-6 rounded-xl border border-accent/20 bg-background/40 backdrop-blur-sm ${className}`}>
      <h2 className="text-xl font-medium mb-4 text-white">{t('music.uploadTitle')}</h2>
      
      <div 
        className="border-2 border-dashed border-accent/30 rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-accent/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/flac,audio/aac"
          multiple
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-accent/70 mb-2" />
          <p className="text-white/80 font-medium">{t('music.dragDrop')}</p>
          <span className="text-xs text-gray-400 mb-2">or</span>
          <Button variant="outline" className="border-accent/40 text-accent hover:bg-accent/10 hover:text-white">
            {t('music.browse')}
          </Button>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-white/80">{language === 'en' ? "Selected Files:" : "已选择文件:"}</h3>
          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-background/60 p-2 rounded text-sm"
              >
                <div className="flex items-center">
                  <Music className="h-4 w-4 text-accent mr-2" />
                  <span className="truncate max-w-[12rem]">{file.name}</span>
                </div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid gap-4 mb-4">
        <div>
          <Label htmlFor="trackTitle" className="text-white/80">{t('music.trackTitle')}</Label>
          <Input 
            id="trackTitle"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
            placeholder={language === 'en' ? "Enter track title" : "输入歌曲名称"}
            className="bg-background/60 border-accent/30 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="artist" className="text-white/80">{t('music.artist')}</Label>
          <Input 
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder={language === 'en' ? "Enter artist name (optional)" : "输入艺术家名称（可选）"}
            className="bg-background/60 border-accent/30 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="style" className="text-white/80">{language === 'en' ? "Music Style" : "音乐风格"}</Label>
          <Input 
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder={language === 'en' ? "Enter music style (optional)" : "输入音乐风格（可选）"}
            className="bg-background/60 border-accent/30 text-white"
          />
        </div>
      </div>
      
      {isUploading && (
        <div className="mb-4">
          <div className="h-2 w-full bg-background/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1 text-white/60">{uploadProgress}% {t('music.uploading')}</p>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="bg-accent hover:bg-accent/80 text-primary flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('music.uploading')}
            </>
          ) : (
            t('music.upload')
          )}
        </Button>
        
        {files.length > 0 && (
          <Button
            onClick={() => setFiles([])}
            variant="outline"
            disabled={isUploading}
            className="border-red-500/40 text-red-500 hover:bg-red-500/10"
          >
            {t('music.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}