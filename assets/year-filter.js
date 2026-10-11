// Year dropdowns for dashboard pages. Called from htmlwidgets::onRender in the .qmd files.
// Styling lives in projects/custom.scss (.year-filter, .year-select-wrap).
(function () {
  var counter = 0;

  function closeDropdown(dropdown) {
    dropdown.classList.remove('open');
    dropdown.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', dropdown._yearOutsideClick);
  }

  function openDropdown(dropdown) {
    dropdown.classList.add('open');
    dropdown.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', dropdown._yearOutsideClick);
  }

  function setActiveOption(dropdown, option) {
    var options = dropdown.querySelectorAll('.year-filter-option');
    Array.prototype.forEach.call(options, function (o) { o.classList.remove('active'); });
    option.classList.add('active');
    dropdown.querySelector('.year-filter-value').textContent = option.textContent;
  }

  // A custom dropdown with one option per year. Native select popups are browser-owned,
  // so this keeps hover, focus, and selected states identical across browsers.
  function makeYearDropdown(years, onChange) {
    var dropdown = document.createElement('div');
    dropdown.className = 'year-filter';
    dropdown.setAttribute('tabindex', '0');
    dropdown.setAttribute('role', 'button');
    dropdown.setAttribute('aria-haspopup', 'listbox');
    dropdown.setAttribute('aria-expanded', 'false');

    var value = document.createElement('span');
    value.className = 'year-filter-value';
    value.textContent = years[0];

    var caret = document.createElement('span');
    caret.className = 'year-filter-caret';

    var menu = document.createElement('ul');
    menu.className = 'year-filter-menu';
    menu.setAttribute('role', 'listbox');

    years.forEach(function (yr, index) {
      var option = document.createElement('li');
      option.className = 'year-filter-option' + (index === 0 ? ' active' : '');
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '-1');
      option.textContent = yr;
      option.addEventListener('click', function (e) {
        e.stopPropagation();
        setActiveOption(dropdown, option);
        onChange(yr);
        closeDropdown(dropdown);
      });
      menu.appendChild(option);
    });

    dropdown._yearOutsideClick = function (e) {
      if (!dropdown.contains(e.target)) closeDropdown(dropdown);
    };

    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dropdown.classList.contains('open')) closeDropdown(dropdown); else openDropdown(dropdown);
    });

    dropdown.addEventListener('keydown', function (e) {
      var options = Array.prototype.slice.call(menu.querySelectorAll('.year-filter-option'));
      var activeIndex = Math.max(0, options.findIndex(function (o) { return o.classList.contains('active'); }));
      var nextIndex = activeIndex;

      if (e.key === 'Escape') {
        closeDropdown(dropdown);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (dropdown.classList.contains('open')) {
          options[activeIndex].click();
        } else {
          openDropdown(dropdown);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = Math.min(options.length - 1, activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = Math.max(0, activeIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = options.length - 1;
      } else {
        return;
      }

      if (!dropdown.classList.contains('open')) openDropdown(dropdown);
      setActiveOption(dropdown, options[nextIndex]);
      onChange(options[nextIndex].textContent);
      options[nextIndex].scrollIntoView({ block: 'nearest' });
    });

    dropdown.appendChild(value);
    dropdown.appendChild(caret);
    dropdown.appendChild(menu);
    return dropdown;
  }

  // Donut charts: dropdown floats in the top-right corner of the plot.
  //   dataByYear: { "<year>": { labels, values, text, hovertext, colors, border_colors, text_colors, center_text } }
  //   years: keys of dataByYear; the first one is the initial selection.
  window.attachYearFilter = function (el, dataByYear, years) {
    if (el.querySelector('.year-filter')) return;
    el.style.position = 'relative';

    var select = makeYearDropdown(years, function (yr) {
      var d = dataByYear[yr];
      Plotly.restyle(el, {
        labels: [d.labels],
        values: [d.values],
        text: [d.text],
        hovertext: [d.hovertext],
        'marker.colors': [d.colors],
        'textfont.color': [d.text_colors],
        'hoverlabel.bgcolor': [d.colors],
        'hoverlabel.bordercolor': [d.border_colors],
        'hoverlabel.font.color': [d.text_colors]
      }, [0]);
      Plotly.relayout(el, { 'annotations[0].text': d.center_text });
    });
    select.className += ' year-filter-float';
    select.setAttribute('aria-label', 'Filter by year');
    el.appendChild(select);
  };

  // DataTables: labelled dropdown in the card header; swaps the rows shown in the table.
  //   rowsByYear: { "<year>": [ [cell, cell, ...], ... ] }
  //   years: keys of rowsByYear; the first one is the initial selection.
  window.attachTableYearFilter = function (el, rowsByYear, years) {
    var table = window.jQuery(el).find('table').DataTable();
    var card = el.closest('.card');
    var header = card ? card.querySelector('.card-header') : null;
    if (!header || header.querySelector('.year-filter')) return;

    var select = makeYearDropdown(years, function (yr) {
      table.clear();
      table.rows.add(rowsByYear[yr]);
      table.draw();
    });
    select.id = 'year-filter-' + (++counter);

    var label = document.createElement('label');
    label.htmlFor = select.id;
    label.textContent = 'Year';

    var wrap = document.createElement('div');
    wrap.className = 'year-select-wrap';
    wrap.appendChild(label);
    wrap.appendChild(select);
    header.appendChild(wrap);
  };
})();
