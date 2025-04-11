import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StonksPriceContextType {
  currentPrice: number;
  lastUpdated: string | null;
  contractAddress: string | null;
  loading: boolean;
  error: string | null;
  convertUsdToStonks: (usdAmount: number) => number;
  convertStonksToUsd: (stonksAmount: number) => number;
}

const StonksPriceContext = createContext<StonksPriceContextType | null>(null);

export function StonksPriceProvider({ children }: { children: ReactNode }) {
  const [currentPrice, setCurrentPrice] = useState<number>(0.1); // 默认价格为0.1美元
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>("6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 定义转换函数
  const convertUsdToStonks = (usdAmount: number): number => {
    if (!currentPrice || currentPrice === 0) return 0;
    return usdAmount / currentPrice;
  };

  const convertStonksToUsd = (stonksAmount: number): number => {
    return stonksAmount * currentPrice;
  };

  // 获取STONKS价格的函数
  const fetchStonksPrice = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stonks-price');
      
      if (!response.ok) {
        throw new Error(`获取价格失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setCurrentPrice(data.price);
      setLastUpdated(data.lastUpdated);
      if (data.contractAddress) {
        setContractAddress(data.contractAddress);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('获取STONKS价格错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载及周期性更新价格
  useEffect(() => {
    // 初始加载
    fetchStonksPrice();

    // 设置定时器每1秒更新一次价格，确保与GMGN平台实时同步
    const intervalId = setInterval(() => {
      fetchStonksPrice();
    }, 1000);

    // 清理函数
    return () => clearInterval(intervalId);
  }, []);

  const value = {
    currentPrice,
    lastUpdated,
    contractAddress,
    loading,
    error,
    convertUsdToStonks,
    convertStonksToUsd
  };

  return (
    <StonksPriceContext.Provider value={value}>
      {children}
    </StonksPriceContext.Provider>
  );
}

export function useStonksPrice() {
  const context = useContext(StonksPriceContext);
  if (!context) {
    throw new Error('useStonksPrice must be used within a StonksPriceProvider');
  }
  return context;
}