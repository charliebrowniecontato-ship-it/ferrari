const developments = {
  'ATLAS SACOMA BY EMCCAMP': 'atlas',
  'CONDOMINIO ICONICO JARAGUA': 'iconico',
  'CONDOMINIO LINE PARADA INGLESA': 'line-parada',
  'CONDOMINIO NOSTRO MOOCA': 'nostro',
  'CONDOMINIO VISION PENHA': 'vision',
  'LINE PRACA DA ARVORE BY EMCCAMP': 'line-praca',
  'MOB BARRA FUNDA BY EMCCAMP': 'mob-barra',
  'MOB CAMPO LIMPO BY EMCCAMP': 'mob-campo',
  'ORIGEM ITAQUERA': 'origem',
  'RESIDENCIAL ALTUS VILA PRUDENTE': 'altus',
  'SERENA RESIDENCE': 'serena',
  'SINFONIA SANTO AMARO': 'sinfonia',
  'VIEW PARQUE ECOLOGICO BY EMCCAMP': 'view',
  'VILLAGIO DOS EUCALIPTOS': 'villagio'
};

const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
const parkingLabels = {
  none: 'Sem vaga', car: 'Vaga para carro', motorcycle: 'Vaga para moto', car_motorcycle: 'Vaga para carro e moto'
};
const positive = value => Number.isFinite(value) && value > 0 ? value : null;

function residentialGroup(group, profile) {
  const type = normalize(group.typology);
  const category = normalize(group.category);
  if (/^(LOJA|FA$)/.test(type) || ['NR', 'FA', 'FACHADA ATIVA'].includes(category) ||
      !Number.isSafeInteger(group.free) || group.free <= 0) return null;

  const bedrooms = /^(\d+)[QD]/.exec(type);
  const roomLabel = bedrooms
    ? `${bedrooms[1]} dormitório${bedrooms[1] === '1' ? '' : 's'}`
    : '';
  const customLabel = profile?.typologyLabels?.[group.typology];
  const label = typeof customLabel === 'string' && roomLabel
    ? customLabel.replace(/^\d+[QD]\b/i, roomLabel)
    : /^SOBRADO/.test(type)
      ? 'Sobrado'
      : roomLabel ? roomLabel + (type.endsWith('S') ? ' + suíte' : '') : type || 'Unidade residencial';

  return {
    label,
    bedrooms: bedrooms ? Number(bedrooms[1]) : null,
    areaMin: positive(group.areaMin),
    areaMax: positive(group.areaMax),
    parking: parkingLabels[group.parking] ?? '',
    category: /^R2V/.test(category) ? 'R2V' : category,
    price: positive(group.minPrice),
    units: group.free
  };
}

export function readInventory(data) {
  if (data?.uf !== 'SP' || !Array.isArray(data.developments)) throw new Error('Invalid inventory response');

  const inventory = {};
  for (const item of data.developments) {
    const id = developments[normalize(item.development)];
    if (!id || !Array.isArray(item.groups)) continue;
    const options = item.groups.map(group => residentialGroup(group, item.profile)).filter(Boolean);
    if (!options.length) continue;
    options.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    const delivery = String(item.profile?.delivery ?? '');
    inventory[id] = {
      options,
      units: options.reduce((total, option) => total + option.units, 0),
      price: options[0].price,
      delivery: /^(0[1-9]|1[0-2])\/20\d{2}$|^Entregue$/i.test(delivery) ? delivery : null
    };
  }
  return inventory;
}
