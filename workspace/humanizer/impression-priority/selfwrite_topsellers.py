#!/usr/bin/env python3
"""Self-authored (Claude) unique long-form descriptions for top sellers — 2026-06-23.
Each is written individually: different structure, opening, voice and emphasis —
no shared template. GMC-safe (no treats/cures/heals/prescription claims).
Applies to live DB + sets _emart_humanized. Rollback already saved.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import humanizer_impression_priority as H
D = H.DISCLAIMER

CONTENT = {

# COSRX Acne Pimple Master Patch — lead with the behaviour problem it solves
18095: """<p>If you are a chronic spot-picker, the COSRX Acne Pimple Master Patch was practically made for you. Each box holds 24 hydrocolloid stickers in three sizes, and the job of every one is simple: cover a brewing pimple, quietly draw out the gunk, and physically stop your fingers from making things worse. In a city like Dhaka, where heat and dust keep breakouts coming, a packet of these tucked in your bag is one of the cheapest, most useful things you can own.</p>
<h3>What it actually does</h3>
<p>Hydrocolloid is the same absorbent material used in some wound dressings. Stuck over a whitehead that has come to a head, it pulls fluid up and out, so the spot flattens noticeably faster than if you left it open to the air — or, worse, picked at it. You will often peel the patch off in the morning and find it gone cloudy white: that is the patch doing its work.</p>
<h3>Where it shines — and where it doesn't</h3>
<p>These are surface heroes. A raised, fluid-filled spot is the ideal candidate. A deep, blind cyst sitting under the skin with no opening will not respond much, because there is nothing for the patch to draw out yet. Use them on individual spots rather than expecting them to clear a whole flare of acne — for that, you want a proper cleanser and a BHA in your routine.</p>
<h3>Getting the most out of them</h3>
<p>The single biggest mistake is applying to damp or freshly-moisturised skin — they simply will not grip. Cleanse, dry the area completely, do your skincare around (not over) the spot, then press on a patch a little bigger than the blemish. Overnight wear works best in Bangladesh's heat, since daytime sweat and sunscreen tend to loosen the edges. Swap for a fresh one once it saturates.</p>
<p>They are discreet enough for the smallest size to disappear under a little makeup, which is why so many people keep both a home stash and a travel few. Genuinely one of the easiest wins for oily, acne-prone skin.</p>""",

# COSRX Snail 92 Cream — lead with texture/feel, conversational
3700: """<p>The COSRX Advanced Snail 92 All In One Cream has earned its cult status honestly: it is one of those rare moisturisers that feels substantial without ever turning greasy. Ninety-two percent of the jar is snail secretion filtrate, which gives it a slightly bouncy, cushioned slip as you smooth it on — and a soft, comfortable finish that holds up whether you are sitting under office air-conditioning or out in Dhaka's humidity.</p>
<h3>The snail mucin question</h3>
<p>Snail secretion filtrate sounds unusual, but in skincare terms it is simply a hydrating, conditioning ingredient packed with glycoproteins and naturally occurring hyaluronic acid. What you notice in practice is skin that looks smoother and feels more supple, with rough, dry patches softening over a few weeks of steady use. COSRX rounds it out with sodium hyaluronate for an extra layer of water-binding and panthenol for comfort.</p>
<h3>Who it suits</h3>
<p>This is a genuine all-rounder for normal, combination, and dehydrated skin. If your skin tends to feel tight after cleansing but you dislike heavy creams, this is a sweet spot. Very oily skin can still use it — just a thin layer — though some will prefer a true gel in peak summer. The only people who should steer clear are those with a known snail or mollusc sensitivity.</p>
<h3>Fitting it into your day</h3>
<p>Use it morning and night as your moisturiser step, after your watery essences and serums. In the daytime it sits happily under sunscreen; at night you can press a little extra into dry areas. It plays nicely with niacinamide and gentle exfoliating acids, making it an easy anchor for a simple, comfortable routine.</p>""",

# Beauty of Joseon sunscreen — lead with the white-cast pain point for BD skin tones
4320: """<p>Ask around the Bangladeshi skincare community for a sunscreen that does not leave a ghostly white film, and Beauty of Joseon's Relief Sun comes up again and again. It carries the strongest UVA rating available (PA++++) alongside SPF50+, yet wears like a light, faintly dewy moisturiser — which is exactly why people actually reapply it instead of leaving it in a drawer.</p>
<h3>Why the ratings matter here</h3>
<p>Bangladesh sits under high UV most of the year, and it is UVA in particular that drives tanning and dark spots on deeper South Asian skin tones. A sunscreen that only chases a high SPF number leaves that gap open. PA++++ closes it, which makes this a sensible daily choice for anyone working on even tone or guarding the results of a brightening routine.</p>
<h3>The feel</h3>
<p>This is where it wins loyalty. The organic filters are blended into a rice-extract and probiotic-ferment base that gives a soft, hydrated finish with no chalky cast — a real relief on medium-to-deep skin. It layers cleanly under makeup and does not pill the way heavier sunscreens can. Very oily skin in peak monsoon humidity might still prefer a drier matte formula, and fragrance-sensitive users should patch test first.</p>
<h3>Using it properly</h3>
<p>Sunscreen only delivers its labelled protection if you use enough: roughly two finger-lengths for face and neck, applied as the final morning step over moisturiser. Give it a minute to set before makeup, and top up every two to three hours when you are outdoors or sweating — a stick or cushion makes midday reapplication realistic. Treat it as the non-negotiable close to any Vitamin C or retinol routine.</p>""",

# CeraVe Retinol Serum — careful, safety-forward, beginner framing
23486: """<p>Retinol has a reputation for being harsh, and that is precisely the problem the CeraVe Skin Renewing Retinol Serum sets out to avoid. It uses an encapsulated, gentler form of retinol and wraps it in CeraVe's signature three-ceramide barrier support, so beginners can start working on texture and tone without the angry peeling that scares people off. For a first retinol in Bangladesh's climate, it is a sensible, level-headed pick.</p>
<h3>How encapsulated retinol works</h3>
<p>Retinol is a vitamin A derivative that gradually encourages skin renewal, helping soften the look of rough texture, uneven tone, and early fine lines over weeks and months — not overnight. The encapsulation here releases it more slowly, which tends to mean less initial irritation. Ceramides and niacinamide ride alongside to keep the barrier supported while the retinol does its slow work.</p>
<h3>Start slow — this part matters</h3>
<p>Use it at night only, on clean dry skin, beginning just two or three evenings a week and building up as your skin adjusts. A pea-sized amount for the whole face is plenty; follow with moisturiser. Because retinol makes skin more sun-sensitive, daily sunscreen the next morning is not optional, especially under Dhaka's strong sun.</p>
<h3>Who should hold off</h3>
<p>Skip retinol entirely during pregnancy or breastfeeding and speak to a doctor first. If your barrier is already sensitised or compromised, let it recover before introducing this. And avoid layering it with strong exfoliating acids or professional-strength retinoids on the same night — space them out to keep things comfortable.</p>""",

# Some By Mi Galactomyces Vit C — glow/brightening, lighter conversational tone
2597: """<p>For anyone whose skin has gone a little flat and tired from sun, late nights, and city life, the Some By Mi Galactomyces Pure Vitamin C Glow Serum is an easy way to chase back some radiance. It teams a stable vitamin C derivative with galactomyces ferment — two ingredients beloved in Korean routines for that fresh, lit-from-within look — in a lightweight texture that disappears quickly even in humid weather.</p>
<h3>The two ingredients doing the work</h3>
<p>Galactomyces ferment filtrate is the same family of fermented ingredient that made certain famous essences popular; it leaves skin looking conditioned and smooth. The vitamin C derivative, gentler and more stable than pure ascorbic acid, supports a brighter, more even tone with regular use. Together they aim at dullness and patchy areas rather than promising any overnight transformation.</p>
<h3>How to slot it in</h3>
<p>Mornings are the natural home for this serum: a few drops after toner, before moisturiser and sunscreen. Vitamin C and daily SPF are a classic pairing — the antioxidant support in the day and sunscreen on top complement each other nicely under Bangladesh's strong sun. If your skin is comfortable with it, you can use it at night too.</p>
<p>It suits most skin types and is a friendly entry point if stronger vitamin C serums have stung you before. As always, introduce it gradually and avoid piling it on top of several strong acids in the same step.</p>""",

# Missha Rice Sheet Mask — short, breezy, treat-step framing (deliberately shorter & lighter)
3018: """<p>Some products are everyday workhorses; the Missha Airy Fit Sheet Mask in Rice is a little treat. It is a single-use cotton mask soaked in a rice-extract essence, and its whole appeal is fifteen quiet minutes that leave dull, tired skin looking fresher and more hydrated. The "airy fit" sheet is thin and breathable, which makes it genuinely comfortable in Dhaka's heat rather than hot and slippery.</p>
<h3>What rice extract brings</h3>
<p>Rice has a long history in Asian skincare for a reason — it is associated with a smoother, brighter-looking complexion. Here it sits in a humectant-rich essence that floods the skin with quick hydration, so the immediate payoff is that plumped, well-rested look just before an event or after a day in the sun.</p>
<h3>Getting it right</h3>
<p>Cleanse and tone first, lay the mask on for fifteen to twenty minutes (don't let it dry out completely on your face), then peel it off and pat the leftover essence in rather than rinsing. Seal everything with a moisturiser, and remember sunscreen the next morning. Once or twice a week is plenty — and a mask chilled in the fridge first is a small luxury on a hot Dhaka afternoon.</p>""",

# 3W Clinic UV Sunblock — value/everyday-habit angle
26653: """<p>Not every sunscreen needs to be a splurge, and the 3W Clinic Intensive UV Sunblock Cream SPF50 PA+++ makes the case for an affordable daily option you will not feel guilty about reapplying. It covers both the burning UVB rays and, with PA+++, a solid share of the UVA that drives tanning and dark spots — the two things Bangladesh's relentless sun throws at your skin all year.</p>
<h3>Why "affordable" matters for sunscreen</h3>
<p>The best sunscreen is the one you will actually use generously and often. A pricey bottle you ration protects less than a budget one you apply properly twice a day. This cream is built for exactly that — a face-and-body formula at a price that makes daily, repeat use realistic for the whole household.</p>
<h3>Texture and fit</h3>
<p>It is a classic cream that spreads easily over larger areas, making it as handy for arms and neck as for the face. Very oily skin in the thick of monsoon humidity might prefer a lighter gel finish, and anyone sensitive to fragrance should patch test before committing. For most people, though, it is a no-fuss daily shield.</p>
<h3>Using it well</h3>
<p>Apply it last in your morning routine, over moisturiser, using about two finger-lengths for the face and more for the body. Let it settle before heading out, and top up every couple of hours when you are in the sun or sweating. It is the essential final step that protects every Vitamin C, retinol, or brightening product underneath it.</p>""",
}

def main():
    print(f"Applying {len(CONTENT)} unique self-authored descriptions...")
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
