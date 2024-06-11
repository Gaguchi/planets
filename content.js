import gsap from 'gsap';

const calculatePositions = () => {
  const panels = Array.from(document.querySelectorAll('.panel'));
  console.log(`Found ${panels.length} panels`); // Debugging log
  return panels.map(panel => {
    const rect = panel.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    return { panel, top: rect.top + scrollTop };
  });
};

let sections = calculatePositions();

let lastKnownScrollPosition = 0;
let ticking = false;

const animateOnWheel = (event) => {
  // Update the lastKnownScrollPosition based on wheel event deltaY
  // Note: This does not actually scroll the page. It's just for triggering animations.
  lastKnownScrollPosition += event.deltaY;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      const scrollPosition = lastKnownScrollPosition;
      console.log(`Scroll position: ${scrollPosition}`); // Debugging log to confirm wheel event

      sections.forEach(({ panel, top }, index) => {
        if (scrollPosition >= top - window.innerHeight * 0.8 && panel.dataset.animated !== 'true') {
          console.log(`Animating section ${index + 1}`);
          gsap.fromTo(panel, 
            { opacity: 0, y: 100 }, // From state
            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' } // To state
          );
          panel.dataset.animated = 'true'; // Mark as animated
        }
      });

      ticking = false;
    });

    ticking = true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  sections = calculatePositions();
  window.addEventListener('wheel', animateOnWheel);
  console.log('Wheel listener attached.'); // Confirm attachment of the wheel event
});

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

let touchStartY = 0;
let touchEndY = 0;

function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    if (!touchStartY) {
        return;
    }

    touchEndY = event.touches[0].clientY;
    let touchDeltaY = touchStartY - touchEndY;

    // Simulate wheel event deltaY with touchDeltaY
    animateOnScroll({ deltaY: touchDeltaY });

    // Reset touchStartY for the next move
    touchStartY = touchEndY;
}

function animateOnScroll(event) {
    // Your existing animateOnWheel function with a more generic name
    // Update the lastKnownScrollPosition based on event deltaY
    lastKnownScrollPosition += event.deltaY;

    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollPosition = lastKnownScrollPosition;

            sections.forEach(({ panel, top }, index) => {
                if (scrollPosition >= top - window.innerHeight * 0.8 && panel.dataset.animated !== 'true') {
                    console.log(`Animating section ${index + 1}`);
                    gsap.fromTo(panel, 
                        { opacity: 0, y: 100 }, // From state
                        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' } // To state
                    );
                    panel.dataset.animated = 'true'; // Mark as animated
                }
            });

            ticking = false;
        });

        ticking = true;
    }
}

// Rename the existing animateOnWheel function to animateOnScroll and replace its calls
document.addEventListener('DOMContentLoaded', () => {
    sections = calculatePositions();
    window.addEventListener('wheel', animateOnScroll);
    console.log('Wheel and touch listeners attached.'); // Confirm attachment of the wheel and touch events
});