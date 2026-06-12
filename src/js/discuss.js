(function () {
  var STORAGE_KEY = 'xds_discussions';
  var discussions = [];
  var expandedPostIds = {};
  var activeCategory = 'all';
  var postTags = [];
  var tagCategoryMap = {
    '史观': 'view',
    '冷知识': 'cold',
    '求助': 'help',
    '资源': 'resource'
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
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    } else if (typeof window.showToast === 'function') {
      window.showToast(message);
    }
  }

  function getStoredDiscussions() {
    if (window.storageAPI && typeof window.storageAPI.getStoredJSON === 'function') {
      return window.storageAPI.getStoredJSON(STORAGE_KEY, null);
    }
    return null;
  }

  function saveDiscussions() {
    if (window.storageAPI && typeof window.storageAPI.setStoredJSON === 'function') {
      return window.storageAPI.setStoredJSON(STORAGE_KEY, discussions);
    }
    console.error('saveDiscussions failed:', new Error('storageAPI unavailable'));
    return false;
  }

  function cloneList(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      var copy = {};
      var key;
      for (key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          if (key === 'commentsList' && Array.isArray(item[key])) {
            copy[key] = item[key].map(function (comment) {
              var commentCopy = {};
              var commentKey;
              for (commentKey in comment) {
                if (Object.prototype.hasOwnProperty.call(comment, commentKey)) {
                  commentCopy[commentKey] = comment[commentKey];
                }
              }
              return commentCopy;
            });
          } else {
            copy[key] = item[key];
          }
        }
      }
      return copy;
    });
  }

  function getListRoot() {
    return document.getElementById('discussion-list') || document.querySelector('#discuss-page .dp');
  }

  function parseCount(value) {
    var numberValue = parseInt(value, 10);
    return isNaN(numberValue) ? 0 : numberValue;
  }

  function findPost(postId) {
    var i;
    for (i = 0; i < discussions.length; i += 1) {
      if (discussions[i] && String(discussions[i].id) === String(postId)) {
        return discussions[i];
      }
    }
    return null;
  }

  function getCategoryFromTags() {
    if (postTags.length && tagCategoryMap[postTags[0]]) {
      return tagCategoryMap[postTags[0]];
    }
    return 'view';
  }

  function renderComment(comment) {
    return '<div class="cmt-item" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">' +
      '<div style="width:24px;height:24px;background:#EDE8E0;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center">' + escapeHtml(comment.avatar || '🙂') + '</div>' +
      '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:#2C1810">' + escapeHtml(comment.author || '匿名') + '</div>' +
      '<div style="font-size:11px;color:#2C1810;line-height:1.5">' + escapeHtml(comment.body || '') + '</div></div>' +
    '</div>';
  }

  function renderCommentList(post) {
    var comments = Array.isArray(post.commentsList) ? post.commentsList : [];
    var html = comments.map(renderComment).join('');
    var display = expandedPostIds[post.id] ? 'block' : 'none';

    if (post.moreCommentsLabel) {
      html += '<div style="font-size:10px;color:#C9A96E;cursor:pointer;padding:4px 0">' + escapeHtml(post.moreCommentsLabel) + '</div>';
    }

    html += '<div class="cmt-compose" style="display:flex;gap:6px;margin-top:8px">' +
      '<input class="cmt-input" data-comment-input="' + escapeHtml(post.id || '') + '" type="text" placeholder="写评论..." style="flex:1;border:1px solid #EDE8E0;border-radius:10px;padding:6px 8px;font-size:12px;box-sizing:border-box">' +
      '<button class="cmt-submit" data-comment-submit="' + escapeHtml(post.id || '') + '" style="border:0;background:#C9A96E;color:#fff;border-radius:10px;padding:6px 10px;font-size:12px">评论</button>' +
    '</div>';

    return '<div class="cmt-list" style="display:' + display + ';padding:8px 0 0;border-top:1px solid #EDE8E0;margin-top:8px">' + html + '</div>';
  }

  function renderPost(post) {
    var category = post.category || 'view';
    var visible = activeCategory === 'all' || activeCategory === category;
    var commentsCount = post.comments;

    if (commentsCount === null || typeof commentsCount === 'undefined') {
      commentsCount = Array.isArray(post.commentsList) ? post.commentsList.length : 0;
    }

    return '<div class="pcard" data-post-id="' + escapeHtml(post.id || '') + '" data-discuss-cat="' + escapeHtml(category) + '" style="display:' + (visible ? 'block' : 'none') + '">' +
      '<div class="pa"><div class="pav">' + escapeHtml(post.avatar || '🙂') + '</div><div><div class="nm">' + escapeHtml(post.author || '匿名') + '</div><div class="ti">' + escapeHtml(post.time || '刚刚') + '</div></div></div>' +
      '<div class="pc"><h4>' + escapeHtml(post.title || '') + '</h4><p>' + escapeHtml(post.body || '') + '</p></div>' +
      '<div class="pact"><span>❤️ ' + escapeHtml(post.likes || '0') + '</span><span class="comment-toggle" data-comment-post="' + escapeHtml(post.id || '') + '">💬 ' + escapeHtml(commentsCount) + '</span><span>⭐ ' + escapeHtml(post.favorite || '收藏') + '</span></div>' +
      renderCommentList(post) +
    '</div>';
  }

  function bindDiscussionEvents(root) {
    root.querySelectorAll('[data-comment-post]').forEach(function (button) {
      button.onclick = function () {
        toggleComments(button.getAttribute('data-comment-post'));
      };
    });

    root.querySelectorAll('[data-comment-submit]').forEach(function (button) {
      button.onclick = function () {
        addCommentFromInput(button.getAttribute('data-comment-submit'));
      };
    });
  }

  function renderDiscussions() {
    var root = getListRoot();
    var visibleCount = 0;
    var html;

    if (!root) return;

    if (!discussions.length) {
      root.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无讨论</div>';
      return;
    }

    discussions.forEach(function (post) {
      if (activeCategory === 'all' || post.category === activeCategory) {
        visibleCount += 1;
      }
    });

    html = discussions.map(renderPost).join('');
    if (!visibleCount) {
      html += '<div class="discussion-empty" style="text-align:center;padding:24px;color:#B5ADA5">暂无讨论</div>';
    }

    root.innerHTML = html;
    bindDiscussionEvents(root);
  }

  function setInitialDiscussions(list) {
    var stored = getStoredDiscussions();
    discussions = cloneList(Array.isArray(stored) ? stored : list);
    renderDiscussions();
  }

  function filterDiscuss(category, button) {
    activeCategory = category || 'all';

    document.querySelectorAll('#discuss-page .htabs .htab, #discuss-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });

    if (button) {
      button.classList.add('act');
    }

    renderDiscussions();
  }

  function toggleComments(postId) {
    if (!findPost(postId)) return;

    expandedPostIds[postId] = !expandedPostIds[postId];
    renderDiscussions();
  }

  function openPost() {
    var overlay = document.getElementById('post-overlay');
    if (overlay) overlay.classList.add('act');
  }

  function closePost(event) {
    var overlay = document.getElementById('post-overlay');
    if (!overlay) return;
    if (!event || event.target === overlay) {
      overlay.classList.remove('act');
    }
  }

  function togglePostTag(button, tag) {
    var index = postTags.indexOf(tag);
    if (button) {
      button.classList.toggle('act');
    }

    if (index === -1) {
      postTags.push(tag);
    } else {
      postTags.splice(index, 1);
    }
  }

  function clearPostForm() {
    var titleInput = document.getElementById('post-title');
    var bodyInput = document.getElementById('post-body');
    var overlay = document.getElementById('post-overlay');

    if (titleInput) titleInput.value = '';
    if (bodyInput) bodyInput.value = '';
    if (overlay) overlay.classList.remove('act');

    document.querySelectorAll('#post-overlay .ft').forEach(function (button) {
      button.classList.remove('act');
    });
    postTags = [];
  }

  function submitPost() {
    var titleInput = document.getElementById('post-title');
    var bodyInput = document.getElementById('post-body');
    var title = titleInput ? titleInput.value.trim() : '';
    var body = bodyInput ? bodyInput.value.trim() : '';
    var post;

    if (!title) {
      showToast('请输入帖子标题');
      return false;
    }

    if (!body) {
      showToast('请输入帖子内容');
      return false;
    }

    post = {
      id: 'post-user-' + new Date().getTime() + '-' + (discussions.length + 1),
      category: getCategoryFromTags(),
      author: '我',
      avatar: '🙂',
      time: '刚刚',
      title: title,
      body: body,
      likes: '0',
      comments: '0',
      favorite: '收藏',
      tags: postTags.slice(),
      commentsList: []
    };

    discussions.unshift(post);
    saveDiscussions();
    clearPostForm();
    renderDiscussions();
    showToast('帖子发布成功！');
    return post;
  }

  function addComment(postId, body) {
    var post = findPost(postId);
    var text = body == null ? '' : String(body).trim();

    if (!text) {
      showToast('请输入评论内容');
      return false;
    }

    if (!post) return false;

    if (!Array.isArray(post.commentsList)) {
      post.commentsList = [];
    }

    post.commentsList.push({
      author: '我',
      avatar: '🙂',
      time: '刚刚',
      body: text
    });
    post.comments = String(parseCount(post.comments) + 1);
    expandedPostIds[postId] = true;
    saveDiscussions();
    renderDiscussions();
    showToast('评论成功');
    return true;
  }

  function addCommentFromInput(postId) {
    var input = document.querySelector('[data-comment-input="' + postId + '"]');
    var value = input ? input.value : '';
    return addComment(postId, value);
  }

  function getDiscussions() {
    return cloneList(discussions);
  }

  window.discussAPI = {
    setInitialDiscussions: setInitialDiscussions,
    renderDiscussions: renderDiscussions,
    filterDiscuss: filterDiscuss,
    toggleComments: toggleComments,
    openPost: openPost,
    closePost: closePost,
    togglePostTag: togglePostTag,
    submitPost: submitPost,
    addComment: addComment,
    addCommentFromInput: addCommentFromInput,
    getDiscussions: getDiscussions
  };

  window.filterDiscuss = filterDiscuss;
  window.toggleComments = toggleComments;
  window.openPost = openPost;
  window.closePost = closePost;
  window.togglePostTag = togglePostTag;
  window.submitPost = submitPost;
  window.addComment = addComment;
  window.addCommentFromInput = addCommentFromInput;
})();
