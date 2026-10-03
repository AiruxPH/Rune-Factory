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
  const upgradeList = document.querySelector('#upgrades');
  const selectCurrency = tab => {
    document.querySelectorAll('[data-currency]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    [...upgradeList.children].forEach(row => { row.hidden = row.dataset.group !== tab.dataset.currency; });
    upgradeList.scrollLeft = 0;
  };
  document.querySelectorAll('[data-currency]').forEach(tab => { tab.onclick = () => selectCurrency(tab); });
  selectCurrency(document.querySelector('[data-currency]'));
  document.querySelectorAll('.card-scroller').forEach(list => {
    // Mouse wheels browse the horizontal card row; trackpads and touch use native scrolling.
    list.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.ctrlKey) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? list.clientWidth : 1;
      const delta = event.deltaY * unit;
      const canMove = delta > 0 ? list.scrollLeft < list.scrollWidth - list.clientWidth - 1 : list.scrollLeft > 0;
      if (canMove) { event.preventDefault(); list.scrollLeft += delta; }
    }, { passive: false });
    list.addEventListener('keydown', event => {
      if (event.target !== list || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      list.scrollBy({ left: event.key === 'ArrowRight' ? 240 : -240, behavior: 'smooth' });
    });
  });
}
