export type Guide = { slug: string; title: string; excerpt: string; category: string; readTime: string; updated: string; body: string };

// Guides are written for general information. Store policies change; each guide
// tells readers to confirm with the retailer.
export const GUIDES: Guide[] = [
  {
    slug: 'price-match-guide',
    title: 'Price Matching at Canadian Grocery Stores: How It Works',
    excerpt: 'Which grocers match competitor flyers, the usual conditions, and a checkout script that works.',
    category: 'Policies', readTime: '6 min', updated: 'November 2026',
    body: `<p>Price matching lets you buy an item at one store for the lower price a competitor is advertising in its current flyer. Used well, it turns daily.sale’s cheapest-store list into a one-stop shop.</p>
<h2>Grocers with published price-match policies (Ontario)</h2>
<ul>
<li><strong>No Frills</strong> — matches a major supermarket competitor’s current print or digital flyer. Typical limits: identical item, up to 4 units, no “spend X get Y”, loyalty-only or online-only prices.</li>
<li><strong>FreshCo</strong> — advertises selling at one cent less than a discount competitor’s current flyer price. Competitor list varies by store; loyalty and online prices excluded.</li>
<li><strong>Giant Tiger</strong> — matches a local competitor’s current flyer at one cent less, excluding clearance, percentage-off and loyalty offers.</li>
</ul>
<p>Other chains, including Walmart Canada, set their own rules and change them from time to time. Ask at customer service before you rely on a match.</p>
<h2>Conditions you will almost always meet</h2>
<ul><li>Same brand, size, variety and count.</li><li>The competitor’s flyer must be current (valid dates visible).</li><li>Reasonable quantity limits.</li><li>The competitor must be local and on the store’s accepted list.</li></ul>
<h2>Checkout script</h2>
<ol><li>Open the competitor’s own flyer (app or retailer site) — not a comparison site — and have it ready.</li><li>Tell the cashier before they scan: “I have a price match on these two items.”</li><li>Show the item, price and valid dates.</li><li>Check the receipt before you leave.</li></ol>
<h2>Use daily.sale to plan it</h2>
<p>Build your list in the <a href="/basket">Cheapest Basket</a> tool, note which items are cheapest at other stores, and bring those flyers to a store that matches. Always confirm the current policy with the store.</p>`
  },
  {
    slug: 'pc-optimum-maximizer',
    title: 'Getting More from PC Optimum',
    excerpt: 'How points are valued, how to load offers, and when to redeem — without buying things you don’t need.',
    category: 'Loyalty', readTime: '6 min', updated: 'November 2026',
    body: `<h2>The basics</h2><p>PC Optimum is Loblaw’s loyalty program (No Frills, Zehrs, Real Canadian Superstore, Loblaws, Shoppers Drug Mart and more). Points are redeemed in blocks: <strong>10,000 points = $10</strong>, so each point is worth 0.1¢.</p>
<h2>Three habits that matter</h2>
<h3>1. Load personalised offers before you shop</h3><p>Offers in the app usually need to be loaded to your account before the transaction. Check them when new flyers arrive.</p>
<h3>2. Combine offers with flyer prices</h3><p>A points offer on an item that is also the cheapest flyer price in town (check daily.sale) is the best of both. A points offer on an overpriced item usually isn’t a deal.</p>
<h3>3. Redeem steadily</h3><p>Points don’t earn interest. Many shoppers redeem as soon as they reach a useful block rather than hoarding, and save big redemptions for promotional events when points are worth more.</p>
<h2>What to avoid</h2><ul><li>Buying products only for the points.</li><li>Ignoring the unit price — a points offer on a smaller pack can still cost more per 100 g.</li></ul>
<p>Program rules change; check pcoptimum.ca for current terms.</p>`
  },
  {
    slug: 'flyer-matchup-beginners',
    title: 'Flyer + Coupon Stacking for Beginners (Canada)',
    excerpt: 'Pair a flyer sale with a manufacturer coupon to pay well under shelf price.',
    category: 'Coupons', readTime: '7 min', updated: 'November 2026',
    body: `<h2>What stacking means</h2><p>Combining a store’s flyer sale price with a manufacturer coupon on the same item. Whether a store accepts coupons on sale items is up to each retailer’s coupon policy, so check it first.</p>
<h2>Where Canadians find coupons</h2><ul><li>WebSaver and SmartSource (printable and mail-out manufacturer coupons).</li><li>Save.ca (aggregator).</li><li>Tear pads and peelies in store.</li><li>Receipt-scan apps such as Checkout 51 and Caddle for cash back after you shop.</li></ul>
<h2>A simple weekly workflow</h2><ol><li>When new flyers drop, open <a href="/deals">today’s deals</a> and note the items you actually need.</li><li>Check coupon sites for those brands.</li><li>Check receipt apps for the same items.</li><li>Shop, present coupons, then scan your receipt.</li></ol>
<h2>Rules of thumb</h2><ul><li>One manufacturer coupon per item.</li><li>Expiry dates matter — cashiers will check.</li><li>A coupon on a non-sale item is rarely the best price; wait for the flyer cycle.</li></ul>`
  },
  {
    slug: 'grocery-budget-under-100',
    title: 'A Flyer-Driven Weekly Meal Plan for a Family of Four',
    excerpt: 'A template week built around flyer staples, with a method you can reuse every Thursday.',
    category: 'Budget', readTime: '8 min', updated: 'November 2026',
    body: `<h2>The method</h2><ol><li>Start from this week’s cheapest proteins on <a href="/categories/meat">Meat &amp; Seafood</a>.</li><li>Add the two or three cheapest vegetables and fruit on <a href="/categories/produce">Produce</a>.</li><li>Fill with pantry staples you already have.</li><li>Plan one leftover night and one “use it up” night.</li></ol>
<h2>Template week</h2>
<p><em>Swap in whatever is cheapest this week — the structure matters more than the exact items.</em></p>
<ul>
<li><strong>Mon</strong> — chicken thigh stir-fry with frozen vegetables and rice.</li>
<li><strong>Tue</strong> — pasta with tomato sauce and a big salad.</li>
<li><strong>Wed</strong> — breakfast for dinner: eggs, toast, fruit.</li>
<li><strong>Thu</strong> — ground-beef chili with canned beans and tomatoes (makes leftovers).</li>
<li><strong>Fri</strong> — leftover chili or homemade pizza.</li>
<li><strong>Sat</strong> — roast whole chicken, potatoes and carrots.</li>
<li><strong>Sun</strong> — soup from the chicken carcass and leftover vegetables.</li>
</ul>
<h2>Keeping it on budget</h2><ul><li>Buy proteins only when they’re at their flyer low; freeze extras.</li><li>Compare unit prices, not pack prices.</li><li>Use the <a href="/calculator">budget calculator</a> to set a weekly target, and the <a href="/basket">Cheapest Basket</a> tool to price your list before you leave home.</li></ul>`
  },
  {
    slug: 'best-grocery-apps-canada',
    title: 'Grocery Savings Apps in Canada: What Each One Does',
    excerpt: 'Cash-back, loyalty, near-expiry and flyer apps — how they differ and how to combine them.',
    category: 'Apps', readTime: '6 min', updated: 'November 2026',
    body: `<h2>Four kinds of savings apps</h2>
<h3>Receipt cash-back</h3><p><strong>Checkout 51</strong> and <strong>Caddle</strong> pay you for buying featured items after you upload a receipt. Works at most grocers.</p>
<h3>Store loyalty</h3><p><strong>PC Optimum</strong> (Loblaw banners and Shoppers), <strong>Scene+</strong> (Sobeys, FreshCo, Safeway, Foodland) and <strong>Metro &amp; Moi</strong> (Metro banners) reward shopping at specific chains.</p>
<h3>Near-expiry discounts</h3><p><strong>Flashfood</strong> (at participating grocers) and <strong>Too Good To Go</strong> sell food near its best-before date at a discount.</p>
<h3>Flyer comparison</h3><p>Flyer apps let you browse flyers; daily.sale goes a step further and ranks the cheapest store per item for you.</p>
<h2>How to combine them</h2><ol><li>Pick where to shop with daily.sale.</li><li>Load that chain’s loyalty offers.</li><li>Scan the receipt in a cash-back app afterwards.</li></ol>
<p>See the full list in our <a href="/coupons">coupon directory</a>. Some links there may be affiliate links — see our <a href="/affiliate-disclosure">disclosure</a>.</p>`
  },
  {
    slug: 'bulk-vs-flyer',
    title: 'Warehouse Bulk vs. Flyer Sale: When Does Each Save?',
    excerpt: 'A three-question test for deciding whether the big pack is actually cheaper.',
    category: 'Strategy', readTime: '5 min', updated: 'November 2026',
    body: `<h2>Three questions</h2><ol><li><strong>Unit price:</strong> which is lower per kg, per litre or per item?</li><li><strong>Spoilage:</strong> will you use it all before it goes bad?</li><li><strong>Storage:</strong> do you have the freezer or shelf space?</li></ol><p>If the bulk option fails any one, the flyer sale usually wins.</p>
<h2>Worked example (illustrative prices)</h2><p>Bulk chicken breast at $12.75/kg vs. a flyer family pack at $11.00/kg: the flyer wins by $1.75/kg and comes in a smaller pack you can freeze in portions.</p>
<h2>Bulk tends to win on</h2><p>Non-perishables: toilet paper, laundry detergent, canned goods, large bags of rice.</p>
<h2>Flyers tend to win on</h2><p>Produce, bakery, dairy and meat — anything you might throw half of away.</p>`
  },
  {
    slug: 'seasonal-produce-calendar-canada',
    title: 'Ontario Seasonal Produce Calendar',
    excerpt: 'When local fruit and vegetables are in season — and usually cheapest.',
    category: 'Produce', readTime: '4 min', updated: 'November 2026',
    body: `<p>Prices are lowest when local supply peaks. Timing varies with weather; these are typical Ontario windows.</p>
<h3>Fruit</h3><ul><li>Strawberries: June to early July.</li><li>Blueberries and raspberries: July to August.</li><li>Peaches and plums (Niagara): August to September.</li><li>Apples: September to November, stored apples through winter.</li><li>Pears and grapes: September to October.</li></ul>
<h3>Vegetables</h3><ul><li>Asparagus: May to June.</li><li>Sweet corn: August to September.</li><li>Field tomatoes and peppers: August to September.</li><li>Squash and pumpkins: September to November.</li><li>Carrots, onions, potatoes, cabbage: autumn harvest, stored through winter.</li></ul>
<h2>How to use it</h2><p>Buy extra at the seasonal low and freeze, can or store it. Track current prices on our <a href="/categories/produce">produce page</a>.</p>`
  },
  {
    slug: 'reading-unit-prices',
    title: 'How to Read Unit Prices on Shelf Tags',
    excerpt: 'Price per 100 g or per litre is the fairest way to compare different pack sizes.',
    category: 'Basics', readTime: '3 min', updated: 'November 2026',
    body: `<h2>What it is</h2><p>Many Canadian grocers print a unit price — per 100 g, per kg, per 100 mL or per item — in small text on the shelf tag. Unit pricing is largely voluntary in Canada, so formats differ between stores.</p>
<h2>Why it matters</h2><p>Pack sizes change constantly. “Butter $3.98” could be 250 g or 454 g. Unit price puts both on the same scale.</p>
<h2>Do the math yourself when needed</h2><p>Price ÷ size × 100 = price per 100 g (or mL). Example: 750 g yogurt at $4.49 = $0.60 per 100 g; 650 g on sale at $3.99 = $0.61 per 100 g — the “sale” pack is actually slightly worse value.</p>
<h2>Watch for</h2><ul><li>Different units on neighbouring tags (per 100 g vs per kg).</li><li>Multi-buy offers — divide by the number of items.</li><li>Shrinkflation: same price, smaller pack.</li></ul>`
  }
];

export function getGuide(slug: string) { return GUIDES.find(g => g.slug === slug) || null; }
