import axios from 'axios';
import { load } from 'cheerio';

// STONKS代币合约地址
const STONKS_CONTRACT_ADDRESS = '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump';

// OKX swap ratio - SOL/STONKS
const SOL_STONKS_RATIO = 3531;

/**
 * 从CoinGecko直接获取STONKS价格，或通过SOL价格计算
 */
export async function getStonksPriceFromGmgn(): Promise<number> {
  try {
    console.log('从CoinGecko获取STONKS价格...');
    
    // 首先尝试直接从CoinGecko获取STONKS价格
    try {
      const coinGeckoApiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=stonks&per_page=1';
      
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
    
    const solApiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
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
 * 从GMGN网站获取代币详细信息
 */
export async function getTokenInfo(): Promise<any> {
  try {
    console.log('从GMGN网站获取STONKS代币信息...');
    
    // 请求STONKS代币页面
    const response = await axios.get(STONKS_TOKEN_PAGE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    // 使用cheerio解析HTML
    const $ = load(response.data);
    
    // 尝试从页面中提取代币信息
    // 这里需要根据实际网页结构进行调整
    const tokenInfo = {
      address: STONKS_CONTRACT_ADDRESS,
      name: 'STONKS',
      symbol: 'STONKS',
      network: 'Solana',
      price: 0,
      totalSupply: '',
      holders: '',
      website: 'https://gmgn.ai'
    };
    
    // 尝试提取价格
    const price = await getStonksPriceFromGmgn();
    if (price > 0) {
      tokenInfo.price = price;
    }
    
    console.log(`成功从GMGN网站获取STONKS代币信息`);
    return tokenInfo;
  } catch (error) {
    console.error('从GMGN网站获取STONKS代币信息失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币的24小时价格变化
 */
export async function getStonksPriceChange(): Promise<any> {
  try {
    console.log('从GMGN网站获取STONKS价格变化...');
    
    // 请求STONKS代币页面
    const response = await axios.get(STONKS_TOKEN_PAGE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    // 使用cheerio解析HTML
    const $ = load(response.data);
    
    // 尝试从页面中提取价格变化信息
    // 这里需要根据实际网页结构进行调整
    let priceChange24h = '0';
    let percentChange24h = '0';
    
    // 查找包含价格变化的元素
    $('div, span').each((i, elem) => {
      const text = $(elem).text().trim();
      
      // 寻找可能包含24小时变化百分比的文本，如"+5.23%"
      const percentMatch = text.match(/([+-]?\d+\.\d+)%/);
      if (percentMatch && percentMatch[1]) {
        percentChange24h = percentMatch[1];
      }
    });
    
    console.log(`成功从GMGN网站获取STONKS价格变化信息: ${percentChange24h}%`);
    
    return {
      priceChange24h,
      percentChange24h
    };
  } catch (error) {
    console.error('从GMGN网站获取STONKS价格变化失败:', error);
    throw error;
  }
}