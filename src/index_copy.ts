import { Hono } from "hono";

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

    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        // 获取当前价格
        const btcInfo = await getCryptoInfo('BTC-USDT');
        const ethInfo = await getCryptoInfo('ETH-USDT');

        // 从KV中获取上一次存储的价格
        const lastBtcPrice = await env.web3info.get('lastBtcPrice');
        const lastEthPrice = await env.web3info.get('lastEthPrice');

        // 计算价格差值和百分比（不取绝对值）
        const btcPriceDiff = lastBtcPrice ? parseFloat(btcInfo.okxPrice) - parseFloat(lastBtcPrice) : 0;
        const btcPriceDiffPercent = lastBtcPrice ? (btcPriceDiff / parseFloat(lastBtcPrice)) * 100 : 0;

        const ethPriceDiff = lastEthPrice ? parseFloat(ethInfo.okxPrice) - parseFloat(lastEthPrice) : 0;
        const ethPriceDiffPercent = lastEthPrice ? (ethPriceDiff / parseFloat(lastEthPrice)) * 100 : 0;

        // 将当前价格存储到KV中
         env.web3info.put('lastBtcPrice', btcInfo.okxPrice);
         env.web3info.put('lastEthPrice', ethInfo.okxPrice);

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

        // 发送消息，包含价格差值和百分比以及当前时间
        const message = `
    **当前时间**: ${formattedTime}  
    **BTC 价格**: **${btcInfo.okxPrice}**  
      差值: ${btcPriceDiff.toFixed(2)}  
      百分比: ${btcPriceDiffPercent.toFixed(2)}%  
    **ETH 价格**: **${ethInfo.okxPrice}**  
      差值: ${ethPriceDiff.toFixed(2)}  
      百分比: ${ethPriceDiffPercent.toFixed(2)}%  
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
    },
    fetch: app.fetch



} satisfies ExportedHandler<Env>;

async function getCryptoInfo(instId: string): Promise<{ okxPrice: string; okxTime: string }> {
    const okxResponse = await fetch(`https://okx.worker.sereniblue.com/api/v5/market/index-candles?instId=${instId}`);
    if (!okxResponse.ok) {
        throw new Error(`Failed to fetch data from OKX API: ${okxResponse.statusText}`);
    }

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