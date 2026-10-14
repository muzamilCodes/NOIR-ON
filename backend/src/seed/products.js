// Canonical NOIRÉON catalogue used to seed an empty database.
// _id is left to MongoDB (ObjectId); the frontend consumes ids dynamically.
module.exports = [
  {
    name: 'NOIRÉON Block RG',
    price: 185000,
    category: 'Skeleton',
    tagline: 'Rose-gold octagonal case · flying tourbillon',
    description:
      'The signature NOIRÉON. An octagonal 18k rose-gold case frames a fully skeletonised movement beneath edge-to-edge sapphire, with a flying tourbillon at six and a power-reserve indicator at twelve.',
    caseColor: 0xc9a06a,
    strapColor: 0x0e0e10,
    specs: { movement: 'Manual Cal. NR-T01 Tourbillon', case: '42mm 18k Rose Gold', water: '30m', power: '90h reserve' },
  },
  {
    name: 'NOIRÉON Saphir Noir',
    price: 147500,
    category: 'Skeleton',
    tagline: 'Black DLC case · smoked sapphire',
    description:
      'A stealth interpretation in black DLC with a smoked sapphire crystal. The skeleton movement floats in shadow, lit only by polished ruby jewels and rhodium gears.',
    caseColor: 0x2a2a2e,
    strapColor: 0x0a0a0c,
    specs: { movement: 'Manual Cal. NR-T02 Tourbillon', case: '42mm Titanium DLC', water: '30m', power: '90h reserve' },
  },
  {
    name: 'NOIRÉON Réserve Royale',
    price: 124000,
    category: 'Skeleton',
    tagline: 'White-gold case · extended power reserve',
    description:
      'White gold lends a cool clarity to the Réserve Royale, whose enlarged power-reserve indicator tracks a full ninety hours of autonomous run-time.',
    caseColor: 0xd8d8dc,
    strapColor: 0x101014,
    specs: { movement: 'Manual Cal. NR-T03', case: '42mm 18k White Gold', water: '30m', power: '90h reserve' },
  },
  {
    name: 'NOIRÉON Calibre Lumière',
    price: 98000,
    category: 'Skeleton',
    tagline: 'Steel case · luminous skeleton hands',
    description:
      'Brushed steel and super-luminova skeleton hands make the Calibre Lumière the most wearable entry to the NOIRÉON skeleton family.',
    caseColor: 0xc0c6cc,
    strapColor: 0x121216,
    specs: { movement: 'Manual Cal. NR-T04', case: '42mm Brushed Steel', water: '50m', power: '72h reserve' },
  },
  {
    name: 'NOIRÉON Tourbillon Bleu',
    price: 210000,
    category: 'Haute',
    tagline: 'Blue titanium · sapphire tourbillon bridge',
    description:
      'Anodised blue titanium surrounds a sapphire tourbillon bridge, suspending the rotating cage as if in mid-air. Limited to 25 pieces a year.',
    caseColor: 0x3a5a8a,
    strapColor: 0x0c1020,
    specs: { movement: 'Manual Cal. NR-T05 Tourbillon', case: '42mm Blue Titanium', water: '30m', power: '100h reserve' },
  },
  {
    name: 'NOIRÉON Bronze Patine',
    price: 86000,
    category: 'Skeleton',
    tagline: 'Living bronze · evolves with wear',
    description:
      'CuSn8 bronze warms and patinas with the wearer, making every Bronze Patine a one-of-one collaboration between owner and metal.',
    caseColor: 0xb87333,
    strapColor: 0x2a1c10,
    specs: { movement: 'Manual Cal. NR-T04', case: '42mm Bronze', water: '50m', power: '72h reserve' },
  },
  {
    name: 'NOIRÉON Nuit Noire',
    price: 162000,
    category: 'Haute',
    tagline: 'Black ceramic · rose-gold bridges',
    description:
      'Matte black ceramic meets rose-gold skeleton bridges in the Nuit Noire — a study in contrast reserved for the evening wrist.',
    caseColor: 0x1c1c20,
    strapColor: 0x0a0a0c,
    specs: { movement: 'Manual Cal. NR-T06 Tourbillon', case: '42mm Black Ceramic', water: '30m', power: '90h reserve' },
  },
  {
    name: 'NOIRÉON Héritage Or',
    price: 245000,
    category: 'Haute',
    tagline: 'Yellow gold · hand-engraved movement',
    description:
      'The pinnacle. A yellow-gold case over a fully hand-engraved skeleton movement, assembled by a single master watchmaker over four months.',
    caseColor: 0xd4af37,
    strapColor: 0x1a1208,
    specs: { movement: 'Manual Cal. NR-T07 Tourbillon', case: '42mm 18k Yellow Gold', water: '30m', power: '100h reserve' },
  },
];
