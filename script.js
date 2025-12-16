(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, limit);
      }
    };
  }

  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  function initBurgerMenu() {
    if (app.__burgerInit) return;
    app.__burgerInit = true;

    var toggle = document.querySelector('.c-nav__toggle');
    var nav = document.querySelector('.c-nav');
    var menu = document.querySelector('.c-nav__menu');
    var links = document.querySelectorAll('.c-nav__link');

    if (!toggle || !nav || !menu) return;

    var isOpen = false;

    function closeMenu() {
      if (!isOpen) return;
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function openMenu() {
      if (isOpen) return;
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
    }

    function toggleMenu() {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMenu();
    });

    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function() {
        if (window.innerWidth < 1024) {
          closeMenu();
        }
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    window.addEventListener('resize', debounce(function() {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    }, 150));
  }

  function initSmoothScroll() {
    if (app.__smoothScrollInit) return;
    app.__smoothScrollInit = true;

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      var hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      var hash = href.substring(hashIndex);
      var path = href.substring(0, hashIndex);

      var currentPath = window.location.pathname;
      var isSamePage = !path || path === currentPath || 
                       (path === '/' && currentPath.match(//index.html?$/i)) ||
                       (path === '/index.html' && currentPath === '/');

      if (!isSamePage) return;

      var targetElement = document.querySelector(hash);
      if (!targetElement) return;

      e.preventDefault();

      var header = document.querySelector('.l-header');
      var offset = header ? header.offsetHeight : 80;
      var elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      var offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      history.pushState(null, null, hash);
    });
  }

  function initScrollSpy() {
    if (app.__scrollSpyInit) return;
    app.__scrollSpyInit = true;

    var navLinks = document.querySelectorAll('.c-nav__link');
    var sections = [];

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var href = link.getAttribute('href');
      if (href && href.indexOf('#') !== -1) {
        var hash = href.substring(href.indexOf('#'));
        var section = document.querySelector(hash);
        if (section) {
          sections.push({
            link: link,
            section: section,
            hash: hash
          });
        }
      }
    }

    if (sections.length === 0) return;

    function updateActiveLink() {
      var scrollPos = window.pageYOffset + 100;

      for (var i = sections.length - 1; i >= 0; i--) {
        var item = sections[i];
        if (item.section.offsetTop <= scrollPos) {
          for (var j = 0; j < sections.length; j++) {
            sections[j].link.classList.remove('active');
            sections[j].link.removeAttribute('aria-current');
          }
          item.link.classList.add('active');
          item.link.setAttribute('aria-current', 'page');
          break;
        }
      }
    }

    window.addEventListener('scroll', throttle(updateActiveLink, 100));
    updateActiveLink();
  }

  function initImages() {
    if (app.__imagesInit) return;
    app.__imagesInit = true;

    var images = document.querySelectorAll('img');

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      var hasLoading = img.hasAttribute('loading');
      var isCritical = img.hasAttribute('data-critical');
      var isLogo = img.classList.contains('c-logo__img');

      if (!hasLoading && !isCritical && !isLogo) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function(e) {
        var failedImg = e.target;
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e9ecef" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#6c757d" font-family="sans-serif" font-size="18">Bild nicht verfügbar</text></svg>';
        var svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        failedImg.src = svgDataUrl;
        failedImg.style.objectFit = 'contain';
      });
    }
  }

  function initIntersectionObserver() {
    if (app.__observerInit) return;
    app.__observerInit = true;

    if (!('IntersectionObserver' in window)) return;

    var cards = document.querySelectorAll('.card, .c-card, .c-service-card, .c-contact-card, .c-solution-card, .c-emergency-card, .c-feature-item');
    
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
          
          setTimeout(function() {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 50);
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    for (var i = 0; i < cards.length; i++) {
      observer.observe(cards[i]);
    }
  }

  function initButtonEffects() {
    if (app.__buttonEffectsInit) return;
    app.__buttonEffectsInit = true;

    var buttons = document.querySelectorAll('.btn, .c-button, button[type="submit"], .c-nav__link, a[class*="btn"]');

    for (var i = 0; i < buttons.length; i++) {
      (function(button) {
        button.addEventListener('mouseenter', function() {
          this.style.transition = 'all 0.3s ease-out';
        });

        button.addEventListener('click', function(e) {
          var ripple = document.createElement('span');
          var rect = this.getBoundingClientRect();
          var size = Math.max(rect.width, rect.height);
          var x = e.clientX - rect.left - size / 2;
          var y = e.clientY - rect.top - size / 2;

          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.style.position = 'absolute';
          ripple.style.borderRadius = '50%';
          ripple.style.background = 'rgba(255, 255, 255, 0.5)';
          ripple.style.transform = 'scale(0)';
          ripple.style.animation = 'ripple 0.6s ease-out';
          ripple.style.pointerEvents = 'none';

          var style = document.createElement('style');
          if (!document.getElementById('ripple-animation')) {
            style.id = 'ripple-animation';
            style.innerHTML = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
            document.head.appendChild(style);
          }

          var parent = this;
          var originalPosition = window.getComputedStyle(this).position;
          if (originalPosition === 'static') {
            parent.style.position = 'relative';
          }
          parent.style.overflow = 'hidden';

          this.appendChild(ripple);

          setTimeout(function() {
            ripple.remove();
          }, 600);
        });
      })(buttons[i]);
    }
  }

  function initCountUp() {
    if (app.__countUpInit) return;
    app.__countUpInit = true;

    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    function animateCount(element) {
      var target = parseInt(element.getAttribute('data-count'), 10);
      var duration = parseInt(element.getAttribute('data-duration'), 10) || 2000;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = timestamp - startTime;
        var percentage = Math.min(progress / duration, 1);
        var current = Math.floor(percentage * target);
        
        element.textContent = current.toLocaleString('de-DE');
        
        if (percentage < 1) {
          requestAnimationFrame(step);
        } else {
          element.textContent = target.toLocaleString('de-DE');
        }
      }

      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !entry.target.hasAttribute('data-counted')) {
            entry.target.setAttribute('data-counted', 'true');
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      for (var i = 0; i < counters.length; i++) {
        observer.observe(counters[i]);
      }
    } else {
      for (var j = 0; j < counters.length; j++) {
        animateCount(counters[j]);
      }
    }
  }

  function initFormValidation() {
    if (app.__formValidationInit) return;
    app.__formValidationInit = true;

    var forms = document.querySelectorAll('.c-form, form');

    var validators = {
      name: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben)'
      },
      email: {
        pattern: /^[^s@]+@[^s@]+.[^s@]+$/,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      },
      phone: {
        pattern: /^[ds+-()]{10,20}$/,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)'
      },
      message: {
        minLength: 10,
        message: 'Bitte geben Sie mindestens 10 Zeichen ein'
      }
    };

    function showError(input, message) {
      input.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      
      var errorId = input.id + '-error';
      var existingError = document.getElementById(errorId);
      
      if (existingError) {
        existingError.textContent = message;
      } else {
        var errorSpan = document.createElement('span');
        errorSpan.id = errorId;
        errorSpan.className = 'c-form__error';
        errorSpan.textContent = message;
        errorSpan.setAttribute('role', 'alert');
        
        var parent = input.parentElement;
        parent.appendChild(errorSpan);
      }
      
      input.setAttribute('aria-describedby', errorId);
    }

    function clearError(input) {
      input.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      
      var errorId = input.id + '-error';
      var existingError = document.getElementById(errorId);
      
      if (existingError) {
        existingError.remove();
      }
      
      input.removeAttribute('aria-describedby');
    }

    function validateField(input) {
      clearError(input);

      if (input.hasAttribute('required') && !input.value.trim()) {
        var fieldName = input.previousElementSibling ? input.previousElementSibling.textContent.replace('*', '').trim() : 'Dieses Feld';
        showError(input, fieldName + ' ist erforderlich');
        return false;
      }

      if (input.type === 'email' && input.value) {
        if (!validators.email.pattern.test(input.value)) {
          showError(input, validators.email.message);
          return false;
        }
      }

      if (input.type === 'tel' && input.value) {
        if (!validators.phone.pattern.test(input.value)) {
          showError(input, validators.phone.message);
          return false;
        }
      }

      if (input.name === 'name' && input.value) {
        if (!validators.name.pattern.test(input.value)) {
          showError(input, validators.name.message);
          return false;
        }
      }

      if (input.tagName === 'TEXTAREA' && input.value) {
        if (input.value.length < validators.message.minLength) {
          showError(input, validators.message.message);
          return false;
        }
      }

      if (input.type === 'checkbox' && input.hasAttribute('required') && !input.checked) {
        showError(input, 'Bitte akzeptieren Sie die Datenschutzerklärung');
        return false;
      }

      return true;
    }

    for (var i = 0; i < forms.length; i++) {
      (function(form) {
        var inputs = form.querySelectorAll('input, textarea, select');
        
        for (var j = 0; j < inputs.length; j++) {
          (function(input) {
            input.addEventListener('blur', function() {
              validateField(input);
            });

            input.addEventListener('input', function() {
              if (input.classList.contains('has-error')) {
                validateField(input);
              }
            });
          })(inputs[j]);
        }

        form.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var isValid = true;
          var firstInvalidField = null;

          for (var k = 0; k < inputs.length; k++) {
            if (!validateField(inputs[k])) {
              isValid = false;
              if (!firstInvalidField) {
                firstInvalidField = inputs[k];
              }
            }
          }

          if (!isValid) {
            if (firstInvalidField) {
              firstInvalidField.focus();
            }
            return;
          }

          var submitBtn = form.querySelector('button[type="submit"], .c-form__submit');
          if (submitBtn) {
            submitBtn.disabled = true;
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;"></span>Wird gesendet...';

            var style = document.createElement('style');
            if (!document.getElementById('spinner-animation')) {
              style.id = 'spinner-animation';
              style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
              document.head.appendChild(style);
            }

            setTimeout(function() {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
              
              form.reset();
              
              var successMessage = 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.';
              if (typeof app.notify === 'function') {
                app.notify(successMessage, 'success');
              } else {
                alert(successMessage);
              }
              
              setTimeout(function() {
                window.location.href = 'thank_you.html';
              }, 1500);
            }, 2000);
          }
        });
      })(forms[i]);
    }
  }

  function initScrollToTop() {
    if (app.__scrollTopInit) return;
    app.__scrollTopInit = true;

    var button = document.createElement('button');
    button.className = 'c-scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Nach oben scrollen');
    button.style.cssText = 'position:fixed;bottom:30px;right:30px;width:50px;height:50px;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:#fff;border:none;border-radius:50%;cursor:pointer;box-shadow:var(--shadow-lg);opacity:0;visibility:hidden;transition:all 0.3s ease;z-index:1000;font-size:24px;display:flex;align-items:center;justify-content:center;';

    document.body.appendChild(button);

    function toggleButton() {
      if (window.pageYOffset > 300) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    }

    window.addEventListener('scroll', throttle(toggleButton, 100));

    button.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.1)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  }

  function initPrivacyModal() {
    if (app.__privacyModalInit) return;
    app.__privacyModalInit = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"]');
    
    for (var i = 0; i < privacyLinks.length; i++) {
      (function(link) {
        var href = link.getAttribute('href');
        if (href && (href.indexOf('privacy.html') !== -1 || href.indexOf('#privacy') !== -1)) {
          link.addEventListener('click', function(e) {
            var targetPage = href.indexOf('privacy.html') !== -1;
            if (targetPage && window.location.pathname.indexOf('privacy') === -1) {
              return;
            }
          });
        }
      })(privacyLinks[i]);
    }
  }

  app.notify = function(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;min-width:300px;max-width:400px;';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    var bgColor = type === 'success' ? '#10b981' : type === 'danger' ? '#dc2626' : '#3b82f6';
    toast.style.cssText = 'background:' + bgColor + ';color:#fff;padding:16px 20px;border-radius:10px;margin-bottom:10px;box-shadow:var(--shadow-lg);display:flex;align-items:center;justify-content:space-between;animation:slideIn 0.3s ease-out;';
    
    var messageSpan = document.createElement('span');
    messageSpan.textContent = escapeHtml(message);
    toast.appendChild(messageSpan);

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:#fff;font-size:24px;cursor:pointer;margin-left:12px;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;';
    closeBtn.setAttribute('aria-label', 'Schließen');
    toast.appendChild(closeBtn);

    var style = document.createElement('style');
    if (!document.getElementById('toast-animation')) {
      style.id = 'toast-animation';
      style.innerHTML = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
      document.head.appendChild(style);
    }

    container.appendChild(toast);

    closeBtn.addEventListener('click', function() {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(function() {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    });

    setTimeout(function() {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(function() {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 5000);
  };

  app.init = function() {
    if (app.__initialized) return;
    app.__initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initImages();
    initIntersectionObserver();
    initButtonEffects();
    initCountUp();
    initFormValidation();
    initScrollToTop();
    initPrivacyModal();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();
