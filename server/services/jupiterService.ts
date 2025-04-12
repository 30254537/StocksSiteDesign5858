import axios from 'axios';

// STONKS代币合约地址
const STONKS_CONTRACT_ADDRESS = '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump';
// SOL代币合约地址（Solana原生代币）
const SOL_CONTRACT_ADDRESS = 'So11111111111111111111111111111111111111112';
// USDC代币合约地址（Solana上的稳定币，用于获取美元价格）
const USDC_CONTRACT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// 用于获取代币价格的Jupiter API端点
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
// 用于获取代币列表的Jupiter API端点
const JUPITER_TOKEN_LIST_API = 'https://token.jup.ag/all';

/**
 * 从Jupiter API获取所有代币列表
 */
export async function getTokenList() {
  try {
    const response = await axios.get(JUPITER_TOKEN_LIST_API, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'STONKS-DEX-SHOP/1.0'
      },
      timeout: 5000
    });

    if (response.status === 200 && response.data) {
      return response.data;
    }
    throw new Error('无法获取Jupiter代币列表');
  } catch (error) {
    console.error('从Jupiter获取代币列表失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS-USDC交易对报价，用于计算STONKS的美元价格
 * @param amount 用于报价的STONKS代币数量（默认1个STONKS）
 * @returns STONKS代币的美元价格
 */
export async function getStonksUsdcPrice(amount: number = 1000000): Promise<number> {
  try {
    console.log('从Jupiter API获取STONKS-USDC报价...');
    // 构建请求参数 - 从STONKS到USDC的报价
    const params = {
      inputMint: STONKS_CONTRACT_ADDRESS,
      outputMint: USDC_CONTRACT_ADDRESS,
      amount: amount, // 以STONKS最小单位计算（通常是lamports，6位小数）
      slippageBps: 50 // 0.5%的滑点容忍度
    };

    const response = await axios.get(JUPITER_QUOTE_API, {
      params,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'STONKS-DEX-SHOP/1.0'
      },
      timeout: 5000
    });

    if (response.status === 200 && response.data && response.data.outAmount) {
      // 计算1个STONKS的USDC价值
      // USDC通常有6位小数，所以除以1,000,000来获取美元价格
      const outAmount = parseInt(response.data.outAmount);
      const price = outAmount / 1000000 / (amount / 1000000);
      console.log(`通过Jupiter获取的STONKS-USDC价格: $${price.toFixed(6)}`);
      return parseFloat(price.toFixed(6));
    }

    throw new Error('Jupiter返回的价格数据无效');
  } catch (error: any) {
    // 如果返回了特定错误代码TOKEN_NOT_TRADABLE，说明STONKS不能直接与USDC交易
    if (error.response && error.response.data && error.response.data.errorCode === 'TOKEN_NOT_TRADABLE') {
      console.log('STONKS不能直接与USDC交易，尝试通过SOL获取价格...');
      return getStonksPriceViaSol();
    }
    
    console.error('从Jupiter获取STONKS-USDC价格失败:', error);
    throw error;
  }
}

/**
 * 通过SOL作为中间币获取STONKS的美元价格
 * 1. 获取STONKS-SOL交易对的价格比率
 * 2. 获取SOL-USDC交易对的价格
 * 3. 计算STONKS的美元价格
 */
export async function getStonksPriceViaSol(): Promise<number> {
  try {
    console.log('从Jupiter API通过SOL获取STONKS价格...');
    
    // 1. 获取STONKS-SOL比率（多少个STONKS可以换1个SOL）
    const stonksToSolParams = {
      inputMint: STONKS_CONTRACT_ADDRESS,
      outputMint: SOL_CONTRACT_ADDRESS,
      amount: 1000000000, // 1 STONKS (考虑到小数位)
      slippageBps: 50
    };

    // 2. 获取SOL-USDC价格（1个SOL值多少USDC）
    const solToUsdcParams = {
      inputMint: SOL_CONTRACT_ADDRESS,
      outputMint: USDC_CONTRACT_ADDRESS,
      amount: 1000000000, // 1 SOL (9位小数)
      slippageBps: 50
    };

    // 并行执行两个请求
    const [stonksToSolResponse, solToUsdcResponse] = await Promise.all([
      axios.get(JUPITER_QUOTE_API, {
        params: stonksToSolParams,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'STONKS-DEX-SHOP/1.0'
        },
        timeout: 5000
      }).catch(err => {
        console.error('获取STONKS-SOL报价失败:', err);
        return null;
      }),
      
      axios.get(JUPITER_QUOTE_API, {
        params: solToUsdcParams,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'STONKS-DEX-SHOP/1.0'
        },
        timeout: 5000
      })
    ]);

    // 如果获取STONKS-SOL失败，可能是因为STONKS不在Jupiter上交易
    if (!stonksToSolResponse) {
      console.log('无法通过Jupiter获取STONKS价格，使用备用计算方法...');
      // 使用之前计算的比率和当前SOL价格
      const solPrice = parseFloat(solToUsdcResponse.data.outAmount) / 1000000;
      // 使用固定比率计算STONKS价格
      const stonksPrice = solPrice / 3531;
      console.log(`使用SOL价格 ($${solPrice}) 和固定比率 (3531) 计算STONKS价格: $${stonksPrice.toFixed(6)}`);
      return parseFloat(stonksPrice.toFixed(6));
    }

    // 如果两个请求都成功，计算STONKS的美元价格
    const stonksToSolRate = parseFloat(stonksToSolResponse.data.outAmount) / 1000000000;
    const solToUsdcRate = parseFloat(solToUsdcResponse.data.outAmount) / 1000000;
    
    // STONKS美元价格 = SOL的美元价格 / 1个SOL可以换多少STONKS
    const stonksPrice = solToUsdcRate * stonksToSolRate;
    
    console.log(`通过Jupiter获取的SOL价格: $${solToUsdcRate.toFixed(2)}`);
    console.log(`通过Jupiter获取的STONKS-SOL比率: ${stonksToSolRate}`);
    console.log(`计算得出的STONKS价格: $${stonksPrice.toFixed(6)}`);
    
    return parseFloat(stonksPrice.toFixed(6));
  } catch (error: any) {
    console.error('通过Jupiter和SOL获取STONKS价格失败:', error);
    throw error;
  }
}

/**
 * 主函数：获取STONKS代币的价格
 * 首先尝试直接获取STONKS-USDC价格
 * 如果失败，尝试通过SOL作为中间币获取价格
 */
export async function getStonksPrice(): Promise<number> {
  try {
    // 首先尝试直接获取STONKS-USDC价格
    return await getStonksUsdcPrice().catch(async () => {
      // 如果直接获取失败，尝试通过SOL获取
      return await getStonksPriceViaSol();
    });
  } catch (error: any) {
    console.error('从Jupiter获取STONKS价格的所有方法都失败:', error);
    throw error;
  }
}