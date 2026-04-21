
      // ── WATER BACKGROUND ──────────────────────────────────────────────
      const canvas = document.getElementById("waterCanvas");
      const ctx = canvas.getContext("2d");

      let W, H, cols, rows;
      const CELL = 18;
      let time = 0;

      // Wave grid: store height map for ripple simulation
      let grid, prev;

      function resizeWater() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cols = Math.ceil(W / CELL) + 2;
        rows = Math.ceil(H / CELL) + 2;
        grid = new Float32Array(cols * rows);
        prev = new Float32Array(cols * rows);
      }

      function idx(c, r) {
        return r * cols + c;
      }

      // Drop a ripple at a canvas position
      function dropRipple(x, y, strength) {
        const c = Math.floor(x / CELL);
        const r = Math.floor(y / CELL);
        if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
          grid[idx(c, r)] = strength;
        }
      }

      // Autonomous ambient ripples
      function ambientRipple() {
        const x = Math.random() * W;
        const y = Math.random() * H;
        dropRipple(x, y, 220 + Math.random() * 280);
        setTimeout(ambientRipple, 600 + Math.random() * 1800);
      }

      function updateWater() {
        const next = new Float32Array(cols * rows);
        const damping = 0.985;
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols - 1; c++) {
            const i = idx(c, r);
            next[i] =
              ((grid[idx(c - 1, r)] +
                grid[idx(c + 1, r)] +
                grid[idx(c, r - 1)] +
                grid[idx(c, r + 1)]) /
                2 -
                prev[i]) *
              damping;
          }
        }
        prev = grid;
        grid = next;
      }

      function drawWater() {
        ctx.clearRect(0, 0, W, H);

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const h = grid[idx(c, r)];
            const hR = grid[idx(c + 1, r)];
            const hD = grid[idx(c, r + 1)];

            // Slope → light intensity
            const dX = (hR - h) * 0.012;
            const dY = (hD - h) * 0.012;
            const light = Math.max(0, Math.min(1, 0.5 + dX - dY));

            if (Math.abs(h) < 0.5) continue; // skip flat cells

            // Gold-tinted water shimmer
            const r1 = Math.floor(180 + light * 30);
            const g1 = Math.floor(140 + light * 40);
            const b1 = Math.floor(80 + light * 20);
            const alpha = Math.min(0.85, Math.abs(h) / 180);

            ctx.fillStyle = `rgba(${r1},${g1},${b1},${alpha})`;
            ctx.fillRect(c * CELL, r * CELL, CELL + 1, CELL + 1);
          }
        }
      }

      // Refraction lines — subtle horizontal caustics
      function drawCaustics() {
        time += 0.008;
        for (let i = 0; i < 6; i++) {
          const y = (Math.sin(time * 0.7 + i * 1.3) * 0.5 + 0.5) * H;
          const alpha = 0.015 + Math.abs(Math.sin(time + i)) * 0.025;
          ctx.strokeStyle = `rgba(200,169,110,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= W; x += 40) {
            ctx.lineTo(x, y + Math.sin(x * 0.012 + time + i) * 12);
          }
          ctx.stroke();
        }
      }

      function loopWater() {
        updateWater();
        drawWater();
        drawCaustics();
        requestAnimationFrame(loopWater);
      }

      window.addEventListener("resize", resizeWater);
      resizeWater();
      ambientRipple();
      loopWater();

      // Scroll to protocols
      function scrollToProtocols() {
        document
          .getElementById("protocols")
          .scrollIntoView({ behavior: "smooth" });
      }

      // Typewriter effect
      const phrases = [
        "I AM the CLI that compiles chaos into clarity.",
        "IT IS generated. The README writes itself.",
        "I SCAN. I FILTER. I EXECUTE with precision.",
        "I TRANSFORM codebases into structured intelligence.",
        "I OPERATE at scale, respecting every .gitignore boundary.",
        "IT IS parsed. It is processed. It is documented.",
        "I PRIORITIZE signal over noise like a true scanner.",
        "I BUILD context that even AI cannot refuse.",
        "I COMMAND documentation pipelines with zero friction.",
        "I GENERATE insight from raw source like a synthesis engine.",
        "IT IS not manual. It is automated. It is inevitable.",
        "I AM the architect of self-documenting systems.",
      ];

      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;
      const el = document.getElementById("typewriter");

      function type() {
        const current = phrases[phraseIndex];
        if (!deleting) {
          el.textContent = current.substring(0, charIndex + 1);
          charIndex++;
          if (charIndex === current.length) {
            deleting = true;
            setTimeout(type, 2200);
            return;
          }
        } else {
          el.textContent = current.substring(0, charIndex - 1);
          charIndex--;
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(type, 400);
            return;
          }
        }
        setTimeout(type, deleting ? 30 : 52);
      }

      type();

      // Intersection observer for fade-in
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.1 },
      );

      document
        .querySelectorAll(".fade-in")
        .forEach((el) => observer.observe(el));