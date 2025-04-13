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
      <h3 className="text-lg font-medium mb-4">{t('contact.title', 'Contact Information')}</h3>
      
      <div className="space-y-4">
        {/* 姓名 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerName">
            <User className="w-4 h-4 inline mr-2" />
            {t('contact.name', 'Name:')}
          </Label>
          <Input
            id="customerName"
            placeholder={t('contact.namePlaceholder', 'Enter your name')}
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        
        {/* 邮箱 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerEmail">
            <Mail className="w-4 h-4 inline mr-2" />
            {t('contact.emailRequired', 'Email: *')}
          </Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder={t('contact.emailPlaceholder', 'Enter your email address')}
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('contact.emailHint', 'Used for order confirmation and status updates')}
          </p>
        </div>
        
        {/* 电话 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="customerPhone">
            <Phone className="w-4 h-4 inline mr-2" />
            {t('contact.phone', 'Phone:')}
          </Label>
          <Input
            id="customerPhone"
            placeholder={t('contact.phonePlaceholder', 'Enter your phone number')}
            className="mt-1 bg-slate-800 border-gray-700"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        
        {/* 收货地址 */}
        <div>
          <Label className="text-sm font-medium text-accent" htmlFor="shippingAddress">
            <MapPin className="w-4 h-4 inline mr-2" />
            {t('contact.addressRequired', 'Shipping Address: *')}
          </Label>
          <Textarea
            id="shippingAddress"
            placeholder={t('contact.addressPlaceholder', 'Enter your shipping address')}
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