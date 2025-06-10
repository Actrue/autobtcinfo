import { ai } from "./ai";
import { okx } from "./okx";


function getEmoji(percentChange: number): string {
    if (percentChange > 10) return '🚀'; // 飙升
    else if (percentChange > 5) return '📈'; // 大涨
    else if (percentChange > 2) return '🆙️'; // 小涨
    else if (percentChange > 1) return '🌱'; // 微涨
    else if (percentChange > 0) return '🔝'; // 微微涨
    else if (percentChange === 0) return '😐'; // 平稳
    else if (percentChange > -1) return '🔽️'; // 微微跌
    else if (percentChange > -2) return '🌾'; // 微跌
    else if (percentChange > -5) return '📉'; // 小跌
    else if (percentChange > -10) return '💥'; // 大跌
    else return '🕳️'; // 暴跌
}



export async function generateMessage(coinType:string) {
    const cryptoDataInfo=await okx.getCryptoInfo(coinType)
    if(!cryptoDataInfo.states){
        console.log(cryptoDataInfo)
        throw new Error('获取数据失败')
        
    }
    const cryptoData=cryptoDataInfo.data!
    const aiAnalysis = await ai(coinType);

    const emoji = getEmoji(cryptoData.deviationPercent);
    return `${emoji} ${coinType}行情更新 ${cryptoData.utc8Time}\n\n` +
           `当前价格: ${cryptoData.currentPrice.toFixed(2)}\n` +
           `5日均价: ${cryptoData.ma5.toFixed(2)} (偏离: ${cryptoData.deviationPercent.toFixed(2)}%)\n` +
           `100日最高价: ${cryptoData.maxPrice.toFixed(2)}\n` +
           `100日最低价: ${cryptoData.minPrice.toFixed(2)}\n` +
           `前一日交易量相较于前五日平均交易量变化的百分比: ${cryptoData.volumeDeviationPercent.toFixed(2)}%\n\n` +
           `${aiAnalysis}`;
}

export async function sendNtfyMessage(message: string): Promise<void> {
    await fetch('https://message.sereniblue.com/btc', {
        headers: {
            'Content-Type': 'text/plain',
            'p': '3',
            "Markdown": "yes"
        },
        method: 'POST',
        body: message,
    });
}