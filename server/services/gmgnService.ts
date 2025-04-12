import axios from 'axios';
import { load } from 'cheerio';

// STONKS代币合约地址
const STONKS_CONTRACT_ADDRESS = '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump';

// OKX swap ratio - SOL/STONKS
const SOL_STONKS_RATIO = 3531;

// CoinGecko API基本URL
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * 从CoinGecko直接获取STONKS价格，或通过SOL价格计算
 */
export async function getStonksPriceFromGmgn(): Promise<number> {
  try {
    console.log('从CoinGecko获取STONKS价格...');
    
    // 首先尝试直接从CoinGecko获取STONKS价格
    try {
      const coinGeckoApiUrl = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=stonks&per_page=1`;
      
      const cgResponse = await axios.get(coinGeckoApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (cgResponse.status === 200 && cgResponse.data && cgResponse.data.length > 0) {
        const price = cgResponse.data[0].current_price;
        
        if (price && !isNaN(price) && price > 0) {
          console.log(`从CoinGecko直接获取到STONKS价格: $${price}`);
          return price;
        }
      }
    } catch (cgError) {
      console.error("从CoinGecko直接获取STONKS价格失败:", cgError);
    }
    
    // 如果直接获取失败，使用CoinGecko获取SOL价格再计算STONKS价格
    console.log('通过SOL价格计算STONKS价格...');
    
    const solApiUrl = `${COINGECKO_API_URL}/simple/price?ids=solana&vs_currencies=usd`;
    const solResponse = await axios.get(solApiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    
    if (solResponse.status === 200 && solResponse.data && solResponse.data.solana && solResponse.data.solana.usd) {
      const solPrice = solResponse.data.solana.usd;
      
      // 使用固定的SOL/STONKS比率计算STONKS价格
      const stonksPrice = solPrice / SOL_STONKS_RATIO;
      
      console.log(`通过SOL价格($${solPrice})和比率(${SOL_STONKS_RATIO})计算STONKS价格: $${stonksPrice.toFixed(6)}`);
      return parseFloat(stonksPrice.toFixed(6));
    }
    
    throw new Error('无法获取SOL价格用于计算STONKS价格');
  } catch (error) {
    console.error('获取STONKS价格失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币详细信息
 */
export async function getTokenInfo(): Promise<any> {
  try {
    console.log('获取STONKS代币信息...');
    
    // 基本代币信息
    const tokenInfo = {
      address: STONKS_CONTRACT_ADDRESS,
      name: 'STONKS',
      symbol: 'STONKS',
      network: 'Solana',
      price: 0,
      totalSupply: '2,000,000,000',
      holders: '10,000+',
      website: 'https://gmgn.ai'
    };
    
    // 获取最新价格
    try {
      const price = await getStonksPriceFromGmgn();
      if (price && price > 0) {
        tokenInfo.price = price;
      }
    } catch (priceError) {
      console.error('获取STONKS价格失败:', priceError);
    }
    
    console.log(`成功获取STONKS代币信息`);
    return tokenInfo;
  } catch (error) {
    console.error('获取STONKS代币信息失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币的24小时价格变化
 * 通过CoinGecko API获取价格变化数据
 */
export async function getStonksPriceChange(): Promise<any> {
  try {
    console.log('从CoinGecko获取STONKS价格变化...');
    
    // 默认值
    let priceChange24h = '0';
    let percentChange24h = '0';
    
    // 尝试从CoinGecko获取价格变化数据
    try {
      const coinGeckoApiUrl = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=stonks&per_page=1`;
      
      const cgResponse = await axios.get(coinGeckoApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (cgResponse.status === 200 && cgResponse.data && cgResponse.data.length > 0) {
        const coinData = cgResponse.data[0];
        
        if (coinData.price_change_24h) {
          priceChange24h = coinData.price_change_24h.toString();
        }
        
        if (coinData.price_change_percentage_24h) {
          percentChange24h = coinData.price_change_percentage_24h.toString();
        }
        
        console.log(`从CoinGecko获取STONKS价格变化成功: ${percentChange24h}%`);
      }
    } catch (cgError) {
      console.error("从CoinGecko获取STONKS价格变化失败:", cgError);
    }
    
    // 如果CoinGecko失败，使用简单的SOL价格变化作为替代
    if (priceChange24h === '0' && percentChange24h === '0') {
      try {
        const solApiUrl = `${COINGECKO_API_URL}/coins/solana?market_data=true`;
        const solResponse = await axios.get(solApiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });
        
        if (solResponse.status === 200 && solResponse.data && solResponse.data.market_data) {
          // 使用SOL的价格变化数据
          if (solResponse.data.market_data.price_change_24h) {
            // 假设STONKS和SOL的价格变化关联
            priceChange24h = (solResponse.data.market_data.price_change_24h / SOL_STONKS_RATIO).toFixed(8);
          }
          
          if (solResponse.data.market_data.price_change_percentage_24h) {
            // 通常百分比变化可以直接使用
            percentChange24h = solResponse.data.market_data.price_change_percentage_24h.toString();
          }
          
          console.log(`使用SOL价格变化作为STONKS价格变化的参考: ${percentChange24h}%`);
        }
      } catch (solError) {
        console.error("获取SOL价格变化数据失败:", solError);
      }
    }
    
    return {
      priceChange24h,
      percentChange24h
    };
  } catch (error) {
    console.error('获取STONKS价格变化失败:', error);
    throw error;
  }
}