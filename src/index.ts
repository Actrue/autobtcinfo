import { Hono } from "hono";

import { okx } from "./okx";
import { scheduled } from "./scheduled";
// 定义每一行数据的 schema

//接口定义部分
const app = new Hono<{ Bindings: Env }>()

app.get('/coin/:name', async (c) => {
    const name = c.req.param('name')
    console.log(name)
    let info = await okx.getCryptoInfo(name)


    return c.json(info)

})



export interface Env {
    web3info: KVNamespace;
}

export default {

    scheduled: scheduled,
    fetch: app.fetch



} satisfies ExportedHandler<Env>;










