import { Hono } from "hono";
import { appEnv } from "./appEnv";
// 定义每一行数据的 schema


const app = new Hono<{ Bindings: Env }>()

app.get('/coin/:name', async (c) => {
    const name = c.req.param('name')
    console.log(name)
    let info = await getCryptoInfo(name)


    return c.json(info)

})
app.get('/', async (c) => {
    return c.json({ message: 'hello' })
})


export interface Env {
    web3info: KVNamespace;
}

export default {

    scheduled: scheduled,
    fetch: app.fetch



} satisfies ExportedHandler<Env>;


async function getCryptoInfo(instId: string): Promise<{ okxPrice: string; okxTime: string }> {
    const okxResponse = await fetch(`https://okx.worker.sereniblue.com/api/v5/market/index-candles?instId=${instId}`);
    if (!okxResponse.ok) {
        throw new Error(`Failed to fetch data from OKX API: ${okxResponse.statusText}`);
    }

    console.log(okxResponse)
    const okxData: OkxInfoResponse = await okxResponse.json();
 
    if (okxData.code !== '0') {
        throw new Error(`OKX API returned an error: ${okxData.msg}`);
    }

    const okxPrice = okxData.data[0][4]; // 获取价格
    const okxTime = convertUnixToUTC8(parseInt(okxData.data[0][0])); // 转换时间

    return {
        okxPrice,
        okxTime,
    };
}

interface OkxInfoResponse {
    code: string;
    msg: string;
    data: Array<Array<string>>;
}



function convertUnixToUTC8(unixTimestamp: number): string {
    const date = new Date(unixTimestamp);
    const utc8Time = new Date(date.getTime() + 8 * 60 * 60 * 1000); // 直接加上8小时的毫秒数

    return utc8Time.toISOString().replace('T', ' ').slice(0, 19); // 格式化时间为YYYY-MM-DD HH:MM:SS
}
async function scheduled2(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {

    interface TimePrice {
        time: string; // 假设时间是字符串格式，例如 "2023-10-01T12:00:00Z"
        price: string; // 假设价格是一个数字
    }
    
    // 如果你需要表示这个数组的类型，可以定义如下：
    type TimePriceArray = TimePrice[];

    const reslut = appEnv.coreCoin.map(async (coin) => {
        console.log(coin)
        const coinInfo = await getCryptoInfo(coin)
        const kvInfo=await env.web3info.get(coin)
        if(!kvInfo){
            await env.web3info.put(coin, JSON.stringify([{time:coinInfo.okxTime,price:coinInfo.okxPrice}]))
        }

        //@ts-ignore
        const lastCoinPrince:TimePrice[] = TimePriceSchema.parse(JSON.parse(kvInfo))
        // 计算四小时差值
        let PriceDiffArrary: number[] = []
        let PriceDiffPrecent: number[] = []
        for (let i = 2; i <= 12; i +=3) {
            if(!lastCoinPrince[i]){
                break
            }
            let PriceDiff = parseInt(coinInfo.okxPrice) - parseInt(lastCoinPrince[i].price)
            PriceDiffArrary.push(PriceDiff)
            PriceDiffPrecent.push(PriceDiff / parseInt(lastCoinPrince[i].price) * 100)
        }
        lastCoinPrince.unshift({ time: coinInfo.okxTime, price: coinInfo.okxPrice });
        if (lastCoinPrince.length > 12) {
            lastCoinPrince.pop();
        }

        await env.web3info.put(coin, JSON.stringify(lastCoinPrince))

        return {
            coin,
            coinInfo,
            lastCoinPrince,
            PriceDiffArrary,
            PriceDiffPrecent
        }




    })
    const ntfyMessage = generateNtfyMessage(await Promise.all(reslut));




    await fetch('https://message.sereniblue.com/btc', {
        headers: {
            'Content-Type': 'text/plain',
            'p': '3',
            "Markdown": "yes"
        },
        method: 'POST',
        body: ntfyMessage,
    });
}

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



type CoinData = {
    coin: string;
    coinInfo: {
        okxPrice: string;
        okxTime: string;
    };
    lastCoinPrince: { time: string; price: string }[];
    PriceDiffArrary: number[];
    PriceDiffPrecent: number[];
};

function generateNtfyMessage(data: CoinData[]): string {
    let message = '';

    for (const item of data) {
        const { coin, coinInfo, PriceDiffArrary, PriceDiffPrecent } = item;
        const formattedTime = item.coinInfo.okxTime

        // 取最新的价格差值和百分比
        const latestPriceDiff = PriceDiffArrary[0];
        const latestPriceDiffPercent = PriceDiffPrecent[0];
        const emoji = getEmoji(latestPriceDiffPercent);

        // 取过去三次变化百分比
        const pastThreeDiffPercents = PriceDiffPrecent.slice(1, 4).map((percent) => `${percent.toFixed(2)}% ${getEmoji(percent)}`);

        message += `
**当前时间**: ${formattedTime}  
**${coin.toUpperCase()} 价格**: **${coinInfo.okxPrice}**
  差值: ${latestPriceDiff.toFixed(2)}  
  百分比: ${latestPriceDiffPercent.toFixed(2)}% ${emoji}  
  过去三次变化百分比: [${pastThreeDiffPercents.join(', ')}]  
`;
    }

    return message;
}

async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // 获取当前价格
    const btcInfo = await getCryptoInfo('BTC-USDT');
    const ethInfo = await getCryptoInfo('ETH-USDT');

    // 从KV中获取上一次存储的价格
    const lastBtcPrice = await env.web3info.get('lastBtcPrice');
    const lastEthPrice = await env.web3info.get('lastEthPrice');

    // 获取过去三次的价格数据
    const lastThreeBtcPrices = JSON.parse(await env.web3info.get('lastThreeBtcPrices') || '[]');
    const lastThreeEthPrices = JSON.parse(await env.web3info.get('lastThreeEthPrices') || '[]');

    // 计算价格差值和百分比（不取绝对值）
    let btcPriceDiff = 0;
    let btcPriceDiffPercent = 0;
    if (lastBtcPrice) {
        btcPriceDiff = parseInt(btcInfo.okxPrice) - parseFloat(lastBtcPrice);
        btcPriceDiffPercent = (btcPriceDiff / parseFloat(lastBtcPrice)) * 100;
    }

    let ethPriceDiff = 0;
    let ethPriceDiffPercent = 0;
    if (lastEthPrice) {
        ethPriceDiff = parseInt(ethInfo.okxPrice) - parseFloat(lastEthPrice);
        ethPriceDiffPercent = (ethPriceDiff / parseFloat(lastEthPrice)) * 100;
    }

    // 更新历史价格数据
    if (lastThreeBtcPrices.length >= 3) {
        lastThreeBtcPrices.pop();
    }
    lastThreeBtcPrices.unshift(btcInfo.okxPrice.toString());
    await env.web3info.put('lastThreeBtcPrices', JSON.stringify(lastThreeBtcPrices));

    if (lastThreeEthPrices.length >= 3) {
        lastThreeEthPrices.pop();
    }
    lastThreeEthPrices.unshift(ethInfo.okxPrice.toString());
    await env.web3info.put('lastThreeEthPrices', JSON.stringify(lastThreeEthPrices));

    // 计算过去三次的变化百分比
    const btcHistoryDiffPercents = [];
    if (lastThreeBtcPrices.length >= 2) {
        for (let i = 1; i < lastThreeBtcPrices.length; i++) {
            const prevPrice = parseFloat(lastThreeBtcPrices[i - 1]);
            const currPrice = parseFloat(lastThreeBtcPrices[i]);
            const percent = ((currPrice - prevPrice) / prevPrice) * 100;
            btcHistoryDiffPercents.push(percent.toFixed(2));
        }
    }

    const ethHistoryDiffPercents = [];
    if (lastThreeEthPrices.length >= 2) {
        for (let i = 1; i < lastThreeEthPrices.length; i++) {
            const prevPrice = parseFloat(lastThreeEthPrices[i - 1]);
            const currPrice = parseFloat(lastThreeEthPrices[i]);
            const percent = ((currPrice - prevPrice) / prevPrice) * 100;
            ethHistoryDiffPercents.push(percent.toFixed(2));
        }
    }

    // 根据涨跌幅选择表情
    const btcEmoji = getEmoji(btcPriceDiffPercent);
    const ethEmoji = getEmoji(ethPriceDiffPercent);

    // 获取当前时间并格式化
    const now = new Date();
    const formattedTime = now.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // 发送消息，包含价格差值、百分比和当前时间
    const message = `
**当前时间**: ${formattedTime}  
**BTC 价格**: **${btcInfo.okxPrice}** ${btcEmoji}
  差值: ${btcPriceDiff.toFixed(2)}  
  百分比: ${btcPriceDiffPercent.toFixed(2)}%  
  过去三次变化百分比: [${btcHistoryDiffPercents.join(', ')}]  
**ETH 价格**: **${ethInfo.okxPrice}** ${ethEmoji}
  差值: ${ethPriceDiff.toFixed(2)}  
  百分比: ${ethPriceDiffPercent.toFixed(2)}%  
  过去三次变化百分比: [${ethHistoryDiffPercents.join(', ')}]  
`;

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