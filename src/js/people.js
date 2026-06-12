(function () {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var peopleData = { people: [], relations: [] };
  var peopleById = {};
  var currentPersonId = '';
  var currentFilter = 'all';
  var relationTypeMap = {
    career: '事业关系',
    family: '亲属关系',
    teacher: '师友关系',
    friend: '师友关系',
    political: '政治关系',
    all: '全部关系'
  };

  function escapeHtml(value) {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return window.htmlUtils.escapeHtml(value);
    }

    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    } else if (typeof window.showToast === 'function') {
      window.showToast(message);
    }
  }

  function normalizeData(data) {
    var normalized = { people: [], relations: [] };

    if (data && Array.isArray(data.people)) {
      normalized.people = data.people;
    }

    if (data && Array.isArray(data.relations)) {
      normalized.relations = data.relations;
    }

    normalized.defaultCenter = data && data.defaultCenter ? data.defaultCenter : (normalized.people[0] && normalized.people[0].id);
    return normalized;
  }

  function rebuildPeopleMap() {
    peopleById = {};
    peopleData.people.forEach(function (person) {
      if (person && person.id) {
        peopleById[person.id] = person;
      }
    });
  }

  function setPeopleData(data) {
    peopleData = normalizeData(data);
    rebuildPeopleMap();
    currentPersonId = peopleData.defaultCenter || (peopleData.people[0] && peopleData.people[0].id) || '';
    currentFilter = 'all';
  }

  function getPersonById(id) {
    return peopleById[id] || null;
  }

  function isRelationTypeVisible(relation, type) {
    if (!relation) return false;
    if (!type || type === 'all') return true;
    if (type === 'teacher') return relation.type === 'teacher' || relation.type === 'friend' || relation.type === 'teacher-friend';
    return relation.type === type;
  }

  function getAdjacentRelations(personId, type) {
    return peopleData.relations.filter(function (relation) {
      return relation && (relation.source === personId || relation.target === personId) && isRelationTypeVisible(relation, type || currentFilter);
    });
  }

  function getOtherPersonId(relation, personId) {
    return relation.source === personId ? relation.target : relation.source;
  }

  function createSvgElement(name, attrs, text) {
    var el = document.createElementNS(SVG_NS, name);
    var key;
    for (key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
    if (typeof text !== 'undefined') {
      el.textContent = text;
    }
    return el;
  }

  function clearSvg(svg) {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
  }

  function renderEmptySvg(svg, message) {
    clearSvg(svg);
    svg.appendChild(createSvgElement('text', {
      x: '175', y: '200', 'text-anchor': 'middle', 'font-size': '14', fill: '#B5ADA5'
    }, message));
  }

  function renderCenter(svg, person) {
    var group = createSvgElement('g', { class: 'person-node center-node', 'data-person-id': person.id, style: 'cursor:pointer' });
    group.appendChild(createSvgElement('circle', { cx: '175', cy: '200', r: '18', fill: '#C9A96E' }));
    group.appendChild(createSvgElement('text', { x: '175', y: '204', 'text-anchor': 'middle', 'font-size': '11', fill: '#fff', 'font-weight': '700' }, person.name));
    group.onclick = function () { openPeoDet(person.id); };
    svg.appendChild(group);
  }

  function renderRelation(svg, relation, targetPerson, index, total) {
    var cx = 175;
    var cy = 200;
    var radius = 140;
    var angle = (2 * Math.PI * index / Math.max(total, 1)) - Math.PI / 2;
    var px = cx + radius * Math.cos(angle);
    var py = cy + radius * Math.sin(angle);
    var relationId = relation.source + '__' + relation.target + '__' + relation.type;
    var line = createSvgElement('line', {
      x1: String(cx), y1: String(cy), x2: String(px), y2: String(py),
      stroke: '#D4C9B8', 'stroke-width': '1.6', opacity: '0.75', class: 'relation-line',
      'data-relation-id': relationId, style: 'cursor:pointer'
    });
    var label = createSvgElement('text', {
      x: String((cx + px) / 2), y: String((cy + py) / 2 - 6), 'text-anchor': 'middle',
      'font-size': '8', fill: '#8A8279', 'pointer-events': 'none'
    }, relation.label || relationTypeMap[relation.type] || relation.type || '关系');
    var node = createSvgElement('g', { class: 'person-node', 'data-person-id': targetPerson.id, style: 'cursor:pointer' });

    line.onclick = function (event) {
      if (event && event.stopPropagation) event.stopPropagation();
      openRelationDetail(relation);
    };

    node.appendChild(createSvgElement('circle', { cx: String(px), cy: String(py), r: '10', fill: '#7EBDA6', stroke: '#6DAB95', 'stroke-width': '1.5' }));
    node.appendChild(createSvgElement('text', { x: String(px), y: String(py - 14), 'text-anchor': 'middle', 'font-size': '10', fill: '#2C1810' }, targetPerson.name));
    node.onclick = function (event) {
      if (event && event.stopPropagation) event.stopPropagation();
      currentPersonId = targetPerson.id;
      renderPeopleGraph();
      openPeoDet(targetPerson.id);
    };

    svg.appendChild(line);
    svg.appendChild(label);
    svg.appendChild(node);
  }

  function renderPeopleGraph() {
    var svg = document.getElementById('relation-svg');
    var centerName = document.getElementById('cur-peo-name');
    var center = getPersonById(currentPersonId);
    var relations;

    if (!svg) return;

    if (!peopleData.people.length) {
      if (centerName) centerName.textContent = '';
      renderEmptySvg(svg, '暂无人物数据');
      return;
    }

    if (!center) {
      currentPersonId = peopleData.people[0].id;
      center = peopleData.people[0];
    }

    if (centerName) centerName.textContent = center.name || '';
    clearSvg(svg);
    relations = getAdjacentRelations(currentPersonId, currentFilter);
    renderCenter(svg, center);

    if (!relations.length) {
      svg.appendChild(createSvgElement('text', { x: '175', y: '250', 'text-anchor': 'middle', 'font-size': '12', fill: '#B5ADA5' }, '暂无关联人物'));
      return;
    }

    relations.forEach(function (relation, index) {
      var other = getPersonById(getOtherPersonId(relation, currentPersonId));
      if (other) {
        renderRelation(svg, relation, other, index, relations.length);
      }
    });
  }

  function setActiveFilterButton(button) {
    document.querySelectorAll('#people-page .dtab, [data-relation-filter]').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (button) button.classList.add('act');
  }

  function filterPeopleRelations(type, button) {
    currentFilter = type || 'all';
    setActiveFilterButton(button);
    renderPeopleGraph();
  }

  function swPeoGroup(button, group) {
    filterPeopleRelations(group, button);
  }

  function openPeoDet(personId, relationPerson) {
    var person = relationPerson || getPersonById(personId);
    var title = document.getElementById('pd-name');
    var role = document.getElementById('pd-role');
    var info = document.getElementById('pd-info');
    var years = document.getElementById('pd-year-table');
    var deeds = document.getElementById('pd-deeds');
    var evalBox = document.getElementById('pd-eval');
    var card = document.getElementById('people-detail-card');

    if (!person) return;
    if (title) title.textContent = person.name || '';
    if (role) role.textContent = person.dynasty || person.role || '历史人物';
    if (info) info.innerHTML = '<div class="ii"><div class="lbl">简介</div><div class="val">' + escapeHtml(person.summary || person.description || person.role || '—') + '</div></div>';
    if (deeds) {
      deeds.innerHTML = '';
      (person.deeds || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        deeds.appendChild(li);
      });
    }
    if (years) {
      years.innerHTML = '';
      (person.yearTable || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        years.appendChild(li);
      });
    }
    if (evalBox) {
      if (person.evaluation) {
        evalBox.style.display = 'block';
        evalBox.querySelector('p').textContent = person.evaluation;
      } else {
        evalBox.style.display = 'none';
      }
    }
    if (card) card.classList.add('act');
  }

  function openRelationDetail(relation) {
    var source = getPersonById(relation.source);
    var target = getPersonById(relation.target);
    var title = document.getElementById('pd-name');
    var role = document.getElementById('pd-role');
    var info = document.getElementById('pd-info');
    var years = document.getElementById('pd-year-table');
    var deeds = document.getElementById('pd-deeds');
    var evalBox = document.getElementById('pd-eval');
    var card = document.getElementById('people-detail-card');

    if (title) title.textContent = (relation.label || '人物关系') + '：' + (source ? source.name : relation.source) + ' ↔ ' + (target ? target.name : relation.target);
    if (role) role.textContent = relationTypeMap[relation.type] || relation.type || '关系';
    if (info) info.innerHTML = '<div class="ii"><div class="lbl">关系说明</div><div class="val">' + escapeHtml(relation.description || '') + '</div></div>';
    if (years) years.innerHTML = '';
    if (deeds) deeds.innerHTML = '';
    if (evalBox) evalBox.style.display = 'none';
    if (card) card.classList.add('act');
  }

  function openCenterDet() {
    openPeoDet(currentPersonId);
  }

  function closePeoDet() {
    var card = document.getElementById('people-detail-card');
    if (card) card.classList.remove('act');
  }

  function searchPeople() {
    var input = document.getElementById('people-search-input');
    var value = input ? input.value.trim() : '';
    var found = null;

    if (!value) return;

    peopleData.people.forEach(function (person) {
      if (!found && (person.name === value || person.id === value)) {
        found = person;
      }
    });

    if (found) {
      currentPersonId = found.id;
      renderPeopleGraph();
      showToast('已切换到：' + found.name);
    } else {
      showToast('暂未收录该人物');
    }
  }

  function getRelationKey(relation) {
    var source = relation && relation.source ? String(relation.source) : '';
    var target = relation && relation.target ? String(relation.target) : '';
    var first = source < target ? source : target;
    var second = source < target ? target : source;
    return first + '__' + second + '__' + (relation && relation.type ? relation.type : '');
  }

  function detectDuplicateRelations() {
    var seen = {};
    var duplicates = [];
    peopleData.relations.forEach(function (relation) {
      var key = getRelationKey(relation);
      var originalKey = relation.source + '__' + relation.target + '__' + relation.type;
      if (seen[key]) duplicates.push(originalKey);
      seen[key] = true;
    });
    return duplicates;
  }

  function detectInvalidRelations() {
    var invalid = [];
    peopleData.relations.forEach(function (relation) {
      if (!peopleById[relation.source] || !peopleById[relation.target]) {
        invalid.push(relation.source + '->' + relation.target);
      }
    });
    return invalid;
  }

  function getPeopleState() {
    return {
      currentPersonId: currentPersonId,
      currentFilter: currentFilter,
      peopleCount: peopleData.people.length,
      relationCount: peopleData.relations.length
    };
  }

  window.peopleAPI = {
    setPeopleData: setPeopleData,
    getPersonById: getPersonById,
    getAdjacentRelations: getAdjacentRelations,
    renderPeopleGraph: renderPeopleGraph,
    filterPeopleRelations: filterPeopleRelations,
    swPeoGroup: swPeoGroup,
    openCenterDet: openCenterDet,
    openPeoDet: openPeoDet,
    closePeoDet: closePeoDet,
    searchPeople: searchPeople,
    detectDuplicateRelations: detectDuplicateRelations,
    detectInvalidRelations: detectInvalidRelations,
    getPeopleState: getPeopleState
  };

  window.swPeoGroup = swPeoGroup;
  window.openCenterDet = openCenterDet;
  window.openPeoDet = openPeoDet;
  window.closePeoDet = closePeoDet;
  window.searchPeople = searchPeople;
})();
