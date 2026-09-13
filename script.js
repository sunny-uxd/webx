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

  window.addEventListener('scroll', handleNavScroll, { passive: true });

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

    // Micro-interaction glyphs (*, +, ×, □, ○)
    const glyphChars = ['*', '+', '×', '□', '○'];
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

      // Micro-interactions: occasional glyph emission near cursor interaction
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);
      if (mouse.active && mouseSpeed > 0.9 && glyphs.length < 5 && (time - lastGlyphSpawn > 0.35)) {
        const chosenChar = glyphChars[Math.floor(Math.random() * glyphChars.length)];
        glyphs.push({
          x: mouse.x + (Math.random() - 0.5) * 45,
          y: mouse.y + (Math.random() - 0.5) * 45,
          char: chosenChar,
          vx: (Math.random() - 0.5) * 0.3 + mouse.vx * 0.04,
          vy: -0.28 - Math.random() * 0.3,
          life: 0,
          maxLife: 60 + Math.floor(Math.random() * 25)
        });
        lastGlyphSpawn = time;
      }

      ctx.clearRect(0, 0, width, height);

      // Wave layout configuration: occupies the right side of the hero
      const isMobile = width < 768;
      const waveCenterX = isMobile ? width * 0.52 : width * 0.67;
      const waveCenterY = isMobile ? height * 0.52 : height * 0.48;

      const waveSpanX = isMobile ? width * 0.95 : width * 0.82;
      const waveSpanZ = 720;
      const focalLength = 680;

      // Spring physics parameters (yielding silk-like data flow)
      const spring = 0.042;
      const damping = 0.88;
      const influenceRadius = isMobile ? 150 : 210;

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

        // Alpha calculation: low contrast, depth modulated, typography remains focus
        const depthAlpha = 0.08 + 0.32 * Math.min(1.2, Math.max(0.2, scale));
        const alpha = depthAlpha * edgeFade;

        if (alpha > 0.015) {
          // Particle size: 0.8px to 1.6px
          const size = Math.max(0.75, (0.65 + scale * 0.65));

          ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
          ctx.fillRect(projX - size * 0.5, projY - size * 0.5, size, size);
        }
      }

      // Render micro-interaction glyphs (*, +, ×, □, ○)
      if (glyphs.length > 0) {
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Inter", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let g = glyphs.length - 1; g >= 0; g--) {
          const item = glyphs[g];
          item.life++;
          item.x += item.vx;
          item.y += item.vy;

          const progress = item.life / item.maxLife;
          const glyphAlpha = Math.sin(progress * Math.PI) * 0.20;

          if (glyphAlpha > 0.01 && item.life < item.maxLife) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + glyphAlpha.toFixed(3) + ')';
            ctx.fillText(item.char, item.x, item.y);
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

  window.addEventListener('scroll', highlightActiveSection, { passive: true });


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

  window.addEventListener('scroll', handleNavInversion, { passive: true });


  /* --------------------------------------------------------
     LENIS SMOOTH MOMENTUM SCROLL & PARALLAX ENGINE
     -------------------------------------------------------- */

  let lenis = null;
  const scrollProgressBar = document.getElementById('scrollProgressBar');

  function updateScrollProgress(scroll) {
    if (!scrollProgressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (scroll / maxScroll) * 100));
      scrollProgressBar.style.width = progress + '%';
    }
  }

  // Parallax elements
  const heroContent = document.querySelector('.hero__content');
  const servicesHeaderInner = document.querySelector('.services__header-inner');
  const svcCardVisualImgs = document.querySelectorAll('.svc-card__visual img');
  const metricsWatermark = document.querySelector('.metrics__watermark');
  const aboutVisual = document.querySelector('.about__visual');
  const aboutVisualImg = document.querySelector('.about__visual img');
  const contactHeader = document.querySelector('.contact__left') || document.querySelector('.contact__header');

  function handleParallax(scrollY) {
    if (prefersReducedMotion) return;

    const windowH = window.innerHeight;

    // 1. Hero Parallax: content floats downward as user scrolls away
    if (heroContent && scrollY < windowH * 1.2) {
      const heroOffset = scrollY * 0.22;
      const heroOpacity = Math.max(0, 1 - (scrollY / (windowH * 0.75)));
      heroContent.style.transform = 'translateY(' + heroOffset.toFixed(1) + 'px)';
      heroContent.style.opacity = heroOpacity.toFixed(3);
    }

    // 2. Services Header Parallax
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

    // 3. Service Cards Stacking Images Parallax
    svcCardVisualImgs.forEach(function (img) {
      const card = img.closest('.svc-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = (windowH - rect.top) / (windowH + rect.height);
        const shiftY = (progress - 0.5) * -45;
        img.style.transform = 'translateY(' + shiftY.toFixed(1) + 'px) scale(1.05)';
      }
    });

    // 4. Metrics Watermark Parallax
    if (metricsWatermark) {
      const metricsSection = document.getElementById('metrics');
      if (metricsSection) {
        const rect = metricsSection.getBoundingClientRect();
        if (rect.top < windowH && rect.bottom > 0) {
          const shiftY = ((rect.top - windowH * 0.5) * 0.18);
          metricsWatermark.style.transform = 'translate(-50%, -50%) translateY(' + shiftY.toFixed(1) + 'px)';
        }
      }
    }

    // 5. About Section Visual Parallax
    if (aboutVisual) {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < windowH && rect.bottom > 0) {
          const shiftY = ((rect.top - windowH * 0.5) * -0.12);
          aboutVisual.style.transform = 'translateY(' + shiftY.toFixed(1) + 'px)';
          if (aboutVisualImg) {
            aboutVisualImg.style.transform = 'scale(' + (1.02 + Math.abs(shiftY) * 0.001).toFixed(3) + ')';
          }
        }
      }
    }

    // 6. Contact Section Parallax
    if (contactHeader) {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top < windowH && rect.bottom > 0) {
          const shiftY = Math.max(-12, Math.min(12, (rect.top / windowH) * -16));
          contactHeader.style.transform = 'translateY(' + shiftY.toFixed(1) + 'px)';
        }
      }
    }
  }

  // Initialize Lenis
  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.25,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      infinite: false
    });

    lenis.on('scroll', function (e) {
      handleNavScroll();
      handleNavInversion();
      updateScrollProgress(e.scroll);
      handleParallax(e.scroll);
      highlightActiveSection();
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    window.addEventListener('scroll', function () {
      handleNavScroll();
      handleNavInversion();
      updateScrollProgress(window.scrollY);
      handleParallax(window.scrollY);
      highlightActiveSection();
    }, { passive: true });
  }

  /* --------------------------------------------------------
     SMOOTH SCROLL FOR ANCHOR LINKS (Integrated with Lenis)
     -------------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 70;
        if (lenis) {
          lenis.scrollTo(target, { offset: -navHeight, duration: 1.4 });
        } else {
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });


  /* --------------------------------------------------------
     CASE STUDIES CAROUSEL — Slider navigation & drag
     -------------------------------------------------------- */

  const casesCarousel = document.getElementById('casesCarousel');
  const casesPrevBtn = document.getElementById('casesPrevBtn');
  const casesNextBtn = document.getElementById('casesNextBtn');

  if (casesCarousel) {
    function updateCarouselButtons() {
      const maxScroll = casesCarousel.scrollWidth - casesCarousel.clientWidth;
      const currentScroll = casesCarousel.scrollLeft;

      if (casesPrevBtn) {
        if (currentScroll > 20) {
          casesPrevBtn.classList.add('is-visible');
          casesPrevBtn.disabled = false;
        } else {
          casesPrevBtn.classList.remove('is-visible');
          casesPrevBtn.disabled = true;
        }
      }

      if (casesNextBtn) {
        if (currentScroll >= maxScroll - 20) {
          casesNextBtn.disabled = true;
        } else {
          casesNextBtn.disabled = false;
        }
      }
    }

    casesCarousel.addEventListener('scroll', updateCarouselButtons, { passive: true });

    function getScrollStep() {
      const firstCard = casesCarousel.querySelector('.case-card');
      if (firstCard) {
        const track = casesCarousel.querySelector('.cases__track');
        const gap = track ? parseFloat(getComputedStyle(track).gap) || 30 : 30;
        return firstCard.offsetWidth + gap;
      }
      return 460;
    }

    if (casesNextBtn) {
      casesNextBtn.addEventListener('click', function () {
        casesCarousel.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      });
    }

    if (casesPrevBtn) {
      casesPrevBtn.addEventListener('click', function () {
        casesCarousel.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      });
    }

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let initialScrollLeft = 0;

    casesCarousel.addEventListener('mousedown', function (e) {
      isDown = true;
      startX = e.pageX - casesCarousel.offsetLeft;
      initialScrollLeft = casesCarousel.scrollLeft;
    });

    window.addEventListener('mouseup', function () {
      isDown = false;
    });

    casesCarousel.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - casesCarousel.offsetLeft;
      const walk = (x - startX) * 1.5;
      casesCarousel.scrollLeft = initialScrollLeft - walk;
    });

    updateCarouselButtons();
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
        threshold: 0.25,
        rootMargin: '0px 0px -80px 0px'
      }
    );

    svcCards.forEach(function (card) {
      svcObserver.observe(card);
    });
  }


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
          statusBox.textContent = 'Thank you, ' + nameVal + '! Your inquiry has been dispatched to sunny.rm66@gmail.com. Sunny will reach out to you shortly.';
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
     PAGE LOAD — Ensure everything initializes cleanly
     -------------------------------------------------------- */

  window.addEventListener('load', function () {
    document.body.classList.add('is-loaded');
    handleNavScroll();
    handleNavInversion();
  });

})();
