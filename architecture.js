'use strict';
const nodeData = JSON.parse(document.getElementById('node-data').textContent);
const svgStyles = `.node-title{font-size:18px;font-weight:700;fill:#182b43;letter-spacing:-.04em}.node-body{font-size:15px;fill:#52657c}.node-tag{font-size:11px;font-weight:600;letter-spacing:.05em}.node-file{font-size:11px;font-weight:500}.edge{fill:none;stroke-width:1.6}.edge-label{font-size:12px;font-weight:500}.diagram-small{font-size:13px;font-weight:500;fill:#60728a}text{font-family:'Noto Sans KR','Malgun Gothic',sans-serif}`;
function inspect(figure, id) {
  const data = nodeData[id];
  if (!data) return;
  const [title, path, input, output, body] = data;
  const fields = {'detail-title': title, 'detail-path': path, 'detail-input': input, 'detail-output': output, 'detail-body': body};
  for (const [key, value] of Object.entries(fields)) figure.querySelector(`.${key}`).textContent = value;
  figure.querySelectorAll('.node').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.node === id)));
}
document.querySelectorAll('figure.diagram').forEach(figure => {
  inspect(figure, figure.dataset.default);
  figure.querySelectorAll('.node').forEach(node => {
    node.addEventListener('click', () => inspect(figure, node.dataset.node));
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        inspect(figure, node.dataset.node);
      }
    });
  });
});
document.querySelectorAll('.download').forEach(button => button.addEventListener('click', () => {
  const cloned = document.getElementById(button.dataset.svg).cloneNode(true);
  const [width, height] = cloned.getAttribute('viewBox').split(' ').slice(2);
  cloned.setAttribute('width', width);
  cloned.setAttribute('height', height);
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.querySelectorAll('.node').forEach(node => {
    node.removeAttribute('tabindex'); node.removeAttribute('role'); node.removeAttribute('aria-pressed');
  });
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = svgStyles;
  cloned.insertBefore(style, cloned.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(cloned)], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `r1pro-${button.dataset.svg}.svg`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}));
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.header nav a')];
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (active) links.forEach(link => link.classList.toggle('active', link.hash === `#${active.target.id}`));
  }, {rootMargin: '-100px 0px -40% 0px', threshold: [0, .1, .25, .5]});
  links.forEach(link => observer.observe(document.querySelector(link.hash)));
}
