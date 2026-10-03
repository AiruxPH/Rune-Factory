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
    let page = 0;
    const size = 3, total = Math.ceil(rows.length / size);
    const render = () => {
      rows.forEach((row, i) => { row.hidden = Math.floor(i / size) !== page; });
      pager.querySelector('span').textContent = (page + 1) + ' / ' + total;
      pager.querySelector('[data-prev]').disabled = page === 0;
      pager.querySelector('[data-next]').disabled = page === total - 1;
    };
    pager.querySelector('[data-prev]').onclick = () => { page--; render(); };
    pager.querySelector('[data-next]').onclick = () => { page++; render(); };
    render();
  });
}
