// Scroll-triggered terminal typing + reveal + boot splash + role rotator (with FAST initial sequence)
(function(){
  // ---- Typing util: supports speed (ms) and step (chars per tick) ----
  function typeText(el, text, opts = {}){
    const speed = opts.speed ?? 22;   // delay between ticks (ms)
    const step  = opts.step  ?? 1;    // characters per tick
    return new Promise(resolve => {
      if(!el) return resolve();
      el.classList.add('typing');
      let i = 0;
      el.textContent = '';
      function tick(){
        i += step;
        el.textContent = text.slice(0, i);
        if(i < text.length){
          setTimeout(tick, speed);
        } else {
          el.classList.remove('typing');
          resolve();
        }
      }
      tick();
    });
  }

  // --- Rotating typing subtitle under name ---
  function startRoleRotator(){
    const el = document.getElementById('role-rotator');
    if(!el) return;
    const words = [
      "Data Scientist",
      "AWS Solutions Architect",
      "AI Engineer",
      "ML Engineer",
      "MLOps Engineer",
      "Generative AI Engineer"
    ];
    let wi = 0, i = 0, dir = 1;
    const typeDelay = 55, eraseDelay = 35, holdDelay = 1000, gapDelay = 350;

    function nextWord(){ wi = (wi + 1) % words.length; i = 0; dir = 1; }
    function step(){
      const word = words[wi];
      i += dir;
      el.textContent = word.slice(0, i);

      if(dir > 0 && i === word.length){
        setTimeout(()=>{ dir = -1; step(); }, holdDelay);
      }else if(dir < 0 && i === 0){
        setTimeout(()=>{ nextWord(); step(); }, gapDelay);
      }else{
        setTimeout(step, dir > 0 ? typeDelay : eraseDelay);
      }
    }
    el.textContent = "";
    step();
  }

  function prepBlocks(){
    document.querySelectorAll('.block').forEach(block => {
      Array.from(block.children).forEach(ch => {
        if(!ch.classList.contains('prompt')){
          ch.classList.add('revealable');
        }
      });
      const aboutType = block.querySelector('#about .type');
      if(aboutType){
        aboutType.classList.add('typewriter');
      }
    });
  }

  // --- Boot splash ---
  async function runBootSplash(){
    const splash = document.getElementById('boot-splash');
    const log = document.getElementById('boot-log');
    if(!splash || !log) return;
    const lines = [
      "Phoenix BIOS v4.0 Release 6.0.1",
      "CPU: Neural-Core x64 @ 3.40GHz",
      "Memory Test: 16384K OK",
      "Initializing GPU… OK",
      "Checking storage… OK",
      "Detecting network interface… OK",
      "Loading drivers… OK",
      "Mounting /dev/portfolio … OK",
      "Starting TTY1…",
      "",
      "bhanu@retro:~$ ./start_portfolio.sh"
    ];
    function appendLine(text, withCursor=false){
      const div = document.createElement('div');
      div.className = 'boot-line' + (withCursor ? ' boot-cursor' : '');
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }
    for(let i=0;i<lines.length-1;i++){
      appendLine(lines[i]);
      await new Promise(r=>setTimeout(r, 220));
    }
    const last = appendLine("", true);
    const cmd = lines[lines.length-1];
    for(let i=1;i<=cmd.length;i++){
      last.textContent = cmd.slice(0,i);
      await new Promise(r=>setTimeout(r, 28));
    }
    last.classList.remove('boot-cursor');
    await new Promise(r=>setTimeout(r, 300));
    splash.classList.add('hidden');
    await new Promise(r=>setTimeout(r, 620));
  }

  // ---- Run a single block (supports custom speeds/steps) ----
  async function runBlock(block, opts = {}){
    if(!block || block.dataset.done) return;
    block.dataset.done = "1";

    const cmdSpeed = opts.cmdSpeed ?? 22;
    const cmdStep  = opts.cmdStep  ?? 1;
    const textSpeed= opts.textSpeed?? 8;
    const textStep = opts.textStep ?? 1;

    const prompt = block.querySelector('.prompt');
    const cmd = prompt ? prompt.textContent.trim() : '';
    if(prompt){
      await typeText(prompt, cmd, { speed: cmdSpeed, step: cmdStep });
    }

    const tw = block.querySelector('.typewriter, #about .type');
    if(tw){
      const text = tw.textContent.trim();
      tw.textContent = '';
      Array.from(block.querySelectorAll('.revealable')).forEach(n => {
        if(n !== tw) n.parentElement.classList.add('revealed');
      });
      await typeText(tw, text, { speed: textSpeed, step: textStep });
      block.classList.add('revealed');
    } else {
      block.classList.add('revealed');
    }
  }

  function observeBlocks(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(async entry => {
        if(entry.isIntersecting){
          // Default (slower, readable) speeds for scroll-triggered sections
          await runBlock(entry.target, {
            cmdSpeed: 22, cmdStep: 1,
            textSpeed: 8,  textStep: 1
          });
        }
      });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.2 });
    document.querySelectorAll('.block').forEach(b => io.observe(b));
  }

  function init(){
    (async function(){
      await runBootSplash();
      startRoleRotator();
    })();
    prepBlocks();

    // ===== FAST initial sequence (post‑splash): whoami → about → skills → experience =====
    (async function sequence(){
      // 1) whoami: a bit faster than default, still readable
      const whoami = document.querySelector('header.brand.block');
      await runBlock(whoami, {
        cmdSpeed: 14, cmdStep: 1,
        textSpeed: 6,  textStep: 1
      });

      // 2) about: faster paragraph typing (2 chars per tick)
      const about = document.querySelector('#about.block');
      await runBlock(about, {
        cmdSpeed: 12, cmdStep: 2,
        textSpeed: 4,  textStep: 2
      });

      // 3) skills: quick command + reveal/typing
      const skills = document.querySelector('#skills.block');
      await runBlock(skills, {
        cmdSpeed: 12, cmdStep: 2,
        textSpeed: 4,  textStep: 2
      });

      // 4) experience: still types, but much faster
      const experience = document.querySelector('#experience.block');
      await runBlock(experience, {
        cmdSpeed: 12, cmdStep: 2,
        textSpeed: 4,  textStep: 2
      });

      // Enable scroll-trigger for the rest (uses default speeds)
      observeBlocks();
    })();

    // Contact form stub
    const form = document.getElementById('contact-form');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        console.log('Contact submission', data);
        const status = document.getElementById('status');
        if(status){ status.textContent = 'message queued — thank you!'; setTimeout(()=> status.textContent = '', 4000);}
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
