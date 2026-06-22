#!/usr/bin/env python3
"""Self-authored (Claude) unique descriptions — top sellers batch 2, 2026-06-23."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import humanizer_impression_priority as H
D = H.DISCLAIMER

CONTENT = {

# COSRX Snail 96 Essence 30ml — travel-size framing, different from the cream
50566: """<p>The 30ml COSRX Advanced Snail Mucin 96 Power Essence is the pocket version of the essence that arguably kicked off the whole snail-mucin craze. Same 96% snail secretion filtrate, same slightly viscous, glass-like slip — just in a size you can throw in a travel bag or use to test whether your skin loves it before buying the big bottle. For a lot of people, that first small jar becomes a permanent fixture.</p>
<h3>What you feel</h3>
<p>Press it into clean skin and it sinks in with a light tackiness that quickly settles into a smooth, hydrated finish. The snail mucin, backed by sodium hyaluronate and panthenol, leaves the surface looking conditioned and feeling supple — the kind of low-drama hydration that simply makes everything you layer afterwards sit better.</p>
<h3>Good to know</h3>
<p>It suits practically every skin type as an early hydrating layer, and it is especially welcome for skin that goes dehydrated under Dhaka's air-conditioning. The only people who need to be cautious are those with a known snail or mollusc sensitivity — patch test first. Apply after toner, before your serums and moisturiser, morning and night, and finish with sunscreen in the day.</p>""",

# JNH Whipping Cleansing Foam — everyday cleanse, plain and practical
26163: """<p>A good daily cleanser does not need to be exciting — it needs to leave your face clean and comfortable, twice a day, without drama. That is exactly the brief the JNH Sseng Eol Whipping Cleansing Foam fills. It pumps out as a soft, pre-whipped foam that spreads in seconds and rinses away the oil, sweat, sunscreen, and city dust that build up over a Dhaka day.</p>
<h3>Why the whipped format helps</h3>
<p>Because the foam arrives ready-lathered, you are not scrubbing a thick cleanser into your skin to work up suds — you simply massage the airy foam over a wet face and rinse. Mild surfactants do the cleaning while glycerin helps the skin hold onto a little moisture, so you avoid that squeaky, tight feeling that pushes oily skin into producing even more oil.</p>
<h3>How to use it</h3>
<p>Use it morning and night. In the evening, if you have worn sunscreen or makeup, remove those with an oil cleanser or micellar water first, then follow with this foam as your second cleanse. It suits normal, combination, and oily skin; very dry or sensitised skin may prefer something creamier. Resist over-washing — twice a day is enough.</p>""",

# Vaseline Lip Therapy Rosy — tiny everyday hero, warm tone
48655: """<p>Few things in a handbag earn their keep like a little tin of Vaseline Lip Therapy in Rosy Lips. It is petroleum jelly at heart — the same simple, dependable sealant that has rescued dry lips for generations — with a sheer rosy tint and a faint sweet scent that make it feel a touch more special than a plain balm.</p>
<p>The way it works is refreshingly uncomplicated: the petrolatum forms an occlusive layer that locks moisture onto chapped, flaky lips and stops them drying out further. A swipe gives a natural hint of colour; a thicker layer overnight turns it into a quiet lip treatment you wake up grateful for. In Bangladesh it earns its place during dry-season weeks and in over-air-conditioned offices, where lips chap without warning.</p>
<p>Keep the tin handy and reapply whenever lips feel tight. If they are very flaky, gently buff first so the balm can do its job. The only people it will not satisfy are those after bold, opaque lip colour — this is comfort with a blush of tint, not a lipstick.</p>""",

# Mise-En-Scene Hair Serum — frizz/humidity, hair-care voice
4140: """<p>If Bangladesh's humidity has ever turned your freshly-styled hair into a halo of frizz by mid-morning, the Mise-En-Scene Perfect Hair Serum is the kind of small fix that earns daily loyalty. It is a lightweight, argan-oil-based leave-in that smooths the hair surface, calms flyaways, and brings back shine on dry or damaged lengths — without the heavy, greasy weigh-down that puts people off oils.</p>
<h3>What it is doing</h3>
<p>Argan oil conditions and softens the hair shaft, while silicone-based smoothers coat the cuticle to seal down frizz and add slip and gloss. The result is hair that looks sleeker and behaves better, especially in damp, sticky weather where roughness and static are constant battles.</p>
<h3>Using it without overdoing it</h3>
<p>Warm a few drops between your palms and work them through damp mid-lengths and ends after washing — keep it off the scalp. You can also smooth a tiny amount over dry hair to tame midday frizz. Build up slowly; finer hair needs only a little, while thick or very dry hair can take a touch more. A bottle lasts a long time.</p>""",

# Welcos Confume Argan Shampoo — large-size value, hair wash
26327: """<p>The Welcos Confume Argan Hair Shampoo comes in a generous 750ml bottle, and that size tells you what it is for: an everyday, whole-household wash that cleans without stripping. Built around argan oil, it aims to leave hair feeling clean but still soft and manageable, rather than squeaky and rough — a useful balance for dry or frizz-prone hair in a humid climate.</p>
<h3>The argan angle</h3>
<p>Argan oil is prized in hair care for conditioning and adding shine, and blending it into a daily shampoo means the lengths get a little nourishment even as the cleansers lift away oil, sweat, and product build-up. For hair that tends to feel dry and unruly after washing, that gentler finish makes a noticeable difference.</p>
<h3>How to get the best from it</h3>
<p>Massage a coin-sized amount into wet scalp and roots, let the lather rinse down the lengths, and repeat only if your hair was especially oily or product-heavy. Follow with a conditioner or the matching hair serum on the ends. The large bottle makes it an easy-value staple for regular washing.</p>""",

# Dr. Althea Vit C Boosting Serum — brightening, gentle entry
57130: """<p>Vitamin C serums have a reputation for stinging and going off quickly, which is why the Dr. Althea Vitamin C Boosting Serum leans the other way — toward something stable, gentle, and easy to wear every day. It uses a milder vitamin C derivative alongside supporting antioxidants to chip away at dullness and uneven tone, in a lightweight texture that disappears fast even when the weather is sticky.</p>
<h3>Who it is for</h3>
<p>This is a friendly entry point if harsher vitamin C serums have irritated you before. With consistent morning use it supports a brighter, fresher-looking complexion and helps your skin stand up to the daily grind of sun and pollution. Most skin types get on well with it; very reactive skin should still patch test first.</p>
<h3>Where it sits</h3>
<p>Mornings are ideal: a few drops after toner, before moisturiser and sunscreen. Vitamin C and daily SPF are natural partners — antioxidant support underneath, sun protection on top — which matters a great deal under Bangladesh's strong sun. Introduce it gradually and avoid stacking it with strong exfoliating acids in the same step.</p>""",

# Dr. Althea 345 Relief Cream — soothing/barrier, calm tone
58162: """<p>Some moisturisers are about glow; the Dr. Althea 345 Relief Cream is about calm. It is built for skin that feels stressed — tight after cleansing, warm and reactive after a day in the sun, or sensitised from one active too many. The cushiony cream settles that frazzled feeling and leaves the skin soft, comfortable, and properly looked-after.</p>
<h3>What is inside</h3>
<p>Soothing ingredients in the centella and panthenol family help quiet the look and feel of irritated skin, while a blend of ceramides and humectants reinforces the moisture barrier and holds water in place. Glycerin rounds it out for lasting comfort. It is the sort of formula you reach for on the days your skin is simply not happy.</p>
<h3>Working it in</h3>
<p>Smooth a comfortable layer over the face and neck after your serums, morning and night, adding a little more to any tight or flaky areas. In Dhaka's heat a thin daytime layer is usually enough, with more at night for recovery. It pairs especially well after retinol or exfoliating-acid nights, when the barrier needs extra support — and always follow with sunscreen in the morning.</p>""",

# Simple Purifying Gel Wash — gentle, sensitive-skin, no-nonsense
26366: """<p>Simple built its whole name on the idea of skincare without unnecessary extras, and the Purifying Gel Wash is that philosophy in a bottle. It is a gentle, fragrance-free gel cleanser that lifts away oil, dirt, and the day's grime while staying kind to sensitive skin — a sensible, no-drama choice for anyone who reacts to harsher, heavily perfumed washes.</p>
<h3>Why "gentle" is the point</h3>
<p>The formula skips the strong fragrances and harsh detergents that leave reactive skin red and tight. Instead, mild cleansers paired with skin-loving additives clean the surface without stripping it, so your face feels fresh rather than squeaky. For combination and sensitive skin navigating Dhaka's heat and pollution, that restraint is exactly what keeps the barrier comfortable.</p>
<h3>How to use it</h3>
<p>Wet the face, massage a small amount of the gel for around twenty seconds, then rinse with lukewarm water. Use it morning and night; in the evening, lift off sunscreen with an oil cleanser first, then follow with this as a gentle second cleanse. Suits most skin types, and is an easy daily workhorse for sensitive complexions.</p>""",

# The Ordinary AHA 30% BHA 2% — strong exfoliant, safety-FORWARD, distinct cautious tone
23083: """<p>The Ordinary's AHA 30% + BHA 2% Peeling Solution is not a daily product — it is a once-a-week, ten-minutes-maximum treatment, and that distinction matters enormously. This is a potent, deep-red exfoliating mask that combines a high level of alpha hydroxy acids with salicylic acid to resurface the look of dull, rough, congested skin. Used correctly it is brilliant; used carelessly it can irritate, so the rules below are not optional.</p>
<h3>What it does</h3>
<p>The AHAs work on the surface to loosen dead, dull cells and even out the look of texture and tone, while the BHA reaches into oily, congested pores. The visible payoff is smoother, brighter-looking skin — which is why it has such a devoted following. It is best suited to resilient, oily, or congestion-prone skin that is already used to gentler acids.</p>
<h3>Use it carefully</h3>
<ul><li>Apply to clean, dry skin no more than once a week, in the evening</li><li>Leave on for a maximum of 10 minutes, then rinse thoroughly — never leave it on longer or overnight</li><li>Avoid the eye area, lips, and any broken or sensitised skin</li><li>Do not combine with retinol or other acids on the same night</li><li>Skip it entirely if your skin is reactive, compromised, or new to exfoliating acids</li></ul>
<h3>The sunscreen rule</h3>
<p>Acids leave skin more sun-sensitive, so diligent daily sunscreen is essential while you use this — doubly so under Bangladesh's strong year-round sun. If in doubt, start with a gentler weekly exfoliant and work up to this one.</p>""",

# Kose Suncut UV Perfect Gel — Japanese sunscreen, water-resistant/active angle
50639: """<p>For hot, sweaty, out-and-about days, the Kose Suncut UV Perfect Gel Super Waterproof SPF50+ PA++++ is the kind of sunscreen that actually stays put. It is a fresh, watery Japanese gel that absorbs almost instantly with a light, non-sticky finish, yet carries the highest protection ratings and a genuinely water- and sweat-resistant hold — a combination Dhaka's climate practically demands.</p>
<h3>Why it suits the heat</h3>
<p>The gel texture is the headline. Where heavier creams can feel greasy and slide off in humidity, this sinks in dry and light, which makes you far more likely to apply enough and reapply often. SPF50+ handles burning UVB, while PA++++ — the top UVA rating — guards against the tanning and dark spots that strong sun brings on.</p>
<h3>Using it well</h3>
<p>Apply generously as the last step of your morning routine, about two finger-lengths for the face, and let the gel set for a minute. Because it is water-resistant it is excellent for commuting, outdoor work, and sweaty afternoons — but water resistance is not permanence, so still reapply every couple of hours when you are out. Very dry skin may want a hydrating layer underneath.</p>""",

}

def main():
    print(f"Applying {len(CONTENT)} unique descriptions...")
    ok = 0
    for pid, body in CONTENT.items():
        html = body.strip() + D
        if H.apply_to_db(pid, html):
            ok += 1; print(f"  ✓ {pid}")
        else:
            print(f"  ✗ {pid} db error")
    print(f"Applied {ok}/{len(CONTENT)}")

if __name__ == "__main__":
    main()
