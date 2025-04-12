import React from 'react';
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useLanguage();
  
  // Get status badge variant based on status
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "pending":
        return "outline";
      case "paid":
        return "default";
      case "processing":
        return "secondary";
      case "shipped":
        return "secondary";
      case "delivered":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "refunded":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {t(`orders.status.${status}`)}
    </Badge>
  );
}