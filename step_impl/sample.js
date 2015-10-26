
gauge('Step Name 1', function() {
    console.log('Executing step name 1');
});

gauge('Step Name 2', function() {
    console.log('Executing step name 2');
});

gauge('A context step which gets executed before every scenario', function() {
    console.log('Executing -- A context step which gets executed before every scenario');
});

gauge('Say <greeting> to <user>', function() {
    console.log('Executing -- Say <greeting> to <user>');
});

gauge('Step that takes a table <table>', function() {
    console.log('Executing -- Step that takes a <table>');
});
