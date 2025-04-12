import axios from 'axios';

// GMGN API基础URL
const GMGN_API_BASE_URL = 'https://api.gmgn.ai';

// STONKS代币合约地址
const STONKS_CONTRACT_ADDRESS = '6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump';

/**
 * 从GMGN API直接获取STONKS价格
 * 根据GMGN API文档: https://docs.gmgn.ai/index/cooperation-api-integrate-gmgn-solana-trading-api
 */
export async function getStonksPriceFromGmgn(): Promise<number> {
  try {
    console.log('从GMGN API获取STONKS价格...');
    
    // 使用GMGN API获取代币价格信息
    const response = await axios.get(`${GMGN_API_BASE_URL}/token/price?symbol=STONKS&network=solana`);
    
    // 检查响应
    if (response.data && response.data.code === 0 && response.data.data) {
      const priceUsd = parseFloat(response.data.data.priceUsd);
      console.log(`从GMGN API获取到STONKS价格: $${priceUsd}`);
      return priceUsd;
    }
    
    throw new Error('GMGN API返回的价格数据格式不正确');
  } catch (error) {
    console.error('从GMGN API获取STONKS价格失败:', error);
    throw error;
  }
}

/**
 * 从GMGN API获取代币详细信息
 */
export async function getTokenInfo(): Promise<any> {
  try {
    console.log('从GMGN API获取STONKS代币信息...');
    
    // 使用GMGN API获取代币信息
    const response = await axios.get(`${GMGN_API_BASE_URL}/token/info?address=${STONKS_CONTRACT_ADDRESS}&network=solana`);
    
    // 检查响应
    if (response.data && response.data.code === 0 && response.data.data) {
      console.log(`成功获取STONKS代币信息`);
      return response.data.data;
    }
    
    throw new Error('GMGN API返回的代币信息格式不正确');
  } catch (error) {
    console.error('从GMGN API获取STONKS代币信息失败:', error);
    throw error;
  }
}

/**
 * 获取STONKS代币的24小时价格变化
 */
export async function getStonksPriceChange(): Promise<any> {
  try {
    console.log('从GMGN API获取STONKS价格变化...');
    
    // 使用GMGN API获取代币价格变化
    const response = await axios.get(`${GMGN_API_BASE_URL}/token/price-change?symbol=STONKS&network=solana`);
    
    // 检查响应
    if (response.data && response.data.code === 0 && response.data.data) {
      console.log(`成功获取STONKS价格变化信息`);
      return response.data.data;
    }
    
    throw new Error('GMGN API返回的价格变化数据格式不正确');
  } catch (error) {
    console.error('从GMGN API获取STONKS价格变化失败:', error);
    throw error;
  }
}