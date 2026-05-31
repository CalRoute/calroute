/**
 * CalRoute Embed Script
 * Add this to your website to embed a booking widget
 *
 * Usage:
 * <div class="calroute-embed" data-slug="your-link-slug"></div>
 * <script src="https://calroute.me/embed.js"></script>
 */

(function() {
  const embeds = document.querySelectorAll('[data-slug*="calroute"]');

  embeds.forEach(element => {
    const slug = element.getAttribute('data-slug');
    const height = element.getAttribute('data-height') || '600px';
    const width = element.getAttribute('data-width') || '100%';

    if (!slug) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://calroute.me/embed/${slug}`;
    iframe.style.width = width;
    iframe.style.height = height;
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
    iframe.title = 'Book a meeting';

    element.appendChild(iframe);
  });
})();
