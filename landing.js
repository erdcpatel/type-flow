// ==========================================
// TypeFlow Landing Page JavaScript
// Auto-typing animation, particles, and interactions
// ==========================================

// Configuration
const CONFIG = {
    typingText: "The quick brown fox jumps over the lazy dog",
    typingSpeed: 100, // ms per character
    ghostSpeed: 80,   // ms per character (faster than user)
    targetWPM: 45,
    targetAccuracy: 98
};

// State
let typingInterval = null;
let currentIndex = 0;
let ghostIndex = 0;
let startTime = Date.now();

// ==========================================
// Auto-Typing Animation
// ==========================================

function initTypingDemo() {
    const demoText = document.getElementById('demo-text');
    const ghostCursor = document.getElementById('ghost-cursor');
    const wpmElement = document.getElementById('demo-wpm');
    const accElement = document.getElementById('demo-acc');

    if (!demoText || !ghostCursor) return;

    // Prepare text
    const text = CONFIG.typingText;
    demoText.innerHTML = text
        .split('')
        .map((char, i) => {
            if (i === 0) return `<span class="current">${char}</span>`;
            return `<span class="pending">${char}</span>`;
        })
        .join('');

    // Start animation
    startTime = Date.now();
    currentIndex = 0;
    ghostIndex = 0;

    // Ghost cursor animation (faster)
    const ghostInterval = setInterval(() => {
        ghostIndex++;
        if (ghostIndex > text.length) {
            clearInterval(ghostInterval);
            return;
        }
        updateGhostPosition(ghostIndex);
    }, CONFIG.ghostSpeed);

    // User typing animation
    typingInterval = setInterval(() => {
        currentIndex++;
        
        if (currentIndex > text.length) {
            clearInterval(typingInterval);
            animateWPM(0, CONFIG.targetWPM, 1000);
            return;
        }

        updateTypingDisplay(currentIndex);
        updateStats(currentIndex, text.length);
    }, CONFIG.typingSpeed);
}

function updateTypingDisplay(index) {
    const spans = document.querySelectorAll('#demo-text span');
    spans.forEach((span, i) => {
        span.className = '';
        if (i < index) {
            span.className = 'typed';
        } else if (i === index) {
            span.className = 'current';
        } else {
            span.className = 'pending';
        }
    });
}

function updateGhostPosition(index) {
    const demoText = document.getElementById('demo-text');
    const ghostCursor = document.getElementById('ghost-cursor');
    if (!demoText || !ghostCursor) return;

    const spans = demoText.querySelectorAll('span');
    if (index < spans.length) {
        const targetSpan = spans[index];
        const rect = targetSpan.getBoundingClientRect();
        const containerRect = demoText.getBoundingClientRect();
        ghostCursor.style.left = `${rect.left - containerRect.left}px`;
        ghostCursor.style.top = `${rect.top - containerRect.top}px`;
    }
}

function updateStats(current, total) {
    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const charsTyped = current;
    const wordsTyped = charsTyped / 5;
    const wpm = Math.round(wordsTyped / elapsed);
    
    const wpmElement = document.getElementById('demo-wpm');
    if (wpmElement) {
        wpmElement.textContent = Math.min(wpm, CONFIG.targetWPM);
    }
}

function animateWPM(start, end, duration) {
    const wpmElement = document.getElementById('demo-wpm');
    if (!wpmElement) return;

    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(start + (end - start) * easeOutQuad(progress));
        wpmElement.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    animate();
}

function easeOutQuad(t) {
    return t * (2 - t);
}

// ==========================================
// Particle Background
// ==========================================

function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = `rgba(96, 239, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.strokeStyle = `rgba(96, 239, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ==========================================
// Feature Card 3D Tilt Effect
// ==========================================

function init3DTilt() {
    const cards = document.querySelectorAll('[data-tilt]');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

// ==========================================
// Scroll Animations
// ==========================================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate feature card icons
                const icon = entry.target.querySelector('.feature-icon');
                if (icon) {
                    icon.style.animationPlayState = 'running';
                }

                // Animate streak counter
                const streakCounter = entry.target.querySelector('#streak-demo');
                if (streakCounter) {
                    animateCounter(streakCounter, 0, 15, 2000);
                }
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

function animateCounter(element, start, end, duration) {
    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(start + (end - start) * easeOutQuad(progress));
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    animate();
}

// ==========================================
// Demo Button (Restart Animation)
// ==========================================

function initDemoButton() {
    const demoBtn = document.getElementById('demo-btn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            // Clear existing intervals
            if (typingInterval) clearInterval(typingInterval);
            
            // Restart animation
            initTypingDemo();
            
            // Button feedback
            demoBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                demoBtn.style.transform = 'scale(1)';
            }, 100);
        });
    }
}

// ==========================================
// Initialize Everything
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTypingDemo();
    init3DTilt();
    initScrollAnimations();
    initDemoButton();
});

// Restart typing animation when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        if (typingInterval) clearInterval(typingInterval);
        setTimeout(initTypingDemo, 500);
    }
});
