(function () {
  var STORAGE_KEY = 'xds_forum_posts';
  var discussions = [];
  var expandedPostIds = Object.create(null);
  var activeType = 'all';
  var activeTag = 'all';
  var postTags = [];

  var POST_TYPES = ['discussion', 'article', 'person', 'media', 'resource'];
  var TYPE_LABELS = {
    'discussion': '讨论',
    'article': '文章',
    'person': '人物',
    'media': '书影',
    'resource': '资源'
  };
  var DYNASTY_TAGS = ['先秦', '秦', '汉', '三国', '晋', '南北朝', '隋', '唐', '宋', '元', '明', '清', '近代', '跨朝代'];
  var TOPIC_TAGS = ['政治', '军事', '经济', '文化', '科技', '地理', '社会', '制度'];

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
    return document.getElementById('forum-list') || document.getElementById('discussion-list') || document.querySelector('#discuss-page .dp');
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

  function getPostCard(postId) {
    var root = getListRoot();
    var cards;
    var i;

    if (!root) return null;

    cards = root.querySelectorAll('.pcard[data-post-id]');
    for (i = 0; i < cards.length; i += 1) {
      if (cards[i].getAttribute('data-post-id') === String(postId)) {
        return cards[i];
      }
    }

    return null;
  }

  function getDefaultPostType() {
    return 'discussion';
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

  function renderPostMeta(post) {
    var type = post.type || 'discussion';
    if (type === 'article') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag article">📄 文章</span>' +
        (post.metadata && post.metadata.externalUrl ? '<a class="fm-link" href="' + escapeHtml(post.metadata.externalUrl) + '" target="_blank" rel="noopener">阅读原文 →</a>' : '') +
        '</div>';
    }
    if (type === 'person') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag person">👤 人物</span>' +
        '<span class="fm-dynasty">' + escapeHtml((post.metadata && post.metadata.dynasty) || '') + '</span>' +
        '<span class="fm-role">' + escapeHtml((post.metadata && post.metadata.role) || '') + '</span>' +
        '</div>';
    }
    if (type === 'media') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag media">🎬 书影</span>' +
        '<span class="fm-media-type">' + escapeHtml((post.metadata && post.metadata.mediaType) || '') + '</span>' +
        (post.metadata && post.metadata.rating ? '<span class="fm-rating">★ ' + escapeHtml(post.metadata.rating) + '</span>' : '') +
        '</div>';
    }
    if (type === 'resource') {
      return '<div class="fm-meta">' +
        '<span class="fm-type-tag resource">📦 资源</span>' +
        (post.metadata && post.metadata.externalUrl ? '<a class="fm-link" href="' + escapeHtml(post.metadata.externalUrl) + '" target="_blank" rel="noopener">查看链接 →</a>' : '') +
        '</div>';
    }
    return '';
  }

  function renderPostTags(post) {
    var tags = Array.isArray(post.tags) ? post.tags : [];
    if (!tags.length) return '';
    return '<div class="fm-tags">' + tags.map(function (tag) {
      return '<span class="fm-tag">' + escapeHtml(tag) + '</span>';
    }).join('') + '</div>';
  }

  function renderPost(post) {
    var type = post.type || 'discussion';
    var visible = true;
    if (activeType !== 'all' && activeType !== type) {
      visible = false;
    }
    if (activeTag !== 'all') {
      var tags = Array.isArray(post.tags) ? post.tags : [];
      if (tags.indexOf(activeTag) === -1) {
        visible = false;
      }
    }
    var commentsCount = post.comments;
    if (commentsCount === null || typeof commentsCount === 'undefined') {
      commentsCount = Array.isArray(post.commentsList) ? post.commentsList.length : 0;
    }
    if (post.stats && typeof post.stats.comments !== 'undefined' && commentsCount === 0) {
      commentsCount = post.stats.comments;
    }

    var authorName = (post.author && post.author.name) || post.author || '匿名';
    var avatar = (post.author && post.author.avatar) || post.avatar || '🙂';
    var time = post.time || post.createdAt || '';
    var body = post.content || post.body || '';
    var likes = (post.stats && post.stats.likes) || post.likes || '0';
    var favorite = (post.stats && post.stats.favorites) || post.favorite || '收藏';

    return '<div class="pcard" data-post-id="' + escapeHtml(post.id || '') + '" data-post-type="' + escapeHtml(type) + '" style="display:' + (visible ? 'block' : 'none') + '">' +
      '<div class="pa"><div class="pav">' + escapeHtml(avatar) + '</div><div><div class="nm">' + escapeHtml(authorName) + '</div><div class="ti">' + escapeHtml(time) + '</div></div></div>' +
      '<div class="pc"><h4>' + escapeHtml(post.title || '') + '</h4><p>' + escapeHtml(body) + '</p></div>' +
      renderPostMeta(post) +
      renderPostTags(post) +
      '<div class="pact"><span>❤️ ' + escapeHtml(likes) + '</span><span class="comment-toggle" data-comment-post="' + escapeHtml(post.id || '') + '">💬 ' + escapeHtml(commentsCount) + '</span><span>⭐ ' + escapeHtml(favorite) + '</span></div>' +
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
      root.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">还没有帖子，来发第一条吧</div>';
      return;
    }

    discussions.forEach(function (post) {
      var type = post.type || 'discussion';
      var tagMatch = activeTag === 'all' || (Array.isArray(post.tags) && post.tags.indexOf(activeTag) !== -1);
      if ((activeType === 'all' || type === activeType) && tagMatch) {
        visibleCount += 1;
      }
    });

    html = discussions.map(renderPost).join('');
    if (!visibleCount) {
      html += '<div class="discussion-empty" style="text-align:center;padding:24px;color:#B5ADA5">该分类下暂无内容</div>';
    }

    root.innerHTML = html;
    bindDiscussionEvents(root);
  }

  function setInitialDiscussions(list) {
    var stored = getStoredDiscussions();
    expandedPostIds = Object.create(null);
    activeType = 'all';
    activeTag = 'all';
    discussions = cloneList(Array.isArray(stored) ? stored : list);
    renderDiscussions();
  }

  function filterForum(type, button) {
    activeType = type || 'all';

    document.querySelectorAll('#forum-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });

    if (button) {
      button.classList.add('act');
    }

    renderDiscussions();
  }

  function filterForumByTag(tag, button) {
    activeTag = (tag === 'all' || !tag) ? 'all' : tag;

    document.querySelectorAll('#forum-tag-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });

    if (button) {
      button.classList.add('act');
    }

    renderDiscussions();
  }

  function toggleComments(postId) {
    var card;
    var list;
    var key = String(postId);

    if (!findPost(key)) return;

    card = getPostCard(key);
    if (!card) return;

    list = card.querySelector('.cmt-list');
    if (!list) return;

    if (expandedPostIds[key]) {
      delete expandedPostIds[key];
      list.style.display = 'none';
    } else {
      expandedPostIds[key] = true;
      list.style.display = 'block';
    }
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
    var typeSelect = document.getElementById('post-type-select');
    var overlay = document.getElementById('post-overlay');

    if (titleInput) titleInput.value = '';
    if (bodyInput) bodyInput.value = '';
    if (typeSelect) typeSelect.value = 'discussion';
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
    var typeSelect = document.getElementById('post-type-select');
    var selectedType = typeSelect ? typeSelect.value : 'discussion';
    var post;
    var now;

    if (!title) {
      showToast('请输入帖子标题');
      return false;
    }

    if (!body) {
      showToast('请输入帖子内容');
      return false;
    }

    if (postTags.length === 0) {
      showToast('请至少选择一个标签');
      return false;
    }

    if (postTags.length > 5) {
      showToast('最多选择5个标签');
      return false;
    }

    now = new Date();

    post = {
      id: 'post-user-' + now.getTime() + '-' + (discussions.length + 1),
      type: selectedType,
      title: title,
      content: body,
      author: {
        id: 'u_local',
        name: '我',
        avatar: '🙂'
      },
      tags: postTags.slice(),
      metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      commentsList: [],
      body: body,
      authorName: '我',
      avatar: '🙂',
      time: '刚刚',
      likes: '0',
      comments: '0',
      favorite: '收藏'
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
    if (post.stats) {
      post.stats.comments = parseCount(post.stats.comments) + 1;
    }
    expandedPostIds[postId] = true;
    saveDiscussions();
    renderDiscussions();
    showToast('评论成功');
    return true;
  }

  function addCommentFromInput(postId) {
    var card = getPostCard(postId);
    var input = card ? card.querySelector('[data-comment-input]') : null;
    var value = input ? input.value : '';
    return addComment(postId, value);
  }

  function getDiscussions() {
    return cloneList(discussions);
  }

  window.forumAPI = {
    setInitialDiscussions: setInitialDiscussions,
    renderDiscussions: renderDiscussions,
    filterForum: filterForum,
    filterForumByTag: filterForumByTag,
    toggleComments: toggleComments,
    openPost: openPost,
    closePost: closePost,
    togglePostTag: togglePostTag,
    submitPost: submitPost,
    addComment: addComment,
    addCommentFromInput: addCommentFromInput,
    getDiscussions: getDiscussions,
    getPostTypes: function () { return POST_TYPES.slice(); },
    getTypeLabels: function () { return Object.assign({}, TYPE_LABELS); },
    getDynastyTags: function () { return DYNASTY_TAGS.slice(); },
    getTopicTags: function () { return TOPIC_TAGS.slice(); }
  };

  // Backward compatibility alias
  window.discussAPI = window.forumAPI;

  // Global compatibility functions
  window.filterForum = filterForum;
  window.filterForumByTag = filterForumByTag;
  window.filterDiscuss = filterForum;
  window.toggleComments = toggleComments;
  window.openPost = openPost;
  window.closePost = closePost;
  window.togglePostTag = togglePostTag;
  window.submitPost = submitPost;
  window.addComment = addComment;
  window.addCommentFromInput = addCommentFromInput;
})();
