// Motion stays finite, interruptible, and optional. Content remains available without it.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionEase = 'cubic-bezier(.22,.7,.25,1)';
const imageTransitions = new WeakMap();
const panelTransitions = new WeakMap();
const panelTabIndexes = new WeakMap();

function animateCards(container) {
  if (reduced.matches || !container || !Element.prototype.animate) return;
  [...container.children].forEach((card, index) => card.animate(
    [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 420, delay: Math.min(index * 35, 140), easing: motionEase, fill: 'backwards' }
  ));
}

async function transitionImage(image, src, alt) {
  if (!image) return;
  const token = {};
  imageTransitions.set(image, token);
  if (image.getAttribute('src') === src) { image.alt = alt; return; }
  if (reduced.matches || !Element.prototype.animate) { image.src = src; image.alt = alt; return; }
  const next = new Image();
  next.src = src;
  try { await next.decode(); } catch { return; }
  if (imageTransitions.get(image) !== token) return;
  if (reduced.matches) { image.src = src; image.alt = alt; return; }
  image.parentElement.querySelectorAll('.image-transition-layer').forEach(layer => layer.remove());
  const previous = image.cloneNode(false);
  previous.removeAttribute('id');
  previous.removeAttribute('loading');
  previous.className = 'image-transition-layer';
  previous.alt = '';
  previous.setAttribute('aria-hidden', 'true');
  image.after(previous);
  image.src = src;
  image.alt = alt;
  const fade = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 540, easing: motionEase, fill: 'forwards' });
  fade.onfinish = () => previous.remove();
  fade.oncancel = () => previous.remove();
  image.getAnimations().forEach(animation => animation.cancel());
  image.animate([{ transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 780, easing: motionEase });
}

function showPanel(panel, open) {
  panelTransitions.get(panel)?.cancel();
  if (!open && panel.hidden) return;
  if (open) panel.hidden = false;
  panel.querySelectorAll('a,button,input,select,textarea').forEach(control => {
    if (!open) {
      if (!panelTabIndexes.has(control)) panelTabIndexes.set(control, control.getAttribute('tabindex'));
      control.tabIndex = -1;
    } else if (panelTabIndexes.has(control)) {
      const previous = panelTabIndexes.get(control);
      previous === null ? control.removeAttribute('tabindex') : control.setAttribute('tabindex', previous);
      panelTabIndexes.delete(control);
    }
  });
  panel.style.pointerEvents = open ? '' : 'none';
  if (reduced.matches || !Element.prototype.animate) {
    panel.hidden = !open;
    panel.inert = false;
    return;
  }
  const animation = panel.animate(open
    ? [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'translateY(0)' }]
    : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }],
    { duration: open ? 300 : 170, easing: motionEase, fill: 'both' });
  panelTransitions.set(panel, animation);
  animation.onfinish = () => {
    if (panelTransitions.get(panel) !== animation) return;
    panel.hidden = !open;
    panel.inert = false;
    animation.cancel();
    panelTransitions.delete(panel);
  };
  if (open) {
    panel.querySelectorAll('a').forEach((link, i) => {
      link.getAnimations().forEach(a => a.cancel());
      link.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 320, delay: 50 + Math.min(i * 22, 150), easing: motionEase, fill: 'backwards' });
    });
  }
}

function setupServiceAccordion(container) {
  const entries = [...container.querySelectorAll('details')];
  const states = new WeakMap();
  entries.forEach(entry => {
    entry.removeAttribute('name');
    states.set(entry, { open: entry.open, animation: null, timer: null });
  });
  function setOpen(entry, open) {
    const state = states.get(entry);
    const start = entry.getBoundingClientRect().height;
    clearTimeout(state.timer);
    state.animation?.cancel();
    state.open = open;
    const index = entries.indexOf(entry);
    if (open) transitionImage(document.querySelector('#solution-image'), `/schrauben-technologies-v6/assets/img/${services[index][3]}.webp`, services[index][0]);
    if (reduced.matches || !Element.prototype.animate) { entry.open = open; entry.style.overflow = ''; return; }
    entry.open = true;
    const summary = entry.querySelector('summary');
    const borders = parseFloat(getComputedStyle(entry).borderTopWidth) + parseFloat(getComputedStyle(entry).borderBottomWidth);
    const end = open ? entry.scrollHeight + borders : summary.getBoundingClientRect().height + borders;
    if (Math.abs(start - end) < 1) {
      entry.open = open;
      entry.style.overflow = '';
      state.animation = null;
      return;
    }
    entry.style.overflow = 'hidden';
    const animation = entry.animate([{ height: `${start}px` }, { height: `${end}px` }],
      { duration: 400, easing: motionEase, fill: 'both' });
    state.animation = animation;
    const finish = () => {
      if (state.animation !== animation) return;
      clearTimeout(state.timer);
      entry.open = state.open;
      entry.style.overflow = '';
      animation.cancel();
      state.animation = null;
    };
    animation.finished.then(finish).catch(() => { /* The latest interaction owns cleanup. */ });
    // Also settle state if a browser defers animation events for off-screen content.
    state.timer = setTimeout(finish, 450);
  }
  entries.forEach(entry => entry.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const open = !states.get(entry).open;
    if (open) entries.forEach(other => { if (other !== entry && states.get(other).open) setOpen(other, false); });
    setOpen(entry, open);
  }));
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    entries.forEach(entry => {
      const state = states.get(entry);
      clearTimeout(state.timer);
      state.animation?.cancel();
      state.animation = null;
      entry.open = state.open;
      entry.style.overflow = '';
    });
  });
}

const products=[
['Bolts','bolts','p-bolts','Hexagon heads. Application-specific designs.','fasteners'],
['Screws','screws','p-screws','Standard, special and precision fastening.','fasteners'],
['Nuts','nuts','p-nuts','A secure fit for every assembly.','fasteners'],
['Washers & E Rings','washers-e-rings','p-washers-e-rings','Load distribution and reliable retention.','fasteners'],
['Rivets','rivets','p-rivets','Permanent connections. Lasting strength.','fasteners'],
['Springs & Wire Forms','springs-wire-forms','p-springs-wire-forms','Formed to meet your requirements.','components'],
['Circlips & Retaining Rings','circlips-or-retaining-rings-2','p-circlips','Precision retention for rotating assemblies.','fasteners'],
['Threaded Inserts','threaded-inserts','p-threaded-inserts','Strong, durable internal threads.','fasteners'],
['Threaded Rods & Studs','threaded-rods-studs','p-threaded-rods-studs','Versatility across fastening applications.','fasteners'],
['Dowel Pins','dowel-pins','p-dowel-pins','Accurate positioning and alignment.','components'],
['Machined Components','machined-components','p-machined-components','Precision parts to your specifications.','components']
];
const services=[
['Supplier Selection & Management','supplier-selection-management','Qualified suppliers. Consistent quality. Strategic sourcing and ongoing supplier management to improve delivery performance and control the total cost of procurement.','bolts-pile'],
['Industrial Fastening Solutions','industrial-fastening-solutions','Standard and custom fasteners selected around your application, with engineering support and conformance to international product standards.','s-industrial-fastening-solutions'],
['Precision Machined Components','precision-machined-components','Customized machined components produced to demanding tolerances, supporting prototype development through to production.','s-precision-machined-components'],
['Total Supply Chain Management','total-supply-chain-management','Demand planning, inventory optimization, warehousing, fulfilment and transport coordinated to keep materials moving efficiently.','s-point-of-use-inventory-solutions'],
['Point-of-Use Inventory Solutions','point-of-use-inventory-solutions','VMI, Kanban and replenishment systems put parts where they are needed, reducing handling and helping maintain production flow.','s-point-of-use-inventory-solutions'],
['Cross-Industry Logistics Support','cross-industry-logistics-support','Distribution and logistics tailored to different manufacturing environments, with coordinated inventory, routing and delivery schedules.','s-cross-industry-logistics-support'],
['Strategic Partnership Services','strategic-partnership-services','Collaborative planning, process improvements and cost-reduction initiatives aligned with your long-term manufacturing goals.','s-strategic-partnership-services']
];
function productCard(p,i,reveal=false){return `<a class="product-card${reveal?' reveal':''}" href="/schrauben-technologies-v6/products/${p[1]}/"><div class="product-photo"><span class="product-code">${String(i+1).padStart(2,'0')} / SCHRAUBEN</span><img src="/schrauben-technologies-v6/assets/img/${p[2]}.webp" alt="${p[0]}" width="500" height="400" loading="lazy"><span class="round-arrow" aria-hidden="true">↗</span></div><h3>${p[0]}</h3><p>${p[3]}</p></a>`}
const featured=document.querySelector('#featured-products');if(featured)featured.innerHTML=[0,1,2,10].map(i=>productCard(products[i],i,true)).join('');
const mega=document.querySelector('#mega-links');if(mega)mega.innerHTML=products.map(p=>`<a href="/schrauben-technologies-v6/products/${p[1]}/">${p[0]}</a>`).join('');
let filter='all';const grid=document.querySelector('#product-grid');function renderProducts(){if(!grid)return;const q=document.querySelector('#product-search').value.trim().toLowerCase();const shown=products.filter(p=>(filter==='all'||p[4]===filter)&&p.join(' ').toLowerCase().includes(q));grid.innerHTML=shown.map(p=>productCard(p,products.indexOf(p))).join('');document.querySelector('#empty-results').hidden=shown.length>0;document.querySelector('#result-count').textContent=`${shown.length} product ${shown.length===1?'family':'families'}`;animateCards(grid)}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderProducts()}));document.querySelector('#product-search')?.addEventListener('input',renderProducts);renderProducts();
const list=document.querySelector('#service-list');if(list){list.innerHTML=services.map((s,i)=>`<details name="solutions" ${i===0?'open':''}><summary><span>${String(i+1).padStart(2,'0')}</span>${s[0]}<b aria-hidden="true">+</b></summary><div><p>${s[2]}</p><a href="/schrauben-technologies-v6/services/${s[1]}/">Explore this solution</a></div></details>`).join('');setupServiceAccordion(list)}
const directory=document.querySelector('#service-directory');if(directory)directory.innerHTML=services.map(s=>`<a class="service-card reveal" href="/schrauben-technologies-v6/services/${s[1]}/"><div class="service-image"><img src="/schrauben-technologies-v6/assets/img/${s[3]}.webp" alt="${s[0]}" width="800" height="500" loading="lazy"></div><h2>${s[0]}</h2><p>${s[2]}</p><span class="underlined">Explore this solution <span>↗</span></span></a>`).join('');
const industries=[['Automotive','i-automotive','Automotive production assembly line'],['Home Appliances','i-home-appliances','Home appliance manufacturing'],['Hydraulic & Pneumatic','i-hydraulic','Hydraulic and pneumatic systems'],['Agriculture & Construction','i-agriculture','Agriculture and construction equipment'],['Electrical, Solar & Wind','i-energy','Renewable and electrical energy applications'],['Oil & Gas','i-oil-gas','Oil and gas industry infrastructure']];
const tabs=document.querySelector('#industry-tabs');if(tabs){tabs.innerHTML=industries.map((s,i)=>`<button role="tab" id="industry-tab-${i}" aria-controls="industry-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span>${String(i+1).padStart(2,'0')}</span>${s[0]}<span aria-hidden="true">↗</span></button>`).join('');const buttons=[...tabs.querySelectorAll('button')];const panel=document.querySelector('#industry-panel');panel.setAttribute('aria-labelledby','industry-tab-0');function selectIndustry(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1});const s=industries[i];transitionImage(document.querySelector('#industry-image'),`/schrauben-technologies-v6/assets/img/${s[1]}.webp`,s[2]);document.querySelector('#industry-title').textContent=s[0];document.querySelector('#industry-number').textContent=`${String(i+1).padStart(2,'0')} / 06`;const link=document.querySelector('#industry-link');link.href=`/schrauben-technologies-v6/industries/#${s[1]}`;link.setAttribute('aria-label',`Explore ${s[0]} applications`);panel.setAttribute('aria-labelledby',`industry-tab-${i}`)}buttons.forEach((b,i)=>{b.addEventListener('click',()=>selectIndustry(i));b.addEventListener('keydown',e=>{let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(i+1)%buttons.length;if(['ArrowUp','ArrowLeft'].includes(e.key))next=(i-1+buttons.length)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();selectIndustry(next);buttons[next].focus()}})})}
const menuToggle=document.querySelector('.menu-toggle');const mobileMenu=document.querySelector('#mobile-menu');function closeMobile(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');showPanel(mobileMenu,false);document.body.classList.remove('menu-open')}menuToggle?.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';if(!open){closeMobile();return}menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Close menu');showPanel(mobileMenu,true);document.body.classList.add('menu-open')});mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMobile));const catalogToggle=document.querySelector('.catalog-toggle');const megaMenu=document.querySelector('#mega-menu');function closeMega(){if(catalogToggle)catalogToggle.setAttribute('aria-expanded','false');if(megaMenu&&!megaMenu.hidden)showPanel(megaMenu,false)}catalogToggle?.addEventListener('click',()=>{const open=catalogToggle.getAttribute('aria-expanded')!=='true';catalogToggle.setAttribute('aria-expanded',String(open));showPanel(megaMenu,open)});document.addEventListener('click',e=>{if(!e.target.closest('.nav-products'))closeMega()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menuToggle.getAttribute('aria-expanded')==='true'){closeMobile();menuToggle.focus()}if(catalogToggle.getAttribute('aria-expanded')==='true'){closeMega();catalogToggle.focus()}}if(e.key==='Tab'&&menuToggle.getAttribute('aria-expanded')==='true'){const focusable=[menuToggle,...mobileMenu.querySelectorAll('a')];if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus()}}});window.matchMedia('(min-width: 761px)').addEventListener('change',e=>{if(e.matches)closeMobile();else closeMega()});
document.querySelector('#enquiry-form')?.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target);const body=`Name: ${d.get('name')}\nEmail: ${d.get('email')}\n\n${d.get('message')}`;window.location.href=`mailto:enquiry@schraubentechnologies.com?subject=${encodeURIComponent(d.get('subject')+' — '+d.get('name'))}&body=${encodeURIComponent(body)}`;document.querySelector('#form-status').textContent='Your enquiry is ready in your email app. If it did not open, email enquiry@schraubentechnologies.com directly.'});
// Reveal words without changing the heading's text, line breaks or accessibility tree.
if (!reduced.matches) {
  document.body.classList.add('type-ready');
  document.querySelectorAll('.hero h1,.detail-hero h1,.section-heading h2,.statement,.contact-heading h2').forEach(heading => {
    if (heading.classList.contains('word-heading')) return;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
        const clip = document.createElement('span');
        clip.className = 'motion-word-clip';
        const word = document.createElement('span');
        word.className = 'motion-word';
        word.textContent = part;
        word.style.setProperty('--word-delay', `${Math.min(index++ * 45, 360)}ms`);
        clip.append(word);
        fragment.append(clip);
      });
      node.replaceWith(fragment);
    });
    heading.classList.add('word-heading', 'reveal');
  });
}
document.querySelectorAll('.company-facts>div,.timeline>div,.range-bottom,.catalog-note').forEach(el => el.classList.add('draw-rule'));

// Extend the same reveal language to supporting pages and editorial groups.
const revealSelectors = '.about-editorial>div:last-child,.history .section-heading,.timeline>div,.directors article,.about-cta h2,.detail-hero h1,.detail-hero>p,.detail-content>img,.detail-content>h2,.detail-aside,.career-row,.detail-industry-grid>a';
document.querySelectorAll(revealSelectors).forEach(el => el.classList.add('reveal'));
document.querySelectorAll('.timeline,.directors,.featured-products,.service-directory').forEach(group => {
  [...group.children].forEach((el, i) => el.style.setProperty('--reveal-delay', `${(i % 3) * 75}ms`));
});
document.querySelectorAll('.solutions-media,.industry-panel,.about-image-band').forEach(el => el.classList.add('reveal', 'media-reveal'));
if (!reduced.matches && 'IntersectionObserver' in window) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: 0, rootMargin: '0px 0px 40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
reduced.addEventListener('change', event => {
  document.body.classList.toggle('motion-ready', !event.matches);
  if (event.matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    document.getAnimations().forEach(animation => { try { animation.finish(); } catch { animation.cancel(); } });
  }
  updateScroll();
});
let scheduled = false;
const header = document.querySelector('.site-header');
const progress = document.querySelector('.reading-progress');
const heroImage = document.querySelector('.hero-image');
const hero = document.querySelector('.hero');
const parallaxViewport = window.matchMedia('(min-width: 961px) and (pointer: fine)');
function updateScroll() {
  header.classList.toggle('scrolled', scrollY > 30);
  const total = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
  if (heroImage) {
    const offset = !reduced.matches && parallaxViewport.matches ? Math.min(32, Math.max(0, -hero.getBoundingClientRect().top) * .085) : 0;
    heroImage.style.transform = `translate3d(0,${offset}px,0)`;
  }
  scheduled = false;
}
function onScroll() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
updateScroll();

// Only the product image responds to the pointer; links and layout stay stationary.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let activeProductPhoto = null;
let productPointerFrame = 0;
let pointerPosition = null;
function resetProductPosition() {
  cancelAnimationFrame(productPointerFrame);
  productPointerFrame = 0;
  if (activeProductPhoto) {
    activeProductPhoto.style.setProperty('--product-x', '0px');
    activeProductPhoto.style.setProperty('--product-y', '0px');
    activeProductPhoto = null;
  }
}
document.addEventListener('pointermove', event => {
  if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
  const photo = event.target.closest('.product-photo');
  if (photo !== activeProductPhoto) { resetProductPosition(); activeProductPhoto = photo; }
  if (!photo) return;
  pointerPosition = { x: event.clientX, y: event.clientY };
  if (productPointerFrame) return;
  productPointerFrame = requestAnimationFrame(() => {
    productPointerFrame = 0;
    if (!activeProductPhoto || !activeProductPhoto.isConnected) return;
    const bounds = activeProductPhoto.getBoundingClientRect();
    const x = Math.max(-5, Math.min(5, ((pointerPosition.x - bounds.left) / bounds.width - .5) * 10));
    const y = Math.max(-5, Math.min(5, ((pointerPosition.y - bounds.top) / bounds.height - .5) * 10));
    activeProductPhoto.style.setProperty('--product-x', `${x.toFixed(2)}px`);
    activeProductPhoto.style.setProperty('--product-y', `${y.toFixed(2)}px`);
  });
}, { passive: true });
document.addEventListener('pointerout', event => {
  if (activeProductPhoto && (!event.relatedTarget || !activeProductPhoto.contains(event.relatedTarget))) resetProductPosition();
}, { passive: true });
addEventListener('blur', resetProductPosition);
reduced.addEventListener('change', resetProductPosition);
finePointer.addEventListener('change', resetProductPosition);
