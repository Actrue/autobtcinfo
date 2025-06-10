import { schema } from "./types";


export const okx={
    getCryptoInfo
}
async function getCryptoInfo(instId: string) {
    const okxResponse = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&&limit=100&&bar=1Dutc`,{
        method: 'GET',
    });
    
    
  
    const okxData = schema.OkxInfoResponseSchema.safeParse(await okxResponse.json());
    if (!okxData.success) {
        return {
            states: false,
            msg: okxData.error.message
        }
    }

    // 获取全部100条数据
    const allCandles = okxData.data.data;
    
    // 提取全部收盘价用于计算最大值和最小值
    const allCloses = allCandles.map(candle => parseFloat(candle[4]));
    
    // 获取最新的6条数据（从新到旧）用于其他计算
    const candles = allCandles.slice(0, 6);
    
    // 提取收盘价和交易量
    const closes = candles.map(candle => parseFloat(candle[4])); // 收盘价
    const volumes = candles.map(candle => parseFloat(candle[5])); // 交易量
    const highs = candles.map(candle => parseFloat(candle[2])); // 最高价
    const lows = candles.map(candle => parseFloat(candle[3])); // 最低价
    
    // 当前价格（最新数据）
    const currentPrice = closes[0];
    
    // 计算5期MA（旧数据）
    const ma5 = closes.slice(1).reduce((sum, price) => sum + price, 0) / 5;
    
    // 计算偏移百分比
    const deviationPercent = ((currentPrice - ma5) / ma5) * 100;
    
    // 计算最大值和最小值（使用全部100条数据）
    const maxPrice = Math.max(...allCloses);
    const minPrice = Math.min(...allCloses);
    
    // 计算振动幅度（最高-最低）
    const ranges = highs.map((high, i) => high - lows[i]);
    
    // 计算5日平均交易量
    const avgVolume5Days = volumes.slice(1).reduce((sum, vol) => sum + vol, 0) / 5;
    
    // 前一日交易量相对于5日平均的偏移百分比
    const volumeDeviationPercent = ((volumes[1] - avgVolume5Days) / avgVolume5Days) * 100;

    // 获取最新数据的时间戳并转换为UTC8时间
    const latestTimestamp = candles[0][0];
    const utc8Time = convertUnixToUTC8(parseInt(latestTimestamp));
    
    return {
        states: true,
        msg: "成功获取信息",
        data: {
            coinType:instId,             // 币种类型
            timestamp: latestTimestamp,  // 最新数据的时间戳(毫秒)
            utc8Time,                   // UTC+8时间格式(YYYY-MM-DD HH:MM:SS)
            currentPrice,               // 当前价格(最新收盘价)
            maxPrice,                   // 6期数据中的最高价
            minPrice,                   // 6期数据中的最低价
            ma5,                        // 5期移动平均(旧数据)
            deviationPercent,           // 当前价格相对于MA5的偏移百分比
            volumeDeviationPercent       // 前一日交易量相对于5日平均的偏移百分比
        }
    };
}

function convertUnixToUTC8(unixTimestamp: number): string {
    const date = new Date(unixTimestamp);
    const utc8Time = new Date(date.getTime() + 8 * 60 * 60 * 1000); // 直接加上8小时的毫秒数

    return utc8Time.toISOString().replace('T', ' ').slice(0, 19); // 格式化时间为YYYY-MM-DD HH:MM:SS
}