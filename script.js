const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('is-open', !open);
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const progress = document.querySelector('.scroll-progress span');
const glow = document.querySelector('.cursor-glow');

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.width = `${percent}%`;
}, { passive: true });

if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (event) => {
    if (!glow) return;
    glow.style.opacity = '1';
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const comparisonPrototype = document.querySelector('#prototype');

if (false && comparisonPrototype) {
  const inputs = {
    tataGrowth: document.querySelector('#tata-growth'),
    tataMargin: document.querySelector('#tata-margin'),
    havellsGrowth: document.querySelector('#havells-growth'),
    havellsMargin: document.querySelector('#havells-margin'),
  };
  const canvas = document.querySelector('#comparison-chart');
  const context = canvas?.getContext('2d');

  const scenarios = {
    bear: { tataGrowth: 6, tataMargin: 15.5, havellsGrowth: 5, havellsMargin: 9 },
    base: { tataGrowth: 9.7, tataMargin: 18, havellsGrowth: 9.6, havellsMargin: 11.2 },
    bull: { tataGrowth: 13, tataMargin: 20, havellsGrowth: 13, havellsMargin: 13 },
  };
  const baseRevenue = { tata: 5505.6, havells: 22466 };

  const formatCrore = (value) => `Rs ${Math.round(value).toLocaleString('en-IN')} Cr`;
  const projectRevenue = (base, growth, yearIndex) => base * ((1 + growth / 100) ** yearIndex);

  function setText(id, value) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value;
  }

  function drawComparisonChart(tataGrowth, havellsGrowth) {
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const width = bounds.width;
    const height = bounds.height;
    const compact = width < 430;
    const pad = { left: compact ? 42 : 52, right: 18, top: 20, bottom: 38 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const tataSeries = Array.from({ length: 6 }, (_, index) => 100 * ((1 + tataGrowth / 100) ** index));
    const havellsSeries = Array.from({ length: 6 }, (_, index) => 100 * ((1 + havellsGrowth / 100) ** index));
    const seriesMax = Math.max(...tataSeries, ...havellsSeries);
    const yMax = Math.max(150, Math.ceil(seriesMax / 25) * 25);
    const yMin = 100;
    const x = (index) => pad.left + (plotWidth * index / 5);
    const y = (value) => pad.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
    const styles = getComputedStyle(document.documentElement);
    const tataColor = styles.getPropertyValue('--acid').trim() || '#d7ff52';
    const havellsColor = styles.getPropertyValue('--orange').trim() || '#ff6846';

    context.clearRect(0, 0, width, height);
    context.font = `${compact ? 9 : 10}px DM Mono, monospace`;
    context.textBaseline = 'middle';
    context.lineWidth = 1;

    for (let tick = yMin; tick <= yMax; tick += 25) {
      const tickY = y(tick);
      context.strokeStyle = 'rgba(255,255,255,.12)';
      context.beginPath();
      context.moveTo(pad.left, tickY);
      context.lineTo(width - pad.right, tickY);
      context.stroke();
      context.fillStyle = 'rgba(220,224,214,.58)';
      context.textAlign = 'right';
      context.fillText(String(tick), pad.left - 9, tickY);
    }

    const years = ['FY26', 'FY27', 'FY28', 'FY29', 'FY30', 'FY31'];
    years.forEach((label, index) => {
      context.fillStyle = 'rgba(220,224,214,.58)';
      context.textAlign = 'center';
      context.fillText(label, x(index), height - 13);
    });

    function drawSeries(values, color, pointShape) {
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.beginPath();
      values.forEach((value, index) => {
        if (index === 0) context.moveTo(x(index), y(value));
        else context.lineTo(x(index), y(value));
      });
      context.stroke();
      values.forEach((value, index) => {
        context.fillStyle = color;
        context.beginPath();
        if (pointShape === 'square') context.rect(x(index) - 4, y(value) - 4, 8, 8);
        else context.arc(x(index), y(value), 4, 0, Math.PI * 2);
        context.fill();
      });
    }

    drawSeries(tataSeries, tataColor, 'circle');
    drawSeries(havellsSeries, havellsColor, 'square');

    context.font = `${compact ? 9 : 10}px Manrope, sans-serif`;
    context.textAlign = 'right';
    context.fillStyle = tataColor;
    context.fillText(`Tata ${tataSeries[5].toFixed(0)}`, width - pad.right, Math.max(12, y(tataSeries[5]) - 12));
    context.fillStyle = havellsColor;
    const labelOffset = Math.abs(y(tataSeries[5]) - y(havellsSeries[5])) < 24 ? 15 : -12;
    context.fillText(`Havells ${havellsSeries[5].toFixed(0)}`, width - pad.right, y(havellsSeries[5]) + labelOffset);
  }

  function updatePrototype() {
    const tataGrowth = Number(inputs.tataGrowth.value);
    const tataMargin = Number(inputs.tataMargin.value);
    const havellsGrowth = Number(inputs.havellsGrowth.value);
    const havellsMargin = Number(inputs.havellsMargin.value);
    const tataRevenue = projectRevenue(baseRevenue.tata, tataGrowth, 5);
    const havellsRevenue = projectRevenue(baseRevenue.havells, havellsGrowth, 5);
    const tataEbitda = tataRevenue * tataMargin / 100;
    const havellsEbitda = havellsRevenue * havellsMargin / 100;
    const leader = tataGrowth > havellsGrowth ? 'Tata Technologies' : havellsGrowth > tataGrowth ? 'Havells India' : 'Equal growth';

    setText('tata-growth-value', `${tataGrowth.toFixed(1)}%`);
    setText('tata-margin-value', `${tataMargin.toFixed(1)}%`);
    setText('havells-growth-value', `${havellsGrowth.toFixed(1)}%`);
    setText('havells-margin-value', `${havellsMargin.toFixed(1)}%`);
    setText('tata-revenue-result', formatCrore(tataRevenue));
    setText('havells-revenue-result', formatCrore(havellsRevenue));
    setText('growth-leader-result', leader);
    setText('tata-growth-table', `${tataGrowth.toFixed(1)}%`);
    setText('tata-revenue-table', formatCrore(tataRevenue));
    setText('tata-margin-table', `${tataMargin.toFixed(1)}%`);
    setText('tata-ebitda-table', formatCrore(tataEbitda));
    setText('havells-growth-table', `${havellsGrowth.toFixed(1)}%`);
    setText('havells-revenue-table', formatCrore(havellsRevenue));
    setText('havells-margin-table', `${havellsMargin.toFixed(1)}%`);
    setText('havells-ebitda-table', formatCrore(havellsEbitda));
    setText('chart-summary', `By FY31, Tata Technologies reaches an indexed revenue level of ${(100 * ((1 + tataGrowth / 100) ** 5)).toFixed(0)}, while Havells India reaches ${(100 * ((1 + havellsGrowth / 100) ** 5)).toFixed(0)}.`);
    drawComparisonChart(tataGrowth, havellsGrowth);
  }

  Object.values(inputs).forEach((input) => input?.addEventListener('input', () => {
    document.querySelectorAll('.scenario-button').forEach((button) => button.classList.remove('is-active'));
    updatePrototype();
  }));

  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.addEventListener('click', () => {
      const scenario = scenarios[button.dataset.scenario];
      if (!scenario) return;
      Object.entries(scenario).forEach(([key, value]) => { inputs[key].value = value; });
      document.querySelectorAll('.scenario-button').forEach((item) => item.classList.toggle('is-active', item === button));
      updatePrototype();
    });
  });

  const chartResizeObserver = new ResizeObserver(() => updatePrototype());
  if (canvas) chartResizeObserver.observe(canvas);
  updatePrototype();
}

const researchTerminal = document.querySelector('.research-terminal');

if (researchTerminal) {
  const terminalData = {
    tata: {
      name: 'Tata Technologies', code: 'TATATECH', sector: 'Engineering & Digital Services', price: 'Rs 758.05', priceLabel: 'CMP as on July 17, 2026',
      revenue: 5505.6, ebitdaMargin: 15.5, profit: 546.6, roe: 16.3, roce: 20.9, pe: 53.4, evEbitda: 33.5,
      years: ['FY22', 'FY23', 'FY24', 'FY25', 'FY26'], historicalRevenue: [3530, 4414, 5117, 5168, 5506], historicalMargin: [18.3, 18.6, 18.4, 18.1, 15.5],
      forecast: { revenue: 8745.9, margin: 18.0, profit: 1194.5 },
      assumptions: {
        growth: [9.0, 10.0, 10.5, 10.0, 9.0], margin: [16.5, 17.0, 17.5, 17.8, 18.0], capex: [3.5, 3.5, 3.5, 3.5, 3.5], tax: 26.0, payout: 65.0,
        marginShift: 2.0,
        grounds: [
          ['Revenue growth', '9.0%-10.5%', 'The forecast starts from FY26 revenue of roughly Rs 5,506 crore and assumes growth improves as automotive manufacturers increase spending on product engineering, embedded software, electric vehicles and software-defined vehicle programmes. Tata Technologies also has scope to convert its engineering relationships into larger digital and offshore assignments. Growth rises to 10.5% by FY29 as programme execution and deal conversion mature, then moderates to 9.0% by FY31 because the revenue base is larger and automotive ER&D demand remains cyclical.', 'The main sensitivity is the timing of large-deal conversion. Slower client spending, programme delays or continued dependence on a few major automotive customers would push growth below the base case.'],
          ['EBITDA margin', '16.5% to 18.0%', 'FY26 EBITDA margin fell to 15.5%, below the 18%+ range achieved in earlier years. The model therefore assumes recovery rather than an immediate return to peak profitability. Margin expands gradually through better employee utilisation, pricing, a higher offshore-delivery mix and absorption of investments already made in delivery capability. The FY31 assumption of 18.0% remains broadly consistent with the company’s historical operating range and avoids assuming a margin structurally above demonstrated performance.', 'Recovery depends on utilisation and project mix. Wage inflation, acquisition-integration costs, weak pricing or a larger share of lower-margin work could delay the expected improvement.'],
          ['Capex intensity', '3.5% of revenue', 'Capex is maintained at 3.5% of revenue throughout the forecast to reflect continued spending on engineering centres, digital tools, laboratories, technology infrastructure and capacity supporting new programmes. A stable ratio allows investment to grow with revenue without assuming a major one-time capacity build. It also provides a conservative reinvestment allowance while recognising that the business remains less capital intensive than a manufacturer.', 'If expansion, acquisitions or specialised testing infrastructure require more investment, free cash flow would be lower even if reported EBITDA develops as expected.'],
          ['Tax and payout', '26% / 65%', 'The effective tax rate is normalised at 26%, close to the level seen in recent reported periods and consistent with a mature Indian corporate tax profile. The 65% dividend payout assumption is below FY26’s unusually high payout but remains generous relative to earnings. It reflects the company’s cash-generative model while retaining sufficient earnings for working capital, capability development and selective acquisitions.', 'A larger acquisition programme or weaker cash conversion could require a lower payout. Changes in geographic profit mix or tax rules could also move the effective tax rate away from the modelled level.']
        ],
        sourceNote: 'Base-case drivers are taken from the forecast-assumptions schedule in the linked Tata Technologies model.'
      },
      mix: [['Services', 77], ['Technology solutions', 23]],
      onePager: { founded: '1989', headquarters: 'Pune, India', description: 'A global product-engineering and digital-services company supporting automotive, aerospace and industrial clients across the product-development lifecycle.', performance: 'FY26 revenue growth remained positive, but EBITDA margin declined to 15.5%. This combination suggests that demand was resilient while investment, utilisation and delivery mix weighed on profitability. The research focus is therefore not only growth, but whether that growth converts into stronger operating leverage.', valuation: 'The premium P/E and EV/EBITDA multiples reflect expectations of durable ER&D growth and margin recovery. They also increase sensitivity to slower deal conversion or earnings downgrades.', strengths: [['Automotive engineering depth','Long experience across vehicle design, embedded systems and product development improves domain credibility and makes the company relevant across complex client programmes.'],['Global OEM relationships','Long-duration relationships can support repeat assignments and cross-selling, although they also create concentration that must be monitored.'],['Tata group association','Group parentage supports reputation, governance perception and access to anchor programmes, while the investment case still depends on winning diversified external business.']], watch: [['Client concentration','A slowdown or programme reduction at major customers could affect revenue growth and utilisation.'],['Margin recovery','Improving utilisation, pricing and offshore delivery is necessary for revenue growth to translate into earnings growth.'],['Automotive ER&D cycle','Discretionary engineering programmes may be delayed when global automotive manufacturers reduce spending.']] },
      thesis: 'A global engineering partner with deep automotive ER&D capabilities, Tata group parentage, and exposure to software-defined vehicles. The core question is whether growth and utilisation can restore margins after a period of investment and mix pressure.',
      stance: 'Constructive, valuation-sensitive', conviction: 'Medium',
      debate: 'Can double-digit engineering-services growth and better utilisation rebuild margins quickly enough to justify a premium valuation?',
      evidence: ['Strong positioning in automotive ER&D and software-defined vehicle programmes', 'FY26 EBITDA margin is below the FY22–FY25 range, leaving recovery potential but also execution risk', 'Tata group relationships support credibility and deal access, while also creating client-concentration risk'],
      cases: [['Bull case', 'Large deal conversion, stronger offshore mix and utilisation lift growth and margins together.'], ['Base case', 'Revenue compounds steadily while margins recover gradually toward the modelled FY31 level.'], ['Bear case', 'Automotive spending slows, concentration persists and margin recovery is delayed.']],
      viewChange: 'A more positive view would require visible large-deal conversion and sequential margin recovery. A more cautious view would follow weaker order intake, sustained margin compression, or valuation expansion without earnings upgrades.',
      catalysts: ['Large engineering and digital deal wins', 'Rising software-defined vehicle spend', 'Offshore delivery and utilisation improvement', 'Acquisition synergies and cross-selling'],
      risks: [['Client concentration', 'High', 'Material exposure to Tata Motors and Jaguar Land Rover.'], ['Premium valuation', 'High', 'Growth and margin recovery expectations leave limited room for execution misses.'], ['Auto cyclicality', 'Medium', 'European and global automotive spending can slow.'], ['Margin execution', 'Medium', 'Recovery depends on utilisation, pricing and delivery mix.']],
      profile: 'assets/projects/company-profiles/tata-technologies-profile.pdf', model: 'assets/projects/financial-models/tata-technologies-model.pdf'
    },
    havells: {
      name: 'Havells India', code: 'HAVELLS', sector: 'Electrical Consumer Durables & FMEG', price: 'Rs 1,187.30', priceLabel: 'CMP as on July 17, 2026',
      revenue: 22466, ebitdaMargin: 9.9, profit: 1705, roe: 19.2, roce: 25.1, pe: 43.8, evEbitda: 32.8,
      years: ['FY22', 'FY23', 'FY24', 'FY25', 'FY26'], historicalRevenue: [13889, 16868, 18550, 21746, 22466], historicalMargin: [12.7, 9.5, 9.9, 9.9, 9.9],
      forecast: { revenue: 35520.9, margin: 11.2, profit: 2477.2 },
      assumptions: {
        growth: [10.0, 11.0, 10.0, 9.0, 8.0], margin: [10.2, 10.5, 10.8, 11.0, 11.2], capex: [5.5, 5.2, 5.0, 4.8, 4.6], tax: 25.5, payout: 38.0,
        marginShift: 1.5,
        grounds: [
          ['Revenue growth', '8.0%-11.0%', 'The forecast is anchored in Havells’ broad electrical portfolio, national distribution network and the structural demand created by electrification, housing, infrastructure and industrial capex. Cables are expected to remain an important growth engine, while premiumisation and cross-selling support switchgear, lighting and consumer durables. Growth peaks at 11.0% in FY28 as capacity and demand momentum combine, then eases to 8.0% by FY31 as the base expands and the model avoids extrapolating double-digit growth indefinitely.', 'Copper-price pass-through can inflate or suppress reported revenue without an equal change in volumes. Weak construction activity, poor summer demand or competitive pricing would reduce growth versus the base case.'],
          ['EBITDA margin', '10.2% to 11.2%', 'FY26 EBITDA margin is approximately 9.9%, well below FY22’s 12.7%. The model assumes only a gradual recovery: utilisation improves, cables and premium products support mix, procurement and manufacturing efficiencies provide operating leverage, and Lloyd moves toward more sustainable profitability. The FY31 margin of 11.2% remains below the earlier peak, deliberately recognising commodity volatility and continuing competition rather than assuming a complete return to historical highs.', 'The most important variables are copper and aluminium pass-through, competitive discounting and Lloyd’s profitability. A 100-basis-point margin change would have a material impact on operating profit.'],
          ['Capex intensity', '5.5% to 4.6%', 'Capex begins at 5.5% of revenue to reflect investment in cable capacity, manufacturing modernisation, automation, distribution support and product development. The ratio then declines toward 4.6% as projects are commissioned and revenue grows into the expanded asset base. This pattern captures a front-loaded investment cycle while still providing ongoing maintenance and growth spending in later years.', 'Project delays or a larger-than-expected expansion plan would keep capex elevated and reduce free cash flow. Conversely, faster asset utilisation could improve cash returns earlier than modelled.'],
          ['Tax and payout', '25.5% / 38%', 'The tax rate is held at 25.5% to represent a normalised corporate rate and avoid forecasting benefits from temporary tax items. Dividend payout is fixed at 38%, balancing shareholder distributions with the funding required for capex, working capital and strategic investments. This is consistent with a business that generates operating cash but must continue reinvesting across multiple manufacturing and consumer categories.', 'Commodity-driven working-capital requirements or a major strategic investment could reduce distributable cash. A shift in tax incentives or the geographic mix of profits could change the effective rate.']
        ],
        sourceNote: 'Base-case drivers are taken from the forecast-assumptions schedule and strategic model insights in the linked Havells India model.'
      },
      mix: [['Core electricals', 76], ['Lloyd consumer durables', 24]],
      onePager: { founded: '1958', headquarters: 'Noida, India', description: 'A leading Indian electrical consumer-durables and FMEG company spanning cables, switchgear, lighting, fans, appliances and Lloyd consumer durables.', performance: 'FY26 revenue reached approximately Rs 22,466 crore while EBITDA margin remained around 9.9%. The scale of the franchise is evident, but the margin remains below earlier levels. The central analytical question is whether cables, premiumisation and Lloyd recovery can produce stronger operating leverage.', valuation: 'The valuation reflects Havells’ brand, distribution reach and return profile. Sustaining that premium requires consistent volume growth, disciplined commodity pass-through and visible improvement in Lloyd profitability.', strengths: [['Brand and distribution','A broad dealer and retail network improves product availability, supports national reach and creates opportunities to cross-sell multiple electrical categories.'],['Core-category leadership','Scale in cables, switchgear and electrical products supports procurement efficiency, channel influence and customer trust.'],['Portfolio diversification','Exposure across industrial, housing and consumer categories reduces reliance on a single demand pool and creates a pathway for premiumisation.']], watch: [['Commodity pass-through','Copper and aluminium inflation can compress margins if price increases are delayed or competition prevents full pass-through.'],['Lloyd profitability','A durable improvement in Lloyd is important because weak consumer-durable margins can dilute returns from the core electrical franchise.'],['Seasonal demand','Fans, air conditioners and appliances are sensitive to summer conditions and discretionary consumer spending.']] },
      thesis: 'A diversified electrical franchise supported by brand strength, distribution depth, and leadership in cables and switchgear. The next leg of earnings depends on premiumisation, operating leverage, and a sustained recovery in Lloyd.',
      stance: 'Constructive, execution-sensitive', conviction: 'Medium',
      debate: 'Can core electrical growth and Lloyd’s recovery expand margins enough to support the company’s premium multiple?',
      evidence: ['Brand and distribution create a durable route-to-market advantage across electrical categories', 'ROCE and ROE remain healthy, supporting the quality argument', 'FY26 EBITDA margin remains below FY22, making mix improvement and Lloyd profitability central to the earnings case'],
      cases: [['Bull case', 'Cable demand, premiumisation and Lloyd recovery produce stronger operating leverage.'], ['Base case', 'Core categories compound steadily and margins normalise gradually toward the FY31 model.'], ['Bear case', 'Commodity inflation, weak seasonal demand and competition restrict margin recovery.']],
      viewChange: 'A more positive view would need sustained Lloyd profitability and evidence of premium-led margin expansion. A more cautious view would follow market-share loss, prolonged commodity pressure, or weaker cash conversion.',
      catalysts: ['Electrification and cable demand', 'Premium product mix improvement', 'Lloyd margin recovery', 'Distribution-led cross-selling'],
      risks: [['Input-cost volatility', 'High', 'Copper and aluminium movements can pressure gross margins.'], ['Seasonal demand', 'Medium', 'Weak summer conditions can affect consumer-durable sales.'], ['Price competition', 'Medium', 'Aggressive pricing may delay margin normalisation.'], ['Premium valuation', 'High', 'The multiple depends on consistent growth and execution.']],
      profile: 'assets/projects/company-profiles/havells-india-profile.pdf', model: 'assets/projects/financial-models/havells-india-model.pdf'
    },
    itc: {
      name: 'ITC Limited', code: 'ITC', sector: 'Diversified FMCG & Consumer Businesses', price: 'Rs 280.70', priceLabel: 'CMP as on July 17, 2026',
      revenue: 80867, ebitdaMargin: 31.2, profit: 20286, roe: 29.6, roce: 29.6, pe: 17.3, evEbitda: 13.2,
      mix: [['Domestic institutions', 49.1], ['Foreign companies', 22.9], ['FPI', 11.9], ['Public & other', 16.0]],
      onePager: {
        founded: '1910', headquarters: 'Kolkata, India', returnLabel: 'Return on net worth', mixTitle: 'Shareholding mix',
        mixNote: 'The ownership mix highlights the influence of long-term domestic institutions, strategic foreign shareholders and market investors on ITC\'s shareholder base.',
        description: 'A diversified Indian enterprise spanning FMCG, cigarettes, agri-business, paperboards and packaging, and information technology, combining cash-generative categories with scaled consumer brands and integrated capabilities.',
        performance: 'FY26 gross revenue increased 10.1% to Rs 80,867 crore, while EBITDA reached Rs 25,208 crore at a 31.2% margin. PAT rose to Rs 20,286 crore, although EPS growth was modest at 0.8%. The research question is whether FMCG scale-up and capital discipline can broaden earnings growth beyond the mature cigarette franchise.',
        valuation: 'At the July 17, 2026 close, ITC traded at 17.3x earnings with a 5.2% dividend yield. The valuation combines strong cash generation and shareholder distributions with regulatory risk, portfolio complexity and the need for stronger FMCG operating leverage.',
        strengths: [['Cash-generative core', 'High-margin cigarette operations support cash generation, dividends and investment across the wider portfolio.'], ['Scaled Indian consumer brands', 'A broad FMCG portfolio creates a pathway to premiumisation, distribution leverage and a more diversified earnings mix.'], ['Integrated capabilities', 'Agricultural sourcing, manufacturing and packaging capabilities strengthen supply-chain control and support multiple business verticals.']],
        watch: [['Cigarette taxation', 'The taxation structure changed from February 2026, making tax incidence, pricing and volume response important earnings variables.'], ['FMCG margin scale-up', 'FMCG-Others has achieved material scale, but further margin expansion is important for improving the quality and balance of consolidated growth.'], ['Portfolio comparability', 'The Hotels demerger creates a break in reported comparability, requiring care when interpreting FY24-FY26 growth and return trends.']]
      },
      thesis: 'ITC combines a highly cash-generative core, strong shareholder distributions and an increasingly scaled FMCG portfolio. The central investment debate is whether diversification and FMCG profitability can compound fast enough to offset regulatory concentration and mature-category growth.',
      stance: 'Cash-generative, diversification-dependent',
      profile: 'assets/projects/company-profiles/itc-limited-profile.pdf', monogram: 'ITC'
    },
    hul: {
      name: 'Hindustan Unilever', code: 'HINDUNILVR', sector: 'Fast-Moving Consumer Goods', price: 'Rs 2,143.80', priceLabel: 'CMP as on July 17, 2026',
      revenue: 63763, ebitdaMargin: 23.6, profit: 10652, roe: 31.8, roce: 110.9, pe: 47.4, evEbitda: 33.4,
      mix: [['Promoter', 61.9], ['Domestic institutions', 16.4], ['FPI', 10.1], ['Public & other', 11.6]],
      onePager: {
        founded: '1933', headquarters: 'Mumbai, India', returnLabel: 'ROCE', mixTitle: 'Shareholding mix',
        mixNote: 'The promoter-led ownership structure provides long-term strategic alignment with Unilever, while institutional and public holdings retain meaningful market oversight.',
        description: 'India\'s leading FMCG company across Home Care, Beauty & Wellbeing, Personal Care and Foods, supported by large brands, nationwide distribution, consumer insight and access to Unilever\'s global R&D and brand-building capabilities.',
        performance: 'FY26 turnover grew 5.3% to Rs 63,763 crore, supported by 4% underlying volume growth. EBITDA reached Rs 15,054 crore, but margin eased to 23.6% as the company continued investing in brands, innovation and future capabilities. PAT remained broadly stable at Rs 10,652 crore.',
        valuation: 'At the July 17, 2026 close, HUL traded at 47.4x earnings and 33.4x EV/EBITDA. The premium reflects brand quality, distribution and capital efficiency, but it also raises the growth and margin delivery required to generate attractive shareholder returns.',
        strengths: [['Brand and distribution moat', 'Twenty brands exceed Rs 1,000 crore in turnover, supported by nationwide reach and deep category presence.'], ['Unilever capabilities', 'Access to global R&D, innovation platforms and brand-building expertise strengthens product development and portfolio renewal.'], ['Exceptional capital efficiency', 'FY26 ROCE of 110.9% reflects an asset-light, cash-generative operating model with strong brand economics.']],
        watch: [['Growth acceleration', 'The premium valuation requires sustained volume-led growth beyond the 5% underlying sales growth delivered in FY26.'], ['Margin investment', 'Brand, innovation and capability spending supports long-term competitiveness but can constrain near-term EBITDA expansion.'], ['Portfolio comparability', 'The Ice Cream demerger changes continuing-operations comparability across FY25 and FY26 and should be separated from underlying operating momentum.']]
      },
      thesis: 'HUL remains a high-quality consumer franchise with powerful brands, distribution depth and exceptional capital efficiency. The investment case depends on a durable return to volume-led growth while protecting margins and converting portfolio renewal into earnings acceleration.',
      stance: 'High quality, growth-sensitive valuation',
      profile: 'assets/projects/company-profiles/hindustan-unilever-profile.pdf', monogram: 'HUL'
    }
  };

  const businessModels = {
    tata: {
      headline: 'An engineering partner embedded across the product-development lifecycle',
      summary: 'Tata Technologies is primarily a B2B services business. It monetises specialised engineering talent, domain knowledge and digital-delivery capability through project-based, capacity-based and turnkey programmes for automotive, aerospace and industrial manufacturers.',
      flow: [['Customer need', 'New products, software-defined platforms and faster development'], ['Engineer', 'Design, embedded software, validation and PLM expertise'], ['Deliver', 'Global onsite-offshore teams and turnkey programme execution'], ['Expand', 'Follow-on programmes, digital work and technology solutions']],
      engines: [['Engineering & digital services', 'Project fees and engineering capacity', 'Core revenue comes from helping OEMs and Tier-1 suppliers design, develop, validate and industrialise products.'], ['Technology solutions', 'Software, products and education solutions', 'Complements services through software-led offerings, product enablement and capability-building programmes.'], ['Account expansion', 'Repeat programmes and cross-selling', 'Deep domain integration can extend a relationship from component work to full-vehicle, embedded-software and enterprise-digital assignments.']],
      economics: [['Revenue equation', 'Billable engineering capacity × utilisation × pricing × programme scope'], ['Margin levers', 'Offshore delivery, employee utilisation, project mix and pricing discipline'], ['Principal risk', 'Large-client concentration and sensitivity to global OEM development cycles']]
    },
    havells: {
      headline: 'A branded electrical-products platform built on manufacturing and distribution depth',
      summary: 'Havells earns by designing, manufacturing and selling electrical and consumer-durable products through distributors, dealers, retailers, projects and direct institutional channels. Brand trust and route-to-market reach allow the same network to carry multiple categories.',
      flow: [['Demand insight', 'Residential, commercial, industrial and seasonal demand'], ['Make', 'Integrated manufacturing, sourcing, quality control and product development'], ['Distribute', 'Dealers, retailers, Havells Galaxy stores, projects and digital channels'], ['Cross-sell', 'Cables, switchgear, lighting, appliances, fans and Lloyd products']],
      engines: [['Core electricals', 'Product volumes plus price and mix', 'Cables, wires and switchgear benefit from electrification, housing, infrastructure and industrial capital expenditure.'], ['Consumer portfolio', 'Branded product sales and premiumisation', 'Fans, lighting and appliances widen household relevance and create cross-category demand through a common channel network.'], ['Lloyd consumer durables', 'Seasonal durable-product sales', 'Air conditioners and other durables add a large addressable market, but profitability depends on scale, seasonality and competitive pricing.']],
      economics: [['Revenue equation', 'Volume growth × realised price × category mix'], ['Margin levers', 'Capacity utilisation, premium mix, procurement and Lloyd profitability'], ['Principal risk', 'Copper and aluminium volatility, channel competition and seasonal demand']]
    },
    itc: {
      headline: 'A cash-generative core funding a synergistic multi-business portfolio',
      summary: 'ITC combines consumer brands with agricultural sourcing, paperboards, packaging and information technology. Cigarettes remain the principal cash and profit engine, while shared sourcing, manufacturing, packaging, brand-building and distribution capabilities support the wider FMCG portfolio.',
      flow: [['Source', 'Agricultural commodities, leaf tobacco, pulpwood and other inputs'], ['Create', 'Manufacturing, product development, brands and packaging'], ['Reach', 'Nationwide distribution, institutional customers, exports and digital channels'], ['Recycle cash', 'Brand investment, capacity, new categories and shareholder distributions']],
      engines: [['Cigarettes', 'Volume, pricing and brand mix', 'A high-margin, cash-generative franchise funds dividends and investment, while taxation and regulation shape pricing and demand.'], ['FMCG - Others', 'Consumer volumes, pricing and premiumisation', 'Packaged foods, personal care, stationery, matches and incense create new growth drivers using ITC’s brands and route to market.'], ['Agri, paperboards, packaging & IT', 'Commodity, B2B product and service revenue', 'These businesses serve external customers while also strengthening sourcing, packaging and domain capabilities across the group.']],
      economics: [['Portfolio engine', 'Mature-category cash generation finances newer consumer businesses'], ['Synergy levers', 'Agri sourcing, packaging, distribution, brands and supply-chain integration'], ['Principal risk', 'Cigarette regulation, commodity cycles and uneven returns across the portfolio']]
    },
    hul: {
      headline: 'A brand-led FMCG model powered by innovation, distribution and repeat consumption',
      summary: 'HUL converts consumer insight and Unilever’s research capabilities into branded daily-use products, manufactures at scale and distributes them across traditional trade, modern retail, e-commerce and quick commerce. Frequent consumption creates recurring demand, while brand strength supports pricing and premiumisation.',
      flow: [['Understand', 'Consumer segmentation, insight and global-local R&D'], ['Create', 'Brands, formulations, packaging and price-point architecture'], ['Scale', 'Manufacturing, procurement and design-for-value'], ['Reach & repeat', 'Omnichannel distribution, availability and everyday consumption']],
      engines: [['Home Care', 'Volume, price and premium product mix', 'Large household categories combine frequent use with innovation, format upgrades and broad price-point coverage.'], ['Beauty & Personal Care', 'Brand preference and premiumisation', 'Science, aesthetics and targeted consumer propositions support higher-value routines and specialised products.'], ['Foods and adjacent demand spaces', 'Consumption frequency and category development', 'Trusted brands, product innovation and channel-specific packs help build penetration and new usage occasions.']],
      economics: [['Revenue equation', 'Household penetration × consumption frequency × price and mix'], ['Margin levers', 'Brand premium, scale, procurement savings and portfolio mix'], ['Principal risk', 'A premium valuation requires sustained volume growth and continued brand investment']]
    }
  };

  let activeCompany = 'tata';
  let activeTab = 'overview';
  let forecastScenario = 'base';
  let explorerCompany = 'tata';
  let explorerView = 'snapshot';
  const crore = (value) => `Rs ${Math.round(value).toLocaleString('en-IN')} Cr`;
  const setTerminalText = (id, value) => { const element = document.querySelector(`#${id}`); if (element) element.textContent = value; };

  function renderOverview(data) {
    document.querySelector('#terminal-overview').innerHTML = `
      <div class="terminal-kpis">
        <article><span>FY26 revenue</span><strong>${crore(data.revenue)}</strong></article>
        <article><span>EBITDA margin</span><strong>${data.ebitdaMargin.toFixed(1)}%</strong></article>
        <article><span>Net profit</span><strong>${crore(data.profit)}</strong></article>
        <article><span>Return on equity</span><strong>${data.roe.toFixed(1)}%</strong></article>
      </div>
      <div class="terminal-content-grid">
        <article class="terminal-block mix-visual"><span class="terminal-label">Business mix</span><div class="mix-visual-layout"><div class="mix-donut" style="--mix:${data.mix[0][1]}" role="img" aria-label="${data.mix[0][0]} ${data.mix[0][1]} percent and ${data.mix[1][0]} ${data.mix[1][1]} percent"><strong>${data.mix[0][1]}%</strong><span>${data.mix[0][0]}</span></div><div>${data.mix.map(([label, value]) => `<div class="mix-row"><div><span>${label}</span><strong>${value}%</strong></div><div class="mix-track"><i style="width:${value}%"></i></div></div>`).join('')}</div></div></article>
        <article class="terminal-block"><span class="terminal-label">Valuation & returns</span><dl class="terminal-metrics"><div><dt>P/E</dt><dd>${data.pe.toFixed(1)}x</dd></div><div><dt>EV / EBITDA</dt><dd>${data.evEbitda.toFixed(1)}x</dd></div><div><dt>ROCE</dt><dd>${data.roce.toFixed(1)}%</dd></div><div><dt>PAT margin</dt><dd>${(data.profit / data.revenue * 100).toFixed(1)}%</dd></div></dl></article>
      </div>`;
  }

  function renderFinancials(data) {
    document.querySelector('#terminal-financials').innerHTML = `
      <div class="terminal-chart-heading"><div><span class="terminal-label">Five-year performance</span><h4>Revenue and EBITDA margin</h4></div><div class="terminal-legend"><span><i></i>Revenue (Rs Cr)</span><span><i></i>EBITDA margin</span></div></div>
      <div class="terminal-chart-shell"><canvas id="terminal-financial-chart" role="img" aria-label="${data.name} revenue and EBITDA margin from FY22 to FY26"></canvas></div>
      <div class="terminal-table-wrap"><table class="terminal-table"><thead><tr><th>Metric</th>${data.years.map(year => `<th>${year}</th>`).join('')}</tr></thead><tbody><tr><th>Revenue (Rs Cr)</th>${data.historicalRevenue.map(value => `<td>${Math.round(value).toLocaleString('en-IN')}</td>`).join('')}</tr><tr><th>EBITDA margin</th>${data.historicalMargin.map(value => `<td>${value.toFixed(1)}%</td>`).join('')}</tr></tbody></table></div>`;
  }

  function renderForecasts(data) {
    const scenarioMap = { bear: { growth: .75, margin: -data.assumptions.marginShift, capex: 1.10 }, base: { growth: 1, margin: 0, capex: 1 }, bull: { growth: 1.20, margin: data.assumptions.marginShift, capex: .95 } };
    const scenario = scenarioMap[forecastScenario];
    const adjustedGrowth = data.assumptions.growth.map(value => value * scenario.growth);
    const scenarioRevenue = adjustedGrowth.reduce((value, growth) => value * (1 + growth / 100), data.revenue);
    const scenarioMargin = data.assumptions.margin.at(-1) + scenario.margin;
    const scenarioProfit = data.forecast.profit * (scenarioRevenue / data.forecast.revenue) * (scenarioMargin / data.forecast.margin);
    const revenueGrowth = (scenarioRevenue / data.revenue - 1) * 100;
    const profitGrowth = (scenarioProfit / data.profit - 1) * 100;
    document.querySelector('#terminal-forecasts').innerHTML = `
      <div class="forecast-toolbar"><div><span class="terminal-label">Interactive scenario</span><strong>${forecastScenario[0].toUpperCase() + forecastScenario.slice(1)} case</strong></div><div class="forecast-scenarios" role="group" aria-label="Forecast scenario"><button type="button" data-forecast-scenario="bear" class="${forecastScenario === 'bear' ? 'is-active' : ''}" aria-pressed="${forecastScenario === 'bear'}">Bear</button><button type="button" data-forecast-scenario="base" class="${forecastScenario === 'base' ? 'is-active' : ''}" aria-pressed="${forecastScenario === 'base'}">Base</button><button type="button" data-forecast-scenario="bull" class="${forecastScenario === 'bull' ? 'is-active' : ''}" aria-pressed="${forecastScenario === 'bull'}">Bull</button></div></div>
      <div class="forecast-grid">
        <article><span>Revenue</span><strong>${crore(data.revenue)}</strong><small>FY26 actual</small><div class="forecast-line"><i style="width:${Math.min(100, 55 + revenueGrowth / 2)}%"></i></div><strong>${crore(scenarioRevenue)}</strong><small>FY31 scenario · +${revenueGrowth.toFixed(0)}%</small></article>
        <article><span>Net profit</span><strong>${crore(data.profit)}</strong><small>FY26 actual</small><div class="forecast-line"><i style="width:${Math.min(100, 45 + profitGrowth / 3)}%"></i></div><strong>${crore(scenarioProfit)}</strong><small>FY31 scenario · +${profitGrowth.toFixed(0)}%</small></article>
        <article><span>EBITDA margin</span><strong>${data.ebitdaMargin.toFixed(1)}%</strong><small>FY26 actual</small><div class="forecast-line"><i style="width:${Math.min(100, scenarioMargin * 4)}%"></i></div><strong>${scenarioMargin.toFixed(1)}%</strong><small>FY31 scenario · ${(scenarioMargin - data.ebitdaMargin >= 0 ? '+' : '')}${(scenarioMargin - data.ebitdaMargin).toFixed(1)} pts</small></article>
      </div>
      <div class="assumption-section"><div class="assumption-heading"><div><span class="terminal-label">Assumptions & rationale</span><h4>What the forecast assumes—and why</h4></div><p>${data.assumptions.sourceNote}</p></div><div class="assumption-grid">${data.assumptions.grounds.map(([title, range, reason, sensitivity], index) => `<details ${index === 0 ? 'open' : ''}><summary><span>${title}</span><strong>${range}</strong><b>+</b></summary><div class="assumption-detail"><p>${reason}</p><aside><span>What could change it</span><p>${sensitivity}</p></aside></div></details>`).join('')}</div></div>`;
  }

  function renderThesis(data) {
    document.querySelector('#terminal-thesis').innerHTML = `
      <div class="thesis-header">
        <div><span class="terminal-label">Research stance · not an investment recommendation</span><strong>${data.stance}</strong></div>
        <div><span>Conviction</span><b>${data.conviction}</b></div>
      </div>
      <div class="terminal-content-grid thesis-main-grid">
        <article class="terminal-block thesis-copy"><span class="terminal-label">Core investment view</span><p>${data.thesis}</p></article>
        <article class="terminal-block key-debate"><span class="terminal-label">Key debate</span><h4>${data.debate}</h4></article>
      </div>
      <div class="thesis-evidence"><span class="terminal-label">Evidence supporting the view</span>${data.evidence.map((item, index) => `<article><b>0${index + 1}</b><p>${item}</p></article>`).join('')}</div>
      <div class="case-grid">${data.cases.map(([title, copy], index) => `<article class="case-${index}"><span>${title}</span><p>${copy}</p></article>`).join('')}</div>
      <div class="view-change"><span class="terminal-label">What would change the view?</span><p>${data.viewChange}</p></div>
      <div class="terminal-content-grid thesis-lower-grid"><article class="terminal-block"><span class="terminal-label">Potential catalysts</span><ol class="terminal-list">${data.catalysts.map((item, index) => `<li><span>0${index + 1}</span>${item}</li>`).join('')}</ol></article><article class="terminal-block"><span class="terminal-label">Valuation context</span><dl class="terminal-metrics"><div><dt>P/E</dt><dd>${data.pe.toFixed(1)}x</dd></div><div><dt>EV / EBITDA</dt><dd>${data.evEbitda.toFixed(1)}x</dd></div><div><dt>ROE</dt><dd>${data.roe.toFixed(1)}%</dd></div><div><dt>ROCE</dt><dd>${data.roce.toFixed(1)}%</dd></div></dl></article></div>`;
  }

  function renderRisks(data) {
    document.querySelector('#terminal-risks').innerHTML = `<div class="risk-grid">${data.risks.map(([risk, level, note]) => `<article><div><span>${risk}</span><b class="risk-${level.toLowerCase()}">${level}</b></div><p>${note}</p></article>`).join('')}</div>`;
  }

  function drawFinancialChart(data) {
    const canvas = document.querySelector('#terminal-financial-chart');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const w = rect.width, h = rect.height, compact = w < 520;
    const pad = { left: compact ? 42 : 58, right: compact ? 38 : 54, top: 24, bottom: 36 };
    const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;
    const maxRevenue = Math.ceil(Math.max(...data.historicalRevenue) / 1000) * 1000;
    const maxMargin = Math.ceil(Math.max(...data.historicalMargin) / 5) * 5;
    const x = index => pad.left + pw * (index + .5) / data.years.length;
    const revenueY = value => pad.top + ph - value / maxRevenue * ph;
    const marginY = value => pad.top + ph - value / maxMargin * ph;
    const css = getComputedStyle(document.documentElement);
    const acid = css.getPropertyValue('--acid').trim() || '#d7ff52';
    const orange = css.getPropertyValue('--orange').trim() || '#ff6846';
    context.clearRect(0, 0, w, h); context.font = `${compact ? 9 : 10}px DM Mono, monospace`; context.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ph * i / 4; context.strokeStyle = 'rgba(255,255,255,.12)'; context.lineWidth = 1; context.beginPath(); context.moveTo(pad.left, y); context.lineTo(w - pad.right, y); context.stroke();
      context.fillStyle = 'rgba(220,224,214,.58)'; context.textAlign = 'right'; context.fillText(Math.round(maxRevenue * (4 - i) / 4).toLocaleString('en-IN'), pad.left - 8, y);
    }
    data.historicalRevenue.forEach((value, index) => { const barWidth = Math.min(44, pw / data.years.length * .52); const top = revenueY(value); context.fillStyle = acid; context.fillRect(x(index) - barWidth / 2, top, barWidth, pad.top + ph - top); context.fillStyle = 'rgba(220,224,214,.65)'; context.textAlign = 'center'; context.fillText(data.years[index], x(index), h - 13); });
    context.strokeStyle = orange; context.lineWidth = 3; context.beginPath(); data.historicalMargin.forEach((value, index) => { const px = x(index), py = marginY(value); index ? context.lineTo(px, py) : context.moveTo(px, py); }); context.stroke();
    data.historicalMargin.forEach((value, index) => { context.fillStyle = orange; context.beginPath(); context.arc(x(index), marginY(value), 4, 0, Math.PI * 2); context.fill(); });
    context.fillStyle = orange; context.textAlign = 'right'; context.fillText(`${data.historicalMargin.at(-1).toFixed(1)}%`, w - 4, marginY(data.historicalMargin.at(-1)));
  }

  function renderTerminal() {
    const data = terminalData[activeCompany];
    setTerminalText('terminal-code', data.code); setTerminalText('terminal-sector', data.sector); setTerminalText('terminal-company-name', data.name); setTerminalText('terminal-price', `${data.priceLabel}: ${data.price}`);
    document.querySelector('#terminal-profile-link').href = data.profile; document.querySelector('#terminal-model-link').href = data.model;
    renderOverview(data); renderFinancials(data); renderForecasts(data); renderThesis(data); renderRisks(data);
    document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== activeTab; });
    if (activeTab === 'financials') requestAnimationFrame(() => drawFinancialChart(data));
  }

  function renderOnePagerExplorer() {
    const container = document.querySelector('#one-pager-content');
    if (!container) return;
    const data = terminalData[explorerCompany];
    const logoMap = { tata: 'assets/logos/tata-technologies.svg', havells: 'assets/logos/havells.svg', itc: 'assets/logos/itc.png', hul: 'assets/logos/hindustan-unilever.png' };
    const logo = logoMap[explorerCompany];
    const companyMark = logo ? `<img src="${logo}" alt="${data.name} logo" />` : `<span class="explorer-monogram" aria-hidden="true">${data.monogram}</span>`;
    const returnLabel = data.onePager.returnLabel || 'ROCE';
    const businessModel = businessModels[explorerCompany];
    const views = {
      snapshot: `<div class="explorer-snapshot"><article class="explorer-story"><span class="terminal-label">Company at a glance</span><p>${data.onePager.description}</p><dl><div><dt>Founded</dt><dd>${data.onePager.founded}</dd></div><div><dt>Headquarters</dt><dd>${data.onePager.headquarters}</dd></div><div><dt>Sector</dt><dd>${data.sector}</dd></div></dl><div class="explorer-focus"><span class="terminal-label">Research priorities</span>${data.onePager.watch.map(([item,reason],index) => `<p><b>0${index+1}</b><span><strong>${item}</strong><small>${reason}</small></span></p>`).join('')}</div></article><article class="explorer-scoreboard"><span class="terminal-label">FY26 financial snapshot</span><div><p><small>Revenue</small><strong>${crore(data.revenue)}</strong></p><p><small>Net profit</small><strong>${crore(data.profit)}</strong></p><p><small>${returnLabel}</small><strong>${data.roce.toFixed(1)}%</strong></p><p><small>P/E</small><strong>${data.pe.toFixed(1)}x</strong></p></div><aside><strong>What the numbers indicate</strong><p>${data.onePager.performance}</p></aside></article></div>`,
      business: `<div class="business-model-view"><article class="business-model-core"><span class="terminal-label">How the business works</span><h4>${businessModel.headline}</h4><p>${businessModel.summary}</p><div class="business-model-flow" role="list" aria-label="${data.name} value creation flow">${businessModel.flow.map(([title,copy],index) => `<div role="listitem"><b>0${index+1}</b><strong>${title}</strong><span>${copy}</span></div>`).join('')}</div></article><section class="business-model-engines"><span class="terminal-label">Revenue engines</span><div>${businessModel.engines.map(([title,earnings,logic],index) => `<article><b>0${index+1}</b><div><h5>${title}</h5><strong>${earnings}</strong><p>${logic}</p></div></article>`).join('')}</div></section><aside class="business-model-economics"><span class="terminal-label">Key economics</span><div>${businessModel.economics.map(([label,copy]) => `<article><strong>${label}</strong><p>${copy}</p></article>`).join('')}</div></aside></div>`,
      lens: `<div class="explorer-lens"><article><span class="terminal-label">Investment lens</span><h4>${data.stance}</h4><p>${data.thesis}</p></article><article><span class="terminal-label">What to monitor—and why</span>${data.onePager.watch.map(([item,reason]) => `<details><summary><i></i><strong>${item}</strong><b>+</b></summary><p>${reason}</p></details>`).join('')}</article><article class="explorer-valuation"><span class="terminal-label">Valuation & returns</span><div><p><small>EV / EBITDA</small><strong>${data.evEbitda.toFixed(1)}x</strong></p><p><small>ROE</small><strong>${data.roe.toFixed(1)}%</strong></p><p><small>EBITDA margin</small><strong>${data.ebitdaMargin.toFixed(1)}%</strong></p></div><aside><strong>Valuation interpretation</strong><p>${data.onePager.valuation}</p></aside></article></div>`
    };
    container.innerHTML = `<div class="explorer-company-banner"><div class="explorer-logo">${companyMark}</div><div><span>${data.code}</span><h4>${data.name}</h4><p>${data.priceLabel}: ${data.price}</p></div><a href="${data.profile}" target="_blank" rel="noopener">Open full one-pager ↗</a></div><div class="explorer-tabs" role="tablist" aria-label="One-pager views"><button type="button" data-explorer-view="snapshot" class="${explorerView === 'snapshot' ? 'is-active' : ''}" aria-selected="${explorerView === 'snapshot'}">Snapshot</button><button type="button" data-explorer-view="business" class="${explorerView === 'business' ? 'is-active' : ''}" aria-selected="${explorerView === 'business'}">Business model</button><button type="button" data-explorer-view="lens" class="${explorerView === 'lens' ? 'is-active' : ''}" aria-selected="${explorerView === 'lens'}">Investment lens</button></div><div class="explorer-view">${views[explorerView]}</div>`;
  }

  document.querySelectorAll('[data-company]').forEach(button => button.addEventListener('click', () => {
    activeCompany = button.dataset.company;
    forecastScenario = 'base';
    document.querySelectorAll('[data-company]').forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    renderTerminal();
  }));
  document.querySelectorAll('[data-terminal-tab]').forEach(button => button.addEventListener('click', () => {
    activeTab = button.dataset.terminalTab;
    document.querySelectorAll('[data-terminal-tab]').forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); });
    renderTerminal();
  }));
  researchTerminal.addEventListener('click', (event) => {
    const button = event.target.closest('[data-forecast-scenario]');
    if (!button) return;
    forecastScenario = button.dataset.forecastScenario;
    renderForecasts(terminalData[activeCompany]);
  });
  document.querySelectorAll('[data-explorer-company]').forEach(button => button.addEventListener('click', () => {
    explorerCompany = button.dataset.explorerCompany;
    explorerView = 'snapshot';
    document.querySelectorAll('[data-explorer-company]').forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    renderOnePagerExplorer();
  }));
  document.querySelector('#one-pager-explorer')?.addEventListener('click', event => {
    const button = event.target.closest('[data-explorer-view]');
    if (!button) return;
    explorerView = button.dataset.explorerView;
    renderOnePagerExplorer();
  });
  window.addEventListener('resize', () => { if (activeTab === 'financials') drawFinancialChart(terminalData[activeCompany]); }, { passive: true });
  renderTerminal();
  renderOnePagerExplorer();
}

const ipoFeature = document.querySelector('.ipo-project-feature');

if (ipoFeature) {
  const ipoTabs = [...ipoFeature.querySelectorAll('[data-ipo-tab]')];
  const ipoPanels = [...ipoFeature.querySelectorAll('[data-ipo-panel]')];

  const selectIpoView = (view) => {
    ipoTabs.forEach((button) => {
      const active = button.dataset.ipoTab === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    ipoPanels.forEach((panel) => {
      panel.hidden = panel.dataset.ipoPanel !== view;
    });
  };

  ipoTabs.forEach((button, index) => {
    button.addEventListener('click', () => selectIpoView(button.dataset.ipoTab));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % ipoTabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + ipoTabs.length) % ipoTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = ipoTabs.length - 1;
      ipoTabs[nextIndex].focus();
      selectIpoView(ipoTabs[nextIndex].dataset.ipoTab);
    });
  });

  selectIpoView('overview');
}

const mobileProjectSwitcher = document.querySelector('.mobile-project-switcher');

if (mobileProjectSwitcher) {
  const mobileProjectQuery = window.matchMedia('(max-width: 700px)');
  const mobileProjectButtons = [...mobileProjectSwitcher.querySelectorAll('[data-mobile-project]')];
  const mobileProjectModules = new Map(
    mobileProjectButtons.map((button) => [button.dataset.mobileProject, document.getElementById(button.dataset.mobileProject)])
  );
  let activeMobileProject = 'one-pager-explorer';

  const showMobileProject = (projectId, shouldScroll = false) => {
    if (!mobileProjectModules.has(projectId)) return;
    activeMobileProject = projectId;
    const compact = mobileProjectQuery.matches;

    mobileProjectButtons.forEach((button) => {
      const active = button.dataset.mobileProject === activeMobileProject;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    mobileProjectModules.forEach((module, id) => {
      if (!module) return;
      module.classList.toggle('mobile-project-hidden', compact && id !== activeMobileProject);
      if (compact) module.setAttribute('aria-hidden', String(id !== activeMobileProject));
      else module.removeAttribute('aria-hidden');
    });

    if (compact && shouldScroll) {
      requestAnimationFrame(() => mobileProjectSwitcher.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  mobileProjectButtons.forEach((button) => {
    button.addEventListener('click', () => showMobileProject(button.dataset.mobileProject, true));
  });

  document.querySelectorAll('a[href="#one-pager-explorer"], a[href="#prototype"], a[href="#ipo-analysis"]').forEach((link) => {
    link.addEventListener('click', () => showMobileProject(link.getAttribute('href').slice(1), false));
  });

  const hashProject = window.location.hash.slice(1);
  if (mobileProjectModules.has(hashProject)) activeMobileProject = hashProject;
  showMobileProject(activeMobileProject);
  mobileProjectQuery.addEventListener('change', () => showMobileProject(activeMobileProject));
}

const ipoDashboardFrame = document.querySelector('.ipo-dashboard-frame');

if (ipoDashboardFrame) {
  const syncDashboardHeight = (height) => {
    if (window.matchMedia('(max-width: 700px)').matches) {
      ipoDashboardFrame.style.height = `${Math.max(560, Math.min(1100, Math.ceil(height) + 4))}px`;
    } else {
      ipoDashboardFrame.style.removeProperty('height');
    }
  };

  window.addEventListener('message', (event) => {
    if (event.source !== ipoDashboardFrame.contentWindow || event.data?.type !== 'ipo-dashboard-height') return;
    syncDashboardHeight(Number(event.data.height) || 760);
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 700px)').matches) ipoDashboardFrame.style.removeProperty('height');
  }, { passive:true });
}

document.querySelectorAll('.timeline-item').forEach((item) => {
  const main = item.querySelector('.timeline-main');
  if (!main) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mobile-detail-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span>View details</span><b>+</b>';
  button.addEventListener('click', () => {
    const expanded = item.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.querySelector('span').textContent = expanded ? 'Show less' : 'View details';
    button.querySelector('b').textContent = expanded ? '−' : '+';
  });
  main.append(button);
});

const mobileSkillGroups = [...document.querySelectorAll('.skill-group')];

mobileSkillGroups.forEach((group, index) => {
  const heading = group.querySelector('h3');
  if (!heading) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mobile-skill-toggle';
  button.setAttribute('aria-expanded', String(index === 0));
  button.setAttribute('aria-label', `Toggle ${heading.textContent} skills`);
  button.textContent = index === 0 ? '−' : '+';
  group.classList.toggle('is-expanded', index === 0);
  button.addEventListener('click', () => {
    const willOpen = !group.classList.contains('is-expanded');
    mobileSkillGroups.forEach((item) => {
      item.classList.remove('is-expanded');
      const itemButton = item.querySelector('.mobile-skill-toggle');
      if (itemButton) { itemButton.textContent = '+'; itemButton.setAttribute('aria-expanded', 'false'); }
    });
    if (willOpen) {
      group.classList.add('is-expanded');
      button.textContent = '−';
      button.setAttribute('aria-expanded', 'true');
    }
  });
  group.append(button);
});

const mobileQuickNav = document.querySelector('.mobile-quick-nav');

if (mobileQuickNav) {
  const toggle = mobileQuickNav.querySelector('.mobile-quick-nav-toggle');
  const closeQuickNav = () => {
    mobileQuickNav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('span').textContent = '+';
  };
  toggle.addEventListener('click', () => {
    const open = mobileQuickNav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '×' : '+';
  });
  mobileQuickNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeQuickNav));
}
