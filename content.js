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

  let maxScrollPosition = window.innerWidth <= 768 ? 2750 : 4000; // 768px is a common breakpoint for mobile devices

  // Reset newScrollPosition if it exceeds maxScrollPosition or goes into negative
  if (newScrollPosition > maxScrollPosition) {
    newScrollPosition = 0;
  } else if (newScrollPosition < 0) {
    newScrollPosition = maxScrollPosition;
  }

  // Update the debugging panel
  updateDebugPanel();

let sectionRanges;

if (window.innerWidth <= 768) { // 768px is a common breakpoint for mobile devices
  // Adjust the section ranges for mobile devices
  sectionRanges = [
    { id: "#section1", start: 100, end: 250 },
    { id: "#section2", start: 530, end: 930 },
    { id: "#section3", start: 1200, end: 1620 },
    { id: "#section4", start: 1920, end: 2330 }
  ];
} else {
  // Use the original section ranges for larger devices
  sectionRanges = [
    { id: "#section1", start: 100, end: 400 },
    { id: "#section2", start: 800, end: 1400 },
    { id: "#section3", start: 1800, end: 2400 },
    { id: "#section4", start: 3000, end: 3400 }
  ];
}
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

// Create a debugging panel
const debugPanel = document.createElement('div');
debugPanel.style.position = 'fixed';
debugPanel.style.bottom = '0';
debugPanel.style.left = '0';
debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
debugPanel.style.color = 'white';
debugPanel.style.padding = '10px';
debugPanel.style.zIndex = '9999'; // Ensure the panel is always on top
document.body.appendChild(debugPanel);

// Update the debugging panel
const updateDebugPanel = () => {
  debugPanel.textContent = `innerWidth: ${window.innerWidth}, scrollPosition: ${lastKnownScrollPosition}`;
};

// Call updateDebugPanel whenever the window is resized or scrolled
window.addEventListener('resize', updateDebugPanel);
window.addEventListener('scroll', updateDebugPanel);

// Call updateDebugPanel initially to display the initial values
updateDebugPanel();