import { okx } from "../okx";


async function test() {
    const btcInfo = await okx.getCryptoInfo('BTC-USDT');
  

   console.log(btcInfo)
    
}
test()