import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const SC = { stable:"#10b981", evolving:"#f59e0b", "fast-moving":"#ef4444" };
const SL = { stable:"Stable", evolving:"Evolving", "fast-moving":"Fast-moving" };
const AC = { Product:"#8b5cf6", Sales:"#06b6d4", Data:"#f59e0b", "C-Suite":"#ec4899" };

const META = {
  FR:{ name:"France", flag:"🇫🇷", color:"#3b82f6", tso:"RTE", reg:"CRE", mop:"EPEX SPOT", sig:"evolving", hl:"OA/CR thresholds lowered to 200 kW from 1 Jan 2026", tsoU:"https://rte-france.com", regU:"https://cre.fr", mopU:"https://epexspot.com" },
  DE:{ name:"Germany", flag:"🇩🇪", color:"#f59e0b", tso:"50Hertz / Amprion / TenneT / TransnetBW", reg:"BNetzA", mop:"EPEX SPOT / EEX", sig:"evolving", hl:"Inertia product first auction foreseen 2026 (BNetzA BK6-23-010)", tsoU:"https://regelleistung.net", regU:"https://bundesnetzagentur.de", mopU:"https://epexspot.com" },
  BE:{ name:"Belgium", flag:"🇧🇪", color:"#ef4444", tso:"Elia", reg:"CREG", mop:"EPEX SPOT", sig:"fast-moving", hl:"CREG/Elia System Balancing Philosophy Apr 2026; PICASSO live Nov 2024", tsoU:"https://elia.be", regU:"https://creg.be", mopU:"https://epexspot.com" },
  ES:{ name:"Spain", flag:"🇪🇸", color:"#f97316", tso:"REE / REEN", reg:"CNMC", mop:"OMIE (Iberian)", sig:"evolving", hl:"EBGL integration complete; PICASSO, MARI & TERRE live", tsoU:"https://ree.es", regU:"https://cnmc.es", mopU:"https://omie.es" }
};

const DIMS = [
  { id:"marketAccess", icon:"⚡", label:"Market Access" },
  { id:"batteryFlexibility", icon:"🔋", label:"Battery & Flexibility" },
  { id:"balancing", icon:"⚖️", label:"Balancing & Settlement" },
  { id:"gridConstraints", icon:"🔌", label:"Grid & Curtailment" },
  { id:"negativePrices", icon:"📉", label:"Negative Price Rules" },
  { id:"capacityMechanisms", icon:"🏭", label:"Capacity Mechanisms" },
  { id:"ppaFramework", icon:"📄", label:"PPA Framework" },
  { id:"regulatoryTrajectory", icon:"🗺️", label:"Regulatory Trajectory" }
];

// ═══════════════════════════════════════════════════════════
// COUNTRY DATA  — facts: { t, sl, su, d, s, a, note?, f? }
// t=text  sl=sourceLabel  su=sourceUrl  d=date  s=signal  a=audiences  f=flag(monitoring/reference)
// ═══════════════════════════════════════════════════════════

const DATA = {
FR:{
  marketAccess:{ sig:"evolving", a:["Product","Sales","C-Suite"],
    sum:"OA feed-in tariff below 200 kW; CR sliding premium above; CRE tenders for utility-scale",
    note:"CR mechanism determines how Electric Avenue's producer clients settle revenues. The Jan 2026 threshold change brings a wave of small producers into direct marketing for the first time.",
    facts:[
      { t:"Obligation d'achat (OA): regulated feed-in tariff for ≤ 200 kW installations from 1 Jan 2026. EDF OA and DSOs are obligated buyers.", sl:"Code énergie D.314-15 — Décret 2025-498", su:"https://www.legifrance.gouv.fr/codes/id/LEGISCTA000031748367", d:"2025-06-07", s:"evolving", a:["Sales","Product"] },
      { t:"Complément de rémunération (CR): sliding market premium. Producer sells on spot, receives CR top-up to reference price. Law 2015-992 and Décrets 2016-682 & 2016-691 provide the legal framework.", sl:"Law 2015-992 + Décrets 2016-682/691", su:"https://www.legifrance.gouv.fr/loda/id/JORFTEXT000032591142", d:"2016-05-27", s:"stable", a:["Sales","Product","Data"] },
      { t:"From Jan 2026: mandatory direct marketing threshold lowers to 200 kW for all technologies (Décret 2025-498, modifying D.314-15/D.314-23). Justified by EU state-aid compliance and negative price mitigation.", sl:"Décret n°2025-498 du 5 juin 2025", su:"https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051698565", d:"2025-06-07", s:"fast-moving", a:["Product","Sales","C-Suite"] },
      { t:"Market operator: EPEX SPOT for day-ahead (12:00 CET auction) and intraday (continuous, min 0.1 MW). CRE oversees market rules; TSO RTE manages system balance via MA-RE.", sl:"EPEX SPOT Operational Rules Annex 1", su:"https://www.epexspot.com/en/downloads", d:"2026-05-21", s:"stable", a:["Data","Product"] }
    ]},
  batteryFlexibility:{ sig:"stable", a:["Product","Data"],
    sum:"FCR, aFRR (PICASSO), mFRR (MARI) and RR (TERRE) via RTE balancing mechanism; exact parameters in MA-RE Chapitre 4; BESS eligible via prequalification",
    note:"Electric Avenue's platform must track ancillary service commitments and reconcile activation data for settlement across all four RTE products.",
    facts:[
      { t:"Four products: FCR (frequency containment), aFRR via PICASSO, mFRR via MARI, RR via TERRE. All require RTE prequalification: application + perimeter definition + IT connectivity tests.", sl:"RTE MA-RE Ch.4 + Ch.2 — Prequalification", su:"https://www.services-rte.com/en/learn-more-about-our-services/providing-frequency-ancillary-services.html", d:"2026-01-01", s:"stable", a:["Product","Data"] },
      { t:"FCR/aFRR/mFRR exact minimum bid sizes and full activation times are governed by RTE MA-RE Chapitre 4 (Services Système Fréquence). Refer to primary source for exact parameters.", sl:"RTE MA-RE Ch.4 (primary reference document)", su:"https://www.services-rte.com/files/live/sites/services-rte/files/documentsLibrary/RM-0-DISPOSITIONS_GENERALES-20260101.V2_3930_fr", d:"2026-01-01", s:"stable", a:["Data","Product"], f:"reference" },
      { t:"aFRR energy cleared on PICASSO (4-second resolution, CBMP pricing). mFRR via MARI. RR via TERRE. France integrated into all three EU balancing platforms.", sl:"RTE Balancing Data Portal", su:"https://www.services-rte.com/en/view-data-published-by-rte/balancing.html", d:"2025-01-01", s:"stable", a:["Data","Product"] },
      { t:"Capacity Mechanism: Capacity Guarantees (GC) created by RTE, registered in REGA, traded on EPEX SPOT. Order book closes 10:00, results 10:15. Storage eligible for certification.", sl:"EPEX SPOT Operational Rules §80 + RTE Guide Certification 2022", su:"https://www.epexspot.com/en/downloads#rules-fees-processes", d:"2022-06-01", s:"stable", a:["Product","Sales","C-Suite"] }
    ]},
  balancing:{ sig:"stable", a:["Data","Product"],
    sum:"15-minute ISP since 1 Jan 2025 (EBGL); BRP framework under MA-RE; balancing prices linked to PICASSO/MARI platform clearing",
    note:"The Jan 2025 ISP transition directly affects Electric Avenue's data exchange granularity and settlement reconciliation for all French BRP clients.",
    facts:[
      { t:"ISP: 15 minutes since 1 January 2025. Implements EBGL (Reg. EU 2017/2195). CRE derogation expired. All French BRPs now settle at 15-minute granularity.", sl:"RTE — ISP Transition Jan 2025", su:"https://www.services-rte.com/en/news/br-party-system-transition-to-the-15-minute-imbalance-settlement.html", d:"2025-01-01", s:"stable", a:["Data","Product"] },
      { t:"BRP (Balance Responsible Party): contractual commitment with RTE to balance injections/withdrawals within a declared perimeter. Producers in CR/direct marketing are BRPs or covered by a BRP.", sl:"RTE Glossary — BRP", su:"https://analysesetdonnees.rte-france.com/en/glossary", d:"2025-01-01", s:"stable", a:["Product","Data"] },
      { t:"Balancing energy prices: aFRR via PICASSO CBMP (4s); mFRR via MARI clearing prices. Congestion bids ('énergie pour congestion') tracked separately in RTE's balancing data portal.", sl:"RTE Balancing Data Definitions", su:"https://www.services-rte.com/en/view-data-published-by-rte/balancing.html", d:"2025-01-01", s:"stable", a:["Data"] }
    ]},
  gridConstraints:{ sig:"stable", a:["Product","Data"],
    sum:"Congestion managed via specific balancing bids in RTE's adjustment mechanism; curtailment rules in RTE grid code",
    note:"Electric Avenue tracks curtailment events from DSO data. Understanding RTE's congestion framework is essential for compensation verification.",
    facts:[
      { t:"RTE distinguishes 'énergie pour congestion' (specific bids for congestion resolution) from system service and balance bids. Redispatch integrated into the balancing mechanism.", sl:"RTE Balancing Data — Congestion Definition", su:"https://www.services-rte.com/en/view-data-published-by-rte/balancing.html", d:"2025-01-01", s:"stable", a:["Product","Data"] },
      { t:"Detailed curtailment compensation rules and redispatch hierarchy: reference RTE Référentiel Technique and CRE grid code deliberations.", sl:"RTE Technical Reference — Grid Code", su:"https://www.rte-france.com/en/article/grid-connection-and-access", d:"2025-01-01", s:"stable", a:["Product","Data"], f:"monitoring" }
    ]},
  negativePrices:{ sig:"fast-moving", a:["Product","Sales","Data"],
    sum:"Décret 2025-498 justified by negative price mitigation; CR premium suspension clauses in technology-specific arrêtés (PV 2018, Wind 2017)",
    note:"Critical for Electric Avenue's negative price exposure tracking and revenue impact quantification feature for French clients.",
    facts:[
      { t:"Décret 2025-498 (June 2025) explicitly justified to combat 'prix négatifs sur les marchés de l'électricité'. Lowering OA threshold reduces the pool of producers shielded from spot exposure.", sl:"Décret 2025-498 — DGEC Note", su:"https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051698565", d:"2025-06-07", s:"fast-moving", a:["Product","Sales","C-Suite"] },
      { t:"CR premium suspension conditions during negative prices: exact threshold and duration defined in technology arrêtés. PV: Arrêté 23 April 2018. Wind: Arrêté 6 May 2017.", sl:"CR Arrêté PV 23/04/2018 + CR Arrêté Éolien 06/05/2017", su:"https://www.legifrance.gouv.fr/", d:"2018-04-23", s:"stable", a:["Product","Data"], f:"reference" }
    ]},
  capacityMechanisms:{ sig:"stable", a:["Product","Sales","C-Suite"],
    sum:"Mécanisme de capacité: RTE certifies Capacity Guarantees; EPEX SPOT auctions; storage eligible",
    note:"Capacity guarantee revenue is an additional stream for Electric Avenue's storage and flexible clients beyond ancillary services.",
    facts:[
      { t:"Capacity Guarantees (GC): created by RTE, registered in REGA, traded on EPEX SPOT. Auctions: order book closes 10:00, results 10:15. Price cap: 0–6,000 €/GC (2020-2024).", sl:"EPEX SPOT Operational Rules §80", su:"https://www.epexspot.com/en/downloads#rules-fees-processes", d:"2026-05-21", s:"stable", a:["Sales","Product"] },
      { t:"Certification: producers and demand response apply to RTE. PP2 winter peak availability commitment. Storage can be certified. Reference RTE Guide Pratique Certification June 2022.", sl:"RTE Guide Pratique Certification June 2022", su:"https://www.services-rte.com/files/live/sites/services-rte/files/pdf/MECAPA/2022%2006%20Guide%20pratique%20certification.pdf", d:"2022-06-01", s:"stable", a:["Product","Data"] }
    ]},
  ppaFramework:{ sig:"stable", a:["Sales","C-Suite"],
    sum:"PPAs widely used; no dedicated PPA law; CR/PPA coexistence not yet formally codified in primary sources",
    note:"Electric Avenue's contract management module handles hybrid PPA/CR structures. Coexistence rules important for accurate revenue modeling.",
    facts:[
      { t:"Corporate PPAs widely used alongside CR and post-subsidy merchant arrangements. Governed by general contract law (Code civil) — no dedicated PPA statute.", sl:"CRE — Market Overview", su:"https://www.cre.fr", d:"2024-01-01", s:"stable", a:["Sales","C-Suite"] },
      { t:"PPA/CR coexistence and notification requirements: not yet formally codified in primary sources reviewed. Active monitoring — reference CRE guidance for latest position.", sl:"CRE Publications", su:"https://www.cre.fr", d:"2024-01-01", s:"stable", a:["Sales"], f:"monitoring" }
    ]},
  regulatoryTrajectory:{ sig:"fast-moving", a:["C-Suite","Product","Sales"],
    sum:"200 kW threshold 1 Jan 2026 is immediate. RED III and EMD Reform transposition pending. CR majority of installed base expected by 2032.",
    note:"Regulatory changes signal where Electric Avenue needs new features and which market segments are growing fastest.",
    facts:[
      { t:"1 January 2026: direct marketing threshold drops to 200 kW. Significant influx of small producers entering direct marketing — new client segment for Electric Avenue.", sl:"Décret 2025-498 + CRE Bilan CR", su:"https://www.cre.fr/actualites/nos-lettres-dinformation/la-cre-publie-le-bilan-de-la-mise-en-place-du-complement-de-remuneration-en-france-et-partage-ses-recommandations-pour-lavenir.html", d:"2025-06-05", s:"fast-moving", a:["Product","Sales","C-Suite"] },
      { t:"Regulation EU 2024/1747 (EMD Reform) and RED III (Directive 2023/2413): transposition into French law pending. New PPA rules, two-way CfDs, and storage access changes incoming.", sl:"EUR-Lex — Reg. EU 2024/1747", su:"https://eur-lex.europa.eu/eli/reg/2024/1747/oj/eng", d:"2024-06-13", s:"fast-moving", a:["C-Suite","Product"], f:"monitoring" },
      { t:"By 2032: CR contracts expected to represent the majority of supported installations per CRE projections. Progressive market integration of renewable producers continues.", sl:"CRE Bilan Complément de Rémunération", su:"https://www.cre.fr", d:"2024-01-01", s:"evolving", a:["C-Suite","Sales"] }
    ]}
},

DE:{
  marketAccess:{ sig:"stable", a:["Product","Sales","C-Suite"],
    sum:"EEG 2023: mandatory direct marketing from 100 kW; Marktprämie = wholesale price + premium; four TSOs; EPEX SPOT + EEX",
    note:"EEG market premium calculation is critical for Electric Avenue's German revenue modeling. TSOs publish monthly premium data on netztransparenz.de.",
    facts:[
      { t:"Mandatory direct marketing from 100 kW (EEG 2023 §48(1)). Revenue = wholesale market price + Marktprämie (market premium) from network operator, minus direct marketer's fee.", sl:"EEG 2023 §48(1)", su:"https://www.gesetze-im-internet.de/eeg_2014/__48.html", d:"2023-01-01", s:"stable", a:["Sales","Product","Data"] },
      { t:"Market premium calculated monthly per EEG Annex 1. TSOs publish premium data per §73(3) on netztransparenz.de (technology and installation type specific).", sl:"EEG 2023 §73(3) + Annex 1 — Netztransparenz", su:"https://www.netztransparenz.de/en/Renewable-energies-and-levies/EEG/Transparency-requirements/Market-premium", d:"2023-01-01", s:"stable", a:["Data","Product"] },
      { t:"Four TSOs (50Hertz, Amprion, TenneT DE, TransnetBW). Joint balancing via regelleistung.net. Market operators: EPEX SPOT (DA + intraday) and EEX.", sl:"regelleistung.net — Homepage", su:"https://www.regelleistung.net", d:"2024-01-01", s:"stable", a:["C-Suite","Product"] }
    ]},
  batteryFlexibility:{ sig:"evolving", a:["Product","Data","C-Suite"],
    sum:"FCR (30s, 1 MW, cap only), aFRR (5 min, 1 MW, PICASSO), mFRR (12.5 min, 1 MW, MARI); 1.76 GW BESS in FCR; inertia/reactive/black-start 2026",
    note:"Germany is the most mature BESS ancillary services market of the four. New product launches in 2026 will create additional revenue streams for Electric Avenue's storage clients.",
    facts:[
      { t:"FCR: full activation 30 seconds, 4h symmetric blocks, joint cross-border via FCR Cooperation. Remuneration: capacity only (no energy payment). Minimum bid: 1 MW.", sl:"50Hertz — FCR Product Details", su:"https://www.50hertz.com/en/Market/Balancingreserve/Balancingreservetypes", d:"2025-01-01", s:"stable", a:["Product","Data"] },
      { t:"aFRR: 5-minute full activation, 4h daily blocks, PICASSO platform, capacity + energy payment. Min bid: 1 MW. BESS must have min 15-minute energy for FCR, 60-minute for FRR.", sl:"50Hertz — aFRR Product Details", su:"https://www.50hertz.com/en/Market/Balancingreserve/Balancingreservetypes", d:"2025-01-01", s:"stable", a:["Product","Data"] },
      { t:"mFRR: 12.5-minute activation, 4h blocks, MARI platform, block offers (indivisible when awarded). Capacity + energy remuneration. Min bid: 1 MW. 1.76 GW BESS prequalified for FCR across Germany.", sl:"50Hertz — mFRR + BESS Figures 2025", su:"https://www.50hertz.com/en/Market/Balancingreserve/Balancingreservetypes", d:"2025-01-01", s:"stable", a:["Product","Data"] },
      { t:"New ancillary service products incoming 2026: Inertia (BK6-23-010), Reactive Power (BK6-23-072), Black-Start (BK6-21-023). BESS explicitly eligible for all three.", sl:"BNetzA — BK6-23-010 / BK6-23-072 / BK6-21-023", su:"https://www.bundesnetzagentur.de/DE/Beschlusskammern/1_GZ/BK6-GZ/2023/BK6-23-010/BK6-23-010_beschluss.html?nn=877610", d:"2025-04-22", s:"evolving", a:["Product","C-Suite","Sales"] }
    ]},
  balancing:{ sig:"stable", a:["Data","Product"],
    sum:"Four TSOs, joint procurement via regelleistung.net; pay-as-bid capacity / pay-as-cleared energy; 15-min ISP (EBGL)",
    note:"Germany's multi-TSO structure creates more complex settlement flows. Electric Avenue clients with German portfolios need TSO-specific data handling.",
    facts:[
      { t:"All FCR, aFRR, mFRR capacity and energy procured jointly by four TSOs via regelleistung.net in cross-control-area tender. European platforms: PICASSO, MARI, IGCC, TERRE, FCR Cooperation.", sl:"regelleistung.net — Joint Procurement", su:"https://www.regelleistung.net/en-us/Become-a-balancing-service-provider/Tendering-and-bidding-process", d:"2024-01-01", s:"stable", a:["Data","Product"] },
      { t:"Pricing: pay-as-bid for balancing capacity; marginal price (pay-as-cleared) for balancing energy. 15-minute ISP, EBGL (Reg. EU 2017/2195) compliant.", sl:"Amprion — Balancing Capacity Germany", su:"https://www.amprion.net/Energy-Market/Market-Platform/Control-Energy/", d:"2024-01-01", s:"stable", a:["Data"] }
    ]},
  gridConstraints:{ sig:"stable", a:["Product","Data","Sales"],
    sum:"Redispatch 2.0 (EnWG §13a): 100 kW threshold since Oct 2021; direct marketers trade curtailed volumes on spot; single DE/LU bidding zone maintained",
    note:"Redispatch 2.0 fundamentally changes curtailment treatment for Electric Avenue's German clients. Pricing model must account for curtailed volume spot trading.",
    facts:[
      { t:"Redispatch 2.0 in force since 1 October 2021 (EnWG §13a). Threshold: 100 kW (down from 10 MW). DSOs report curtailment events. Direct marketers must now trade curtailed volumes on spot.", sl:"EnWG §13a (gesetze-im-internet.de)", su:"https://www.gesetze-im-internet.de/enwg_2005/__13a.html", d:"2021-10-01", s:"stable", a:["Product","Data","Sales"] },
      { t:"Germany maintains single DE/LU bidding zone. Aktionsplan Gebotszone 2025 (Art. 15 Reg. EU 2019/943) submitted to EC, focusing on grid expansion and redispatch optimisation.", sl:"BMWK — Aktionsplan Gebotszone 2025", su:"https://www.bundeswirtschaftsministerium.de/Redaktion/DE/Publikationen/Energie/aktionsplan-gebotszone-2025.pdf?__blob=publicationFile&v=14", d:"2025-01-01", s:"stable", a:["C-Suite","Sales"] }
    ]},
  negativePrices:{ sig:"fast-moving", a:["Product","Sales","Data"],
    sum:"Dual-regime since 25 Feb 2025: new installations (≥ 2 kW, commissioned from 25 Feb 2025) under Solarspitzengesetz — suspension per 15-minute negative interval, immediate. Existing installations retain EEG 2023 §51 — suspension only after 6 consecutive negative hours. Mixed portfolios require per-installation rule logic.",
    note:"Both rules coexist in a mixed German portfolio. Electric Avenue must segment clients by commissioning date to apply the correct suspension logic — a per-installation flag, not a single market-wide setting. The new rule is materially stricter and affects all new German PV clients added from Feb 2025 onwards.",
    facts:[
      { t:"Solarspitzengesetz (Solar Peak Act), in force 25 February 2025: feed-in payments suspended during any 15-minute interval when spot prices turn negative. Applies to new PV installations above 2 kW commissioned from 25 Feb 2025. No consecutive-hours threshold — immediate, per-interval trigger.", sl:"Solarspitzengesetz — EEG §51 amendment, 25 Feb 2025", su:"https://www.pv-magazine.com/2025/02/17/germany-introduces-new-rules-for-solar-remuneration-during-negative-prices/", d:"2025-02-25", s:"fast-moving", a:["Product","Sales","Data"] },
      { t:"EEG 2023 §51 (still in force for existing installations): Marktprämie set to zero in any hour where the day-ahead price is negative, if it has been negative for ≥ 6 consecutive hours. Applies to installations commissioned before 25 Feb 2025.", sl:"EEG 2023 §51 (gesetze-im-internet.de)", su:"https://www.gesetze-im-internet.de/eeg_2014/__51.html", d:"2023-01-01", s:"stable", a:["Product","Data","Sales"] },
      { t:"Exemption under Solarspitzengesetz: systems of 2 kWp or below are fully exempt. Smart meter installations can recover suspended intervals at the end of the 20-year subsidy period. Germany recorded 1,100 hours of negative prices in 2025.", sl:"RatedPower — Solarspitzengesetz Analysis", su:"https://ratedpower.com/blog/how-solarspitzengesetz-affects-solar/", d:"2025-11-01", s:"stable", a:["Product","Data"] },
      { t:"TSOs publish joint annual report (EEG §77) on negative price occurrences and market premium impact. Reference netztransparenz.de for historical data on suspension frequency and duration.", sl:"Joint TSO Report EEG §77 — Netztransparenz", su:"https://www.netztransparenz.de/en/Renewable-energies-and-levies/EEG/EEG-billing/EEG-annual-statements", d:"2024-01-01", s:"stable", a:["Data"] }
    ]},
  capacityMechanisms:{ sig:"stable", a:["C-Suite","Sales"],
    sum:"No central capacity market in Germany — energy-only market model",
    note:"BESS revenue in Germany comes exclusively from ancillary services and wholesale trading. No CRM capacity payments as in Belgium.",
    facts:[
      { t:"Germany operates an energy-only market. No central capacity remuneration mechanism. Security of supply managed through strategic reserve (Netzreserve) and ancillary services.", sl:"BNetzA — Monitoring Report 2025", su:"https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/EN/Areas/ElectricityGas/CollectionCompanySpecificData/Monitoring/MonitoringReport2025.pdf", d:"2025-01-01", s:"stable", a:["C-Suite","Sales"] }
    ]},
  ppaFramework:{ sig:"stable", a:["Sales","C-Suite"],
    sum:"Active PPA market; no specific PPA law; EEG market premium compatible with PPAs under the direct marketing framework",
    note:"EEG Marktprämie and PPA can coexist — producer sells under PPA and receives residual premium where market price falls below reference value.",
    facts:[
      { t:"Germany has an active corporate PPA market. No dedicated PPA law: governed by general civil law (BGB) and EEG. EEG market premium and PPAs coexist under direct marketing.", sl:"BMWK / BNetzA — Market Overview", su:"https://www.bmwk.de", d:"2024-01-01", s:"stable", a:["Sales","C-Suite"] }
    ]},
  regulatoryTrajectory:{ sig:"evolving", a:["C-Suite","Product","Sales"],
    sum:"2026 inertia/reactive/black-start product launches; bidding zone review ongoing; RED III and EMD Reform transposition pending",
    note:"The 2026 product launches will create new revenue streams for Electric Avenue's German storage clients. Active monitoring of BNetzA consultations required.",
    facts:[
      { t:"2026: First inertia auction under BNetzA BK6-23-010 (decision 22 April 2025). Premium and basic products, fixed-price remuneration, BESS explicitly targeted.", sl:"BNetzA Decision BK6-23-010", su:"https://www.bundesnetzagentur.de/DE/Beschlusskammern/1_GZ/BK6-GZ/2023/BK6-23-010/Bk6-23-010_beschluss_v_22.04.25.pdf?__blob=publicationFile&v=6", d:"2025-04-22", s:"evolving", a:["Product","C-Suite","Sales"] },
      { t:"Reactive power (BK6-23-072): regional long-term contracts, BESS eligible. Black-start capability (BK6-21-023): locational procurement. Both in development.", sl:"BNetzA BK6-23-072 + BK6-21-023", su:"https://www.bundesnetzagentur.de/DE/Beschlusskammern/1_GZ/BK6-GZ/2023/BK6-23-072/BK6-23-072_verfahrenser%C3%B6ffnung.html", d:"2023-01-01", s:"evolving", a:["Product","Data"] },
      { t:"Reg. EU 2024/1747 and RED III transposition pending. BMWK/BNetzA consultations expected. Changes to PPA frameworks and storage classification likely.", sl:"EUR-Lex — Reg. EU 2024/1747", su:"https://eur-lex.europa.eu/eli/reg/2024/1747/oj/eng", d:"2024-06-13", s:"fast-moving", a:["C-Suite","Product"], f:"monitoring" }
    ]}
},

BE:{
  marketAccess:{ sig:"stable", a:["Product","Sales","C-Suite"],
    sum:"Regional GC schemes (Flemish: VREG, Walloon: CWaPE, Brussels: Brugel); federal offshore CRM; EPEX SPOT",
    note:"Belgium's regional structure means producers face different support rules by location. Electric Avenue must handle multi-regime contract management for Belgian portfolios.",
    facts:[
      { t:"Flanders: Green Certificate (GC) scheme. Elia obligated to purchase GCs from producers at minimum support price per Art. 7.1.6 and 7.1.7 of Flemish Energy Decree. Certificates issued by VREG.", sl:"Elia — GC Sales (Flemish Energy Decree Art. 7.1.6/7.1.7)", su:"https://www.elia.be/en/customers/green-certificates-and-levies-tariffs/flanders-gc-sales-to-elia", d:"2019-07-01", s:"stable", a:["Sales","Product"] },
      { t:"Wallonia: CWaPE green certificate scheme. Brussels-Capital: Brugel equivalent. Different minimum prices and thresholds per region — reference each regulator's publications.", sl:"CWaPE / Brugel — Regional GC Frameworks", su:"https://www.cwape.be", d:"2024-01-01", s:"stable", a:["Sales","Product"], f:"reference" },
      { t:"Federal offshore: CRM support mechanism. CREG federal oversight. Market operator: EPEX SPOT. Intraday: same 0.1 MW minimum as FR and DE.", sl:"CREG + EPEX SPOT Operational Rules Annex 2", su:"https://www.creg.be", d:"2024-01-01", s:"stable", a:["C-Suite","Sales"] }
    ]},
  batteryFlexibility:{ sig:"fast-moving", a:["Product","Data","C-Suite"],
    sum:"FCR (30s, 1 MW, Non-CIPU), aFRR (5 min from Dec 2024, PICASSO live Nov 2024), mFRR (15 min, MARI), CRM for storage",
    note:"Belgium combines ancillary services AND CRM capacity revenue for BESS — the strongest multi-revenue-stream market of the four for storage.",
    facts:[
      { t:"FCR: 1 MW minimum, activation within 30 seconds, capacity-only remuneration. Non-CIPU Technical Units framework (Elia GFA FCR Non-CIPU, May 2026 version). Aggregation in providing groups allowed.", sl:"Elia GFA FCR Non-CIPU (Jul 2019 / May 2026)", su:"https://www.elia.be/en/electricity-market-and-system/system-services/how-to-become-a-provider-relevant-documents-for-procurement", d:"2026-05-04", s:"stable", a:["Product","Data"] },
      { t:"aFRR: 1 MW minimum; Full Activation Time reduced 7.5 → 5 minutes since 4 December 2024 (PICASSO go-live). Daily 4h capacity blocks, energy via PICASSO. Updated: Elia aFRR Design Note Sep 2025.", sl:"Elia aFRR Design Note — September 2025", su:"https://www.elia.be/en/electricity-market-and-system/system-services/becoming-a-balancing-service-provider", d:"2025-09-01", s:"evolving", a:["Product","Data"] },
      { t:"mFRR: 1 MW minimum, mandatory activation within 15 minutes, MARI platform. Remuneration: capacity + energy. Reserved and non-reserved bids possible.", sl:"Elia mFRR BSP Contract (Feb 2020)", su:"https://www.elia.be/en/electricity-market-and-system/system-services/how-to-become-a-provider-relevant-documents-for-procurement", d:"2020-02-01", s:"stable", a:["Product","Data"] },
      { t:"CRM: storage explicitly eligible. Capacity contracts via Y-4 auctions. Payback mechanism when day-ahead price exceeds strike price. Elia CRM Functioning Rules updated May 2025.", sl:"Elia CRM Functioning Rules (May 2025)", su:"https://www.elia.be/en/grid-data/adequacy/crm-auction-results", d:"2025-05-15", s:"stable", a:["Product","Sales","C-Suite"] }
    ]},
  balancing:{ sig:"evolving", a:["Data","Product"],
    sum:"15-minute ISP; T&C BRP revised April 2025 (CREG B2991); ACE/SI imbalance framework; faster settlement incentive",
    note:"The April 2025 T&C BRP update and faster settlement incentive directly affect all Belgian BRP clients on Electric Avenue's platform.",
    facts:[
      { t:"ISP: 15 minutes (evidenced by Elia's 'Imbalance prices 15' quarterly data portal). Compliant with EBGL Reg. EU 2017/2195.", sl:"Elia — Imbalance Prices 15", su:"https://www.elia.be/en/grid-data/balancing/imbalance-prices-15", d:"2024-01-01", s:"stable", a:["Data","Product"] },
      { t:"T&C BRP revised April 2025: CREG decision B2991 approves new framework incorporating post-PICASSO imbalance price components. Faster settlement incentive and flexible connection agreement perimeter corrections.", sl:"CREG Decision B2991 — April 2025", su:"https://www.creg.be/fr/publications/decision-b2991", d:"2025-04-10", s:"evolving", a:["Data","Product"] },
      { t:"ACE = unintentional deviation from scheduled control programme. SI (System Imbalance) = ACE minus activated FRR. Definitions per Elia T&C BRP and 'Imbalance Prices 15' documentation.", sl:"Elia — Imbalance Prices 15 Definitions (May 2023)", su:"https://www.elia.be/en/grid-data/balancing/imbalance-prices-15", d:"2023-05-17", s:"stable", a:["Data"] }
    ]},
  gridConstraints:{ sig:"stable", a:["Product","Data"],
    sum:"Curtailment and redispatch under Elia grid code; active monitoring item",
    note:"Active monitoring priority for Electric Avenue's Belgian curtailment tracking feature as renewable capacity grows rapidly.",
    facts:[
      { t:"Belgian curtailment and redispatch: reference Elia Technical Regulations for the Transmission Grid and CREG approval decisions. Detailed procedures not yet extracted from primary documents.", sl:"Elia — Technical Regulations (Grid Code)", su:"https://www.elia.be/en/electricity-market-and-system/system-services/how-to-become-a-provider-relevant-documents-for-procurement", d:"2024-01-01", s:"stable", a:["Product","Data"], f:"monitoring" }
    ]},
  negativePrices:{ sig:"stable", a:["Product","Sales"],
    sum:"Negative price rules for supported producers: not yet retrieved from primary sources. Active monitoring.",
    note:"Active monitoring priority. Belgian GC minimum price structure partially shields producers, but interaction with spot exposure needs verification.",
    facts:[
      { t:"CREG/Elia negative price treatment for supported producers (GC minimum prices, CRM payback interaction): not yet retrieved from primary source documents. Reference CREG decisions and regional regulators.", sl:"CREG / VREG / CWaPE / Brugel", su:"https://www.creg.be", d:"2024-01-01", s:"stable", a:["Product","Sales"], f:"monitoring" }
    ]},
  capacityMechanisms:{ sig:"evolving", a:["Product","Sales","C-Suite"],
    sum:"CRM: Elia-run capacity auctions; storage eligible; Y-4 results available; strike price mechanism",
    note:"CRM is a significant additional revenue stream for Belgian storage clients. Key differentiator versus Germany (energy-only market).",
    facts:[
      { t:"CRM Y-4 auction for 2025-2026 delivery: results available. Storage capacity contracts awarded. Strike price mechanism: payback obligation when DA price > strike price for the period.", sl:"Elia CRM Y-4 Auction Report 2021 (2025-2026 delivery)", su:"https://www.elia.be/en/grid-data/adequacy/crm-auction-results", d:"2021-10-31", s:"stable", a:["Sales","C-Suite","Product"] },
      { t:"CRM Functioning Rules updated May 2025. Storage eligibility confirmed. Contract duration options, availability requirements, and testing obligations defined.", sl:"Elia CRM Functioning Rules — May 2025", su:"https://www.elia.be/en/grid-data/adequacy/crm-auction-results", d:"2025-05-15", s:"evolving", a:["Product","Data"] }
    ]},
  ppaFramework:{ sig:"stable", a:["Sales","C-Suite"],
    sum:"Active PPA market (especially offshore wind); no dedicated PPA law; CREG guidance not yet retrieved",
    note:"Active monitoring for CREG guidance on PPA regulatory treatment, especially post-EMD Reform.",
    facts:[
      { t:"Belgium has an active PPA market, particularly for offshore wind projects. No dedicated PPA law: governed by general contract law. CREG PPA guidance not yet retrieved.", sl:"CREG — Market Overview", su:"https://www.creg.be", d:"2024-01-01", s:"stable", a:["Sales","C-Suite"], f:"monitoring" }
    ]},
  regulatoryTrajectory:{ sig:"fast-moving", a:["C-Suite","Product","Sales"],
    sum:"System Balancing Philosophy Apr 2026; T&C BRP/BSP updates 2025; PICASSO live Nov 2024; EMD Reform transposition pending",
    note:"Belgium is the most rapidly evolving of the four markets right now. Multiple simultaneous framework changes across balancing, settlement, and flexibility.",
    facts:[
      { t:"April 2026: CREG and Elia publish System Balancing Philosophy. Strategic priority: use more fast/cost-effective flexibility, lower barriers for new BSPs, optimise aFRR/mFRR mix, integrate congestion management.", sl:"Elia Newsroom — System Balancing Philosophy Apr 2026", su:"https://www.elia.be/en/newsroom/2026/04/20260402_system-balancing-philosophy", d:"2026-04-01", s:"fast-moving", a:["C-Suite","Product","Sales"] },
      { t:"T&C BSP aFRR amended 2024-2025: faster settlement incentive (CREG B658E/89), updated bid firmness and CDSO declaration process, combined FCR/aFRR delivery rules.", sl:"Elia — T&C BSP aFRR Consultation 2024-2025", su:"https://www.elia.be", d:"2025-01-01", s:"evolving", a:["Product","Data"] },
      { t:"November 2024: Belgium connects to PICASSO for aFRR (FAT reduced to 5 min). Most recent major technical market change in Belgium.", sl:"Elia aFRR Design Note — Sep 2025", su:"https://www.elia.be", d:"2024-11-26", s:"stable", a:["Product","Data"] }
    ]}
},

ES:{
  marketAccess:{ sig:"stable", a:["Product","Sales","C-Suite"],
    sum:"REER fixed-price auctions (RD 960/2020, Law 24/2013); pay-as-bid; OMIE (Iberian, Spain + Portugal)",
    note:"Spain's REER framework gives producers fixed-price contracts. Electric Avenue's revenue modeling must account for REER settlement vs spot market revenues separately.",
    facts:[
      { t:"REER (Régimen Económico de Energías Renovables): RD 960/2020 (BOE-A-2020-13831), implementing Law 24/2013 Art. 14.7bis. Pay-as-bid tenders: bids on €/MWh produced or €/MW installed.", sl:"RD 960/2020 — BOE-A-2020-13831", su:"https://www.boe.es/diario_boe/txt.php?id=BOE-A-2020-13831", d:"2020-11-03", s:"stable", a:["Sales","Product","Data"] },
      { t:"REER auctions held by MITECO. Results via BOE resolutions. Recent example (3rd auction, Jul 2022): 146 MW biomass at 93.09 €/MWh avg, 31 MW distributed PV at 53.88 €/MWh avg.", sl:"MITECO — REER Auction Resolutions (BOE)", su:"https://www.miteco.gob.es", d:"2022-07-01", s:"stable", a:["Sales","C-Suite"] },
      { t:"Market operator: OMIE (Iberian electricity market, Spain + Portugal). Day-ahead and intraday markets. TSO: REE / REEN. Regulator: CNMC.", sl:"OMIE + CNMC — Market Overview", su:"https://www.omie.es", d:"2024-01-01", s:"stable", a:["C-Suite","Product"] }
    ]},
  batteryFlexibility:{ sig:"evolving", a:["Product","Data"],
    sum:"Secondary regulation (aFRR, 20s-15min), tertiary (mFRR, 15min); 1 MW min programming unit; storage equal treatment confirmed; PICASSO + MARI live",
    note:"Spain explicitly confirmed equal regulatory treatment of storage and aggregation — the strongest legal foundation for BESS access of the four markets.",
    facts:[
      { t:"Secondary regulation (aFRR): operational timeframe 20 seconds to 15 minutes. Remuneration: capacity (control band reservation) + energy (net activation). Integrated into PICASSO platform.", sl:"REE — Ancillary Services", su:"https://www.ree.es/en/activities/system-operation/ancillary-services", d:"2024-01-01", s:"stable", a:["Product","Data"] },
      { t:"Tertiary regulation (mFRR): mandatory offer obligation, max power variation within 15 minutes, maintainable ≥ 2 consecutive hours. MARI platform integration. Per REE PO 7.3.", sl:"REE PO 7.3 — Regulación Terciaria", su:"https://www.ree.es", d:"2024-01-01", s:"stable", a:["Product","Data"] },
      { t:"Minimum capacity: 1 MW per programming unit (single installation or aggregation). Storage explicitly treated equally with generation and demand. Aggregation explicitly permitted.", sl:"CNMC — Condiciones Balance BSP/BRP (BOE-A-2019-18423)", su:"https://www.boe.es/diario_boe/txt.php?id=BOE-A-2019-18423", d:"2019-12-11", s:"stable", a:["Product","Data","Sales"] }
    ]},
  balancing:{ sig:"stable", a:["Data","Product"],
    sum:"EBGL-compliant; PICASSO + MARI + TERRE integrated; quarter-hourly programming; BRP/BSP framework per CNMC conditions",
    note:"Spain's EBGL integration is complete and well-documented. The BSP/BRP framework is clearly defined and storage-friendly.",
    facts:[
      { t:"EBGL implementation complete: PICASSO (aFRR), MARI (mFRR), and TERRE (RR) platforms integrated. Quarter-hourly programming live per BOE-A-2022-4969.", sl:"CNMC BOE-A-2022-4969 — Quarter-Hourly Programming", su:"https://www.boe.es/buscar/doc.php?id=BOE-A-2022-4969", d:"2022-01-01", s:"stable", a:["Data","Product"] },
      { t:"BRP (Sujeto de Liquidación Responsable del Balance): financially responsible for imbalances, settled by REE per CNMC conditions. BSPs may be generation, demand, storage, or third-party aggregators.", sl:"CNMC — Condiciones Balance (BOE-A-2019-18423)", su:"https://www.boe.es/diario_boe/txt.php?id=BOE-A-2019-18423", d:"2019-12-11", s:"stable", a:["Product","Data"] },
      { t:"Settlement procedures: REE PO 14.4 (rights and payment obligations for adjustment services). Imbalance settlement and pricing formula: reference CNMC/REE operation procedures.", sl:"REE PO 14.4 — Settlement Procedures", su:"https://www.cnmc.es/sites/default/files/editor_contenidos/Energia/Normativa_M_Electrico/P.O.%2014.4%20Derechos%20de%20cobro%20y%20obligaciones%20de%20pago%20por%20los%20servicios%20de%20ajuste%20del%20sistema.pdf", d:"2024-01-01", s:"stable", a:["Data"], f:"reference" }
    ]},
  gridConstraints:{ sig:"stable", a:["Product","Data"],
    sum:"PO 3.2 technical constraints; curtailment hierarchy defined; REE annual system report includes curtailment statistics",
    note:"Spanish renewable curtailment data available from REE ISE 2024. Important for Electric Avenue's curtailment tracking feature across the Spanish portfolio.",
    facts:[
      { t:"REE PO 3.2 defines technical constraint management: curtailment hierarchy, constraint resolution process, and TSO/DSO roles.", sl:"REE PO 3.2 — Restricciones Técnicas", su:"https://www.cnmc.es/sites/default/files/editor_contenidos/Energia/Normativa_M_Electrico/P.O.%203.2%20Restricciones%20t%C3%A9cnicas.pdf", d:"2024-01-01", s:"stable", a:["Product","Data"] },
      { t:"Curtailment statistics: REE publishes annual Informe del Sistema Eléctrico (ISE 2024) with curtailment volumes by technology and zone.", sl:"REE — ISE 2024 (Informe Sistema Eléctrico)", su:"https://www.sistemaelectrico-ree.es/sites/default/files/2025-03/ISE_2024.pdf", d:"2025-01-01", s:"stable", a:["Data","Product"] }
    ]},
  negativePrices:{ sig:"stable", a:["Product","Sales"],
    sum:"RD 960/2020 Articles 18-19 govern REER remuneration under negative price conditions; exact threshold not yet retrieved",
    note:"Active monitoring priority. Spain's REER fixed-price structure provides partial shielding, but provisions still apply under certain conditions.",
    facts:[
      { t:"RD 960/2020 Articles 18-19 govern REER remuneration modification under negative market price conditions. Exact suspension threshold and duration: reference primary BOE-A-2020-13831 text.", sl:"RD 960/2020 BOE-A-2020-13831 Art. 18-19", su:"https://www.boe.es/diario_boe/txt.php?id=BOE-A-2020-13831", d:"2020-11-03", s:"stable", a:["Product","Sales"], f:"monitoring" }
    ]},
  capacityMechanisms:{ sig:"stable", a:["C-Suite","Sales"],
    sum:"No central capacity market in Spain — energy-only plus ancillary services model",
    note:"BESS revenue in Spain comes from ancillary services and wholesale trading only. No CRM equivalent, unlike Belgium.",
    facts:[
      { t:"Spain does not operate a central capacity remuneration mechanism. Security of supply managed through energy markets, ancillary services, and demand interrumpibilidad. No capacity payments for BESS.", sl:"REE — System Operation Overview", su:"https://www.ree.es", d:"2024-01-01", s:"stable", a:["C-Suite","Sales"] }
    ]},
  ppaFramework:{ sig:"stable", a:["Sales","C-Suite"],
    sum:"One of Europe's largest and fastest-growing PPA markets; REER contracts and PPAs are separate frameworks",
    note:"Spain's high solar irradiance and competitive generation costs drive strong corporate PPA demand. Electric Avenue's contract management must handle REER + PPA as separate instruments.",
    facts:[
      { t:"Spain is one of Europe's largest corporate PPA markets. No dedicated PPA law; governed by general civil law and energy regulations. REER producers cannot simultaneously hold a PPA for the same capacity.", sl:"CNMC / MITECO — Market Overview", su:"https://www.cnmc.es", d:"2024-01-01", s:"stable", a:["Sales","C-Suite"] }
    ]},
  regulatoryTrajectory:{ sig:"evolving", a:["C-Suite","Product","Sales"],
    sum:"EBGL integration complete; storage regulations evolving post-MITECO consultation; RED III and EMD Reform transposition pending",
    note:"Spain's regulatory direction is clearly pro-storage and pro-flexibility. Active monitoring of REE/CNMC consultations recommended.",
    facts:[
      { t:"EBGL integration roadmap complete: PICASSO, MARI, TERRE operational. Quarter-hourly programming live. Spain fully harmonised with European balancing regulation.", sl:"REE — EBGL Roadmap (ESIOS)", su:"https://www.esios.ree.es", d:"2024-01-01", s:"stable", a:["Product","Data"] },
      { t:"Post-MITECO consultations on dedicated storage regulation ongoing. CNMC BOE-A-2019-18423 confirmed equal treatment as starting point.", sl:"CNMC / MITECO — Storage Regulation", su:"https://www.miteco.gob.es", d:"2024-01-01", s:"evolving", a:["Product","C-Suite"], f:"monitoring" },
      { t:"Reg. EU 2024/1747 (EMD Reform) and RED III transposition into Spanish law pending. Expected via amendments to Law 24/2013 and CNMC Circular 3/2019.", sl:"EUR-Lex + MITECO — Transposition Status", su:"https://eur-lex.europa.eu/eli/reg/2024/1747/oj/eng", d:"2024-06-13", s:"fast-moving", a:["C-Suite","Product"], f:"monitoring" }
    ]}
}};

// ═══════════════════════════════════════════════════════════
// COMPARISON DATA
// ═══════════════════════════════════════════════════════════

const COMPARE_DIMS = [
  { id:"ancillary", label:"Ancillary Services & BESS" },
  { id:"support", label:"Support Schemes" },
  { id:"negative", label:"Negative Price Rules" }
];

const COMPARE_DATA = {
  ancillary: { title:"Ancillary Services & BESS Access", rows:[
    { p:"FCR Min Bid", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"1 MW",sl:"50Hertz FCR",su:"https://50hertz.com"}, BE:{v:"1 MW",sl:"Elia GFA FCR",su:"https://elia.be"}, ES:{v:"N/A",sl:"REE",su:"https://ree.es"} },
    { p:"FCR Activation", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"30 seconds",sl:"50Hertz FCR",su:"https://50hertz.com"}, BE:{v:"30 seconds",sl:"Elia GFA FCR",su:"https://elia.be"}, ES:{v:"N/A",sl:"REE",su:"https://ree.es"} },
    { p:"FCR Remuneration", FR:{v:"Capacity only",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"Capacity only",sl:"50Hertz FCR",su:"https://50hertz.com"}, BE:{v:"Capacity only",sl:"Elia GFA FCR",su:"https://elia.be"}, ES:{v:"N/A",sl:"REE",su:"https://ree.es"} },
    { p:"aFRR Min Bid", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"1 MW",sl:"regelleistung.net",su:"https://regelleistung.net"}, BE:{v:"1 MW",sl:"Elia aFRR Design Note",su:"https://elia.be"}, ES:{v:"1 MW (prog. unit)",sl:"CNMC BOE-A-2019-18423",su:"https://boe.es"} },
    { p:"aFRR Full Activation", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"5 minutes",sl:"50Hertz aFRR",su:"https://50hertz.com"}, BE:{v:"5 min (from Dec 2024)",sl:"Elia aFRR Design Note",su:"https://elia.be"}, ES:{v:"20 sec – 15 min",sl:"REE Ancillary Services",su:"https://ree.es"} },
    { p:"aFRR Platform", FR:{v:"PICASSO",sl:"RTE Balancing Portal",su:"https://services-rte.com"}, DE:{v:"PICASSO",sl:"regelleistung.net",su:"https://regelleistung.net"}, BE:{v:"PICASSO (live Nov 2024)",sl:"Elia aFRR Design Note",su:"https://elia.be"}, ES:{v:"PICASSO",sl:"REE / CNMC",su:"https://ree.es"} },
    { p:"mFRR Min Bid", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"1 MW",sl:"regelleistung.net",su:"https://regelleistung.net"}, BE:{v:"1 MW",sl:"Elia mFRR BSP",su:"https://elia.be"}, ES:{v:"1 MW (prog. unit)",sl:"CNMC BOE-A-2019-18423",su:"https://boe.es"} },
    { p:"mFRR Activation", FR:{v:"Per MA-RE Ch.4",sl:"RTE MA-RE Ch.4",su:"https://services-rte.com",f:"ref"}, DE:{v:"12.5 minutes",sl:"50Hertz mFRR",su:"https://50hertz.com"}, BE:{v:"15 minutes",sl:"Elia mFRR BSP",su:"https://elia.be"}, ES:{v:"15 minutes",sl:"REE PO 7.3",su:"https://ree.es"} },
    { p:"mFRR Platform", FR:{v:"MARI",sl:"RTE Balancing Portal",su:"https://services-rte.com"}, DE:{v:"MARI",sl:"regelleistung.net",su:"https://regelleistung.net"}, BE:{v:"MARI",sl:"Elia mFRR BSP",su:"https://elia.be"}, ES:{v:"MARI",sl:"REE PO 7.3",su:"https://ree.es"} },
    { p:"BESS Status", FR:{v:"Eligible, prequalification required",sl:"RTE MA-RE Ch.2",su:"https://services-rte.com"}, DE:{v:"1.76 GW in FCR (active)",sl:"50Hertz BESS Figures 2025",su:"https://50hertz.com"}, BE:{v:"Eligible (Non-CIPU)",sl:"Elia GFA FCR Non-CIPU",su:"https://elia.be"}, ES:{v:"Equal treatment confirmed",sl:"CNMC BOE-A-2019-18423",su:"https://boe.es"} },
    { p:"Capacity Mechanism", FR:{v:"Mécanisme de capacité",sl:"EPEX SPOT Op. Rules §80",su:"https://epexspot.com"}, DE:{v:"None (energy-only)",sl:"BNetzA Monitoring 2025",su:"https://bundesnetzagentur.de"}, BE:{v:"CRM (storage eligible)",sl:"Elia CRM Functioning Rules",su:"https://elia.be"}, ES:{v:"None (energy-only)",sl:"REE System Overview",su:"https://ree.es"} }
  ]},
  support: { title:"Support Schemes & Direct Marketing", rows:[
    { p:"Primary Scheme", FR:{v:"CR sliding premium + OA FIT",sl:"Law 2015-992 + Code énergie",su:"https://legifrance.gouv.fr"}, DE:{v:"EEG market premium (Marktprämie)",sl:"EEG 2023 §48",su:"https://gesetze-im-internet.de"}, BE:{v:"Green certificates (regional)",sl:"Flemish Energy Decree Art. 7.1.6/7",su:"https://elia.be"}, ES:{v:"REER fixed-price auction",sl:"RD 960/2020 BOE-A-2020-13831",su:"https://boe.es"} },
    { p:"Direct Marketing Threshold", FR:{v:"200 kW (from Jan 2026)",sl:"Décret 2025-498",su:"https://legifrance.gouv.fr"}, DE:{v:"100 kW (EEG 2023 §48(1))",sl:"EEG 2023 §48",su:"https://gesetze-im-internet.de"}, BE:{v:"N/A (GC scheme)",sl:"VREG / CWaPE / Brugel",su:"https://vreg.be"}, ES:{v:"N/A (auction-based)",sl:"RD 960/2020",su:"https://boe.es"} },
    { p:"Pricing Mechanism", FR:{v:"Sliding premium / Fixed FIT",sl:"Code énergie L.314-18",su:"https://legifrance.gouv.fr"}, DE:{v:"Market premium = reference – market price",sl:"EEG 2023 Annex 1",su:"https://netztransparenz.de"}, BE:{v:"Minimum GC purchase price",sl:"VREG / CWaPE regulation",su:"https://vreg.be"}, ES:{v:"Pay-as-bid (REER auction)",su:"https://boe.es",sl:"RD 960/2020 + Law 24/2013"} },
    { p:"Market Operator", FR:{v:"EPEX SPOT (DA + intraday)",sl:"EPEX SPOT Operational Rules",su:"https://epexspot.com"}, DE:{v:"EPEX SPOT + EEX",sl:"EPEX SPOT Operational Rules",su:"https://epexspot.com"}, BE:{v:"EPEX SPOT (DA + intraday)",sl:"EPEX SPOT Operational Rules",su:"https://epexspot.com"}, ES:{v:"OMIE (Iberian)",sl:"OMIE Market Rules",su:"https://omie.es"} },
    { p:"ISP", FR:{v:"15 min (since Jan 2025)",sl:"RTE ISP Transition Jan 2025",su:"https://services-rte.com"}, DE:{v:"15 min (EBGL)",sl:"EBGL Art. 53",su:"https://eur-lex.europa.eu/eli/reg/2017/2195/oj/eng"}, BE:{v:"15 min",sl:"Elia Imbalance Prices 15",su:"https://elia.be"}, ES:{v:"15 min (BOE-A-2022-4969)",sl:"CNMC BOE-A-2022-4969",su:"https://www.boe.es/buscar/doc.php?id=BOE-A-2022-4969"} }
  ]},
  negative: { title:"Negative Price Rules", rows:[
    { p:"Support Suspension Rule", FR:{v:"CR arrêtés: technology-specific threshold; June 2025 decree addresses negative price exposure",sl:"CR Arrêté PV Apr 2018 + Décret 2025-498",su:"https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051698565"}, DE:{v:"Market premium = 0 if DA price negative for ≥ 6 consecutive hours (EEG §51)",sl:"EEG 2023 §51",su:"https://gesetze-im-internet.de"}, BE:{v:"Not yet retrieved from primary sources",sl:"CREG / VREG / CWaPE",su:"https://creg.be",f:"mon"}, ES:{v:"RD 960/2020 Art. 18-19 (detail not yet retrieved)",sl:"RD 960/2020 BOE-A-2020-13831",su:"https://boe.es",f:"mon"} },
    { p:"Threshold / Duration", FR:{v:"Defined in technology arrêtés (primary source reference)",sl:"CR Arrêtés — primary source",su:"https://legifrance.gouv.fr",f:"ref"}, DE:{v:"6 consecutive negative hours; exemptions <100 kW, <2 kW",sl:"EEG 2023 §51(1)",su:"https://gesetze-im-internet.de"}, BE:{v:"Under active monitoring",sl:"CREG",su:"https://creg.be",f:"mon"}, ES:{v:"Under active monitoring",sl:"CNMC / MITECO",su:"https://miteco.gob.es",f:"mon"} },
    { p:"Electric Avenue Relevance", FR:{v:"Revenue impact quantification + negative price alerts",sl:"",su:""}, DE:{v:"Market premium tracking + consecutive hour counter",sl:"",su:""}, BE:{v:"Active monitoring priority",sl:"",su:""}, ES:{v:"Active monitoring priority",sl:"",su:""} }
  ]}
};

// ═══════════════════════════════════════════════════════════
// REGULATORY UPDATES (static, always shown in Developments)
// ═══════════════════════════════════════════════════════════

const UPDATES = [
  { date:"2026-04-01", cc:"BE", title:"CREG/Elia System Balancing Philosophy 2026", body:"Strategic framework for real-time imbalance management. Faster flexibility, lower barriers for BSPs, optimised aFRR/mFRR mix. Key signal for storage and aggregators.", sig:"fast-moving", sl:"Elia Newsroom", su:"https://www.elia.be/en/newsroom/2026/04/20260402_system-balancing-philosophy", a:["C-Suite","Product","Sales"] },
  { date:"2025-06-07", cc:"FR", title:"Décret 2025-498 — OA/CR thresholds to 200 kW", body:"Articles D.314-15 and D.314-23 modified. OA ceiling lowered to 200 kW for PV from 2026. Justified by EU state-aid compliance and negative price mitigation.", sig:"fast-moving", sl:"Décret 2025-498 — Journal Officiel", su:"https://www.legifrance.gouv.fr/", a:["Product","Sales","C-Suite"] },
  { date:"2025-04-22", cc:"DE", title:"BNetzA BK6-23-010: inertia product design finalised", body:"First inertia auction foreseen 2026. Premium and basic products with fixed-price remuneration. BESS explicitly eligible.", sig:"evolving", sl:"BNetzA Decision BK6-23-010", su:"https://www.bundesnetzagentur.de", a:["Product","C-Suite","Sales"] },
  { date:"2025-04-10", cc:"BE", title:"CREG B2991 — revised T&C BRP approved", body:"Updated Terms & Conditions for BRPs incorporating post-PICASSO imbalance price components. Faster settlement incentive introduced.", sig:"evolving", sl:"CREG Decision B2991", su:"https://www.creg.be/fr/publications/decision-b2991", a:["Data","Product"] },
  { date:"2025-01-01", cc:"FR", title:"France transitions to 15-minute ISP", body:"Imbalance Settlement Period harmonised to 15 minutes per EBGL (Reg. EU 2017/2195). CRE derogation expired.", sig:"stable", sl:"RTE — ISP Transition News", su:"https://www.services-rte.com/en/news/br-party-system-transition-to-the-15-minute-imbalance-settlement.html", a:["Data","Product"] },
  { date:"2024-11-26", cc:"BE", title:"Belgium connects to PICASSO for aFRR", body:"Elia joins PICASSO. aFRR Full Activation Time reduced from 7.5 to 5 minutes. Major efficiency gain for aFRR clearing.", sig:"stable", sl:"Elia aFRR Design Note Sep 2025", su:"https://www.elia.be", a:["Product","Data"] },
  { date:"2024-06-13", cc:"EU", title:"Reg. EU 2024/1747 (EMD Reform) enters into force", body:"New rules on PPAs, two-way CfDs, peak shaving, demand response, and storage access. Transposition by FR/DE/BE/ES pending.", sig:"fast-moving", sl:"EUR-Lex 32024R1747", su:"https://eur-lex.europa.eu/eli/reg/2024/1747/oj/eng", a:["C-Suite","Product","Sales"] },
  { date:"2023-10-18", cc:"EU", title:"RED III (Directive 2023/2413) enters into force", body:"Accelerated permitting, renewable acceleration zones. Transposition deadline: 21 May 2025. Status varies by country.", sig:"evolving", sl:"EUR-Lex 32023L2413", su:"https://eur-lex.europa.eu/eli/dir/2023/2413/oj/eng", a:["C-Suite","Product","Sales"] },
  { date:"2021-10-01", cc:"DE", title:"Redispatch 2.0 enters into force (EnWG §13a)", body:"Threshold lowered to 100 kW. Direct marketers must trade curtailed volumes on spot and compensate producers at market value.", sig:"stable", sl:"EnWG §13a", su:"https://www.gesetze-im-internet.de/enwg_2005/__13a.html", a:["Product","Data","Sales"] }
];

const RSS_FEEDS = [
  "https://www.cleanenergywire.org/rss.xml",
  "https://www.rechargenews.com/rss"
];

// ═══════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════

function SigDot({ s, size=8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:SC[s]||"#888", flexShrink:0 }} />;
}

function AudTag({ aud }) {
  const c = AC[aud]||"#888";
  return <span style={{ fontSize:10, padding:"1px 6px", borderRadius:3, background:`${c}22`, color:c, fontWeight:600, letterSpacing:"0.02em", whiteSpace:"nowrap" }}>{aud}</span>;
}

function SrcChip({ label, url, flag }) {
  if (!label) return null;
  const style = {
    fontSize:10, padding:"2px 7px", borderRadius:4, fontFamily:"monospace",
    background: flag==="monitoring" ? "rgba(239,68,68,0.12)" : flag==="reference" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.07)",
    color: flag==="monitoring" ? "#ef4444" : flag==="reference" ? "#f59e0b" : "#94a3b8",
    border:`0.5px solid ${flag==="monitoring"?"rgba(239,68,68,0.25)":flag==="reference"?"rgba(245,158,11,0.25)":"rgba(255,255,255,0.1)"}`,
    cursor: url ? "pointer" : "default", whiteSpace:"nowrap", maxWidth:220, overflow:"hidden", textOverflow:"ellipsis",
    display:"inline-block"
  };
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...style, textDecoration:"none" }} title={label}>{flag==="monitoring"?"⚑ ":flag==="reference"?"⊕ ":""}{label}</a>
    : <span style={style} title={label}>{label}</span>;
}

// ═══════════════════════════════════════════════════════════
// EUROPE SVG MAP
// ═══════════════════════════════════════════════════════════

const SVG_INACTIVE = [
  ["PT","M 150 425 L 193 418 L 206 436 L 200 473 L 185 510 L 163 517 L 148 499 L 142 463 Z"],
  ["UK","M 250 246 L 296 220 L 348 210 L 364 228 L 349 267 L 364 287 L 352 313 L 309 324 L 272 309 L 248 279 Z"],
  ["IE","M 213 233 L 244 222 L 254 242 L 239 263 L 215 264 Z"],
  ["NL","M 440 252 L 480 241 L 506 247 L 508 264 L 488 273 L 450 270 L 435 261 Z"],
  ["LU","M 462 309 L 478 305 L 485 317 L 475 330 L 459 323 Z"],
  ["CH","M 460 411 L 499 403 L 541 407 L 552 421 L 535 436 L 496 441 L 463 431 Z"],
  ["AT","M 540 406 L 583 397 L 625 402 L 636 417 L 618 433 L 575 440 L 542 433 Z"],
  ["CZ","M 546 363 L 583 353 L 621 357 L 635 373 L 623 391 L 581 395 L 548 385 Z"],
  ["PL","M 598 263 L 648 249 L 691 253 L 722 269 L 727 303 L 712 343 L 691 369 L 655 379 L 617 369 L 585 349 L 572 319 L 574 289 Z"],
  ["DK","M 488 193 L 525 181 L 551 187 L 555 207 L 533 225 L 497 221 Z"],
  ["SE/NO","M 474 156 L 529 126 L 589 109 L 649 116 L 691 143 L 709 181 L 691 221 L 649 245 L 601 255 L 551 251 L 513 237 L 485 207 L 472 179 Z"],
  ["IT","M 474 423 L 519 409 L 551 417 L 567 443 L 561 479 L 545 516 L 517 549 L 495 555 L 480 541 L 474 511 L 470 475 Z"],
  ["BAL","M 544 411 L 582 399 L 618 401 L 632 418 L 638 436 L 620 449 L 592 449 L 565 437 Z"],
  ["GR","M 616 454 L 651 444 L 671 458 L 663 482 L 638 496 L 615 486 Z"]
];

const SVG_ACTIVE = {
  ES:{ path:"M 178 397 L 234 380 L 290 375 L 350 378 L 398 391 L 424 413 L 422 449 L 401 479 L 360 501 L 310 511 L 262 508 L 222 494 L 191 469 L 178 443 Z", lx:300, ly:448 },
  FR:{ path:"M 258 286 L 314 267 L 362 261 L 412 267 L 452 286 L 468 315 L 464 351 L 450 385 L 422 407 L 392 417 L 354 414 L 316 401 L 285 379 L 261 349 L 255 317 Z", lx:363, ly:342 },
  BE:{ path:"M 416 269 L 464 263 L 480 276 L 477 299 L 451 309 L 419 303 L 411 286 Z", lx:445, ly:288 },
  DE:{ path:"M 462 263 L 510 249 L 558 245 L 598 259 L 628 281 L 634 319 L 620 361 L 600 395 L 568 411 L 536 411 L 506 395 L 480 367 L 462 333 L 455 296 Z", lx:545, ly:328 }
};

function EuropeMap({ sel, onSel, hov, onHov }) {
  return (
    <svg viewBox="0 0 900 600" style={{ width:"100%", height:"100%", display:"block" }}>
      <rect width="900" height="600" fill="#060c18"/>
      {SVG_INACTIVE.map(([id, d]) => (
        <path key={id} d={d} fill="#1a2535" stroke="#243448" strokeWidth="0.8"/>
      ))}
      {Object.entries(SVG_ACTIVE).map(([id, { path, lx, ly }]) => {
        const m = META[id];
        const isS = sel===id, isH = hov===id;
        const fill = isS ? m.color+"55" : isH ? m.color+"30" : m.color+"18";
        return (
          <g key={id} onClick={()=>onSel(id)} onMouseEnter={()=>onHov(id)} onMouseLeave={()=>onHov(null)} style={{cursor:"pointer"}}>
            {isS && m.sig==="fast-moving" && (
              <path d={path} fill="none" stroke={m.color} strokeWidth="6" opacity="0.15" style={{animation:"pulse-ring 1.8s ease-out infinite"}}/>
            )}
            <path d={path} fill={fill} stroke={m.color} strokeWidth={isS?2:1} style={{transition:"all 0.18s ease"}}/>
            <text x={lx} y={ly} textAnchor="middle" fill={isS?"#fff":m.color} fontSize={id==="BE"?9:11} fontWeight="600" style={{pointerEvents:"none",fontFamily:"system-ui,sans-serif"}}>
              {m.flag} {id==="BE"?"BE":m.name}
            </text>
            <circle cx={lx+20} cy={ly-16} r="4" fill={SC[m.sig]||"#888"} style={{pointerEvents:"none"}}/>
          </g>
        );
      })}
      <style>{`@keyframes pulse-ring{0%{stroke-width:2;opacity:0.4}100%{stroke-width:18;opacity:0}}`}</style>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// FACT + DIMENSION COMPONENTS
// ═══════════════════════════════════════════════════════════

function FactItem({ f }) {
  return (
    <div style={{ padding:"10px 12px", borderBottom:"0.5px solid #1c2a3f", background:"#0c1522" }}>
      <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
        <SigDot s={f.s} size={6} />
        <span style={{ fontSize:12.5, color:"#c8d4e8", lineHeight:1.55, flex:1 }}>{f.t}</span>
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingLeft:14 }}>
        <SrcChip label={f.sl} url={f.su} flag={f.f}/>
        {(f.a||[]).map(a=><AudTag key={a} aud={a}/>)}
      </div>
    </div>
  );
}

function DimPanel({ dim, data, expanded, onToggle }) {
  if (!data) return null;
  return (
    <div style={{ borderBottom:"0.5px solid #1c2a3f" }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", background: expanded?"#0f1e30":"transparent", transition:"background 0.15s" }}>
        <span style={{ fontSize:15 }}>{dim.icon}</span>
        <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#dde8f8" }}>{dim.label}</span>
        <SigDot s={data.sig}/>
        <div style={{ display:"flex", gap:4 }}>
          {(data.a||[]).slice(0,3).map(a=><AudTag key={a} aud={a}/>)}
        </div>
        <span style={{ color:"#4a6080", fontSize:12, marginLeft:4 }}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div>
          <div style={{ padding:"9px 16px 9px 16px", borderBottom:"0.5px solid #1c2a3f" }}>
            <p style={{ fontSize:12, color:"#7a9bbf", margin:"0 0 6px 0" }}>{data.sum}</p>
            <div style={{ display:"flex", gap:6, alignItems:"flex-start", background:"rgba(16,185,129,0.06)", borderRadius:4, padding:"7px 10px", borderLeft:"2px solid #10b981" }}>
              <span style={{ fontSize:11, color:"#10b981", marginTop:1 }}>▸</span>
              <span style={{ fontSize:11.5, color:"#4db888", lineHeight:1.5 }}><strong style={{color:"#10b981"}}>Electric Avenue:</strong> {data.note}</span>
            </div>
          </div>
          {(data.facts||[]).map((f,i)=><FactItem key={i} f={f}/>)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COUNTRY PROFILE
// ═══════════════════════════════════════════════════════════

function CountryProfile({ id, audFilt }) {
  const [exp, setExp] = useState(new Set(["marketAccess"]));
  const m = META[id]; const d = DATA[id];
  if (!m||!d) return null;
  const toggle = dim => setExp(p => { const n=new Set(p); n.has(dim)?n.delete(dim):n.add(dim); return n; });
  return (
    <div>
      <div style={{ padding:"16px 20px", borderBottom:"0.5px solid #1c2a3f", background:"#0a1525" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:28 }}>{m.flag}</span>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#edf4ff" }}>{m.name}</h2>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
              <SigDot s={m.sig}/><span style={{ fontSize:12, color:SC[m.sig] }}>{SL[m.sig]}</span>
              <span style={{ fontSize:11, color:"#4a6080" }}>·</span>
              <span style={{ fontSize:12, color:"#7a9bbf" }}>{m.hl}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[["TSO",m.tso,m.tsoU],["Regulator",m.reg,m.regU],["Market Op.",m.mop,m.mopU]].map(([lbl,val,url])=>(
            <div key={lbl} style={{ background:"#101e30", border:"0.5px solid #1e3050", borderRadius:5, padding:"4px 10px" }}>
              <span style={{ fontSize:10, color:"#4a6080", marginRight:4 }}>{lbl}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:m.color, fontWeight:600, textDecoration:"none" }}>{val}</a>
            </div>
          ))}
        </div>
      </div>
      {DIMS.map(dim => (
        <DimPanel key={dim.id} dim={dim} data={d[dim.id]} expanded={exp.has(dim.id)} onToggle={()=>toggle(dim.id)}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW CARDS (no country selected)
// ═══════════════════════════════════════════════════════════

function Overview({ onSel }) {
  return (
    <div style={{ padding:20 }}>
      <p style={{ fontSize:13, color:"#4a6080", marginBottom:16 }}>Select a country to open the full intelligence brief.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {Object.entries(META).map(([id,m])=>(
          <div key={id} onClick={()=>onSel(id)} style={{ background:"#0c1828", border:`0.5px solid ${m.color}40`, borderRadius:8, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color+"90"; e.currentTarget.style.background="#0f1f32";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=m.color+"40"; e.currentTarget.style.background="#0c1828";}}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:24 }}>{m.flag}</span>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <SigDot s={m.sig}/><span style={{ fontSize:10, color:SC[m.sig] }}>{SL[m.sig]}</span>
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#edf4ff", marginBottom:3 }}>{m.name}</div>
            <div style={{ fontSize:11, color:"#7a9bbf", lineHeight:1.4 }}>{m.hl}</div>
            <div style={{ marginTop:10, display:"flex", gap:5, flexWrap:"wrap" }}>
              {[["TSO",m.tso],["Reg.",m.reg]].map(([k,v])=>(
                <span key={k} style={{ fontSize:10, color:"#4a6080" }}><span style={{ color:"#2d4060" }}>{k}: </span>{v.split(" / ")[0]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPARISON VIEW
// ═══════════════════════════════════════════════════════════

function CompareView() {
  const [dim, setDim] = useState("ancillary");
  const cd = COMPARE_DATA[dim];
  return (
    <div>
      <div style={{ padding:"12px 16px", borderBottom:"0.5px solid #1c2a3f", display:"flex", gap:8, flexWrap:"wrap" }}>
        {COMPARE_DIMS.map(d=>(
          <button key={d.id} onClick={()=>setDim(d.id)} style={{ padding:"5px 12px", borderRadius:5, fontSize:12, fontWeight: dim===d.id?600:400, cursor:"pointer", border:`0.5px solid ${dim===d.id?"#10b981":"#1e3050"}`, background: dim===d.id?"rgba(16,185,129,0.12)":"transparent", color: dim===d.id?"#10b981":"#7a9bbf" }}>{d.label}</button>
        ))}
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#0a1525" }}>
              <th style={{ padding:"10px 14px", textAlign:"left", color:"#4a6080", fontWeight:600, fontSize:11, borderBottom:"0.5px solid #1c2a3f", minWidth:140 }}>Parameter</th>
              {["FR","DE","BE","ES"].map(id=>(
                <th key={id} style={{ padding:"10px 14px", textAlign:"left", color:META[id].color, fontWeight:700, fontSize:12, borderBottom:`0.5px solid ${META[id].color}40`, minWidth:160 }}>
                  {META[id].flag} {META[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cd.rows.map((row,ri)=>(
              <tr key={ri} style={{ borderBottom:"0.5px solid #1a2535", background: ri%2===0?"transparent":"#080f1c" }}>
                <td style={{ padding:"9px 14px", color:"#7a9bbf", fontWeight:600, fontSize:11, verticalAlign:"top" }}>{row.p}</td>
                {["FR","DE","BE","ES"].map(id=>{
                  const cell = row[id];
                  return (
                    <td key={id} style={{ padding:"9px 14px", color:"#c8d4e8", verticalAlign:"top" }}>
                      <div style={{ marginBottom:4 }}>{cell.v}</div>
                      {cell.sl && <SrcChip label={cell.sl} url={cell.su} flag={cell.f==="ref"?"reference":cell.f==="mon"?"monitoring":null}/>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEWS FEED (async RSS + static regulatory updates)
// ═══════════════════════════════════════════════════════════

function NewsFeed() {
  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/feed")
    .then(r => r.json())
    .then(d => { setLiveItems(d.items || []); setLoading(false); })
    .catch(() => setLoading(false));
}, []);

  const ccColor = { FR:META.FR.color, DE:META.DE.color, BE:META.BE.color, ES:META.ES.color, EU:"#10b981" };
  const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); } catch{return d;} };

  return (
    <div>
      <div style={{ padding:"14px 16px 10px", borderBottom:"0.5px solid #1c2a3f" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#dde8f8" }}>Regulatory Changes</span>
        <span style={{ fontSize:11, color:"#4a6080", marginLeft:8 }}>sourced + dated</span>
      </div>
      {UPDATES.map((u,i)=>(
        <div key={i} style={{ padding:"12px 16px", borderBottom:"0.5px solid #1a2535", display:"flex", gap:12 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:36 }}>
            <SigDot s={u.sig} size={9}/>
            <span style={{ fontSize:9.5, color:ccColor[u.cc]||"#10b981", fontWeight:700, letterSpacing:"0.05em" }}>{u.cc}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12.5, fontWeight:600, color:"#dde8f8" }}>{u.title}</span>
              <span style={{ fontSize:10, color:"#4a6080", marginLeft:8, whiteSpace:"nowrap" }}>{fmtDate(u.date)}</span>
            </div>
            <p style={{ margin:"0 0 6px", fontSize:11.5, color:"#7a9bbf", lineHeight:1.5 }}>{u.body}</p>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <SrcChip label={u.sl} url={u.su}/>
              {u.a.map(a=><AudTag key={a} aud={a}/>)}
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding:"14px 16px 10px", borderBottom:"0.5px solid #1c2a3f", borderTop:"0.5px solid #1c2a3f", marginTop:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#dde8f8" }}>Live Market Intelligence</span>
        {loading && <span style={{ fontSize:11, color:"#4a6080", marginLeft:8, animation:"blink 1.2s infinite" }}>loading feeds…</span>}
      </div>
      {loading ? (
        <div style={{ padding:"12px 16px" }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{ height:56, background:"#0c1828", borderRadius:5, marginBottom:8, animation:"blink 1.4s infinite" }}/>
          ))}
        </div>
      ) : liveItems.length===0 ? (
        <div style={{ padding:"16px", fontSize:12, color:"#4a6080" }}>Live feed unavailable. See regulatory changes above for sourced updates.</div>
      ) : liveItems.map((item,i)=>(
        <div key={i} style={{ padding:"10px 16px", borderBottom:"0.5px solid #1a2535" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:3 }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:12.5, fontWeight:600, color:"#a8c4e8", textDecoration:"none", lineHeight:1.4 }}>{item.title}</a>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
            <span style={{ fontSize:10, color:"#10b981", fontWeight:600 }}>{item.source}</span>
            <span style={{ fontSize:10, color:"#4a6080" }}>{fmtDate(item.date)}</span>
          </div>
        </div>
      ))}
      <style>{`@keyframes blink{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function ElectricAvenue() {
  const [sel, setSel] = useState(null);
  const [hov, setHov] = useState(null);
  const [tab, setTab] = useState("overview");

  const handleSel = id => {
    setSel(id);
    setTab("profile");
  };

  const TABS = [
    { id:"profile", label: sel ? `${META[sel].flag} ${META[sel].name}` : "Country Profile", disabled:!sel },
    { id:"compare", label:"Compare Markets" },
    { id:"news", label:"Developments" }
  ];

  const bg = "#060c18";
  const surface = "#09111e";
  const border = "#1c2a3f";

  return (
    <div style={{ display:"flex", height:"100vh", background:bg, fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflow:"hidden" }}>

      {/* LEFT PANEL */}
      <div style={{ width:360, flexShrink:0, display:"flex", flexDirection:"column", borderRight:`0.5px solid ${border}`, background:surface }}>
        {/* Electric Avenue header */}
        <div style={{ padding:"12px 16px", borderBottom:`0.5px solid ${border}`, background:"#060d1a" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981" }}/>
            <span style={{ fontSize:13, fontWeight:800, color:"#10b981", letterSpacing:"0.08em" }}>ELECTRIC AVENUE</span>
          </div>
          <div style={{ fontSize:10.5, color:"#3a5a7a", letterSpacing:"0.04em" }}>POWER MARKET REFERENCE · FR · DE · BE · ES · JUNE 2026</div>
        </div>
        {/* Map */}
        <div style={{ flex:"0 0 320px", padding:"8px" }}>
          <EuropeMap sel={sel} onSel={handleSel} hov={hov} onHov={setHov}/>
        </div>
        {/* Country signal cards */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 8px 8px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {Object.entries(META).map(([id,m])=>(
              <div key={id} onClick={()=>handleSel(id)} style={{ background: sel===id?`${m.color}12`:"#0a1525", border:`0.5px solid ${sel===id?m.color+"60":border}`, borderRadius:6, padding:"9px 11px", cursor:"pointer" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color+"50";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=sel===id?m.color+"60":border;}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{m.flag}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <SigDot s={m.sig} size={6}/>
                    <span style={{ fontSize:9, color:SC[m.sig] }}>{SL[m.sig]}</span>
                  </div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#dde8f8", marginBottom:2 }}>{m.name}</div>
                <div style={{ fontSize:9.5, color:"#4a6080", lineHeight:1.35 }}>{m.hl.slice(0,52)}{m.hl.length>52?"…":""}</div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ marginTop:10, padding:"8px 10px", background:"#070e1a", borderRadius:5, border:`0.5px solid ${border}` }}>
            <div style={{ fontSize:10, color:"#3a5a7a", marginBottom:5, fontWeight:600 }}>SIGNAL / AUDIENCE</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(SC).map(([k,c])=>(
                <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <SigDot s={k} size={6}/><span style={{ fontSize:9.5, color:"#4a6080" }}>{SL[k]}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
              {Object.keys(AC).map(a=><AudTag key={a} aud={a}/>)}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Tab bar */}
        <div style={{ display:"flex", borderBottom:`0.5px solid ${border}`, background:"#060d1a", flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>!t.disabled&&setTab(t.id)} disabled={t.disabled} style={{
              padding:"12px 20px", fontSize:12.5, fontWeight: tab===t.id?700:400,
              color: t.disabled?"#2a3f5a" : tab===t.id?"#10b981":"#7a9bbf",
              background:"transparent", border:"none", borderBottom: tab===t.id?"2px solid #10b981":"2px solid transparent",
              cursor: t.disabled?"default":"pointer", transition:"all 0.15s"
            }}>{t.label}</button>
          ))}
          <div style={{ flex:1 }}/>
          <div style={{ padding:"12px 20px", fontSize:10, color:"#2a4060", alignSelf:"center" }}>
            ⊕ Primary sources · ⚑ Active monitoring
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {tab==="profile" && (sel ? <CountryProfile id={sel}/> : <Overview onSel={handleSel}/>)}
          {tab==="compare" && <CompareView/>}
          {tab==="news" && <NewsFeed/>}
        </div>
      </div>
    </div>
  );
}