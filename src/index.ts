import { Hono } from "hono";
import { generateMessage } from "./ntfy";
import { env } from "cloudflare:workers";
import { scheduled } from "./scheduled";
// 定义每一行数据的 schema

//接口定义部分
const app = new Hono<{ Bindings: Env }>()
/*
app.get('/coin/:name', async (c) => {
    const name = c.req.param('name')
    const key=c.req.query('key')
    if(key!==c.env.test_api_key){
        return c.json({
            code:401,
            msg:'Unauthorized'
        })
    }
    
    let info = await generateMessage(name)

    return c.text(info)

})

app.get('/',async (c)=>{
    const KV_Key=await env.KV.list()
    const messages=await Promise.all(KV_Key.keys.map(async (key)=>{
        const value=await env.KV.get(key.name)
        return {name: key.name, content: value}
    }))
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>加密货币日报</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            .message-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 20px; }
            .message { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .coin-name { font-size: 1.2em; font-weight: bold; color: #333; }
            .time { color: #666; font-size: 0.9em; }
            .price-info { margin: 10px 0; }
            .price-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .positive { color: #4CAF50; }
            .negative { color: #F44336; }
            .neutral { color: #2196F3; }
            .ai-analysis { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd; }
        </style>
    </head>
    <body>
        <h1>加密货币行情日报存档</h1>
        <div class="message-container">
            ${messages.map(m => {
                const contentLines = m.content!.split('\n');
                const header = contentLines[0];
                const priceInfo = contentLines.slice(1, 7).join('\n');
                const aiAnalysis = contentLines.slice(7).join('\n');
                
                return `
                <div class="message">
                    <div class="message-header">
                        <span class="coin-name">${m.name.replace('加密货币','').replace('信息日报','')}</span>
                        <span class="time">${header.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)?.[0] || ''}</span>
                    </div>
                    <div class="price-info">
                        ${priceInfo.split('\n').map(line => {
                            const match = line.match(/(.*): (.*)/);
                            if (!match) return '';
                            const isPositive = match[2].includes('+');
                            const isNegative = match[2].includes('-');
                            const valueClass = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
                            return `
                            <div class="price-line">
                                <span class="label">${match[1]}</span>
                                <span class="value ${valueClass}">${match[2]}</span>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="ai-analysis">
                        ${aiAnalysis.replace(/\n/g, '<br>')}
                    </div>
                </div>`;
            }).join('')}
        </div>
    </body>
    </html>
    `
    
    return c.html(html)
})
*/



export default {

    scheduled: scheduled,
    fetch: app.fetch



} satisfies ExportedHandler<Env>;










