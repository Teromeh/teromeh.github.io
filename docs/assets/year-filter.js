// Year dropdowns for dashboard pages. Called from htmlwidgets::onRender in the .qmd files.
// Styling lives in projects/custom.scss (select.year-select, .year-select-wrap).
(function () {
  var counter = 0;

  // A <select> with one <option> per year; calls onChange(year) when the user picks one.
  function makeSelect(years, onChange) {
    var select = document.createElement('select');
    select.className = 'year-select';
    years.forEach(function (yr) {
      var option = document.createElement('option');
      option.textContent = yr;
      select.appendChild(option);
    });
    select.addEventListener('change', function () { onChange(select.value); });
    return select;
  }

  // Donut charts: dropdown floats in the top-right corner of the plot.
  //   dataByYear: { "<year>": { labels, values, text, hovertext, colors, border_colors, text_colors, center_text } }
  //   years: keys of dataByYear; the first one is the initial selection.
  window.attachYearFilter = function (el, dataByYear, years) {
    if (el.querySelector('.year-select')) return;
    el.style.position = 'relative';

    var select = makeSelect(years, function (yr) {
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
    select.className += ' year-select-float';
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
    if (!header || header.querySelector('.year-select')) return;

    var select = makeSelect(years, function (yr) {
      table.clear();
      table.rows.add(rowsByYear[yr]);
      table.draw();
    });
    select.id = 'year-select-' + (++counter);

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
