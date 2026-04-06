import requests
from requests.auth import HTTPBasicAuth
import time
import json
import re
import os
import hashlib

WC_URL = "https://e-mart.com.bd"
WC_KEY = "ck_9d9fabaffcc52af85797a6887feb5a8da730b51f"
WC_SECRET = "cs_2551608b6d9f84841f8193eaffff2bfb120e659b"
OR_KEY = "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"
TG_TOKEN = "8705011508:AAGjcEGOjQ7inSa-chq9sJswEOo8XcJ9KXE"
TG_CHAT = "6906852635"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)
BATCH_SIZE = 20
SCORE_THRESHOLD = 50
PROGRESS_FILE = "/tmp/bulk_fixer_progress.json"

AI_RESIDUE = [
    "certainly","absolutely","furthermore","moreover","leverage",
    "comprehensive","game-changer","in conclusion","in summary",
    "it's worth noting","delve into","tapestry","vibrant","bustling",
    "revolutionize","groundbreaking","cutting-edge","state-of-the-art",
    "seamlessly","robust","paradigm","synergy","stakeholder",
    "i'd be happy to","as an ai","please note that"
]

def tg(msg):
    try:
        requests.post(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id":TG_CHAT,"text":msg[:4000]},timeout=10)
    except: pass

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"done_ids":[],"failed_ids":[]}

def save_progress(p):
    with open(PROGRESS_FILE,"w") as f:
        json.dump(p,f)

def remove_ai_residue(text):
    for phrase in AI_RESIDUE:
        text = re.sub(re.escape(phrase),"",text,flags=re.IGNORECASE)
    return re.sub(r'  +',' ',text).strip()

def get_content_hash(name,brand,cats):
    key = f"{name}_{brand}_{cats}"
    return hashlib.md5(key.encode()).hexdigest()[:8]

def score_description(desc):
    if not desc or len(desc.strip())<50: return 0
    score = 0
    text = re.sub('<[^<]+?>','',desc).lower()
    wc = len(text.split())
    if wc>=300: score+=25
    elif wc>=150: score+=15
    elif wc>=80: score+=8
    bd_kw=['bangladesh','dhaka','emart','e-mart','authentic','অথেনটিক','বাংলাদেশ','ঢাকা','cod','delivery']
    score+=min(20,sum(3 for k in bd_kw if k in text))
    bangla=len(re.findall(r'[\u0980-\u09FF]',desc))
    if bangla>200: score+=15
    elif bangla>100: score+=10
    elif bangla>30: score+=5
    if '<h3' in desc or '<h2' in desc: score+=8
    if '<p>' in desc or '<p ' in desc: score+=7
    if 'faq' in text or 'প্রশ্ন' in text: score+=5
    info_kw=['ingredient','how to use','ব্যবহার','উপাদান','skin type']
    score+=min(20,sum(3 for k in info_kw if k in text))
    return min(100,score)

def get_brand(product):
    for attr in product.get("attributes",[]):
        if attr["name"].lower()=="brand" and attr.get("options"):
            return attr["options"][0]
    name=product.get("name","").lower()
    brands={
        "cosrx":"COSRX","laneige":"Laneige","innisfree":"Innisfree",
        "some by mi":"Some By Mi","tonymoly":"TonyMoly","etude":"Etude House",
        "missha":"Missha","the face shop":"The Face Shop","skinfood":"Skinfood",
        "cerave":"CeraVe","neutrogena":"Neutrogena","bioderma":"Bioderma",
        "rohto":"Rohto Mentholatum","biore":"Biore","shiseido":"Shiseido",
        "hada labo":"Hada Labo","kao":"Kao","lion":"Lion",
        "paula's choice":"Paula's Choice","beauty of joseon":"Beauty of Joseon",
        "round lab":"Round Lab","anua":"Anua","iunik":"iUNIK",
        "klairs":"Klairs","torriden":"Torriden","skin1004":"Skin1004",
        "isntree":"Isntree","numbuzin":"Numbuzin","ma:nyo":"Ma:nyo",
        "dr.jart":"Dr.Jart+","mediheal":"Mediheal","snp":"SNP",
        "acwell":"Acwell","axis-y":"Axis-Y","heimish":"Heimish",
    }
    for key,val in brands.items():
        if key in name: return val
    return "Unknown Brand"

def get_origin(brand):
    jp=["rohto","mentholatum","kao","biore","shiseido","hada labo","lion","fancl","curel"]
    us=["cerave","neutrogena","paula's choice","the ordinary","olay"]
    fr=["bioderma","la roche","vichy","avene","caudalie"]
    b=brand.lower()
    if any(x in b for x in jp): return "Japan"
    if any(x in b for x in us): return "USA"
    if any(x in b for x in fr): return "France"
    return "Korea"

def extract_specs(product):
    name=product.get("name","")
    desc=re.sub('<[^<]+?>','',product.get("description",""))
    specs={}
    vol=re.search(r'(\d+(?:\.\d+)?)\s*(ml|mL|g|oz)',name+" "+desc)
    if vol: specs["volume"]=f"{vol.group(1)}{vol.group(2)}"
    spf=re.search(r'SPF\s*(\d+\+?)',name+" "+desc,re.IGNORECASE)
    if spf: specs["spf"]=f"SPF {spf.group(1)}"
    pa=re.search(r'PA(\++)',name+" "+desc)
    if pa: specs["pa"]=f"PA{pa.group(1)}"
    return specs

def call_ai(model,prompt,max_tokens=1800,temp=0.85):
    try:
        r=requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization":f"Bearer {OR_KEY}","Content-Type":"application/json"},
            json={"model":model,"messages":[{"role":"user","content":prompt}],
                  "max_tokens":max_tokens,"temperature":temp,"frequency_penalty":0.5},
            timeout=60)
        c=r.json()["choices"][0]["message"]["content"].strip()
        c=re.sub(r'^```(?:html|json)?\s*','',c)
        c=re.sub(r'\s*```$','',c)
        return c
    except Exception as e:
        print(f"    AI error: {e}")
        return None

def gen_description(product,unique_seed):
    name=product.get("name","")
    price=product.get("price","0")
    brand=get_brand(product)
    origin=get_origin(brand)
    cats=", ".join([c["name"] for c in product.get("categories",[])])
    specs=extract_specs(product)
    specs_str=" | ".join([f"{k}:{v}" for k,v in specs.items()]) if specs else "N/A"
    existing=re.sub('<[^<]+?>','',product.get("description",""))[:200]
    angles={
        "0":"texture and feel on Bangladeshi humid skin",
        "1":"before/after transformation story",
        "2":"why this beats local alternatives",
        "3":"science behind key ingredients",
        "4":"seasonal use Dhaka summer vs winter",
        "5":"value for money",
        "6":"brand reputation and trust",
        "7":"beginner-friendly for new skincare users",
        "8":"how to combine in skincare routine",
        "9":"specific skin problems it solves",
        "a":"authenticity and spotting fakes",
        "b":"dermatologist recommendations",
        "c":"customer reviews and real results",
        "d":"packaging and shelf life",
        "e":"ingredient safety what is NOT in it",
        "f":"morning evening routine integration",
    }
    angle=angles.get(unique_seed[-1],angles["0"])
    prompt=f"""You are Riya, a real Bangladeshi skincare enthusiast writing for E-Mart BD.
Unique angle: {angle}

Product: "{name}"
Brand: {brand} ({origin}) | Price: ৳{price}
Specs: {specs_str} | Categories: {cats}
Existing info: {existing}

Write Google 2026 E-E-A-T compliant WooCommerce description.

STRUCTURE:
1. Opening para — personal experience, Bangladesh context
2. <h3>কেন এই Product বেছে নেবেন?</h3> — 3 benefits as paragraphs
3. <h3>Key Ingredients ও তাদের কাজ</h3> — 3 ingredients with Bangla explanation
4. <h3>কীভাবে ব্যবহার করবেন</h3> — steps in paragraph form
5. <h3>আমাদের Expert Opinion</h3> — E-Mart team experience
6. <h3>সাধারণ জিজ্ঞাসা (FAQ)</h3> — 3 real Q&A
7. Closing — COD/delivery + authenticity

RULES:
- 60% Bangla + 40% English naturally mixed
- 500-550 words | HTML only: h3+p tags | NO bullet points
- "E-Mart team personally verify করেছে"
- "100% অথেনটিক | {origin} থেকে directly import"
- "ঢাকায় ১-২ দিন | সারাদেশে ৩-৫ দিন | COD available"
- AVOID: certainly, absolutely, furthermore, revolutionize, seamlessly
- Warm, specific, human tone

Return ONLY clean HTML."""
    result=call_ai("deepseek/deepseek-chat",prompt,max_tokens=2000,temp=0.93)
    if result: result=remove_ai_residue(result)
    return result

def gen_faq_schema(product):
    name=product.get("name","")
    brand=get_brand(product)
    price=product.get("price","0")
    cat=product.get("categories",[{}])[0].get("name","skincare") if product.get("categories") else "skincare"
    prompt=f"""3 FAQ for "{name}" by {brand} (৳{price}) sold in Bangladesh.
Real questions Bangladeshi customers ask before buying.
Return ONLY JSON array:
[{{"q":"Bangla question?","a":"Bangla answer 2-3 sentences."}},{{"q":"Bangla question?","a":"Bangla answer."}},{{"q":"Bangla question?","a":"Bangla answer."}}]"""
    result=call_ai("deepseek/deepseek-chat",prompt,max_tokens=600,temp=0.6)
    if not result: return "",""
    try:
        result=re.sub(r'^[^\[]*','',result)
        result=re.sub(r'[^\]]*$','',result)
        faqs=json.loads(result)
        schema={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
            {"@type":"Question","name":f["q"],"acceptedAnswer":{"@type":"Answer","text":f["a"]}}
            for f in faqs]}
        faq_html='<div class="emart-faq"><h3>সাধারণ জিজ্ঞাসা (FAQ)</h3>'
        for f in faqs:
            faq_html+=f'<p><strong>❓ {f["q"]}</strong><br>✅ {f["a"]}</p>'
        faq_html+='</div>'
        faq_schema=f'<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script>'
        return faq_html,faq_schema
    except: return "",""

def gen_rank_math_meta(product):
    name=product.get("name","")
    brand=get_brand(product)
    price=product.get("price","0")
    specs=extract_specs(product)
    vol=specs.get("volume","")
    cat=product.get("categories",[{}])[0].get("name","Skincare") if product.get("categories") else "Skincare"
    prompt=f"""SEO meta for Bangladesh skincare product (Google 2026).
Product: {name} | Brand: {brand} | Price: ৳{price} | Volume: {vol} | Category: {cat}
Return ONLY JSON:
{{"title":"under 60 chars with brand+product+Bangladesh","description":"150-160 chars with price+brand+buy CTA","focus_keyword":"long-tail buying intent keyword"}}"""
    result=call_ai("google/gemini-flash-1.5",prompt,max_tokens=300,temp=0.2)
    if not result: return None
    try:
        result=re.sub(r'^[^{]*','',result)
        result=re.sub(r'[^}]*$','',result)
        return json.loads(result)
    except: return None

def get_short_desc(product):
    brand=get_brand(product)
    price=product.get("price","0")
    origin=get_origin(brand)
    specs=extract_specs(product)
    cats=[c["name"].lower() for c in product.get("categories",[])]
    concern="General Skincare"
    if any("acne" in c for c in cats): concern="Acne, Pimples, Oily Skin"
    elif any("sun" in c for c in cats): concern="Sun Protection, UV Defense"
    elif any("serum" in c or "essence" in c for c in cats): concern="Hydration, Brightening"
    elif any("cleanser" in c or "wash" in c for c in cats): concern="Deep Cleansing"
    elif any("toner" in c for c in cats): concern="Hydration, Pore Care"
    elif any("moistur" in c or "cream" in c for c in cats): concern="Moisturizing, Barrier Repair"
    flag="🇯🇵" if origin=="Japan" else("🇺🇸" if origin=="USA" else("🇫🇷" if origin=="France" else "🇰🇷"))
    vol_line=f'<li>📦 <strong>Size:</strong> {specs["volume"]}</li>' if specs.get("volume") else ""
    spf_line=f'<li>☀️ <strong>SPF:</strong> {specs["spf"]}</li>' if specs.get("spf") else ""
    return f"""<ul>
<li>✨ <strong>Brand:</strong> {brand}</li>
<li>🎯 <strong>Concern:</strong> {concern}</li>
<li>💰 <strong>Price:</strong> ৳{price}</li>
{vol_line}{spf_line}<li>{flag} <strong>Origin:</strong> 100% Authentic {origin} Product</li>
<li>🚚 <strong>Delivery:</strong> Dhaka 1-2 days | Bangladesh 3-5 days</li>
<li>💳 <strong>Payment:</strong> COD | bKash | Card</li>
</ul>"""

def get_ingredients_tab(product):
    for m in product.get("meta_data",[]):
        if m["key"]=="_woodmart_product_custom_tab_content" and m.get("value") and len(str(m["value"]))>150:
            return m["value"]
    brand=get_brand(product)
    return f"""<div class="ingredients-tab">
<h3>Key Ingredients</h3>
<p>{brand} এর এই product-এ carefully selected active ingredients আছে। Full INCI list original packaging-এ printed।</p>
<h3>ব্যবহারের নিয়ম</h3>
<p>পরিষ্কার skin-এ পরিমাণমতো নিয়ে আলতো massage করুন। চোখ এড়িয়ে চলুন।</p>
<h3>Suitable For</h3>
<p>Sensitive skin-এ প্রথমে patch test করুন।</p>
<h3>সংরক্ষণ</h3>
<p>ঠান্ডা, শুকনো জায়গায় রাখুন। সূর্যালোক থেকে দূরে রাখুন।</p>
</div>"""

def get_attributes(product):
    brand=get_brand(product)
    origin=get_origin(brand)
    specs=extract_specs(product)
    cats=[c["name"].lower() for c in product.get("categories",[])]
    skin_type=["All Skin Types"]
    concern=["General Skincare"]
    if any("acne" in c for c in cats):
        skin_type=["Oily","Acne-Prone","Combination"]
        concern=["Acne","Pimples","Oiliness"]
    elif any("sun" in c for c in cats): concern=["Sun Protection","UV Defense"]
    elif any("serum" in c or "essence" in c for c in cats): concern=["Hydration","Anti-aging","Brightening"]
    elif any("cleanser" in c or "wash" in c for c in cats): concern=["Deep Cleansing","Pore Care"]
    elif any("toner" in c for c in cats): concern=["Hydration","Toning"]
    elif any("moistur" in c or "cream" in c for c in cats): concern=["Moisturizing","Barrier Repair"]
    attrs=[
        {"name":"Brand","position":0,"visible":True,"variation":False,"options":[brand]},
        {"name":"Skin Type","position":1,"visible":True,"variation":False,"options":skin_type},
        {"name":"Concern","position":2,"visible":True,"variation":False,"options":concern},
        {"name":"Origin","position":3,"visible":True,"variation":False,"options":[origin]},
    ]
    if specs.get("volume"):
        attrs.append({"name":"Volume","position":4,"visible":True,"variation":False,"options":[specs["volume"]]})
    if specs.get("spf"):
        attrs.append({"name":"SPF","position":5,"visible":True,"variation":False,"options":[specs["spf"]]})
    return attrs

def get_top20_ids():
    print("📊 Fetching top 20% by sales...")
    all_products=[]
    page=1
    while True:
        try:
            r=requests.get(f"{WC_URL}/wp-json/wc/v3/products",auth=auth,
                params={"per_page":100,"page":page,"status":"publish","orderby":"popularity","order":"desc"},timeout=30)
            products=r.json()
            if not products: break
            all_products.extend(products)
            if len(products)<100: break
            page+=1
            time.sleep(1)
        except: break
    total=len(all_products)
    top20=max(1,total//5)
    top_ids=set(p["id"] for p in all_products[:top20])
    print(f"✅ Top 20%: {len(top_ids)} of {total}")
    return top_ids

def fix_robots_txt():
    try:
        r=requests.get(f"{WC_URL}/robots.txt",timeout=10)
        issues=[]
        if "GPTBot" not in r.text: issues.append("GPTBot not allowed")
        if "Google-Extended" not in r.text: issues.append("Google-Extended not allowed")
        if issues:
            print(f"  ⚠️ robots.txt: {', '.join(issues)}")
            tg("⚠️ robots.txt fix needed:\nAdd:\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /")
        else: print("  ✅ robots.txt OK")
    except: pass

def fix_product(product,is_top20=False):
    pid=product["id"]
    name=product.get("name","")[:60]
    score=score_description(product.get("description",""))
    print(f"  [{pid}] {name} | Score:{score} | {'⭐TOP20' if is_top20 else 'normal'}")

    brand=get_brand(product)
    cats=", ".join([c["name"] for c in product.get("categories",[])])
    seed=get_content_hash(name,brand,cats)
    update_data={}

    if score<SCORE_THRESHOLD or is_top20:
        print(f"    📝 Generating description (seed:{seed})...")
        new_desc=gen_description(product,seed)
        if new_desc:
            faq_html,faq_schema=gen_faq_schema(product)
            if faq_html: new_desc+="\n"+faq_html
            if faq_schema: new_desc+="\n"+faq_schema
            update_data["description"]=new_desc
            print(f"    ✅ {len(new_desc)} chars")
    else:
        print(f"    ✓ Score OK, keeping")

    update_data["short_description"]=get_short_desc(product)

    print(f"    🔍 Gemini meta...")
    rm=gen_rank_math_meta(product)

    meta=product.get("meta_data",[])
    rm_keys=["_woodmart_product_custom_tab_title","_woodmart_product_custom_tab_content",
             "_woodmart_product_custom_tab_content_type","_rank_math_title",
             "_rank_math_description","_rank_math_focus_keyword",
             "_structured_description","_digital_source_type"]
    meta=[m for m in meta if m["key"] not in rm_keys]
    meta.append({"key":"_woodmart_product_custom_tab_title","value":"Ingredients"})
    meta.append({"key":"_woodmart_product_custom_tab_content","value":get_ingredients_tab(product)})
    meta.append({"key":"_woodmart_product_custom_tab_content_type","value":"editor"})
    if rm:
        meta.append({"key":"_rank_math_title","value":rm.get("title","")})
        meta.append({"key":"_rank_math_description","value":rm.get("description","")})
        meta.append({"key":"_rank_math_focus_keyword","value":rm.get("focus_keyword","")})
        print(f"    ✅ Meta: {rm.get('title','')[:50]}")
    brand_val=get_brand(product)
    origin_val=get_origin(brand_val)
    specs_val=extract_specs(product)
    struct_desc=f"{brand_val} product. Origin:{origin_val}. Price:BDT {product.get('price','0')}. 100% authentic. E-Mart BD. COD available."
    meta.append({"key":"_structured_description","value":struct_desc})
    meta.append({"key":"_digital_source_type","value":"trained_algorithmic_media"})
    update_data["meta_data"]=meta
    update_data["attributes"]=get_attributes(product)

    try:
        r=requests.put(f"{WC_URL}/wp-json/wc/v3/products/{pid}",auth=auth,json=update_data,timeout=30)
        if r.status_code==200:
            try: requests.get("https://www.google.com/ping?sitemap=https://e-mart.com.bd/sitemap_index.xml",timeout=5)
            except: pass
            print(f"    ✅ Updated!")
            return True
        else:
            print(f"    ❌ {r.status_code}: {r.text[:80]}")
            return False
    except Exception as e:
        print(f"    ❌ {e}")
        return False

def main():
    progress=load_progress()
    done_ids=set(progress["done_ids"])
    failed_ids=progress["failed_ids"]
    print("🚀 E-Mart Bulk Fixer — Google 2026")
    print(f"📊 Done:{len(done_ids)} | Failed:{len(failed_ids)}")
    tg(f"🚀 Bulk Fixer started\n✅ Done:{len(done_ids)}\n❌ Failed:{len(failed_ids)}")
    fix_robots_txt()
    top20_ids=get_top20_ids()
    total_done=len(done_ids)
    total_failed=0
    total_skipped=0

    # TOP 20% FIRST
    print(f"\n⭐ TOP 20% first ({len(top20_ids)} products)...")
    page=1
    while True:
        try:
            r=requests.get(f"{WC_URL}/wp-json/wc/v3/products",auth=auth,
                params={"per_page":BATCH_SIZE,"page":page,"status":"publish","orderby":"popularity","order":"desc"},timeout=30)
            if r.status_code!=200: time.sleep(10); continue
            products=r.json()
        except: time.sleep(10); continue
        if not products: break
        batch=[p for p in products if p["id"] in top20_ids and p["id"] not in done_ids]
        if not batch and page>len(top20_ids)//BATCH_SIZE+2: break
        for product in batch:
            success=fix_product(product,is_top20=True)
            time.sleep(3)
            if success: done_ids.add(product["id"]); total_done+=1
            else: failed_ids.append(product["id"]); total_failed+=1
        progress["done_ids"]=list(done_ids); progress["failed_ids"]=failed_ids
        save_progress(progress)
        page+=1; time.sleep(2)

    tg(f"⭐ Top 20% done!\n✅ {total_done}\n❌ {total_failed}\nProcessing rest...")

    # REMAINING
    print(f"\n📦 Processing remaining...")
    page=1
    while True:
        try:
            r=requests.get(f"{WC_URL}/wp-json/wc/v3/products",auth=auth,
                params={"per_page":BATCH_SIZE,"page":page,"status":"publish"},timeout=30)
            if r.status_code!=200: time.sleep(10); continue
            products=r.json()
        except: time.sleep(10); continue
        if not products: break
        for product in products:
            pid=product["id"]
            if pid in done_ids: total_skipped+=1; continue
            success=fix_product(product,is_top20=False)
            time.sleep(2)
            if success: done_ids.add(pid); total_done+=1
            else: failed_ids.append(pid); total_failed+=1
        progress["done_ids"]=list(done_ids); progress["failed_ids"]=failed_ids
        progress["last_page"]=page; save_progress(progress)
        print(f"📊 Page {page} | Done:{total_done} | Failed:{total_failed}")
        if page%5==0: tg(f"📊 Page {page}\n✅ Done:{total_done}\n❌ Failed:{total_failed}\n⏭️ Skipped:{total_skipped}")
        page+=1; time.sleep(3)

    msg=f"✅ COMPLETE!\n✅ Done:{total_done}\n❌ Failed:{total_failed}\n⏭️ Skipped:{total_skipped}"
    tg(msg); print(f"\n{msg}")

if __name__=="__main__":
    main()
PYEOF
