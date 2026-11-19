// ── Bygningstype-konfigurasjon for SXI — nøklar = z.bygkat-verdiar ──
// working_days-strengene er henta direkte frå referansefil Testbygg_1000.sxi
const WD_ALLE = {
  working_days:'Drift alle dager', working_days_en:'7-day week, no holiday',
  working_days_jan:'1111111111111111111111111111111', working_days_feb:'1111111111111111111111111111',
  working_days_mar:'1111111111111111111111111111111', working_days_apr:'111111111111111111111111111111',
  working_days_may:'1111111111111111111111111111111', working_days_jun:'111111111111111111111111111111',
  working_days_jul:'1111111111111111111111111111111', working_days_aug:'1111111111111111111111111111111',
  working_days_sep:'111111111111111111111111111111', working_days_oct:'1111111111111111111111111111111',
  working_days_nov:'111111111111111111111111111111', working_days_dec:'1111111111111111111111111111111',
};
const WD_5DAG = {
  working_days:'5-dagers uke ingen ferie', working_days_en:'7-day week, no holiday',
  working_days_jan:'1001111100111110011111001111100', working_days_feb:'1111100111110011111001111100',
  working_days_mar:'1111100111110011111001111100111', working_days_apr:'110011111001111100111110011111',
  working_days_may:'0011111001111100111110011111001', working_days_jun:'111100111110011111001111100111',
  working_days_jul:'1100111110011111001111100111110', working_days_aug:'0111110011111001111100111110011',
  working_days_sep:'111001111100111110011111001111', working_days_oct:'1001111100111110011111001111100',
  working_days_nov:'111110011111001111100111110011', working_days_dec:'1110011111001111100111110011111',
};
const WD_5DAG_8FERIE = {
  working_days:'5-dagers uke 8 uker ferie', working_days_en:'7-day week, no holiday',
  working_days_jan:'1001111100111110011111001111100', working_days_feb:'1111100111110011111001111100',
  working_days_mar:'1111100111110011111001111100111', working_days_apr:'110011111001111100111110011111',
  working_days_may:'0011111001111100111110011111001', working_days_jun:'111100111110011111001111100000',
  working_days_jul:'0000000000000000000000000000000', working_days_aug:'0000000000000001111100111110011',
  working_days_sep:'111001111100111110011111001111', working_days_oct:'1001111100111110011111001111100',
  working_days_nov:'111110011111001111100111110011', working_days_dec:'1110011111001111100111110000000',
};
const WD_6DAG = {
  working_days:'6-dagers uke ingen ferie', working_days_en:'7-day week, no holiday',
  working_days_jan:'1101111110111111011111101111110', working_days_feb:'1111110111111011111101111110',
  working_days_mar:'1111110111111011111101111110111', working_days_apr:'111011111101111110111111011111',
  working_days_may:'1011111101111110111111011111101', working_days_jun:'111110111111011111101111110111',
  working_days_jul:'1110111111011111101111110111111', working_days_aug:'0111111011111101111110111111011',
  working_days_sep:'111101111110111111011111101111', working_days_oct:'1101111110111111011111101111110',
  working_days_nov:'111111011111101111110111111011', working_days_dec:'1111011111101111110111111011111',
};

const BYGKAT_SXI = {
  'Småhus':                        { type:'Småhus',                            subtype:'Enebolig',              ...WD_ALLE },
  'Boligblokker':                  { type:'Boligblokk',                        subtype:'Leilighet',             ...WD_ALLE },
  'Barnehager':                    { type:'Barnehage',                         subtype:'Barnehagebygning',      ...WD_5DAG },
  'Kontorbygg':                    { type:'Kontorbygning',                     subtype:'Kontorer, enkle',       ...WD_5DAG },
  'Skolebygg':                     { type:'Skolebygning',                      subtype:'Undervisningslokaler',  ...WD_5DAG },
  'Universitets- og høgskolebygg': { type:'Universitets- og høgskolebygning',  subtype:'Undervisningsbygg',     ...WD_5DAG },
  'Sykehus':                       { type:'Sykehus',                           subtype:'Sykehus',               ...WD_ALLE },
  'Sykehjem':                      { type:'Sykehjem',                          subtype:'Sykehjembygning',       ...WD_ALLE },
  'Hoteller':                      { type:'Hotellbygning',                     subtype:'Hotellbygning',         ...WD_ALLE },
  'Idrettsbygg':                   { type:'Idrettsbygning',                    subtype:'Idrettshall',           ...WD_5DAG_8FERIE },
  'Forretningsbygg':               { type:'Forretningsbygning',                subtype:'Butikk',                ...WD_6DAG },
  'Kulturbygg':                    { type:'Kulturbygning',                     subtype:'Kulturbygning',         ...WD_5DAG },
  'Lett industri, verksteder':     { type:'Lett industribygning, verksted',    subtype:'Industribygning',       ...WD_5DAG },
};

// ── Komplette SIMIEN-profiler per bygningskategori (generert frå Bygningskategorier_2.sxi) ──
const BYGKAT_PROFILER = {
  "Sm\u00e5hus": {
    vent_supply_air: '1.20',
    vent_extract_air: '1.20',
    vent_usage_holiday: '100.00',
    vent_cooling_coil: 'no',
    vent_cooling_coil_cap: '30.0',
    vent_supply_reduced: '0.60',
    vent_extract_reduced: '1.20',
    vent_norm_on: '1.20',
    vent_norm_off: '1.20',
    uv_name: 'Småhus normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="100" percentage_0015-0030="100" percentage_0030-0045="100" percentage_0045-0100="100" percentage_0100-0115="100" percentage_0115-0130="100" percentage_0130-0145="100" percentage_0145-0200="100" percentage_0200-0215="100" percentage_0215-0230="100" percentage_0230-0245="100" percentage_0245-0300="100" percentage_0300-0315="100" percentage_0315-0330="100" percentage_0330-0345="100" percentage_0345-0400="100" percentage_0400-0415="100" percentage_0415-0430="100" percentage_0430-0445="100" percentage_0445-0500="100" percentage_0500-0515="100" percentage_0515-0530="100" percentage_0530-0545="100" percentage_0545-0600="100" percentage_0600-0615="100" percentage_0615-0630="100" percentage_0630-0645="100" percentage_0645-0700="100" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="100" percentage_2115-2130="100" percentage_2130-2145="100" percentage_2145-2200="100" percentage_2200-2215="100" percentage_2215-2230="100" percentage_2230-2245="100" percentage_2245-2300="100" percentage_2300-2315="100" percentage_2315-2330="100" percentage_2330-2345="100" percentage_2345-2400="100"',
    ig_normalized: 'no',
    ig_power_lighting: '1.70',
    ig_power_equipment: '4.80',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '1.50',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 småhus',
    ul_pct: 'percentage_0000-0015="18.13" percentage_0015-0030="18.13" percentage_0030-0045="18.13" percentage_0045-0100="18.13" percentage_0100-0115="18.13" percentage_0115-0130="18.13" percentage_0130-0145="18.13" percentage_0145-0200="18.13" percentage_0200-0215="18.13" percentage_0215-0230="18.13" percentage_0230-0245="18.13" percentage_0245-0300="18.13" percentage_0300-0315="18.13" percentage_0315-0330="18.13" percentage_0330-0345="18.13" percentage_0345-0400="18.13" percentage_0400-0415="18.13" percentage_0415-0430="18.13" percentage_0430-0445="18.13" percentage_0445-0500="18.13" percentage_0500-0515="18.13" percentage_0515-0530="18.13" percentage_0530-0545="18.13" percentage_0545-0600="18.13" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="18.13" percentage_2315-2330="18.13" percentage_2330-2345="18.13" percentage_2345-2400="18.13"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 småhus',
    ue_pct: 'percentage_0000-0015="19.96" percentage_0015-0030="19.96" percentage_0030-0045="19.96" percentage_0045-0100="19.96" percentage_0100-0115="19.96" percentage_0115-0130="19.96" percentage_0130-0145="19.96" percentage_0145-0200="19.96" percentage_0200-0215="19.96" percentage_0215-0230="19.96" percentage_0230-0245="19.96" percentage_0245-0300="19.96" percentage_0300-0315="19.96" percentage_0315-0330="19.96" percentage_0330-0345="19.96" percentage_0345-0400="19.96" percentage_0400-0415="19.96" percentage_0415-0430="19.96" percentage_0430-0445="19.96" percentage_0445-0500="19.96" percentage_0500-0515="19.96" percentage_0515-0530="19.96" percentage_0530-0545="19.96" percentage_0545-0600="19.96" percentage_0600-0615="19.96" percentage_0615-0630="19.96" percentage_0630-0645="19.96" percentage_0645-0700="19.96" percentage_0700-0715="39.92" percentage_0715-0730="39.92" percentage_0730-0745="39.92" percentage_0745-0800="39.92" percentage_0800-0815="39.92" percentage_0815-0830="39.92" percentage_0830-0845="39.92" percentage_0845-0900="39.92" percentage_0900-0915="19.96" percentage_0915-0930="19.96" percentage_0930-0945="19.96" percentage_0945-1000="19.96" percentage_1000-1015="19.96" percentage_1015-1030="19.96" percentage_1030-1045="19.96" percentage_1045-1100="19.96" percentage_1100-1115="19.96" percentage_1115-1130="19.96" percentage_1130-1145="19.96" percentage_1145-1200="19.96" percentage_1200-1215="19.96" percentage_1215-1230="19.96" percentage_1230-1245="19.96" percentage_1245-1300="19.96" percentage_1300-1315="19.96" percentage_1315-1330="19.96" percentage_1330-1345="19.96" percentage_1345-1400="19.96" percentage_1400-1415="19.96" percentage_1415-1430="19.96" percentage_1430-1445="19.96" percentage_1445-1500="19.96" percentage_1500-1515="59.88" percentage_1515-1530="59.88" percentage_1530-1545="59.88" percentage_1545-1600="59.88" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="90.02" percentage_1915-1930="90.02" percentage_1930-1945="90.02" percentage_1945-2000="90.02" percentage_2000-2015="90.02" percentage_2015-2030="90.02" percentage_2030-2045="90.02" percentage_2045-2100="90.02" percentage_2100-2115="49.90" percentage_2115-2130="49.90" percentage_2130-2145="49.90" percentage_2145-2200="49.90" percentage_2200-2215="49.90" percentage_2215-2230="49.90" percentage_2230-2245="49.90" percentage_2245-2300="49.90" percentage_2300-2315="19.96" percentage_2315-2330="19.96" percentage_2330-2345="19.96" percentage_2345-2400="19.96"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 småhus',
    up_pct: 'percentage_0000-0015="100.00" percentage_0015-0030="100.00" percentage_0030-0045="100.00" percentage_0045-0100="100.00" percentage_0100-0115="100.00" percentage_0115-0130="100.00" percentage_0130-0145="100.00" percentage_0145-0200="100.00" percentage_0200-0215="100.00" percentage_0215-0230="100.00" percentage_0230-0245="100.00" percentage_0245-0300="100.00" percentage_0300-0315="100.00" percentage_0315-0330="100.00" percentage_0330-0345="100.00" percentage_0345-0400="100.00" percentage_0400-0415="100.00" percentage_0415-0430="100.00" percentage_0430-0445="100.00" percentage_0445-0500="100.00" percentage_0500-0515="100.00" percentage_0515-0530="100.00" percentage_0530-0545="100.00" percentage_0545-0600="100.00" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="100.00" percentage_2315-2330="100.00" percentage_2330-2345="100.00" percentage_2345-2400="100.00"',
    nh_on: '07.00',
    nh_off: '23.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '8.80',
    utw_name: 'Normert bruksmønster fra NS3031:2025 småhus',
    utw_pct: 'percentage_0000-0015="7.02" percentage_0015-0030="7.02" percentage_0030-0045="7.02" percentage_0045-0100="7.02" percentage_0100-0115="3.85" percentage_0115-0130="3.85" percentage_0130-0145="3.85" percentage_0145-0200="3.85" percentage_0200-0215="2.38" percentage_0215-0230="2.38" percentage_0230-0245="2.38" percentage_0245-0300="2.38" percentage_0300-0315="1.25" percentage_0315-0330="1.25" percentage_0330-0345="1.25" percentage_0345-0400="1.25" percentage_0400-0415="1.59" percentage_0415-0430="1.59" percentage_0430-0445="1.59" percentage_0445-0500="1.59" percentage_0500-0515="7.81" percentage_0515-0530="7.81" percentage_0530-0545="7.81" percentage_0545-0600="7.81" percentage_0600-0615="48.24" percentage_0615-0630="48.24" percentage_0630-0645="48.24" percentage_0645-0700="48.24" percentage_0700-0715="96.04" percentage_0715-0730="96.04" percentage_0730-0745="96.04" percentage_0745-0800="96.04" percentage_0800-0815="65.35" percentage_0815-0830="65.35" percentage_0830-0845="65.35" percentage_0845-0900="65.35" percentage_0900-0915="27.63" percentage_0915-0930="27.63" percentage_0930-0945="27.63" percentage_0945-1000="27.63" percentage_1000-1015="29.22" percentage_1015-1030="29.22" percentage_1030-1045="29.22" percentage_1045-1100="29.22" percentage_1100-1115="29.22" percentage_1115-1130="29.22" percentage_1130-1145="29.22" percentage_1145-1200="29.22" percentage_1200-1215="29.22" percentage_1215-1230="29.22" percentage_1230-1245="29.22" percentage_1245-1300="29.22" percentage_1300-1315="29.90" percentage_1315-1330="29.90" percentage_1330-1345="29.90" percentage_1345-1400="29.90" percentage_1400-1415="25.25" percentage_1415-1430="25.25" percentage_1430-1445="25.25" percentage_1445-1500="25.25" percentage_1500-1515="22.54" percentage_1515-1530="22.54" percentage_1530-1545="22.54" percentage_1545-1600="22.54" percentage_1600-1615="22.19" percentage_1615-1630="22.19" percentage_1630-1645="22.19" percentage_1645-1700="22.19" percentage_1700-1715="96.04" percentage_1715-1730="96.04" percentage_1730-1745="96.04" percentage_1745-1800="96.04" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="33.07" percentage_1915-1930="33.07" percentage_1930-1945="33.07" percentage_1945-2000="33.07" percentage_2000-2015="33.41" percentage_2015-2030="33.41" percentage_2030-2045="33.41" percentage_2045-2100="33.41" percentage_2100-2115="30.35" percentage_2115-2130="30.35" percentage_2130-2145="30.35" percentage_2145-2200="30.35" percentage_2200-2215="22.99" percentage_2215-2230="22.99" percentage_2230-2245="22.99" percentage_2245-2300="22.99" percentage_2300-2315="12.00" percentage_2315-2330="12.00" percentage_2330-2345="12.00" percentage_2345-2400="12.00"',
  },
  "Boligblokker": {
    vent_supply_air: '1.70',
    vent_extract_air: '1.70',
    vent_usage_holiday: '100.00',
    vent_cooling_coil: 'no',
    vent_cooling_coil_cap: '30.0',
    vent_supply_reduced: '0.60',
    vent_extract_reduced: '1.20',
    vent_norm_on: '1.20',
    vent_norm_off: '1.20',
    uv_name: 'Boligblokk normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="100" percentage_0015-0030="100" percentage_0030-0045="100" percentage_0045-0100="100" percentage_0100-0115="100" percentage_0115-0130="100" percentage_0130-0145="100" percentage_0145-0200="100" percentage_0200-0215="100" percentage_0215-0230="100" percentage_0230-0245="100" percentage_0245-0300="100" percentage_0300-0315="100" percentage_0315-0330="100" percentage_0330-0345="100" percentage_0345-0400="100" percentage_0400-0415="100" percentage_0415-0430="100" percentage_0430-0445="100" percentage_0445-0500="100" percentage_0500-0515="100" percentage_0515-0530="100" percentage_0530-0545="100" percentage_0545-0600="100" percentage_0600-0615="100" percentage_0615-0630="100" percentage_0630-0645="100" percentage_0645-0700="100" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="100" percentage_2115-2130="100" percentage_2130-2145="100" percentage_2145-2200="100" percentage_2200-2215="100" percentage_2215-2230="100" percentage_2230-2245="100" percentage_2245-2300="100" percentage_2300-2315="100" percentage_2315-2330="100" percentage_2330-2345="100" percentage_2345-2400="100"',
    ig_normalized: 'no',
    ig_power_lighting: '1.70',
    ig_power_equipment: '4.30',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '1.50',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 boligblokk',
    ul_pct: 'percentage_0000-0015="18.13" percentage_0015-0030="18.13" percentage_0030-0045="18.13" percentage_0045-0100="18.13" percentage_0100-0115="18.13" percentage_0115-0130="18.13" percentage_0130-0145="18.13" percentage_0145-0200="18.13" percentage_0200-0215="18.13" percentage_0215-0230="18.13" percentage_0230-0245="18.13" percentage_0245-0300="18.13" percentage_0300-0315="18.13" percentage_0315-0330="18.13" percentage_0330-0345="18.13" percentage_0345-0400="18.13" percentage_0400-0415="18.13" percentage_0415-0430="18.13" percentage_0430-0445="18.13" percentage_0445-0500="18.13" percentage_0500-0515="18.13" percentage_0515-0530="18.13" percentage_0530-0545="18.13" percentage_0545-0600="18.13" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="18.13" percentage_2315-2330="18.13" percentage_2330-2345="18.13" percentage_2345-2400="18.13"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 boligblokk',
    ue_pct: 'percentage_0000-0015="22.17" percentage_0015-0030="22.17" percentage_0030-0045="22.17" percentage_0045-0100="22.17" percentage_0100-0115="22.17" percentage_0115-0130="22.17" percentage_0130-0145="22.17" percentage_0145-0200="22.17" percentage_0200-0215="22.17" percentage_0215-0230="22.17" percentage_0230-0245="22.17" percentage_0245-0300="22.17" percentage_0300-0315="22.17" percentage_0315-0330="22.17" percentage_0330-0345="22.17" percentage_0345-0400="22.17" percentage_0400-0415="22.17" percentage_0415-0430="22.17" percentage_0430-0445="22.17" percentage_0445-0500="22.17" percentage_0500-0515="22.17" percentage_0515-0530="22.17" percentage_0530-0545="22.17" percentage_0545-0600="22.17" percentage_0600-0615="22.17" percentage_0615-0630="22.17" percentage_0630-0645="22.17" percentage_0645-0700="22.17" percentage_0700-0715="44.34" percentage_0715-0730="44.34" percentage_0730-0745="44.34" percentage_0745-0800="44.34" percentage_0800-0815="44.34" percentage_0815-0830="44.34" percentage_0830-0845="44.34" percentage_0845-0900="44.34" percentage_0900-0915="22.17" percentage_0915-0930="22.17" percentage_0930-0945="22.17" percentage_0945-1000="22.17" percentage_1000-1015="22.17" percentage_1015-1030="22.17" percentage_1030-1045="22.17" percentage_1045-1100="22.17" percentage_1100-1115="22.17" percentage_1115-1130="22.17" percentage_1130-1145="22.17" percentage_1145-1200="22.17" percentage_1200-1215="22.17" percentage_1215-1230="22.17" percentage_1230-1245="22.17" percentage_1245-1300="22.17" percentage_1300-1315="22.17" percentage_1315-1330="22.17" percentage_1330-1345="22.17" percentage_1345-1400="22.17" percentage_1400-1415="44.34" percentage_1415-1430="44.34" percentage_1430-1445="44.34" percentage_1445-1500="44.34" percentage_1500-1515="77.83" percentage_1515-1530="77.83" percentage_1530-1545="77.83" percentage_1545-1600="77.83" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="88.91" percentage_1915-1930="88.91" percentage_1930-1945="88.91" percentage_1945-2000="88.91" percentage_2000-2015="88.91" percentage_2015-2030="88.91" percentage_2030-2045="88.91" percentage_2045-2100="88.91" percentage_2100-2115="77.83" percentage_2115-2130="77.83" percentage_2130-2145="77.83" percentage_2145-2200="77.83" percentage_2200-2215="55.81" percentage_2215-2230="55.81" percentage_2230-2245="55.81" percentage_2245-2300="55.81" percentage_2300-2315="22.17" percentage_2315-2330="22.17" percentage_2330-2345="22.17" percentage_2345-2400="22.17"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 boligblokk',
    up_pct: 'percentage_0000-0015="100.00" percentage_0015-0030="100.00" percentage_0030-0045="100.00" percentage_0045-0100="100.00" percentage_0100-0115="100.00" percentage_0115-0130="100.00" percentage_0130-0145="100.00" percentage_0145-0200="100.00" percentage_0200-0215="100.00" percentage_0215-0230="100.00" percentage_0230-0245="100.00" percentage_0245-0300="100.00" percentage_0300-0315="100.00" percentage_0315-0330="100.00" percentage_0330-0345="100.00" percentage_0345-0400="100.00" percentage_0400-0415="100.00" percentage_0415-0430="100.00" percentage_0430-0445="100.00" percentage_0445-0500="100.00" percentage_0500-0515="100.00" percentage_0515-0530="100.00" percentage_0530-0545="100.00" percentage_0545-0600="100.00" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="100.00" percentage_2315-2330="100.00" percentage_2330-2345="100.00" percentage_2345-2400="100.00"',
    nh_on: '07.00',
    nh_off: '23.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '7.20',
    utw_name: 'Normert bruksmønster fra NS3031:2025 boligblokk',
    utw_pct: 'percentage_0000-0015="4.72" percentage_0015-0030="4.72" percentage_0030-0045="4.72" percentage_0045-0100="4.72" percentage_0100-0115="4.72" percentage_0115-0130="4.72" percentage_0130-0145="4.72" percentage_0145-0200="4.72" percentage_0200-0215="4.72" percentage_0215-0230="4.72" percentage_0230-0245="4.72" percentage_0245-0300="4.72" percentage_0300-0315="1.39" percentage_0315-0330="1.39" percentage_0330-0345="1.39" percentage_0345-0400="1.39" percentage_0400-0415="1.94" percentage_0415-0430="1.94" percentage_0430-0445="1.94" percentage_0445-0500="1.94" percentage_0500-0515="24.83" percentage_0515-0530="24.83" percentage_0530-0545="24.83" percentage_0545-0600="24.83" percentage_0600-0615="52.43" percentage_0615-0630="52.43" percentage_0630-0645="52.43" percentage_0645-0700="52.43" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="76.14" percentage_0815-0830="76.14" percentage_0830-0845="76.14" percentage_0845-0900="76.14" percentage_0900-0915="54.23" percentage_0915-0930="54.23" percentage_0930-0945="54.23" percentage_0945-1000="54.23" percentage_1000-1015="30.51" percentage_1015-1030="30.51" percentage_1030-1045="30.51" percentage_1045-1100="30.51" percentage_1100-1115="30.51" percentage_1115-1130="30.51" percentage_1130-1145="30.51" percentage_1145-1200="30.51" percentage_1200-1215="35.23" percentage_1215-1230="35.23" percentage_1230-1245="35.23" percentage_1245-1300="35.23" percentage_1300-1315="35.23" percentage_1315-1330="35.23" percentage_1330-1345="35.23" percentage_1345-1400="35.23" percentage_1400-1415="30.51" percentage_1415-1430="30.51" percentage_1430-1445="30.51" percentage_1445-1500="30.51" percentage_1500-1515="25.66" percentage_1515-1530="25.66" percentage_1530-1545="25.66" percentage_1545-1600="25.66" percentage_1600-1615="49.51" percentage_1615-1630="49.51" percentage_1630-1645="49.51" percentage_1645-1700="49.51" percentage_1700-1715="95.28" percentage_1715-1730="95.28" percentage_1730-1745="95.28" percentage_1745-1800="95.28" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="66.71" percentage_1915-1930="66.71" percentage_1930-1945="66.71" percentage_1945-2000="66.71" percentage_2000-2015="42.86" percentage_2015-2030="42.86" percentage_2030-2045="42.86" percentage_2045-2100="42.86" percentage_2100-2115="38.14" percentage_2115-2130="38.14" percentage_2130-2145="38.14" percentage_2145-2200="38.14" percentage_2200-2215="30.51" percentage_2215-2230="30.51" percentage_2230-2245="30.51" percentage_2245-2300="30.51" percentage_2300-2315="16.27" percentage_2315-2330="16.27" percentage_2330-2345="16.27" percentage_2345-2400="16.27"',
  },
  "Barnehager": {
    vent_supply_air: '8.00',
    vent_extract_air: '8.00',
    vent_usage_holiday: '25.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.00',
    vent_extract_reduced: '4.00',
    vent_norm_on: '8.00',
    vent_norm_off: '2.00',
    uv_name: 'Barnehage normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="25" percentage_0015-0030="25" percentage_0030-0045="25" percentage_0045-0100="25" percentage_0100-0115="25" percentage_0115-0130="25" percentage_0130-0145="25" percentage_0145-0200="25" percentage_0200-0215="25" percentage_0215-0230="25" percentage_0230-0245="25" percentage_0245-0300="25" percentage_0300-0315="25" percentage_0315-0330="25" percentage_0330-0345="25" percentage_0345-0400="25" percentage_0400-0415="25" percentage_0415-0430="25" percentage_0430-0445="25" percentage_0445-0500="25" percentage_0500-0515="25" percentage_0515-0530="25" percentage_0530-0545="25" percentage_0545-0600="25" percentage_0600-0615="25" percentage_0615-0630="25" percentage_0630-0645="25" percentage_0645-0700="25" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="25" percentage_1715-1730="25" percentage_1730-1745="25" percentage_1745-1800="25" percentage_1800-1815="25" percentage_1815-1830="25" percentage_1830-1845="25" percentage_1845-1900="25" percentage_1900-1915="25" percentage_1915-1930="25" percentage_1930-1945="25" percentage_1945-2000="25" percentage_2000-2015="25" percentage_2015-2030="25" percentage_2030-2045="25" percentage_2045-2100="25" percentage_2100-2115="25" percentage_2115-2130="25" percentage_2130-2145="25" percentage_2145-2200="25" percentage_2200-2215="25" percentage_2215-2230="25" percentage_2230-2245="25" percentage_2245-2300="25" percentage_2300-2315="25" percentage_2315-2330="25" percentage_2330-2345="25" percentage_2345-2400="25"',
    ig_normalized: 'no',
    ig_power_lighting: '4.80',
    ig_power_equipment: '2.10',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '7.70',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 barnehage',
    ul_pct: 'percentage_0000-0015="9.43" percentage_0015-0030="9.43" percentage_0030-0045="9.43" percentage_0045-0100="9.43" percentage_0100-0115="9.43" percentage_0115-0130="9.43" percentage_0130-0145="9.43" percentage_0145-0200="9.43" percentage_0200-0215="9.43" percentage_0215-0230="9.43" percentage_0230-0245="9.43" percentage_0245-0300="9.43" percentage_0300-0315="9.43" percentage_0315-0330="9.43" percentage_0330-0345="9.43" percentage_0345-0400="9.43" percentage_0400-0415="9.43" percentage_0415-0430="9.43" percentage_0430-0445="9.43" percentage_0445-0500="9.43" percentage_0500-0515="9.43" percentage_0515-0530="9.43" percentage_0530-0545="9.43" percentage_0545-0600="9.43" percentage_0600-0615="9.43" percentage_0615-0630="9.43" percentage_0630-0645="9.43" percentage_0645-0700="9.43" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="9.43" percentage_1515-1530="9.43" percentage_1530-1545="9.43" percentage_1545-1600="9.43" percentage_1600-1615="9.43" percentage_1615-1630="9.43" percentage_1630-1645="9.43" percentage_1645-1700="9.43" percentage_1700-1715="9.43" percentage_1715-1730="9.43" percentage_1730-1745="9.43" percentage_1745-1800="9.43" percentage_1800-1815="9.43" percentage_1815-1830="9.43" percentage_1830-1845="9.43" percentage_1845-1900="9.43" percentage_1900-1915="9.43" percentage_1915-1930="9.43" percentage_1930-1945="9.43" percentage_1945-2000="9.43" percentage_2000-2015="9.43" percentage_2015-2030="9.43" percentage_2030-2045="9.43" percentage_2045-2100="9.43" percentage_2100-2115="9.43" percentage_2115-2130="9.43" percentage_2130-2145="9.43" percentage_2145-2200="9.43" percentage_2200-2215="9.43" percentage_2215-2230="9.43" percentage_2230-2245="9.43" percentage_2245-2300="9.43" percentage_2300-2315="9.43" percentage_2315-2330="9.43" percentage_2330-2345="9.43" percentage_2345-2400="9.43"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 barnehage',
    ue_pct: 'percentage_0000-0015="8.17" percentage_0015-0030="8.17" percentage_0030-0045="8.17" percentage_0045-0100="8.17" percentage_0100-0115="8.17" percentage_0115-0130="8.17" percentage_0130-0145="8.17" percentage_0145-0200="8.17" percentage_0200-0215="8.17" percentage_0215-0230="8.17" percentage_0230-0245="8.17" percentage_0245-0300="8.17" percentage_0300-0315="8.17" percentage_0315-0330="8.17" percentage_0330-0345="8.17" percentage_0345-0400="8.17" percentage_0400-0415="8.17" percentage_0415-0430="8.17" percentage_0430-0445="8.17" percentage_0445-0500="8.17" percentage_0500-0515="8.17" percentage_0515-0530="8.17" percentage_0530-0545="8.17" percentage_0545-0600="8.17" percentage_0600-0615="8.17" percentage_0615-0630="8.17" percentage_0630-0645="8.17" percentage_0645-0700="8.17" percentage_0700-0715="66.35" percentage_0715-0730="66.35" percentage_0730-0745="66.35" percentage_0745-0800="66.35" percentage_0800-0815="66.35" percentage_0815-0830="66.35" percentage_0830-0845="66.35" percentage_0845-0900="66.35" percentage_0900-0915="66.35" percentage_0915-0930="66.35" percentage_0930-0945="66.35" percentage_0945-1000="66.35" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="66.35" percentage_1315-1330="66.35" percentage_1330-1345="66.35" percentage_1345-1400="66.35" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="25.00" percentage_1515-1530="25.00" percentage_1530-1545="25.00" percentage_1545-1600="25.00" percentage_1600-1615="25.00" percentage_1615-1630="25.00" percentage_1630-1645="25.00" percentage_1645-1700="25.00" percentage_1700-1715="8.17" percentage_1715-1730="8.17" percentage_1730-1745="8.17" percentage_1745-1800="8.17" percentage_1800-1815="8.17" percentage_1815-1830="8.17" percentage_1830-1845="8.17" percentage_1845-1900="8.17" percentage_1900-1915="8.17" percentage_1915-1930="8.17" percentage_1930-1945="8.17" percentage_1945-2000="8.17" percentage_2000-2015="8.17" percentage_2015-2030="8.17" percentage_2030-2045="8.17" percentage_2045-2100="8.17" percentage_2100-2115="8.17" percentage_2115-2130="8.17" percentage_2130-2145="8.17" percentage_2145-2200="8.17" percentage_2200-2215="8.17" percentage_2215-2230="8.17" percentage_2230-2245="8.17" percentage_2245-2300="8.17" percentage_2300-2315="8.17" percentage_2315-2330="8.17" percentage_2330-2345="8.17" percentage_2345-2400="8.17"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 barnehage',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="36.02" percentage_0715-0730="36.02" percentage_0730-0745="36.02" percentage_0745-0800="36.02" percentage_0800-0815="63.98" percentage_0815-0830="63.98" percentage_0830-0845="63.98" percentage_0845-0900="63.98" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="63.98" percentage_1515-1530="63.98" percentage_1530-1545="63.98" percentage_1545-1600="63.98" percentage_1600-1615="36.02" percentage_1615-1630="36.02" percentage_1630-1645="36.02" percentage_1645-1700="36.02" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '07.00',
    nh_off: '17.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '5.20',
    utw_name: 'Normert bruksmønster fra NS3031:2025 barnehage',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="70.33" percentage_0715-0730="70.33" percentage_0730-0745="70.33" percentage_0745-0800="70.33" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="70.33" percentage_1115-1130="70.33" percentage_1130-1145="70.33" percentage_1145-1200="70.33" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="0.00" percentage_1515-1530="0.00" percentage_1530-1545="0.00" percentage_1545-1600="0.00" percentage_1600-1615="0.00" percentage_1615-1630="0.00" percentage_1630-1645="0.00" percentage_1645-1700="0.00" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Kontorbygg": {
    vent_supply_air: '7.00',
    vent_extract_air: '7.00',
    vent_usage_holiday: '28.60',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '3.50',
    vent_extract_reduced: '3.50',
    vent_norm_on: '7.00',
    vent_norm_off: '2.00',
    uv_name: 'Kontor normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="28.57" percentage_0015-0030="28.57" percentage_0030-0045="28.57" percentage_0045-0100="28.57" percentage_0100-0115="28.57" percentage_0115-0130="28.57" percentage_0130-0145="28.57" percentage_0145-0200="28.57" percentage_0200-0215="28.57" percentage_0215-0230="28.57" percentage_0230-0245="28.57" percentage_0245-0300="28.57" percentage_0300-0315="28.57" percentage_0315-0330="28.57" percentage_0330-0345="28.57" percentage_0345-0400="28.57" percentage_0400-0415="28.57" percentage_0415-0430="28.57" percentage_0430-0445="28.57" percentage_0445-0500="28.57" percentage_0500-0515="28.57" percentage_0515-0530="28.57" percentage_0530-0545="28.57" percentage_0545-0600="28.57" percentage_0600-0615="100" percentage_0615-0630="100" percentage_0630-0645="100" percentage_0645-0700="100" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="28.57" percentage_1815-1830="28.57" percentage_1830-1845="28.57" percentage_1845-1900="28.57" percentage_1900-1915="28.57" percentage_1915-1930="28.57" percentage_1930-1945="28.57" percentage_1945-2000="28.57" percentage_2000-2015="28.57" percentage_2015-2030="28.57" percentage_2030-2045="28.57" percentage_2045-2100="28.57" percentage_2100-2115="28.57" percentage_2115-2130="28.57" percentage_2130-2145="28.57" percentage_2145-2200="28.57" percentage_2200-2215="28.57" percentage_2215-2230="28.57" percentage_2230-2245="28.57" percentage_2245-2300="28.57" percentage_2300-2315="28.57" percentage_2315-2330="28.57" percentage_2330-2345="28.57" percentage_2345-2400="28.57"',
    ig_normalized: 'no',
    ig_power_lighting: '3.70',
    ig_power_equipment: '8.60',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '8.00',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 kontor',
    ul_pct: 'percentage_0000-0015="11.50" percentage_0015-0030="11.50" percentage_0030-0045="11.50" percentage_0045-0100="11.50" percentage_0100-0115="11.50" percentage_0115-0130="11.50" percentage_0130-0145="11.50" percentage_0145-0200="11.50" percentage_0200-0215="11.50" percentage_0215-0230="11.50" percentage_0230-0245="11.50" percentage_0245-0300="11.50" percentage_0300-0315="11.50" percentage_0315-0330="11.50" percentage_0330-0345="11.50" percentage_0345-0400="11.50" percentage_0400-0415="11.50" percentage_0415-0430="11.50" percentage_0430-0445="11.50" percentage_0445-0500="11.50" percentage_0500-0515="11.50" percentage_0515-0530="11.50" percentage_0530-0545="11.50" percentage_0545-0600="11.50" percentage_0600-0615="11.50" percentage_0615-0630="11.50" percentage_0630-0645="11.50" percentage_0645-0700="11.50" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="11.50" percentage_1715-1730="11.50" percentage_1730-1745="11.50" percentage_1745-1800="11.50" percentage_1800-1815="11.50" percentage_1815-1830="11.50" percentage_1830-1845="11.50" percentage_1845-1900="11.50" percentage_1900-1915="11.50" percentage_1915-1930="11.50" percentage_1930-1945="11.50" percentage_1945-2000="11.50" percentage_2000-2015="11.50" percentage_2015-2030="11.50" percentage_2030-2045="11.50" percentage_2045-2100="11.50" percentage_2100-2115="11.50" percentage_2115-2130="11.50" percentage_2130-2145="11.50" percentage_2145-2200="11.50" percentage_2200-2215="11.50" percentage_2215-2230="11.50" percentage_2230-2245="11.50" percentage_2245-2300="11.50" percentage_2300-2315="11.50" percentage_2315-2330="11.50" percentage_2330-2345="11.50" percentage_2345-2400="11.50"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 kontor',
    ue_pct: 'percentage_0000-0015="7.72" percentage_0015-0030="7.72" percentage_0030-0045="7.72" percentage_0045-0100="7.72" percentage_0100-0115="7.72" percentage_0115-0130="7.72" percentage_0130-0145="7.72" percentage_0145-0200="7.72" percentage_0200-0215="7.72" percentage_0215-0230="7.72" percentage_0230-0245="7.72" percentage_0245-0300="7.72" percentage_0300-0315="7.72" percentage_0315-0330="7.72" percentage_0330-0345="7.72" percentage_0345-0400="7.72" percentage_0400-0415="7.72" percentage_0415-0430="7.72" percentage_0430-0445="7.72" percentage_0445-0500="7.72" percentage_0500-0515="7.72" percentage_0515-0530="7.72" percentage_0530-0545="7.72" percentage_0545-0600="7.72" percentage_0600-0615="23.04" percentage_0615-0630="23.04" percentage_0630-0645="23.04" percentage_0645-0700="23.04" percentage_0700-0715="38.48" percentage_0715-0730="38.48" percentage_0730-0745="38.48" percentage_0745-0800="38.48" percentage_0800-0815="38.48" percentage_0815-0830="38.48" percentage_0830-0845="38.48" percentage_0845-0900="38.48" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="38.48" percentage_1115-1130="38.48" percentage_1130-1145="38.48" percentage_1145-1200="38.48" percentage_1200-1215="38.48" percentage_1215-1230="38.48" percentage_1230-1245="38.48" percentage_1245-1300="38.48" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="38.37" percentage_1515-1530="38.37" percentage_1530-1545="38.37" percentage_1545-1600="38.37" percentage_1600-1615="38.37" percentage_1615-1630="38.37" percentage_1630-1645="38.37" percentage_1645-1700="38.37" percentage_1700-1715="23.04" percentage_1715-1730="23.04" percentage_1730-1745="23.04" percentage_1745-1800="23.04" percentage_1800-1815="7.72" percentage_1815-1830="7.72" percentage_1830-1845="7.72" percentage_1845-1900="7.72" percentage_1900-1915="7.72" percentage_1915-1930="7.72" percentage_1930-1945="7.72" percentage_1945-2000="7.72" percentage_2000-2015="7.72" percentage_2015-2030="7.72" percentage_2030-2045="7.72" percentage_2045-2100="7.72" percentage_2100-2115="7.72" percentage_2115-2130="7.72" percentage_2130-2145="7.72" percentage_2145-2200="7.72" percentage_2200-2215="7.72" percentage_2215-2230="7.72" percentage_2230-2245="7.72" percentage_2245-2300="7.72" percentage_2300-2315="7.72" percentage_2315-2330="7.72" percentage_2330-2345="7.72" percentage_2345-2400="7.72"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 kontor',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="37.50" percentage_0715-0730="37.50" percentage_0730-0745="37.50" percentage_0745-0800="37.50" percentage_0800-0815="37.50" percentage_0815-0830="37.50" percentage_0830-0845="37.50" percentage_0845-0900="37.50" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="37.50" percentage_1115-1130="37.50" percentage_1130-1145="37.50" percentage_1145-1200="37.50" percentage_1200-1215="37.50" percentage_1215-1230="37.50" percentage_1230-1245="37.50" percentage_1245-1300="37.50" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="37.50" percentage_1515-1530="37.50" percentage_1530-1545="37.50" percentage_1545-1600="37.50" percentage_1600-1615="37.50" percentage_1615-1630="37.50" percentage_1630-1645="37.50" percentage_1645-1700="37.50" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '06.00',
    nh_off: '18.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '3.80',
    utw_name: 'Normert bruksmønster fra NS3031:2025 kontor',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="49.87" percentage_0715-0730="49.87" percentage_0730-0745="49.87" percentage_0745-0800="49.87" percentage_0800-0815="49.87" percentage_0815-0830="49.87" percentage_0830-0845="49.87" percentage_0845-0900="49.87" percentage_0900-0915="24.94" percentage_0915-0930="24.94" percentage_0930-0945="24.94" percentage_0945-1000="24.94" percentage_1000-1015="24.94" percentage_1015-1030="24.94" percentage_1030-1045="24.94" percentage_1045-1100="24.94" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="24.94" percentage_1315-1330="24.94" percentage_1330-1345="24.94" percentage_1345-1400="24.94" percentage_1400-1415="24.94" percentage_1415-1430="24.94" percentage_1430-1445="24.94" percentage_1445-1500="24.94" percentage_1500-1515="49.87" percentage_1515-1530="49.87" percentage_1530-1545="49.87" percentage_1545-1600="49.87" percentage_1600-1615="49.87" percentage_1615-1630="49.87" percentage_1630-1645="49.87" percentage_1645-1700="49.87" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Skolebygg": {
    vent_supply_air: '10.00',
    vent_extract_air: '10.00',
    vent_usage_holiday: '20.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '5.00',
    vent_extract_reduced: '5.00',
    vent_norm_on: '10.00',
    vent_norm_off: '2.00',
    uv_name: 'Skole normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="20" percentage_0015-0030="20" percentage_0030-0045="20" percentage_0045-0100="20" percentage_0100-0115="20" percentage_0115-0130="20" percentage_0130-0145="20" percentage_0145-0200="20" percentage_0200-0215="20" percentage_0215-0230="20" percentage_0230-0245="20" percentage_0245-0300="20" percentage_0300-0315="20" percentage_0315-0330="20" percentage_0330-0345="20" percentage_0345-0400="20" percentage_0400-0415="20" percentage_0415-0430="20" percentage_0430-0445="20" percentage_0445-0500="20" percentage_0500-0515="20" percentage_0515-0530="20" percentage_0530-0545="20" percentage_0545-0600="20" percentage_0600-0615="20" percentage_0615-0630="20" percentage_0630-0645="20" percentage_0645-0700="20" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="20" percentage_1715-1730="20" percentage_1730-1745="20" percentage_1745-1800="20" percentage_1800-1815="20" percentage_1815-1830="20" percentage_1830-1845="20" percentage_1845-1900="20" percentage_1900-1915="20" percentage_1915-1930="20" percentage_1930-1945="20" percentage_1945-2000="20" percentage_2000-2015="20" percentage_2015-2030="20" percentage_2030-2045="20" percentage_2045-2100="20" percentage_2100-2115="20" percentage_2115-2130="20" percentage_2130-2145="20" percentage_2145-2200="20" percentage_2200-2215="20" percentage_2215-2230="20" percentage_2230-2245="20" percentage_2245-2300="20" percentage_2300-2315="20" percentage_2315-2330="20" percentage_2330-2345="20" percentage_2345-2400="20"',
    ig_normalized: 'no',
    ig_power_lighting: '4.10',
    ig_power_equipment: '4.60',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '18.90',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 skole',
    ul_pct: 'percentage_0000-0015="9.61" percentage_0015-0030="9.61" percentage_0030-0045="9.61" percentage_0045-0100="9.61" percentage_0100-0115="9.61" percentage_0115-0130="9.61" percentage_0130-0145="9.61" percentage_0145-0200="9.61" percentage_0200-0215="9.61" percentage_0215-0230="9.61" percentage_0230-0245="9.61" percentage_0245-0300="9.61" percentage_0300-0315="9.61" percentage_0315-0330="9.61" percentage_0330-0345="9.61" percentage_0345-0400="9.61" percentage_0400-0415="9.61" percentage_0415-0430="9.61" percentage_0430-0445="9.61" percentage_0445-0500="9.61" percentage_0500-0515="9.61" percentage_0515-0530="9.61" percentage_0530-0545="9.61" percentage_0545-0600="9.61" percentage_0600-0615="9.61" percentage_0615-0630="9.61" percentage_0630-0645="9.61" percentage_0645-0700="9.61" percentage_0700-0715="28.57" percentage_0715-0730="28.57" percentage_0730-0745="28.57" percentage_0745-0800="28.57" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="85.71" percentage_1415-1430="85.71" percentage_1430-1445="85.71" percentage_1445-1500="85.71" percentage_1500-1515="66.50" percentage_1515-1530="66.50" percentage_1530-1545="66.50" percentage_1545-1600="66.50" percentage_1600-1615="28.57" percentage_1615-1630="28.57" percentage_1630-1645="28.57" percentage_1645-1700="28.57" percentage_1700-1715="18.97" percentage_1715-1730="18.97" percentage_1730-1745="18.97" percentage_1745-1800="18.97" percentage_1800-1815="9.61" percentage_1815-1830="9.61" percentage_1830-1845="9.61" percentage_1845-1900="9.61" percentage_1900-1915="9.61" percentage_1915-1930="9.61" percentage_1930-1945="9.61" percentage_1945-2000="9.61" percentage_2000-2015="9.61" percentage_2015-2030="9.61" percentage_2030-2045="9.61" percentage_2045-2100="9.61" percentage_2100-2115="9.61" percentage_2115-2130="9.61" percentage_2130-2145="9.61" percentage_2145-2200="9.61" percentage_2200-2215="9.61" percentage_2215-2230="9.61" percentage_2230-2245="9.61" percentage_2245-2300="9.61" percentage_2300-2315="9.61" percentage_2315-2330="9.61" percentage_2330-2345="9.61" percentage_2345-2400="9.61"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 skole',
    ue_pct: 'percentage_0000-0015="7.59" percentage_0015-0030="7.59" percentage_0030-0045="7.59" percentage_0045-0100="7.59" percentage_0100-0115="7.59" percentage_0115-0130="7.59" percentage_0130-0145="7.59" percentage_0145-0200="7.59" percentage_0200-0215="7.59" percentage_0215-0230="7.59" percentage_0230-0245="7.59" percentage_0245-0300="7.59" percentage_0300-0315="7.59" percentage_0315-0330="7.59" percentage_0330-0345="7.59" percentage_0345-0400="7.59" percentage_0400-0415="7.59" percentage_0415-0430="7.59" percentage_0430-0445="7.59" percentage_0445-0500="7.59" percentage_0500-0515="7.59" percentage_0515-0530="7.59" percentage_0530-0545="7.59" percentage_0545-0600="7.59" percentage_0600-0615="7.59" percentage_0615-0630="7.59" percentage_0630-0645="7.59" percentage_0645-0700="7.59" percentage_0700-0715="22.99" percentage_0715-0730="22.99" percentage_0730-0745="22.99" percentage_0745-0800="22.99" percentage_0800-0815="61.61" percentage_0815-0830="61.61" percentage_0830-0845="61.61" percentage_0845-0900="61.61" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="61.61" percentage_1115-1130="61.61" percentage_1130-1145="61.61" percentage_1145-1200="61.61" percentage_1200-1215="61.61" percentage_1215-1230="61.61" percentage_1230-1245="61.61" percentage_1245-1300="61.61" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="30.80" percentage_1515-1530="30.80" percentage_1530-1545="30.80" percentage_1545-1600="30.80" percentage_1600-1615="22.99" percentage_1615-1630="22.99" percentage_1630-1645="22.99" percentage_1645-1700="22.99" percentage_1700-1715="7.59" percentage_1715-1730="7.59" percentage_1730-1745="7.59" percentage_1745-1800="7.59" percentage_1800-1815="7.59" percentage_1815-1830="7.59" percentage_1830-1845="7.59" percentage_1845-1900="7.59" percentage_1900-1915="7.59" percentage_1915-1930="7.59" percentage_1930-1945="7.59" percentage_1945-2000="7.59" percentage_2000-2015="7.59" percentage_2015-2030="7.59" percentage_2030-2045="7.59" percentage_2045-2100="7.59" percentage_2100-2115="7.59" percentage_2115-2130="7.59" percentage_2130-2145="7.59" percentage_2145-2200="7.59" percentage_2200-2215="7.59" percentage_2215-2230="7.59" percentage_2230-2245="7.59" percentage_2245-2300="7.59" percentage_2300-2315="7.59" percentage_2315-2330="7.59" percentage_2330-2345="7.59" percentage_2345-2400="7.59"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 skole',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="37.49" percentage_0715-0730="37.49" percentage_0730-0745="37.49" percentage_0745-0800="37.49" percentage_0800-0815="37.49" percentage_0815-0830="37.49" percentage_0830-0845="37.49" percentage_0845-0900="37.49" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="37.49" percentage_1115-1130="37.49" percentage_1130-1145="37.49" percentage_1145-1200="37.49" percentage_1200-1215="37.49" percentage_1215-1230="37.49" percentage_1230-1245="37.49" percentage_1245-1300="37.49" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="37.49" percentage_1515-1530="37.49" percentage_1530-1545="37.49" percentage_1545-1600="37.49" percentage_1600-1615="37.49" percentage_1615-1630="37.49" percentage_1630-1645="37.49" percentage_1645-1700="37.49" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '07.00',
    nh_off: '17.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '3.40',
    utw_name: 'Normert bruksmønster fra NS3031:2025 skole',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="0.00" percentage_0715-0730="0.00" percentage_0730-0745="0.00" percentage_0745-0800="0.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="66.57" percentage_0915-0930="66.57" percentage_0930-0945="66.57" percentage_0945-1000="66.57" percentage_1000-1015="66.57" percentage_1015-1030="66.57" percentage_1030-1045="66.57" percentage_1045-1100="66.57" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="66.57" percentage_1315-1330="66.57" percentage_1330-1345="66.57" percentage_1345-1400="66.57" percentage_1400-1415="66.57" percentage_1415-1430="66.57" percentage_1430-1445="66.57" percentage_1445-1500="66.57" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="0.00" percentage_1615-1630="0.00" percentage_1630-1645="0.00" percentage_1645-1700="0.00" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Universitets- og h\u00f8gskolebygg": {
    vent_supply_air: '8.00',
    vent_extract_air: '8.00',
    vent_usage_holiday: '25.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.00',
    vent_extract_reduced: '4.00',
    vent_norm_on: '8.00',
    vent_norm_off: '2.00',
    uv_name: 'Høgskole/universitet normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="25" percentage_0015-0030="25" percentage_0030-0045="25" percentage_0045-0100="25" percentage_0100-0115="25" percentage_0115-0130="25" percentage_0130-0145="25" percentage_0145-0200="25" percentage_0200-0215="25" percentage_0215-0230="25" percentage_0230-0245="25" percentage_0245-0300="25" percentage_0300-0315="25" percentage_0315-0330="25" percentage_0330-0345="25" percentage_0345-0400="25" percentage_0400-0415="25" percentage_0415-0430="25" percentage_0430-0445="25" percentage_0445-0500="25" percentage_0500-0515="25" percentage_0515-0530="25" percentage_0530-0545="25" percentage_0545-0600="25" percentage_0600-0615="100" percentage_0615-0630="100" percentage_0630-0645="100" percentage_0645-0700="100" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="25" percentage_1815-1830="25" percentage_1830-1845="25" percentage_1845-1900="25" percentage_1900-1915="25" percentage_1915-1930="25" percentage_1930-1945="25" percentage_1945-2000="25" percentage_2000-2015="25" percentage_2015-2030="25" percentage_2030-2045="25" percentage_2045-2100="25" percentage_2100-2115="25" percentage_2115-2130="25" percentage_2130-2145="25" percentage_2145-2200="25" percentage_2200-2215="25" percentage_2215-2230="25" percentage_2230-2245="25" percentage_2245-2300="25" percentage_2300-2315="25" percentage_2315-2330="25" percentage_2330-2345="25" percentage_2345-2400="25"',
    ig_normalized: 'no',
    ig_power_lighting: '4.20',
    ig_power_equipment: '7.10',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '7.60',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 universitet/høgskole',
    ul_pct: 'percentage_0000-0015="11.58" percentage_0015-0030="11.58" percentage_0030-0045="11.58" percentage_0045-0100="11.58" percentage_0100-0115="11.58" percentage_0115-0130="11.58" percentage_0130-0145="11.58" percentage_0145-0200="11.58" percentage_0200-0215="11.58" percentage_0215-0230="11.58" percentage_0230-0245="11.58" percentage_0245-0300="11.58" percentage_0300-0315="11.58" percentage_0315-0330="11.58" percentage_0330-0345="11.58" percentage_0345-0400="11.58" percentage_0400-0415="11.58" percentage_0415-0430="11.58" percentage_0430-0445="11.58" percentage_0445-0500="11.58" percentage_0500-0515="11.58" percentage_0515-0530="11.58" percentage_0530-0545="11.58" percentage_0545-0600="11.58" percentage_0600-0615="11.58" percentage_0615-0630="11.58" percentage_0630-0645="11.58" percentage_0645-0700="11.58" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="11.58" percentage_1715-1730="11.58" percentage_1730-1745="11.58" percentage_1745-1800="11.58" percentage_1800-1815="11.58" percentage_1815-1830="11.58" percentage_1830-1845="11.58" percentage_1845-1900="11.58" percentage_1900-1915="11.58" percentage_1915-1930="11.58" percentage_1930-1945="11.58" percentage_1945-2000="11.58" percentage_2000-2015="11.58" percentage_2015-2030="11.58" percentage_2030-2045="11.58" percentage_2045-2100="11.58" percentage_2100-2115="11.58" percentage_2115-2130="11.58" percentage_2130-2145="11.58" percentage_2145-2200="11.58" percentage_2200-2215="11.58" percentage_2215-2230="11.58" percentage_2230-2245="11.58" percentage_2245-2300="11.58" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 universitet/høgskole',
    ue_pct: 'percentage_0000-0015="7.66" percentage_0015-0030="7.66" percentage_0030-0045="7.66" percentage_0045-0100="7.66" percentage_0100-0115="7.66" percentage_0115-0130="7.66" percentage_0130-0145="7.66" percentage_0145-0200="7.66" percentage_0200-0215="7.66" percentage_0215-0230="7.66" percentage_0230-0245="7.66" percentage_0245-0300="7.66" percentage_0300-0315="7.66" percentage_0315-0330="7.66" percentage_0330-0345="7.66" percentage_0345-0400="7.66" percentage_0400-0415="7.66" percentage_0415-0430="7.66" percentage_0430-0445="7.66" percentage_0445-0500="7.66" percentage_0500-0515="7.66" percentage_0515-0530="7.66" percentage_0530-0545="7.66" percentage_0545-0600="7.66" percentage_0600-0615="23.12" percentage_0615-0630="23.12" percentage_0630-0645="23.12" percentage_0645-0700="23.12" percentage_0700-0715="38.44" percentage_0715-0730="38.44" percentage_0730-0745="38.44" percentage_0745-0800="38.44" percentage_0800-0815="38.44" percentage_0815-0830="38.44" percentage_0830-0845="38.44" percentage_0845-0900="38.44" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="38.44" percentage_1115-1130="38.44" percentage_1130-1145="38.44" percentage_1145-1200="38.44" percentage_1200-1215="38.44" percentage_1215-1230="38.44" percentage_1230-1245="38.44" percentage_1245-1300="38.44" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="38.44" percentage_1515-1530="38.44" percentage_1530-1545="38.44" percentage_1545-1600="38.44" percentage_1600-1615="38.44" percentage_1615-1630="38.44" percentage_1630-1645="38.44" percentage_1645-1700="38.44" percentage_1700-1715="23.12" percentage_1715-1730="23.12" percentage_1730-1745="23.12" percentage_1745-1800="23.12" percentage_1800-1815="7.66" percentage_1815-1830="7.66" percentage_1830-1845="7.66" percentage_1845-1900="7.66" percentage_1900-1915="7.66" percentage_1915-1930="7.66" percentage_1930-1945="7.66" percentage_1945-2000="7.66" percentage_2000-2015="7.66" percentage_2015-2030="7.66" percentage_2030-2045="7.66" percentage_2045-2100="7.66" percentage_2100-2115="7.66" percentage_2115-2130="7.66" percentage_2130-2145="7.66" percentage_2145-2200="7.66" percentage_2200-2215="7.66" percentage_2215-2230="7.66" percentage_2230-2245="7.66" percentage_2245-2300="7.66" percentage_2300-2315="7.66" percentage_2315-2330="7.66" percentage_2330-2345="7.66" percentage_2345-2400="7.66"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 universitet/høgskole',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="29.01" percentage_0715-0730="29.01" percentage_0730-0745="29.01" percentage_0745-0800="29.01" percentage_0800-0815="48.34" percentage_0815-0830="48.34" percentage_0830-0845="48.34" percentage_0845-0900="48.34" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="48.34" percentage_1115-1130="48.34" percentage_1130-1145="48.34" percentage_1145-1200="48.34" percentage_1200-1215="48.34" percentage_1215-1230="48.34" percentage_1230-1245="48.34" percentage_1245-1300="48.34" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="48.34" percentage_1515-1530="48.34" percentage_1530-1545="48.34" percentage_1545-1600="48.34" percentage_1600-1615="48.34" percentage_1615-1630="48.34" percentage_1630-1645="48.34" percentage_1645-1700="48.34" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="48.34" percentage_1915-1930="48.34" percentage_1930-1945="48.34" percentage_1945-2000="48.34" percentage_2000-2015="48.34" percentage_2015-2030="48.34" percentage_2030-2045="48.34" percentage_2045-2100="48.34" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '06.00',
    nh_off: '18.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '3.80',
    utw_name: 'Normert bruksmønster fra NS3031:2025 universitet/høgskole',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="49.87" percentage_0715-0730="49.87" percentage_0730-0745="49.87" percentage_0745-0800="49.87" percentage_0800-0815="49.87" percentage_0815-0830="49.87" percentage_0830-0845="49.87" percentage_0845-0900="49.87" percentage_0900-0915="24.93" percentage_0915-0930="24.93" percentage_0930-0945="24.93" percentage_0945-1000="24.93" percentage_1000-1015="24.93" percentage_1015-1030="24.93" percentage_1030-1045="24.93" percentage_1045-1100="24.93" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="24.93" percentage_1315-1330="24.93" percentage_1330-1345="24.93" percentage_1345-1400="24.93" percentage_1400-1415="24.93" percentage_1415-1430="24.93" percentage_1430-1445="24.93" percentage_1445-1500="24.93" percentage_1500-1515="49.87" percentage_1515-1530="49.87" percentage_1530-1545="49.87" percentage_1545-1600="49.87" percentage_1600-1615="49.87" percentage_1615-1630="49.87" percentage_1630-1645="49.87" percentage_1645-1700="49.87" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Sykehus": {
    vent_supply_air: '10.00',
    vent_extract_air: '10.00',
    vent_usage_holiday: '20.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '5.00',
    vent_extract_reduced: '5.00',
    vent_norm_on: '10.00',
    vent_norm_off: '2.00',
    uv_name: 'Sykehus normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="20" percentage_0015-0030="20" percentage_0030-0045="20" percentage_0045-0100="20" percentage_0100-0115="20" percentage_0115-0130="20" percentage_0130-0145="20" percentage_0145-0200="20" percentage_0200-0215="20" percentage_0215-0230="20" percentage_0230-0245="20" percentage_0245-0300="20" percentage_0300-0315="20" percentage_0315-0330="20" percentage_0330-0345="20" percentage_0345-0400="20" percentage_0400-0415="20" percentage_0415-0430="20" percentage_0430-0445="20" percentage_0445-0500="20" percentage_0500-0515="20" percentage_0515-0530="20" percentage_0530-0545="20" percentage_0545-0600="20" percentage_0600-0615="20" percentage_0615-0630="20" percentage_0630-0645="20" percentage_0645-0700="20" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="100" percentage_2115-2130="100" percentage_2130-2145="100" percentage_2145-2200="100" percentage_2200-2215="100" percentage_2215-2230="100" percentage_2230-2245="100" percentage_2245-2300="100" percentage_2300-2315="20" percentage_2315-2330="20" percentage_2330-2345="20" percentage_2345-2400="20"',
    ig_normalized: 'no',
    ig_power_lighting: '4.00',
    ig_power_equipment: '6.80',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '2.50',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 sykehus',
    ul_pct: 'percentage_0000-0015="42.96" percentage_0015-0030="42.96" percentage_0030-0045="42.96" percentage_0045-0100="42.96" percentage_0100-0115="42.96" percentage_0115-0130="42.96" percentage_0130-0145="42.96" percentage_0145-0200="42.96" percentage_0200-0215="42.96" percentage_0215-0230="42.96" percentage_0230-0245="42.96" percentage_0245-0300="42.96" percentage_0300-0315="42.96" percentage_0315-0330="42.96" percentage_0330-0345="42.96" percentage_0345-0400="42.96" percentage_0400-0415="42.96" percentage_0415-0430="42.96" percentage_0430-0445="42.96" percentage_0445-0500="42.96" percentage_0500-0515="42.96" percentage_0515-0530="42.96" percentage_0530-0545="42.96" percentage_0545-0600="42.96" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="42.96" percentage_2315-2330="42.96" percentage_2330-2345="42.96" percentage_2345-2400="42.96"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 sykehus',
    ue_pct: 'percentage_0000-0015="49.12" percentage_0015-0030="49.12" percentage_0030-0045="49.12" percentage_0045-0100="49.12" percentage_0100-0115="49.12" percentage_0115-0130="49.12" percentage_0130-0145="49.12" percentage_0145-0200="49.12" percentage_0200-0215="49.12" percentage_0215-0230="49.12" percentage_0230-0245="49.12" percentage_0245-0300="49.12" percentage_0300-0315="49.12" percentage_0315-0330="49.12" percentage_0330-0345="49.12" percentage_0345-0400="49.12" percentage_0400-0415="49.12" percentage_0415-0430="49.12" percentage_0430-0445="49.12" percentage_0445-0500="49.12" percentage_0500-0515="49.12" percentage_0515-0530="49.12" percentage_0530-0545="49.12" percentage_0545-0600="49.12" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="49.12" percentage_2015-2030="49.12" percentage_2030-2045="49.12" percentage_2045-2100="49.12" percentage_2100-2115="49.12" percentage_2115-2130="49.12" percentage_2130-2145="49.12" percentage_2145-2200="49.12" percentage_2200-2215="49.12" percentage_2215-2230="49.12" percentage_2230-2245="49.12" percentage_2245-2300="49.12" percentage_2300-2315="49.12" percentage_2315-2330="49.12" percentage_2330-2345="49.12" percentage_2345-2400="49.12"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 sykehus',
    up_pct: 'percentage_0000-0015="42.91" percentage_0015-0030="42.91" percentage_0030-0045="42.91" percentage_0045-0100="42.91" percentage_0100-0115="42.91" percentage_0115-0130="42.91" percentage_0130-0145="42.91" percentage_0145-0200="42.91" percentage_0200-0215="42.91" percentage_0215-0230="42.91" percentage_0230-0245="42.91" percentage_0245-0300="42.91" percentage_0300-0315="42.91" percentage_0315-0330="42.91" percentage_0330-0345="42.91" percentage_0345-0400="42.91" percentage_0400-0415="42.91" percentage_0415-0430="42.91" percentage_0430-0445="42.91" percentage_0445-0500="42.91" percentage_0500-0515="42.91" percentage_0515-0530="42.91" percentage_0530-0545="42.91" percentage_0545-0600="42.91" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="42.91" percentage_2315-2330="42.91" percentage_2330-2345="42.91" percentage_2345-2400="42.91"',
    nh_on: '07.00',
    nh_off: '23.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '4.30',
    utw_name: 'Normert bruksmønster fra NS3031:2025 sykehus',
    utw_pct: 'percentage_0000-0015="3.70" percentage_0015-0030="3.70" percentage_0030-0045="3.70" percentage_0045-0100="3.70" percentage_0100-0115="3.70" percentage_0115-0130="3.70" percentage_0130-0145="3.70" percentage_0145-0200="3.70" percentage_0200-0215="4.85" percentage_0215-0230="4.85" percentage_0230-0245="4.85" percentage_0245-0300="4.85" percentage_0300-0315="7.62" percentage_0315-0330="7.62" percentage_0330-0345="7.62" percentage_0345-0400="7.62" percentage_0400-0415="11.32" percentage_0415-0430="11.32" percentage_0430-0445="11.32" percentage_0445-0500="11.32" percentage_0500-0515="26.56" percentage_0515-0530="26.56" percentage_0530-0545="26.56" percentage_0545-0600="26.56" percentage_0600-0615="71.36" percentage_0615-0630="71.36" percentage_0630-0645="71.36" percentage_0645-0700="71.36" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="76.21" percentage_0815-0830="76.21" percentage_0830-0845="76.21" percentage_0845-0900="76.21" percentage_0900-0915="71.36" percentage_0915-0930="71.36" percentage_0930-0945="71.36" percentage_0945-1000="71.36" percentage_1000-1015="71.36" percentage_1015-1030="71.36" percentage_1030-1045="71.36" percentage_1045-1100="71.36" percentage_1100-1115="66.51" percentage_1115-1130="66.51" percentage_1130-1145="66.51" percentage_1145-1200="66.51" percentage_1200-1215="71.36" percentage_1215-1230="71.36" percentage_1230-1245="71.36" percentage_1245-1300="71.36" percentage_1300-1315="52.42" percentage_1315-1330="52.42" percentage_1330-1345="52.42" percentage_1345-1400="52.42" percentage_1400-1415="40.88" percentage_1415-1430="40.88" percentage_1430-1445="40.88" percentage_1445-1500="40.88" percentage_1500-1515="35.10" percentage_1515-1530="35.10" percentage_1530-1545="35.10" percentage_1545-1600="35.10" percentage_1600-1615="42.73" percentage_1615-1630="42.73" percentage_1630-1645="42.73" percentage_1645-1700="42.73" percentage_1700-1715="30.48" percentage_1715-1730="30.48" percentage_1730-1745="30.48" percentage_1745-1800="30.48" percentage_1800-1815="66.51" percentage_1815-1830="66.51" percentage_1830-1845="66.51" percentage_1845-1900="66.51" percentage_1900-1915="42.73" percentage_1915-1930="42.73" percentage_1930-1945="42.73" percentage_1945-2000="42.73" percentage_2000-2015="18.94" percentage_2015-2030="18.94" percentage_2030-2045="18.94" percentage_2045-2100="18.94" percentage_2100-2115="18.94" percentage_2115-2130="18.94" percentage_2130-2145="18.94" percentage_2145-2200="18.94" percentage_2200-2215="11.32" percentage_2215-2230="11.32" percentage_2230-2245="11.32" percentage_2245-2300="11.32" percentage_2300-2315="3.00" percentage_2315-2330="3.00" percentage_2330-2345="3.00" percentage_2345-2400="3.00"',
  },
  "Sykehjem": {
    vent_supply_air: '9.00',
    vent_extract_air: '9.00',
    vent_usage_holiday: '22.20',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.50',
    vent_extract_reduced: '4.50',
    vent_norm_on: '9.00',
    vent_norm_off: '2.00',
    uv_name: 'Sykehjem normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="22.22" percentage_0015-0030="22.22" percentage_0030-0045="22.22" percentage_0045-0100="22.22" percentage_0100-0115="22.22" percentage_0115-0130="22.22" percentage_0130-0145="22.22" percentage_0145-0200="22.22" percentage_0200-0215="22.22" percentage_0215-0230="22.22" percentage_0230-0245="22.22" percentage_0245-0300="22.22" percentage_0300-0315="22.22" percentage_0315-0330="22.22" percentage_0330-0345="22.22" percentage_0345-0400="22.22" percentage_0400-0415="22.22" percentage_0415-0430="22.22" percentage_0430-0445="22.22" percentage_0445-0500="22.22" percentage_0500-0515="22.22" percentage_0515-0530="22.22" percentage_0530-0545="22.22" percentage_0545-0600="22.22" percentage_0600-0615="22.22" percentage_0615-0630="22.22" percentage_0630-0645="22.22" percentage_0645-0700="22.22" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="100" percentage_2115-2130="100" percentage_2130-2145="100" percentage_2145-2200="100" percentage_2200-2215="100" percentage_2215-2230="100" percentage_2230-2245="100" percentage_2245-2300="100" percentage_2300-2315="22.22" percentage_2315-2330="22.22" percentage_2330-2345="22.22" percentage_2345-2400="22.22"',
    ig_normalized: 'no',
    ig_power_lighting: '3.50',
    ig_power_equipment: '6.30',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '3.20',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 sykehjem',
    ul_pct: 'percentage_0000-0015="35.23" percentage_0015-0030="35.23" percentage_0030-0045="35.23" percentage_0045-0100="35.23" percentage_0100-0115="35.23" percentage_0115-0130="35.23" percentage_0130-0145="35.23" percentage_0145-0200="35.23" percentage_0200-0215="35.23" percentage_0215-0230="35.23" percentage_0230-0245="35.23" percentage_0245-0300="35.23" percentage_0300-0315="35.23" percentage_0315-0330="35.23" percentage_0330-0345="35.23" percentage_0345-0400="35.23" percentage_0400-0415="35.23" percentage_0415-0430="35.23" percentage_0430-0445="35.23" percentage_0445-0500="35.23" percentage_0500-0515="35.23" percentage_0515-0530="35.23" percentage_0530-0545="35.23" percentage_0545-0600="35.23" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="35.23" percentage_2115-2130="35.23" percentage_2130-2145="35.23" percentage_2145-2200="35.23" percentage_2200-2215="35.23" percentage_2215-2230="35.23" percentage_2230-2245="35.23" percentage_2245-2300="35.23" percentage_2300-2315="35.23" percentage_2315-2330="35.23" percentage_2330-2345="35.23" percentage_2345-2400="35.23"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 sykehjem',
    ue_pct: 'percentage_0000-0015="19.94" percentage_0015-0030="19.94" percentage_0030-0045="19.94" percentage_0045-0100="19.94" percentage_0100-0115="19.94" percentage_0115-0130="19.94" percentage_0130-0145="19.94" percentage_0145-0200="19.94" percentage_0200-0215="19.94" percentage_0215-0230="19.94" percentage_0230-0245="19.94" percentage_0245-0300="19.94" percentage_0300-0315="19.94" percentage_0315-0330="19.94" percentage_0330-0345="19.94" percentage_0345-0400="19.94" percentage_0400-0415="19.94" percentage_0415-0430="19.94" percentage_0430-0445="19.94" percentage_0445-0500="19.94" percentage_0500-0515="19.94" percentage_0515-0530="19.94" percentage_0530-0545="19.94" percentage_0545-0600="19.94" percentage_0600-0615="19.94" percentage_0615-0630="19.94" percentage_0630-0645="19.94" percentage_0645-0700="19.94" percentage_0700-0715="40.03" percentage_0715-0730="40.03" percentage_0730-0745="40.03" percentage_0745-0800="40.03" percentage_0800-0815="40.03" percentage_0815-0830="40.03" percentage_0830-0845="40.03" percentage_0845-0900="40.03" percentage_0900-0915="19.94" percentage_0915-0930="19.94" percentage_0930-0945="19.94" percentage_0945-1000="19.94" percentage_1000-1015="19.94" percentage_1015-1030="19.94" percentage_1030-1045="19.94" percentage_1045-1100="19.94" percentage_1100-1115="19.94" percentage_1115-1130="19.94" percentage_1130-1145="19.94" percentage_1145-1200="19.94" percentage_1200-1215="19.94" percentage_1215-1230="19.94" percentage_1230-1245="19.94" percentage_1245-1300="19.94" percentage_1300-1315="19.94" percentage_1315-1330="19.94" percentage_1330-1345="19.94" percentage_1345-1400="19.94" percentage_1400-1415="19.94" percentage_1415-1430="19.94" percentage_1430-1445="19.94" percentage_1445-1500="19.94" percentage_1500-1515="59.97" percentage_1515-1530="59.97" percentage_1530-1545="59.97" percentage_1545-1600="59.97" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="90.03" percentage_1915-1930="90.03" percentage_1930-1945="90.03" percentage_1945-2000="90.03" percentage_2000-2015="90.03" percentage_2015-2030="90.03" percentage_2030-2045="90.03" percentage_2045-2100="90.03" percentage_2100-2115="50.00" percentage_2115-2130="50.00" percentage_2130-2145="50.00" percentage_2145-2200="50.00" percentage_2200-2215="50.00" percentage_2215-2230="50.00" percentage_2230-2245="50.00" percentage_2245-2300="50.00" percentage_2300-2315="19.94" percentage_2315-2330="19.94" percentage_2330-2345="19.94" percentage_2345-2400="19.94"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 sykehjem',
    up_pct: 'percentage_0000-0015="80.06" percentage_0015-0030="80.06" percentage_0030-0045="80.06" percentage_0045-0100="80.06" percentage_0100-0115="80.06" percentage_0115-0130="80.06" percentage_0130-0145="80.06" percentage_0145-0200="80.06" percentage_0200-0215="80.06" percentage_0215-0230="80.06" percentage_0230-0245="80.06" percentage_0245-0300="80.06" percentage_0300-0315="80.06" percentage_0315-0330="80.06" percentage_0330-0345="80.06" percentage_0345-0400="80.06" percentage_0400-0415="80.06" percentage_0415-0430="80.06" percentage_0430-0445="80.06" percentage_0445-0500="80.06" percentage_0500-0515="80.06" percentage_0515-0530="80.06" percentage_0530-0545="80.06" percentage_0545-0600="80.06" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="80.06" percentage_2115-2130="80.06" percentage_2130-2145="80.06" percentage_2145-2200="80.06" percentage_2200-2215="80.06" percentage_2215-2230="80.06" percentage_2230-2245="80.06" percentage_2245-2300="80.06" percentage_2300-2315="80.06" percentage_2315-2330="80.06" percentage_2330-2345="80.06" percentage_2345-2400="80.06"',
    nh_on: '07.00',
    nh_off: '23.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '4.10',
    utw_name: 'Normert bruksmønster fra NS3031:2025 sykehjem',
    utw_pct: 'percentage_0000-0015="2.22" percentage_0015-0030="2.22" percentage_0030-0045="2.22" percentage_0045-0100="2.22" percentage_0100-0115="1.73" percentage_0115-0130="1.73" percentage_0130-0145="1.73" percentage_0145-0200="1.73" percentage_0200-0215="1.48" percentage_0215-0230="1.48" percentage_0230-0245="1.48" percentage_0245-0300="1.48" percentage_0300-0315="1.48" percentage_0315-0330="1.48" percentage_0330-0345="1.48" percentage_0345-0400="1.48" percentage_0400-0415="1.98" percentage_0415-0430="1.98" percentage_0430-0445="1.98" percentage_0445-0500="1.98" percentage_0500-0515="5.68" percentage_0515-0530="5.68" percentage_0530-0545="5.68" percentage_0545-0600="5.68" percentage_0600-0615="14.07" percentage_0615-0630="14.07" percentage_0630-0645="14.07" percentage_0645-0700="14.07" percentage_0700-0715="25.43" percentage_0715-0730="25.43" percentage_0730-0745="25.43" percentage_0745-0800="25.43" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="65.68" percentage_0915-0930="65.68" percentage_0930-0945="65.68" percentage_0945-1000="65.68" percentage_1000-1015="66.17" percentage_1015-1030="66.17" percentage_1030-1045="66.17" percentage_1045-1100="66.17" percentage_1100-1115="51.60" percentage_1115-1130="51.60" percentage_1130-1145="51.60" percentage_1145-1200="51.60" percentage_1200-1215="42.72" percentage_1215-1230="42.72" percentage_1230-1245="42.72" percentage_1245-1300="42.72" percentage_1300-1315="59.51" percentage_1315-1330="59.51" percentage_1330-1345="59.51" percentage_1345-1400="59.51" percentage_1400-1415="27.90" percentage_1415-1430="27.90" percentage_1430-1445="27.90" percentage_1445-1500="27.90" percentage_1500-1515="21.23" percentage_1515-1530="21.23" percentage_1530-1545="21.23" percentage_1545-1600="21.23" percentage_1600-1615="35.80" percentage_1615-1630="35.80" percentage_1630-1645="35.80" percentage_1645-1700="35.80" percentage_1700-1715="33.09" percentage_1715-1730="33.09" percentage_1730-1745="33.09" percentage_1745-1800="33.09" percentage_1800-1815="24.20" percentage_1815-1830="24.20" percentage_1830-1845="24.20" percentage_1845-1900="24.20" percentage_1900-1915="37.78" percentage_1915-1930="37.78" percentage_1930-1945="37.78" percentage_1945-2000="37.78" percentage_2000-2015="35.06" percentage_2015-2030="35.06" percentage_2030-2045="35.06" percentage_2045-2100="35.06" percentage_2100-2115="14.57" percentage_2115-2130="14.57" percentage_2130-2145="14.57" percentage_2145-2200="14.57" percentage_2200-2215="5.43" percentage_2215-2230="5.43" percentage_2230-2245="5.43" percentage_2245-2300="5.43" percentage_2300-2315="3.21" percentage_2315-2330="3.21" percentage_2330-2345="3.21" percentage_2345-2400="3.21"',
  },
  "Hoteller": {
    vent_supply_air: '7.00',
    vent_extract_air: '7.00',
    vent_usage_holiday: '28.60',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '3.50',
    vent_extract_reduced: '3.50',
    vent_norm_on: '7.00',
    vent_norm_off: '2.00',
    uv_name: 'Hotell normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="28.57" percentage_0015-0030="28.57" percentage_0030-0045="28.57" percentage_0045-0100="28.57" percentage_0100-0115="28.57" percentage_0115-0130="28.57" percentage_0130-0145="28.57" percentage_0145-0200="28.57" percentage_0200-0215="28.57" percentage_0215-0230="28.57" percentage_0230-0245="28.57" percentage_0245-0300="28.57" percentage_0300-0315="28.57" percentage_0315-0330="28.57" percentage_0330-0345="28.57" percentage_0345-0400="28.57" percentage_0400-0415="28.57" percentage_0415-0430="28.57" percentage_0430-0445="28.57" percentage_0445-0500="28.57" percentage_0500-0515="28.57" percentage_0515-0530="28.57" percentage_0530-0545="28.57" percentage_0545-0600="28.57" percentage_0600-0615="28.57" percentage_0615-0630="28.57" percentage_0630-0645="28.57" percentage_0645-0700="28.57" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="100" percentage_2115-2130="100" percentage_2130-2145="100" percentage_2145-2200="100" percentage_2200-2215="100" percentage_2215-2230="100" percentage_2230-2245="100" percentage_2245-2300="100" percentage_2300-2315="28.57" percentage_2315-2330="28.57" percentage_2330-2345="28.57" percentage_2345-2400="28.57"',
    ig_normalized: 'no',
    ig_power_lighting: '2.40',
    ig_power_equipment: '1.30',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '2.10',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 hotell',
    ul_pct: 'percentage_0000-0015="40.00" percentage_0015-0030="40.00" percentage_0030-0045="40.00" percentage_0045-0100="40.00" percentage_0100-0115="40.00" percentage_0115-0130="40.00" percentage_0130-0145="40.00" percentage_0145-0200="40.00" percentage_0200-0215="40.00" percentage_0215-0230="40.00" percentage_0230-0245="40.00" percentage_0245-0300="40.00" percentage_0300-0315="40.00" percentage_0315-0330="40.00" percentage_0330-0345="40.00" percentage_0345-0400="40.00" percentage_0400-0415="40.00" percentage_0415-0430="40.00" percentage_0430-0445="40.00" percentage_0445-0500="40.00" percentage_0500-0515="40.00" percentage_0515-0530="40.00" percentage_0530-0545="40.00" percentage_0545-0600="40.00" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="60.00" percentage_2315-2330="60.00" percentage_2330-2345="60.00" percentage_2345-2400="60.00"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 hotell',
    ue_pct: 'percentage_0000-0015="12.12" percentage_0015-0030="12.12" percentage_0030-0045="12.12" percentage_0045-0100="12.12" percentage_0100-0115="12.12" percentage_0115-0130="12.12" percentage_0130-0145="12.12" percentage_0145-0200="12.12" percentage_0200-0215="12.12" percentage_0215-0230="12.12" percentage_0230-0245="12.12" percentage_0245-0300="12.12" percentage_0300-0315="12.12" percentage_0315-0330="12.12" percentage_0330-0345="12.12" percentage_0345-0400="12.12" percentage_0400-0415="12.12" percentage_0415-0430="12.12" percentage_0430-0445="12.12" percentage_0445-0500="12.12" percentage_0500-0515="12.12" percentage_0515-0530="12.12" percentage_0530-0545="12.12" percentage_0545-0600="12.12" percentage_0600-0615="37.12" percentage_0615-0630="37.12" percentage_0630-0645="37.12" percentage_0645-0700="37.12" percentage_0700-0715="50.00" percentage_0715-0730="50.00" percentage_0730-0745="50.00" percentage_0745-0800="50.00" percentage_0800-0815="50.00" percentage_0815-0830="50.00" percentage_0830-0845="50.00" percentage_0845-0900="50.00" percentage_0900-0915="25.00" percentage_0915-0930="25.00" percentage_0930-0945="25.00" percentage_0945-1000="25.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="50.00" percentage_1215-1230="50.00" percentage_1230-1245="50.00" percentage_1245-1300="50.00" percentage_1300-1315="25.00" percentage_1315-1330="25.00" percentage_1330-1345="25.00" percentage_1345-1400="25.00" percentage_1400-1415="25.00" percentage_1415-1430="25.00" percentage_1430-1445="25.00" percentage_1445-1500="25.00" percentage_1500-1515="50.00" percentage_1515-1530="50.00" percentage_1530-1545="50.00" percentage_1545-1600="50.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="50.00" percentage_2215-2230="50.00" percentage_2230-2245="50.00" percentage_2245-2300="50.00" percentage_2300-2315="12.12" percentage_2315-2330="12.12" percentage_2330-2345="12.12" percentage_2345-2400="12.12"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 hotell',
    up_pct: 'percentage_0000-0015="100.00" percentage_0015-0030="100.00" percentage_0030-0045="100.00" percentage_0045-0100="100.00" percentage_0100-0115="100.00" percentage_0115-0130="100.00" percentage_0130-0145="100.00" percentage_0145-0200="100.00" percentage_0200-0215="100.00" percentage_0215-0230="100.00" percentage_0230-0245="100.00" percentage_0245-0300="100.00" percentage_0300-0315="100.00" percentage_0315-0330="100.00" percentage_0330-0345="100.00" percentage_0345-0400="100.00" percentage_0400-0415="100.00" percentage_0415-0430="100.00" percentage_0430-0445="100.00" percentage_0445-0500="100.00" percentage_0500-0515="100.00" percentage_0515-0530="100.00" percentage_0530-0545="100.00" percentage_0545-0600="100.00" percentage_0600-0615="100.00" percentage_0615-0630="100.00" percentage_0630-0645="100.00" percentage_0645-0700="100.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="100.00" percentage_2115-2130="100.00" percentage_2130-2145="100.00" percentage_2145-2200="100.00" percentage_2200-2215="100.00" percentage_2215-2230="100.00" percentage_2230-2245="100.00" percentage_2245-2300="100.00" percentage_2300-2315="100.00" percentage_2315-2330="100.00" percentage_2330-2345="100.00" percentage_2345-2400="100.00"',
    nh_on: '07.00',
    nh_off: '23.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '11.10',
    utw_name: 'Normert bruksmønster fra NS3031:2025 hotell',
    utw_pct: 'percentage_0000-0015="11.50" percentage_0015-0030="11.50" percentage_0030-0045="11.50" percentage_0045-0100="11.50" percentage_0100-0115="5.93" percentage_0115-0130="5.93" percentage_0130-0145="5.93" percentage_0145-0200="5.93" percentage_0200-0215="2.52" percentage_0215-0230="2.52" percentage_0230-0245="2.52" percentage_0245-0300="2.52" percentage_0300-0315="1.71" percentage_0315-0330="1.71" percentage_0330-0345="1.71" percentage_0345-0400="1.71" percentage_0400-0415="3.41" percentage_0415-0430="3.41" percentage_0430-0445="3.41" percentage_0445-0500="3.41" percentage_0500-0515="10.96" percentage_0515-0530="10.96" percentage_0530-0545="10.96" percentage_0545-0600="10.96" percentage_0600-0615="53.37" percentage_0615-0630="53.37" percentage_0630-0645="53.37" percentage_0645-0700="53.37" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="81.58" percentage_0815-0830="81.58" percentage_0830-0845="81.58" percentage_0845-0900="81.58" percentage_0900-0915="52.92" percentage_0915-0930="52.92" percentage_0930-0945="52.92" percentage_0945-1000="52.92" percentage_1000-1015="39.98" percentage_1015-1030="39.98" percentage_1030-1045="39.98" percentage_1045-1100="39.98" percentage_1100-1115="31.99" percentage_1115-1130="31.99" percentage_1130-1145="31.99" percentage_1145-1200="31.99" percentage_1200-1215="25.43" percentage_1215-1230="25.43" percentage_1230-1245="25.43" percentage_1245-1300="25.43" percentage_1300-1315="22.19" percentage_1315-1330="22.19" percentage_1330-1345="22.19" percentage_1345-1400="22.19" percentage_1400-1415="20.75" percentage_1415-1430="20.75" percentage_1430-1445="20.75" percentage_1445-1500="20.75" percentage_1500-1515="20.75" percentage_1515-1530="20.75" percentage_1530-1545="20.75" percentage_1545-1600="20.75" percentage_1600-1615="23.18" percentage_1615-1630="23.18" percentage_1630-1645="23.18" percentage_1645-1700="23.18" percentage_1700-1715="29.83" percentage_1715-1730="29.83" percentage_1730-1745="29.78" percentage_1745-1800="29.78" percentage_1800-1815="37.65" percentage_1815-1830="37.65" percentage_1830-1845="37.65" percentage_1845-1900="37.65" percentage_1900-1915="31.00" percentage_1915-1930="31.00" percentage_1930-1945="31.00" percentage_1945-2000="31.00" percentage_2000-2015="30.00" percentage_2015-2030="30.00" percentage_2030-2045="30.00" percentage_2045-2100="30.00" percentage_2100-2115="37.02" percentage_2115-2130="37.02" percentage_2130-2145="37.02" percentage_2145-2200="37.02" percentage_2200-2215="37.74" percentage_2215-2230="37.74" percentage_2230-2245="37.74" percentage_2245-2300="37.74" percentage_2300-2315="29.02" percentage_2315-2330="29.02" percentage_2330-2345="29.02" percentage_2345-2400="29.02"',
  },
  "Idrettsbygg": {
    vent_supply_air: '8.00',
    vent_extract_air: '8.00',
    vent_usage_holiday: '25.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.00',
    vent_extract_reduced: '4.00',
    vent_norm_on: '8.00',
    vent_norm_off: '2.00',
    uv_name: 'Idrettsbygning normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="25" percentage_0015-0030="25" percentage_0030-0045="25" percentage_0045-0100="25" percentage_0100-0115="25" percentage_0115-0130="25" percentage_0130-0145="25" percentage_0145-0200="25" percentage_0200-0215="25" percentage_0215-0230="25" percentage_0230-0245="25" percentage_0245-0300="25" percentage_0300-0315="25" percentage_0315-0330="25" percentage_0330-0345="25" percentage_0345-0400="25" percentage_0400-0415="25" percentage_0415-0430="25" percentage_0430-0445="25" percentage_0445-0500="25" percentage_0500-0515="25" percentage_0515-0530="25" percentage_0530-0545="25" percentage_0545-0600="25" percentage_0600-0615="25" percentage_0615-0630="25" percentage_0630-0645="25" percentage_0645-0700="25" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="25" percentage_2115-2130="25" percentage_2130-2145="25" percentage_2145-2200="25" percentage_2200-2215="25" percentage_2215-2230="25" percentage_2230-2245="25" percentage_2245-2300="25" percentage_2300-2315="25" percentage_2315-2330="25" percentage_2330-2345="25" percentage_2345-2400="25"',
    ig_normalized: 'no',
    ig_power_lighting: '4.40',
    ig_power_equipment: '0.90',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '8.40',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 idrettsbygning',
    ul_pct: 'percentage_0000-0015="12.50" percentage_0015-0030="12.50" percentage_0030-0045="12.50" percentage_0045-0100="12.50" percentage_0100-0115="12.50" percentage_0115-0130="12.50" percentage_0130-0145="12.50" percentage_0145-0200="12.50" percentage_0200-0215="12.50" percentage_0215-0230="12.50" percentage_0230-0245="12.50" percentage_0245-0300="12.50" percentage_0300-0315="12.50" percentage_0315-0330="12.50" percentage_0330-0345="12.50" percentage_0345-0400="12.50" percentage_0400-0415="12.50" percentage_0415-0430="12.50" percentage_0430-0445="12.50" percentage_0445-0500="12.50" percentage_0500-0515="12.50" percentage_0515-0530="12.50" percentage_0530-0545="12.50" percentage_0545-0600="12.50" percentage_0600-0615="12.50" percentage_0615-0630="12.50" percentage_0630-0645="12.50" percentage_0645-0700="12.50" percentage_0700-0715="12.50" percentage_0715-0730="12.50" percentage_0730-0745="12.50" percentage_0745-0800="12.50" percentage_0800-0815="87.50" percentage_0815-0830="87.50" percentage_0830-0845="87.50" percentage_0845-0900="87.50" percentage_0900-0915="87.50" percentage_0915-0930="87.50" percentage_0930-0945="87.50" percentage_0945-1000="87.50" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="87.50" percentage_1615-1630="87.50" percentage_1630-1645="87.50" percentage_1645-1700="87.50" percentage_1700-1715="87.50" percentage_1715-1730="87.50" percentage_1730-1745="87.50" percentage_1745-1800="87.50" percentage_1800-1815="75.00" percentage_1815-1830="75.00" percentage_1830-1845="75.00" percentage_1845-1900="75.00" percentage_1900-1915="75.00" percentage_1915-1930="75.00" percentage_1930-1945="75.00" percentage_1945-2000="75.00" percentage_2000-2015="12.50" percentage_2015-2030="12.50" percentage_2030-2045="12.50" percentage_2045-2100="12.50" percentage_2100-2115="12.50" percentage_2115-2130="12.50" percentage_2130-2145="12.50" percentage_2145-2200="12.50" percentage_2200-2215="12.50" percentage_2215-2230="12.50" percentage_2230-2245="12.50" percentage_2245-2300="12.50" percentage_2300-2315="12.50" percentage_2315-2330="12.50" percentage_2330-2345="12.50" percentage_2345-2400="12.50"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 idrettsbygning',
    ue_pct: 'percentage_0000-0015="13.04" percentage_0015-0030="13.04" percentage_0030-0045="13.04" percentage_0045-0100="13.04" percentage_0100-0115="13.04" percentage_0115-0130="13.04" percentage_0130-0145="13.04" percentage_0145-0200="13.04" percentage_0200-0215="13.04" percentage_0215-0230="13.04" percentage_0230-0245="13.04" percentage_0245-0300="13.04" percentage_0300-0315="13.04" percentage_0315-0330="13.04" percentage_0330-0345="13.04" percentage_0345-0400="13.04" percentage_0400-0415="13.04" percentage_0415-0430="13.04" percentage_0430-0445="13.04" percentage_0445-0500="13.04" percentage_0500-0515="13.04" percentage_0515-0530="13.04" percentage_0530-0545="13.04" percentage_0545-0600="13.04" percentage_0600-0615="13.04" percentage_0615-0630="13.04" percentage_0630-0645="13.04" percentage_0645-0700="13.04" percentage_0700-0715="13.04" percentage_0715-0730="13.04" percentage_0730-0745="13.04" percentage_0745-0800="13.04" percentage_0800-0815="93.48" percentage_0815-0830="93.48" percentage_0830-0845="93.48" percentage_0845-0900="93.48" percentage_0900-0915="93.48" percentage_0915-0930="93.48" percentage_0930-0945="93.48" percentage_0945-1000="93.48" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="93.48" percentage_1815-1830="93.48" percentage_1830-1845="93.48" percentage_1845-1900="93.48" percentage_1900-1915="93.48" percentage_1915-1930="93.48" percentage_1930-1945="93.48" percentage_1945-2000="93.48" percentage_2000-2015="13.04" percentage_2015-2030="13.04" percentage_2030-2045="13.04" percentage_2045-2100="13.04" percentage_2100-2115="13.04" percentage_2115-2130="13.04" percentage_2130-2145="13.04" percentage_2145-2200="13.04" percentage_2200-2215="13.04" percentage_2215-2230="13.04" percentage_2230-2245="13.04" percentage_2245-2300="13.04" percentage_2300-2315="13.04" percentage_2315-2330="13.04" percentage_2330-2345="13.04" percentage_2345-2400="13.04"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 idrettsbygning',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="100.00" percentage_1915-1930="100.00" percentage_1930-1945="100.00" percentage_1945-2000="100.00" percentage_2000-2015="100.00" percentage_2015-2030="100.00" percentage_2030-2045="100.00" percentage_2045-2100="100.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '07.00',
    nh_off: '21.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '4.50',
    utw_name: 'Normert bruksmønster fra NS3031:2025 idrettsbygning',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="0.00" percentage_0715-0730="0.00" percentage_0730-0745="0.00" percentage_0745-0800="0.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Forretningsbygg": {
    vent_supply_air: '13.00',
    vent_extract_air: '13.00',
    vent_usage_holiday: '15.40',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '6.50',
    vent_extract_reduced: '6.50',
    vent_norm_on: '13.00',
    vent_norm_off: '2.00',
    uv_name: 'Forretningsbygg normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="15.38" percentage_0015-0030="15.38" percentage_0030-0045="15.38" percentage_0045-0100="15.38" percentage_0100-0115="15.38" percentage_0115-0130="15.38" percentage_0130-0145="15.38" percentage_0145-0200="15.38" percentage_0200-0215="15.38" percentage_0215-0230="15.38" percentage_0230-0245="15.38" percentage_0245-0300="15.38" percentage_0300-0315="15.38" percentage_0315-0330="15.38" percentage_0330-0345="15.38" percentage_0345-0400="15.38" percentage_0400-0415="15.38" percentage_0415-0430="15.38" percentage_0430-0445="15.38" percentage_0445-0500="15.38" percentage_0500-0515="15.38" percentage_0515-0530="15.38" percentage_0530-0545="15.38" percentage_0545-0600="15.38" percentage_0600-0615="15.38" percentage_0615-0630="15.38" percentage_0630-0645="15.38" percentage_0645-0700="15.38" percentage_0700-0715="15.38" percentage_0715-0730="15.38" percentage_0730-0745="15.38" percentage_0745-0800="15.38" percentage_0800-0815="15.38" percentage_0815-0830="15.38" percentage_0830-0845="15.38" percentage_0845-0900="15.38" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="15.38" percentage_2115-2130="15.38" percentage_2130-2145="15.38" percentage_2145-2200="15.38" percentage_2200-2215="15.38" percentage_2215-2230="15.38" percentage_2230-2245="15.38" percentage_2245-2300="15.38" percentage_2300-2315="15.38" percentage_2315-2330="15.38" percentage_2330-2345="15.38" percentage_2345-2400="15.38"',
    ig_normalized: 'no',
    ig_power_lighting: '7.80',
    ig_power_equipment: '17.20',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '11.30',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 forretningsbygg',
    ul_pct: 'percentage_0000-0015="11.11" percentage_0015-0030="11.11" percentage_0030-0045="11.11" percentage_0045-0100="11.11" percentage_0100-0115="11.11" percentage_0115-0130="11.11" percentage_0130-0145="11.11" percentage_0145-0200="11.11" percentage_0200-0215="11.11" percentage_0215-0230="11.11" percentage_0230-0245="11.11" percentage_0245-0300="11.11" percentage_0300-0315="11.11" percentage_0315-0330="11.11" percentage_0330-0345="11.11" percentage_0345-0400="11.11" percentage_0400-0415="11.11" percentage_0415-0430="11.11" percentage_0430-0445="11.11" percentage_0445-0500="11.11" percentage_0500-0515="11.11" percentage_0515-0530="11.11" percentage_0530-0545="11.11" percentage_0545-0600="11.11" percentage_0600-0615="11.11" percentage_0615-0630="11.11" percentage_0630-0645="11.11" percentage_0645-0700="11.11" percentage_0700-0715="11.11" percentage_0715-0730="11.11" percentage_0730-0745="11.11" percentage_0745-0800="11.11" percentage_0800-0815="11.11" percentage_0815-0830="11.11" percentage_0830-0845="11.11" percentage_0845-0900="11.11" percentage_0900-0915="11.11" percentage_0915-0930="11.11" percentage_0930-0945="11.11" percentage_0945-1000="11.11" percentage_1000-1015="88.83" percentage_1015-1030="88.83" percentage_1030-1045="88.83" percentage_1045-1100="88.83" percentage_1100-1115="88.83" percentage_1115-1130="88.83" percentage_1130-1145="88.83" percentage_1145-1200="88.83" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="88.83" percentage_1815-1830="88.83" percentage_1830-1845="88.83" percentage_1845-1900="88.83" percentage_1900-1915="88.83" percentage_1915-1930="88.83" percentage_1930-1945="88.83" percentage_1945-2000="88.83" percentage_2000-2015="11.11" percentage_2015-2030="11.11" percentage_2030-2045="11.11" percentage_2045-2100="11.11" percentage_2100-2115="11.11" percentage_2115-2130="11.11" percentage_2130-2145="11.11" percentage_2145-2200="11.11" percentage_2200-2215="11.11" percentage_2215-2230="11.11" percentage_2230-2245="11.11" percentage_2245-2300="11.11" percentage_2300-2315="11.11" percentage_2315-2330="11.11" percentage_2330-2345="11.11" percentage_2345-2400="11.11"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 forretningsbygg',
    ue_pct: 'percentage_0000-0015="7.14" percentage_0015-0030="7.14" percentage_0030-0045="7.14" percentage_0045-0100="7.14" percentage_0100-0115="7.14" percentage_0115-0130="7.14" percentage_0130-0145="7.14" percentage_0145-0200="7.14" percentage_0200-0215="7.14" percentage_0215-0230="7.14" percentage_0230-0245="7.14" percentage_0245-0300="7.14" percentage_0300-0315="7.14" percentage_0315-0330="7.14" percentage_0330-0345="7.14" percentage_0345-0400="7.14" percentage_0400-0415="7.14" percentage_0415-0430="7.14" percentage_0430-0445="7.14" percentage_0445-0500="7.14" percentage_0500-0515="7.14" percentage_0515-0530="7.14" percentage_0530-0545="7.14" percentage_0545-0600="7.14" percentage_0600-0615="7.14" percentage_0615-0630="7.14" percentage_0630-0645="7.14" percentage_0645-0700="7.14" percentage_0700-0715="7.14" percentage_0715-0730="7.14" percentage_0730-0745="7.14" percentage_0745-0800="7.14" percentage_0800-0815="7.14" percentage_0815-0830="7.14" percentage_0830-0845="7.14" percentage_0845-0900="7.14" percentage_0900-0915="7.14" percentage_0915-0930="7.14" percentage_0930-0945="7.14" percentage_0945-1000="7.14" percentage_1000-1015="35.69" percentage_1015-1030="35.69" percentage_1030-1045="35.69" percentage_1045-1100="35.69" percentage_1100-1115="35.69" percentage_1115-1130="35.69" percentage_1130-1145="35.69" percentage_1145-1200="35.69" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="35.69" percentage_1415-1430="35.69" percentage_1430-1445="35.69" percentage_1445-1500="35.69" percentage_1500-1515="35.69" percentage_1515-1530="35.69" percentage_1530-1545="35.69" percentage_1545-1600="35.69" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="35.69" percentage_1815-1830="35.69" percentage_1830-1845="35.69" percentage_1845-1900="35.69" percentage_1900-1915="35.69" percentage_1915-1930="35.69" percentage_1930-1945="35.69" percentage_1945-2000="35.69" percentage_2000-2015="7.14" percentage_2015-2030="7.14" percentage_2030-2045="7.14" percentage_2045-2100="7.14" percentage_2100-2115="7.14" percentage_2115-2130="7.14" percentage_2130-2145="7.14" percentage_2145-2200="7.14" percentage_2200-2215="7.14" percentage_2215-2230="7.14" percentage_2230-2245="7.14" percentage_2245-2300="7.14" percentage_2300-2315="7.14" percentage_2315-2330="7.14" percentage_2330-2345="7.14" percentage_2345-2400="7.14"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 forretningsbygg',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="32.21" percentage_0615-0630="32.21" percentage_0630-0645="32.21" percentage_0645-0700="32.21" percentage_0700-0715="32.21" percentage_0715-0730="32.21" percentage_0730-0745="32.21" percentage_0745-0800="32.21" percentage_0800-0815="53.75" percentage_0815-0830="53.75" percentage_0830-0845="53.75" percentage_0845-0900="53.75" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="53.75" percentage_1115-1130="53.75" percentage_1130-1145="53.75" percentage_1145-1200="53.75" percentage_1200-1215="53.75" percentage_1215-1230="53.75" percentage_1230-1245="53.75" percentage_1245-1300="53.75" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="53.75" percentage_1515-1530="53.75" percentage_1530-1545="53.75" percentage_1545-1600="53.75" percentage_1600-1615="53.75" percentage_1615-1630="53.75" percentage_1630-1645="53.75" percentage_1645-1700="53.75" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="53.75" percentage_1915-1930="53.75" percentage_1930-1945="53.75" percentage_1945-2000="53.75" percentage_2000-2015="53.75" percentage_2015-2030="53.75" percentage_2030-2045="53.75" percentage_2045-2100="53.75" percentage_2100-2115="32.21" percentage_2115-2130="32.21" percentage_2130-2145="32.21" percentage_2145-2200="32.21" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '09.00',
    nh_off: '21.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '5.10',
    utw_name: 'Normert bruksmønster fra NS3031:2025 forretningsbygg',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="0.00" percentage_0715-0730="0.00" percentage_0730-0745="0.00" percentage_0745-0800="0.00" percentage_0800-0815="0.00" percentage_0815-0830="0.00" percentage_0830-0845="0.00" percentage_0845-0900="0.00" percentage_0900-0915="0.00" percentage_0915-0930="0.00" percentage_0930-0945="0.00" percentage_0945-1000="0.00" percentage_1000-1015="37.43" percentage_1015-1030="37.43" percentage_1030-1045="37.43" percentage_1045-1100="37.43" percentage_1100-1115="37.43" percentage_1115-1130="37.43" percentage_1130-1145="37.43" percentage_1145-1200="37.43" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="37.43" percentage_1415-1430="37.43" percentage_1430-1445="37.43" percentage_1445-1500="37.43" percentage_1500-1515="37.43" percentage_1515-1530="37.43" percentage_1530-1545="37.43" percentage_1545-1600="37.43" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="37.43" percentage_1815-1830="37.43" percentage_1830-1845="37.43" percentage_1845-1900="37.43" percentage_1900-1915="37.43" percentage_1915-1930="37.43" percentage_1930-1945="37.43" percentage_1945-2000="37.43" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Kulturbygg": {
    vent_supply_air: '8.00',
    vent_extract_air: '8.00',
    vent_usage_holiday: '25.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.00',
    vent_extract_reduced: '4.00',
    vent_norm_on: '8.00',
    vent_norm_off: '2.00',
    uv_name: 'Kulturbygning normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="25" percentage_0015-0030="25" percentage_0030-0045="25" percentage_0045-0100="25" percentage_0100-0115="25" percentage_0115-0130="25" percentage_0130-0145="25" percentage_0145-0200="25" percentage_0200-0215="25" percentage_0215-0230="25" percentage_0230-0245="25" percentage_0245-0300="25" percentage_0300-0315="25" percentage_0315-0330="25" percentage_0330-0345="25" percentage_0345-0400="25" percentage_0400-0415="25" percentage_0415-0430="25" percentage_0430-0445="25" percentage_0445-0500="25" percentage_0500-0515="25" percentage_0515-0530="25" percentage_0530-0545="25" percentage_0545-0600="25" percentage_0600-0615="25" percentage_0615-0630="25" percentage_0630-0645="25" percentage_0645-0700="25" percentage_0700-0715="25" percentage_0715-0730="25" percentage_0730-0745="25" percentage_0745-0800="25" percentage_0800-0815="25" percentage_0815-0830="25" percentage_0830-0845="25" percentage_0845-0900="25" percentage_0900-0915="25" percentage_0915-0930="25" percentage_0930-0945="25" percentage_0945-1000="25" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="100" percentage_1615-1630="100" percentage_1630-1645="100" percentage_1645-1700="100" percentage_1700-1715="100" percentage_1715-1730="100" percentage_1730-1745="100" percentage_1745-1800="100" percentage_1800-1815="100" percentage_1815-1830="100" percentage_1830-1845="100" percentage_1845-1900="100" percentage_1900-1915="100" percentage_1915-1930="100" percentage_1930-1945="100" percentage_1945-2000="100" percentage_2000-2015="100" percentage_2015-2030="100" percentage_2030-2045="100" percentage_2045-2100="100" percentage_2100-2115="25" percentage_2115-2130="25" percentage_2130-2145="25" percentage_2145-2200="25" percentage_2200-2215="25" percentage_2215-2230="25" percentage_2230-2245="25" percentage_2245-2300="25" percentage_2300-2315="25" percentage_2315-2330="25" percentage_2330-2345="25" percentage_2345-2400="25"',
    ig_normalized: 'no',
    ig_power_lighting: '5.40',
    ig_power_equipment: '1.50',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '3.20',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 kulturbygg',
    ul_pct: 'percentage_0000-0015="11.17" percentage_0015-0030="11.17" percentage_0030-0045="11.17" percentage_0045-0100="11.17" percentage_0100-0115="11.17" percentage_0115-0130="11.17" percentage_0130-0145="11.17" percentage_0145-0200="11.17" percentage_0200-0215="11.17" percentage_0215-0230="11.17" percentage_0230-0245="11.17" percentage_0245-0300="11.17" percentage_0300-0315="11.17" percentage_0315-0330="11.17" percentage_0330-0345="11.17" percentage_0345-0400="11.17" percentage_0400-0415="11.17" percentage_0415-0430="11.17" percentage_0430-0445="11.17" percentage_0445-0500="11.17" percentage_0500-0515="11.17" percentage_0515-0530="11.17" percentage_0530-0545="11.17" percentage_0545-0600="11.17" percentage_0600-0615="11.17" percentage_0615-0630="11.17" percentage_0630-0645="11.17" percentage_0645-0700="11.17" percentage_0700-0715="11.17" percentage_0715-0730="11.17" percentage_0730-0745="11.17" percentage_0745-0800="11.17" percentage_0800-0815="11.17" percentage_0815-0830="11.17" percentage_0830-0845="11.17" percentage_0845-0900="11.17" percentage_0900-0915="11.17" percentage_0915-0930="11.17" percentage_0930-0945="11.17" percentage_0945-1000="11.17" percentage_1000-1015="88.83" percentage_1015-1030="88.83" percentage_1030-1045="88.83" percentage_1045-1100="88.83" percentage_1100-1115="88.83" percentage_1115-1130="88.83" percentage_1130-1145="88.83" percentage_1145-1200="88.83" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="88.83" percentage_1815-1830="88.83" percentage_1830-1845="88.83" percentage_1845-1900="88.83" percentage_1900-1915="88.83" percentage_1915-1930="88.83" percentage_1930-1945="88.83" percentage_1945-2000="88.83" percentage_2000-2015="11.17" percentage_2015-2030="11.17" percentage_2030-2045="11.17" percentage_2045-2100="11.17" percentage_2100-2115="11.17" percentage_2115-2130="11.17" percentage_2130-2145="11.17" percentage_2145-2200="11.17" percentage_2200-2215="11.17" percentage_2215-2230="11.17" percentage_2230-2245="11.17" percentage_2245-2300="11.17" percentage_2300-2315="11.17" percentage_2315-2330="11.17" percentage_2330-2345="11.17" percentage_2345-2400="11.17"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 kulturbygg',
    ue_pct: 'percentage_0000-0015="7.28" percentage_0015-0030="7.28" percentage_0030-0045="7.28" percentage_0045-0100="7.28" percentage_0100-0115="7.28" percentage_0115-0130="7.28" percentage_0130-0145="7.28" percentage_0145-0200="7.28" percentage_0200-0215="7.28" percentage_0215-0230="7.28" percentage_0230-0245="7.28" percentage_0245-0300="7.28" percentage_0300-0315="7.28" percentage_0315-0330="7.28" percentage_0330-0345="7.28" percentage_0345-0400="7.28" percentage_0400-0415="7.28" percentage_0415-0430="7.28" percentage_0430-0445="7.28" percentage_0445-0500="7.28" percentage_0500-0515="7.28" percentage_0515-0530="7.28" percentage_0530-0545="7.28" percentage_0545-0600="7.28" percentage_0600-0615="7.28" percentage_0615-0630="7.28" percentage_0630-0645="7.28" percentage_0645-0700="7.28" percentage_0700-0715="7.28" percentage_0715-0730="7.28" percentage_0730-0745="7.28" percentage_0745-0800="7.28" percentage_0800-0815="7.28" percentage_0815-0830="7.28" percentage_0830-0845="7.28" percentage_0845-0900="7.28" percentage_0900-0915="7.28" percentage_0915-0930="7.28" percentage_0930-0945="7.28" percentage_0945-1000="7.28" percentage_1000-1015="35.76" percentage_1015-1030="35.76" percentage_1030-1045="35.76" percentage_1045-1100="35.76" percentage_1100-1115="35.76" percentage_1115-1130="35.76" percentage_1130-1145="35.76" percentage_1145-1200="35.76" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="35.76" percentage_1415-1430="35.76" percentage_1430-1445="35.76" percentage_1445-1500="35.76" percentage_1500-1515="35.76" percentage_1515-1530="35.76" percentage_1530-1545="35.76" percentage_1545-1600="35.76" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="35.76" percentage_1815-1830="35.76" percentage_1830-1845="35.76" percentage_1845-1900="35.76" percentage_1900-1915="35.76" percentage_1915-1930="35.76" percentage_1930-1945="35.76" percentage_1945-2000="35.76" percentage_2000-2015="7.28" percentage_2015-2030="7.28" percentage_2030-2045="7.28" percentage_2045-2100="7.28" percentage_2100-2115="7.28" percentage_2115-2130="7.28" percentage_2130-2145="7.28" percentage_2145-2200="7.28" percentage_2200-2215="7.28" percentage_2215-2230="7.28" percentage_2230-2245="7.28" percentage_2245-2300="7.28" percentage_2300-2315="7.28" percentage_2315-2330="7.28" percentage_2330-2345="7.28" percentage_2345-2400="7.28"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 kulturbygg',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="32.30" percentage_0615-0630="32.30" percentage_0630-0645="32.30" percentage_0645-0700="32.30" percentage_0700-0715="32.30" percentage_0715-0730="32.30" percentage_0730-0745="32.30" percentage_0745-0800="32.30" percentage_0800-0815="53.73" percentage_0815-0830="53.73" percentage_0830-0845="53.73" percentage_0845-0900="53.73" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="53.73" percentage_1115-1130="53.73" percentage_1130-1145="53.73" percentage_1145-1200="53.73" percentage_1200-1215="53.73" percentage_1215-1230="53.73" percentage_1230-1245="53.73" percentage_1245-1300="53.73" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="53.73" percentage_1515-1530="53.73" percentage_1530-1545="53.73" percentage_1545-1600="53.73" percentage_1600-1615="53.73" percentage_1615-1630="53.73" percentage_1630-1645="53.73" percentage_1645-1700="53.73" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="100.00" percentage_1815-1830="100.00" percentage_1830-1845="100.00" percentage_1845-1900="100.00" percentage_1900-1915="53.73" percentage_1915-1930="53.73" percentage_1930-1945="53.73" percentage_1945-2000="53.73" percentage_2000-2015="53.73" percentage_2015-2030="53.73" percentage_2030-2045="53.73" percentage_2045-2100="53.73" percentage_2100-2115="32.30" percentage_2115-2130="32.30" percentage_2130-2145="32.30" percentage_2145-2200="32.30" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '10.00',
    nh_off: '21.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '3.10',
    utw_name: 'Normert bruksmønster fra NS3031:2025 kulturbygg',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="0.00" percentage_0715-0730="0.00" percentage_0730-0745="0.00" percentage_0745-0800="0.00" percentage_0800-0815="0.00" percentage_0815-0830="0.00" percentage_0830-0845="0.00" percentage_0845-0900="0.00" percentage_0900-0915="0.00" percentage_0915-0930="0.00" percentage_0930-0945="0.00" percentage_0945-1000="0.00" percentage_1000-1015="37.34" percentage_1015-1030="37.34" percentage_1030-1045="37.34" percentage_1045-1100="37.34" percentage_1100-1115="37.34" percentage_1115-1130="37.34" percentage_1130-1145="37.34" percentage_1145-1200="37.34" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="37.34" percentage_1415-1430="37.34" percentage_1430-1445="37.34" percentage_1445-1500="37.34" percentage_1500-1515="37.34" percentage_1515-1530="37.34" percentage_1530-1545="37.34" percentage_1545-1600="37.34" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="100.00" percentage_1715-1730="100.00" percentage_1730-1745="100.00" percentage_1745-1800="100.00" percentage_1800-1815="37.34" percentage_1815-1830="37.34" percentage_1830-1845="37.34" percentage_1845-1900="37.34" percentage_1900-1915="37.34" percentage_1915-1930="37.34" percentage_1930-1945="37.34" percentage_1945-2000="37.34" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
  "Lett industri, verksteder": {
    vent_supply_air: '8.00',
    vent_extract_air: '8.00',
    vent_usage_holiday: '25.00',
    vent_cooling_coil: 'yes',
    vent_cooling_coil_cap: '30.00',
    vent_supply_reduced: '4.00',
    vent_extract_reduced: '4.00',
    vent_norm_on: '8.00',
    vent_norm_off: '2.00',
    uv_name: 'Industribygning normert (CAV) NS3031:2025',
    uv_pct: 'percentage_0000-0015="25" percentage_0015-0030="25" percentage_0030-0045="25" percentage_0045-0100="25" percentage_0100-0115="25" percentage_0115-0130="25" percentage_0130-0145="25" percentage_0145-0200="25" percentage_0200-0215="25" percentage_0215-0230="25" percentage_0230-0245="25" percentage_0245-0300="25" percentage_0300-0315="25" percentage_0315-0330="25" percentage_0330-0345="25" percentage_0345-0400="25" percentage_0400-0415="25" percentage_0415-0430="25" percentage_0430-0445="25" percentage_0445-0500="25" percentage_0500-0515="25" percentage_0515-0530="25" percentage_0530-0545="25" percentage_0545-0600="25" percentage_0600-0615="25" percentage_0615-0630="25" percentage_0630-0645="25" percentage_0645-0700="25" percentage_0700-0715="100" percentage_0715-0730="100" percentage_0730-0745="100" percentage_0745-0800="100" percentage_0800-0815="100" percentage_0815-0830="100" percentage_0830-0845="100" percentage_0845-0900="100" percentage_0900-0915="100" percentage_0915-0930="100" percentage_0930-0945="100" percentage_0945-1000="100" percentage_1000-1015="100" percentage_1015-1030="100" percentage_1030-1045="100" percentage_1045-1100="100" percentage_1100-1115="100" percentage_1115-1130="100" percentage_1130-1145="100" percentage_1145-1200="100" percentage_1200-1215="100" percentage_1215-1230="100" percentage_1230-1245="100" percentage_1245-1300="100" percentage_1300-1315="100" percentage_1315-1330="100" percentage_1330-1345="100" percentage_1345-1400="100" percentage_1400-1415="100" percentage_1415-1430="100" percentage_1430-1445="100" percentage_1445-1500="100" percentage_1500-1515="100" percentage_1515-1530="100" percentage_1530-1545="100" percentage_1545-1600="100" percentage_1600-1615="25" percentage_1615-1630="25" percentage_1630-1645="25" percentage_1645-1700="25" percentage_1700-1715="25" percentage_1715-1730="25" percentage_1730-1745="25" percentage_1745-1800="25" percentage_1800-1815="25" percentage_1815-1830="25" percentage_1830-1845="25" percentage_1845-1900="25" percentage_1900-1915="25" percentage_1915-1930="25" percentage_1930-1945="25" percentage_1945-2000="25" percentage_2000-2015="25" percentage_2015-2030="25" percentage_2030-2045="25" percentage_2045-2100="25" percentage_2100-2115="25" percentage_2115-2130="25" percentage_2130-2145="25" percentage_2145-2200="25" percentage_2200-2215="25" percentage_2215-2230="25" percentage_2230-2245="25" percentage_2245-2300="25" percentage_2300-2315="25" percentage_2315-2330="25" percentage_2330-2345="25" percentage_2345-2400="25"',
    ig_normalized: 'no',
    ig_power_lighting: '4.00',
    ig_power_equipment: '8.80',
    ig_person_input: 'tilskudd_personer',
    ig_person_gain: '1.90',
    ig_persons: '1.90',
    ul_name: 'Normert bruksmønster fra NS3031:2025 lett industri/verksted',
    ul_pct: 'percentage_0000-0015="9.20" percentage_0015-0030="9.20" percentage_0030-0045="9.20" percentage_0045-0100="9.20" percentage_0100-0115="9.20" percentage_0115-0130="9.20" percentage_0130-0145="9.20" percentage_0145-0200="9.20" percentage_0200-0215="9.20" percentage_0215-0230="9.20" percentage_0230-0245="9.20" percentage_0245-0300="9.20" percentage_0300-0315="9.20" percentage_0315-0330="9.20" percentage_0330-0345="9.20" percentage_0345-0400="9.20" percentage_0400-0415="9.20" percentage_0415-0430="9.20" percentage_0430-0445="9.20" percentage_0445-0500="9.20" percentage_0500-0515="9.20" percentage_0515-0530="9.20" percentage_0530-0545="9.20" percentage_0545-0600="9.20" percentage_0600-0615="9.20" percentage_0615-0630="9.20" percentage_0630-0645="9.20" percentage_0645-0700="9.20" percentage_0700-0715="9.20" percentage_0715-0730="9.20" percentage_0730-0745="9.20" percentage_0745-0800="9.20" percentage_0800-0815="90.80" percentage_0815-0830="90.80" percentage_0830-0845="90.80" percentage_0845-0900="90.80" percentage_0900-0915="90.80" percentage_0915-0930="90.80" percentage_0930-0945="90.80" percentage_0945-1000="90.80" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="90.80" percentage_1415-1430="90.80" percentage_1430-1445="90.80" percentage_1445-1500="90.80" percentage_1500-1515="90.80" percentage_1515-1530="90.80" percentage_1530-1545="90.80" percentage_1545-1600="90.80" percentage_1600-1615="9.20" percentage_1615-1630="9.20" percentage_1630-1645="9.20" percentage_1645-1700="9.20" percentage_1700-1715="9.20" percentage_1715-1730="9.20" percentage_1730-1745="9.20" percentage_1745-1800="9.20" percentage_1800-1815="9.20" percentage_1815-1830="9.20" percentage_1830-1845="9.20" percentage_1845-1900="9.20" percentage_1900-1915="9.20" percentage_1915-1930="9.20" percentage_1930-1945="9.20" percentage_1945-2000="9.20" percentage_2000-2015="9.20" percentage_2015-2030="9.20" percentage_2030-2045="9.20" percentage_2045-2100="9.20" percentage_2100-2115="9.20" percentage_2115-2130="9.20" percentage_2130-2145="9.20" percentage_2145-2200="9.20" percentage_2200-2215="9.20" percentage_2215-2230="9.20" percentage_2230-2245="9.20" percentage_2245-2300="9.20" percentage_2300-2315="9.20" percentage_2315-2330="9.20" percentage_2330-2345="9.20" percentage_2345-2400="9.20"',
    ue_name: 'Normert bruksmønster fra NS3031:2025 lett industri/verksted',
    ue_pct: 'percentage_0000-0015="9.09" percentage_0015-0030="9.09" percentage_0030-0045="9.09" percentage_0045-0100="9.09" percentage_0100-0115="9.09" percentage_0115-0130="9.09" percentage_0130-0145="9.09" percentage_0145-0200="9.09" percentage_0200-0215="9.09" percentage_0215-0230="9.09" percentage_0230-0245="9.09" percentage_0245-0300="9.09" percentage_0300-0315="9.09" percentage_0315-0330="9.09" percentage_0330-0345="9.09" percentage_0345-0400="9.09" percentage_0400-0415="9.09" percentage_0415-0430="9.09" percentage_0430-0445="9.09" percentage_0445-0500="9.09" percentage_0500-0515="9.09" percentage_0515-0530="9.09" percentage_0530-0545="9.09" percentage_0545-0600="9.09" percentage_0600-0615="9.09" percentage_0615-0630="9.09" percentage_0630-0645="9.09" percentage_0645-0700="9.09" percentage_0700-0715="9.09" percentage_0715-0730="9.09" percentage_0730-0745="9.09" percentage_0745-0800="9.09" percentage_0800-0815="90.91" percentage_0815-0830="90.91" percentage_0830-0845="90.91" percentage_0845-0900="90.91" percentage_0900-0915="90.91" percentage_0915-0930="90.91" percentage_0930-0945="90.91" percentage_0945-1000="90.91" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="90.91" percentage_1415-1430="90.91" percentage_1430-1445="90.91" percentage_1445-1500="90.91" percentage_1500-1515="90.91" percentage_1515-1530="90.91" percentage_1530-1545="90.91" percentage_1545-1600="90.91" percentage_1600-1615="9.09" percentage_1615-1630="9.09" percentage_1630-1645="9.09" percentage_1645-1700="9.09" percentage_1700-1715="9.09" percentage_1715-1730="9.09" percentage_1730-1745="9.09" percentage_1745-1800="9.09" percentage_1800-1815="9.09" percentage_1815-1830="9.09" percentage_1830-1845="9.09" percentage_1845-1900="9.09" percentage_1900-1915="9.09" percentage_1915-1930="9.09" percentage_1930-1945="9.09" percentage_1945-2000="9.09" percentage_2000-2015="9.09" percentage_2015-2030="9.09" percentage_2030-2045="9.09" percentage_2045-2100="9.09" percentage_2100-2115="9.09" percentage_2115-2130="9.09" percentage_2130-2145="9.09" percentage_2145-2200="9.09" percentage_2200-2215="9.09" percentage_2215-2230="9.09" percentage_2230-2245="9.09" percentage_2245-2300="9.09" percentage_2300-2315="9.09" percentage_2315-2330="9.09" percentage_2330-2345="9.09" percentage_2345-2400="9.09"',
    up_name: 'Normert tilstedeværelse fra NS3031:2025 lett industri/verksted',
    up_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="100.00" percentage_0715-0730="100.00" percentage_0730-0745="100.00" percentage_0745-0800="100.00" percentage_0800-0815="100.00" percentage_0815-0830="100.00" percentage_0830-0845="100.00" percentage_0845-0900="100.00" percentage_0900-0915="100.00" percentage_0915-0930="100.00" percentage_0930-0945="100.00" percentage_0945-1000="100.00" percentage_1000-1015="100.00" percentage_1015-1030="100.00" percentage_1030-1045="100.00" percentage_1045-1100="100.00" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="100.00" percentage_1315-1330="100.00" percentage_1330-1345="100.00" percentage_1345-1400="100.00" percentage_1400-1415="100.00" percentage_1415-1430="100.00" percentage_1430-1445="100.00" percentage_1445-1500="100.00" percentage_1500-1515="100.00" percentage_1515-1530="100.00" percentage_1530-1545="100.00" percentage_1545-1600="100.00" percentage_1600-1615="100.00" percentage_1615-1630="100.00" percentage_1630-1645="100.00" percentage_1645-1700="100.00" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
    nh_on: '07.00',
    nh_off: '16.00',
    nh_on_summer: '07.00',
    nh_off_summer: '23.00',
    tw_max_power: '3.80',
    utw_name: 'Normert bruksmønster fra NS3031:2025 lett industri/verksted',
    utw_pct: 'percentage_0000-0015="0.00" percentage_0015-0030="0.00" percentage_0030-0045="0.00" percentage_0045-0100="0.00" percentage_0100-0115="0.00" percentage_0115-0130="0.00" percentage_0130-0145="0.00" percentage_0145-0200="0.00" percentage_0200-0215="0.00" percentage_0215-0230="0.00" percentage_0230-0245="0.00" percentage_0245-0300="0.00" percentage_0300-0315="0.00" percentage_0315-0330="0.00" percentage_0330-0345="0.00" percentage_0345-0400="0.00" percentage_0400-0415="0.00" percentage_0415-0430="0.00" percentage_0430-0445="0.00" percentage_0445-0500="0.00" percentage_0500-0515="0.00" percentage_0515-0530="0.00" percentage_0530-0545="0.00" percentage_0545-0600="0.00" percentage_0600-0615="0.00" percentage_0615-0630="0.00" percentage_0630-0645="0.00" percentage_0645-0700="0.00" percentage_0700-0715="0.00" percentage_0715-0730="0.00" percentage_0730-0745="0.00" percentage_0745-0800="0.00" percentage_0800-0815="49.87" percentage_0815-0830="49.87" percentage_0830-0845="49.87" percentage_0845-0900="49.87" percentage_0900-0915="49.87" percentage_0915-0930="49.87" percentage_0930-0945="49.87" percentage_0945-1000="49.87" percentage_1000-1015="49.87" percentage_1015-1030="49.87" percentage_1030-1045="49.87" percentage_1045-1100="49.87" percentage_1100-1115="100.00" percentage_1115-1130="100.00" percentage_1130-1145="100.00" percentage_1145-1200="100.00" percentage_1200-1215="100.00" percentage_1215-1230="100.00" percentage_1230-1245="100.00" percentage_1245-1300="100.00" percentage_1300-1315="49.87" percentage_1315-1330="49.87" percentage_1330-1345="49.87" percentage_1345-1400="49.87" percentage_1400-1415="49.87" percentage_1415-1430="49.87" percentage_1430-1445="49.87" percentage_1445-1500="49.87" percentage_1500-1515="49.87" percentage_1515-1530="49.87" percentage_1530-1545="49.87" percentage_1545-1600="49.87" percentage_1600-1615="0.00" percentage_1615-1630="0.00" percentage_1630-1645="0.00" percentage_1645-1700="0.00" percentage_1700-1715="0.00" percentage_1715-1730="0.00" percentage_1730-1745="0.00" percentage_1745-1800="0.00" percentage_1800-1815="0.00" percentage_1815-1830="0.00" percentage_1830-1845="0.00" percentage_1845-1900="0.00" percentage_1900-1915="0.00" percentage_1915-1930="0.00" percentage_1930-1945="0.00" percentage_1945-2000="0.00" percentage_2000-2015="0.00" percentage_2015-2030="0.00" percentage_2030-2045="0.00" percentage_2045-2100="0.00" percentage_2100-2115="0.00" percentage_2115-2130="0.00" percentage_2130-2145="0.00" percentage_2145-2200="0.00" percentage_2200-2215="0.00" percentage_2215-2230="0.00" percentage_2230-2245="0.00" percentage_2245-2300="0.00" percentage_2300-2315="0.00" percentage_2315-2330="0.00" percentage_2330-2345="0.00" percentage_2345-2400="0.00"',
  },
};

// XML-escaping for brukarstyrte strenger — «Bygg & Anlegg» utan escaping gir ugyldig XML som SIMIEN nektar å opne
function xesc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}

// ── Ventilasjonsanlegg frå EntroPi (beta) ────────────────────
// Er det lagt eit ventilasjonssystem på sona i systemvindauget, overstyrer
// luftmengd, gjenvinningsgrad og SFP frå EntroPi normverdiane i <ventilation>.
// Alt anna — driftstid, batteri, tilluftstemperatur — står som før. Manglar
// eit tal, står normverdien for det eine talet; vi blandar per felt, ikkje
// alt-eller-ingenting.
function ventSysForZone(z){
  const list=Array.isArray(z.tekniskeSystem)?z.tekniskeSystem:[];
  return list.find(s=>String(s.kategori||'').toLowerCase()
    .replace(/ø/g,'o').indexOf('ventilasjon')===0)||null;
}
// SIMIEN vil ha luftmengd per m². Sender EntroPi total m³/h, deler vi på
// arealet anlegget faktisk betjener — summen av alle soner det er lagt på,
// over alle etasjar. Eitt aggregat gir då same spesifikke luftmengd i alle
// sonene sine, som er den fysisk rette tolkinga.
function ventAreaForSys(id){
  let a=0;
  floors.forEach(f=>f.zones.forEach(z=>{
    const l=Array.isArray(z.tekniskeSystem)?z.tekniskeSystem:[];
    if(l.some(s=>s.id===id))a+=getAreaM2(z)||0;
  }));
  return a;
}
function ventSpesLuft(sys,v){
  // 0 er gyldig (anlegget står av utanfor drift), null/negativt er det ikkje
  if(v==null||!(v>=0))return null;
  if(sys.luft&&sys.luft.per)return v;      // alt per m² frå verten
  const a=ventAreaForSys(sys.id);
  return a>0?v/a:null;                     // utan areal veit vi ingenting
}
// Gjenvinningskurva i referansefila ligg som forhold til 0,80. Vi skalerer
// same forma opp eller ned i staden for å finne opp ei ny kurve.
const VENT_EFF_KURVE=[0.79/0.80,0.81/0.80,0.83/0.80,0.81/0.80,0.76/0.80];

// ── Tiltak i SXI-eksporten ───────────────────────────────────
// Eit <measure> er ein syskin til <zone> som inneheld KOPIAR av dei elementa
// tiltaket råkar. Kopien har ein ny unik id, ein `measure_id` som peikar på
// originalen, og éin endra verdi (u-verdi eller n50). Alt anna — areal,
// retning, konstruksjon — står ord for ord som i originalen; SIMIEN les kopien
// som «slik blir elementet etter tiltaket». Formatet og verdiane er henta frå
// referansefila «Heiane 2» (SIMIEN 8.1.1.12), som byggjer på TEK17-krava.
//
// Berre dei elementtypane som er stadfesta i referansefila vert kopierte:
// <facade>, <roof>, <floor>, <window>, <door> og <zone>. Ei sone med himling
// eller gulv mot ei anna sone ligg som <partition>, og eit kjellargolv som
// <cellar> — dei vert ståande urørte, og tiltaket melder frå når det gjer at
// han ikkje fann noko. Ikkje gjett på eit format som ikkje er verifisert;
// SIMIEN er kresen på feltnamn.
const SXI_TILTAK=[
  {key:'fasade',navn:'Etterisolere fasader',tag:'facade',attr:'uvalue',verdi:'0.18',
   hint:'U 0,18',merk:'ingen ytterveggar (fasadar) i prosjektet'},
  {key:'tak',   navn:'Etterisolere tak',    tag:'roof',  attr:'uvalue',verdi:'0.13',
   hint:'U 0,13',merk:'ingen tak mot det fri — himling mot anna sone ligg som partisjon'},
  {key:'gulv',  navn:'Etterisolere gulv',   tag:'floor', attr:'uvalue',verdi:'0.1',
   hint:'U 0,10',merk:'ingen gulv på grunn — gulv mot anna sone og kjellar ligg som partisjon/kjellar'},
  {key:'vindu', navn:'Bytte vindu',         tag:'window',attr:'uvalue',verdi:'0.8',
   hint:'U 0,80',merk:'ingen vindauge teikna'},
  {key:'dor',   navn:'Bytte dører',         tag:'door',  attr:'uvalue',verdi:'1.2',
   hint:'U 1,20',merk:'ingen dører teikna'},
  {key:'n50',   navn:'Lekkasjetall 1,5',    tag:'zone',  attr:'n50',   verdi:'1.5',
   hint:'n50 1,5',merk:'ingen soner'},
];

function _sxiAttrStr(pairs){
  return pairs.map(([n,v])=>n+'="'+xesc(v)+'"').join(' ');
}

// zonesXml er nettopp generert av oss, så han er gyldig XML. Vi les han tilbake
// i staden for å føre eit register gjennom heile sonebygginga — då kan ikkje
// registeret og fila komme i utakt, og ingen av dei mange `facXml+=`-greinene
// treng å hugse å melde seg på.
function buildTiltakXml(zonesXml,valgte,nextId,info){
  if(!Array.isArray(valgte)||!valgte.length)return {xml:'',ids:[]};
  const doc=new DOMParser().parseFromString('<r>'+zonesXml+'</r>','application/xml');
  if(doc.getElementsByTagName('parsererror').length)
    throw new Error('kunne ikkje lese sonene på nytt for tiltak');
  const root=doc.documentElement;
  const bitar=[],ids=[];
  SXI_TILTAK.forEach(t=>{
    if(valgte.indexOf(t.key)<0)return;
    const els=Array.prototype.slice.call(root.getElementsByTagName(t.tag));
    if(!els.length){ if(info)info.tomme.push(t); return; }
    const mId=nextId('measure');
    ids.push(mId);
    const kopiar=els.map(el=>{
      const orig=el.getAttribute('id')||'';
      const nyId=nextId(t.tag);
      // Attributtane i original rekkjefølgje. id-en står ikkje alltid først
      // (i <door> ligg han mellom `gate` og `name`), så vi byter verdien på
      // plassen han står i staden for å fjerne og leggje til på nytt.
      let pairs=Array.prototype.map.call(el.attributes,a=>[a.name,
        a.name==='id'?nyId:(a.name===t.attr?t.verdi:a.value)]);
      if(t.tag==='door'){
        // Fasadekopiane i tiltaket er tomme, så ei dør må sjølv fortelje kva
        // fasade ho høyrer til. `postfix` er berre eit lesbart namnetillegg.
        const fac=el.parentNode,zn=fac&&fac.parentNode;
        const facId=(fac&&fac.getAttribute&&fac.getAttribute('id'))||'';
        const facNm=(fac&&fac.getAttribute&&fac.getAttribute('name'))||'';
        const znNm=(zn&&zn.getAttribute&&zn.getAttribute('name'))||'';
        pairs=[['measure_id',orig],['parentId',facId],
               ['postfix','('+znNm+' , '+facNm+')']].concat(pairs);
      } else if(t.tag==='floor'||t.tag==='window'){
        const i=pairs.findIndex(p=>p[0]==='id');
        pairs.splice(i+1,0,['measure_id',orig]);
      } else {
        pairs.push(['measure_id',orig]);
      }
      return '    <'+t.tag+' '+_sxiAttrStr(pairs)+'></'+t.tag+'>';
    });
    bitar.push('  <measure id="'+mId+'" name="'+xesc(t.navn)+'" comment="" status="evaluert"'
      +' investment="10000" maintenance="0" lifespan="15">\n'+kopiar.join('\n')+'\n  </measure>');
  });
  return {xml:bitar.length?bitar.join('\n')+'\n':'',ids};
}

// Lønnsomhetsvurderinga står som eit <profitsim> heilt til slutt, etter
// energimerka. Merk at id-PREFIKSET er `profit-evaluation`, ikkje taggnamnet —
// SIMIEN slår opp elementtype på prefikset (same felle som partition/roof).
// Verdiane er SIMIEN sine eigne standardverdiar, kopierte frå referansefila;
// vi finn ikkje opp kalkrente eller inflasjon på brukaren sin vegne.
function buildProfitsimXml(nextId){
  return '  <profitsim id="'+nextId('profit-evaluation')+'" name="Lønnsomhetsvurdering 1"'
    +' comment="" user_defined_lifespan_accepted="no" lifespan_accepted="20.00" language="nb"'
    +' discount_rate_input="gitt_kalkrente" discount_rate="4.00" equity_rate="20.00"'
    +' equity_interest="3.00" loan_interest="5.00" tax_interest="20.00" inflation="2.00"'
    +' energy_inflation="3.00" result_present_value_table="yes"'
    +' result_present_value_allowance_table="yes" result_payback_table="yes"'
    +' result_internal_rate_table="yes" result_energy_savings_table="yes"'
    +' result_saved_amount_table="yes" result_co2_reduction_table="yes"'
    +' result_input_doc_table="yes" result_input_tables="yes"></profitsim>';
}

// Sikra at zoneConnections er ein Map (kan vere array frå historikk/lagring, eller objekt frå gamle versjonar)
function ensureZoneConnectionsMap(zone){
  if(!zone.zoneConnections){
    zone.zoneConnections=new Map();
  } else if(Array.isArray(zone.zoneConnections)){
    zone.zoneConnections=new Map(zone.zoneConnections);
  } else if(!(zone.zoneConnections instanceof Map)){
    // Gamal format: objekt {key: value} — konverter til Map
    zone.zoneConnections=new Map(Object.entries(zone.zoneConnections));
  }
}

// Sikra at alle soner har zoneConnections som Map
function ensureAllZoneConnectionsMaps(){
  floors.forEach(f=>{
    if(f.zones){
      f.zones.forEach(z=>ensureZoneConnectionsMap(z));
    }
  });
}

// Toggle sonekobling på ein skiljevegg
function toggleZoneConnection(zone, segIdx, opposingZoneId){
  ensureZoneConnectionsMap(zone);
  const opposingZone=typeof opposingZoneId==='string'?zones.find(z=>z===opposingZoneId)||null:opposingZoneId;

  if(zone.zoneConnections.has(segIdx)){
    // Fjern frå båda sonene
    zone.zoneConnections.delete(segIdx);
    // Marker som skiljevegg (dersom ikkje allereie det)
    if(!zone.skillevegg)zone.skillevegg=new Set();
    zone.skillevegg.add(segIdx);
    // Fjern frå den nabosona òg
    if(opposingZone){
      ensureZoneConnectionsMap(opposingZone);
      opposingZone.zoneConnections.delete(segIdx);
      if(!opposingZone.skillevegg)opposingZone.skillevegg=new Set();
      opposingZone.skillevegg.add(segIdx);
    }
    snapshot();
    markDirty();
    updateResults();
    hintText.textContent='Fjerna sonekobling — endrast til skiljevegg i begge sonene.';
  } else {
    // Legg til sonekobling på båda sonene
    const name=`Sonekobling ${zone.name} og ${typeof opposingZone==='string'?opposingZone:opposingZone?.name||'nabosone'}`;
    const opposingZoneIdx=opposingZone?zones.indexOf(opposingZone):-1;
    zone.zoneConnections.set(segIdx,{facingZoneIdx:opposingZoneIdx,name});
    // Fjern frå skiljevegg-lista (no er det sonekobling)
    zone.skillevegg?.delete(segIdx);
    // Legg òg til på nabosona
    if(opposingZone){
      ensureZoneConnectionsMap(opposingZone);
      const zoneIdx=zones.indexOf(zone);
      opposingZone.zoneConnections.set(segIdx,{facingZoneIdx:zoneIdx,name});
      opposingZone.skillevegg?.delete(segIdx);
    }
    snapshot();
    markDirty();
    updateResults();
    hintText.textContent='Markerte skiljevegg som sonekobling i begge sonene.';
  }
}

function buildSXI(proj){
  const {prosjektnamn,adresse,klimasted,byggeaar,kommunenr} = proj;
  const ansvarleg = String(proj.ansvarleg||'').trim();
  const tiltakValgte = Array.isArray(proj.tiltak)?proj.tiltak:[];
  const k=KLIMA[klimasted];
  const today=new Date().toISOString().slice(0,10);
  const sfp=sfpLookup(byggeaar);
  const sfp80=(sfp*0.9).toFixed(2);
  const sfp60=(sfp*0.8).toFixed(2);
  const sfp40=(sfp*0.7).toFixed(2);
  const sfp20=(sfp*0.6).toFixed(2);
  const tek=tekKode(byggeaar);

  // Collect all unique logical zones (by groupId or individual)
  // Use the same approach as renderTable: sum area/volume for linked zones
  const logicalZones=[];
  const seenGroups=new Set();
  // Build a map: zone object -> floor name
  const zoneFloorName=new Map();
  floors.forEach((fl,fli)=>{fl.zones.forEach(z=>zoneFloorName.set(z,arkNamn(fl)));});

  floors.forEach((fl,fli)=>{
    fl.zones.forEach((z,zi)=>{
      if(z.groupId){
        if(seenGroups.has(z.groupId))return;
        seenGroups.add(z.groupId);
        const instances=floors.flatMap(f=>f.zones).filter(x=>x.groupId===z.groupId);
        logicalZones.push({z,instances,fli,zi});
      } else {
        logicalZones.push({z,instances:[z],fli,zi});
      }
    });
  });

  // ID counter
  let idN=3;
  const zoneId=()=>'zone#'+(idN++);
  const nextId=(prefix)=>prefix+'#'+(idN++);

  // Build zones XML
  let zonesXml='';
  const zoneIds=[];
  const zoneToSxiId=new Map();  // Map zone object -> SXI zone ID
  const exportedZoneConnections=new Set();  // Track (zoneIdx, facingZoneIdx) pairs already exported

  // BUILD zoneToSxiId FOR ALL ZONES FIRST — must map all zones before export
  // so facing-zone lookup works for all zone pairs
  logicalZones.forEach(({z})=>{
    const thisZoneId='zone#'+(idN);
    idN++;
    zoneIds.push(thisZoneId);
    zoneToSxiId.set(z,thisZoneId);
  });

  // NOW process each zone for SXI export
  logicalZones.forEach(({z,instances})=>{
    const zoneIdx=logicalZones.findIndex(lz=>lz.z===z);
    const thisZoneId=zoneIds[zoneIdx];

    // Bygningskategori — hent frå sona, fall tilbake til Kontorbygg
    const btCfg = BYGKAT_SXI[z.bygkat] || BYGKAT_SXI['Kontorbygg'];
    const bpCfg = BYGKAT_PROFILER[z.bygkat] || BYGKAT_PROFILER['Kontorbygg'];
    const BT           = btCfg.type;
    const BST          = btCfg.subtype;
    const WDAYS        = btCfg.working_days;
    const WDAYS_EN     = btCfg.working_days_en;

    // Ventilasjonstal. Utan eit anlegg på sona står alle normverdiane
    // akkurat som før — ein fil frå eit prosjekt utan EntroPi-system er
    // teikn for teikn den same som før denne funksjonen kom.
    const V={name:'CAV - konstant luftvolum 1',
      sfp100:String(sfp),sfp80:sfp80,sfp60:sfp60,sfp40:sfp40,sfp20:sfp20,
      hx:'yes',eff:'0.80',eff100:'0.79',eff80:'0.81',eff60:'0.83',eff40:'0.81',eff20:'0.76',
      supply:bpCfg.vent_supply_air,extract:bpCfg.vent_extract_air,
      redSupply:bpCfg.vent_supply_reduced,redExtract:bpCfg.vent_extract_reduced};
    const vsys=ventSysForZone(z);
    if(vsys){
      if(vsys.namn)V.name=vsys.namn;
      const til=ventSpesLuft(vsys,vsys.luft?vsys.luft.til:null);
      const fra=ventSpesLuft(vsys,vsys.luft?vsys.luft.fra:null);
      const s=til!=null?til:fra, e=fra!=null?fra:til;
      // Luftmengd utanfor drift: frå EntroPi om han veit henne. Elles står
      // normverdien, men aldri høgare enn den luftmengda anlegget faktisk har
      // — det ville vore reint tull i SIMIEN. Vi skalerer *ikkje* ned norma
      // etter forholdet mellom design og norm: ei nattsenking vi ikkje veit om
      // ville gjort energimerket betre enn vi har grunnlag for å seie.
      const redT=ventSpesLuft(vsys,vsys.luft?vsys.luft.redTil:null);
      const redF=ventSpesLuft(vsys,vsys.luft?vsys.luft.redFra:null);
      if(s!=null){V.supply=s.toFixed(2);
        V.redSupply=(redT!=null?Math.min(redT,s)
          :Math.min(parseFloat(bpCfg.vent_supply_reduced),s)).toFixed(2);}
      if(e!=null){V.extract=e.toFixed(2);
        V.redExtract=(redF!=null?Math.min(redF,e)
          :Math.min(parseFloat(bpCfg.vent_extract_reduced),e)).toFixed(2);}
      if(vsys.sfp!=null){
        V.sfp100=vsys.sfp.toFixed(2);V.sfp80=(vsys.sfp*0.9).toFixed(2);
        V.sfp60=(vsys.sfp*0.8).toFixed(2);V.sfp40=(vsys.sfp*0.7).toFixed(2);
        V.sfp20=(vsys.sfp*0.6).toFixed(2);
      }
      if(vsys.gjenvinning!=null){
        const g=vsys.gjenvinning;
        V.hx=g>0?'yes':'no';
        V.eff=g.toFixed(2);
        const k=VENT_EFF_KURVE.map(r=>Math.min(0.99,g*r).toFixed(2));
        V.eff100=k[0];V.eff80=k[1];V.eff60=k[2];V.eff40=k[3];V.eff20=k[4];
      }
    }

    const totalBra=instances.reduce((s,lz)=>{const a=getAreaM2(lz);return s+(a||0);},0);
    const totalVol=instances.reduce((s,lz)=>{const v=getVolum(lz);return s+(v||0);},0);
    const std=entroStandard(z.byggeaar||byggeaar);
    const uVegg=z.uVegg??std?.uVegg??0.26;
    const uTak=z.uTak??std?.uTak??0.18;
    const uGulv=z.uGulv??std?.uGulv??0.35;
    const uVindu=z.uVindu??std?.uVindu??1.60;
    const uDor=z.uDor??std?.uDor??2.00;
    const n50=z.n50??std?.n50??3.5;
    const kuldebro=z.kuldebro??std?.kuldebro??0.09;
    const uKjVegg=z.uKjVegg??std?.uKjVegg??0.55;
    const uKjGulv=z.uKjGulv??std?.uKjGulv??0.70;

    // Collect all segments from all instances
    const nd=parseFloat(northI.value)||0;
    let facXml='';
    const myLogicalIdx=zoneIdx;  // Index of this zone in logicalZones for zone_connection tracking

    // Kopla soner med fasadane slegne saman på tvers: ytterveggane vert IKKJE
    // skrivne per instans, men samla til éin <facade> per himmelretning etter
    // løkka (koplaFasadeGrupper). SK, sonekoplingar og gavlflater går som før.
    const koplaSaman=instances.length>1&&koplaFasadarSaman(z);
    instances.forEach(lz=>{
      const segs=calcSegments(lz.pts,getHoyde(lz),mppForZone(lz));
      if(!segs)return;
      // Kjellersone: veggar med rolle KJ ligg i <cellar>-elementet og skal ikkje
      // ut som <facade>. YV og SK vert eksporterte som vanleg.
      const sk=lz.skillevegg||new Set();
      const sxiLabels=getFacadeLabels(lz,segs);
      // Legg på etasjenamn om det er fleire instansar (kopla soner)
      const flSuffix=instances.length>1?' ('+zoneFloorName.get(lz)+')':'';

      // Samanslåtte SK-sett for SXI (kan vere delar av ei nabogruppe)
      const sxiMergedGroupsShown=new Set();
      const sxiYvShown=new Set();
      const sxiZoneConnShown=new Set();  // Track which zone connection pairs have been exported

      segs.forEach((seg,si)=>{
        const isSK=sk.has(seg.idx);
        const nm=xesc(sxiLabels[si]);
        const ov=lz.segOverrides?.[seg.idx]||{};
        const lenM=ov.lenM??seg.lenM??0;
        const fhM=getHoyde(lz);
        const grossA=(ov.areaM2??seg.areaM2??(lenM*fhM))??0;

        if(isSK){
          // Sikra at zoneConnections er ein Map
          ensureZoneConnectionsMap(lz);
          // Sjekk om dette segmentet er markert som sonekobling
          const isZoneConn=lz.zoneConnections?.has(seg.idx);
          // Sonekobling: gruppera alle segment med same nabosone og eksportera som éin gong
          if(isZoneConn && z===lz){
            const zcData=lz.zoneConnections.get(seg.idx);
            const facingZoneIdx=zcData.facingZoneIdx;
            if(typeof facingZoneIdx==='number' && facingZoneIdx>=0 && facingZoneIdx<zones.length){
              // Berre eksportera frå den lågara-indekserte sona per par
              if(myLogicalIdx<facingZoneIdx){
                const pairKey=myLogicalIdx+','+facingZoneIdx;
                if(!sxiZoneConnShown.has(pairKey)&&!exportedZoneConnections.has(pairKey)){
                  sxiZoneConnShown.add(pairKey);
                  // Finn alle segment i denne sona som er kobla til same zone
                  const allZcSegs=segs.filter(s=>lz.zoneConnections?.has(s.idx)&&lz.zoneConnections.get(s.idx).facingZoneIdx===facingZoneIdx);
                  const totalGrossA=allZcSegs.reduce((s,gs)=>{const gov=lz.segOverrides?.[gs.idx]||{};return s+(gov.areaM2??gs.areaM2??((gov.lenM??gs.lenM??0)*fhM)??0);},0);
                  const uSK=lz.uPerSeg?.['seg_'+seg.idx]??0.80;
                  const opposingZone=zones[facingZoneIdx];
                  const facingZoneId=zoneToSxiId.get(opposingZone) || 'zone#0';
                  const iwId=nextId('zone-connection');
                  const grpName=xesc((zcData.name||'Sonekobling')+flSuffix);
                  facXml+=`    <zone_connection id="${iwId}" name="${grpName}" comment="" area="${totalGrossA.toFixed(2)}" uvalue="0.18" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="vegg" facing="${facingZoneId}" opening="no" opening_area="0.00" opening_height="2.00" always_open="no" percent_open="0.00" start_opening="8.00" end_opening="17.00" infiltration="25.00" overflow="no" airflow_direction="inn" ventilation_operating_hours="0.00" ventilation_non_operating_hours="0.00" ventilation_off_days="0.00" start_ventilation="8.00" end_ventilation="17.00" thermal_cap2="2.40" internal_layer2="Gips 13 mm"></zone_connection>\n`;
                  exportedZoneConnections.add(pairKey);
                  return;  // Hoppa over den normale SK-handteringa
                }
              }
            }
          }

          // Hoppa over ALLE sonekobling-segment (både eksporterte og ikkje, dei vert handtert som gruppe ovanfor)
          if(isZoneConn){
            return;  // Denne er sonekobling, ikkje ein normal SK-partition
          }

          // Sjekk om dette segmentet er del av eit samanslått sett (og IKKJE ein sonekobling)
          const isMergedEntry=(lz.skMergedGroups||[]).find(g=>g.segs.includes(seg.idx))||null;
          if(isMergedEntry&&!isZoneConn){
            const mergedKey=isMergedEntry.segs.slice().sort((a,b)=>a-b).join(',');
            if(sxiMergedGroupsShown.has(mergedKey))return; // Allereie lagt til
            sxiMergedGroupsShown.add(mergedKey);
            // Summer areal for heile settet
            const grpSegs=segs.filter(s2=>isMergedEntry.segs.includes(s2.idx));
            const totalGrossA=grpSegs.reduce((s,gs)=>{const gov=lz.segOverrides?.[gs.idx]||{};return s+(gov.areaM2??gs.areaM2??((gov.lenM??gs.lenM??0)*fhM)??0);},0);
            const uSK=lz.uPerSeg?.['seg_'+seg.idx]??0.80;

            const iwId=nextId('partition');
            const grpName=xesc((isMergedEntry.name||'Skillekonstruksjon')+flSuffix);
            facXml+=`    <partition id="${iwId}" name="${grpName}" comment="" area="${totalGrossA.toFixed(2)}" uvalue="${uSK}" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="vegg" facing="same_temp_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="" heat_loss_coeff="0.95" zone_temperature="5.0"></partition>\n`;
          } else {
            // Enkelt SK-segment (ikkje samanslått og ikkje sonekobling — sonekobling vert handtert som gruppe ovanfor)
            const uSK=lz.uPerSeg?.['seg_'+seg.idx]??0.80;
            const iwId=nextId('partition');
            facXml+=`    <partition id="${iwId}" name="${nm}${flSuffix}" comment="" area="${grossA.toFixed(2)}" uvalue="${uSK}" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="vegg" facing="same_temp_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="" heat_loss_coeff="0.95" zone_temperature="5.0"></partition>\n`;
          }
        } else {
          if(isKjellervegg(lz,seg.idx))return;   // dekt av <cellar>
          if(koplaSaman)return;                   // skrive samla etter løkka
          // Sjekk om denne YV-fasaden er slått saman med andre av same himmelretning
          const yvMergedGroup=(lz.yvMergedGroups||[]).find(g=>g.segs.includes(seg.idx));
          if(yvMergedGroup){
            const yvKey=yvMergedGroup.segs.slice().sort((a,b)=>a-b).join(',');
            if(sxiYvShown.has(yvKey))return;
            sxiYvShown.add(yvKey);
            const grpSegs=segs.filter(s=>yvMergedGroup.segs.includes(s.idx));
            const totalGrossA=grpSegs.reduce((sum,gs)=>{
              const gov=lz.segOverrides?.[gs.idx]||{};
              return sum+(gov.areaM2??gs.areaM2??((gov.lenM??gs.lenM??0)*fhM)??0);
            },0);
            const meanAz=Math.round(circularMeanAz(grpSegs.map(s=>s.normalAz)));
            const effectiveU=lz.uPerSeg?.['seg_'+seg.idx]??uVegg;
            let openingsXml='';
            grpSegs.forEach(gs=>{
              (lz.windows||[]).filter(w=>w.segIdx===gs.idx).forEach(w=>{
                const uW=w.type==='dor'?(w.uVerdi??lz.uDor??uDor):(w.uVerdi??lz.uVindu??uVindu);
                const wName=xesc((w.name||(w.type==='dor'?'Dør':'Vindauge'))+flSuffix);
                if(w.type==='dor'){
                  const dId=nextId('door');
                  const dH=Math.max(0.1,(w.hoyMm||2100)/1000);
                  const dW=Math.max(0.1,(w.breddeMm||900)/1000);
                  const dArea=(dW*dH*(w.antal||1)).toFixed(2);
                  openingsXml+=`      <door uvalue="${uW}" area="${dArea}" type="Standardvalg" gate="no" id="${dId}" name="${wName}" comment=""></door>\n`;
                } else {
                  const wId=nextId('window');
                  const wH=Math.max(0.1,(w.hoyMm||1200)/1000).toFixed(3);
                  const wW=Math.max(0.1,(w.breddeMm||1200)/1000).toFixed(3);
                  openingsXml+=`      <window id="${wId}" name="${wName}" comment="" number="${w.antal||1}" height="${wH}" width="${wW}" given_frame_width="no" frame_width="0.08" frame_factor="0.20" total_uvalue="yes" uvalue="${uW}" window_type="Standardvalg" uvalue_pane="0.80" uvalue_frame="1.00" thermal_bridge_frame="0.10" pane_type="Standardvalg" frame_type="Standardvalg" spacer_type="Standardvalg" shading_type="konstant" const_solar_factor="0.50" const_sun_shading="Standardvalg" var_solar_factor="0.51" var_solar_factor_shaded="0.06" auto_shading="no" auto_shading_flux="100.00" var_sun_shading="Standardvalg" overhang="no" depth_overhang="1.20" distance_overhang="0.60" vert_extension_left="no" depth_extension_left="1.20" distance_extension_left="1.00" vert_extension_right="no" depth_extension_right="1.20" distance_extension_right="1.00" direction="${meanAz}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0"></window>\n`;
                }
              });
            });
            const faceId=nextId('facade');
            facXml+=`    <facade id="${faceId}" name="${xesc(yvMergedGroup.name+flSuffix)}" comment="" area="${totalGrossA.toFixed(2)}" uvalue="${effectiveU}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" exposed="no" ext_absorption_coeff="0.80" direction="${meanAz}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0">\n${openingsXml}    </facade>\n`;
            return;
          }
          const effectiveU=lz.uPerSeg?.['seg_'+seg.idx]??uVegg;
          const faceId=nextId('facade');
          const dirDeg=seg.dir==='Nord'?0:seg.dir==='Nordøst'?45:seg.dir==='Øst'?90:seg.dir==='Sørøst'?135:seg.dir==='Sør'?180:seg.dir==='Sørvest'?225:seg.dir==='Vest'?270:315;
          const wins=(lz.windows||[]).filter(w=>w.segIdx===seg.idx);
          let openingsXml='';
          wins.forEach(w=>{
            const uW=w.type==='dor'?(w.uVerdi??lz.uDor??uDor):(w.uVerdi??lz.uVindu??uVindu);
            const wName=xesc((w.name||(w.type==='dor'?'Dør':'Vindauge'))+flSuffix);
            if(w.type==='dor'){
              const dId=nextId('door');
              const dH=Math.max(0.1,(w.hoyMm||2100)/1000);
              const dW=Math.max(0.1,(w.breddeMm||900)/1000);
              const dAntal=w.antal||1;
              const dArea=(dW*dH*dAntal).toFixed(2);
              openingsXml+=`      <door uvalue="${uW}" area="${dArea}" type="Standardvalg" gate="no" id="${dId}" name="${wName}" comment=""></door>\n`;
            } else {
              const wId=nextId('window');
              const wH=Math.max(0.1,(w.hoyMm||1200)/1000).toFixed(3);
              const wW=Math.max(0.1,(w.breddeMm||1200)/1000).toFixed(3);
              openingsXml+=`      <window id="${wId}" name="${wName}" comment="" number="${w.antal||1}" height="${wH}" width="${wW}" given_frame_width="no" frame_width="0.08" frame_factor="0.20" total_uvalue="yes" uvalue="${uW}" window_type="Standardvalg" uvalue_pane="0.80" uvalue_frame="1.00" thermal_bridge_frame="0.10" pane_type="Standardvalg" frame_type="Standardvalg" spacer_type="Standardvalg" shading_type="konstant" const_solar_factor="0.50" const_sun_shading="Standardvalg" var_solar_factor="0.51" var_solar_factor_shaded="0.06" auto_shading="no" auto_shading_flux="100.00" var_sun_shading="Standardvalg" overhang="no" depth_overhang="1.20" distance_overhang="0.60" vert_extension_left="no" depth_extension_left="1.20" distance_extension_left="1.00" vert_extension_right="no" depth_extension_right="1.20" distance_extension_right="1.00" direction="${dirDeg}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0"></window>\n`;
            }
          });
          facXml+=`    <facade id="${faceId}" name="${nm}${flSuffix}" comment="" area="${grossA.toFixed(2)}" uvalue="${effectiveU}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" exposed="no" ext_absorption_coeff="0.80" direction="${dirDeg}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0">\n${openingsXml}    </facade>\n`;
        }
      });
      // Gavlflater — trekantforma ytterveggar over veggtopp, eksportert som eigne <facade>-element
      (lz.gavlflater||[]).forEach(gf=>{
        if(!gf.area||gf.area<0.01)return;
        if(isKjellervegg(lz,gf.segIdx))return;   // ein kjellervegg har ingen gavl
        const gseg=segs.find(s=>s.idx===gf.segIdx);
        if(!gseg)return;
        const dirDeg=Math.round(gseg.normalAz||0);
        const effectiveUGavl=lz.uPerSeg?.['seg_'+gf.segIdx]??uVegg;
        const gavlId=nextId('facade');
        const gavlName=xesc((gf.dir||gseg.dir||'Gavl')+' gavl'+flSuffix);
        facXml+=`    <facade id="${gavlId}" name="${gavlName}" comment="" area="${gf.area.toFixed(2)}" uvalue="${effectiveUGavl}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" exposed="no" ext_absorption_coeff="0.80" direction="${dirDeg}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0"></facade>\n`;
      });
    });
    if(koplaSaman){
      koplaFasadeGrupper(instances).forEach(g=>{
        // U-verdi: same verdi overalt ⇒ han står som han er; ulike U-verdiar
        // (uPerSeg) ⇒ arealvekta snitt, som gir same varmetap (U·A) som dei
        // separate fasadane ville gitt.
        const us=g.segs.map(x=>x.lz.uPerSeg?.['seg_'+x.seg.idx]??uVegg);
        const effectiveU=us.every(u=>u===us[0])?us[0]
          :(g.area>0?+(g.segs.reduce((s,x,i)=>s+us[i]*x.area,0)/g.area).toFixed(3):us[0]);
        let openingsXml='';
        g.segs.forEach(({lz,seg})=>{
          const flSuffix=' ('+zoneFloorName.get(lz)+')';
          (lz.windows||[]).filter(w=>w.segIdx===seg.idx).forEach(w=>{
            const uW=w.type==='dor'?(w.uVerdi??lz.uDor??uDor):(w.uVerdi??lz.uVindu??uVindu);
            const wName=xesc((w.name||(w.type==='dor'?'Dør':'Vindauge'))+flSuffix);
            if(w.type==='dor'){
              const dId=nextId('door');
              const dH=Math.max(0.1,(w.hoyMm||2100)/1000);
              const dW=Math.max(0.1,(w.breddeMm||900)/1000);
              const dArea=(dW*dH*(w.antal||1)).toFixed(2);
              openingsXml+=`      <door uvalue="${uW}" area="${dArea}" type="Standardvalg" gate="no" id="${dId}" name="${wName}" comment=""></door>\n`;
            } else {
              const wId=nextId('window');
              const wH=Math.max(0.1,(w.hoyMm||1200)/1000).toFixed(3);
              const wW=Math.max(0.1,(w.breddeMm||1200)/1000).toFixed(3);
              openingsXml+=`      <window id="${wId}" name="${wName}" comment="" number="${w.antal||1}" height="${wH}" width="${wW}" given_frame_width="no" frame_width="0.08" frame_factor="0.20" total_uvalue="yes" uvalue="${uW}" window_type="Standardvalg" uvalue_pane="0.80" uvalue_frame="1.00" thermal_bridge_frame="0.10" pane_type="Standardvalg" frame_type="Standardvalg" spacer_type="Standardvalg" shading_type="konstant" const_solar_factor="0.50" const_sun_shading="Standardvalg" var_solar_factor="0.51" var_solar_factor_shaded="0.06" auto_shading="no" auto_shading_flux="100.00" var_sun_shading="Standardvalg" overhang="no" depth_overhang="1.20" distance_overhang="0.60" vert_extension_left="no" depth_extension_left="1.20" distance_extension_left="1.00" vert_extension_right="no" depth_extension_right="1.20" distance_extension_right="1.00" direction="${g.az}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0"></window>\n`;
            }
          });
        });
        const faceId=nextId('facade');
        facXml+=`    <facade id="${faceId}" name="${xesc(g.dir)}" comment="" area="${g.area.toFixed(2)}" uvalue="${effectiveU}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" exposed="no" ext_absorption_coeff="0.80" direction="${g.az}" horizon_sector1="9.0" horizon_sector2="9.0" horizon_sector3="9.0" horizon_sector4="9.0">\n${openingsXml}    </facade>\n`;
      });
    }

    // Tak og gulv — per instans, og per delflate når taket eller golvet er
    // delt opp. `eksportFlater` gir alltid minst éi oppføring, så begge vegane
    // går gjennom same løkka: udelt sone gir teikn for teikn same XML som før.
    let takXml='',gulvXml='',kjellerXml='';
    instances.forEach(lz=>{
      const perim=getUtvOmkrets(lz)??getPerimM(lz)??0;
      const flSuf2=instances.length>1?' ('+zoneFloorName.get(lz)+')':'';
      const lzSk=lz.skillevegg||new Set();

      // ── TAK ──────────────────────────────────────────────────
      eksportFlater(lz,'tak').forEach(({fl,type:takType,navn,area})=>{
        const uT=(fl&&fl.uverdi!=null)?fl.uverdi:uTak;
        if(takType==='Himling mot uoppvarma sone'){
          const thisTakId=nextId('partition');
          const nm=xesc((navn||'Himling mot uoppvarma sone')+flSuf2);
          takXml+=`    <partition id="${thisTakId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uT}" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="himling" facing="unheated_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="Uklimatisert loftsrom eller kaldt luftet loft" heat_loss_coeff="0.93" zone_temperature="5.0"></partition>\n`;
        } else if(takType==='Himling mot varm sone'){
          const thisTakId=nextId('partition');
          const nm=xesc((navn||'Himling mot varm sone')+flSuf2);
          takXml+=`    <partition id="${thisTakId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uT}" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="himling" facing="same_temp_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="" heat_loss_coeff="0.95" zone_temperature="5.0"></partition>\n`;
        } else {
          // Tak mot det fri. Udelt tak: sona sin takvinkel og retning 100 som før.
          const thisTakId=nextId('roof');
          const tvDeg=fl?Math.max(0,fl.vinkel||0):getTakvinkel(lz);
          const skraaA=fl
            ?(tvDeg>0?area/Math.cos(tvDeg*Math.PI/180):area)
            :(getTakAreal(lz)??0);
          const inclination=tvDeg>0?tvDeg.toFixed(1):'0';
          const dir=fl?(((fl.retning??180)+360)%360).toFixed(0):'100';
          const nm=xesc((navn||'Tak')+flSuf2);
          takXml+=`    <roof id="${thisTakId}" name="${nm}" comment="" area="${skraaA.toFixed(2)}" uvalue="${uT}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" exposed="no" ext_absorption_coeff="0.80" direction="${dir}" inclination="${inclination}" horizon_sector_n="9.0" horizon_sector_ne="9.0" horizon_sector_e="9.0" horizon_sector_se="9.0" horizon_sector_s="9.0" horizon_sector_sw="9.0" horizon_sector_w="9.0" horizon_sector_nw="9.0"></roof>\n`;
        }
      });

      // ── GULV ─────────────────────────────────────────────────
      eksportFlater(lz,'gulv').forEach(({fl,type:gulvType,navn,area})=>{
        const uG=(fl&&fl.uverdi!=null)?fl.uverdi:uGulv;
        if(gulvType==='Gulv mot uoppvarma sone'){
          const thisGulvId=nextId('partition');
          const nm=xesc((navn||'Gulv mot uoppvarma sone')+flSuf2);
          gulvXml+=`    <partition id="${thisGulvId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uG}" thermal_cap="63.00" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="gulv" facing="unheated_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="Kald luftet kjeller eller parkeringskjeller" heat_loss_coeff="0.91" zone_temperature="5.0"></partition>\n`;
        } else if(gulvType==='Gulv mot oppvarma sone'){
          const thisGulvId=nextId('partition');
          const nm=xesc((navn||'Gulv mot oppvarma sone')+flSuf2);
          gulvXml+=`    <partition id="${thisGulvId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uG}" thermal_cap="2.40" construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" type="gulv" facing="same_temp_zone" summer_temp="25.0" winter_temp="21.0" summer_humidity="60.0" winter_humidity="40.0" co2="600" air_exchange="0" unheated_zone="" heat_loss_coeff="0.95" zone_temperature="5.0"></partition>\n`;
        } else if(gulvType===KJELLER_GULV){
          // Kjeller — eitt element som dekkjer både golvet og dei veggane som er
          // merkte KJ. fill_depth er kor djupt kjellaren ligg under terreng.
          // Er golvet delt opp, tel berre dei KJ-veggane som ligg langs denne
          // delflata — elles ville kvar delflate fått heile kjellerveggen.
          const kjId=nextId('cellar');
          const veggLen=fl?flateKantLenM(lz,fl,i=>isKjellervegg(lz,i)):(getKjellerVeggLen(lz)??0);
          const veggH=getHoyde(lz);
          const fyll=Math.min(getOppfylling(lz),veggH);
          const nm=xesc((navn||'Kjeller')+flSuf2);
          kjellerXml+=`    <cellar id="${kjId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uKjGulv}" thermal_cap="63.0" construction="Egendefinert" internal_layer="Tungt gulv" wall_length="${veggLen.toFixed(2)}" wall_height="${veggH.toFixed(2)}" fill_depth="${fyll.toFixed(2)}" wall_thickness="${KJELLER_VEGGTJUKN.toFixed(2)}" wall_uvalue="${uKjVegg}" wall_thermal_cap="63.0" wall_construction="Egendefinert" wall_internal_layer="Tung vegg" ground_condition="Leire/silt" ground_thermal_cond="1.50" ground_thermal_cap="833.00"></cellar>\n`;
        } else {
          // Gulv på grunn (standard). Perimeteren er den delen av flatekanten
          // som ligg mot det fri — ei delflate midt inne i sona har ingen.
          const thisGulvId=nextId('floor');
          const pm=fl?flateKantLenM(lz,fl,i=>!lzSk.has(i)):perim;
          const nm=xesc((navn||'Gulv på grunn')+flSuf2);
          gulvXml+=`    <floor id="${thisGulvId}" name="${nm}" comment="" area="${area.toFixed(2)}" uvalue="${uG}" thermal_cap="10.00" construction="Standardvalg" internal_layer="Standardvalg" floor_type="grunn" perimeter="${pm.toFixed(2)}" foundation="0.30" ground_condition="Standardvalg" ground_thermal_cond="1.50" ground_thermal_cap="556.00" edge_insulation="yes" edge_insulation_type="vertikal" edge_insulation_depth="0.60" edge_insulation_thickness="5.00" edge_insulation_product="Standardvalg" edge_insulation_lambda="0.037" unheated_zone="" heat_loss_coeff="0.95"></floor>\n`;
        }
      });
    });

    const bra=totalBra.toFixed(2);
    const vol=totalVol.toFixed(1);
    const zId=thisZoneId;
    zonesXml+=`  <zone id="${zId}" name="${xesc(z.name)}" comment="" building_type="${BT}" building_subtype="${BST}" area="${bra}" volume="${vol}" n50="${n50}" furniture="Middels møblert" thermal_cap_furniture="4.00" shielding="moderat" facades="flere" thermal_bridge_type="normalisert" norm_thermal_bridge="${kuldebro}" working_days="${WDAYS}" working_days_en="${WDAYS_EN}" working_days_jan="${btCfg.working_days_jan}" working_days_feb="${btCfg.working_days_feb}" working_days_mar="${btCfg.working_days_mar}" working_days_apr="${btCfg.working_days_apr}" working_days_may="${btCfg.working_days_may}" working_days_jun="${btCfg.working_days_jun}" working_days_jul="${btCfg.working_days_jul}" working_days_aug="${btCfg.working_days_aug}" working_days_sep="${btCfg.working_days_sep}" working_days_oct="${btCfg.working_days_oct}" working_days_nov="${btCfg.working_days_nov}" working_days_dec="${btCfg.working_days_dec}">
${kjellerXml}${facXml}${takXml}${gulvXml}    <ventilation id="${nextId('cav')}" name="${xesc(V.name)}" comment="" sfp_input="prosent" sfp_100="${V.sfp100}" sfp_80="${V.sfp80}" sfp_60="${V.sfp60}" sfp_40="${V.sfp40}" sfp_20="${V.sfp20}" position_supply_fan="etter" position_extract_fan="etter" supply_temp="19.00" summer_scheme="no" supply_temp_summer="17.00" first_summer_month="mai" last_summer_month="august" heating_coil="yes" heating_coil_cap="30.00" heating_coil_efficiency="0.98" heating_coil_type="lokal" distr_heating_id="" heating_coil_spp="0.50" heating_coil_supply_temp="45.00" heating_coil_return_temp="30.00" cooling_coil="${bpCfg.vent_cooling_coil}" cooling_coil_cap="${bpCfg.vent_cooling_coil_cap}" cooling_coil_efficiency="2.00" cooling_coil_type="lokal" distr_cooling_id="" cooling_coil_spp="0.50" cooling_coil_supply_temp="10.00" cooling_coil_return_temp="15.00" heat_exchanger="${V.hx}" exchanger_efficiency_input="prosent" efficiency_exchanger="${V.eff}" efficiency_exchanger_100="${V.eff100}" efficiency_exchanger_80="${V.eff80}" efficiency_exchanger_60="${V.eff60}" efficiency_exchanger_40="${V.eff40}" efficiency_exchanger_20="${V.eff20}" frost_protection="no" frost_protect_temp="-10.00" hygroscopic_exchanger="no" humidity_efficiency="0.60" contamination_risk="no" night_cooling="no" start_time_night_cooling="23.00" end_time_night_cooling="06.00" room_temp_night_cooling="22.00" ext_temp_night_cooling="20.00" max_room_temp_night_cooling="24.00" min_room_temp_night_cooling="18.00" min_supply_temp_night_cooling="12.00" night_cooling_holiday="no" reduced_airflow="no" reduced_airflow_temp="-15.00" heating_coil_distr_description="forenklet" heating_coil_specific_length_pipes="0.20" heating_coil_uvalue_pipes="0.20" heating_coil_share_heated_room="50.00" heating_coil_temp_unheated_room="10.00" cooling_coil_distr_description="forenklet" cooling_coil_specific_length_pipes="0.20" cooling_coil_uvalue_pipes="0.20" cooling_coil_share_heated_room="50.00" cooling_coil_temp_unheated_room="10.00" type="balansert" supply_air="${V.supply}" extract_air="${V.extract}" supply_temp_type="konstant" max_supply_temp="19.00" min_supply_temp="16.00" high_extract_temp="24.00" low_extract_temp="21.00" usage_holiday="${bpCfg.vent_usage_holiday}" supply_airflow_night_cooling="1.20" extract_airflow_night_cooling="1.20" supply_airflow_reduced="${V.redSupply}" extract_airflow_reduced="${V.redExtract}" norm_airflow="no" norm_air_on="${bpCfg.vent_norm_on}" norm_air_off="${bpCfg.vent_norm_off}" norm_sfp_on="1.50" norm_sfp_off="1.50" cooling_coil_water_flow="variable" heating_coil_water_flow="variable" frost_protection_type="preheat">
      <usage_ventilation name="${bpCfg.uv_name}" ${bpCfg.uv_pct}></usage_ventilation>
    </ventilation>
    <new_heating id="${nextId('new-heating-system')}" name="Varmesystem 1" comment="" setpoint_temp_on="21.00" setpoint_temp_off="21.00" on_time="${bpCfg.nh_on}" off_time="${bpCfg.nh_off}" summer_scheme="no" summer_scheme_reg="dato" start_date_summer="15.05" stop_date_summer="15.09" ext_temperature_summer="10.00" setpoint_temp_on_summer="20.00" setpoint_temp_off_summer="16.00" on_time_summer="${bpCfg.nh_on_summer}" off_time_summer="${bpCfg.nh_off_summer}" delta_t_setpoint="0.00">
      <new_local_heater_dir_el heater_type="frittstaende" name="Panelovner" capacity="${(totalBra*0.05).toFixed(2)}" convective_share="0.50" integrated_constr_id="" res_integrated_heater="" thermal_resistance="0.25" integrated_area="20.00" priority="1"></new_local_heater_dir_el>
    </new_heating>
    <internal_gain id="${nextId('internal-gain')}" name="Interne laster 1" comment="" normalized="${bpCfg.ig_normalized}" lighting="yes" power_lighting="${bpCfg.ig_power_lighting}" power_lighting_holiday="0.00" gain_lighting_on="100.00" gain_lighting_holiday="100.00" equipment="yes" power_equipment="${bpCfg.ig_power_equipment}" power_equipment_holiday="0.00" gain_equipment_on="60.00" gain_equipment_holiday="100.00" person="yes" person_input="${bpCfg.ig_person_input}" person_gain="${bpCfg.ig_person_gain}" persons="${bpCfg.ig_persons}" percent_persons_holiday="0.00" persons_clothing="1.20" persons_activity="1.00" hot_fill_dishwasher="no" energy_share_dishwasher="10.00" hot_fill_washingmachine="no" energy_share_washingmachine="10.00" hot_fill_dryer="no" energy_share_dryer="10.00" norm_type="NS3031_2025">
      <usage_lighting name="${bpCfg.ul_name}" ${bpCfg.ul_pct}></usage_lighting>
      <usage_equipment name="${bpCfg.ue_name}" ${bpCfg.ue_pct}></usage_equipment>
      <usage_person name="${bpCfg.up_name}" ${bpCfg.up_pct}></usage_person>
    </internal_gain>
    <tap_water id="${nextId('tap-water')}" name="Tappevann 1" comment="" normalized="no" type="lokal" local_power="1.00" local_temp="65.00" local_volume="100.00" local_specific_loss="1.60" local_placement="oppv_rom" zone_id="${zId}" local_ambient_temp="10.00" distr_system_id="" max_power="${bpCfg.tw_max_power}" gain="0.00" distr_type="ikke_sirkulerende" distr_description="forenklet" specific_length_pipes="0.03" uvalue_pipes="1.00" share_heated_room="50.00" temp_unheated_room="10.00" specific_length_pipes_open="0.20" tap_cycles="10.00" share_heated_room_open="50.00" recuperation="no" efficiency_recuperation="0.45" lossfactor_connection_recuperation="0.80" lossfactor_usage_recuperation="0.60" percentage_recuperation="50.00" norm_type="NS3031_2025" specific_pump_power="0.20">
      <usage_tap_water name="${bpCfg.utw_name}" ${bpCfg.utw_pct}></usage_tap_water>
    </tap_water>
  </zone>\n`;
  });

  // Tiltak (<measure>) — kopiar av dei elementa kvart valt tiltak råkar.
  // Må byggjast etter sonene (han les dei tilbake) og før energymerket,
  // som må vite om det finst tiltak å inkludere.
  const {xml:tiltakXml,ids:tiltakIds}=buildTiltakXml(zonesXml,tiltakValgte,nextId,
    proj.tiltakInfo||null);

  // energymark26 — éin per unik building_type
  const totalBra=logicalZones.reduce((s,{instances})=>s+instances.reduce((ss,lz)=>{const a=getAreaM2(lz);return ss+(a||0);},0),0);

  // Kortnamn for energimerkenamnet (frå building_type → lesleg kortform)
  const btShortName=(bt)=>({
    'Kontorbygning':'Kontor',
    'Boligbygning':'Bolig','Småhus':'Småhus','Boligblokk':'Boligblokk',
    'Barnehage':'Barnehage','Skolebygning':'Skole',
    'Universitets- og høgskolebygning':'Universitetsbygg',
    'Sykehus':'Sykehus','Sykehjem':'Sykehjem',
    'Hotellbygning':'Hotell','Idrettsbygning':'Idrettsbygg',
    'Forretningsbygning':'Forretning','Kulturbygning':'Kultur',
    'Lett industribygning, verksted':'Verksted',
  }[bt]||bt);

  // Grupper logicalZones per building_type
  const byBT=new Map();
  logicalZones.forEach(({z,instances},lzi)=>{
    const bt=BYGKAT_SXI[z.bygkat]?.type||'Kontorbygning';
    if(!byBT.has(bt))byBT.set(bt,{zoneIds:[],bra:0});
    const entry=byBT.get(bt);
    entry.zoneIds.push(zoneIds[lzi]);
    entry.bra+=instances.reduce((s,lz)=>{const a=getAreaM2(lz);return s+(a||0);},0);
  });

  const emXml=[...byBT.entries()].map(([bt,{zoneIds:emZids,bra:emBra}])=>{
    const emId=nextId('energymark26');
    const emName=`Energimerke ${btShortName(bt)}`;
    // Kvart energimerke må sjølv liste tiltaka det skal rekne med. Eit tiltak
    // dekkjer element frå ALLE soner, så alle tiltaka vert lista i alle
    // energimerka — det er SIMIEN som plukkar ut dei elementa som høyrer til
    // sonene i merket.
    const incl=emZids.map(id=>`    <included_zone id="${id}"></included_zone>`)
      .concat(tiltakIds.map(id=>
        `    <included_measures_ids tiltak_id="${id}"></included_measures_ids>`))
      .join('\n');
    return `  <energymark26 id="${emId}" name="${emName}" comment="" language="nb" units="1" project_type="old_building" building_code="${tek}" built="${byggeaar}" company="Entro AS" company_id="" person="${xesc(ansvarleg)}" personal_id="" energy_measured="no" infiltration_measured="no" measure_date_n50="${today}" unheated_floor_area="0" tech_check="yes" section_description="" matrikkelenhet_ident="" bygg_ident="" bruksenhet_ident="" adresse_ident="" vegadresse_ident="" lighting_system="normal" ventilation_system="cav" ventilation_input="real" lowered_temperature="no" distr_system_space_heating_detailed="no" distr_system_heating_coil_detailed="no" distr_system_space_cooling_detailed="no" distr_system_cooling_coil_detailed="no" distr_system_tap_water_detailed="no" spp_space_heating_detailed="no" spp_heating_coil_detailed="no" spp_space_cooling_detailed="no" spp_cooling_coil_detailed="no" spp_tap_water_detailed="no" json_file="no" red_factor_lighting="0.70" description_no_measures="" include_measures="${tiltakXml?'yes':'no'}" total_floor_area="${emBra.toFixed(2)}">
    <measured_energy single_year="no" energy_measure_year1="2023" energy_measure_year2="2024" energy_measure_year3="2025"></measured_energy>
    <building_id id_type="matrikkel" municipality="${klimasted}" municipality_no="${kommunenr}" zip_address="" zip_number="0"></building_id>
${incl}
  </energymark26>`;
  }).join('\n');

  // Utan tiltak er det ingenting å vurdere lønnsemda av, og fila skal vere
  // teikn for teikn som før.
  const profitXml=tiltakIds.length?'\n'+buildProfitsimXml(nextId):'';

  const sxi=`<?xml version="1.0" encoding="utf-8"?>
<simien_project id="project#1" name="${xesc(prosjektnamn)}" comment="${xesc(adresse)}" person="${xesc(ansvarleg)}" user="${xesc(ansvarleg)}" company="Entro AS" version="8.1.0.15">
${klimaBlock(k,klimasted)}
  <input_documentation25></input_documentation25>
  <global_vars conv_share_lighting_gain="0.30" conv_share_equipment_gain="0.50" conv_share_person_gain="0.50" conv_share_solar_gain="0.50" heat_gain_pr_person="95" conv_thermal_transfer_coeff_wall="2.50" conv_thermal_transfer_coeff_ceiling="2.00" conv_thermal_transfer_coeff_floor="3.00" thermal_cond_acc_layer="20.00" bypass_cooling_coil="0.25" int_res_window_pane="0.13" air_velocity="0.15" distance_from_window="0.60" turbulence_intensity="25.00" el_energy_cost="1.50" export_energy_cost="1.00" el_co2_emission="130.00" min_cold_water_temp="6.00" max_cold_water_temp="13.00" transmissivity_jan="0.88" transmissivity_jul="0.71" co2_consentration="400.00" el_price="constant" primary_energy_factor_el="1.00" primary_energy_factor_bio_gas="0.45" primary_energy_factor_bio_solid="0.45" primary_energy_factor_district_heating="0.45" primary_energy_factor_district_cooling="0.45" primary_energy_factor_other="1.00" power_tariff="no" primary_energy_factor_fossil_oil="1.00" primary_energy_factor_fossil_gas="1.00" primary_energy_factor_fossil_solid="1.00" primary_energy_factor_bio_oil="0.45" weight_factor_el="1.00" weight_factor_fossil_oil="1.00" weight_factor_fossil_gas="1.00" weight_factor_fossil_solid="1.00" weight_factor_bio_oil="0.45" weight_factor_bio_gas="0.45" weight_factor_bio_solid="0.45" weight_factor_district_heating="0.45" weight_factor_district_cooling="0.45" weight_factor_other="1.00" weight_factor_el_export="0.00" el_export_co2_emission="65.00" primary_energy_factor_el_export="0.00">
    <power_steps hours="3">
      <power_step power="2.0" cost="125.0"></power_step>
      <power_step power="5.0" cost="206.0"></power_step>
      <power_step power="10.0" cost="350.0"></power_step>
      <power_step power="15.0" cost="494.0"></power_step>
      <power_step power="20.0" cost="638.0"></power_step>
    </power_steps>
  </global_vars>
${zonesXml}${tiltakXml}${emXml}${profitXml}
</simien_project>`;
  return sxi;
}

// ── SXI Dialog ────────────────────────────────────────────────
const ANSVARLEG_KEY='sxiAnsvarleg';
(function(){
  // Create dialog HTML
  const dlg=document.createElement('div');
  dlg.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.5);z-index:400;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  dlg.id='sxiDlg';
  dlg.innerHTML=`
  <div style="background:var(--surface);border-radius:16px;padding:28px;width:480px;max-width:96vw;box-shadow:0 12px 48px rgba(13,27,42,.2);border:1px solid var(--border)">
    <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px;display:flex;align-items:center;gap:9px">
      <span style="width:28px;height:28px;background:linear-gradient(140deg,#23917f,#0e5a50);border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;flex-shrink:0">⬇</span>
      Eksporter til SIMIEN SXI
    </div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:20px;line-height:1.7">Fyll inn prosjektinfo — tekniske anlegg vert satt til standardverdiar.</div>
    <div style="display:flex;flex-direction:column;gap:11px">
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Prosjektnamn</label>
        <input id="sxi_namn" type="text" placeholder="Storgata 10" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border2)'">
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Adresse</label>
        <input id="sxi_adresse" type="text" placeholder="Storgata 10, 5000 Bergen" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border2)'">
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Ansvarleg person</label>
        <input id="sxi_ansvarleg" type="text" placeholder="Fornamn Etternamn" autocomplete="name" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border2)'">
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Byggeår</label>
        <input id="sxi_byggeaar" type="number" placeholder="1985" min="1800" max="2025" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border2)'">
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Klimasted</label>
        <select id="sxi_klima" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;background:var(--surface);cursor:pointer">
          <option>Bergen</option><option>Oslo</option><option>Stavanger</option><option>Sandnes</option>
          <option>Trondheim</option><option>Kristiansand</option><option>Tromsø</option><option>Bodø</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;color:var(--text3);width:120px;font-weight:500;flex-shrink:0">Kommunenr.</label>
        <input id="sxi_kommunenr" type="text" placeholder="4601" maxlength="6" style="flex:1;padding:8px 11px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border2)'">
      </div>
    </div>
    <div style="margin-top:17px;border-top:1px solid var(--border);padding-top:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:12px;color:var(--text3);font-weight:600">Tiltak (valfritt)</span>
        <button type="button" id="sxi_tiltak_alle" style="padding:3px 9px;border:1px solid var(--border2);border-radius:6px;background:var(--surface);color:var(--text2);cursor:pointer;font-family:inherit;font-size:11px;font-weight:500">Vel alle</button>
      </div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.6">Kvart valt tiltak vert lagt inn i SIMIEN med alle elementa det r&aring;kar, og u-verdien sett til TEK17-kravet.</div>
      <div id="sxi_tiltak" style="display:grid;grid-template-columns:1fr 1fr;gap:7px 14px"></div>
    </div>
    <div id="sxi_err" style="display:none;background:var(--dm-red-bg,#fef0ef);border:1px solid var(--dm-red-bd,#f2b8b5);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--dm-red-tx,#c0302a);margin-top:14px"></div>
    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:20px">
      <button id="sxi_cancel" style="padding:9px 18px;border:1px solid var(--border2);border-radius:8px;background:var(--surface);color:var(--text2);cursor:pointer;font-family:inherit;font-size:13px;font-weight:500">Avbryt</button>
      <button id="sxi_ok" style="padding:9px 22px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;box-shadow:0 1px 4px rgba(26,122,110,.3)">Last ned SXI ⬇</button>
    </div>
  </div>`;
  document.body.appendChild(dlg);

  // Tiltaka kjem frå SXI_TILTAK, så lista i dialogen og lista i eksporten
  // aldri kan komme i utakt. Alle er av som standard — eit tiltak endrar
  // energimerket, så det skal vere eit val brukaren tek.
  (function(){
    const box=document.getElementById('sxi_tiltak');
    SXI_TILTAK.forEach(t=>{
      const l=document.createElement('label');
      l.style.cssText='display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2);cursor:pointer;user-select:none';
      const cb=document.createElement('input');
      cb.type='checkbox';cb.dataset.tiltak=t.key;
      cb.style.cssText='cursor:pointer;accent-color:var(--accent);margin:0;flex-shrink:0';
      const sp=document.createElement('span');
      sp.textContent=t.navn;
      sp.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      sp.title=t.navn+' — '+t.hint;
      const hi=document.createElement('span');
      hi.textContent=t.hint;
      hi.style.cssText="font-family:inherit;font-size:11px;color:var(--text3);flex-shrink:0;margin-left:auto";
      l.appendChild(cb);l.appendChild(sp);l.appendChild(hi);
      box.appendChild(l);
    });
    // Merkelappen på knappen må følgje avkryssingane, ikkje berre eigne klikk —
    // elles står det «Vel alle» medan alle er valde, og klikket fjernar dei.
    const alleBtn=document.getElementById('sxi_tiltak_alle');
    const syncAlle=()=>{
      const cbs=[...box.querySelectorAll('input[data-tiltak]')];
      alleBtn.textContent=cbs.every(c=>c.checked)?'Fjern alle':'Vel alle';
    };
    box.addEventListener('change',syncAlle);
    alleBtn.onclick=()=>{
      const cbs=[...box.querySelectorAll('input[data-tiltak]')];
      const paa=cbs.every(c=>c.checked);
      cbs.forEach(c=>{c.checked=!paa;});
      syncAlle();
    };
  })();

  // Auto-fill kommunenr when klimasted changes
  document.getElementById('sxi_klima').addEventListener('change',function(){
    const nr=KOMMUNE_NR[this.value]||'';
    document.getElementById('sxi_kommunenr').value=nr;
  });

  document.getElementById('sxiBtn').onclick=()=>{
    const allZones=floors.flatMap(f=>f.zones);
    if(!allZones.length){
      alert('Ingen soner teikna enno.');return;
    }
    // Pre-fill byggeår from first zone that has it
    const firstBy=allZones.find(z=>z.byggeaar);
    if(firstBy)document.getElementById('sxi_byggeaar').value=firstBy.byggeaar;
    else if(piBygg.byggeaar)document.getElementById('sxi_byggeaar').value=piBygg.byggeaar;
    // Pre-fill kommunenr from current klimasted selection
    const kl=document.getElementById('sxi_klima').value;
    document.getElementById('sxi_kommunenr').value=KOMMUNE_NR[kl]||'';
    _syncAdresseFelt();   // fyll inn adressa frå kartsøket om ho finst
    // Ansvarleg person: i EntroPi den som er logga inn; elles det brukaren
    // skreiv sist i denne nettlesaren (per-brukar-bekvemmelegheit, ikkje prosjektdata).
    const ansInp=document.getElementById('sxi_ansvarleg');
    if(inPi()&&piBrukar.namn)ansInp.value=piBrukar.namn;
    else if(!ansInp.value){try{ansInp.value=localStorage.getItem(ANSVARLEG_KEY)||'';}catch(e){}}
    document.getElementById('sxi_err').style.display='none';
    dlg.style.display='flex';
    setTimeout(()=>document.getElementById('sxi_namn').focus(),50);
  };
  document.getElementById('sxi_cancel').onclick=()=>{dlg.style.display='none';};
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.style.display='none';});

  document.getElementById('sxi_ok').onclick=()=>{
    const errEl=document.getElementById('sxi_err');
    const namn=document.getElementById('sxi_namn').value.trim();
    const adresse=document.getElementById('sxi_adresse').value.trim();
    if(adresse&&adresse!==prosjektAdresse){prosjektAdresse=adresse;markDirty();}
    const byggeaar=document.getElementById('sxi_byggeaar').value.trim();
    const klimasted=document.getElementById('sxi_klima').value;
    const kommunenr=document.getElementById('sxi_kommunenr').value.trim();
    const ansvarleg=document.getElementById('sxi_ansvarleg').value.trim();
    const errs=[];
    if(!namn)errs.push('Prosjektnamn manglar.');
    if(!byggeaar||isNaN(parseInt(byggeaar)))errs.push('Byggeår manglar eller er ugyldig.');
    if(!kommunenr)errs.push('Kommunenr. manglar.');
    if(!ansvarleg)errs.push('Ansvarleg person manglar.');
    // Eksport utan kalibrering gir feil dimensjonar i SIMIEN — stopp her
    const uncalFloors=floors.filter(f=>f.zones.length>0&&!(f.ownCal?f.mmPerImgPx:(globalMmPerImgPx||f.mmPerImgPx)));
    if(uncalFloors.length)errs.push('Skalaen er ikkje kalibrert ('+uncalFloors.map(f=>f.name).join(', ')+') — kalibrer før eksport.');
    if(errs.length){errEl.textContent=errs.join(' ');errEl.style.display='block';return;}
    errEl.style.display='none';
    try{localStorage.setItem(ANSVARLEG_KEY,ansvarleg);}catch(e){}
    const tiltak=[...document.querySelectorAll('#sxi_tiltak input[data-tiltak]:checked')]
      .map(i=>i.dataset.tiltak);
    const tiltakInfo={tomme:[]};
    let sxi;
    try{
      sxi=buildSXI({prosjektnamn:namn,adresse,klimasted,byggeaar:parseInt(byggeaar),kommunenr,
        ansvarleg,tiltak,tiltakInfo});
    }catch(e){
      errEl.textContent='Feil ved generering: '+e.message;errEl.style.display='block';return;
    }
    // Vindauge og dører som er større enn fasaden dei står i: ingen fil.
    const forStore=sxiForStoreOpningar(sxi);
    if(forStore.length){
      errEl.style.whiteSpace='pre-line';
      errEl.textContent='Kan ikkje eksportere: vindauge og dører er større enn fasaden dei står i.\n'
        +forStore.map(f=>'• '+f.sone+' – '+f.fasade+': '+f.opn.toFixed(2)+' m² opningar på '
          +f.area.toFixed(2)+' m² fasade').join('\n')
        +'\nRett breidd, høgd eller antal på vindauga og dørene på desse fasadane.';
      errEl.style.display='block';
      return;
    }
    errEl.style.whiteSpace='';
    // Overlappande soner: arealet vert rekna to gonger. Ikkje stopp — det kan
    // vere med vilje (t.d. mesanin) — men aldri utan at brukaren veit det.
    const _ovl=sonerOverlapp();
    if(_ovl.length&&!confirm('Desse sonene ligg oppå kvarandre, så arealet vert rekna to gonger i energimerket:\n\n'
      +_ovl.slice(0,8).map(o=>'• «'+o.a.name+'» og «'+o.b.name+'»: '+o.areal.toFixed(1)+' m²').join('\n')
      +(_ovl.length>8?'\n… og '+(_ovl.length-8)+' til':'')+'\n\nLast ned SXI-fila likevel?'))return;
    // Eit valt tiltak som ikkje fann eitt einaste element vert ikkje lagt inn.
    // Sil aldri i stillheit — då ville brukaren tru tiltaket var med i fila.
    if(tiltakInfo.tomme.length){
      const liste=tiltakInfo.tomme.map(t=>'• '+t.navn+' — '+t.merk).join('\n');
      if(!confirm('Desse tiltaka fann ingen element og vert ikkje lagde inn:\n\n'
        +liste+'\n\nLast ned SXI-fila likevel?'))return;
    }
    // Download
    const blob=new Blob([sxi],{type:'application/xml'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=(namn.replace(/\s+/g,'_'))+'.sxi';
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
    // I EntroPi kan SXI-fila også leggjast på bygget, om vertssida ber om det
    if(window.EntroHost)window.EntroHost.sendSxi(sxi,(namn.replace(/\s+/g,'_'))+'.sxi',{prosjektnamn:namn,adresse:adresse});
    dlg.style.display='none';
    // 🎉 Konfetti!
    launchConfetti();
    if(window.Klips)window.Klips.feir();
  };
})();

// ── Opningar som er større enn fasaden ──────────────────────────
// SIMIEN trekkjer vindauge og dører frå fasadearealet. Er opningane større
// enn fasaden, vert nettoarealet negativt og energimerket meiningslaust —
// difor stoppar eksporten. Vi les den ferdige fila (som buildTiltakXml), så
// alle vegane inn i <facade> vert dekte: samanslegne YV-grupper, gavlflater,
// kopla soner. Det er tala SIMIEN faktisk får, ikkje ei eiga omrekning.
function sxiForStoreOpningar(xml){
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  const ut=[];
  doc.querySelectorAll('zone > facade').forEach(fac=>{
    let opn=0;
    for(const c of fac.children){
      if(c.tagName==='window')
        opn+=(parseFloat(c.getAttribute('number'))||1)
            *(parseFloat(c.getAttribute('height'))||0)*(parseFloat(c.getAttribute('width'))||0);
      else if(c.tagName==='door')opn+=parseFloat(c.getAttribute('area'))||0;
    }
    const area=parseFloat(fac.getAttribute('area'))||0;
    if(opn>0&&opn>area+0.005)
      ut.push({sone:fac.parentElement.getAttribute('name'),fasade:fac.getAttribute('name'),area,opn});
  });
  return ut;
}

// ── Konfetti ved SXI-eksport ────────────────────────────────────
function launchConfetti(){
  const colors=['#1d4f4f','#10b69f','#2563eb','#f59e0b','#ec4899','#8b5cf6','#10b981'];
  const count=90;
  const particles=[];
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  for(let i=0;i<count;i++){
    particles.push({
      x:Math.random()*canvas.width,y:Math.random()*-canvas.height*.5-20,
      w:6+Math.random()*8,h:3+Math.random()*4,
      r:Math.random()*Math.PI*2,
      vx:(Math.random()-0.5)*4,vy:2+Math.random()*4,
      vr:(Math.random()-0.5)*.15,
      color:colors[Math.floor(Math.random()*colors.length)],
      opacity:1,
    });
  }
  let t=0;
  function step(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    t++;
    let alive=false;
    particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.r+=p.vr;
      if(t>80)p.opacity=Math.max(0,p.opacity-0.018);
      if(p.y<canvas.height+20&&p.opacity>0){alive=true;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);
      ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    if(alive&&t<200)requestAnimationFrame(step);
    else canvas.remove();
  }
  requestAnimationFrame(step);
}
(function(){
  const handle=document.getElementById('sidebar-resize');
  const sidebar=document.getElementById('sidebar');
  let draggingResize=false,startX=0,startW=0;
  handle.addEventListener('mousedown',e=>{
    draggingResize=true;startX=e.clientX;startW=sidebar.offsetWidth;
    handle.classList.add('dragging');e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!draggingResize)return;
    const dx=startX-e.clientX; // dragging left handle: drag left = wider
    const newW=Math.max(200,startW+dx);
    sidebar.style.width=newW+'px';
    resize();
  });
  document.addEventListener('mouseup',()=>{
    if(draggingResize){draggingResize=false;handle.classList.remove('dragging');}
  });
})();

