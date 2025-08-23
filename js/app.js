
// Scroll-triggered terminal typing + reveal + boot splash + role rotator
(function(){
  function typeText(el, text, speed){
    return new Promise(resolve => {
      if(!el) return resolve();
      el.classList.add('typing');
      let i = 0;
      function step(){
        i++;
        el.textContent = text.slice(0, i);
        if(i < text.length){
          setTimeout(step, speed);
        }else{
          el.classList.remove('typing');
          resolve();
        }
      }
      el.textContent = '';
      step();
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

  // Run a single block
  async function runBlock(block){
    if(!block || block.dataset.done) return;
    block.dataset.done = "1";
    const prompt = block.querySelector('.prompt');
    const cmd = prompt ? prompt.textContent.trim() : '';
    if(prompt){ await typeText(prompt, cmd, 22); }
    const tw = block.querySelector('.typewriter, #about .type');
    if(tw){
      const text = tw.textContent.trim();
      tw.textContent = '';
      Array.from(block.querySelectorAll('.revealable')).forEach(n => { if(n !== tw) n.parentElement.classList.add('revealed'); });
      await typeText(tw, text, 8);
      block.classList.add('revealed');
    } else {
      block.classList.add('revealed');
    }
  }

  function observeBlocks(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(async entry => {
        if(entry.isIntersecting){
          await runBlock(entry.target);
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

    // Auto-run first sections
    const orderSelectors = ['header.brand.block', '#about.block', '#skills.block', '#experience.block'];
    (async function sequence(){
      for(const sel of orderSelectors){
        const block = document.querySelector(sel);
        await runBlock(block);
      }
      // enable scroll for the rest
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
