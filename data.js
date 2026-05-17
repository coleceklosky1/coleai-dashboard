// ─── COMPANIES ────────────────────────────────────────────────────────────────
const COMPANIES = [
  {id:0,company:"Pfizer",industry:"Pharma / Biotech",size:"Mega-cap (~$160B, PFE)",roles:"Process dev, manufacturing science, drug substance/product, formulation",url:"https://pfizer.com/careers",window:"Sept – Feb",hubs:"Groton CT, Andover MA, Pearl River NY, St. Louis",biotech:"Yes",notes:"Look for 'Manufacturing & Operations' and 'BioTherapeutics Pharma Sciences' intern tracks"},
  {id:1,company:"Merck (MSD)",industry:"Pharma / Biotech",size:"Mega-cap (~$300B, MRK)",roles:"Process eng, MSAT, bioprocess dev, vaccine ops",url:"https://jobs.merck.com",window:"Sept – Jan",hubs:"Rahway NJ, West Point PA, Durham NC, Wilson NC",biotech:"Yes",notes:"Strong manufacturing internship pipeline; Wilson NC is a major vaccine site"},
  {id:2,company:"Eli Lilly",industry:"Pharma / Biotech",size:"Mega-cap (~$700B, LLY)",roles:"Process chem, MSAT, drug product mfg, automation",url:"https://careers.lilly.com",window:"Aug – Nov",hubs:"Indianapolis IN, Concord NC, Branchburg NJ",biotech:"Yes",notes:"Strong ND pipeline; Indy is ~2.5 hrs from South Bend. Famous LRDP grad rotation"},
  {id:3,company:"Bristol Myers Squibb",industry:"Pharma / Biotech",size:"Large-cap (~$110B, BMY)",roles:"Bioprocess, drug product, manufacturing science",url:"https://careers.bms.com",window:"Sept – Jan",hubs:"Devens MA, New Brunswick NJ, Bothell WA, Summit NJ",biotech:"Yes",notes:"Excellent biologics / cell therapy programs; co-op options also available"},
  {id:4,company:"Johnson & Johnson",industry:"Pharma / Biotech",size:"Mega-cap (~$385B, JNJ)",roles:"Process eng, drug delivery, device manufacturing",url:"https://careers.jnj.com",window:"Sept – Dec",hubs:"Raritan NJ, Spring House PA, Titusville NJ, Cincinnati OH",biotech:"Yes",notes:"Co-op (6 mo) and summer (10–12 wk) options"},
  {id:5,company:"AbbVie",industry:"Pharma / Biotech",size:"Mega-cap (~$350B, ABBV)",roles:"Manufacturing science, process dev, drug product",url:"https://careers.abbvie.com",window:"Sept – Jan",hubs:"North Chicago IL, Worcester MA, Branchburg NJ",biotech:"Yes",notes:"North Chicago HQ has very large intern class"},
  {id:6,company:"Genentech (Roche)",industry:"Pharma / Biotech",size:"Mega-cap (~$280B, parent: Roche)",roles:"Bioprocess dev, MSAT, late-stage cell culture",url:"https://careers.gene.com",window:"Dec – early Feb",hubs:"South San Francisco CA, Hillsboro OR, Vacaville CA, Oceanside CA",biotech:"Yes",notes:"Aspirational biotech program; very competitive but pays well (~$40+/hr historically)"},
  {id:7,company:"Amgen",industry:"Pharma / Biotech",size:"Large-cap (~$150B, AMGN)",roles:"Process dev, drug substance, drug product",url:"https://careers.amgen.com",window:"Oct – Jan",hubs:"Thousand Oaks CA, Cambridge MA, Tampa FL, Holly Springs NC",biotech:"Yes",notes:"Amgen Scholars summer research program is separate — apply Nov 1 via amgenscholars.com"},
  {id:8,company:"Regeneron",industry:"Pharma / Biotech",size:"Large-cap (~$80B, REGN)",roles:"Cell culture, purification, drug product, ind. ops",url:"https://careers.regeneron.com",window:"Sept – Dec",hubs:"Tarrytown NY, Rensselaer NY",biotech:"Yes",notes:"Tuition reimbursement for current students; competitive"},
  {id:9,company:"Vertex Pharmaceuticals",industry:"Pharma / Biotech",size:"Large-cap (~$120B, VRTX)",roles:"Process eng, formulation, drug product",url:"https://vrtx.com/careers",window:"Oct – Jan",hubs:"Boston MA, San Diego CA, Providence RI",biotech:"Yes",notes:"Smaller intern cohorts but well-mentored"},
  {id:10,company:"Moderna",industry:"Pharma / Biotech",size:"Mid-cap (~$15B, MRNA)",roles:"mRNA process dev, formulation, manufacturing eng",url:"https://modernatx.com/careers",window:"Oct – Feb",hubs:"Cambridge MA, Norwood MA, Marlborough MA",biotech:"Yes",notes:"Heavy on lipid-nanoparticle / RNA process work"},
  {id:11,company:"Biogen",industry:"Pharma / Biotech",size:"Mid-cap (~$28B, BIIB)",roles:"Bioprocess, MSAT, drug product, mfg ops",url:"https://biogen.com/careers",window:"Dec – early Feb",hubs:"Cambridge MA, RTP NC",biotech:"Yes",notes:"12-week structured summer program"},
  {id:12,company:"Novo Nordisk",industry:"Pharma / Biotech",size:"Mega-cap (~$500B, NVO)",roles:"API mfg, drug product, process eng, automation",url:"https://novonordisk-us.com/careers",window:"Fall + Spring rolling",hubs:"Plainsboro NJ, Clayton NC, West Lebanon NH",biotech:"Yes",notes:"Massive expansion of US manufacturing — chem eng demand high"},
  {id:13,company:"Gilead Sciences",industry:"Pharma / Biotech",size:"Large-cap (~$90B, GILD)",roles:"Drug substance, drug product, process chem",url:"https://gilead.com/careers",window:"Oct – Jan",hubs:"Foster City CA, La Verne CA, Oceanside CA",biotech:"Yes",notes:""},
  {id:14,company:"Sanofi",industry:"Pharma / Biotech",size:"Large-cap (~$130B, SNY)",roles:"MSAT, vaccine ops, bioprocess",url:"https://sanofi.com/careers",window:"Sept – Dec",hubs:"Cambridge MA, Swiftwater PA, Framingham MA",biotech:"Yes",notes:""},
  {id:15,company:"Novartis",industry:"Pharma / Biotech",size:"Mega-cap (~$215B, NVS)",roles:"Process eng, CGT manufacturing, drug product",url:"https://novartis.com/careers",window:"Sept – Jan",hubs:"East Hanover NJ, Cambridge MA, Morris Plains NJ",biotech:"Yes",notes:""},
  {id:16,company:"AstraZeneca",industry:"Pharma / Biotech",size:"Mega-cap (~$220B, AZN)",roles:"Drug substance, drug product, manufacturing",url:"https://careers.astrazeneca.com",window:"Sept – Jan",hubs:"Gaithersburg MD, Wilmington DE, Boston MA",biotech:"Yes",notes:""},
  {id:17,company:"BioMarin",industry:"Pharma / Biotech",size:"Mid-cap (~$15B, BMRN)",roles:"Cell culture, purification, drug product",url:"https://careers.biomarin.com",window:"Oct – Jan",hubs:"San Rafael CA, Novato CA",biotech:"Yes",notes:"Smaller program but strong gene-therapy exposure"},
  {id:18,company:"Alnylam",industry:"Pharma / Biotech",size:"Mid-cap (~$30B, ALNY)",roles:"Process dev, drug product, oligonucleotide chem",url:"https://alnylam.com/careers",window:"Oct – Jan",hubs:"Cambridge MA, Norton MA",biotech:"Yes",notes:"Niche but exploding subfield"},
  {id:19,company:"Ginkgo Bioworks",industry:"Pharma / Biotech",size:"Small-cap (~$1B, DNA)",roles:"Bioprocess, fermentation, strain engineering",url:"https://ginkgobioworks.com/careers",window:"Rolling",hubs:"Boston MA",biotech:"Yes",notes:"Largest synbio platform co.; lots of fermentation / scale-up work"},
  {id:20,company:"Generate Biomedicines",industry:"Pharma / Biotech",size:"Private (~$2B val.)",roles:"Process dev, formulation, AI/ML-adjacent biotech",url:"https://generatebiomedicines.com/careers",window:"Rolling",hubs:"Somerville MA, Andover MA",biotech:"Yes",notes:"Hot startup at AI + biotech intersection"},
  {id:21,company:"Recursion",industry:"Pharma / Biotech",size:"Small-cap (~$2B, RXRX)",roles:"Bioprocess, automation, AI/ML-adjacent biotech",url:"https://recursion.com/careers",window:"Rolling",hubs:"Salt Lake City UT, Toronto, Milpitas CA",biotech:"Yes",notes:""},
  {id:22,company:"Asimov",industry:"Pharma / Biotech",size:"Private — Series B (~$200M raised)",roles:"Bioprocess, strain eng, CHO cell line dev",url:"https://asimov.com/careers",window:"Rolling",hubs:"Boston MA",biotech:"Yes",notes:"MIT spinoff; very technical mfg-focused biotech"},
  {id:23,company:"Beam Therapeutics",industry:"Pharma / Biotech",size:"Small-cap (~$2B, BEAM)",roles:"Process dev, drug product, LNP/cell mfg",url:"https://beamtx.com/careers",window:"Rolling",hubs:"Cambridge MA, RTP NC",biotech:"Yes",notes:"CRISPR-adjacent gene editing leader"},
  {id:24,company:"Dow",industry:"Specialty Chemicals",size:"Mid-cap (~$30B, DOW)",roles:"Process eng, R&D, applications, EHS",url:"https://careers.dow.com",window:"Aug – Nov",hubs:"Midland MI, Freeport TX, Lake Jackson TX, Plaquemine LA",biotech:"Tangential",notes:"Famous co-op program; large summer intern class"},
  {id:25,company:"DuPont",industry:"Specialty Chemicals",size:"Mid-cap (~$30B, DD)",roles:"Process eng, R&D, applications, mfg ops",url:"https://careers.dupont.com",window:"Aug – Nov",hubs:"Wilmington DE, Midland MI, Circleville OH",biotech:"Tangential",notes:""},
  {id:26,company:"BASF",industry:"Specialty Chemicals",size:"Large-cap (~$50B, BASFY)",roles:"Process eng, R&D, manufacturing, supply chain",url:"https://basf.com/careers",window:"Aug – Nov",hubs:"Florham Park NJ, Wyandotte MI, Geismar LA, Freeport TX",biotech:"Tangential",notes:""},
  {id:27,company:"LyondellBasell",industry:"Specialty Chemicals",size:"Mid-cap (~$30B, LYB)",roles:"Process eng, ops, plant engineering",url:"https://lyondellbasell.com/careers",window:"Aug – Nov",hubs:"Houston TX, La Porte TX, Channelview TX, Bayport TX",biotech:"No",notes:""},
  {id:28,company:"3M",industry:"Specialty Chemicals",size:"Large-cap (~$70B, MMM)",roles:"Process eng, product dev, manufacturing",url:"https://3m.com/careers",window:"Sept – Dec",hubs:"Maplewood MN, Cottage Grove MN, multiple US sites",biotech:"Tangential",notes:"Massive R&D engine — great if you like physical chemistry / materials"},
  {id:29,company:"Eastman Chemical",industry:"Specialty Chemicals",size:"Mid-cap (~$10B, EMN)",roles:"Process eng, R&D, manufacturing",url:"https://eastman.com/careers",window:"Aug – Dec",hubs:"Kingsport TN",biotech:"No",notes:"Co-op program is the main entry pipeline"},
  {id:30,company:"Air Products",industry:"Specialty Chemicals",size:"Large-cap (~$60B, APD)",roles:"Process eng, plant eng, hydrogen + cryo systems",url:"https://airproducts.com/careers",window:"Aug – Nov",hubs:"Allentown PA, Houston TX, multiple plant sites",biotech:"Tangential",notes:"Heavy growth in hydrogen — great if interested in energy transition"},
  {id:31,company:"Linde",industry:"Specialty Chemicals",size:"Mega-cap (~$210B, LIN)",roles:"Process eng, plant ops, hydrogen",url:"https://jobs.linde.com",window:"Aug – Nov",hubs:"Danbury CT, Houston TX, multiple plant sites",biotech:"Tangential",notes:""},
  {id:32,company:"PPG",industry:"Specialty Chemicals",size:"Mid-cap (~$30B, PPG)",roles:"Process eng, formulations, R&D",url:"https://ppg.com/careers",window:"Sept – Dec",hubs:"Pittsburgh PA, multiple US plants",biotech:"No",notes:""},
  {id:33,company:"Sherwin-Williams",industry:"Specialty Chemicals",size:"Large-cap (~$80B, SHW)",roles:"Process eng, formulations, ops",url:"https://careers.sherwin-williams.com",window:"Sept – Dec",hubs:"Cleveland OH, multiple US plants",biotech:"No",notes:""},
  {id:34,company:"Honeywell (PMT)",industry:"Specialty Chemicals",size:"Large-cap (~$140B, HON)",roles:"Process eng, applications, mfg",url:"https://careers.honeywell.com",window:"Aug – Nov",hubs:"Charlotte NC, Houston TX, multiple US sites",biotech:"No",notes:""},
  {id:35,company:"Celanese",industry:"Specialty Chemicals",size:"Mid-cap (~$15B, CE)",roles:"Process eng, plant eng, R&D",url:"https://celanese.com/careers",window:"Aug – Nov",hubs:"Irving TX, Clear Lake TX, Bishop TX",biotech:"No",notes:""},
  {id:36,company:"Solugen",industry:"Specialty Chemicals",size:"Private (~$2B val.)",roles:"Bioprocess, fermentation, scale-up, plant eng",url:"https://solugen.com/careers",window:"Rolling",hubs:"Houston TX, Marshall MN",biotech:"Tangential",notes:"Building bio-based chemical plants from scratch; very ChemE-heavy"},
  {id:37,company:"LanzaTech",industry:"Specialty Chemicals",size:"Micro-cap (~$300M, LNZA)",roles:"Fermentation, bioreactor scale-up, process eng",url:"https://lanzatech.com/careers",window:"Rolling",hubs:"Skokie IL",biotech:"Tangential",notes:"Carbon recycling / industrial bio; cool tech but financially tight"},
  {id:38,company:"ExxonMobil",industry:"Oil & Gas / Refining",size:"Mega-cap (~$500B, XOM)",roles:"Process eng, refining, petrochemicals, R&D",url:"https://corporate.exxonmobil.com/careers",window:"Aug – Nov",hubs:"Houston TX, Spring TX, Baytown TX, Baton Rouge LA, Beaumont TX",biotech:"No",notes:"Pays among the best in the industry (~$40+/hr); ND has strong pipeline"},
  {id:39,company:"Chevron",industry:"Oil & Gas / Refining",size:"Mega-cap (~$280B, CVX)",roles:"Process eng, refining, facilities, earth sci",url:"https://careers.chevron.com",window:"Aug – Nov",hubs:"Houston TX, San Ramon CA, Richmond CA, Pascagoula MS",biotech:"No",notes:""},
  {id:40,company:"Shell",industry:"Oil & Gas / Refining",size:"Mega-cap (~$220B, SHEL)",roles:"Process eng, refining, energy transition",url:"https://shell.us/careers",window:"Aug – Nov",hubs:"Houston TX, Geismar LA, Norco LA, Deer Park TX",biotech:"No",notes:""},
  {id:41,company:"BP",industry:"Oil & Gas / Refining",size:"Large-cap (~$110B, BP)",roles:"Process eng, refining, energy transition",url:"https://bp.com/careers",window:"Aug – Nov",hubs:"Houston TX, Whiting IN, Cherry Point WA",biotech:"No",notes:"Whiting IN is close to ND — possible commute"},
  {id:42,company:"ConocoPhillips",industry:"Oil & Gas / Refining",size:"Large-cap (~$140B, COP)",roles:"Reservoir eng, facilities, process eng",url:"https://conocophillips.com/careers",window:"Aug – Nov",hubs:"Houston TX, Bartlesville OK, Anchorage AK",biotech:"No",notes:""},
  {id:43,company:"Marathon Petroleum",industry:"Oil & Gas / Refining",size:"Large-cap (~$70B, MPC)",roles:"Process eng, refining, plant eng",url:"https://jobs.marathonpetroleum.com",window:"Aug – Nov",hubs:"Findlay OH, multiple refineries",biotech:"No",notes:""},
  {id:44,company:"Phillips 66",industry:"Oil & Gas / Refining",size:"Large-cap (~$60B, PSX)",roles:"Process eng, refining, chemicals (CPChem)",url:"https://jobs.phillips66.com",window:"Aug – Nov",hubs:"Houston TX, Bartlesville OK, multiple refineries",biotech:"No",notes:""},
  {id:45,company:"Valero",industry:"Oil & Gas / Refining",size:"Large-cap (~$50B, VLO)",roles:"Process eng, refining, renewables",url:"https://valero.com/careers",window:"Aug – Nov",hubs:"San Antonio TX, multiple refineries",biotech:"No",notes:""},
  {id:46,company:"Schlumberger (SLB)",industry:"Oil & Gas / Refining",size:"Large-cap (~$70B, SLB)",roles:"Reservoir, completions, digital, new energies",url:"https://careers.slb.com",window:"Aug – Nov",hubs:"Houston TX, Sugar Land TX, plus global",biotech:"No",notes:"International rotation possible"},
  {id:47,company:"Procter & Gamble",industry:"CPG / Consumer",size:"Mega-cap (~$400B, PG)",roles:"Process eng, packaging, R&D, manufacturing",url:"https://pgcareers.com",window:"Aug – Oct",hubs:"Cincinnati OH, plus 30+ US plants",biotech:"No",notes:"Famous internship pipeline; ~70%+ return offers; great career launchpad"},
  {id:48,company:"Unilever",industry:"CPG / Consumer",size:"Large-cap (~$140B, UL)",roles:"Process eng, R&D, supply chain",url:"https://careers.unilever.com",window:"Sept – Dec",hubs:"Englewood Cliffs NJ, Trumbull CT, Jefferson City MO",biotech:"No",notes:""},
  {id:49,company:"Colgate-Palmolive",industry:"CPG / Consumer",size:"Large-cap (~$80B, CL)",roles:"Process eng, R&D, manufacturing",url:"https://jobs.colgate.com",window:"Sept – Dec",hubs:"New York NY, Piscataway NJ, multiple US plants",biotech:"No",notes:""},
  {id:50,company:"Kimberly-Clark",industry:"CPG / Consumer",size:"Large-cap (~$45B, KMB)",roles:"Process eng, R&D, manufacturing",url:"https://kimberly-clark.com/careers",window:"Sept – Dec",hubs:"Dallas TX, Neenah WI, multiple US plants",biotech:"No",notes:""},
  {id:51,company:"Clorox",industry:"CPG / Consumer",size:"Mid-cap (~$18B, CLX)",roles:"Process eng, R&D, formulations",url:"https://clorox.com/careers",window:"Sept – Dec",hubs:"Oakland CA, multiple US plants",biotech:"No",notes:""},
  {id:52,company:"L'Oréal",industry:"CPG / Consumer",size:"Mega-cap (~$240B, LRLCY)",roles:"Process eng, R&D, mfg",url:"https://careers.loreal.com",window:"Sept – Dec",hubs:"New York NY, Clark NJ, Florence KY, Little Rock AR",biotech:"Tangential",notes:"Cosmetic chemistry — great if you like formulation"},
  {id:53,company:"Estée Lauder",industry:"CPG / Consumer",size:"Mid-cap (~$30B, EL)",roles:"Process eng, R&D, mfg",url:"https://elcompanies.com/careers",window:"Sept – Dec",hubs:"Melville NY, Blaine MN, Bristol PA",biotech:"Tangential",notes:""},
  {id:54,company:"PepsiCo",industry:"Food & Beverage",size:"Mega-cap (~$220B, PEP)",roles:"Process eng, mfg, R&D, supply chain",url:"https://pepsicojobs.com",window:"Aug – Nov",hubs:"Purchase NY, Plano TX, multiple US plants",biotech:"No",notes:"Frito-Lay specifically hires huge intern classes"},
  {id:55,company:"Coca-Cola",industry:"Food & Beverage",size:"Mega-cap (~$280B, KO)",roles:"Process eng, mfg, R&D",url:"https://coca-colacompany.com/careers",window:"Sept – Dec",hubs:"Atlanta GA, multiple US bottling plants",biotech:"No",notes:""},
  {id:56,company:"Mondelez",industry:"Food & Beverage",size:"Large-cap (~$95B, MDLZ)",roles:"Process eng, mfg, R&D",url:"https://mondelezinternational.com/careers",window:"Sept – Dec",hubs:"East Hanover NJ, Chicago IL, multiple US plants",biotech:"No",notes:""},
  {id:57,company:"General Mills",industry:"Food & Beverage",size:"Mid-cap (~$40B, GIS)",roles:"Process eng, mfg, R&D",url:"https://careers.generalmills.com",window:"Sept – Dec",hubs:"Minneapolis MN, multiple US plants",biotech:"No",notes:""},
  {id:58,company:"Cargill",industry:"Food & Beverage",size:"Private (~$150B+ revenue)",roles:"Process eng, mfg, ag commodities",url:"https://careers.cargill.com",window:"Sept – Dec",hubs:"Wayzata MN, multiple US plants",biotech:"Tangential",notes:"Heavy on fermentation / biotechnology side too; largest US private company"},
  {id:59,company:"ADM",industry:"Food & Beverage",size:"Mid-cap (~$30B, ADM)",roles:"Process eng, fermentation, ingredients",url:"https://careers.adm.com",window:"Sept – Dec",hubs:"Chicago IL, Decatur IL",biotech:"Tangential",notes:"Bioprocess / fermentation crossover with biotech"},
  {id:60,company:"Corteva Agriscience",industry:"AgChem / Agriculture",size:"Mid-cap (~$45B, CTVA)",roles:"Process eng, formulations, ag chem mfg",url:"https://careers.corteva.com",window:"Sept – Dec",hubs:"Indianapolis IN, Johnston IA, multiple sites",biotech:"Tangential",notes:"Indianapolis HQ — close to ND"},
  {id:61,company:"Bayer Crop Science",industry:"AgChem / Agriculture",size:"Mid-cap (~$40B, BAYRY)",roles:"Process eng, formulations, R&D",url:"https://career.bayer.com",window:"Sept – Dec",hubs:"Whippany NJ, St. Louis MO, multiple US sites",biotech:"Tangential",notes:""},
  {id:62,company:"Intel",industry:"Semiconductors / Materials",size:"Large-cap (~$130B, INTC)",roles:"Process eng, etch/CVD/CMP, yield, materials",url:"https://jobs.intel.com",window:"Aug – Dec",hubs:"Hillsboro OR, Chandler AZ, Rio Rancho NM, Santa Clara CA",biotech:"No",notes:"Huge demand for chem eng process engineers"},
  {id:63,company:"Micron",industry:"Semiconductors / Materials",size:"Large-cap (~$120B, MU)",roles:"Process eng, photolith, etch, materials",url:"https://micron.com/careers",window:"Aug – Dec",hubs:"Boise ID, Manassas VA, Lehi UT",biotech:"No",notes:""},
  {id:64,company:"Texas Instruments",industry:"Semiconductors / Materials",size:"Mega-cap (~$170B, TXN)",roles:"Process eng, fab ops, packaging",url:"https://careers.ti.com",window:"Aug – Dec",hubs:"Dallas TX, Sherman TX, Lehi UT",biotech:"No",notes:""},
  {id:65,company:"Applied Materials",industry:"Semiconductors / Materials",size:"Mega-cap (~$160B, AMAT)",roles:"Process eng, applications eng, materials",url:"https://careers.appliedmaterials.com",window:"Aug – Dec",hubs:"Santa Clara CA, Austin TX, Hillsboro OR",biotech:"No",notes:""},
  {id:66,company:"Lam Research",industry:"Semiconductors / Materials",size:"Large-cap (~$110B, LRCX)",roles:"Process eng, applications eng, R&D",url:"https://careers.lamresearch.com",window:"Aug – Dec",hubs:"Fremont CA, Tualatin OR",biotech:"No",notes:""},
  {id:67,company:"Corning",industry:"Semiconductors / Materials",size:"Mid-cap (~$30B, GLW)",roles:"Process eng, materials, ceramics, R&D",url:"https://corning.com/careers",window:"Aug – Dec",hubs:"Corning NY, Wilmington NC, Painted Post NY",biotech:"Tangential",notes:"Glass/ceramics chemistry-heavy"},
  {id:68,company:"Tesla",industry:"Energy / Battery",size:"Mega-cap (~$1T, TSLA)",roles:"Battery cell eng, materials, manufacturing",url:"https://tesla.com/careers",window:"Rolling",hubs:"Fremont CA, Sparks NV, Austin TX, Buffalo NY",biotech:"No",notes:"Very relevant to your chem-E car / battery interest"},
  {id:69,company:"Form Energy",industry:"Energy / Battery",size:"Private (~$1.2B val.)",roles:"Electrochem, materials, manufacturing",url:"https://formenergy.com/careers",window:"Rolling",hubs:"Somerville MA, Berkeley CA, Weirton WV",biotech:"No",notes:"Hot startup but worth tracking"},
  {id:70,company:"QuantumScape",industry:"Energy / Battery",size:"Small-cap (~$3B, QS)",roles:"Electrochem, materials, process eng",url:"https://quantumscape.com/careers",window:"Rolling",hubs:"San Jose CA",biotech:"No",notes:""},
  {id:71,company:"Sila Nanotechnologies",industry:"Energy / Battery",size:"Private (~$3B val.)",roles:"Materials, electrochem, process eng, scale-up",url:"https://silanano.com/careers",window:"Rolling",hubs:"Alameda CA, Moses Lake WA",biotech:"No",notes:"Major EV materials startup; commercial-scale plant in WA"},
  {id:72,company:"Group14 Technologies",industry:"Energy / Battery",size:"Private (~$3B val.)",roles:"Materials, electrochem, scale-up",url:"https://group14.technology/careers",window:"Rolling",hubs:"Woodinville WA, Moses Lake WA",biotech:"No",notes:"Direct Sila competitor; SK + Porsche-backed"},
  {id:73,company:"Solid Power",industry:"Energy / Battery",size:"Micro-cap (~$300M, SLDP)",roles:"Electrochem, materials, scale-up",url:"https://solidpowerbattery.com/careers",window:"Rolling",hubs:"Louisville CO, Thornton CO",biotech:"No",notes:"BMW/Ford-backed; financially fragile but interesting tech"},
  {id:74,company:"Electric Hydrogen",industry:"Energy / Battery",size:"Private (~$1B val.)",roles:"Electrochem, membrane materials, plant eng",url:"https://eh2.com/careers",window:"Rolling",hubs:"Devens MA, Natick MA, San Jose CA",biotech:"No",notes:"First electrolyzer unicorn; massive scale-up underway"},
  {id:75,company:"Commonwealth Fusion Systems",industry:"Energy / Battery",size:"Private ($2B+ raised)",roles:"Materials, cryogenics, plasma-facing components",url:"https://cfs.energy/careers",window:"Rolling",hubs:"Devens MA, Cambridge MA",biotech:"No",notes:"Most-funded fusion startup; MIT spinoff"},
  {id:76,company:"Helion Energy",industry:"Energy / Battery",size:"Private ($2B+ raised)",roles:"Plasma, materials, cryogenics, power electronics",url:"https://helionenergy.com/careers",window:"Rolling",hubs:"Everett WA",biotech:"No",notes:"Sam Altman-backed; OpenAI signed first commercial fusion deal"},
  {id:77,company:"Westinghouse Electric",industry:"Nuclear",size:"Private (~$8B deal '23)",roles:"Reactor process eng, fuel, thermal-hydraulics, materials",url:"https://westinghousenuclear.com/careers",window:"Aug – Feb",hubs:"Cranberry Township PA, Columbia SC, Newington NH",biotech:"No",notes:"Iconic nuclear OEM; AP1000 is dominant Western Gen-III+ reactor"},
  {id:78,company:"GE Hitachi Nuclear Energy",industry:"Nuclear",size:"JV (GE Vernova ~$60B + Hitachi)",roles:"Reactor design, thermal-hydraulics, materials",url:"https://gevernova.com/careers",window:"Aug – Feb",hubs:"Wilmington NC, San Jose CA",biotech:"No",notes:"Leading the BWRX-300 SMR rollout (Ontario, TVA, Poland)"},
  {id:79,company:"BWXT",industry:"Nuclear",size:"Mid-cap (~$10B, BWXT)",roles:"Reactor mfg, materials, process eng, fuel",url:"https://careers.bwxt.com",window:"Aug – Feb",hubs:"Lynchburg VA, Erwin TN, multiple sites",biotech:"No",notes:"US Navy reactor builder; US citizens only"},
  {id:80,company:"Constellation Energy",industry:"Nuclear",size:"Large-cap (~$95B, CEG)",roles:"Plant eng, ops, chemistry, fuel",url:"https://jobs.constellationenergy.com",window:"Sept – Feb",hubs:"Baltimore MD, Kennett Square PA, multiple plants",biotech:"No",notes:"Operator side — fleet eng and ops more than design"},
  {id:81,company:"Holtec International",industry:"Nuclear",size:"Private ($1B+ revenue)",roles:"Reactor design, mechanical, materials",url:"https://holtecinternational.com/careers",window:"Aug – Feb",hubs:"Camden NJ, Marlton NJ, Pittsburgh PA, Palisades MI",biotech:"No",notes:""},
  {id:82,company:"NuScale Power",industry:"Nuclear",size:"Small-cap (~$1B, SMR)",roles:"Reactor design, thermal-hydraulics, materials",url:"https://nuscalepower.com/careers",window:"Aug – Feb",hubs:"Corvallis OR, Portland OR, Rockville MD",biotech:"No",notes:"First NRC-certified SMR design"},
  {id:83,company:"X-energy",industry:"Nuclear",size:"Private (Amazon-backed; ~$700M+ raised)",roles:"Reactor design, fuel (TRISO), materials, process eng",url:"https://x-energy.com/careers",window:"Rolling",hubs:"Rockville MD, Oak Ridge TN, Richland WA",biotech:"No",notes:"Amazon signed major deal for Xe-100 data center power"},
  {id:84,company:"TerraPower",industry:"Nuclear",size:"Private (Bill Gates-backed)",roles:"Reactor design, sodium chemistry, materials, fuel",url:"https://terrapower.com/careers",window:"Rolling",hubs:"Bellevue WA, Kemmerer WY",biotech:"No",notes:"Building first Natrium plant in Wyoming"},
  {id:85,company:"Oklo",industry:"Nuclear",size:"Small-cap (~$1B, OKLO)",roles:"Reactor design, fuel, materials",url:"https://oklo.com/careers",window:"Rolling",hubs:"Santa Clara CA, Idaho Falls ID",biotech:"No",notes:"Sam Altman-backed; publicly traded via DeSPAC"},
  {id:86,company:"Kairos Power",industry:"Nuclear",size:"Private (~$300M+ raised)",roles:"Reactor design, molten salt chemistry, materials",url:"https://kairospower.com/careers",window:"Rolling",hubs:"Alameda CA, Albuquerque NM, Oak Ridge TN",biotech:"No",notes:"Google signed power purchase agreement; molten salt chemistry is very chem-E"},
  {id:87,company:"Heirloom Carbon",industry:"Climate Tech",size:"Private (~$200M+ raised)",roles:"Process eng, mineral chem, scale-up",url:"https://heirloomcarbon.com/careers",window:"Rolling",hubs:"Brisbane CA, Tracy CA, Shreveport LA",biotech:"No",notes:"Stripe/Frontier-funded; first commercial DAC plant in US"},
  {id:88,company:"Boston Metal",industry:"Climate Tech",size:"Private (~$1.5B val.)",roles:"Electrochem, materials, plant eng",url:"https://bostonmetal.com/careers",window:"Rolling",hubs:"Woburn MA",biotech:"No",notes:"MIT spinoff; replacing blast furnaces with electrochem"},
  {id:89,company:"Rondo Energy",industry:"Climate Tech",size:"Private (~$200M+ raised)",roles:"Process eng, heat transfer, materials",url:"https://rondo.com/careers",window:"Rolling",hubs:"Alameda CA",biotech:"No",notes:"Industrial decarbonization; Stripe/Breakthrough-funded"},
  {id:90,company:"Twelve",industry:"Climate Tech",size:"Private (~$200M+ raised)",roles:"Electrochem, catalysis, process eng",url:"https://twelve.co/careers",window:"Rolling",hubs:"Berkeley CA, Moses Lake WA",biotech:"Tangential",notes:"Berkeley spinoff; e-jet fuel partnership with Alaska Airlines"},
  {id:91,company:"GE Aerospace / Vernova",industry:"Industrial / Aerospace",size:"Large-cap (~$190B, GE+GEV)",roles:"Materials, manufacturing eng, R&D",url:"https://jobs.gecareers.com",window:"Sept – Dec",hubs:"Cincinnati OH, Schenectady NY, Greenville SC",biotech:"No",notes:"Has structured Edison Engineering rotational program"},
  {id:92,company:"Honeywell (Aerospace)",industry:"Industrial / Aerospace",size:"Large-cap (~$140B, HON)",roles:"Materials, process eng, R&D",url:"https://careers.honeywell.com",window:"Sept – Dec",hubs:"Phoenix AZ, Charlotte NC, multiple US sites",biotech:"No",notes:""},
  {id:93,company:"Naval Nuclear Laboratory",industry:"National Lab / Govt",size:"Federal Lab (US citizens only)",roles:"Reactor process eng, materials, thermal-hydraulics",url:"https://navalnuclearlab.energy.gov/careers",window:"Open NOW for Summer 2027",hubs:"West Mifflin PA, Niskayuna NY",biotech:"No",notes:"Summer 2027 chem eng / mech eng internship already posted"},
  {id:94,company:"Sandia National Labs",industry:"National Lab / Govt",size:"Federal Lab (US citizens only)",roles:"Materials, energy storage, process eng",url:"https://sandia.gov/careers",window:"Sept – Feb",hubs:"Albuquerque NM, Livermore CA",biotech:"No",notes:""},
  {id:95,company:"Oak Ridge National Lab",industry:"National Lab / Govt",size:"Federal Lab",roles:"Materials, energy, separations chem eng",url:"https://education.ornl.gov/suli",window:"Oct – Feb",hubs:"Oak Ridge TN",biotech:"Tangential",notes:""},
  {id:96,company:"National Renewable Energy Lab",industry:"National Lab / Govt",size:"Federal Lab",roles:"Bioprocess, electrochem, hydrogen, separations",url:"https://nrel.gov/careers",window:"Oct – Feb",hubs:"Golden CO",biotech:"Tangential",notes:"Strong biofuels / hydrogen alignment"},
  {id:97,company:"Argonne National Lab",industry:"National Lab / Govt",size:"Federal Lab",roles:"Battery materials, separations, catalysis",url:"https://anl.gov/careers",window:"Oct – Feb",hubs:"Lemont IL",biotech:"Tangential",notes:"Very close to ND — ~2 hrs"},
  {id:98,company:"Pacific Northwest National Lab",industry:"National Lab / Govt",size:"Federal Lab",roles:"Process eng, separations, materials",url:"https://pnnl.gov/careers",window:"Oct – Feb",hubs:"Richland WA",biotech:"Tangential",notes:""},
  {id:99,company:"NASA",industry:"National Lab / Govt",size:"Federal Govt (US citizens only)",roles:"Propulsion, life support, ECLSS, materials",url:"https://intern.nasa.gov",window:"Aug – Feb (varies by center)",hubs:"JSC TX, KSC FL, JPL CA, Glenn OH, Langley VA, Marshall AL",biotech:"No",notes:"Glenn (Cleveland OH) is closest to ND"},
];

// ─── TASKS ────────────────────────────────────────────────────────────────────
const TASKS_DATA = [
  {id:1,task:"Pull CCD resources from Schneider drive",category:"Career",when:"Before London",deadline:"2026-05-17",effort:0.25,priority:"Medium",status:"Not started",notes:""},
  {id:2,task:"Update resume — main version + extended",category:"Career",when:"Before London",deadline:"2026-05-18",effort:2,priority:"High",status:"Not started",notes:"Make main version and maybe have extended"},
  {id:3,task:"Sell & buy stocks",category:"Money & Admin",when:"Before London",deadline:"2026-05-18",effort:0.5,priority:"Medium",status:"Not started",notes:"Re-evaluate a couple positions"},
  {id:4,task:"Schedule Velena meeting",category:"Career",when:"Before London",deadline:"2026-05-18",effort:0.25,priority:"High",status:"Not started",notes:""},
  {id:5,task:"Review saved IG posts for internship leads",category:"Career",when:"Before London",deadline:"2026-05-20",effort:0.25,priority:"Medium",status:"Not started",notes:""},
  {id:6,task:"iGEM assignment",category:"Extracurriculars",when:"Before London",deadline:"2026-05-20",effort:2,priority:"High",status:"Not started",notes:""},
  {id:7,task:"Book iGEM meeting",category:"Extracurriculars",when:"Before London",deadline:"2026-05-20",effort:0.25,priority:"High",status:"Not started",notes:""},
  {id:8,task:"Pavlick 3/4 registration email",category:"London Logistics",when:"Before London",deadline:"2026-05-22",effort:0.5,priority:"High",status:"Not started",notes:""},
  {id:9,task:"Activate 3/15 email",category:"London Logistics",when:"Before London",deadline:"2026-05-22",effort:0.25,priority:"High",status:"Not started",notes:""},
  {id:10,task:"Kaitlyn checklist 4/15",category:"London Logistics",when:"Before London",deadline:"2026-05-22",effort:1,priority:"High",status:"Not started",notes:""},
  {id:11,task:"Upload Imperial College ID",category:"London Logistics",when:"Before London",deadline:"2026-05-22",effort:0.5,priority:"High",status:"Not started",notes:""},
  {id:12,task:"Update LinkedIn (About section)",category:"Career",when:"Before London",deadline:"2026-05-23",effort:1,priority:"Medium",status:"Not started",notes:"Add about section"},
  {id:13,task:"Update Handshake & Irish Compass profiles",category:"Career",when:"Before London",deadline:"2026-05-23",effort:1,priority:"Medium",status:"Not started",notes:""},
  {id:14,task:"Reach out to Kamat",category:"Academics",when:"Before London",deadline:"2026-05-25",effort:0.5,priority:"Medium",status:"Not started",notes:""},
  {id:15,task:"Reach out to Ella — study guide + project",category:"Academics",when:"Before London",deadline:"2026-05-30",effort:4,priority:"High",status:"Not started",notes:"Multi-session"},
  {id:16,task:"Ask Alex about gym access at Imperial",category:"London Logistics",when:"Before London",deadline:"2026-06-01",effort:0.25,priority:"Low",status:"Not started",notes:""},
  {id:17,task:"Login to American Airlines for flight",category:"London Logistics",when:"Before London",deadline:"2026-06-01",effort:0.25,priority:"High",status:"Not started",notes:"Confirm seat, baggage"},
  {id:18,task:"Read: The Alchemy of Air",category:"Books",when:"Before London",deadline:"2026-06-05",effort:null,priority:"Medium",status:"Not started",notes:"After For Blood and Money"},
  {id:19,task:"Research London tourist activities",category:"London Logistics",when:"Before London",deadline:"2026-06-27",effort:2,priority:"Medium",status:"Not started",notes:"Build a hit list before arrival"},
  {id:20,task:"London study abroad report",category:"Academics",when:"After London",deadline:"2026-08-01",effort:2,priority:"High",status:"Not started",notes:""},
  {id:21,task:"Search & apply for jobs (Handshake / Irish Compass)",category:"Career",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Medium",status:"Not started",notes:"Keep eye out for jobs"},
  {id:22,task:"Reach out to ND + Stamps alums (use Apollo.ai)",category:"Career",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"High",status:"Not started",notes:"Research now and then reach out to 20+ and have coffee chats"},
  {id:23,task:"Apply: Handshake Project Escher role + other AI jobs",category:"Career",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Medium",status:"Not started",notes:""},
  {id:24,task:"Check out Forage virtual experiences",category:"Career",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Low",status:"Not started",notes:""},
  {id:25,task:"Browse ND student jobs board",category:"Career",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Medium",status:"Not started",notes:""},
  {id:26,task:"Finalize fall schedule & traveling classes",category:"Academics",when:"Ongoing",deadline:"Ongoing",effort:1,priority:"Medium",status:"Not started",notes:"Figure out schedule and any travel classes"},
  {id:27,task:"Senior year housing",category:"Senior Year Prep",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Medium",status:"Not started",notes:""},
  {id:28,task:"Order jerseys / clothes",category:"Senior Year Prep",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Low",status:"Not started",notes:""},
  {id:29,task:"Target shifts (summer work)",category:"Money & Admin",when:"Ongoing",deadline:"2026-06-28",effort:null,priority:"Medium",status:"Not started",notes:"Schedule per week"},
  {id:30,task:"Learn about batteries for chem-E car",category:"Learning",when:"Ongoing",deadline:"Ongoing",effort:null,priority:"Medium",status:"Not started",notes:"Spread across summer"},
  {id:31,task:"Golf 2x/week",category:"Fitness",when:"Ongoing",deadline:"Ongoing",effort:0,priority:"Low",status:"Not started",notes:""},
  {id:32,task:"Compile ND contacts hometown list",category:"Career",when:"Before London",deadline:"2026-05-16",effort:0.5,priority:"Medium",status:"Completed",notes:""},
];

// ─── WEEKLY AGENDA ─────────────────────────────────────────────────────────────
const WEEKLY_AGENDA = {
  "2026-05-16": {theme:"Networking blitz + ongoing job apps", tasks:[
    {task:"Compile ND contacts hometown list",category:"Career",hours:0.5,deadline:"May 16",status:"Completed"},
    {task:"Reach out to ND + Stamps alums — research 20+ via Apollo.ai",category:"Career",hours:2.5,deadline:"Ongoing",status:"Not started"},
    {task:"Search & apply for jobs (Handshake / Irish Compass)",category:"Career",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Apply: Project Escher + other AI jobs (round 1)",category:"Career",hours:1,deadline:"Ongoing",status:"Not started"},
  ]},
  "2026-05-17": {theme:"Resume + investing + Forage", tasks:[
    {task:"Pull CCD resources from Schneider drive",category:"Career",hours:0.25,deadline:"May 17",status:"Not started"},
    {task:"Update resume — main version + extended",category:"Career",hours:2,deadline:"May 18",status:"Not started"},
    {task:"Sell & buy stocks",category:"Money & Admin",hours:0.5,deadline:"May 18",status:"Not started"},
    {task:"Reach out to ND + Stamps alums — send 5 messages",category:"Career",hours:1.25,deadline:"Ongoing",status:"Not started"},
    {task:"Forage virtual experiences — set up + try one module",category:"Career",hours:1,deadline:"Ongoing",status:"Not started"},
  ]},
  "2026-05-18": {theme:"Career polish + Ella project kickoff", tasks:[
    {task:"Schedule Velena meeting",category:"Career",hours:0.25,deadline:"May 19",status:"Not started"},
    {task:"Update LinkedIn (About section)",category:"Career",hours:1,deadline:"May 23",status:"Not started"},
    {task:"Update Handshake & Irish Compass profiles",category:"Career",hours:1,deadline:"May 23",status:"Not started"},
    {task:"Reach out to Ella — study guide + project (session 1)",category:"Academics",hours:1.5,deadline:"May 30",status:"Not started"},
    {task:"Senior year housing — research options",category:"Senior Year Prep",hours:1,deadline:"Ongoing",status:"Not started"},
  ]},
  "2026-05-19": {theme:"iGEM prep + housing + alum outreach", tasks:[
    {task:"Review saved IG posts for internship leads",category:"Career",hours:0.25,deadline:"May 20",status:"Not started"},
    {task:"iGEM assignment (session 1)",category:"Extracurriculars",hours:1.5,deadline:"May 20",status:"Not started"},
    {task:"Book iGEM meeting",category:"Extracurriculars",hours:0.25,deadline:"May 20",status:"Not started"},
    {task:"Senior year housing — applications",category:"Senior Year Prep",hours:1.5,deadline:"Ongoing",status:"Not started"},
    {task:"Reach out to ND alums — send 5 more messages",category:"Career",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Browse ND student jobs board",category:"Career",hours:0.5,deadline:"Ongoing",status:"Not started"},
  ]},
  "2026-05-20": {theme:"London logistics blitz + Ella session 2", tasks:[
    {task:"iGEM assignment — finish",category:"Extracurriculars",hours:0.5,deadline:"May 20",status:"Not started"},
    {task:"Pavlick 3/4 registration email",category:"London Logistics",hours:0.5,deadline:"May 22",status:"Not started"},
    {task:"Activate 3/15 email",category:"London Logistics",hours:0.25,deadline:"May 22",status:"Not started"},
    {task:"Kaitlyn checklist 4/15",category:"London Logistics",hours:1,deadline:"May 22",status:"Not started"},
    {task:"Upload Imperial College ID",category:"London Logistics",hours:0.5,deadline:"May 22",status:"Not started"},
    {task:"Reach out to Ella — session 2",category:"Academics",hours:1.5,deadline:"May 30",status:"Not started"},
  ]},
  "2026-05-21": {theme:"Wrap academics + start batteries", tasks:[
    {task:"Reach out to Kamat",category:"Academics",hours:0.5,deadline:"May 25",status:"Not started"},
    {task:"Reach out to Ella — session 3 (finish project)",category:"Academics",hours:1,deadline:"May 30",status:"Not started"},
    {task:"Finalize fall schedule & traveling classes",category:"Academics",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Senior year housing — followups",category:"Senior Year Prep",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Learn about batteries for chem-E car (intro session)",category:"Learning",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Reach out to ND alums — send 5 more",category:"Career",hours:0.5,deadline:"Ongoing",status:"Not started"},
  ]},
  "2026-05-22": {theme:"London prep + senior year admin", tasks:[
    {task:"Research London tourist activities",category:"London Logistics",hours:2,deadline:"Jun 27",status:"Not started"},
    {task:"Login to American Airlines for flight",category:"London Logistics",hours:0.25,deadline:"Jun 1",status:"Not started"},
    {task:"Ask Alex about gym access at Imperial",category:"London Logistics",hours:0.25,deadline:"Jun 1",status:"Not started"},
    {task:"Senior year housing — final followups",category:"Senior Year Prep",hours:0.5,deadline:"Ongoing",status:"Not started"},
    {task:"Order jerseys / clothes — place order",category:"Senior Year Prep",hours:0.5,deadline:"Ongoing",status:"Not started"},
    {task:"Search & apply for jobs",category:"Career",hours:1,deadline:"Ongoing",status:"Not started"},
    {task:"Reach out to ND alums — send 5 more",category:"Career",hours:0.5,deadline:"Ongoing",status:"Not started"},
  ]},
};

// ─── HABITS (date-aware) ──────────────────────────────────────────────────────
// Through May 22: base habits. After May 22: reduced set.
// Custom habits stored in localStorage under 'customHabits'.
function getHabitsForDate(dateStr) {
  const afterCutoff = dateStr > '2026-05-22';
  const full = [
    {id:"lift",   label:"Lift",          duration:"1.0 hr", icon:"🏋️"},
    {id:"read",   label:"Read",          duration:"1.0 hr", icon:"📚"},
    {id:"claude", label:"Learn Claude",  duration:"0.5 hr", icon:"🤖"},
    {id:"brief",  label:"Daily Briefing",duration:"0.5 hr", icon:"📰"},
    {id:"unpack", label:"Unpack",        duration:"0.5 hr", icon:"📦"},
  ];
  const reduced = [
    {id:"lift",  label:"Lift",          duration:"1.0 hr", icon:"🏋️"},
    {id:"read",  label:"Read",          duration:"1.0 hr", icon:"📚"},
    {id:"brief", label:"Daily Briefing",duration:"0.5 hr", icon:"📰"},
  ];
  let base = afterCutoff ? reduced : full;

  // Cole.ai app habit — May 17 through May 24
  if (dateStr >= '2026-05-17' && dateStr <= '2026-05-24') {
    base = [...base, {id:"coleai", label:"Work on Cole.ai app", duration:"0.5 hr", icon:"💻"}];
  }

  // Custom habits added by user
  try {
    const customs = JSON.parse(localStorage.getItem('customHabits') || '[]');
    const active = customs.filter(h =>
      (!h.startDate || dateStr >= h.startDate) &&
      (!h.endDate || dateStr <= h.endDate)
    );
    base = [...base, ...active];
  } catch {}

  return base;
}
const HABITS_CONFIG = getHabitsForDate((function(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })());

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────
// 7 exercises · 4 sets each · all to failure
// Run is every FRIDAY — not part of the rotating 4-day cycle
const WORKOUT_ROTATION = [
  {
    name:"Shoulders / Back", short:"Shoulders\n& Back", icon:"🔺",
    exercises:[
      {name:"Shoulder Press",         sets:4, note:"Barbell or dumbbell — full lockout at top"},
      {name:"Arnold Press",           sets:4, note:"\"Schwarzeneggers\" — rotate palms out as you press"},
      {name:"Lateral Raises",         sets:4, note:"Lead with elbows, control the descent"},
      {name:"Rotational Front Raise", sets:4, note:"Start palms down, rotate to palms up at top"},
      {name:"Lat Pulldown",           sets:4, note:"Full stretch at top, drive elbows to hips"},
      {name:"Barbell Row",            sets:4, note:"Chest on pad or bent-over, retract scapula"},
      {name:"Cable Row",              sets:4, note:"Neutral grip, pause and squeeze at chest"},
    ]
  },
  {
    name:"Biceps / Triceps", short:"Biceps\n& Triceps", icon:"💪",
    exercises:[
      {name:"Twist Curls",               sets:4, note:"Supinate at top for peak contraction"},
      {name:"Preacher Curls",            sets:4, note:"Full stretch at bottom, slow negative"},
      {name:"Incline Dumbbell Curls",    sets:4, note:"Long-head stretch at full extension"},
      {name:"Cable Pushdowns",           sets:4, note:"Rope or bar — elbows glued, full extension"},
      {name:"One Arm Kickbacks",         sets:4, note:"Upper arm parallel to floor, full extension"},
      {name:"Overhead Extensions",       sets:4, note:"Long head — full stretch overhead"},
      {name:"Skull Crushers",            sets:4, note:"EZ bar to forehead, press back up"},
    ]
  },
  {
    name:"Legs", short:"Legs", icon:"🦵",
    exercises:[
      {name:"Barbell Back Squat",  sets:4, note:"Break parallel, knees track over toes"},
      {name:"Romanian Deadlift",   sets:4, note:"Hip hinge — feel the hamstring stretch"},
      {name:"Leg Press",           sets:4, note:"High foot placement targets glutes"},
      {name:"Leg Curl",            sets:4, note:"Lying or seated — full range"},
      {name:"Leg Extension",       sets:4, note:"Squeeze hard at the top"},
      {name:"Standing Calf Raise", sets:4, note:"Full ROM — pause stretched and contracted"},
      {name:"Walking Lunges",      sets:4, note:"Long stride, knee stays above ankle"},
    ]
  },
  {
    name:"Chest", short:"Chest", icon:"🫁",
    exercises:[
      {name:"Barbell Bench Press",     sets:4, note:"Retract scapula, controlled descent"},
      {name:"Incline Dumbbell Press",  sets:4, note:"30–45° — upper chest emphasis"},
      {name:"Cable Flyes",             sets:4, note:"Arms slightly bent, squeeze at center"},
      {name:"Dips",                    sets:4, note:"Lean forward for chest, not tricep focus"},
      {name:"Pec Deck / Machine Fly",  sets:4, note:"Isolate the chest, no shoulder compensation"},
      {name:"DB Pullover",             sets:4, note:"Rib cage expansion + serratus"},
      {name:"Push-ups",                sets:4, note:"Full lockout — use as burnout finisher"},
    ]
  },
  {
    name:"Weekly Run", short:"Weekly\nRun", icon:"🏃",
    exercises:[
      {name:"Warm-up walk",  sets:1, note:"5 min easy pace"},
      {name:"Run",           sets:1, note:"3–5 miles · target 8:00–9:00 min/mile"},
      {name:"Cool-down walk",sets:1, note:"5 min"},
      {name:"Core circuit",  sets:3, note:"Plank 60s · Dead bugs · Leg raises — optional add-on"},
    ]
  },
];

// ─── BRIEFINGS ────────────────────────────────────────────────────────────────
const INITIAL_BRIEFINGS = [
  {
    id: "b1",
    date:"2026-05-16",
    category:"Politics",
    headline:"Trump says Xi agrees Iran must open strait, China says war should not have started",
    source:"Reuters via Investing.com",
    link:"https://www.investing.com/news/commodities-news/trump-says-xi-agrees-iran-must-open-strait-china-says-war-shouldnt-have-started-4694428",
    whyItMatters:"This is the lead global politics story because it links U.S.-China diplomacy, Iran, and the Strait of Hormuz, which matters for shipping, energy, and global stability."
  },
  {
    id: "b2",
    date:"2026-05-16",
    category:"Tech",
    headline:"Desperate Trump taps 'Tim Apple,' Jensen Huang, Elon Musk to attend Xi summit",
    source:"Ars Technica",
    link:"https://arstechnica.com/tech-policy/2026/05/desperate-trump-taps-tim-apple-jensen-huang-elon-musk-to-attend-xi-summit/",
    whyItMatters:"Better tech briefing than a market recap because it focuses on AI policy, chip restrictions, and the political forces shaping the technical future of computing."
  },
  {
    id: "b3",
    date:"2026-05-16",
    category:"Chemical Engineering",
    headline:"Modular, low-cost ammonia-production system is designed for intermittent energy",
    source:"Chemical Engineering",
    link:"https://www.chemengonline.com/talusag-modular-low-cost-ammonia-production-system-is-designed-for-intermittent-energy/",
    whyItMatters:"Directly relevant technically — covers modular ammonia production, electrolytic hydrogen, Haber-Bosch design changes, compressors, controls, and intermittent-power operation."
  },
];
