gauge('A context step which gets executed before every scenario', function() {
    console.log('A context step which gets executed before every scenario');
});

gauge('Say <greeting> to <user>', function(greeting, user) {
    console.log('Say ' + greeting + ' to ' + user);
});

gauge('Step that takes a table <table>', function(table) {
    console.log('Step that takes a ' + table);
});
