# Winning Google organic traffic for a small personal Budapest travel/food blog (budapesthungry.com), 2025-2026

Research notes, compiled 2026-10-26. Method note for the report writer: in this session, WebFetch and curl to most hosts (developers.google.com, ahrefs.com, blog.stay22.com) were blocked by the egress proxy. Findings below come from WebSearch result summaries (snippet-level, not full-page reads), plus keyword data pulled live from the OpenSEO/DataForSEO keyword API for the site's own project (US, English). A small number of Google Search Central facts are cited from prior knowledge of those well-known pages, and each is marked "[not re-fetched this session]". Anything older than 2024 is marked as such.

Observations about the actual site (from the repo at /home/user/arpibp/blog-copy, not from web sources):
- 34 URLs in sitemap.xml. Roughly 20 of them are life-story chapters (Canada, Cayman Islands, dad, divorce, the dog), and roughly 13 are Budapest visitor posts (food, taxis/transit, thermal bath at opening time, Christmas markets, pálinka/Unicum, wine/Tokaji, drinking water, "leave Budapest" day trip, cold weather, etc.).
- Titles are clever but carry no keywords, for example `<title>Fooooood · Arpi from Budapest`, `The thermal bath at opening time · Arpi from Budapest`, `Drinking water · Arpi from Budapest`. Several leave out "Budapest" entirely.
- Meta descriptions are one-liners with no query terms ("Set the alarm. Thank me later.", "Straight from the tap.").
- The visitor posts are short: about 290-750 words of total page text, navigation included. Most have zero `<img>` tags. Only the "leave Budapest" post has images (12).
- Canonicals are absolute to https://budapesthungry.com/... (good). netlify.toml says the .hu domain serves the same site with no redirect. The toml spells it "bullshitsunami.hu", and the brief says "bullshittsunami.hu"; worth checking which one is real.

---

## 1. What Google's Helpful Content updates, the March 2024 core update and the 2025-2026 core updates did to small/independent travel blogs; who recovered and why; what Google's guidelines say

### Takeaway
The September 2023 HCU and the March 2024 core update (which folded the "helpful content system" into core ranking) hit independent travel blogs very hard. Many lost 50-90%, while Reddit/Quora/forums and big brands gained. The June-July 2025 core update produced the first broad, partial recoveries among travel bloggers. Later updates (Dec 2025, Mar 2026, May 2026) continued to move rankings away from aggregators and "middleman" pages and toward first-hand, original sources. Full recovery is rare, and Google says some sites never will recover. For a brand-new site the lesson is to look like the sites that recovered from day one: a real named person, demonstrably first-hand experience, no thin or generic pages, a good UX, and no affiliate-first page templates.

### Cited Findings
**Timeline (2023-2026)**
- Sept 2023 HCU: some travel bloggers saw organic traffic cuts of up to about 75% immediately. Google gave only high-level guidance, which critics called "untransparent". — [Travelpayouts blog, "Oops, Google did it again" (2023)](https://travelpayouts.com/blog/tag/google-updates); [Google Search Central community thread, Sep 2023](https://support.google.com/webmasters/thread/236348769/website-penalized-by-the-2023-helpful-content-system-update?hl=en)
- March 2024: Google folded the helpful content system into its core ranking algorithm, so the standalone HCU no longer exists, and recovery now depends on a later core update reassessing the site. — [serps.io, HCU recovery data 2026](https://serps.io/blog/helpful-content-update-recovery). Google's own announcement said the March 2024 core update plus spam-policy changes would cut "low-quality, unoriginal content" in results by about 40% (later reported as 45%). — [Google Search Central blog, March 2024 core update & spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) [not re-fetched this session]
- Search Liaison (Danny Sullivan), around Aug-Sept 2024: recovery after a core update hit "is not guaranteed", and some sites may never get back to previous traffic. Google is "continuing to work on" rewarding great content from small independent publishers, and not every site is affected by the same ranking systems. — [Search Engine Land](https://searchengineland.com/google-not-all-sites-will-fully-recover-with-future-core-algorithm-updates-453507); [Wordtracker](https://freekeywords.wordtracker.com/blog/seo/august-update-googles-danny-sullivan-says-recovery-is-not-guaranteed); [PPC Land on the Aug 2024 core update](https://ppc.land/googles-august-2024-core-update-small-publishers-in-the-spotlight/)
- In 2025 Google reportedly said visibility for independent sites would improve "by December" 2025, and Sullivan answered "Yes" when asked whether that deadline was accurate. — [Website Builder Expert](https://www.websitebuilderexpert.com/news/google-visibility-improvements/). Sullivan reportedly stopped being Search Liaison on Aug 1, 2025 (single source, unverified). — [PPC Land](https://ppc.land/danny-sullivan-no-longer-googles-search-liaison-on-august-1-2025/)
- March 2025 core update (Mar 13-27, 2025): in a 200-site travel blog sample, overall traffic fell 3%, about 40% of sites saw no impact or growth, and some individual sites doubled. — [DiscoverCars, March 2025 update analysis](https://www.discovercars.com/blog/march-25-google-update)
- June 2025 core update (Jun 30-Jul 17, 2025): most tracked travel blogs gained, with "many HCU recoveries". Stay22 described travel bloggers' traffic rising "after nearly 18 months of punishing updates". — [DiscoverCars, June 2025](https://www.discovercars.com/blog/june-25-google-update); [Stay22, "Traffic is up for travel bloggers"](https://blog.stay22.com/june-2025-google-update). An affiliate site stayed 90%+ down for more than a year and then hit new highs in the June 2025 update. — [Niche Site Growth](https://nichesitegrowth.beehiiv.com/p/this-affiliate-buyer-s-guide-blog-made-a-full-hcu-recovery)
- August 2025 spam update (Aug 26-Sep 22, 2025). December 2025 core update (Dec 11-29, 2025), reported to have hit affiliate sites hard. — [Momentic update tracker](https://momenticmarketing.com/google-updates); [Dataslayer on Dec 2025](https://www.dataslayer.ai/blog/google-core-update-december-2025-what-changed-and-how-to-fix-your-rankings); [serps.io](https://serps.io/blog/helpful-content-update-recovery)
- 2026: a Discover-specific core update (Feb 5-27, 2026), a spam update (Mar 24-25), a core update (Mar 26/27-Apr 8), and a core update (May 21-Jun 2, 2026). — [Search Engine Roundtable, March 2026 core update](https://www.seroundtable.com/google-march-2026-core-update-41121.html); [Digitrio tracker](https://digitrio.com.sg/google-algorithm-updates/); [BloggersPassion, May 2026](https://bloggerspassion.com/doorway-pages-penalty-algorithm)
- March 2026 core update: aggregators, directories, comparison sites and "content hubs that repackage information from elsewhere" lost ground. Official sites, niche specialists and data-rich or original sources won. Aleyda Solis's Sistrix-based analysis (via SEL) saw rankings move "from intermediary sites toward stronger destination sources". Airbnb fell about 29.5% in one 30-domain sample. No travel-blog-specific dataset was found. — [Loganix winners/losers](https://loganix.com/march-2026-google-core-update-winners-and-losers/); [Search Engine Land](https://searchengineland.com/march-2026-google-core-update-what-changed-474397); [Yepads](https://yepads.com/ru/?p=14173)

**Who recovered and why (patterns reported)**
- Recovered sites typically pruned or removed thin content (one travel blog deleted it all at once), rebuilt pages around first-hand experience, and improved UX. Sites written in first-person language with genuine first-hand accounts did better than sites written in third-person "expert" voice. — [Stay22 / DiscoverCars summaries via search](https://www.discovercars.com/blog/june-25-google-update); [thestacc 400+ site study](https://thestacc.com/blog/helpful-content-update-recovery/)
- Recovery is usually partial. In a 400+ site study, about 22% recovered 20% or more of lost traffic. — [thestacc](https://thestacc.com/blog/helpful-content-update-recovery/) (vendor study, self-selected sample)
- Travel Lemming (Nate Hake) began as a personal blog and grew past 10M annual readers (2024). Hake became a public critic of Google's updates, and his company moved into paid itinerary planning (Paris). He said "we're not even really an information source in five years". — [Penn Gazette profile](https://thepenngazette.com/vagabond-publisher/); [WUSF/NPR 2025](https://www.wusf.org/2025-08-04/how-businesses-are-adapting-to-the-ai-chatbots-takeover-of-search-engines). No hard Travel Lemming recovery numbers were found.

**Forums and "hidden gems"**
- Google's "hidden gems" ranking improvement (announced May 2023, part of core ranking, not HCU) aims to surface "first-hand personal experiences shared publicly", mainly forums, blogs and social posts. Reddit (+378%) and Quora (+332%) were the biggest visible winners in Semrush data. Google also added a "Perspectives" filter. — [Search Engine Land](https://searchengineland.com/google-search-ranking-improvement-aims-to-surface-hidden-gems-434623); [Search Engine Roundtable](https://www.seroundtable.com/google-search-hidden-gems-ranking-algorithm-36388.html); [Glenn Gabe / GSQi on forum surge](https://gsqi.com/marketing-blog/beyond-reddit-and-quora-google-hidden-gems-update-forums-surge/) (2023-2024 material)

**What Google's own guidelines say**
- Google's self-assessment questions include: "Does your content clearly demonstrate first-hand expertise and a depth of knowledge (for example, expertise that comes from having actually used a product or service, or visiting a place)?" — [Google Search Central, Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Google has no preferred word count and says not to write to one. — [same page, via Search Engine Journal summary](https://www.searchenginejournal.com/google-helpful-content-update/461156/)
- The same page lists search-engine-first warning signs: "extensive automation" to produce content on many topics, mainly summarizing others without adding value, writing to a word count, entering a niche only for traffic, and changing dates to seem fresh without substantially changing content. It also gives the "Who, How, Why" framework: make it self-evident who wrote it (byline that leads to author info), how it was made, and why it exists (to help people, not primarily to rank). E-E-A-T is an element of the Search Quality Rater Guidelines, Trust is the most important part, and "Experience" (first-hand) was added in Dec 2022. — [Google, Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) [the date-changing and Who/How/Why specifics are not re-fetched this session; search snippets confirmed only the first-hand and word-count items]
- AI-generated content is not banned in itself. Using automation primarily to manipulate rankings is spam ("scaled content abuse" policy, March 2024). — [Google Search Central blog, Feb 2023 AI content guidance](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content); [March 2024 spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) [not re-fetched this session]

### Inferences
- Arpi's site already matches the profile Google says it wants and that recovered in 2025: a named local with a real job (waiter), a strong first-person voice, an opinionated "honest take", and life-story chapters that make the "Who" obvious. The risk is not low quality. The risk is that the pages are too thin and too poorly labeled for Google to match them to queries (see Section 4).
- The new site has no HCU history to recover from. Core updates mostly re-rank, so a new site should simply avoid what got sites hit: dozens of near-duplicate "best X in Budapest" listicles, affiliate-box templates, AI-padded intros, and "updated [year]" title churn without real changes.
- The life-story chapters are valuable as E-E-A-T and brand signals (Who/Why), but they will barely rank for tourist queries. They should be linked from an About/"Who is Arpi" page and from each visitor post's byline, so they strengthen the travel pages rather than diluting topical focus.
- Reddit and forum dominance is a competitor and also a channel. Many Budapest SERPs show r/budapest or r/travel threads, and a waiter's honest answers there (with an occasional link, where the subreddit rules allow) are both a traffic source and a brand signal.

### Gaps
- No primary Google statement that specifically discusses travel blogs in the 2025-2026 updates was found.
- No travel-niche winners/losers dataset for the March or May 2026 core updates was found. Most analyses are vendor samples of 30-400 sites.
- The exact current wording of Google's helpful-content page could not be fetched (proxy block).

---

## 2. How AI Overviews / AI Mode affect click-through for travel queries; which query types still send clicks

### Takeaway
AI Overviews (AIO) roughly halve the CTR of top organic results where they appear (Ahrefs: -58% at position 1 between Dec 2023 and Dec 2025; Pew: 8% vs 15% click rate). Small publishers lost the most referral traffic (Chartbeat: -60%, Jan 2024-Mar 2026). AIOs trigger mainly on informational, question-style, low-volume queries, and travel/destination queries trigger them more often than average. What still sends clicks are queries where the searcher wants a person's judgment, a specific plan, or up-to-date local detail the AI can't confidently summarize: opinionated "is X worth it", "X vs Y" decisions, itineraries, insider "where locals actually eat", seasonal/current-year event posts, and practical how-to with exact steps and prices. Being cited inside the AIO also gives a measurable click lift.

### Cited Findings
- Ahrefs, 300k keywords, Dec 2023 vs Dec 2025: position-1 CTR down 58% when an AIO appears (position 2: -50.8%, position 10: -19.4%). Its earlier 2025 study found -34.5%. — [Ahrefs, "AI Overviews reduce clicks" update](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update); [Ahrefs original](https://ahrefs.com/blog/ai-overviews-reduce-clicks/) (figures via search summaries)
- Pew Research, 68,879 real searches (March 2025 panel): users clicked an organic result 8% of the time when an AI summary appeared, versus 15% without one, and clicked a source inside the AI summary only 1% of the time. — [Presenc.ai comparison of Ahrefs/Pew/Seer](https://presenc.ai/research/ai-overviews-ctr-impact-2026) (secondary; Pew primary not fetched)
- Seer Interactive: in Sept 2025, brands cited in the AIO had organic CTR of 0.70% versus 0.52% when not cited. Later data (Jan 2025-Feb 2026) shows organic CTR on AIO queries at 2.14% (Sep 2025), 1.31% (Dec 2025), then 2.36% (Feb 2026), a partial rebound. Cited brands get about 120% more organic clicks per impression. — [Presenc.ai](https://presenc.ai/research/ai-overviews-ctr-impact-2026); [heybuffy summary](https://heybuffy.com/blog/how-much-do-ai-overviews-reduce-clicks)
- Other estimates: SISTRIX (German keywords) found top-result CTR fell from 27% to 11% with an AIO. A Carnegie Mellon/ISB study found organic clicks down 38%. — [Relevant Audience 2026](https://relevantaudience.com/seo/ai-overview-impact-on-organic-search-2026); [quickseo stats](https://quickseo.ai/blog/google-ai-overviews-statistics-2026-60-data-points-every-seo-should-know)
- AI Mode: an Aug 2026 preprint (not peer reviewed; 1,100 US Chrome users) found forced AI Mode use cut publisher CTR by 18.8 percentage points versus standard Search. Cloudflare data reported by the NYT shows human traffic to publishing/retail/finance sites down nearly 40% (Jun 2025-Apr 2026), with AI Mode keeping users in Google in about 75% of sessions. Google (Liz Reid) says AI features send "billions of clicks" a week. — [letsdatascience on AI Mode study](https://letsdatascience.com/news/study-finds-google-ai-search-reduces-referrals-9881ee58); [AI Weekly](https://aiweekly.co/alerts/googles-ai-mode-walls-off-web-starves-publisher-traffic)
- Chartbeat: Google search referrals to publishers fell 33% globally (US -38%) in the year to Nov 2025. Over Jan 2024-Mar 2026, small publishers were down 60%, mid-size 47%, and large 22%. — [AI Weekly / aggregated reporting](https://aiweekly.co/node/8902) (secondary)
- Which queries trigger AIOs (Semrush, 200k keywords): 82% (desktop) and 76% (mobile) of AIOs were on keywords under 1,000 searches/month, informational intent made up 76-80%, and question keywords were about a third. A later Semrush study found AIOs on commercial-intent SERPs grew about 71% over six months, while transactional SERPs fell 5%. — [Semrush AI Overviews study](https://www.semrush.com/blog/semrush-ai-overview-research/); [Semrush commercial study](https://www.semrush.com/blog/ai-overviews-commercial-search-study/). Overall AIO prevalence was about 13% of queries in Mar 2025 and about 16% by Nov 2025 (Semrush); Similarweb reports more than 40% of US searches in 2026 (methods differ). — [tryvizup](https://www.tryvizup.com/blog/ai-overviews-trigger-rate-in-2026-what-40-really-means)
- Travel/destination intent triggered AIOs on 52.3% of prompts in one small 2026 panel (n = 258 travel prompts). — [Cloro AI Overview trigger index](https://cloro.dev/research/ai-overview-trigger-index/) (small sample). Statista has a 2024-25 travel-keyword AIO share, but the figure is paywalled. — [Statista](https://www.statista.com/statistics/1618833/travel-keywords-triggering-ai-overviews-worldwide)
- In travel AI answers, 71% of AI chatbots used first-party reviews as a source for travel queries. — [CMSWire](https://www.cmswire.com/the-wire/customer-reviews-power-two-thirds-of-ai-travel-recommendations/)
- Google's official line (May 2025, "Top ways to ensure your content performs well in Google's AI experiences"): no special AIO optimization is needed. The same fundamentals apply (unique, non-commodity content, good page experience, crawlable, text in HTML, structured data matching visible content), and Google claims clicks from AIO pages are "higher quality". — [Google Search Central blog, May 2025](https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search) [not re-fetched this session]

### Inferences
- High-volume definitional queries ("goulash" 201k, "chimney cake" 18.1k, "langos", "palinka", "what is a ruin bar") are the most AI-cannibalized and are dominated by recipe sites and Wikipedia. They are poor targets as head terms. Reach them through Budapest-specific modifiers instead ("best goulash in Budapest", "where to get chimney cake in Budapest", "is the chimney cake at the Christmas market worth it").
- Query types likely to still earn clicks for Arpi (inferred from the AIO-trigger pattern and the "hidden gems"/first-hand preference):
  1. Opinion and verdict: "is Széchenyi worth it", "is the Budapest Christmas market worth it", "Szimpla Kert worth it", "is the Budapest Card worth it". People want a trusted human's judgment, and a waiter's view is a differentiator.
  2. Comparisons: "Széchenyi vs Gellért vs Rudas", "Budapest vs Prague", "Budapest vs Vienna Christmas markets".
  3. Specific itineraries with times, transit lines and prices ("Esztergom day trip by train", "3 days in Budapest in December").
  4. Local-insider and anti-tourist-trap content ("where locals eat on Váci utca, i.e. don't", "restaurants with a service charge on the bill").
  5. Current-year/seasonal pages (Christmas market 2026 dates, NYE 2026), where freshness matters and AIOs are less confident.
  6. Hyper-practical logistics (100E bus from the airport, ticket validation fines, tipping when "szervízdíj" is already on the bill). AIOs will answer the basics, but a page with exact steps, photos of the ticket machine and real prices still gets clicked and cited.
- Getting cited in AIOs (Seer: about 120% more clicks per impression) rewards clear, extractable answers. Each practical post should open with a 2-3 sentence direct answer, then add the first-hand detail.
- Expect Google traffic per ranking to be well below what older (pre-2024) blogging guides promise. Diversify early: Reddit/forums, Pinterest (strong for travel), Bing/Copilot (IndexNow), and an email list from the guest book and Ask Arpi.

### Gaps
- No public study isolates AIO CTR effects for travel queries specifically, and none for Budapest.
- The primary Pew and Seer reports were not fetched; figures come via secondary summaries.
- No reliable data was found on whether AI Mode cites small blogs more or less than AIOs do.

---

## 3. Budapest topics/keywords realistically winnable for a new zero-backlink site, with 20-40 post ideas

### Takeaway
New sites rarely reach the top 10 quickly (Ahrefs: about 5.7% of new pages reach the top 10 within a year, mostly after 2-6 months, and high-DR sites do much better). Pick queries where the SERP shows forums, thin listicles or old pages, KD is near 0, and Arpi's first-hand angle is an obvious advantage. The live keyword data below shows many Budapest queries at KD 0-10 with 100-6,600 US searches/month. Strong targets are ruin bars, Christmas market, things to do, best restaurants, Budapest food, currency, is Budapest safe, Budapest vs Prague, the month-by-month pages, Rudas, Fisherman's Bastion, Shoes on the Danube, New York Café, pálinka and Unicum.

### Cited Findings
- Ahrefs (about 2M pages): only about 5.7% of studied pages ranked top 10 for at least one keyword within a year. Most of those got there in about 61-182 days, and pages on high-DR domains performed significantly better. In a separate 1.3M-keyword study, 72.9% of top-10 pages were 3+ years old (vs 59% in 2017), and only 13.7% were under 1 year old. — [Ahrefs, How long does it take to rank](https://ahrefs.com/blog/de/how-long-does-it-take-to-rank/) (via summaries); [Ahrefs, How to rank without links](https://ahrefs.com/blog/how-to-rank-in-google-without-links)
- Keyword metrics below are from the OpenSEO / DataForSEO keyword API (Google Ads-derived volume, US, English, pulled 2026-10-26 for the site's OpenSEO project "Budapest Hungry"). KD is a 0-100 difficulty estimate. Treat volumes as order-of-magnitude, since Google Ads groups close variants. — [OpenSEO project keywords](https://app.openseo.so/p/b6d3f015-a8c6-4c8c-8011-71e39fb24464/keywords)

| Keyword (US) | Vol/mo | KD | Note |
|---|---|---|---|
| goulash | 201,000 | 35 | recipe-dominated, AIO-heavy |
| chicken paprikash | 40,500 | 23 | recipe intent |
| chimney cake | 18,100 | 3 | definitional |
| szechenyi baths | 14,800 | 25 | official site + big guides |
| hungarian food | 12,100 | 7 | good hub target |
| paprikash | 12,100 | 21 | recipe |
| fisherman's bastion | 8,100 | 9 | "is it worth paying" angle |
| budapest ruin bars / ruin bars | 6,600 / 6,600 | 0 / 5 | top target |
| great market hall budapest / central market hall budapest | 6,600 | 1-7 | top target |
| things to do in budapest | 6,600 | 0 (CPC/competition high) | KD 0 but SERP crowded by big brands |
| langos | 6,600 | 0 | |
| new york cafe budapest | 5,400 | 7 | "tourist trap?" angle |
| shoes on the danube | 5,400 | 1 | |
| szimpla kert | 4,400 | 26 | |
| house of terror | 4,400 | 16 | |
| palinka | 4,400 | 0 | existing post |
| tokaji wine | 4,400 | 6 | existing post |
| budapest thermal baths | 4,400 | 14 | hub target |
| budapest currency | 2,900 | 0 | practical |
| gellert baths | 2,900 | 43 | hard |
| kurtoskalacs | 2,900 | 5 | |
| budapest christmas market | 2,400 | 0 | top seasonal target |
| best restaurants in budapest | 2,400 | 0 | |
| rudas baths | 2,400 | 0 | |
| unicum | 2,400 | 2 | existing post |
| budapest food | 1,900 | 0 | |
| is budapest safe | 1,900 | 1 | |
| budapest restaurants | 1,600 | 0 | |
| parliament tour budapest | 1,600 | 25 | |
| budapest nightlife | 1,300 | 0 | |
| danube river cruise budapest | 1,300 | 14 | |
| traditional hungarian food | 1,000 | 2 | |
| budapest weather december | 880 | 0 | |
| where to stay in budapest | 880 | 0 | affiliate-heavy SERP |
| chimney cake budapest | 880 | 2 | |
| budapest metro | 720 | 10 | |
| budapest vs prague | 720 | 0 | |
| budapest michelin restaurants | 720 | 1 | |
| budapest in winter | 590 | 0 | |
| budapest in december | 480 | 0 | |
| budapest in november | 320 | 0 | |
| budapest airport to city center | 320 | 0 | |
| budapest christmas market 2026 | 320 | 0 | |
| budapest itinerary 3 days | 320 | 0 | |
| is budapest worth visiting | 320 | 0 | |
| budapest vs vienna | 320 | 0 | |
| budapest food tour | 320 | 0 | high CPC = commercial competition |
| budapest new years eve | 260 | 8 | |
| budapest district 7 | 260 | 0 | |
| budapest in january / march / october | 210 each | 0 | month series |
| tipping in budapest | 170 | 0 | + "do you tip in budapest" 70 |
| where to eat in budapest | 170 | 0 | |
| best goulash in budapest | 140 | 0 | |
| budapest street food | 140 | 0 | |
| budapest coffee shops | 140 | 0 | |
| budapest in summer | 140 | 0 | |
| 100e bus budapest | 110 | 6 | |
| budapest public transport tickets | 110 | 16 | |
| budapest 4 day itinerary | 110 | 0 | |
| budapest breakfast | 110 | 0 | |
| best langos in budapest | 90 | 0 | |
| budapest christmas market dates | 90 | 8 | |
| budapest travel card | 90 | 24 | |
| budapest vegetarian restaurants | 70 | 0 | |
| budapest airport to city | 70 | 0 | |
| cheap eats budapest / budapest hidden gems / szentendre day trip | 50 each | 0 | |
| budapest airport taxi / budapest goulash restaurant / budapest travel tips / budapest weekend | 40 each | 0 | |
| budapest 72 hour travel card / lake balaton day trip | 40 / 30 | 0 | |
| esztergom day trip from budapest, budapest scams, budapest tourist traps, szechenyi or gellert, first time in budapest, danube bend day trip | ~10 each | n/a | very low but highly targeted |

### Concrete post ideas (36), prioritized; "existing" means there's a post to expand or retitle

**A. Pillar/hub pages (build first; link everything into them)**
1. **"Hungarian food: what to eat in Budapest (from a waiter)"**, targeting hungarian food 12.1k (KD 7), traditional hungarian food 1k, budapest food 1.9k. Expand the existing "Fooooood" into a hub with a section for each dish (goulash, paprikash, lángos, kürtőskalács, túró rudi, főzelék) and "where I'd send you" for each. This is how to reach the goulash/chimney cake demand without fighting recipe sites.
2. **"Budapest thermal baths: Széchenyi vs Gellért vs Rudas, honest comparison"**, targeting budapest thermal baths 4.4k, rudas baths 2.4k (KD 0), szechenyi or gellert. Expand the existing "thermal bath at opening time" and make it the hub.
3. **"Budapest ruin bars: which ones are worth it (and when to go)"**, targeting budapest ruin bars 6.6k (KD 0), ruin bars 6.6k (KD 5), budapest nightlife 1.3k (KD 0), szimpla kert 4.4k. This is the single best ratio of volume to difficulty in the data.
4. **"Budapest Christmas market 2026: honest guide (dates, prices, what's a rip-off)"**, targeting budapest christmas market 2.4k (KD 0), budapest christmas market 2026 320, christmas market dates 90. Retitle and expand the existing "honest take". Publish or refresh by early November each year; the market opens mid-November.
5. **"Budapest practical guide: money, tipping, transport, safety"** as a hub linking to items 6-11.

**B. Practical logistics (low KD, high trust, AIO-resistant if specific)**
6. **"Budapest airport to the city: 100E bus vs taxi vs Bolt (prices 2026)"**, targeting airport to city center 320, 100e bus 110, airport taxi 40. Expand from the existing "Taxis, apps and public transit".
7. **"Budapest public transport tickets: which pass to buy and how not to get fined"**, targeting public transport tickets 110, travel card 90, 72-hour card 40, metro 720.
8. **"Tipping in Budapest: a waiter explains (service charge, 'keep the change', cards)"**, targeting tipping in budapest 170 plus do you tip 70. A waiter-author is a unique E-E-A-T angle here, and it should be the flagship post.
9. **"Budapest currency: forint, euros, ATMs and the exchange booths to avoid"**, targeting budapest currency 2.9k (KD 0).
10. **"Is Budapest safe? Honest answer from a local (and the actual scams)"**, targeting is budapest safe 1.9k (KD 1) plus scams and tourist traps. Cover the menu-price/"girls invite you for a drink" bar scam, exchange booths, and taxis.
11. **"Drinking water in Budapest"** (existing). Retitle to "Can you drink tap water in Budapest?".

**C. "Is it worth it" and tourist-trap verdicts (opinion = clicks)**
12. **"Is the Budapest Card worth it? I did the math"**, targeting budapest card worth it.
13. **"Fisherman's Bastion: is it worth paying for the upper terrace?"**, targeting fisherman's bastion 8.1k (KD 9).
14. **"New York Café Budapest: worth the queue or tourist trap?"**, targeting new york cafe budapest 5.4k (KD 7).
15. **"Great Market Hall: what to buy, what to skip, where locals shop instead"**, targeting great/central market hall 6.6k (KD 1-7).
16. **"Danube river cruise: which one is worth it (and the free alternative: tram 2 / ferry D11-D12)"**, targeting danube river cruise budapest 1.3k.
17. **"Is Budapest worth visiting?"** (320, KD 0), answered honestly with "who will love it and who won't".
18. **"Váci utca and other tourist-trap restaurants: how to spot them"**, targeting budapest tourist traps plus where to eat in budapest 170.

**D. Where to eat (local-insider, Arpi's core strength)**
19. **"Best goulash in Budapest (where locals actually eat it)"**, targeting best goulash in budapest 140 and the goulash head term.
20. **"Best lángos in Budapest"** (90) and **"Where to get a real chimney cake in Budapest"** (chimney cake budapest 880, KD 2).
21. **"Budapest restaurants a waiter actually recommends (by budget)"**, targeting best restaurants 2.4k (KD 0), budapest restaurants 1.6k.
22. **"Cheap eats in Budapest: önkiszolgáló/kifőzde lunch spots"**, targeting cheap eats 50 and street food 140.
23. **"Budapest Michelin restaurants: what a waiter thinks of them"** (720, KD 1). This is an insider angle tied to Arpi's hospitality and Nobu background.
24. **"Breakfast and coffee in Budapest"**, targeting budapest breakfast 110 and coffee shops 140.
25. **"Vegetarian in Budapest: what you can actually eat"** (70).
26. **"Pálinka and Unicum"** (existing; palinka 4.4k KD 0, unicum 2.4k KD 2). Retitle to "Pálinka and Unicum: what they are and where to drink them in Budapest".
27. **"Tokaji and Hungarian wine bars in Budapest"** (existing; tokaji wine 4.4k KD 6).

**E. Seasonal and month pages (low KD, recurring demand)**
28. **"Budapest in December: weather, Christmas markets, what's open"**, targeting in december 480, weather december 880.
29. **"Budapest in winter"** (590), plus a month series for November (320), January, March and October (210 each) and summer (140). Each needs real local detail (what's closed, bath crowds, what to wear). The existing "Not too cold please" can feed the winter page.
30. **"Budapest New Year's Eve 2026: where to go, what to avoid"** (260, KD 8).

**F. Itineraries and comparisons**
31. **"3 days in Budapest: a local's itinerary"** (320) with 2-day (170) and 4-day (110) variants as sections, or as separate posts if each gets real distinct content.
32. **"Budapest vs Prague: honest comparison from someone who's been to 37 countries"** (720, KD 0), and **"Budapest vs Vienna"** (320, KD 0).
33. **"Esztergom day trip by train"** (existing "Leave Budapest") plus **"Szentendre"** (50) and **"Danube Bend: Visegrád + Esztergom"**. Low volume but zero competition, and the "leave Budapest" post already has 12 photos.

**G. Sights with an honest angle**
34. **"Shoes on the Danube: what to know before you go"** (5.4k, KD 1). Respectful, with history context; can link the existing "Hungarian history in two minutes".
35. **"House of Terror: is it worth it, and how to handle it emotionally"** (4.4k, KD 16).
36. **"Where to stay in Budapest: districts explained by a local"** (880, KD 0, but an affiliate-heavy SERP) plus **"District 7 / Jewish Quarter guide"** (260).

**H. Ask Arpi as a long-tail engine**
- Each real reader question that recurs can become a short standalone answer page (for example, "Do I need cash in Budapest?", "Are Budapest baths OK for tattoos/kids?"), cross-linked to the relevant hub. Only do this when the answer is substantive, to avoid creating thin pages.

### Inferences
- Priority order by (volume × winnability × Arpi's advantage): ruin bars hub, then Christmas market 2026 (time-critical: it's late October 2026), then the tipping/waiter post, then the Hungarian food hub, then the baths comparison, then Great Market Hall, then currency, then is Budapest safe, then Budapest vs Prague, then the month pages.
- KD 0 doesn't mean easy when CPC and competition are high (things to do in budapest, itineraries, food tours). Those SERPs are crowded with Tripadvisor, GetYourGuide, Lonely Planet and long-established blogs. Target them later, once the site has some authority.
- Existing visitor posts are the fastest wins. Retitle them with the target query, expand them to answer the full intent, and add photos, without changing their URLs. The slugs are acceptable; changing a URL would need a 301.

### Gaps
- No SERP-level check was run on which current top-10 results are forums or thin pages (this can be done with OpenSEO `get_serp_results` at a small credit cost).
- UK/Australia volumes were not pulled (only US). UK volumes for Budapest Christmas market and city breaks are likely proportionally higher, since UK visitors take short-haul trips, but that is unverified.
- Volumes for "budapest scams" and "tourist traps" show about 10/month, likely because demand sits in variants ("budapest taxi scam", "budapest bar scam") not tested here.

---

## 4. On-page and technical SEO checklist for a static site in 2026

### Takeaway
For a static Netlify site, the technical basics are mostly solved by default: fast HTML, a canonical, a sitemap and robots.txt. The leverage is now in (a) keyword-bearing titles, H1s and descriptions (currently the site's biggest weakness), (b) hub-and-spoke internal linking, (c) original photos with alt text, (d) author/Person and WebSite schema that tie the content to Arpi, and (e) Search Console and Bing Webmaster Tools with sitemap and IndexNow. FAQ rich results no longer exist (fully deprecated May 2026), and restaurant review stars are mostly out of reach.

### Cited Findings
**Structured data**
- FAQ rich results were limited to government and health sites from Aug 2023, and fully deprecated for all sites as of May 7, 2026. The Search Console FAQ report and Rich Results Test support are being removed (June 2026, API by about Aug 2026). HowTo rich results were removed in 2023. Unused FAQPage markup causes no harm. — [Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/); [Search Engine Land (2023)](https://searchengineland.com/?p=430452); [exchange4media](https://www.exchange4media.com/digital-news/google-deprecates-faq-content-feature-154581.html)
- Article/BlogPosting markup has no required properties. Google recommends `author` with `@type` Person and `url` (or `sameAs`) pointing to an about/bio page or social profile, one `author` entry per author, and only the name in `author.name`. If the author URL is an internal profile page, mark it up with ProfilePage structured data. — [Google Search Central, Article structured data](https://developers.google.com/search/docs/data-types/article); [Search Engine Land on author best practices](https://searchengineland.com/google-help-document-adds-author-markup-best-practices-385533)
- Schema doesn't raise rankings on its own. — [rankai author schema guide](https://rankai.ai/blog/your-complete-guide-to-author-schema-and-its-seo-impact) (third-party; consistent with Google saying structured data enables rich results, not rankings)
- Review snippets: since Sept 2019, Google excludes "self-serving" reviews for LocalBusiness/Organization. Review stars for local businesses mainly come from third-party review sites. A blog reviewing someone else's restaurant is technically a third-party review, but no source confirmed that blog Restaurant reviews still get stars in 2026. — [Search Engine Roundtable 2019](https://www.seroundtable.com/google-updates-rules-reviews-rich-results-28232.html); [Whitespark](https://whitespark.ca/blog/local-businesses-say-goodbye-to-review-snippets-in-google/)
- Site names: Google picks the site name shown in results partly from `WebSite` structured data (`name`, `alternateName`) on the homepage. — [Google Search Central, Site names](https://developers.google.com/search/docs/appearance/site-names) [not re-fetched this session]

**Core Web Vitals**
- Good thresholds at the 75th percentile of real-user (CrUX) data: LCP ≤ 2.5 s, INP ≤ 200 ms (INP replaced FID in March 2024), CLS ≤ 0.1. They act as a ranking signal, but most sources describe it as a tie-breaker. In the 2025 Web Almanac, only 48% of mobile sites pass all three. — [Sentry docs](https://docs.sentry.io/product/insights/web-vitals/web-vitals-concepts); [vitalsentinel thresholds](https://docs.vitalsentinel.com/others/performance-thresholds); [primestack 2026](https://primestack.it.com/blog/future-web-performance-2026) (vendor sources; consistent with web.dev)

**Indexing and Bing**
- IndexNow is a URL-change notification protocol (Bing, Yandex, Seznam, Naver, etc.). It speeds discovery, doesn't change ranking, and doesn't guarantee indexing. Google does not participate. It works by placing a key text file at the site root and pinging the API. Microsoft says Bing and Copilot share the same crawl/index foundation. Whether ChatGPT search depends on Bing is contested; OpenAI doesn't confirm it. — [eseospace](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/); [stackmatix IndexNow guide](https://www.stackmatix.com/blog/indexnow-guide); [martech.zone](https://martech.zone/chatgpt-visibility-and-bing-indexnow/)
- Google ignores `<priority>` and `<changefreq>` in sitemaps, uses `<lastmod>` when it's consistently accurate, and retired the sitemap "ping" endpoint (end of 2023). Submit via Search Console or the robots.txt `Sitemap:` line. — [Google Search Central blog, June 2023 sitemaps lastmod/ping](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping) [not re-fetched this session; 2023]
- Duplicate domains: Google consolidates duplicates using signals such as rel=canonical (a hint), 301 redirects (a strong signal) and sitemap inclusion. — [Google Search Central, Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) [not re-fetched this session]
- Title links are generated mainly from `<title>`, but Google may rewrite titles that are vague, boilerplate or don't describe the page. Meta descriptions are used for snippets when they describe the page better than on-page text. — [Google, Title links](https://developers.google.com/search/docs/appearance/title-link); [Google, Snippets](https://developers.google.com/search/docs/appearance/snippet) [not re-fetched this session]
- Images: use descriptive filenames and alt text, put images near relevant text, use supported formats (WebP is supported), and consider an image sitemap. Lazy loading is fine if implemented with native `loading="lazy"`, but don't lazy-load the LCP/hero image. — [Google, Image SEO best practices](https://developers.google.com/search/docs/appearance/google-images) [not re-fetched this session]

### Checklist (applied to budapesthungry.com, highest leverage first)
1. **Titles.** Put the query first and keep the voice second: "Tipping in Budapest: A Waiter's Honest Guide (2026) · Arpi". Change "Fooooood" to "What to Eat in Budapest: Hungarian Food a Local Waiter Recommends". Change "The thermal bath at opening time" to "Széchenyi Baths Tips: Go at Opening Time (Local's Guide)". Keep titles to about 50-60 characters, and include "Budapest" in every visitor post. Keep the voice in the H1/subtitle if preferred, but the `<title>` must name the topic.
2. **Meta descriptions.** Write 140-160 characters that contain the query and a reason to click from Arpi's angle, e.g. "A Budapest waiter on when to tip, how much, and the 'service charge' trick on your bill." Keep the witty one-liner as the on-page dek.
3. **H1 and first paragraph.** Make the H1 match the title intent. Open with a 2-3 sentence direct answer (for AIO citation and snippets), then the story.
4. **Hubs and internal links.** Create 4-5 hub pages (Food, Baths, Nightlife/Ruin bars, Practical/First-timer, Seasonal/Christmas). Each spoke links up to its hub and across to 2-4 siblings with descriptive anchor text, not "click here". Show a "Start here" block on the homepage, and link visitor posts from the life-story chapters where relevant (e.g., "Learning hospitality by doing" to the tipping post).
5. **Author and E-E-A-T.** Use one About/"Who is Arpi" page (job, years as a waiter, Nobu, 37 countries, photo) marked up as ProfilePage plus Person, with `sameAs` links to Instagram etc. Every BlogPosting gets `author: {"@type":"Person","name":"Arpi","url":".../about.html"}`, `datePublished`, a truthful `dateModified`, and `image`. Add a visible byline with "last updated" on each post.
6. **WebSite schema** on the homepage with `name: "Budapest Hungry"` and `alternateName`, to control the site name in results.
7. **Duplicate domain.** The .hu domain serves identical pages with canonicals pointing to .com. That works, but a domain-level **301 redirect** from the .hu domain to budapesthungry.com in Netlify (`[[redirects]] from = "https://bullshitsunami.hu/*" to = "https://budapesthungry.com/:splat" status = 301 force = true`) is the stronger signal and avoids splitting links. If the .hu brand must render separately, keep the canonicals and don't put .hu URLs in any sitemap.
8. **Images.** Use original photos only, since stock photos dilute first-hand signals. Aim for 3-8 per visitor post (the dish, the receipt showing the service charge, the ticket machine, the bath at 6 a.m.). Use WebP, around 1200-1600 px max, explicit `width`/`height` (CLS), `loading="lazy"` except the first image, descriptive alt text ("Lángos with sour cream and cheese at a stall in the Great Market Hall"), and descriptive filenames. Add `image` to BlogPosting JSON-LD.
9. **Schema worth adding.** Use BlogPosting/Article with full author (keep), BreadcrumbList (keep), WebSite, ProfilePage plus Person, and optionally ItemList for "best X" posts. FAQPage brings no rich result after May 2026, so only use it if the Q&A is visible, and don't expect a SERP feature. Use Event schema only for official event pages, not for blog coverage. Skip Restaurant/LocalBusiness and Review markup unless writing a genuine single-restaurant review; the payoff is uncertain.
10. **Core Web Vitals.** A static HTML site should pass easily. Verify in Search Console's CWV report and PageSpeed Insights once CrUX data exists, and watch out for web fonts, large unsized images and third-party embeds (guest book, maps).
11. **Search Console.** Verify a Domain property (DNS TXT) for budapesthungry.com and also verify the .hu domain to monitor it. Submit sitemap.xml. Use URL Inspection's "Request indexing" for new and refreshed posts. Check the Pages report for "Duplicate, Google chose different canonical". After 4-8 weeks, mine the Performance report for queries at positions 8-30 and rewrite to target them ("striking distance").
12. **Bing Webmaster Tools.** Import from GSC, submit the sitemap, and add IndexNow: put a key file in blog-copy/ and have build.py (or a Netlify deploy hook/function) POST changed URLs to api.indexnow.org after each deploy. OpenSEO also has a `submit_indexnow_urls` tool.
13. **Sitemap hygiene.** Accurate `<lastmod>` only when content really changed, no priority/changefreq needed, and exclude noindex/utility pages (inbox, tables-qr are already disallowed in robots.txt; check they aren't in the sitemap).
14. **Mobile.** Keep a 16px+ body font, tap targets, and no intrusive interstitials (Google page-experience guidance).
15. **Avoid.** Don't use AI-generated filler, mass-produce near-duplicate "best X" pages, bump the year in titles without real updates, or publish thin Ask Arpi pages. These match Google's listed search-first warning signs and the scaled-content-abuse spam policy.

### Inferences
- Because pages already have canonicals, JSON-LD and a sitemap, the biggest technical-ish problem is relevance labeling. Titles and descriptions currently give Google almost no query-matching text. This is likely the single highest-ROI fix and costs nothing.
- Some third-party guides still push FAQ schema "for AI visibility". There is no Google evidence for that, and Google has now removed the feature.

### Gaps
- Google's current Image SEO, title-link, site-names and canonicalization pages could not be fetched this session; their content is cited from prior knowledge.
- No source confirmed whether ProfilePage markup measurably affects rankings or AIO citation.

---

## 5. Ideal post length/format, publishing cadence, refreshing old posts

### Takeaway
Google has no preferred word count, so length should follow intent. In practice, the posts that win competitive travel SERPs fully answer the task (logistics, prices, times, maps, photos, "who should skip it"), which usually takes about 1,200-2,500 words for hubs and comparisons and about 700-1,500 for single-question practical posts. Arpi's current 300-750-word posts are likely too thin to compete for anything beyond very long-tail queries. Consistency (for example 1-2 substantial posts a week for the first 6 months) and annual refreshes of seasonal and price-bearing posts matter more than raw volume. Updates must be substantive, not date bumps.

### Cited Findings
- Google: "no preferred word count". Writing to a length is a sign of search-first content. — [Google, Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content); [Search Engine Journal summary](https://www.searchenginejournal.com/google-helpful-content-update/461156/)
- Changing a page's date to look fresh without substantial changes is listed by Google as a search-first warning sign. — [Google, Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) [not re-fetched this session; search snippet did not surface this line]
- Top-10 pages skew old (72.9% are 3+ years old), which suggests established pages keep their positions through updates rather than being replaced by new ones. — [Ahrefs](https://ahrefs.com/blog/de/how-long-does-it-take-to-rank/) (via summaries)
- HCU recoveries were associated with pruning thin pages and consolidating content, not with adding more. — [thestacc](https://thestacc.com/blog/helpful-content-update-recovery/); [DiscoverCars](https://www.discovercars.com/blog/june-25-google-update)
- AIO responses run up to about 500 words, and question keywords are about a third of AIO triggers. Pages that front-load a concise answer are easier to cite. — [Semrush AIO research](https://www.semrush.com/blog/semrush-ai-overview-research/)

### Inferences (recommended format for budapesthungry.com)
- **Template for practical posts:** (1) a 2-3 sentence direct answer with the current price/date; (2) "Arpi's honest take" (the opinion, the waiter's view); (3) step-by-step logistics (how to get there, opening hours, cost in HUF and EUR, booking); (4) mistakes and tourist traps; (5) "where I'd go instead" or local alternatives; (6) a short Q&A block of 3-5 real reader questions from Ask Arpi, visible as plain HTML; (7) links to the hub and siblings; (8) a byline plus "last checked: Month YYYY".
- **Length targets:** hubs and comparisons about 1,500-2,500 words; single-question practical posts about 700-1,500; life-story chapters any length (they serve E-E-A-T and brand, not search).
- **Cadence:** the Christmas market post is time-critical right now (late Oct 2026; the markets usually open mid-November), so refresh or publish it this week and request indexing. Then ship hubs one at a time, 1-2 substantial posts a week, rather than many thin ones. After 8-12 weeks, use GSC striking-distance queries to choose updates.
- **Refresh rules:** update seasonal posts (Christmas, NYE, month pages) each year 6-8 weeks before the season. Re-check prices and transport (BKK ticket prices, the 100E fare, bath prices) at least yearly. Update `dateModified` only on real changes. Keep the same URL year to year (e.g., `/posts/budapest-christmas-market.html`, not `-2026`) and put the year in the title/H1 only.
- **Consolidation:** where two existing posts overlap (for example "Taxis, apps and public transit" and a future airport post), either merge them or clearly split intent and cross-link, so they don't compete with each other.

### Gaps
- No 2025-2026 study correlating word count with travel rankings was found. Length guidance is inferred from Google's statements and SERP norms, not measured.
- No data was found on the optimal publishing cadence for new blogs post-2024. Cadence advice is practitioner consensus, not evidence.
