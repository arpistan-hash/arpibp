# AI search / GEO / AEO for budapesthungry.com: getting cited by ChatGPT, Perplexity, Google AI Overviews/AI Mode, Copilot and Claude (2025-2026)

Research date: 2026-10-26. Method note: several official documentation hosts (developers.openai.com, developers.google.com, docs.perplexity.ai, arxiv.org, searchengineland.com) could not be fetched from this environment (DNS failure). For those, the findings below rely on search-engine snippets and summaries of the pages, not on a full read of the page. Treat exact quotes from those sources as "reported" and check them before using them verbatim. The Anthropic help-center page was fetched and read in full.

Site context I checked in the repo: `blog-copy/robots.txt` currently has `User-agent: *` with only `/inbox.html` and `/tables-qr.html` disallowed, so all AI crawlers are already allowed. `blog-copy/sitemap.xml` has `<loc>` entries but no `<lastmod>`. There is no `llms.txt`. `netlify.toml` says the second domain serves the same site "(no redirect)".

## 1. Which crawlers to allow in robots.txt, what each does, and whether blocking training bots hurts citations

### Takeaway
Every major vendor now splits its crawlers into a training bot, a search/index bot and a user-triggered fetcher. Being cited depends on the search and user bots (and, for Google, on plain Googlebot). Blocking only the training bots (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended) does not remove a site from AI search answers, according to the vendors' own docs. For a small blog that wants exposure, the simplest choice is to allow everything, which the current robots.txt already does.

### Cited Findings
- **OpenAI**
  - **OAI-SearchBot** is the bot that governs ChatGPT search. Sites opted out of it "will not be shown in ChatGPT search answers, though can still appear as navigational links." — [OpenAI, Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots) (reported via search snippet)
  - **GPTBot** is the training crawler. Blocking it keeps content out of model training and is separate from search, so a site that blocks GPTBot but allows OAI-SearchBot can still appear in ChatGPT search. — [OpenAI bots docs](https://developers.openai.com/api/docs/bots); [OpenAI GPTBot docs](https://developers.openai.com/docs/gptbot); consistent with [ThePlusAddons guide](https://theplusaddons.com/blog/chatgpt-user-openai-crawlers-wordpress/)
  - **ChatGPT-User** makes fetches that users trigger. It "is not used to determine whether content may appear in Search," and because those fetches are user-initiated, robots.txt rules may not apply. — [OpenAI bots docs](https://developers.openai.com/api/docs/bots) (reported)
- **Anthropic** (official help page, read in full) — [Anthropic/Claude Help Center](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
  - **ClaudeBot** collects content that may be used for training. Blocking it excludes the site's future content from training datasets.
  - **Claude-User** fetches pages when a Claude user's question needs them. "Disabling Claude-User on your site prevents our system from retrieving your content in response to a user query," which may reduce visibility.
  - **Claude-SearchBot** indexes content to improve search results. "Disabling Claude-SearchBot on your site prevents our system from indexing your content for search optimization."
  - The page also says that blocking Anthropic's IP addresses is not a reliable opt-out, because the bots then cannot read robots.txt.
- **Google**
  - **Google-Extended** controls training of future Gemini models and some grounding in Gemini apps. It does not control Google Search inclusion or AI Overviews, which use regular Googlebot. Blocking Googlebot or using `nosnippet` is what removes a page from AI Overviews. — [Hyperleap crawler list](https://hyperleap.ai/blog/top-llm-crawlers-and-what-they-do-2026); [Anagram AI crawler list 2026](https://www.anagram.ai/blog/ai-crawler-user-agent-list-2026-14-bots-and-robotstxt-tokens-to-know); [PPC Land, Explaining AI Overviews](https://ppc.land/explaining-ai-overviews/) (secondary sources)
  - To be eligible for AI Overviews or AI Mode, a page only needs to be indexed and eligible to show in Search with a snippet. Google lists no additional requirements. — [Google Search Central, AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (reported through secondary sources such as [LLM Pulse](https://llmpulse.ai/blog/optimize-for-google-ai-overviews/); I could not fetch the page directly)
- **Apple:** Applebot handles search and Siri/Spotlight answers. Applebot-Extended is the training opt-out, and blocking it does not remove the site from search. — [Hyperleap](https://hyperleap.ai/blog/top-llm-crawlers-and-what-they-do-2026) (secondary)
- **Perplexity:** It documents PerplexityBot (search indexing) and Perplexity-User (user-triggered fetches), and no separate training crawler. User-triggered fetchers generally do not follow robots.txt. — [Hyperleap](https://hyperleap.ai/blog/top-llm-crawlers-and-what-they-do-2026); [Anagram](https://www.anagram.ai/blog/ai-crawler-user-agent-list-2026-14-bots-and-robotstxt-tokens-to-know) (secondary; Perplexity's own docs were not reachable)
- **Microsoft:** Bing's webmaster guidelines say "Bing and Copilot search experiences rely on the same core crawling, indexing, and ranking foundation as traditional search," so Bingbot is the bot that matters for Copilot. — quoted in [eSEOspace](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/) (secondary)

### Inferences
- The current `User-agent: *` file already allows every bot listed above. Nothing has to be added for crawling to work. Optionally, add explicit `User-agent` groups for OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Bingbot, Googlebot and Applebot with `Allow: /`. This documents the intent and protects against a future wildcard `Disallow` blocking them by accident. It is not required.
- Should training bots be blocked? It is a values question, not a visibility one. The docs say blocking them does not stop citations. There is a weak, unproven argument for allowing them: a model that has seen "budapesthungry.com / Arpi the Budapest waiter" during training may recall the brand, which feeds the brand-mention effect described in section 3. I found no study that measures this.
- Netlify bot protection or firewall rules should not challenge these user agents. I did not check the Netlify settings.

### Gaps
- I could not read OpenAI's, Google's and Perplexity's official pages in full from this environment, so the exact current wording is not verified here.
- I found no study that quantifies whether blocking training bots changes citation rates in practice.

## 2. Does llms.txt matter in practice?

### Takeaway
Not in any measurable way so far. Server-log studies show AI crawlers almost never request llms.txt, a 300k-domain study found no link with citations, and Google says it ignores the file. It is cheap to add, but it is not a priority, and claims that it is "required for AI visibility" are hype.

### Cited Findings
- **Ahrefs server-log study** (137,000 domains, published June 2026): 97% of llms.txt files received zero requests in May 2026. AI retrieval bots made up only 1.1% of requests to llms.txt files, and ClaudeBot accounted for 0.80%. — [PPC Land summary](https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/)
- **Adoption:** Originality.ai counted llms.txt files growing about 8.8x, from 4,088 in June 2025 to 36,120 in May 2026, while evidence that AI systems read them "remains close to zero." — [PPC Land](https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/)
- **SE Ranking** (about 300,000 domains, November 2025): 10.13% had an llms.txt file, and there was no relationship between having one and how often the domain was cited in LLM answers. — reported in [ThriveStack AEO fact-check](https://www.thrivestack.ai/citedby/aeo-geo-myths/crawlability-technical-signals/does-llms-txt-help-ai-search-visibility-ai-crawler-visibility) (secondary)
- **Otterly.AI** 90-day test on one site: 84 requests to llms.txt out of more than 62,100 AI bot visits. **Limy** analysis of 515 million bot events: the file was "statistically negligible" for the bots that drive citations. — [Limy llms.txt 2026 guide](https://limy.ai/blog/llms.txt-in-2026-the-full-guide); [Optimizely, Does llms.txt work?](https://www.optimizely.com/field-notes/articles/does-llms-txt-work/) (vendor sources)
- **Google:** It ignores llms.txt, and John Mueller has compared it to the discredited keywords meta tag. No major LLM provider has publicly committed to using llms.txt as a ranking or retrieval signal. — [Optimizely](https://www.optimizely.com/field-notes/articles/does-llms-txt-work/); [Cliczeo](https://cliczeo.com/blog/does-llms-txt-help-ai-overviews)

### Inferences
- For a static site, a short llms.txt (site description, author, links to the best posts and the Ask Arpi page) takes about 10 minutes and has no downside. Present it as optional housekeeping, not a growth lever.
- Agentic browsers and coding agents may use llms.txt more in the future. That is speculation.

### Gaps
- Most of the evidence comes from SEO vendors. There is no peer-reviewed study.

## 3. Which content features correlate with being cited

### Takeaway
The strongest measured correlates are off-site: brand mentions across the web, plus presence on Reddit, YouTube, Wikipedia and review platforms. They outweigh any on-page formatting. On the page, the evidence (GEO paper, freshness study) supports adding concrete statistics, quotations and cited sources, and keeping content visibly fresh. For travel, AI answers lean heavily on review platforms (TripAdvisor, Google reviews) and Reddit. A small blog's realistic route is to be the specific, first-hand, quotable source for narrow questions, and to get mentioned where AI already looks (Reddit threads, TripAdvisor forums, local news, "best Budapest blogs" lists).

### Cited Findings
**GEO paper (Princeton, IIT Delhi and others)**
- Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan and Deshpande, "GEO: Generative Engine Optimization," KDD 2024 (DOI 10.1145/3637528.3671900). It reports that GEO methods can boost visibility in generative-engine responses "by up to 40%." — [arXiv 2311.09735](https://arxiv.org/abs/2311.09735v3); [Princeton listing](https://collaborate.princeton.edu/en/publications/geo-generative-engine-optimization/)
- The best-performing methods were adding citations to sources, adding quotations and adding statistics. They improved visibility by up to 37% on Perplexity.ai in the paper's live test. Efficacy "varies across domains." — [Liner review of the paper](https://liner.com/review/geo-generative-engine-optimization). From my background knowledge of the paper, not re-verified here: keyword stuffing performed poorly, and lower-ranked sources gained the most from these methods. Treat that as unverified.
- Caveat: the experiments rewrote individual source passages in a controlled benchmark. They did not test real websites over time, and generative engines have changed a great deal since 2023.

**Brand mentions and off-site signals**
- **Ahrefs, 75,000 brands, Google AI Overviews:** the strongest correlates of being mentioned were branded web mentions (Spearman 0.664), branded anchors (0.527) and branded search volume (0.392). All are off-site. Backlinks were weaker; a secondary summary gives 0.218. Ahrefs itself calls the correlations "moderate to very weak," and the sample was limited to sites with DR above 40. — [Ahrefs](https://ahrefs.com/blog/ai-overview-brand-correlation/); [Medium summary](https://medium.com/@lorenzoswanson786/ahrefs-studied-75-000-brands-brand-mentions-beat-backlinks-3-to-1-for-ai-visibility-e86ef9f6baba)

**Which domains get cited most**
- **Peec AI** (March 2026, 30 million cited sources across ChatGPT, Google AI Mode, Gemini, Perplexity and AI Overviews, US): Reddit is #1, followed by YouTube, LinkedIn and Wikipedia. Reddit was the #1 or #2 cited domain on every platform tested. — [Peec AI research](https://docs.peec.ai/research/most-cited-domains-in-ai-search)
- **Ahrefs** (June 2025 data): Wikipedia leads across ChatGPT (16.3% of citations), Perplexity (12.5%) and AI Overviews (8.4%). YouTube is strongest on Perplexity and AI Overviews. — [Ahrefs, top 10 most cited domains](https://ahrefs.com/blog/top-10-most-cited-domains-ai-assistants)
- **Semrush** (July to October 2025, 230,000 prompts): Reddit and LinkedIn were in the top 5 on ChatGPT, AI Mode and Perplexity. ChatGPT's Reddit citations fell from about 60% of responses in early August 2025 to about 10% by mid-September. This volatility is a reason not to bet everything on a single channel. — [Semrush](https://www.semrush.com/blog/most-cited-domains-ai/)
- **Profound** (August 2024 to June 2025): Reddit was about 46.7% of Perplexity's top-10 source share. — [Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns) (as summarized in search results)
- Only about 11% of domains are cited by both ChatGPT and Perplexity, so the platforms differ a lot. — [5W Research, State of AI Citations 2026](https://www.5wpr.com/research/state-of-ai-citations-2026/) (PR-agency report)

**Travel-specific findings**
- **Feefo study** (5 query types such as "Best time to visit Hong Kong," 50 destinations, ChatGPT, Gemini and Perplexity): 71% of travel responses drew on first-party customer reviews. Perplexity used reviews the most and ChatGPT the least (about 58%). Feefo sells reviews, so it has a commercial interest in this result. — [CMSWire](https://www.cmswire.com/the-wire/customer-reviews-power-two-thirds-of-ai-travel-recommendations/)
- Tripadvisor partnered with Perplexity (January 2025) to power some travel answers with Tripadvisor hotel, restaurant and Viator data plus review summaries. — [Skift](https://skift.com/2025/01/14/tripadvisor-exec-explains-partnership-with-chatgpt-competitor-perplexity/)
- Fake AI-generated travel guides are spreading, and GPTZero found AI-generated pages surfacing in Perplexity travel searches. That makes verifiable human first-hand content a possible differentiator. — [GPTZero investigation](https://gptzero.me/news/gptzero-perplexity-investigation/)

**Freshness**
- **Ahrefs** (17 million citations, July 2025): URLs cited by AI assistants averaged 1,064 days old, against 1,432 days for organic Google results, so cited content is about 25.7% "fresher." ChatGPT prefers the newest pages, while AI Overviews prefer older ones. Ahrefs warns that low-quality content updated daily "will not have a magic positive effect." — [Ahrefs freshness study](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/)

**Google's own position**
- Google says the same SEO fundamentals apply to AI Overviews and AI Mode. They use "query fan-out" (several related sub-searches), and the two features may show different links. — [Google Search Central, AI features](https://developers.google.com/search/docs/appearance/ai-features) (via snippet)

### Inferences
These are actions for Arpi, derived from the evidence above.
- **Answer-first formatting.** Put the literal question as an H2 (for example "How much is a tip in a Budapest restaurant?"). Answer it in 1-3 sentences with concrete numbers (HUF/EUR prices, opening hours, tram numbers, "as of October 2026"), then give the story. This matches query fan-out and the GEO finding on statistics. It is a reasonable inference, not a separately proven effect.
- **First-hand signals.** "I'm a waiter at X since 2015," a dated visit ("I went on 12 Oct 2026") and a photo taken by Arpi give AI something quotable and distinguish the site from AI-generated guides. This is consistent with Google's E-E-A-T guidance; I did not find a citation study that isolates it.
- **Visible "Last updated" dates.** Put them on each post, and keep `dateModified` in the BlogPosting JSON-LD and `<lastmod>` in the sitemap in sync. The sitemap currently has no `<lastmod>`. Update prices and opening times at least once a year. This is supported by the freshness study, especially for ChatGPT.
- **Author entity.** Add an About/Arpi page with `Person` schema, `sameAs` links to Instagram/Reddit/TripAdvisor profiles, and a consistent name in every post's byline.
- **Off-site mentions probably matter more than any on-page tweak.** Concretely: answer Budapest questions honestly on r/budapest, r/travel and r/solotravel (follow subreddit self-promotion rules; link only when it helps); post on TripAdvisor Budapest forums; pitch Hungarian and English local media (Telex English, Daily News Hungary, We Love Budapest); pitch "best Budapest blogs" roundups; and consider short YouTube or Shorts videos, since YouTube is a top-cited domain. A Wikipedia mention is unrealistic for a personal blog and should not be attempted through self-editing.
- **Duplicate domain.** Serving the same site on budapesthungry.com and bullshittsunami.hu without a redirect, with canonicals possibly missing, can split signals across two URLs. Use one canonical domain (rel=canonical pointing to budapesthungry.com, or a 301 redirect). This is standard SEO hygiene and not AI-specific. The repo's netlify.toml spells the domain "bullshitsunami.hu" while the brief says "bullshittsunami.hu", which is worth checking.

### Gaps
- I found no study specific to Budapest or city guides on which sources AI cites for "where to eat in Budapest"-type prompts. This could be tested directly by running 20-30 Budapest prompts in ChatGPT, Perplexity and AI Mode and logging the cited domains (the repo has OpenSEO AI-visibility tools, which are paid).
- I found no study that isolates the effect of "first-hand experience" or author bios on AI citations.
- I could not verify the GEO paper's per-method percentages against the full text.

## 4. Is Bing indexing (Bing Webmaster Tools, IndexNow) important because ChatGPT uses Bing? Setup for Netlify

### Takeaway
Bing matters for certain for Microsoft Copilot and Bing's AI answers. For ChatGPT, the link to Bing is plausible but not officially confirmed, and studies find little overlap between ChatGPT citations and either Bing's or Google's top 10. Bing Webmaster Tools plus IndexNow is free, takes about 30 minutes on a static site, and now includes an AI Performance report showing Copilot citations, so it is worth doing. Just don't expect it to unlock ChatGPT on its own.

### Cited Findings
- OpenAI does not name Bing as its search provider. Its help page lists Microsoft among the search partners whose privacy statements apply, with no breakdown. No first-party source says IndexNow affects ChatGPT. — [eSEOspace, what's confirmed and what isn't](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/)
- Bing and Copilot share the same crawling, indexing and ranking foundation, according to Microsoft's webmaster guidelines as quoted. — [eSEOspace](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/)
- **Bing Webmaster Tools AI Performance report** (beta, February 2026) covers "Microsoft Copilot," "AI-generated summaries in Bing" and "select partner AI integrations," which are not named. It counts citations, and Microsoft says it "does not represent traffic, clicks, or user engagement." — [eSEOspace](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/); [Previsible](https://previsible.io/seo-ai-news/bing-ai-performance-report/); [EngageWeb](https://www.engageweb.co.uk/blog/bing-webmaster-tools-introduces-ai-performance-report-in-beta)
- **Overlap studies conflict:**
  - Seer Interactive (early SearchGPT era, reported secondhand): citations matched Bing's top results 87% of the time against 56% for Google.
  - Ahrefs (July 2025): ChatGPT in-text citations matched Google's top 10 only 8.0% of the time and Bing's top 10 8.1%.
  - Grow and Convert (200+ fan-out queries): 27% of ChatGPT-cited sources ranked on Google for those queries, 23% on Bing.
  - Sources: [Grow and Convert](https://www.growandconvert.com/ai/fan-out-query-serp-study/); [Ahrefs AI search overlap](https://ahrefs.com/blog/ai-search-overlap/); [Lighthouse Local](https://www.lighthouselocal.ai/blog/does-chatgpt-use-google-or-bing)
  - Some analyses claim ChatGPT draws on Google results through third-party scraping (for example [ACME.BOT](https://acme.bot/blog/chatgpt-web-search-uses-google-search-and-not-bing-search-with-proof/)). OpenAI has not confirmed this, so treat it as unverified.
- **IndexNow** notifies participating engines when URLs are added, changed or deleted. Participants listed as of October 2026: Bing, Yandex, Seznam, Naver, Yep, Internet Archive and Amazon. Google does not participate. — [eSEOspace](https://eseospace.com/blog/bing-webmaster-tools-indexnow-ai-search/); [IndexNow FAQ](https://indexnow.org/faq)
- **IndexNow key setup:** the key is 8-128 characters (a-z, A-Z, 0-9, hyphens), for example from `openssl rand -hex 16`. Host `<key>.txt` at the site root containing only the key. Verify that `https://domain/<key>.txt` returns exactly the key; a 403 usually means a key or host mismatch. — [Trevor Lasn guide](https://trevorlasn.com/blog/how-to-setup-indexnow-for-instant-search-engine-indexing); [IndexNow FAQ](https://indexnow.org/faq); [Yandex key docs](https://yandex.com/support/webmaster/en/indexnow/key)

### Inferences
These are concrete Netlify steps. They are standard, but this exact Netlify workflow is not documented in a single source.
1. Sign up at Bing Webmaster Tools. Use "Import from Google Search Console" if GSC is already verified (the fastest route), or verify with a meta tag in `index.html`, or with the XML file `BingSiteAuth.xml` in `blog-copy/`. Submit `https://budapesthungry.com/sitemap.xml`.
2. Generate an IndexNow key and save it as `blog-copy/<key>.txt`, since `blog-copy` is the publish directory.
3. After each deploy, POST the changed URLs to `https://api.indexnow.org/indexnow` with JSON `{host, key, keyLocation, urlList}`. Options:
   - A small step in `blog-copy/tools/build.py` that diffs the sitemap.
   - A Netlify `deploy-succeeded` event function under `netlify/functions/`.
   - A manual curl after publishing a post.
   - The repo's OpenSEO MCP has a `submit_indexnow_urls` tool.
   I did not find an official Netlify IndexNow plugin.
4. Check the AI Performance report monthly to see whether Copilot cites the site.
5. Bing already reads the sitemap. IndexNow mainly speeds up discovery of new Ask Arpi answers. For a site this size, the gain is faster indexing, not more ranking.

### Gaps
- How much ChatGPT search depends on Bing in 2026 is officially unknown.
- I found no evidence that IndexNow improves AI citations as opposed to indexing speed.

## 5. How big AI referral traffic is compared with Google for travel sites (2025-2026)

### Takeaway
AI referrals are small but growing quickly. They are about 1% of total web traffic overall and under 1% for travel sites. ChatGPT sends about 80-92% of identifiable AI referrals. Google organic still sends far more. A 2026 study puts ChatGPT sessions at about 0.6% of Google organic sessions. Meanwhile, AI Overviews reduce clicks from Google itself. For planning: AI visibility matters for brand exposure and for the future, but Google (plus Reddit and TripAdvisor) will remain the main traffic source for a small Budapest blog in 2026.

### Cited Findings
- **Bain & Company** (Similarweb data, published September 30, 2026): the AI share of visits to hotel and short-term-rental sites quadrupled between July 2025 and July 2026, but every travel category, including OTAs and cruise lines, stayed under 1% of total traffic. The sample was only 3-5 sites per category. On its August 2026 earnings call, Booking Holdings said AI-assistant traffic was "significantly below 1%" of room nights. — [Hospitality Net](https://www.hospitalitynet.org/opinion/4134776/the-ai-guest-is-still-rare)
- **Adido** (31 travel websites): 0.12% of visits came from AI sources, and ChatGPT was 86.4% of identifiable LLM referrals. The date of the data is unclear. — [Adido](https://www.adido-digital.co.uk/blog/are-ai-search-referrals-the-next-big-thing-in-travel)
- **Adobe:** AI referrals to travel sites grew more than 1,700% from July 2024 to February 2025, from a tiny base. — [Adobe](https://business.adobe.com/blog/the-explosive-rise-of-generative-ai-referral-traffic)
- **Similarweb** (top 1,000 sites, June 2025): 1.13 billion AI referrals, more than 80% of them from ChatGPT. From September to November 2025, ChatGPT referrals grew 52% year over year while Gemini's grew 388%. — [Coalition Technologies](https://coalitiontechnologies.com/blog/traffic-from-ai-hit-1-13b-visits-up-357-yoy); [Digiday](https://digiday.com/media/in-graphic-detail-the-state-of-ai-referral-traffic-in-2025/)
- AI platforms drive about 1% of overall traffic. — [Digiday](https://digiday.com/media/in-graphic-detail-the-state-of-ai-referral-traffic-in-2025/); [Search Engine Land, "AI sends 1% of website traffic"](https://searchengineland.com/ai-1-traffic-mostly-chatgpt-464653)
- **SMB sites** (391 sites, September 2024 to February 2025): AI referrals as a share of organic traffic rose from 0.54% to 1.24%. Travel and finance sites saw the highest AI referral volumes from ChatGPT. — [Search Engine Land](https://searchengineland.com/smb-websites-rising-traffic-chatgpt-ai-engines-453201); [Insites summary](https://insites.com/blog/ai-search-engines-are-sending-more-traffic-to-smbs-and-your-sales-team-needs-to-know-about-it/)
- **100-site study** (reported October 2026): ChatGPT sessions equalled 0.62% of Google organic sessions. — [Ecommerce Paradise](https://ecommerceparadise.com/chatgpt-traffic-vs-google-organic/)
- **Previsible** (6.77 million AI sessions): ChatGPT was 92.4% of AI referral traffic. — [Search Engine Land](https://searchengineland.com/chatgpt-ai-referral-traffic-sessions-data-481630)
- **Clicks from Google itself:**
  - Pew Research (about 900 US adults, about 69,000 searches, March 2025): users clicked a traditional result 8% of the time when an AI Overview appeared and 15% when none appeared. Links inside AI Overviews got about 1% of clicks. Google disputes the methodology. — [9to5Google](https://9to5google.com/2025/07/23/google-ai-overview-link-click-study/); [Sistrix](https://www.sistrix.com/blog/pew-research-ai-overviews-halve-click-through-rates/)
  - Ahrefs: an AI Overview was associated with a 34.5% lower CTR for the #1 result (March 2025 data), rising to 58% lower in an update using December 2025 data. — [Ahrefs update](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/); [MediaNama](https://www.medianama.com/2026/02/223-google-ai-overviews-click-through-rates-58-study/)

### Inferences
- Rough scale: if the blog gets X Google organic visits a month, expect AI referrals of about 0.5-2% of X in 2026. Ask Arpi Q&A pages may do better than the average, because they match conversational prompts. This is extrapolated from averages; there is no data for this site.
- Measurement: in GA4 or Netlify analytics, group referrers chatgpt.com, perplexity.ai, copilot.microsoft.com, gemini.google.com and claude.ai. ChatGPT often adds `utm_source=chatgpt.com` to links. I did not verify the current UTM behavior in this session. Many AI-assisted visits show up as "direct," so the measured numbers undercount.
- The bigger effect may be a decline in Google clicks for generic informational queries ("Is Budapest tap water safe?") because of AI Overviews. Personal, opinionated, story-driven content and Q&A that AI cannot fully summarize keep more of their value.

### Gaps
- I found no data specific to small travel blogs (as opposed to OTAs, hotels or SMB averages).
- No Hungary- or Budapest-specific AI referral data was found.

## 6. How to structure an "Ask a local" Q&A section so AI and Google can use it (QAPage and FAQPage status)

### Takeaway
FAQ rich results are gone. Google restricted them in August 2023 to authoritative government and health sites, then removed them entirely on May 7, 2026. FAQPage markup is still valid, and Google says it can still use it to understand pages. QAPage, for one user question with answers, was not reported as retired, but I could not confirm its 2026 status from Google's docs. The best structure: one indexable HTML page per question, with the question as the H1, a direct answer first, visible dates and Arpi's byline, and `QAPage` (or `BlogPosting`) JSON-LD. A hub page then links to all of them.

### Cited Findings
- **2023 restriction:** in August 2023, Google limited FAQ rich results to "well-known, authoritative government and health websites." — [TechWyse](https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026)
- **2026 removal:** Google added a deprecation notice. FAQ rich results stopped appearing in Search as of May 7, 2026. The Search Console FAQ report and Rich Results Test support were to be retired in June 2026, and API support in August 2026. Google gave no stated rationale. — [TechWyse](https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026); [Priority Pixels](https://prioritypixels.co.uk/insights/google-ends-faq-rich-results-in-search/); [Passionfruit](https://www.getpassionfruit.com/blog/what-changed-with-google-drops-faq-rich-results-and-what-to-do-now)
- FAQPage markup remains valid schema, and Google is reported to still use FAQ structured data to understand pages. Unused structured data does not hurt Search. — [Quattr, FAQ schema in 2026](https://www.quattr.com/blog/faq-schema-in-2026); [DEV Community, "FAQ rich results are dead, don't delete the Q&A markup"](https://dev.to/jangwook_kim_e31e7291ad98/faq-rich-results-are-dead-dont-delete-the-qa-markup-560a)
- **QAPage scope:** it is meant for pages with a single user-asked question and one or more answers (community or forum style, with `acceptedAnswer` or `suggestedAnswer`). Google added separate DiscussionForumPosting markup for forum threads. — [Lumar](https://api-docs.lumar.io/docs/report-templates/crawl_structured_data_blocks/pages_with_qa_schema_blocks); [Telligent](https://community.telligent.com/community/12/a/user-documentation/UD422/what-is-qapage-structured-data); [Search Engine Land](https://searchengineland.com/google-search-now-supports-discussion-forum-and-profile-page-structured-data-435038)
- From my background knowledge of Google's QAPage docs, not re-verified here: Google says QAPage is for pages where users can submit answers, and that FAQPage should be used where the site owner writes both the questions and the answers.
- Google says AI Overviews and AI Mode have no special schema requirements. A page needs to be indexed and snippet-eligible. — [Google AI features doc](https://developers.google.com/search/docs/appearance/ai-features) (reported via [LLM Pulse](https://llmpulse.ai/blog/optimize-for-google-ai-overviews/))

### Inferences
This is a recommended structure, synthesized from the above.
- **One URL per question**, for example `/ask/is-it-safe-to-walk-at-night-in-district-8.html`, with a descriptive slug. Avoid a single long page with 200 accordion items, and never load answers only through JavaScript. AI fetchers and some crawlers may not run JS, and a page per question can match a specific prompt or fan-out query.
- **Page layout:**
  - H1 = the visitor's question in natural words, lightly edited, keeping its specifics ("I'm vegetarian, arriving in January for 3 nights…").
  - "Asked by Sarah from Leeds, 14 Oct 2026," then "Answered by Arpi, local waiter since 20XX, 15 Oct 2026."
  - First paragraph = the direct answer with specifics: names, addresses or districts, prices in HUF, hours.
  - Then the nuance and story, then "Updated [date]: still true?" notes.
  - Then links to related posts and related questions.
- **Schema options:**
  - (a) `QAPage` with `mainEntity: Question` (with `name`, `text`, `dateCreated` and `author` as the asker's first name) and an `acceptedAnswer: Answer` (with `text`, `dateCreated`, `author: Person "Arpi"`, and `url`). This fits semantically because a user asked the question. Whether Google will show a rich result for a site where only the owner answers is unclear, and per Google's guidelines (unverified) it is probably not eligible.
  - (b) `BlogPosting` or `Article`, with author and dates, plus an `about: Question` block. This is safe and fully valid.
  - Either way, the rich-result payoff is small or zero in 2026. The real value is clean, machine-readable Q&A plus dates and authorship, which every engine can parse. Do not mark up content that isn't visible on the page.
- **Hub page** `/ask/`: list questions by topic (food, transport, baths, safety, money, neighbourhoods), with each linked and dated. Link to it from the nav. Add every Q&A URL to the sitemap with `<lastmod>`, and ping IndexNow when an answer is published.
- **Guest book:** keep it out of the main indexed content, or `noindex` it, unless entries are moderated. Thin user content adds little and can attract spam. The Q&A answers are the valuable user-generated content.
- **Seed the Q&A** with the questions people actually type into AI ("Is Budapest expensive in 2026?", "Best ruin bar for a quiet drink?", "Tipping in Budapest restaurants," "Which thermal bath is less touristy?"), and include exact figures. This mirrors the GEO finding on statistics and the fan-out behavior.

### Gaps
- I could not fetch Google's QAPage documentation to confirm its 2026 status and its eligibility rules for owner-answered Q&A.
- There is no evidence on whether AI engines treat QAPage or FAQPage JSON-LD differently from plain, well-structured HTML. Most practitioners believe the visible HTML text is what LLMs read, but I found no controlled study.
