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
// Determine the current section based on the scroll position and apply/remove classes accordingly
const sectionRanges = [
  { id: "#section1", start: 150, end: 450 },
  { id: "#section2", start: 850, end: 1450 },
  { id: "#section3", start: 1850, end: 2500 },
  { id: "#section4", start: 3000, end: 3500 }
];

sectionRanges.forEach(({ id, start, end }) => {
  const section = document.querySelector(id);
  if (!section) {
    console.log(`Section ${id} not found.`);
    return; // Skip this iteration if the section is not found
  }

  if (newScrollPosition >= start && newScrollPosition <= end) {
    if (!section.classList.contains("visible")) {
      console.log(`Entering ${id}`);
      gsap.to(id, { opacity: 1, duration: 1, ease: 'power2.out' });
      section.classList.add("visible", "enter");
    }
  } else {
    if (section.classList.contains("visible")) {
      console.log(`Exiting ${id}`);
      section.classList.add("exit"); // Add exit class
      gsap.to(id, {
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          section.classList.remove("visible", "enter", "exit"); // Remove classes after animation
        }
      });
    }
  }
});
  const isScrollingDown = newScrollPosition > lastKnownScrollPosition;

  if (!ticking) {
      window.requestAnimationFrame(() => {
        lastKnownScrollPosition = newScrollPosition;
        const scrollPosition = lastKnownScrollPosition;

        // Hide all sections before determining which one to show
        sections.forEach(({ panel }) => {
          if (panel && panel.dataset.section) {
            gsap.to(panel, { opacity: 0, duration: 0.5 });
            panel.dataset.animated = 'false';
          } else {
            console.log("Hey, the section is undefined");
          }
        });

        const orderedSections = isScrollingDown ? sections : [...sections].reverse();

        orderedSections.some(({ panel, top }, index) => {
          if (!panel) {
            console.log("Hey, the section is undefined");
            return false; // Skip to the next iteration if panel is undefined
          }
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
            if (currentSectionDisplay && panel.dataset.section) {
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