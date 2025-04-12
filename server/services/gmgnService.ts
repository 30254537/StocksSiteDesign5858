import axios from 'axios';
import { load } from 'cheerio';

// STONKS代币合约地址
const STONKS_CONTRACT_ADDRESS = '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump';

// OKX swap ratio - SOL/STONKS
const SOL_STONKS_RATIO = 3531;

// CoinGecko API基本URL
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * 直接从CoinGecko API获取STONKS价格 (使用Pro API)
 */
export async function getStonksPriceFromGmgn(): Promise<number> {
  try {
    console.log('使用CoinGecko Pro API直接获取STONKS价格...');
    
    // 首先尝试使用CoinGecko Pro API直接获取STONKS价格
    try {
      // 使用CoinGecko Pro API v3搜索端点获取STONKS价格
      // 修改API URL以包含API密钥作为查询参数
      const coinGeckoProApiUrl = `https://pro-api.coingecko.com/api/v3/coins/stonks?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      
      const cgResponse = await axios.get(coinGeckoProApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (cgResponse.status === 200 && cgResponse.data && cgResponse.data.market_data && cgResponse.data.market_data.current_price && cgResponse.data.market_data.current_price.usd) {
        const price = cgResponse.data.market_data.current_price.usd;
        
        if (price && !isNaN(price) && price > 0) {
          console.log(`从CoinGecko Pro API直接获取到STONKS价格: $${price}`);
          return price;
        }
      }
    } catch (cgProError) {
      console.error("从CoinGecko Pro API直接获取STONKS价格失败:", cgProError);
    }
    
    // 如果Pro API失败，尝试使用免费API
    try {
      console.log('尝试使用CoinGecko免费API获取STONKS价格...');
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
          console.log(`从CoinGecko免费API直接获取到STONKS价格: $${price}`);
          return price;
        }
      }
    } catch (cgError) {
      console.error("从CoinGecko免费API直接获取STONKS价格失败:", cgError);
    }
    
    // 如果两种直接获取都失败，使用最后的备用方法 - 获取SOL价格计算
    console.log('通过SOL价格计算STONKS价格作为最后备用...');
    
    // 尝试使用Pro API获取SOL价格
    try {
      const solProApiUrl = `https://pro-api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      const solResponse = await axios.get(solProApiUrl, {
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
        
        console.log(`通过Pro API获取的SOL价格($${solPrice})和比率(${SOL_STONKS_RATIO})计算STONKS价格: $${stonksPrice.toFixed(6)}`);
        return parseFloat(stonksPrice.toFixed(6));
      }
    } catch (solProError) {
      console.error("从CoinGecko Pro API获取SOL价格失败:", solProError);
    }
    
    // 如果Pro API获取SOL价格失败，尝试使用免费API
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
      
      console.log(`通过免费API获取的SOL价格($${solPrice})和比率(${SOL_STONKS_RATIO})计算STONKS价格: $${stonksPrice.toFixed(6)}`);
      return parseFloat(stonksPrice.toFixed(6));
    }
    
    throw new Error('所有方法获取STONKS价格失败');
  } catch (error) {
    console.error('获取STONKS价格失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币详细信息
 * 使用CoinGecko Pro API
 */
export async function getTokenInfo(): Promise<any> {
  try {
    console.log('使用CoinGecko Pro API获取STONKS代币信息...');
    
    // 初始化基本代币信息
    const tokenInfo = {
      address: STONKS_CONTRACT_ADDRESS,
      name: 'STONKS',
      symbol: 'STONKS',
      network: 'Solana',
      price: 0,
      totalSupply: '2,000,000,000',
      holders: '10,000+',
      website: 'https://gmgn.ai',
      marketCap: 0,
      volume24h: 0,
      priceChange24h: 0,
      priceChangePercentage24h: 0
    };
    
    // 首先尝试使用CoinGecko Pro API获取详细数据
    try {
      // 使用CoinGecko Pro API获取STONKS详细数据，使用查询参数方式添加API密钥
      const coinGeckoProApiUrl = `https://pro-api.coingecko.com/api/v3/coins/stonks?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      
      const cgProResponse = await axios.get(coinGeckoProApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (cgProResponse.status === 200 && cgProResponse.data) {
        const data = cgProResponse.data;
        
        // 更新代币基本信息
        if (data.name) tokenInfo.name = data.name;
        if (data.symbol) tokenInfo.symbol = data.symbol.toUpperCase();
        
        // 更新市场数据
        if (data.market_data) {
          const marketData = data.market_data;
          
          if (marketData.current_price && marketData.current_price.usd) {
            tokenInfo.price = marketData.current_price.usd;
          }
          
          if (marketData.market_cap && marketData.market_cap.usd) {
            tokenInfo.marketCap = marketData.market_cap.usd;
          }
          
          if (marketData.total_volume && marketData.total_volume.usd) {
            tokenInfo.volume24h = marketData.total_volume.usd;
          }
          
          if (marketData.price_change_24h) {
            tokenInfo.priceChange24h = marketData.price_change_24h;
          }
          
          if (marketData.price_change_percentage_24h) {
            tokenInfo.priceChangePercentage24h = marketData.price_change_percentage_24h;
          }
          
          if (marketData.total_supply) {
            tokenInfo.totalSupply = marketData.total_supply.toString();
          }
        }
        
        console.log(`从CoinGecko Pro API成功获取STONKS代币详细信息`);
        return tokenInfo;
      }
    } catch (cgProError) {
      console.error("从CoinGecko Pro API获取STONKS代币详细信息失败:", cgProError);
    }
    
    // 如果Pro API失败，尝试使用免费API
    try {
      console.log('尝试使用CoinGecko免费API获取STONKS代币信息...');
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
        
        // 更新代币信息
        if (coinData.name) tokenInfo.name = coinData.name;
        if (coinData.symbol) tokenInfo.symbol = coinData.symbol.toUpperCase();
        if (coinData.current_price) tokenInfo.price = coinData.current_price;
        if (coinData.market_cap) tokenInfo.marketCap = coinData.market_cap;
        if (coinData.total_volume) tokenInfo.volume24h = coinData.total_volume;
        if (coinData.price_change_24h) tokenInfo.priceChange24h = coinData.price_change_24h;
        if (coinData.price_change_percentage_24h) tokenInfo.priceChangePercentage24h = coinData.price_change_percentage_24h;
        
        console.log(`从CoinGecko免费API成功获取STONKS代币信息`);
        return tokenInfo;
      }
    } catch (cgError) {
      console.error("从CoinGecko免费API获取STONKS代币信息失败:", cgError);
    }
    
    // 如果两种API都失败，至少获取价格
    try {
      const price = await getStonksPriceFromGmgn();
      if (price && price > 0) {
        tokenInfo.price = price;
      }
    } catch (priceError) {
      console.error('获取STONKS价格失败:', priceError);
    }
    
    console.log(`使用基本信息返回STONKS代币数据`);
    return tokenInfo;
  } catch (error) {
    console.error('获取STONKS代币信息失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币的24小时价格变化
 * 通过CoinGecko Pro API获取价格变化数据
 */
export async function getStonksPriceChange(): Promise<any> {
  try {
    console.log('从CoinGecko Pro API获取STONKS价格变化...');
    
    // 默认值
    let priceChange24h = '0';
    let percentChange24h = '0';
    
    // 首先尝试使用Pro API获取详细数据
    try {
      // 使用CoinGecko Pro API获取STONKS详细数据，使用查询参数方式添加API密钥
      const coinGeckoProApiUrl = `https://pro-api.coingecko.com/api/v3/coins/stonks?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      
      const cgProResponse = await axios.get(coinGeckoProApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (cgProResponse.status === 200 && cgProResponse.data && cgProResponse.data.market_data) {
        const marketData = cgProResponse.data.market_data;
        
        if (marketData.price_change_24h) {
          priceChange24h = marketData.price_change_24h.toString();
        }
        
        if (marketData.price_change_percentage_24h) {
          percentChange24h = marketData.price_change_percentage_24h.toString();
        }
        
        console.log(`从CoinGecko Pro API直接获取STONKS价格变化成功: ${percentChange24h}%`);
        return {
          priceChange24h,
          percentChange24h
        };
      }
    } catch (cgProError) {
      console.error("从CoinGecko Pro API获取STONKS价格变化失败:", cgProError);
    }
    
    // 如果Pro API失败，尝试使用免费API
    try {
      console.log('尝试使用CoinGecko免费API获取STONKS价格变化...');
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
        
        console.log(`从CoinGecko免费API获取STONKS价格变化成功: ${percentChange24h}%`);
        return {
          priceChange24h,
          percentChange24h
        };
      }
    } catch (cgError) {
      console.error("从CoinGecko免费API获取STONKS价格变化失败:", cgError);
    }
    
    // 如果两种直接获取都失败，使用SOL价格变化作为替代
    console.log('尝试通过SOL价格变化作为参考...');
    
    // 尝试使用Pro API获取SOL价格变化
    try {
      const solProApiUrl = 'https://pro-api.coingecko.com/api/v3/coins/solana';
      const solProResponse = await axios.get(solProApiUrl, {
        headers: {
          'Accept': 'application/json',
          'X-CG-Pro-API-Key': process.env.COINGECKO_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      if (solProResponse.status === 200 && solProResponse.data && solProResponse.data.market_data) {
        const marketData = solProResponse.data.market_data;
        
        if (marketData.price_change_24h) {
          // 使用SOL的价格变化数据计算STONKS价格变化
          priceChange24h = (marketData.price_change_24h / SOL_STONKS_RATIO).toFixed(8);
        }
        
        if (marketData.price_change_percentage_24h) {
          // 百分比变化可以直接使用
          percentChange24h = marketData.price_change_percentage_24h.toString();
        }
        
        console.log(`使用Pro API获取SOL价格变化作为STONKS价格变化的参考: ${percentChange24h}%`);
        return {
          priceChange24h,
          percentChange24h
        };
      }
    } catch (solProError) {
      console.error("从CoinGecko Pro API获取SOL价格变化失败:", solProError);
    }
    
    // 最后尝试免费API获取SOL数据
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
          // 计算STONKS价格变化
          priceChange24h = (solResponse.data.market_data.price_change_24h / SOL_STONKS_RATIO).toFixed(8);
        }
        
        if (solResponse.data.market_data.price_change_percentage_24h) {
          // 百分比变化直接使用
          percentChange24h = solResponse.data.market_data.price_change_percentage_24h.toString();
        }
        
        console.log(`使用免费API获取SOL价格变化作为STONKS价格变化的参考: ${percentChange24h}%`);
      }
    } catch (solError) {
      console.error("从免费API获取SOL价格变化数据失败:", solError);
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