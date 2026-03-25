document.addEventListener('DOMContentLoaded', function () {
  var screen = document.getElementById('loading-screen');
  var main = document.getElementById('main-content');
  var line1 = document.getElementById('load-line1');
  var line2 = document.getElementById('load-line2');
  var line3 = document.getElementById('load-line3');
  var line4 = document.getElementById('load-line4');

  var glyphPool = '!@#$%^&*<>?/|[]{}~`ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789Ж∆Ω≠≤≥÷√∞§¶±░▒▓█▄▀';

  function randomGlyph() {
    return glyphPool[Math.floor(Math.random() * glyphPool.length)];
  }

  function typeText(el, text, speed, callback) {
    el.style.opacity = '1';
    var i = 0;
    var interval = setInterval(function () {
      el.textContent = text.slice(0, i + 1);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }

  function scrambleReveal(el, finalText, duration, callback) {
    el.style.opacity = '1';
    var totalFrames = 60;
    var frame = 0;
    var interval = setInterval(function () {
      var progress = frame / totalFrames;
      var result = '';
      for (var i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ') {
          result += ' ';
        } else if (progress > i / finalText.length) {
          result += finalText[i];
        } else {
          result += randomGlyph();
        }
      }
      el.textContent = result;
      frame++;
      if (frame >= totalFrames) {
        clearInterval(interval);
        el.textContent = finalText;
        el.setAttribute('data-text', finalText);
        el.classList.add('glitch-active');
        if (callback) setTimeout(callback, 1200);
      }
    }, duration / totalFrames);
  }

  // Sequence
  setTimeout(function () {
    typeText(line1, 'Hello User...', 60, null);
  }, 400);

  setTimeout(function () {
    typeText(line2, 'Your browser is opening', 55, null);
  }, 1800);

  setTimeout(function () {
    line3.textContent = '...';
    line3.style.opacity = '1';
  }, 3400);

  setTimeout(function () {
    scrambleReveal(line4, 'BROWSER SUCCESSFULLY LAUNCHED', 1600, function () {
      // Fade out loading screen
      screen.style.transition = 'opacity 0.9s ease';
      screen.style.opacity = '0';
      setTimeout(function () {
        screen.style.display = 'none';
        main.style.transition = 'opacity 0.8s ease';
        main.style.opacity = '1';
        main.style.pointerEvents = 'auto';
      }, 900);
    });
  }, 4400);
});
