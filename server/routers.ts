import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  completePaymentOrder,
  createPaymentOrder,
  createRedemption,
  debitPoints,
  getCreditPackages,
  getJackpot,
  getProducts,
  getSpinHistory,
  getWallet,
  getUserRedemptions,
  incrementJackpot,
  recordSpin,
  resetJackpot,
  seedCreditPackages,
  seedProducts,
  debitCoins,
  creditCoins,
  creditPoints,
} from "./db";

const SYMBOLS = ["roxy","eris","sylphy","magic","sword","gem","scroll","coin","wild","scatter"] as const;
type Sym = typeof SYMBOLS[number];

const WEIGHTS: Record<Sym,number> = { wild:2, scatter:3, roxy:4, eris:5, sylphy:5, magic:8, sword:10, gem:12, scroll:15, coin:20 };
const PAYOUTS: Record<Sym,[number,number,number]> = {
  wild:[0,60,150], scatter:[0,20,80], roxy:[0,40,100], eris:[0,15,50],
  sylphy:[0,25,200], magic:[0,18,60], sword:[0,12,40], gem:[0,8,25], scroll:[0,5,15], coin:[0,4,10]
};

function weightedRandom(): Sym {
  const total = Object.values(WEIGHTS).reduce((a,b)=>a+b,0);
  let rand = Math.random()*total;
  for(const [s,w] of Object.entries(WEIGHTS)){ rand-=w; if(rand<=0) return s as Sym; }
  return "coin";
}

function spinReels(): Sym[][] {
  return Array.from({length:5},()=>Array.from({length:3},()=>weightedRandom()));
}

function evaluateWin(reels: Sym[][], bet: number) {
  let winCoins=0; const lines:number[]=[];
  for(let row=0;row<3;row++){
    const line=reels.map(r=>r[row]);
    const first=line[0]==="wild"?(line.find(s=>s!=="wild")??"wild"):line[0];
    let count=0;
    for(const s of line){ if(s===first||s==="wild") count++; else break; }
    if(count>=3){ const idx=count===3?1:2; const p=PAYOUTS[first][idx]; if(p>0){ winCoins+=Math.floor(bet*p/10); lines.push(row); } }
  }
  const center=reels.map(r=>r[1]);
  const isJackpot=center.every(s=>s==="sylphy");
  const expected=bet*0.62;
  if(winCoins>expected*3&&Math.random()>0.15) winCoins=Math.floor(winCoins*0.4);
  const pointsEarned=Math.floor(bet/10);
  return {winCoins,pointsEarned,isJackpot,lines};
}

const rateLimit=new Map<number,{count:number;start:number}>();
function checkRate(userId:number):boolean {
  const now=Date.now(); const W=60000; const MAX=30;
  const e=rateLimit.get(userId);
  if(!e||now-e.start>W){ rateLimit.set(userId,{count:1,start:now}); return true; }
  if(e.count>=MAX) return false;
  e.count++; return true;
}

const PP_BASE=process.env.PAYPAL_MODE==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";

async function ppToken():Promise<string> {
  const id=process.env.PAYPAL_CLIENT_ID, sec=process.env.PAYPAL_CLIENT_SECRET;
  if(!id||!sec) throw new TRPCError({code:"INTERNAL_SERVER_ERROR",message:"PayPal no configurado. Agrega PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET."});
  const r=await fetch(`${PP_BASE}/v1/oauth2/token`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${id}:${sec}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
  const d=await r.json() as {access_token:string};
  return d.access_token;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts=>opts.ctx.user),
    logout: publicProcedure.mutation(({ctx})=>{
      ctx.res.clearCookie(COOKIE_NAME,{...getSessionCookieOptions(ctx.req),maxAge:-1});
      return {success:true} as const;
    }),
  }),

  wallet: router({
    balance: protectedProcedure.query(async({ctx})=>{
      const w=await getWallet(ctx.user.id);
      const jp=await getJackpot();
      return {coins:w?.coins??0, points:w?.points??0, jackpot:jp.currentAmount};
    }),
  }),

  slots: router({
    spin: protectedProcedure
      .input(z.object({betCoins:z.number().int().min(100).max(10000)}))
      .mutation(async({ctx,input})=>{
        if(!checkRate(ctx.user.id)) throw new TRPCError({code:"TOO_MANY_REQUESTS",message:"Demasiados giros. Espera un momento."});
        const {success,newBalance}=await debitCoins(ctx.user.id,input.betCoins);
        if(!success) throw new TRPCError({code:"BAD_REQUEST",message:"Monedas insuficientes"});
        const reels=spinReels();
        const {winCoins,pointsEarned,isJackpot,lines}=evaluateWin(reels,input.betCoins);
        if(winCoins>0) await creditCoins(ctx.user.id,winCoins,"spin_win",undefined,`Victoria: ${winCoins} monedas`);
        if(pointsEarned>0) await creditPoints(ctx.user.id,pointsEarned);
        await incrementJackpot(Math.floor(input.betCoins*0.02));
        let jackpotWon=0;
        if(isJackpot){ const jp=await getJackpot(); jackpotWon=jp.currentAmount; await creditCoins(ctx.user.id,jackpotWon,"spin_win",undefined,"¡JACKPOT!"); await resetJackpot(ctx.user.id); }
        await recordSpin({userId:ctx.user.id,betCoins:input.betCoins,winCoins:winCoins+jackpotWon,pointsEarned,reels:JSON.stringify(reels),isJackpot,isFreeSpins:false});
        const uw=await getWallet(ctx.user.id);
        const jp=await getJackpot();
        return {reels,winCoins:winCoins+jackpotWon,pointsEarned,isJackpot,jackpotWon,lines,newBalance:uw?.coins??newBalance,newPoints:uw?.points??0,jackpotAmount:jp.currentAmount};
      }),
    history: protectedProcedure.input(z.object({limit:z.number().int().min(1).max(50).default(20)})).query(async({ctx,input})=>getSpinHistory(ctx.user.id,input.limit)),
    jackpot: publicProcedure.query(async()=>getJackpot()),
  }),

  shop: router({
    packages: publicProcedure.query(async()=>{ await seedCreditPackages(); return getCreditPackages(); }),
    createPaypalOrder: protectedProcedure
      .input(z.object({packageId:z.number().int().positive()}))
      .mutation(async({ctx,input})=>{
        const pkgs=await getCreditPackages();
        const pkg=pkgs.find(p=>p.id===input.packageId);
        if(!pkg) throw new TRPCError({code:"NOT_FOUND",message:"Paquete no encontrado"});
        const token=await ppToken();
        const total=pkg.coins+pkg.bonusCoins;
        const res=await fetch(`${PP_BASE}/v2/checkout/orders`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({intent:"CAPTURE",purchase_units:[{amount:{currency_code:"USD",value:pkg.priceUsd},description:`Créditos digitales — ${pkg.name} (${total} monedas)`}],application_context:{brand_name:"Mushoku Tensei Slots",user_action:"PAY_NOW"}})});
        const order=await res.json() as {id:string};
        if(!order.id) throw new TRPCError({code:"INTERNAL_SERVER_ERROR",message:"Error al crear orden PayPal"});
        await createPaymentOrder(ctx.user.id,input.packageId,pkg.priceUsd,total,order.id);
        return {orderId:order.id};
      }),
    capturePaypalOrder: protectedProcedure
      .input(z.object({orderId:z.string().min(1)}))
      .mutation(async({ctx,input})=>{
        const token=await ppToken();
        const res=await fetch(`${PP_BASE}/v2/checkout/orders/${input.orderId}/capture`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}});
        const cap=await res.json() as {status:string};
        if(cap.status!=="COMPLETED") throw new TRPCError({code:"BAD_REQUEST",message:"Pago no completado"});
        const result=await completePaymentOrder(input.orderId);
        if(!result) throw new TRPCError({code:"CONFLICT",message:"Orden ya procesada"});
        const w=await getWallet(ctx.user.id);
        return {success:true,coinsAdded:result.coinsToCredit,newBalance:w?.coins??0};
      }),
  }),

  products: router({
    list: publicProcedure.query(async()=>{ await seedProducts(); return getProducts(); }),
    redeem: protectedProcedure
      .input(z.object({productId:z.number().int().positive(),shippingName:z.string().min(2).max(128),shippingAddress:z.string().min(5).max(256),shippingCity:z.string().min(2).max(128),shippingCountry:z.string().min(2).max(64)}))
      .mutation(async({ctx,input})=>{
        const prods=await getProducts();
        const prod=prods.find(p=>p.id===input.productId);
        if(!prod) throw new TRPCError({code:"NOT_FOUND",message:"Producto no encontrado"});
        if(prod.stock<=0) throw new TRPCError({code:"BAD_REQUEST",message:"Sin stock"});
        const ok=await debitPoints(ctx.user.id,prod.pointsCost);
        if(!ok) throw new TRPCError({code:"BAD_REQUEST",message:"Puntos insuficientes"});
        await createRedemption({userId:ctx.user.id,productId:input.productId,pointsSpent:prod.pointsCost,shippingName:input.shippingName,shippingAddress:input.shippingAddress,shippingCity:input.shippingCity,shippingCountry:input.shippingCountry});
        const w=await getWallet(ctx.user.id);
        return {success:true,newPoints:w?.points??0};
      }),
    myRedemptions: protectedProcedure.query(async({ctx})=>getUserRedemptions(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
