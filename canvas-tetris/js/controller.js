document.body.onkeydown = function(e) {
    var keys = {
        37: 'left',
        39: 'right',
        40: 'down',
        38: 'rotate',
        32: 'drop',
        16: 'hold',
        67: 'hold'
    };
    if (typeof keys[e.keyCode] != 'undefined') {
        e.preventDefault();
        keyPress(keys[e.keyCode]);
        render();
    }
};

document.addEventListener('keyup', function(e) {
    if ([37, 38, 39, 40, 32, 16, 67].includes(e.keyCode)) {
        e.preventDefault();
    }
});

document.addEventListener('touchstart', function(e) {
    if (e.target.classList.contains('touch-btn')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
