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

let lastAnimatedIndex = -1; // Initialize to -1 to indicate no sections have been animated

// Step 2: Select the element where you want to display the current section
const currentSectionDisplay = document.getElementById('current-section');

const animateOnScroll = (event) => {
  let newScrollPosition = lastKnownScrollPosition + event.deltaY;
  console.log(`Scroll distance: ${newScrollPosition}`);

  // Reset newScrollPosition if it exceeds 4000 or goes into negative
  if (newScrollPosition > 4000) {
    newScrollPosition = 0;
  } else if (newScrollPosition < 0) {
    newScrollPosition = 4000;
  }

  // Log messages for specific scroll distances
  switch (newScrollPosition) {
    case 600:
      console.log("This is where section one will be");
      break;
    case 1600:
      console.log("This is where section two will be");
      break;
    case 2500:
      console.log("This is where section three will be");
      break;
    case 3600:
      console.log("This is where section four will be");
      break;
    default:
      // No default action needed
      break;
  }

  const isScrollingDown = newScrollPosition > lastKnownScrollPosition;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      lastKnownScrollPosition = newScrollPosition;
      const scrollPosition = lastKnownScrollPosition;

      // Hide all sections before determining which one to show
      sections.forEach(({ panel }) => {
        gsap.to(panel, { opacity: 0, duration: 0.5 });
        panel.dataset.animated = 'false';
      });

      const orderedSections = isScrollingDown ? sections : [...sections].reverse();

      orderedSections.some(({ panel, top }, index) => {
        const actualIndex = isScrollingDown ? index : sections.length - 1 - index;
        const isInViewport = scrollPosition >= top - window.innerHeight * 0.8 && scrollPosition < top + panel.offsetHeight;
        const shouldAnimate = isScrollingDown ? actualIndex > lastAnimatedIndex : actualIndex < lastAnimatedIndex;

        if (isInViewport && shouldAnimate) {
          console.log(`Animating section ${actualIndex + 1} at scroll position: ${scrollPosition}`);
          gsap.fromTo(panel, 
            { opacity: 0, y: isScrollingDown ? 100 : -100 },
            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
          );
          panel.dataset.animated = 'true';
          lastAnimatedIndex = actualIndex;

          // Update the current section display
          if (currentSectionDisplay) {
            currentSectionDisplay.textContent = `Current Section: ${panel.dataset.section}`;
          }

          return true; // Break the loop after animating the current section
        }
        return false; // Continue loop if current section is not animated
      });

      ticking = false;
    });

    ticking = true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  sections = calculatePositions();
  window.addEventListener('wheel', animateOnScroll);
  console.log('Wheel and touch listeners attached.'); // Confirm attachment of the wheel and touch events
});

document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);