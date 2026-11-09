'use strict';

window.FerrariInventory = (() => {
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0
  });
  const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const escape = value => String(value).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  let request;

  function load() {
    request ??= fetch('/api/disponibilidade/', { signal: AbortSignal.timeout(10000) }).then(async response => {
      if (!response.ok) throw new Error('Estoque indisponível');
      const { inventory } = await response.json();
      if (!inventory || typeof inventory !== 'object') throw new Error('Estoque inválido');
      return inventory;
    });
    return request;
  }

  function area(options) {
    const measurements = options.flatMap(option => [option.areaMin, option.areaMax]).filter(Number.isFinite);
    if (!measurements.length) return '';
    const min = Math.min(...measurements), max = Math.max(...measurements);
    return min === max ? decimal.format(min) : `${decimal.format(min)} a ${decimal.format(max)}`;
  }

  const stock = units => `${units} ${units === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;
  const money = amount => currency.format(amount);
  const price = amount => amount ? `A partir de ${money(amount)}` : 'Preço sob consulta';

  function offerHTML(entry, expanded = false) {
    const discount = entry.blackNovember?.discount;
    if (!discount) return '';
    return `<div class="inventory-offer">
      <small>Black November EMCCAMP</small>
      <strong>${money(discount)} de desconto</strong>
      ${expanded ? '<p>Em unidades participantes. Consulte com a Ferrari a elegibilidade e o valor final.</p>' : ''}
    </div>`;
  }

  function optionsHTML(entry) {
    if (!entry) return '<p>Sem unidades disponíveis no momento. <a href="/#imoveis">Veja outras opções</a>.</p>';
    const rows = entry.options.map(option => {
      const measurement = area([option]);
      const details = [measurement && `${measurement} m²`, option.parking, option.category].filter(Boolean);
      return `<li class="inventory-option">
        <div><strong>${escape(option.label)}</strong><small>${details.map(escape).join(' · ')}</small></div>
        <div><strong>${price(option.price)}</strong><small>${stock(option.units)}</small></div>
      </li>`;
    }).join('');
    return `${offerHTML(entry, true)}<ul class="inventory-options">${rows}</ul>
      <p class="inventory-note">Fonte: espelho de vendas da EMCCAMP. Preços e disponibilidade sujeitos a confirmação.</p>`;
  }

  const unavailable = 'A disponibilidade está temporariamente indisponível. Consulte a equipe pelo WhatsApp.';
  return { load, area, stock, price, money, offerHTML, optionsHTML, unavailable };
})();
