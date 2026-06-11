export function mountDOM(html) {
  document.body.innerHTML = html;
}

export function makeStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

export function resetGlobals() {
  document.body.innerHTML = '';
  delete window.navigationAPI;
  delete window.checkinAPI;
  delete window.peopleAPI;
  delete window.studyToolsAPI;
  delete window.libraryAPI;
  delete window.memesAPI;
  delete window.filmAPI;
  delete window.storageAPI;
  delete window.audioAPI;
  delete window.externalLinkAPI;
  delete window.dataLoaderAPI;
}
