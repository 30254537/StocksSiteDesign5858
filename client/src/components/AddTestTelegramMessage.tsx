import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { FaTelegram, FaPlus } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

// 预定义的消息模板
const messageTemplates = [
  {
    name: "基本格式 (仅代币名称/合约)",
    text: `代币名称: $STONKS
合约地址: 0x6cFbB54B10A3AA421334bCa7A52F14B2D2aBFE67`
  },
  {
    name: "详细格式 (名称/合约/更多信息)",
    text: `🔔 金狗监测提醒

💰 代币名称: $NewCoin

📝 合约地址: 0xDgVF43sxKzp7H2L5Rrx8jeY7UkrTabCeGf61Tpbump`
  },
];

const AddTestTelegramMessage: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      toast({
        title: language === 'zh' ? "消息不能为空" : "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/telegram-messages-test", { text: messageText });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: language === 'zh' ? "消息添加成功" : "Message added successfully",
          description: language === 'zh' ? "新的金狗监测消息已添加" : "New Golden Dog alert message has been added",
          variant: "default",
        });
        
        // 清空文本区域
        setMessageText('');
        
        // 刷新消息列表
        queryClient.invalidateQueries({ queryKey: ['/api/telegram-messages'] });
        
        // 收起表单
        setIsExpanded(false);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      toast({
        title: language === 'zh' ? "添加消息失败" : "Failed to add message", 
        description: (error as Error).message || (language === 'zh' ? "请稍后再试" : "Please try again later"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 选择预设模板
  const selectTemplate = (template: typeof messageTemplates[0]) => {
    setMessageText(template.text);
  };

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="text-xs h-8 mt-2 mb-4 w-full bg-blue-900/30 border-blue-700 hover:bg-blue-900/50 hover:text-blue-300"
        onClick={() => setIsExpanded(true)}
      >
        <FaPlus className="mr-1 h-3 w-3" />
        {language === 'zh' ? '添加测试消息' : 'Add Test Message'}
      </Button>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-blue-400 flex items-center">
            <FaTelegram className="mr-2" />
            {language === 'zh' ? '添加测试金狗监测消息' : 'Add Test Golden Dog Message'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs h-6 text-gray-400 hover:text-gray-300"
          >
            {language === 'zh' ? '收起' : 'Close'}
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={language === 'zh' 
              ? "输入金狗监测消息文本，必须包含代币名称和/或合约地址..." 
              : "Enter Golden Dog message text, must include token name and/or contract address..."}
            className="bg-gray-900/50 border-gray-700 min-h-[120px] mb-2"
          />
          
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">
              {language === 'zh' ? '选择预设模板:' : 'Choose template:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {messageTemplates.map((template, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectTemplate(template)}
                  className="text-xs bg-gray-900/50 border-gray-700"
                >
                  {language === 'zh' ? template.name : template.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !messageText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'zh' ? '添加中...' : 'Adding...'}
              </>
            ) : (
              <>
                {language === 'zh' ? '添加测试消息' : 'Add Test Message'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTestTelegramMessage;