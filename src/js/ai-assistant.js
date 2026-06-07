(function () {
  function togAI() {
    document.getElementById('ai-panel').classList.toggle('act');
  }

  function aiAsk(q) {
    document.getElementById('ai-input').value = q;
    aiSend();
  }

  function aiReply(q) {
    var m = {
      '贞观之治是什么？': '贞观之治是唐太宗李世民在位期间（627-649年）出现的政治清明、社会安定的盛世局面。核心特征：虚心纳谏（魏征）、任用贤能（房玄龄、杜如晦）、轻徭薄赋、厉行节约。被史学家视为中国古代治世的典范。',
      '科举制的发展历程': '科举制始于隋炀帝大业元年（605年），唐代进一步完善，宋代达到鼎盛（殿试、糊名法、誊录制），明代实行八股取士，清代沿明制，1905年废除。共延续1300年，是古代中国最重要的选官制度。',
      '明朝灭亡的原因': '明朝灭亡是多重因素叠加的结果：1.财政危机（辽饷、剿饷、练饷三饷加派）；2.农民起义（李自成、张献忠等）；3.满洲兴起（后金/清的外在压力）；4.政治腐败（万历怠政、魏忠贤专权等）；5.小冰期气候导致农业大量减产。'
    };
    return m[q] || '这是一个很好的历史问题！📜<br>关于「' + q.replace(/</g, '&lt;') + '」，建议查阅相关史料和学术论文来获取更深入的理解。你也可以在学习模块中找到相关内容～';
  }

  function aiSend() {
    var inp = document.getElementById('ai-input'), q = inp.value.trim();
    if (!q) return;
    var b = document.getElementById('ai-body');
    b.innerHTML += '<div class="amsg usr"><div class="amb">' + q + '</div></div>';
    inp.value = '';
    b.scrollTop = b.scrollHeight;
    setTimeout(function () {
      var a = aiReply(q);
      b.innerHTML += '<div class="amsg bot"><div class="amb">' + a + '</div></div>';
      b.scrollTop = b.scrollHeight;
    }, 800);
  }

  // AI FAB drag
  (function () {
    var fab = document.getElementById('ai-fab');
    if (!fab) return;
    var isDragging = false, startX, startY, initRight, initBottom, hasMoved = false;
    function getRight() { return window.innerWidth - fab.offsetLeft - fab.offsetWidth; }
    fab.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      isDragging = true; hasMoved = false;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      initRight = getRight(); initBottom = parseInt(getComputedStyle(fab).bottom) || 120;
      fab.style.transition = 'none';
    }, { passive: false });
    fab.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      var dx = startX - e.touches[0].clientX, dy = startY - e.touches[0].clientY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
      fab.style.right = Math.max(8, Math.min(window.innerWidth - 60, initRight + dx)) + 'px';
      fab.style.bottom = Math.max(80, Math.min(window.innerHeight - 140, initBottom + dy)) + 'px';
      e.preventDefault();
    }, { passive: false });
    fab.addEventListener('touchend', function (e) {
      isDragging = false; fab.style.transition = '';
      if (hasMoved) { e.stopPropagation(); hasMoved = false; }
    });
    fab.addEventListener('mousedown', function (e) {
      isDragging = true; hasMoved = false;
      startX = e.clientX; startY = e.clientY;
      initRight = getRight(); initBottom = parseInt(getComputedStyle(fab).bottom) || 120;
      fab.style.transition = 'none'; e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = startX - e.clientX, dy = startY - e.clientY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
      fab.style.right = Math.max(8, Math.min(window.innerWidth - 60, initRight + dx)) + 'px';
      fab.style.bottom = Math.max(80, Math.min(window.innerHeight - 140, initBottom + dy)) + 'px';
    });
    document.addEventListener('mouseup', function (e) {
      if (isDragging && hasMoved) { e.preventDefault(); e.stopPropagation(); }
      isDragging = false; fab.style.transition = '';
    });
    fab.addEventListener('click', function (e) {
      if (hasMoved) { e.preventDefault(); e.stopPropagation(); hasMoved = false; }
    });
  })();

  window.aiAssistantAPI = {
    togAI: togAI,
    aiAsk: aiAsk,
    aiSend: aiSend,
    aiReply: aiReply
  };
})();
