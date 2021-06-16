/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';
  
	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	
  function uuid() {
    /*jshint bitwise:false */
    var i, random;
    var uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  }

  function pluralize(count, word) {
    return count === 1 ? word : word + 's';
  }

  function store(namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      var store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || [];
    }
  }
  
  // The todoAppStorage variable acts as storage for the todos array and the app’s filter.
	var todoAppStorage = {};

  function init() {
    todoAppStorage.todos = store('todos-jquery');
    bindEvents();

    new Router({
      '/:filter': [function (filter) {
        todoAppStorage.filter = filter;
        render();
        save();
      }]
    }).init('/all');      
	}
  init();
  
  function bindEvents() {
    $('#new-todo').on('keyup', create.bind(todoAppStorage));
    $('#toggle-all').on('change', toggleAll.bind(todoAppStorage));
    $('#footer').on('click', '#clear-completed', destroyCompleted.bind(todoAppStorage));
    $('#todo-list')
      .on('change', '.toggle', toggle.bind(todoAppStorage))
      .on('dblclick', 'label', edit.bind(todoAppStorage))
      .on('keyup', '.edit', editKeyup.bind(todoAppStorage))
      .on('focusout', '.edit', update.bind(todoAppStorage))
      .on('click', '.destroy', destroy.bind(todoAppStorage));
  }
  
  function create(e) {
    var $input = $(e.target);
    var val = $input.val().trim();

    if (e.which !== ENTER_KEY || !val) {
      return;
    }
    
    todoAppStorage.todos.push({
      id: uuid(),
      title: val,
      completed: false
    });

    $input.val('');

    render();
    save();
  }
  
  function destroy(e) {
    todoAppStorage.todos.splice(indexFromEl(e.target), 1);
    render();
    save();
	} 
  
  function destroyCompleted() {
    todoAppStorage.todos = getActiveTodos();
    todoAppStorage.filter = 'all';
    render();
    save();
	}
  
  function edit(e) {
    var $input = $(e.target).closest('li').addClass('editing').find('.edit');
    $input.val($input.val()).focus();
	}
  
  function editKeyup(e) {
    if (e.which === ENTER_KEY) {
      e.target.blur();
    }

    if (e.which === ESCAPE_KEY) {
      $(e.target).data('abort', true).blur();
    }
  }  
  
  function getActiveTodos() {
    return todoAppStorage.todos.filter(function (todo) {
      return !todo.completed;
    });
	}
  
  function getCompletedTodos() {
    return todoAppStorage.todos.filter(function (todo) {
      return todo.completed;
    });
	}
  
  function getFilteredTodos() {
    if (todoAppStorage.filter === 'active') {
      return getActiveTodos();
    }

    if (todoAppStorage.filter === 'completed') {
      return getCompletedTodos();
    }

    return todoAppStorage.todos;
  }
  
  function indexFromEl(el) {
    var id = $(el).closest('li').data('id');
    var todos = todoAppStorage.todos;
    var i = todos.length;

    while (i--) {
      if (todos[i].id === id) {
        return i;
      }
    }
	}
  
	// function assignFilter(filter) {
	// todoAppStorage.filter = filter;
	// render();
	// }
  
  function save() {
    // saves the  as todos-jquery' in localStorage
    store('todos-jquery', todoAppStorage.todos);
  }
  
  function render() {
    var todoTemplateFunction = Handlebars.compile($('#todo-template').html());
    var todos = getFilteredTodos();
    $('#todo-list').html(todoTemplateFunction(todos));
    $('#main').toggle(todos.length > 0);
    $('#toggle-all').prop('checked', getActiveTodos().length === 0);
    renderFooter();
    $('#new-todo').focus();
    // store('todos-jquery', todoAppStorage.todos);
	}
  
  function renderFooter() {
    var footerTemplate = Handlebars.compile($('#footer-template').html());
    var todoCount = todoAppStorage.todos.length;
    var activeTodoCount = getActiveTodos().length;
    var activeTodoWord = pluralize(activeTodoCount,'item'); 
    var template = footerTemplate({
      activeTodoCount: activeTodoCount,
      activeTodoWord: activeTodoWord,
      completedTodos: todoCount - activeTodoCount,
      filter: todoAppStorage.filter
    });

    $('#footer').toggle(todoCount > 0).html(template);
  }
  
  function toggle(e) {
    var i = indexFromEl(e.target);
    todoAppStorage.todos[i].completed = !todoAppStorage.todos[i].completed;
    render();
	}
  
  function toggleAll(e) {
    var isChecked = $(e.target).prop('checked');

    todoAppStorage.todos.forEach(function (todo) {
      todo.completed = isChecked;
    });

    render();
	}
  
  function update(e) {
    var el = e.target;
    var $el = $(el);
    var val = $el.val().trim();

    if (!val) {
      destroy(e);
      return;
    }

    if ($el.data('abort')) {
      $el.data('abort', false);
    } else {
      todoAppStorage.todos[indexFromEl(el)].title = val;
    }

    render();
	}


});