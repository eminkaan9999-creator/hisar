(() => {
  const menu = document.getElementById('menu');
  const home = document.getElementById('arena-home');
  const header = document.getElementById('arena-subhead');
  const heading = document.getElementById('arena-heading');
  const buttons = Array.from(home.querySelectorAll('[data-arena-open]'));
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
  let lastButton;

  function showHome(restoreFocus) {
    home.hidden = false;
    header.hidden = true;
    panels.forEach(panel => { panel.hidden = true; });
    menu.scrollTop = 0;
    if (restoreFocus && lastButton) lastButton.focus({preventScroll: true});
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      lastButton = button;
      home.hidden = true;
      header.hidden = false;
      heading.textContent = button.querySelector('strong').textContent;
      panels.forEach((panel, position) => { panel.hidden = position !== index; });
      menu.scrollTop = 0;
      heading.focus({preventScroll: true});
    });
  });
  document.getElementById('arena-back').addEventListener('click', () => showHome(true));
  document.getElementById('btnMenu').addEventListener('click', () => showHome(false));
  document.getElementById('modeChip').addEventListener('click', () => buttons[0].click());
  document.getElementById('arena-content-play').addEventListener('click', () => document.getElementById('menuClose').click());
  menu.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key !== 'Escape' || !header.hidden) event.stopPropagation();
    if (event.key === 'Escape' && !header.hidden) {
      event.preventDefault();
      showHome(true);
    }
  });

  const key = 'poligon-appearance-v1';
  let preferences;
  try { preferences = JSON.parse(localStorage.getItem(key)); } catch {}
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) preferences = {};
  for (const input of document.querySelectorAll('#arena-appearance input')) {
    const name = input.name;
    function apply() {
      document.documentElement.dataset[name] = input.value;
    }
    if (preferences[name] === input.value) input.checked = true;
    if (input.checked) apply();
    input.addEventListener('change', () => {
      if (!input.checked) return;
      apply();
      preferences[name] = input.value;
      try { localStorage.setItem(key, JSON.stringify(preferences)); } catch {}
    });
  }
})();
