import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerInfoFormProps {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerEmail: string;
  setCustomerEmail: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  shippingAddress: string;
  setShippingAddress: (value: string) => void;
}

export function CustomerInfoForm({
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  setCustomerPhone,
  shippingAddress,
  setShippingAddress
}: CustomerInfoFormProps) {
  const { t } = useLanguage();
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">联系信息</h3>
      
      <div className="space-y-4">
        {/* 姓名 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerName">
            <User className="w-4 h-4 inline mr-2" />
            姓名:
          </Label>
          <Input
            id="customerName"
            placeholder="请输入您的姓名"
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        
        {/* 邮箱 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerEmail">
            <Mail className="w-4 h-4 inline mr-2" />
            电子邮箱: <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="请输入您的电子邮箱"
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            用于接收订单确认和状态更新
          </p>
        </div>
        
        {/* 电话 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerPhone">
            <Phone className="w-4 h-4 inline mr-2" />
            联系电话:
          </Label>
          <Input
            id="customerPhone"
            placeholder="请输入您的联系电话"
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        
        {/* 收货地址 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="shippingAddress">
            <MapPin className="w-4 h-4 inline mr-2" />
            收货地址: <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="shippingAddress"
            placeholder={t('checkout.enterShippingAddress')}
            className="mt-1 bg-slate-800 border-gray-700"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}