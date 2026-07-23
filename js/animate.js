(function () {

  'use strict';

  var doc = document;
  var win = window;

  /* ─── Lecture progress bar ─── */
  var bar = doc.createElement('div');
  bar.className = 'progress-bar';
  doc.body.prepend(bar);

  win.addEventListener('scroll', function () {
    var h = doc.documentElement.scrollHeight - win.innerHeight;
    bar.style.width = (win.scrollY / h * 100) + '%';
  });

  /* ─── Intersection Observer : scroll reveal ─── */
  var revealTargets = doc.querySelectorAll(
    '.section > .section-inner > .section-title, ' +
    '.section > .section-inner > .section-sub, ' +
    '.tile, .step, .feature'
  );

  if ('IntersectionObserver' in win) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var parent = el.closest('.steps, .features, .cards-grid');
          if (parent) {
            var idx = Array.prototype.indexOf.call(parent.children, el);
            el.style.transitionDelay = (idx * 0.1).toFixed(1) + 's';
          }
          el.classList.add('reveal');
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(function (el) {
      obs.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
    });
  }

  /* ─── Hero stats staggered reveal ─── */
  var stats = doc.querySelector('.hero-stats');
  if (stats) {
    var statItems = stats.querySelectorAll('.stat');
    statItems.forEach(function (s, i) {
      s.style.setProperty('--i', i);
      s.classList.add('reveal');
    });
  }

  /* ─── 3D Tilt + Glow sur les cartes ─── */
  var tiltCards = doc.querySelectorAll('.tile, .step, .feature');

  tiltCards.forEach(function (card) {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--gx', '50%');
    card.style.setProperty('--gy', '50%');

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = rect.width / 2;
      var cy = rect.height / 2;

      card.style.setProperty('--rx', ((y - cy) / cy * -6).toFixed(1) + 'deg');
      card.style.setProperty('--ry', ((x - cx) / cx * 6).toFixed(1) + 'deg');
      card.style.setProperty('--gx', (x / rect.width * 100).toFixed(0) + '%');
      card.style.setProperty('--gy', (y / rect.height * 100).toFixed(0) + '%');
    });

    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--gx', '50%');
      card.style.setProperty('--gy', '50%');
    });
  });

  /* ─── Ripple effect ─── */
  var rippleBtns = doc.querySelectorAll('.btn-primary');

  rippleBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (btn.disabled) return;
      var r = doc.createElement('span');
      r.className = 'ripple';
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left - size / 2) + 'px';
      r.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(r);
      r.addEventListener('animationend', function () { r.remove(); });
    });
  });

  /* ─── Floating label inputs ─── */
  var inputs = doc.querySelectorAll('.input-group input, .input-group textarea');
  inputs.forEach(function (inp) {
    inp.addEventListener('input', function () {
      inp.classList.toggle('has-value', inp.value.length > 0);
    });
    if (inp.value.length > 0) inp.classList.add('has-value');
  });

  /* ─── Hero mesh gradient blobs (particules) ─── */
  var heroBg = doc.querySelector('.hero-bg');
  if (heroBg) {
    var particles = doc.createElement('div');
    particles.className = 'hero-particles';
    heroBg.appendChild(particles);

    for (var i = 0; i < 12; i++) {
      var dot = doc.createElement('span');
      dot.className = 'particle';
      dot.style.left = (Math.random() * 100).toFixed(0) + '%';
      dot.style.top = (Math.random() * 100).toFixed(0) + '%';
      dot.style.width = dot.style.height = (2 + Math.random() * 4).toFixed(0) + 'px';
      dot.style.animationDelay = (Math.random() * 8).toFixed(1) + 's';
      dot.style.animationDuration = (8 + Math.random() * 10).toFixed(1) + 's';
      particles.appendChild(dot);
    }
  }

  /* ─── Snap au scroll pour header active link ─── */
  var links = doc.querySelectorAll('.header-nav a[href^="#"]');
  var sections = [];
  links.forEach(function (a) {
    var target = doc.querySelector(a.getAttribute('href'));
    if (target) sections.push({ el: target, link: a });
  });
  if (sections.length) {
    win.addEventListener('scroll', function () {
      var scrollY = win.scrollY + 120;
      var active = null;
      sections.forEach(function (s) {
        var top = s.el.offsetTop;
        var bottom = top + s.el.offsetHeight;
        if (scrollY >= top && scrollY < bottom) active = s.link;
      });
      sections.forEach(function (s) {
        s.link.classList.toggle('nav-active', s.link === active);
      });
    });
  }

})();
