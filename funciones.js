(function () {
  var navLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));

  function updateCurrentNav(targetId) {
    navLinks.forEach(function (link) {
      var isCurrent = link.getAttribute('href') === '#' + targetId;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if (navLinks.length) {
    var observedSections = navLinks
      .map(function (link) {
        var id = link.getAttribute('href').slice(1);
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (observedSections.length && 'IntersectionObserver' in window) {
      var visibleRatios = new Map();
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        var topSection = observedSections
          .map(function (section) {
            return {
              id: section.id,
              ratio: visibleRatios.get(section.id) || 0,
            };
          })
          .sort(function (a, b) {
            return b.ratio - a.ratio;
          })[0];

        if (topSection && topSection.ratio > 0.05) {
          updateCurrentNav(topSection.id);
        }
      }, { threshold: [0.1, 0.25, 0.45, 0.65], rootMargin: '-20% 0px -45% 0px' });

      observedSections.forEach(function (section) {
        observer.observe(section);
      });
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var id = link.getAttribute('href').slice(1);
        updateCurrentNav(id);
      });
    });

    var initial = navLinks[0].getAttribute('href').slice(1);
    updateCurrentNav(initial);
  }

  var slider = document.querySelector('[data-slider]');
  if (slider) {
    var slides = Array.from(slider.querySelectorAll('[data-slide]'));
    var metas = Array.from(slider.querySelectorAll('[data-slide-meta]'));
    var dots = Array.from(slider.querySelectorAll('[data-slider-dot]'));
    var prev = slider.querySelector('[data-slider-prev]');
    var next = slider.querySelector('[data-slider-next]');
    var current = 0;

    function render(index) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });

      dots.forEach(function (dot, i) {
        var isActive = i === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      metas.forEach(function (meta, i) {
        meta.classList.toggle('is-active', i === index);
      });

      current = index;
    }

    prev.addEventListener('click', function () {
      var nextIndex = (current - 1 + slides.length) % slides.length;
      render(nextIndex);
    });

    next.addEventListener('click', function () {
      var nextIndex = (current + 1) % slides.length;
      render(nextIndex);
    });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = Number(dot.getAttribute('data-slider-dot'));
        render(index);
      });
    });

    render(0);
  }

  var images = Array.from(document.querySelectorAll('img'));
  if (!images.length) {
    return;
  }

  var supportsHover = window.matchMedia('(hover: hover)').matches;
  var synth = window.speechSynthesis;
  var voiceSupported = typeof window.SpeechSynthesisUtterance !== 'undefined' && !!synth;

  function getDescription(img) {
    var description = img.getAttribute('data-hover-description') || img.getAttribute('alt') || img.getAttribute('title');
    return description && description.trim() ? description.trim() : '';
  }

  function stopSpeech() {
    if (voiceSupported) {
      synth.cancel();
    }
  }

  function speakDescription(img) {
    if (!voiceSupported) {
      return;
    }

    var description = getDescription(img);
    if (!description) {
      return;
    }

    stopSpeech();
    var utterance = new SpeechSynthesisUtterance(description);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    synth.speak(utterance);
  }

  images.forEach(function (img) {
    img.setAttribute('aria-describedby', 'image-hover-audio-help');
  });

  var helpNode = document.getElementById('image-hover-audio-help');
  if (!helpNode) {
    helpNode = document.createElement('p');
    helpNode.id = 'image-hover-audio-help';
    helpNode.className = 'sr-only';
    helpNode.textContent = 'Al pasar el cursor sobre una imagen, se leera su descripcion en voz alta.';
    document.body.appendChild(helpNode);
  }

  images.forEach(function (img) {
    img.addEventListener('mouseenter', function () {
      speakDescription(img);
    });

    img.addEventListener('mouseleave', stopSpeech);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopSpeech();
    }
  });

  if (!supportsHover) {
    return;
  }

  var tooltip = document.createElement('div');
  tooltip.className = 'image-hover-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);

  var offset = 16;

  function placeTooltip(event) {
    var maxX = window.innerWidth - tooltip.offsetWidth - 10;
    var maxY = window.innerHeight - tooltip.offsetHeight - 10;
    var x = Math.min(event.clientX + offset, maxX);
    var y = Math.min(event.clientY + offset, maxY);

    tooltip.style.left = Math.max(10, x) + 'px';
    tooltip.style.top = Math.max(10, y) + 'px';
  }

  function hideTooltip() {
    tooltip.classList.remove('is-visible');
  }

  function showTooltip(event) {
    var description = getDescription(this);
    if (!description) {
      return;
    }

    tooltip.textContent = description;
    tooltip.classList.add('is-visible');
    placeTooltip(event);
  }

  function moveTooltip(event) {
    if (tooltip.classList.contains('is-visible')) {
      placeTooltip(event);
    }
  }

  images.forEach(function (img) {
    img.addEventListener('mouseenter', showTooltip);
    img.addEventListener('mousemove', moveTooltip);
    img.addEventListener('mouseleave', hideTooltip);
  });

  window.addEventListener('scroll', hideTooltip, { passive: true });
})();
