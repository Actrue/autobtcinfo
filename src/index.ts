import { Hono } from "hono";
import { generateMessage } from "./ntfy";
import { okx } from "./okx";
import { scheduled } from "./scheduled";
// 定义每一行数据的 schema

//接口定义部分
const app = new Hono<{ Bindings: Env }>()

app.get('/coin/:name', async (c) => {
    const name = c.req.param('name')
    const key=c.req.param('key')
    if(key!==c.env.test_api_key){
        return c.json({
            code:401,
            msg:'Unauthorized'
        })
    }
    
    let info = await generateMessage(name,c.env)

    return c.text(info)

})



export default {

    scheduled: scheduled,
    fetch: app.fetch



} satisfies ExportedHandler<Env>;










