import { z } from 'zod';

const OkxInfoResponseSchema = z.object({
  code: z.string(),
  msg: z.string(),
  data: z.array(z.array(z.string()))
});

const CoinDataSchema = z.object({
  coin: z.string(),
  coinInfo: z.object({
    okxPrice: z.string(),
    okxTime: z.string()
  }),
  lastCoinPrince: z.array(z.object({
    time: z.string(),
    price: z.string()
  })),
  PriceDiffArrary: z.array(z.number()),
  PriceDiffPrecent: z.array(z.number())
});

export type OkxInfoResponse = z.infer<typeof OkxInfoResponseSchema>;
export type CoinData = z.infer<typeof CoinDataSchema>;

export const schema={
  OkxInfoResponseSchema,
  CoinDataSchema
}