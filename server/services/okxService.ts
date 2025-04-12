import crypto from 'crypto';
import axios from 'axios';

// OKX API 配置
const API_KEY = process.env.OKX_API_KEY;
const SECRET_KEY = process.env.OKX_SECRET_KEY;
const PASSPHRASE = process.env.OKX_PASSPHRASE;
const BASE_URL = 'https://www.okx.com';

// 生成OKX API签名
function generateSignature(timestamp: string, method: string, requestPath: string, body = '') {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac('sha256', SECRET_KEY || '');
  return hmac.update(message).digest('base64');
}

// 创建带有OKX API认证的axios请求
async function okxApiRequest(method: string, endpoint: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const requestPath = `/api/v5${endpoint}`;
  
  // 将请求参数转为字符串（POST请求需要）
  const body = method === 'POST' ? JSON.stringify(data) : '';
  
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${requestPath}`,
      headers: {
        'OK-ACCESS-KEY': API_KEY,
        'OK-ACCESS-SIGN': generateSignature(timestamp, method, requestPath, body),
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': PASSPHRASE,
        'Content-Type': 'application/json'
      },
      data: method === 'POST' ? data : undefined,
      params: method === 'GET' ? data : undefined,
      timeout: 10000 // 10秒超时
    });
    
    return response.data;
  } catch (error) {
    console.error('OKX API请求失败:', error);
    throw error;
  }
}

// 获取SOL-USD价格
export async function getSolanaPrice(): Promise<number> {
  try {
    const endpoint = '/market/ticker';
    const response = await okxApiRequest('GET', endpoint, { instId: 'SOL-USDT' });
    
    if (response && response.data && response.data.length > 0) {
      // 返回最新价格
      const lastPrice = parseFloat(response.data[0].last);
      console.log(`从OKX获取SOL价格: $${lastPrice}`);
      return lastPrice;
    }
    
    throw new Error('OKX返回的SOL价格数据无效');
  } catch (error) {
    console.error('从OKX获取SOL价格失败:', error);
    throw error;
  }
}

// 获取SOL/STONKS的价格比率
export async function getSolStonksRatio(): Promise<number> {
  try {
    // 根据OKX上显示的STONKS实际价格 $0.032834 和当前SOL价格 $120.4 计算比率
    // 计算方法: SOL价格 / STONKS价格 = 比率
    // $120.4 / $0.032834 ≈ 3667
    
    // 1 SOL = 3667 STONKS (inverse = 0.00027)
    const solToStonksRatio = 3667;
    
    return solToStonksRatio;
  } catch (error) {
    console.error('计算SOL/STONKS比率失败:', error);
    throw error;
  }
}

// 直接从OKX获取STONKS的USD价格
export async function getDirectStonksPrice(): Promise<number> {
  try {
    const endpoint = '/market/ticker';
    const response = await okxApiRequest('GET', endpoint, { instId: 'STONKS-USDT' });
    
    if (response && response.data && response.data.length > 0) {
      // 返回最新价格
      const lastPrice = parseFloat(response.data[0].last);
      console.log(`从OKX获取STONKS价格成功: ${lastPrice} USD`);
      return lastPrice;
    }
    
    throw new Error('OKX返回的STONKS价格数据无效');
  } catch (error) {
    console.error('直接从OKX获取STONKS价格失败:', error);
    // 如果直接获取失败，回退到通过SOL计算的方法
    return calculateStonksPriceFromSol();
  }
}

// 通过SOL价格计算STONKS价格（作为备用方法）
async function calculateStonksPriceFromSol(): Promise<number> {
  try {
    // 获取SOL价格
    const solPrice = await getSolanaPrice();
    
    // 获取SOL到STONKS的比率
    const solToStonksRatio = await getSolStonksRatio();
    
    // 计算STONKS价格 (SOL价格 / SOL-STONKS比率)
    const stonksPrice = solPrice / solToStonksRatio;
    
    console.log(`计算得出STONKS价格: $${stonksPrice.toFixed(6)}`);
    return parseFloat(stonksPrice.toFixed(6));
  } catch (error) {
    console.error('从SOL计算STONKS价格失败:', error);
    throw error;
  }
}

// 获取STONKS的USD价格（主函数）
export async function getStonksPrice(): Promise<number> {
  try {
    // 优先尝试直接从OKX获取STONKS价格
    return await getDirectStonksPrice();
  } catch (error) {
    console.error('从OKX获取STONKS价格失败，回退到计算方法:', error);
    // 如果直接获取失败，回退到通过SOL计算的方法
    return calculateStonksPriceFromSol();
  }
}

// 通过OKX API获取转账交易路由（需要公共访问令牌）
export async function getSwapRoute(tokenIn: string, tokenOut: string, amount: string): Promise<any> {
  try {
    const endpoint = '/web3/swap/quote';
    const params = {
      chainName: 'solana',
      tokenIn,
      tokenOut,
      amountIn: amount,
    };
    
    const response = await okxApiRequest('GET', endpoint, params);
    
    if (response && response.code === '0') {
      return response.data;
    }
    
    throw new Error(`OKX swap route API返回错误: ${response.msg || 'Unknown error'}`);
  } catch (error) {
    console.error('获取OKX交换路由失败:', error);
    throw error;
  }
}