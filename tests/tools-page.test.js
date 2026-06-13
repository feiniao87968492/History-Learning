import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountToolsDOM() {
  mountDOM(`
    <div id="tools-page" class="page">
      <div class="hh"><h2>学习工具</h2></div>
      <div class="sg">
        <button class="scard" onclick="openSub('noun-page')"><span class="ic">📖</span><h4>名词解释</h4></button>
        <button class="scard" onclick="openSub('timeline-page')"><span class="ic">🕐</span><h4>时间轴</h4></button>
        <button class="scard" onclick="openSub('mindmap-page')"><span class="ic">🧠</span><h4>思维导图</h4></button>
      </div>
    </div>
  `);
}

describe('tools page', () => {
  test('tools page renders three tool cards', () => {
    mountToolsDOM();
    var cards = document.querySelectorAll('#tools-page .scard');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('名词解释');
    expect(cards[1].textContent).toContain('时间轴');
    expect(cards[2].textContent).toContain('思维导图');
  });

  test('tool cards have onclick handlers', () => {
    mountToolsDOM();
    var nounCard = document.querySelector('#tools-page .scard');
    expect(nounCard.getAttribute('onclick')).toContain('noun-page');
  });

  test('toolsAPI initializes without errors', async () => {
    mountToolsDOM();
    await import('../src/js/tools.js');
    expect(window.toolsAPI).toBeDefined();
    expect(typeof window.toolsAPI.initToolsPage).toBe('function');
    expect(function () { window.toolsAPI.initToolsPage(); }).not.toThrow();
  });
});
