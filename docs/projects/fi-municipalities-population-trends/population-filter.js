// Municipality filter for the population page (fi-municipalities-population-trends).
// Hand-edited file: index.qmd does not overwrite it.
// It works on data that index.qmd generates at render time into population-data.js:
// window.popYears, popData, popChangeData, popGroups and popWikiUrls.

function popFindGraphDiv(preferredId, positionIndex) {
  var el = document.getElementById(preferredId);
  if (el && el.data) return el;

  var all = Array.prototype.slice.call(document.querySelectorAll('.js-plotly-plot'));
  var byId = all.find(function (e) { return e.id && e.id.indexOf(preferredId) !== -1; });
  if (byId) return byId;

  if (all.length > positionIndex) return all[positionIndex];
  return null;
}

// Per-municipality line chart data. All municipalities share one year axis
// (window.popYears), and the tooltip text is built here from year + population
// instead of being shipped for every municipality in the data file.
function popLineData(idx) {
  var g = window.popData[idx];
  if (!g) return null;
  var years = window.popYears;
  return {
    x: years.slice(),
    y: g.y,
    hovertext: g.y.map(function (count, i) {
      return '<b>' + years[i] + '</b><br>Population: <b>' + popFormatThousands(count) + '</b>';
    }),
    yrange: g.yrange,
    title: g.title,
    whole_number: g.whole_number
  };
}

function popUpdateLine(el, g) {
  if (!g || !el) return;
  Plotly.update(el, {
    x: [g.x],
    y: [g.y],
    hovertext: [g.hovertext]
  }, {
    'yaxis.range': g.yrange,
    'yaxis.tickformat': g.whole_number ? ',d' : '',
    'yaxis.exponentformat': g.whole_number ? 'none' : 'B'
  }, [0]);
  Plotly.relayout(el, { 'title.text': g.title });
}

function popFormatThousands(n) {
  var s = Math.round(Math.abs(n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function popUpdateChange(idx) {
  var c = window.popChangeData[idx];
  var latestEl = document.getElementById('population-latest');
  var absEl = document.getElementById('population-change-abs');
  var pctEl = document.getElementById('population-change-pct');
  if (!c) return;

  if (latestEl) latestEl.textContent = popFormatThousands(c.latest);

  if (!absEl || !pctEl) return;

  var positive = c.diff >= 0;
  var absStr = (positive ? '+ ' : '- ') + popFormatThousands(c.diff);
  var pctStr = (positive ? '+ ' : '- ') + Math.abs(c.pct).toFixed(1) + '%';

  absEl.textContent = absStr;
  pctEl.textContent = pctStr;
  absEl.classList.toggle('fi-stat-positive', positive);
  absEl.classList.toggle('fi-stat-negative', !positive);
  pctEl.classList.toggle('fi-stat-positive', positive);
  pctEl.classList.toggle('fi-stat-negative', !positive);
}

function popUpdateWiki(idx) {
  var wrap = document.getElementById('population-wiki');
  var link = document.getElementById('population-wiki-link');
  if (!wrap || !link) return;

  var url = window.popWikiUrls[idx];
  if (!url) {
    wrap.style.display = 'none';
    return;
  }

  var textEl = link.querySelector('.fi-wiki-link-text');
  if (textEl) textEl.textContent = window.popGroups[idx];
  link.href = url;
  wrap.style.display = 'block';
}

function popUpdateMap(idx) {
  var svg = document.getElementById('fi-map');
  if (!svg) return;

  var current = svg.querySelector('.fi-map-muni.active');
  if (current) current.classList.remove('active');

  var name = window.popGroups[idx];
  if (!name || name === 'All') return;

  var paths = svg.querySelectorAll('.fi-map-muni');
  var target = Array.prototype.find.call(paths, function (p) {
    return p.getAttribute('data-name') === name;
  });
  if (target) target.classList.add('active');
}

window.popUpdateMunicipality = function (idx) {
  try {
    var g = popLineData(idx);
    var el = popFindGraphDiv('population-line', 0);
    popUpdateLine(el, g);
    popUpdateChange(idx);
    popUpdateWiki(idx);
    popUpdateMap(idx);
  } catch (err) {
    console.error('Population filter update failed:', err);
  }
};

function popInitFilter() {
  var control = document.getElementById('municipality-filter');
  if (!control || control.getAttribute('data-fi-init') === '1') return;
  control.setAttribute('data-fi-init', '1');

  var valueSpan = control.querySelector('.fi-muni-filter-value');
  var menu = control.querySelector('.fi-muni-filter-menu');
  var items = menu ? menu.querySelectorAll('.fi-muni-option') : [];
  var searchInput = control.querySelector('.fi-muni-filter-search');
  var noResults = menu ? menu.querySelector('.fi-muni-no-results') : null;

  function filterItems(query) {
    var q = query.trim().toLowerCase();
    var anyVisible = false;
    Array.prototype.forEach.call(items, function (li) {
      var text = li.textContent.toLowerCase();
      var match = q === '' || text.split(/[\s-]+/).some(function (word) {
        return word.indexOf(q) === 0;
      });
      li.classList.toggle('is-hidden', !match);
      if (match) anyVisible = true;
    });
    if (noResults) noResults.classList.toggle('show', !anyVisible);
  }

  function resetSearch() {
    if (searchInput) searchInput.value = '';
    filterItems('');
  }

  function closeMenu() {
    control.classList.remove('open');
    control.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
  }
  function openMenu() {
    control.classList.add('open');
    control.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick);
    resetSearch();
    if (searchInput) {
      setTimeout(function () { searchInput.focus(); }, 0);
    }
  }
  function onDocClick(e) {
    if (!control.contains(e.target)) closeMenu();
  }

  Array.prototype.forEach.call(items, function (li) {
    li.addEventListener('click', function (e) {
      e.stopPropagation();
      var idx = parseInt(li.getAttribute('data-index'), 10);
      valueSpan.textContent = li.textContent;
      Array.prototype.forEach.call(items, function (o) { o.classList.remove('active'); });
      li.classList.add('active');
      window.popUpdateMunicipality(idx);
      closeMenu();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    searchInput.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') {
        closeMenu();
        control.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var firstVisible = menu.querySelector('.fi-muni-option:not(.is-hidden)');
        if (firstVisible) firstVisible.click();
      }
    });
    searchInput.addEventListener('input', function () {
      filterItems(searchInput.value);
    });
  }

  control.addEventListener('click', function (e) {
    e.stopPropagation();
    if (control.classList.contains('open')) closeMenu(); else openMenu();
  });
  control.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (control.classList.contains('open')) closeMenu(); else openMenu();
    } else if (e.key === 'Escape') {
      closeMenu();
    }
  });
}
popInitFilter();

