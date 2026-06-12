(function () {
  var mindmapData = { maps: {} };
  var currentMap = 'china';
  var currentNodeId = '';
  var currentNodeLabel = '';

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

  function getStorageKey(nodeId) {
    return 'mindmap_note_' + nodeId;
  }

  function getMapRoot(mapId) {
    return document.getElementById('mm-' + mapId);
  }

  function getNodeById(nodeId) {
    var maps = mindmapData.maps || {};
    var mapKey;
    var result = null;

    for (mapKey in maps) {
      if (Object.prototype.hasOwnProperty.call(maps, mapKey)) {
        (maps[mapKey].nodes || []).forEach(function (node) {
          if (!result && node.id === nodeId) {
            result = node;
          }
        });
      }
    }

    return result;
  }

  function setMindmapData(data) {
    mindmapData = data && data.maps ? data : { maps: {} };
  }

  function renderLinks(nodes) {
    var byId = {};
    var links = '';

    nodes.forEach(function (node) {
      byId[node.id] = node;
    });

    nodes.forEach(function (node) {
      var parent = node.parent ? byId[node.parent] : null;
      if (!parent) return;
      links += '<line x1="' + escapeHtml(parent.x + 35) + '" y1="' + escapeHtml(parent.y + 35) + '" x2="' + escapeHtml(node.x + 35) + '" y2="' + escapeHtml(node.y + 35) + '" stroke="#D4A843" stroke-width="2"/>';
    });

    return '<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">' + links + '</svg>';
  }

  function renderMindmap(mapId) {
    var root = getMapRoot(mapId);
    var map = mindmapData.maps && mindmapData.maps[mapId];
    var nodes;
    var html;

    if (!root) return;
    if (!map || !Array.isArray(map.nodes) || !map.nodes.length) {
      root.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无导图数据</div>';
      return;
    }

    nodes = map.nodes;
    html = renderLinks(nodes);
    html += nodes.map(function (node) {
      var cls = node.root ? 'mn rt' : 'mn';
      return '<div class="' + cls + '" data-mindmap-node="' + escapeHtml(node.id || '') + '" style="left:' + escapeHtml(node.x || 0) + 'px;top:' + escapeHtml(node.y || 0) + 'px">' + escapeHtml(node.label || '') + '</div>';
    }).join('');

    root.innerHTML = html;
    root.querySelectorAll('[data-mindmap-node]').forEach(function (nodeEl) {
      nodeEl.onclick = function () {
        openNode(nodeEl.getAttribute('data-mindmap-node'));
      };
    });
  }

  function renderAllMindmaps() {
    var key;
    for (key in mindmapData.maps) {
      if (Object.prototype.hasOwnProperty.call(mindmapData.maps, key)) {
        renderMindmap(key);
      }
    }
  }

  function swMind(button, tab) {
    currentMap = tab || 'china';
    document.querySelectorAll('.mtab').forEach(function (item) { item.classList.remove('act'); });
    if (button) button.classList.add('act');

    document.querySelectorAll('#mindmap-page .mc').forEach(function (panel) {
      panel.style.display = 'none';
    });

    if (currentMap === 'custom') {
      var custom = document.getElementById('mm-custom');
      if (custom) {
        custom.style.display = 'flex';
        custom.innerHTML = '<div style="text-align:center;color:#8A8279"><div style="font-size:32px;margin-bottom:8px">🧠</div><div>自定义导图编辑器将在后续版本开放</div></div>';
      }
      return;
    }

    var root = getMapRoot(currentMap);
    if (root) {
      root.style.display = 'block';
      renderMindmap(currentMap);
    }
  }

  function openNode(nodeIdOrName) {
    var node = getNodeById(nodeIdOrName) || { id: nodeIdOrName, label: nodeIdOrName };
    var input = document.getElementById('node-note-input');
    var title = document.getElementById('node-note-title');
    var panel = document.getElementById('node-note-panel');
    var note = '';

    currentNodeId = node.id;
    currentNodeLabel = node.label || node.id;

    if (window.storageAPI && typeof window.storageAPI.getStoredString === 'function') {
      note = window.storageAPI.getStoredString(getStorageKey(currentNodeId), '');
    }

    if (title) title.textContent = '📝 ' + currentNodeLabel + ' · 节点笔记';
    if (input) {
      input.value = note;
      input.dataset.node = currentNodeId;
    }
    if (panel) panel.style.display = 'flex';
  }

  function saveNode() {
    var input = document.getElementById('node-note-input');
    var nodeId = input && input.dataset.node ? input.dataset.node : currentNodeId;
    var node = getNodeById(nodeId) || { label: currentNodeLabel || nodeId };
    var value = input ? input.value : '';
    var panel = document.getElementById('node-note-panel');

    if (!nodeId) return false;

    if (window.storageAPI && typeof window.storageAPI.setStoredString === 'function') {
      window.storageAPI.setStoredString(getStorageKey(nodeId), value);
    }

    if (panel) panel.style.display = 'none';
    showToast('「' + (node.label || nodeId) + '」的笔记已保存！');
    return true;
  }

  function closeNodeNote() {
    var panel = document.getElementById('node-note-panel');
    if (panel) panel.style.display = 'none';
  }

  window.mindmapAPI = {
    setMindmapData: setMindmapData,
    renderMindmap: renderMindmap,
    renderAllMindmaps: renderAllMindmaps,
    swMind: swMind,
    openNode: openNode,
    saveNode: saveNode,
    closeNodeNote: closeNodeNote
  };

  window.swMind = swMind;
  window.openNode = openNode;
  window.saveNode = saveNode;
  window.closeNodeNote = closeNodeNote;
})();
