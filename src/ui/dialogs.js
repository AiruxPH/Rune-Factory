export function setupDialogs(world) {
  document.querySelectorAll('[data-panel]').forEach(button => {
    button.onclick = () => {
      world.keys.clear();
      document.querySelector('#' + button.dataset.panel).showModal();
    };
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { world.keys.clear(); document.querySelector('#world').focus(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }});
  });
  document.querySelectorAll('[data-pages]').forEach(pager => {
    const rows = [...document.querySelector('#' + pager.dataset.pages).children];
    let page = 0, group = 'coins';
    const size = 3;
    const render = () => {
      const visible = rows.filter(row => !row.dataset.group || row.dataset.group === group);
      const total = Math.max(1, Math.ceil(visible.length / size));
      page = Math.max(0, Math.min(total - 1, page));
      rows.forEach(row => { row.hidden = true; });
      visible.slice(page * size, (page + 1) * size).forEach(row => { row.hidden = false; });
      pager.querySelector('span').textContent = (page + 1) + ' / ' + total;
      pager.querySelector('[data-prev]').disabled = page === 0;
      pager.querySelector('[data-next]').disabled = page === total - 1;
    };
    pager.querySelector('[data-prev]').onclick = () => { page--; render(); };
    pager.querySelector('[data-next]').onclick = () => { page++; render(); };
    if (pager.dataset.pages === 'upgrades') document.querySelectorAll('[data-currency]').forEach(tab => {
      tab.onclick = () => {
        group = tab.dataset.currency; page = 0;
        document.querySelectorAll('[data-currency]').forEach(t => t.setAttribute('aria-selected', String(t===tab)));
        render();
      };
    });
    render();
  });
}
