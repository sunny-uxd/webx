/* ============================================================
   PORTFOLIO — INTERACTION & ANIMATION ENGINE
   ============================================================ */

(function () {
  'use strict';

  /* --------------------------------------------------------
     NAV — Scroll state & mobile toggle
     -------------------------------------------------------- */

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Scroll-based nav style
  let lastScrollY = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    lastScrollY = scrollY;
  }

  // Mobile toggle
  navToggle.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('is-open');
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });


  /* --------------------------------------------------------
     HERO — INTERACTIVE 3D PARTICLE WAVE (SILK DATA ENGINE)
     -------------------------------------------------------- */

  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = null;

    // Grid configuration
    let cols = 76;
    let rows = 42;
    let particles = [];

    // Micro-interaction glyphs (*, +, ×, □, ○, ✦, ✧)
    const glyphChars = ['*', '+', '×', '□', '○', '✦', '✧', '•'];
    let glyphs = [];
    let lastGlyphSpawn = 0;

    // Mouse tracking & spring physics state
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      vx: 0,
      vy: 0,
      lastX: -9999,
      lastY: -9999,
      active: false,
      idleTimer: null
    };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Particle density adapted to screen size
      if (width < 768) {
        cols = 46;
        rows = 26;
      } else if (width < 1200) {
        cols = 62;
        rows = 34;
      } else {
        cols = 76;
        rows = 42;
      }

      buildParticles();
    }

    function buildParticles() {
      particles = [];
      for (let r = 0; r < rows; r++) {
        const v = r / (rows - 1);
        for (let c = 0; c < cols; c++) {
          const u = c / (cols - 1);

          particles.push({
            u: u,
            v: v,
            col: c,
            row: r,
            // Offsets perturbed by spring physics
            ox: 0,
            oy: 0,
            oz: 0,
            // Velocities
            vx: 0,
            vy: 0,
            vz: 0,
            // Projected screen coords
            projX: 0,
            projY: 0,
            scale: 1
          });
        }
      }
    }

    // Pointer event handlers
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);

      if (clientX === null || clientY === null) return;

      mouse.targetX = clientX - rect.left;
      mouse.targetY = clientY - rect.top;

      if (!mouse.active) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
        mouse.lastX = mouse.targetX;
        mouse.lastY = mouse.targetY;
      }

      mouse.active = true;
      clearTimeout(mouse.idleTimer);
      mouse.idleTimer = setTimeout(function () {
        mouse.active = false;
      }, 2400);
    }

    function onPointerLeave() {
      mouse.active = false;
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('touchend', onPointerLeave);
    window.addEventListener('resize', resize);

    resize();

    // 3D Oblique Perspective Rotation Matrix (pitch, yaw, roll)
    const pitch = 0.52; // ~30 deg downward view
    const yaw = -0.36;  // ~ -21 deg facing slightly left
    const roll = 0.08;  // subtle horizon roll

    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);

    let time = 0;

    function render() {
      time += 0.0075;

      // Smooth cursor interpolation & velocity
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.16;
        mouse.y += (mouse.targetY - mouse.y) * 0.16;
        mouse.vx = mouse.x - mouse.lastX;
        mouse.vy = mouse.y - mouse.lastY;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
      } else {
        mouse.vx *= 0.85;
        mouse.vy *= 0.85;
      }

      // Micro-interactions: enhanced glyph emission (*, +, ×, □, ○, ✦, ✧)
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);
      if (mouse.active && mouseSpeed > 0.4 && glyphs.length < 14 && (time - lastGlyphSpawn > 0.14)) {
        const chosenChar = glyphChars[Math.floor(Math.random() * glyphChars.length)];
        glyphs.push({
          x: mouse.x + (Math.random() - 0.5) * 85,
          y: mouse.y + (Math.random() - 0.5) * 65,
          char: chosenChar,
          vx: (Math.random() - 0.5) * 0.75 + mouse.vx * 0.08,
          vy: -0.45 - Math.random() * 0.55,
          life: 0,
          maxLife: 85 + Math.floor(Math.random() * 40),
          size: 13 + Math.floor(Math.random() * 6)
        });
        lastGlyphSpawn = time;
      }

      ctx.clearRect(0, 0, width, height);

      // Wave layout configuration: expansive width across hero
      const isMobile = width < 768;
      const waveCenterX = isMobile ? width * 0.52 : width * 0.62;
      const waveCenterY = isMobile ? height * 0.52 : height * 0.48;

      const waveSpanX = isMobile ? width * 1.15 : width * 1.08;
      const waveSpanZ = 760;
      const focalLength = 680;

      // Spring physics parameters (yielding silk-like data flow)
      const spring = 0.042;
      const damping = 0.88;
      const influenceRadius = isMobile ? 160 : 230;

      const len = particles.length;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // 1. Multi-frequency organic wave harmonics
        const wave1 = Math.sin(p.col * 0.088 + time * 1.05) * 44;
        const wave2 = Math.cos(p.row * 0.11 - time * 0.75) * 36;
        const wave3 = Math.sin((p.col * 0.055 + p.row * 0.065) + time * 1.35) * 24;
        const wave4 = Math.cos((p.col * 0.035 - p.row * 0.08) - time * 0.95) * 16;
        const slant = (p.u - 0.5) * 55 - (p.v - 0.5) * 75;

        const baseWaveY = wave1 + wave2 + wave3 + wave4 + slant;

        // Base 3D coordinates relative to wave center
        const bx = (p.u - 0.5) * waveSpanX;
        const by = baseWaveY;
        const bz = (p.v - 0.5) * waveSpanZ;

        // 2. Cursor interaction using spring physics & fluid ripple
        if (mouse.active) {
          const dist = Math.hypot(p.projX - mouse.x, p.projY - mouse.y);
          if (dist < influenceRadius && dist > 0.001) {
            const nd = dist / influenceRadius;
            // Smooth cubic falloff for silk-like deformation
            const falloff = (1 - nd) * (1 - nd) * (1 - nd);

            // Silk deflection and trailing attraction
            const angle = Math.atan2(p.projY - mouse.y, p.projX - mouse.x);
            const push = 34 * falloff;
            const trailX = mouse.vx * 0.32 * falloff;
            const trailY = mouse.vy * 0.32 * falloff;

            // Fluid ripple wave along depth
            const ripple = Math.sin(nd * Math.PI * 3.5 - time * 5.5) * 36 * falloff;

            p.vx += (Math.cos(angle) * push * 0.075 + trailX * 0.12);
            p.vy += (Math.sin(angle) * push * 0.075 + trailY * 0.12);
            p.vz += ripple * 0.075;
          }
        }

        // Spring restoration and velocity damping
        p.vx += -p.ox * spring;
        p.vy += -p.oy * spring;
        p.vz += -p.oz * spring;

        p.vx *= damping;
        p.vy *= damping;
        p.vz *= damping;

        p.ox += p.vx;
        p.oy += p.vy;
        p.oz += p.vz;

        // Combined 3D position
        const x3 = bx + p.ox;
        const y3 = by + p.oy;
        const z3 = bz + p.oz;

        // 3. 3D Rotation (yaw -> pitch -> roll)
        const x_yaw = x3 * cosYaw + z3 * sinYaw;
        const y_yaw = y3;
        const z_yaw = -x3 * sinYaw + z3 * cosYaw;

        const x_pitch = x_yaw;
        const y_pitch = y_yaw * cosPitch - z_yaw * sinPitch;
        const z_pitch = y_yaw * sinPitch + z_yaw * cosPitch;

        const rotX = x_pitch * cosRoll - y_pitch * sinRoll;
        const rotY = x_pitch * sinRoll + y_pitch * cosRoll;
        const rotZ = z_pitch;

        // 4. Perspective Projection
        const zDist = focalLength + rotZ;
        if (zDist < 20) continue;

        const scale = focalLength / zDist;
        const projX = waveCenterX + rotX * scale;
        const projY = waveCenterY + rotY * scale;

        p.projX = projX;
        p.projY = projY;
        p.scale = scale;

        // 5. Draw tiny white particle with refined contrast
        const edgeU = Math.sin(p.u * Math.PI);
        const edgeV = Math.sin(p.v * Math.PI);
        const edgeFade = Math.pow(Math.max(0, edgeU * edgeV), 0.62);

        // Alpha calculation: depth modulated, crisp definition
        const depthAlpha = 0.10 + 0.38 * Math.min(1.2, Math.max(0.2, scale));
        const alpha = depthAlpha * edgeFade;

        if (alpha > 0.015) {
          // Particle size: 0.85px to 1.8px
          const size = Math.max(0.85, (0.7 + scale * 0.75));

          ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
          ctx.fillRect(projX - size * 0.5, projY - size * 0.5, size, size);
        }
      }

      // Render prominent micro-interaction glyphs (*, +, ×, □, ○, ✦, ✧)
      if (glyphs.length > 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let g = glyphs.length - 1; g >= 0; g--) {
          const item = glyphs[g];
          item.life++;
          item.x += item.vx;
          item.y += item.vy;

          const progress = item.life / item.maxLife;
          // Substantially increased peak visibility: 0.65 alpha with glowing presence
          const glyphAlpha = Math.sin(progress * Math.PI) * 0.65;

          if (glyphAlpha > 0.01 && item.life < item.maxLife) {
            ctx.font = '500 ' + item.size + 'px -apple-system, BlinkMacSystemFont, "Inter", monospace';
            // Subtle glow effect behind the glyph for high visibility against black
            ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = 'rgba(255, 255, 255, ' + glyphAlpha.toFixed(3) + ')';
            ctx.fillText(item.char, item.x, item.y);
            // Reset shadow
            ctx.shadowBlur = 0;
          } else {
            glyphs.splice(g, 1);
          }
        }
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    window.addEventListener('beforeunload', function () {
      if (animId) cancelAnimationFrame(animId);
    });
  }

  // Initialize hero canvas immediately
  initHeroCanvas();


  /* --------------------------------------------------------
     REVEAL — Intersection Observer for scroll animations
     -------------------------------------------------------- */

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    // Hero text reveal (fires immediately on load after a short delay)
    const heroHeadline = document.querySelector('.hero__headline');
    const heroSub = document.querySelector('.hero__sub');

    if (heroHeadline) {
      setTimeout(function () {
        heroHeadline.classList.add('is-visible');
      }, 300);
    }

    if (heroSub) {
      setTimeout(function () {
        heroSub.classList.add('is-visible');
      }, 300);
    }

    // Scroll-triggered reveal for all .reveal-fade elements
    const revealElements = document.querySelectorAll('.reveal-fade');

    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Stagger children if inside a grid
            const parent = entry.target.parentElement;
            if (parent && (parent.classList.contains('expertise__grid') || parent.classList.contains('process__steps'))) {
              const siblings = Array.from(parent.querySelectorAll('.reveal-fade'));
              const index = siblings.indexOf(entry.target);
              entry.target.style.transitionDelay = (index * 0.1) + 's';
            }

            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    revealElements.forEach(function (el) {
      // Skip hero sub and metric-item (handled separately)
      if (!el.classList.contains('hero__sub') && !el.classList.contains('metric-item')) {
        revealObserver.observe(el);
      }
    });
  } else {
    // If reduced motion, make everything visible immediately
    document.querySelectorAll('.reveal-fade, .hero__headline, .hero__sub').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }





  /* --------------------------------------------------------
     ACTIVE NAV LINK — Highlight current section
     -------------------------------------------------------- */

  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');

  function highlightActiveSection() {
    const scrollY = window.scrollY + nav.offsetHeight + 100;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navAnchors.forEach(function (a) {
          a.style.color = '';
          if (a.getAttribute('href') === '#' + id) {
            a.style.color = 'var(--color-fg)';
          }
        });
      }
    });
  }


  /* --------------------------------------------------------
     CURSOR TRACKER — Subtle cursor interaction (desktop only)
     -------------------------------------------------------- */

  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const projectCards = document.querySelectorAll('.project');

    projectCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        const image = card.querySelector('.project__image');
        if (image) {
          image.style.transform = 'scale(1.02) translate(' + (x * 3) + 'px, ' + (y * 3) + 'px)';
        }
      });

      card.addEventListener('mouseleave', function () {
        const image = card.querySelector('.project__image');
        if (image) {
          image.style.transform = '';
        }
      });
    });
  }


  /* --------------------------------------------------------
     SERVICE CARDS — Reveal animation on scroll
     -------------------------------------------------------- */

  if (!prefersReducedMotion) {
    const svcCards = document.querySelectorAll('.svc-card');

    const svcObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('svc-card--visible');
            svcObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
      }
    );

    svcCards.forEach(function (card) {
      svcObserver.observe(card);
    });
  }


  /* --------------------------------------------------------
     CASE STUDIES — Full-Screen Carousel with Autoplay
     -------------------------------------------------------- */

  function initCaseStudyCarousel() {
    var carousel = document.getElementById('csCarousel');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('.cs-slide');
    var dots = carousel.querySelectorAll('.cs-carousel__dot');
    var prevBtn = document.getElementById('csCarouselPrev');
    var nextBtn = document.getElementById('csCarouselNext');

    if (slides.length === 0) return;

    var currentIndex = 0;
    var totalSlides = slides.length;
    var autoplayInterval = null;
    var autoplayDelay = 5000; // 5 seconds
    var isHovered = false;

    // Initialize first slide
    slides[0].classList.add('cs-slide--active');

    function goToSlide(index) {
      if (index === currentIndex) return;

      // Remove active from current
      slides[currentIndex].classList.remove('cs-slide--active');
      dots[currentIndex].classList.remove('cs-carousel__dot--active');

      // Reset progress animation on old dot
      var oldProgress = dots[currentIndex].querySelector('.cs-carousel__dot-progress');
      if (oldProgress) {
        oldProgress.style.animation = 'none';
        oldProgress.offsetHeight; // trigger reflow
        oldProgress.style.animation = '';
      }

      // Set new active
      currentIndex = index;
      slides[currentIndex].classList.add('cs-slide--active');
      dots[currentIndex].classList.add('cs-carousel__dot--active');

      // Restart progress animation on new dot
      var newProgress = dots[currentIndex].querySelector('.cs-carousel__dot-progress');
      if (newProgress) {
        newProgress.style.animation = 'none';
        newProgress.offsetHeight; // trigger reflow
        newProgress.style.animation = 'csAutoplayProgress ' + (autoplayDelay / 1000) + 's linear forwards';
      }
    }

    function nextSlide() {
      var next = (currentIndex + 1) % totalSlides;
      goToSlide(next);
    }

    function prevSlide() {
      var prev = (currentIndex - 1 + totalSlides) % totalSlides;
      goToSlide(prev);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(function () {
        if (!isHovered) {
          nextSlide();
        }
      }, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    function resetAutoplay() {
      startAutoplay();
    }

    // Arrow navigation
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        nextSlide();
        resetAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        prevSlide();
        resetAutoplay();
      });
    }

    // Dot navigation
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var targetIndex = parseInt(this.getAttribute('data-dot'), 10);
        if (!isNaN(targetIndex) && targetIndex !== currentIndex) {
          goToSlide(targetIndex);
          resetAutoplay();
        }
      });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', function () {
      isHovered = true;
    });

    carousel.addEventListener('mouseleave', function () {
      isHovered = false;
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      // Only respond if carousel is somewhat in view
      var rect = carousel.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      if (e.key === 'ArrowRight') {
        nextSlide();
        resetAutoplay();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
        resetAutoplay();
      }
    });

    // Start autoplay when section is in view
    var carouselObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.1 }
    );

    carouselObserver.observe(carousel);

    // Header reveal
    var csHeaderReveal = document.querySelector('.casestudies__header-inner.cs-reveal');
    if (csHeaderReveal) {
      var headerObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('cs-visible');
              headerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );
      headerObserver.observe(csHeaderReveal);
    }
  }

  initCaseStudyCarousel();


  /* --------------------------------------------------------
     NAV INVERSION — Dark/light based on white services section
     -------------------------------------------------------- */

  const lightSectionIds = ['services', 'about'];

  function handleNavInversion() {
    const navRect = nav.getBoundingClientRect();
    const navMid = navRect.top + navRect.height * 0.5;

    const isOverLight = lightSectionIds.some(function (id) {
      const sec = document.getElementById(id);
      if (!sec) return false;
      const rect = sec.getBoundingClientRect();
      return rect.top <= navMid && rect.bottom >= navMid;
    });

    if (isOverLight) {
      nav.classList.add('nav--inverted');
    } else {
      nav.classList.remove('nav--inverted');
    }
  }


  /* --------------------------------------------------------
     SERVICES PARALLAX & ZOOM IN-OUT TRANSITION EFFECT
     -------------------------------------------------------- */

  const servicesHeaderInner = document.querySelector('.services__header-inner');
  const svcCardVisualImgs = document.querySelectorAll('.svc-card__visual img');
  const svcCardsList = Array.from(document.querySelectorAll('.svc-card'));

  function handleServicesParallax() {
    if (prefersReducedMotion) return;
    const windowH = window.innerHeight;

    // 1. Services Header Parallax
    if (servicesHeaderInner) {
      const sHeader = document.querySelector('.services__header');
      if (sHeader) {
        const rect = sHeader.getBoundingClientRect();
        if (rect.top < windowH && rect.bottom > 0) {
          const delta = (rect.top / windowH);
          servicesHeaderInner.style.transform = 'translateY(' + (delta * -40).toFixed(1) + 'px)';
        }
      }
    }

    // 2. Service Card Images — Zoom effect is strictly driven by hover on image (:hover in CSS)
    // No scroll-driven scaling on images, keeping them stable during section scroll.

    // 3. Stacking Cards Zoom Out / Scale Layering Transition
    svcCardsList.forEach(function (card, idx) {
      const inner = card.querySelector('.svc-card__inner');
      if (!inner) return;

      const nextCard = svcCardsList[idx + 1];
      if (nextCard) {
        const nextRect = nextCard.getBoundingClientRect();
        const stickyTarget = (idx + 1) * 12;

        if (nextRect.top < windowH && nextRect.top > stickyTarget) {
          const progress = (windowH - nextRect.top) / (windowH - stickyTarget);
          const clamped = Math.max(0, Math.min(1, progress));
          // Zoom out card smoothly from scale(1) down to scale(0.93)
          const scale = 1 - clamped * 0.07;
          const translateY = clamped * -10;
          const radius = clamped * 28;

          inner.style.transform = 'scale(' + scale.toFixed(4) + ') translateY(' + translateY.toFixed(1) + 'px)';
          inner.style.filter = 'none';
          inner.style.borderRadius = radius.toFixed(1) + 'px';
        } else if (nextRect.top <= stickyTarget) {
          // Fully covered / zoomed out in the background stack
          inner.style.transform = 'scale(0.93) translateY(-10px)';
          inner.style.filter = 'none';
          inner.style.borderRadius = '28px';
        } else {
          // Active card in full focus
          inner.style.transform = 'scale(1) translateY(0px)';
          inner.style.filter = 'none';
          inner.style.borderRadius = '0px';
        }
      } else {
        // Last card remains in full scale
        inner.style.transform = 'scale(1) translateY(0px)';
        inner.style.filter = 'none';
        inner.style.borderRadius = '0px';
      }
    });
  }


  /* --------------------------------------------------------
     SCROLL PROGRESS & SCROLL EVENT LISTENER
     -------------------------------------------------------- */

  const scrollProgressBar = document.getElementById('scrollProgressBar');

  function updateScrollProgress(scroll) {
    if (!scrollProgressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (scroll / maxScroll) * 100));
      scrollProgressBar.style.width = progress + '%';
    }
  }

  window.addEventListener('scroll', function () {
    handleNavScroll();
    handleNavInversion();
    updateScrollProgress(window.scrollY);
    handleServicesParallax();
    highlightActiveSection();
  }, { passive: true });

  /* --------------------------------------------------------
     ANCHOR NAVIGATION (Standard instant scrolling with nav offset)
     -------------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 70;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo(0, targetPosition);
      }
    });
  });





  /* --------------------------------------------------------
     METRICS — Count-up & Staggered Reveal Animation
     -------------------------------------------------------- */

  function initMetricsCounter() {
    const metricsSection = document.getElementById('metrics');
    if (!metricsSection) return;

    const metricItems = metricsSection.querySelectorAll('.metric-item');
    let hasAnimated = false;

    if (prefersReducedMotion) {
      metricItems.forEach(function (item) {
        const numEl = item.querySelector('.metric-item__num');
        if (numEl) {
          numEl.textContent = numEl.getAttribute('data-target') || '0';
        }
        item.classList.add('is-visible');
      });
      return;
    }

    function animateCount(el, target, duration, delay) {
      setTimeout(function () {
        const startTime = performance.now();
        const startVal = 0;

        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Refined easeOutQuart
          const ease = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(startVal + (target - startVal) * ease);

          el.textContent = current;

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = target;
          }
        }

        requestAnimationFrame(update);
      }, delay);
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;

            metricItems.forEach(function (item, index) {
              const numEl = item.querySelector('.metric-item__num');
              if (!numEl) return;

              const target = parseInt(numEl.getAttribute('data-target'), 10) || 0;
              const delay = index * 140; // Refined staggered timing

              item.style.transitionDelay = (index * 0.12) + 's';
              item.classList.add('is-visible');

              animateCount(numEl, target, 1700, delay);
            });

            observer.unobserve(metricsSection);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    observer.observe(metricsSection);
  }

  initMetricsCounter();


  /* --------------------------------------------------------
     CONTACT FORM — Functional Submission to sunny.rm66@gmail.com
     -------------------------------------------------------- */

  function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusBox = document.getElementById('formStatus');

    if (!form || !submitBtn || !statusBox) return;

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const companyInput = document.getElementById('company');
    const messageInput = document.getElementById('message');

    // Email validation helper
    function isValidEmail(val) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }

    // Phone validation helper (at least 7 digits, allowing +, spaces, hyphens, parens)
    function isValidPhone(val) {
      const clean = val.replace(/[\s\-\(\)\+\.]/g, '');
      return clean.length >= 7 && /^\d+$/.test(clean);
    }

    // Clear validation highlighting on input
    [nameInput, phoneInput, emailInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        if (this.classList.contains('is-invalid')) {
          this.classList.remove('is-invalid');
        }
        if (statusBox.classList.contains('is-error')) {
          statusBox.className = 'contact-form__status';
          statusBox.textContent = '';
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Check honeypot spam prevention
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        return;
      }

      // Reset previous validation styles
      if (nameInput) nameInput.classList.remove('is-invalid');
      if (phoneInput) phoneInput.classList.remove('is-invalid');
      if (emailInput) emailInput.classList.remove('is-invalid');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const companyVal = companyInput ? companyInput.value.trim() : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      // Validate required fields: Name, Email, Phone
      const errors = [];

      if (!nameVal) {
        errors.push('Name');
        if (nameInput) nameInput.classList.add('is-invalid');
      }

      if (!phoneVal) {
        errors.push('Phone');
        if (phoneInput) phoneInput.classList.add('is-invalid');
      } else if (!isValidPhone(phoneVal)) {
        errors.push('a valid Phone number');
        if (phoneInput) phoneInput.classList.add('is-invalid');
      }

      if (!emailVal) {
        errors.push('Email');
        if (emailInput) emailInput.classList.add('is-invalid');
      } else if (!isValidEmail(emailVal)) {
        errors.push('a valid Email address');
        if (emailInput) emailInput.classList.add('is-invalid');
      }

      if (errors.length > 0) {
        statusBox.className = 'contact-form__status is-visible is-error';
        statusBox.textContent = 'Please provide: ' + errors.join(', ') + '.';
        return;
      }

      // Prepare payload
      const payload = {
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        company: companyVal || 'N/A',
        message: messageVal || '(No additional message provided)',
        _subject: 'New Portfolio Inquiry from ' + nameVal,
        _captcha: 'false',
        _template: 'table'
      };

      // UI Submitting state
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending Inquiry...</span>';
      statusBox.className = 'contact-form__status';
      statusBox.textContent = '';

      fetch('https://formsubmit.co/ajax/sunny.rm66@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(function (data) {
          submitBtn.innerHTML = '<span>Inquiry Sent ✓</span>';
          statusBox.className = 'contact-form__status is-visible is-success';
          statusBox.textContent = "Your message has been received, and I'll respond shortly";
          form.reset();

          setTimeout(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
          }, 6000);
        })
        .catch(function (error) {
          console.warn('FormSubmit AJAX fallback triggered:', error);
          // Graceful fallback: submit via standard form POST to ensure mail delivery
          submitBtn.innerHTML = '<span>Redirecting to Send...</span>';
          statusBox.className = 'contact-form__status is-visible is-success';
          statusBox.textContent = 'Connecting directly with mail server...';
          form.submit();
        });
    });
  }

  initContactForm();


  /* --------------------------------------------------------
     TESTIMONIALS — Ultra-Premium Horizontal Editorial Slider
     -------------------------------------------------------- */

  function initTestimonialsSlider() {
    const slider = document.getElementById('testimonialsSlider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.testimonials__slide'));
    const indicators = Array.from(slider.querySelectorAll('.testimonials__indicator'));
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const currentCounter = document.getElementById('testimonialCurrent');

    if (slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoplayTimer = null;
    const autoplayDelay = 6500;
    let isHovered = false;

    function padZero(num) {
      return num < 10 ? '0' + num : String(num);
    }

    function goToSlide(index) {
      if (index === currentIndex) return;

      const oldSlide = slides[currentIndex];
      const newSlide = slides[index];

      // Remove active from old slide & indicator
      oldSlide.classList.remove('is-active');
      if (indicators[currentIndex]) {
        indicators[currentIndex].classList.remove('is-active');
      }

      currentIndex = index;

      // Add active to new slide & indicator
      newSlide.classList.add('is-active');
      if (indicators[currentIndex]) {
        indicators[currentIndex].classList.add('is-active');
      }

      // Update numerical counter
      if (currentCounter) {
        currentCounter.textContent = padZero(currentIndex + 1);
      }
    }

    function nextSlide() {
      const next = (currentIndex + 1) % totalSlides;
      goToSlide(next);
    }

    function prevSlide() {
      const prev = (currentIndex - 1 + totalSlides) % totalSlides;
      goToSlide(prev);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(function () {
        if (!isHovered) {
          nextSlide();
        }
      }, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      startAutoplay();
    }

    // Prev / Next click handlers
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        nextSlide();
        resetAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        prevSlide();
        resetAutoplay();
      });
    }

    // Indicator click handlers
    indicators.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetIndex = parseInt(this.getAttribute('data-slide'), 10);
        if (!isNaN(targetIndex) && targetIndex !== currentIndex) {
          goToSlide(targetIndex);
          resetAutoplay();
        }
      });
    });

    // Hover pause
    slider.addEventListener('mouseenter', function () {
      isHovered = true;
    });

    slider.addEventListener('mouseleave', function () {
      isHovered = false;
    });

    // Drag / Touch Swipe gesture handling
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 45;

    slider.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) >= minSwipeDistance) {
        if (diff < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        resetAutoplay();
      }
    }, { passive: true });

    // Keyboard navigation when section in view
    document.addEventListener('keydown', function (e) {
      const rect = slider.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      if (e.key === 'ArrowRight') {
        nextSlide();
        resetAutoplay();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
        resetAutoplay();
      }
    });

    // Start autoplay only when section intersects viewport
    const testimonialsSection = document.getElementById('testimonials');
    if (testimonialsSection) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.1 });

      observer.observe(testimonialsSection);
    }
  }

  initTestimonialsSlider();

  /* --------------------------------------------------------
     CASE STUDY FULL-SCREEN MODAL ENGINE & DATA
     -------------------------------------------------------- */

  function initCaseStudyModal() {
    const modal = document.getElementById('csModal');
    const modalContent = document.getElementById('csModalContent');
    const modalHeaderTitle = document.getElementById('csModalHeaderTitle');
    const modalCounter = document.getElementById('csModalCounter');
    const closeBtn = document.getElementById('csModalCloseBtn');
    const prevBtn = document.getElementById('csModalPrevBtn');
    const nextBtn = document.getElementById('csModalNextBtn');
    const backdrop = document.getElementById('csModalBackdrop');
    const scroller = document.getElementById('csModalScroller');

    if (!modal || !modalContent) return;

    let currentProjectIndex = 0;

    const caseStudiesData = [
      {
        id: "skysite-intelligence",
        title: "Skysite Intelligence",
        tag: "AI & Enterprise SaaS",
        subtitle: "Designing an intelligent conversational AI partner that empowers construction professionals to query complex archives and architectural drawing sets with zero latency.",
        image: "assets/skysite-intelligence.jpg",
        meta: {
          role: "Lead UI/UX & AI Product Designer",
          client: "Skysite Technologies",
          timeline: "14 Weeks (2025)",
          focus: "Conversational AI · Natural Language Querying · Enterprise Design System"
        },
        metrics: [
          { num: "68%", label: "Faster Query Retrieval Time" },
          { num: "4.9/5", label: "Field Engineer Usability Rating" },
          { num: "94.2%", label: "First-Attempt Prompt Accuracy" },
          { num: "+42%", label: "Weekly Active User Engagement" }
        ],
        challenge: {
          overview: "Architects and field superintendents manage thousands of blueprint revisions, submittals, and compliance specifications across multi-million dollar projects. Finding specific answers to urgent site questions historically required hours of manual digging through siloed document trees.",
          painPoints: [
            { num: "01", title: "Information Fragmentation", text: "Critical architectural changes buried across 50+ revision sets, causing costly on-site misalignments." },
            { num: "02", title: "Complex Query Latency", text: "Engineers spent an average of 45 minutes daily hunting through dense drawing indexes." },
            { num: "03", title: "Trust & Explainability Gap", text: "Users were hesitant to trust generative AI without verifiable visual citations on the blueprints." }
          ]
        },
        solution: {
          title: "Context-Aware Conversational Intelligence",
          desc: "We designed a multi-modal assistant that ingests large-scale architectural drawing sets, interprets CAD/PDF metadata, and provides natural conversational responses with pinpoint visual drawing callouts.",
          quote: "“Sunny designed a transparent AI interface that turned skeptical project managers into enthusiastic daily power users within weeks.”",
          features: [
            {
              title: "Interactive Visual Grounding & Citation Overlay",
              desc: "Every AI response highlights the exact sheet, room coordinate, and revision date on the interactive drawing viewer, giving engineers 100% confidence.",
              image: "assets/skysite-intelligence.jpg"
            },
            {
              title: "Domain-Aware Prompt Architecture",
              desc: "Engineered smart suggestion chips, voice-to-text field input, and specialized construction filters that guide users toward precise answers effortlessly.",
              image: "assets/service-ai-experience.jpg"
            }
          ]
        },
        impact: {
          quote: "“The intelligent conversational workflow transformed how our project teams operate. Our field teams saved over 5 hours per week per engineer, directly slashing revision errors.”",
          author: "Marcus Vance",
          title: "VP of Product Engineering · Enterprise Construction Solutions"
        }
      },
      {
        id: "skysite-archive",
        title: "Skysite Archive",
        tag: "Document Management & SaaS",
        subtitle: "Redesigning the enterprise archive experience for construction professionals, streamlining multi-gigabyte document management and fast drawing search.",
        image: "assets/skysite-archive.jpg",
        meta: {
          role: "Principal Product Designer",
          client: "Skysite Enterprise",
          timeline: "12 Weeks (2025)",
          focus: "Information Architecture · Multi-Role Workflows · Performance UI"
        },
        metrics: [
          { num: "3.4x", label: "Faster Batch File Uploads" },
          { num: "89%", label: "Reduction in Support Tickets" },
          { num: "100%", label: "WCAG AAA Accessibility Compliance" },
          { num: "+55%", label: "Document Sharing Efficiency" }
        ],
        challenge: {
          overview: "Legacy document repositories suffered from bloated table views, sluggish file rendering, and confusing permission settings that frustrated multi-disciplinary teams working on tight building deadlines.",
          painPoints: [
            { num: "01", title: "Cluttered Information Architecture", text: "Deep nested folder hierarchies made discovering specific structural drawings difficult." },
            { num: "02", title: "Slow Bulk Actions", text: "Multi-file tagging, sharing, and batch permissions required repetitive multi-step modals." },
            { num: "03", title: "Inconsistent Cross-Platform UI", text: "Desktop web and tablet interfaces lacked design system consistency and coherent navigation." }
          ]
        },
        solution: {
          title: "Streamlined Digital Asset Management",
          desc: "Architected a high-performance grid & list view system with smart faceted filtering, instant drawing preview lightboxes, and frictionless batch operations.",
          quote: "“We eliminated 4 redundant steps from every document retrieval workflow, cutting system latency down to sub-second responses.”",
          features: [
            {
              title: "Faceted Live Search & Instant Drawing Viewer",
              desc: "Instant search indexing with contextual thumbnails that let users inspect high-resolution vector blueprints without downloading.",
              image: "assets/skysite-archive.jpg"
            },
            {
              title: "Unified Permissions & Role Management",
              desc: "A simplified matrix for managing contractors, architects, and client viewing permissions with zero ambiguity.",
              image: "assets/service-enterprise-saas.jpg"
            }
          ]
        },
        impact: {
          quote: "“Sunny's redesign of Skysite Archive set a new benchmark for our entire software ecosystem. Our clients praise the speed, clarity, and ease of navigation daily.”",
          author: "Sarah Jenkins",
          title: "Director of Enterprise UX · Skysite Global"
        }
      },
      {
        id: "hospital-adda",
        title: "Hospital Adda",
        tag: "Healthcare Operations & Booking",
        subtitle: "Creating a seamless healthcare operations and specialist doctor booking platform that simplifies scheduling and patient care coordination.",
        image: "assets/hospital-adda.jpg",
        meta: {
          role: "Lead UI/UX Designer",
          client: "Hospital Adda Healthcare",
          timeline: "12 Weeks (2025)",
          focus: "Healthcare UX · Appointment Systems · Mobile First Design"
        },
        metrics: [
          { num: "+74%", label: "Increase in Online Bookings" },
          { num: "2.1 min", label: "Average Appointment Booking Time" },
          { num: "42%", label: "Reduction in No-Show Rates" },
          { num: "4.9/5", label: "Patient Satisfaction Score" }
        ],
        challenge: {
          overview: "Patients often experienced overwhelming medical jargon, fragmented doctor availability calendars, and unclear fee structures when trying to book critical specialist consultations.",
          painPoints: [
            { num: "01", title: "Complex Specialist Discovery", text: "Patients struggled to match their symptoms with appropriate hospital departments." },
            { num: "02", title: "High Booking Drop-Off", text: "Cumbersome multi-step forms led to high abandonment rates before appointment confirmation." },
            { num: "03", title: "Communication Gaps", text: "Lack of automated pre-appointment instructions led to high hospital no-show rates." }
          ]
        },
        solution: {
          title: "Empathetic, Human-Centered Healthcare",
          desc: "Designed an intuitive 3-step booking journey with natural symptom guided search, real-time doctor availability calendars, and transparent pricing previews.",
          quote: "“By humanizing healthcare terminology and removing friction, we empowered patients to book consultations in under 2 minutes.”",
          features: [
            {
              title: "Symptom-Guided Specialist Matcher",
              desc: "An intuitive conversational questionnaire that guides users to the right department and doctor specialist effortlessly.",
              image: "assets/hospital-adda.jpg"
            },
            {
              title: "Live Queue & Tele-Consultation Hub",
              desc: "Patients can track live waiting room queues and join virtual follow-ups seamlessly across any mobile device.",
              image: "assets/service-product-design.jpg"
            }
          ]
        },
        impact: {
          quote: "“The new patient experience increased our digital appointment volume by 74% and transformed how our hospital connects with patients.”",
          author: "Dr. Arvind Mehta",
          title: "Medical Director · Hospital Adda Network"
        }
      },
      {
        id: "twila",
        title: "Twila",
        tag: "E-Commerce & Digital Brand",
        subtitle: "Designing a high-conversion modern fashion e-commerce experience focused on aesthetic storytelling, intuitive discovery, and frictionless checkout.",
        image: "assets/twila.png",
        meta: {
          role: "Lead Digital Product Designer",
          client: "Twila Fashion House",
          timeline: "12 Weeks (2025)",
          focus: "E-Commerce Strategy · Micro-Interactions · Conversion Rate Optimization"
        },
        metrics: [
          { num: "3.8x", label: "Mobile Conversion Rate Increase" },
          { num: "38%", label: "Higher Average Order Value" },
          { num: "1.4s", label: "Optimized Page Load Speed" },
          { num: "62%", label: "Repeat Purchase Rate" }
        ],
        challenge: {
          overview: "Modern digital fashion consumers expect immersive editorial visuals alongside instant, friction-free purchasing flows. Twila needed a fresh design identity to compete with global luxury retail brands.",
          painPoints: [
            { num: "01", title: "Mobile Friction", text: "Legacy checkout flows had high cart abandonment rates on mobile devices." },
            { num: "02", title: "Static Product Displays", text: "Lack of dynamic sizing guides and video lookbooks reduced buying confidence." },
            { num: "03", title: "Impersonal Discovery", text: "Users couldn't easily browse curated capsule wardrobes or style pairings." }
          ]
        },
        solution: {
          title: "Editorial Storytelling Meets Lightning Checkout",
          desc: "Created a minimalist, typography-led luxury shopping experience featuring immersive lookbooks, dynamic fit predictors, and a streamlined 1-tap checkout.",
          quote: "“We balanced high-fashion editorial aesthetics with rigorous conversion rate optimization, driving a 3.8x lift in mobile checkout success.”",
          features: [
            {
              title: "Interactive Lookbook & Complete the Look",
              desc: "Shoppers can explore complete curated outfits and add multiple complementary garments to bag with a single tap.",
              image: "assets/twila.png"
            },
            {
              title: "One-Page Frictionless Checkout Flow",
              desc: "Eliminated unnecessary form steps with native Apple Pay, Google Pay, and instant guest checkout integration.",
              image: "assets/service-strategy-research.jpg"
            }
          ]
        },
        impact: {
          quote: "“Twila's new digital flagship store elevated our brand prestige and generated immediate, record-breaking revenue growth across mobile channels.”",
          author: "Elena Rostova",
          title: "Head of Digital Commerce · Twila"
        }
      },
      {
        id: "alaya-wellbeing",
        title: "Alaya Wellbeing",
        tag: "Wellness Platform & Booking",
        subtitle: "Designing an immersive wellness and retreat booking experience that connects individuals with personalized mindfulness therapies and instructors.",
        image: "assets/alaya-wellbeing.jpg",
        meta: {
          role: "Lead Product & Brand Designer",
          client: "Alaya Global Wellbeing",
          timeline: "12 Weeks (2025)",
          focus: "Service Design · Mindful UX · Subscription & Booking Flows"
        },
        metrics: [
          { num: "+82%", label: "Member Onboarding Completion" },
          { num: "4.9/5", label: "App Store User Rating" },
          { num: "2.4x", label: "Growth in Multi-Session Packages" },
          { num: "96%", label: "Monthly Member Retention" }
        ],
        challenge: {
          overview: "Wellness seekers often feel intimidated by complex holistic schedules, uncertain session expectations, and disjointed instructor communication.",
          painPoints: [
            { num: "01", title: "Intimidating Onboarding", text: "New users felt overwhelmed by generic class lists without personalized guidance." },
            { num: "02", title: "Clunky Scheduling Matrix", text: "Syncing time zones for live retreat sessions caused friction for global members." },
            { num: "03", title: "Disconnected Progress Tracking", text: "Users lacked a calming space to reflect on personal mindfulness milestones." }
          ]
        },
        solution: {
          title: "Calm, Mindful Digital Sanctuary",
          desc: "Designed a serene, breathing interface with tailored wellness questionnaires, seamless timezone-aware retreat booking, and reflective personal progress journals.",
          quote: "“The design breathes calm from the very first tap, turning a functional booking tool into an essential part of the user's daily self-care ritual.”",
          features: [
            {
              title: "Tailored Wellness Assessment & Matching",
              desc: "A calming questionnaire that curates personalized meditation, yoga, and breathwork journeys suited to user goals.",
              image: "assets/alaya-wellbeing.jpg"
            },
            {
              title: "Seamless Retreat Booking & Schedule Sync",
              desc: "1-tap calendar integration, automated wellness reminders, and live audio prep tracks for upcoming sessions.",
              image: "assets/service-product-design.jpg"
            }
          ]
        },
        impact: {
          quote: "“Sunny delivered a masterpiece in mindful product design. Our community feedback has been extraordinarily positive, with members raving about how intuitive and peaceful the app feels.”",
          author: "Maya Lin",
          title: "Founder & CEO · Alaya Wellbeing"
        }
      }
    ];

    function renderCaseStudy(index) {
      const data = caseStudiesData[index];
      if (!data) return;

      currentProjectIndex = index;
      const nextIndex = (index + 1) % caseStudiesData.length;
      const nextData = caseStudiesData[nextIndex];

      // Update header
      modalHeaderTitle.textContent = data.title;
      modalCounter.textContent = (index + 1) + ' / ' + caseStudiesData.length;

      // Build HTML template
      let html = '';

      // Hero Header
      html += '<div class="cs-detail__hero">';
      html += '  <span class="cs-detail__tag">' + data.tag + '</span>';
      html += '  <h1 class="cs-detail__title">' + data.title + '</h1>';
      html += '  <p class="cs-detail__lead">' + data.subtitle + '</p>';

      // Metadata Grid
      html += '  <div class="cs-detail__meta-grid">';
      html += '    <div class="cs-detail__meta-card">';
      html += '      <span class="cs-detail__meta-card-label">Role</span>';
      html += '      <span class="cs-detail__meta-card-value">' + data.meta.role + '</span>';
      html += '    </div>';
      html += '    <div class="cs-detail__meta-card">';
      html += '      <span class="cs-detail__meta-card-label">Client</span>';
      html += '      <span class="cs-detail__meta-card-value">' + data.meta.client + '</span>';
      html += '    </div>';
      html += '    <div class="cs-detail__meta-card">';
      html += '      <span class="cs-detail__meta-card-label">Timeline</span>';
      html += '      <span class="cs-detail__meta-card-value">' + data.meta.timeline + '</span>';
      html += '    </div>';
      html += '    <div class="cs-detail__meta-card">';
      html += '      <span class="cs-detail__meta-card-label">Focus</span>';
      html += '      <span class="cs-detail__meta-card-value">' + data.meta.focus + '</span>';
      html += '    </div>';
      html += '  </div>';

      // Key Metrics Banner
      html += '  <div class="cs-detail__metrics-grid">';
      data.metrics.forEach(function (m) {
        html += '  <div class="cs-detail__metric-box">';
        html += '    <span class="cs-detail__metric-num">' + m.num + '</span>';
        html += '    <span class="cs-detail__metric-label">' + m.label + '</span>';
        html += '  </div>';
      });
      html += '  </div>';

      // Featured Hero Visual
      html += '  <div class="cs-detail__hero-visual">';
      html += '    <img src="' + data.image + '" alt="' + data.title + ' Showcase" loading="lazy" />';
      html += '  </div>';
      html += '</div>';

      // Section 1: The Challenge
      html += '<section class="cs-detail__section">';
      html += '  <span class="cs-detail__section-tag">01 / The Challenge</span>';
      html += '  <h2 class="cs-detail__section-title">Understanding the Friction & Core Problem</h2>';
      html += '  <p class="cs-detail__paragraph">' + data.challenge.overview + '</p>';
      html += '  <div class="cs-detail__cards-grid">';
      data.challenge.painPoints.forEach(function (p) {
        html += '  <div class="cs-detail__card">';
        html += '    <span class="cs-detail__card-num">' + p.num + '</span>';
        html += '    <h3 class="cs-detail__card-title">' + p.title + '</h3>';
        html += '    <p class="cs-detail__card-text">' + p.text + '</p>';
        html += '  </div>';
      });
      html += '  </div>';
      html += '</section>';

      // Section 2: The Solution
      html += '<section class="cs-detail__section">';
      html += '  <span class="cs-detail__section-tag">02 / Design Solution</span>';
      html += '  <h2 class="cs-detail__section-title">' + data.solution.title + '</h2>';
      html += '  <p class="cs-detail__paragraph">' + data.solution.desc + '</p>';
      html += '  <blockquote class="cs-detail__quote">' + data.solution.quote + '</blockquote>';

      // Feature Split Showcases
      data.solution.features.forEach(function (f, fIdx) {
        const reverseClass = fIdx % 2 === 1 ? ' cs-detail__split-feature--reverse' : '';
        html += '  <div class="cs-detail__split-feature' + reverseClass + '">';
        html += '    <div class="cs-detail__split-text">';
        html += '      <h3 class="cs-detail__split-title">' + f.title + '</h3>';
        html += '      <p class="cs-detail__split-desc">' + f.desc + '</p>';
        html += '    </div>';
        html += '    <div class="cs-detail__split-visual">';
        html += '      <img src="' + f.image + '" alt="' + f.title + '" loading="lazy" />';
        html += '    </div>';
        html += '  </div>';
      });
      html += '</section>';

      // Section 3: Impact & Feedback
      html += '<section class="cs-detail__section">';
      html += '  <span class="cs-detail__section-tag">03 / Outcomes & Testimonial</span>';
      html += '  <h2 class="cs-detail__section-title">Measurable Business Value & Impact</h2>';
      html += '  <div class="cs-detail__testimonial-box">';
      html += '    <p class="cs-detail__testimonial-quote">' + data.impact.quote + '</p>';
      html += '    <div class="cs-detail__testimonial-author">';
      html += '      <div>';
      html += '        <div class="cs-detail__testimonial-name">' + data.impact.author + '</div>';
      html += '        <div class="cs-detail__testimonial-title">' + data.impact.title + '</div>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      html += '</section>';

      // Next Project Teaser Footer
      html += '<div class="cs-detail__next-project" id="csNextProjectCard" data-next-idx="' + nextIndex + '">';
      html += '  <div>';
      html += '    <div class="cs-detail__next-label">Next Project</div>';
      html += '    <div class="cs-detail__next-title">' + nextData.title + ' →</div>';
      html += '  </div>';
      html += '  <div class="cs-detail__next-arrow">';
      html += '    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      html += '  </div>';
      html += '</div>';

      modalContent.innerHTML = html;

      // Scroll modal to top
      if (scroller) scroller.scrollTop = 0;

      // Attach next project click handler
      const nextCard = document.getElementById('csNextProjectCard');
      if (nextCard) {
        nextCard.addEventListener('click', function () {
          renderCaseStudy(nextIndex);
        });
      }
    }

    function openModal(index) {
      renderCaseStudy(index);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modal.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    // Attach click listeners to case studies slides and CTA buttons
    const slides = document.querySelectorAll('.cs-slide');
    slides.forEach(function (slide, idx) {
      const ctaBtn = slide.querySelector('.cs-slide__cta');
      const imgWrap = slide.querySelector('.cs-slide__image-wrap');

      if (ctaBtn) {
        ctaBtn.addEventListener('click', function (e) {
          e.preventDefault();
          openModal(idx);
        });
      }

      if (imgWrap) {
        imgWrap.addEventListener('click', function () {
          openModal(idx);
        });
      }
    });

    // Close button & backdrop
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // Prev / Next buttons in modal header
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        const prevIdx = (currentProjectIndex - 1 + caseStudiesData.length) % caseStudiesData.length;
        renderCaseStudy(prevIdx);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        const nextIdx = (currentProjectIndex + 1) % caseStudiesData.length;
        renderCaseStudy(nextIdx);
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowRight') {
        const nextIdx = (currentProjectIndex + 1) % caseStudiesData.length;
        renderCaseStudy(nextIdx);
      } else if (e.key === 'ArrowLeft') {
        const prevIdx = (currentProjectIndex - 1 + caseStudiesData.length) % caseStudiesData.length;
        renderCaseStudy(prevIdx);
      }
    });
  }

  initCaseStudyModal();



  /* --------------------------------------------------------
     PAGE LOAD — Ensure everything initializes cleanly
     -------------------------------------------------------- */

  window.addEventListener('load', function () {
    document.body.classList.add('is-loaded');
    handleNavScroll();
    handleNavInversion();
    handleServicesParallax();
  });

})();
