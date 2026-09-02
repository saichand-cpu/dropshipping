const { createClient } = require('@supabase/supabase-js');

function clients() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service) throw new Error('Supabase production environment variables are missing.');
  return { auth:createClient(url,anon,{auth:{persistSession:false}}), db:createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}) };
}
async function admin(req,res) {
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token) return [401,{error:'Missing authorization token'}];
  const {auth,db}=clients(); const {data:{user},error}=await auth.auth.getUser(token);
  if(error||!user) return [401,{error:'Invalid or expired session'}];
  const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(profile?.role!=='admin') return [403,{error:'Admin access required'}]; return [0,{db}];
}
module.exports=async(req,res)=>{
  try {
    const [code,value]=await admin(req,res); if(code) return res.status(code).json(value); const db=value.db;
    if(req.method==='GET') { const {data,error}=await db.from('products').select('id,slug,name,description,price,compare_at_price,category,image,rating,review_count,badge,in_stock,featured,stock_quantity,supplier_name,supplier_product_id,created_at,updated_at').order('created_at',{ascending:false}); if(error) throw error; return res.status(200).json({products:data||[]}); }
    if(req.method==='POST') {
      const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{}; const name=String(b.name||'').trim(); const slug=String(b.slug||'').trim().toLowerCase();
      if(!name||!slug) return res.status(400).json({error:'Name and slug are required'});
      const price=Number(b.price); const stock=Number(b.stockQuantity||0); if(!Number.isInteger(price)||price<0||!Number.isInteger(stock)||stock<0) return res.status(400).json({error:'Price and stock must be non-negative integers'});
      const row={slug,name,description:String(b.description||''),price,compare_at_price:b.compareAtPrice===''?null:Number(b.compareAtPrice)||null,category:String(b.category||'General'),image:String(b.image||''),badge:b.badge?String(b.badge):null,featured:Boolean(b.featured),stock_quantity:stock,in_stock:stock>0,supplier_name:b.supplierName?String(b.supplierName):null,supplier_product_id:b.supplierProductId?String(b.supplierProductId):null};
      const {data,error}=await db.from('products').insert(row).select('*').single(); if(error) return res.status(400).json({error:error.message}); return res.status(201).json({product:data});
    }
    if(req.method==='PATCH') {
      const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{}; const id=String(b.id||''); if(!id) return res.status(400).json({error:'Product id is required'});
      const update={}; const text=['name','description','category','image','badge','supplierName','supplierProductId'];
      const map={supplierName:'supplier_name',supplierProductId:'supplier_product_id'}; text.forEach(k=>{if(b[k]!==undefined) update[map[k]||k]=b[k]===null?'':String(b[k]).trim()||null;});
      if(b.price!==undefined){const n=Number(b.price);if(!Number.isInteger(n)||n<0)return res.status(400).json({error:'Invalid price'});update.price=n;}
      if(b.compareAtPrice!==undefined){const n=b.compareAtPrice===''?null:Number(b.compareAtPrice);if(n!==null&&(!Number.isInteger(n)||n<0))return res.status(400).json({error:'Invalid compare-at price'});update.compare_at_price=n;}
      if(b.stockQuantity!==undefined){const n=Number(b.stockQuantity);if(!Number.isInteger(n)||n<0)return res.status(400).json({error:'Invalid stock quantity'});update.stock_quantity=n;update.in_stock=n>0;}
      if(b.featured!==undefined) update.featured=Boolean(b.featured);
      const {data,error}=await db.from('products').update(update).eq('id',id).select('*').single(); if(error) return res.status(400).json({error:error.message}); return res.status(200).json({product:data});
    }
    return res.status(405).json({error:'Method not allowed'});
  } catch(e){ console.error(e); return res.status(500).json({error:'Internal server error'}); }
};
