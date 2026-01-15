import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3; // 0.15 → 0.3 (2x faster)
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 3 + 2; // 2-5px (bigger orbs)

        // ADD PULSING:
        this.pulsePhase = Math.random() * Math.PI * 2; // Random start
        this.pulseSpeed = 0.008 + Math.random() * 0.004; // VERY SLOW: 0.008-0.012
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // UPDATE PULSE:
        this.pulsePhase += this.pulseSpeed;
      }

      draw() {
        // CALCULATE PULSE VALUES (very subtle):
        const pulseSize = this.radius + Math.sin(this.pulsePhase) * 0.3; // ±0.3px
        const pulseOpacity = 0.5 + Math.sin(this.pulsePhase) * 0.15; // 0.35-0.65

        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, pulseSize
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${pulseOpacity * 0.9})`); // 0.6 → 0.9
        gradient.addColorStop(1, `rgba(255, 170, 0, ${pulseOpacity * 0.4})`); // 0.2 → 0.4

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    class DataPacket {
      constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.progress = 0;
        this.speed = 0.005 + Math.random() * 0.003; // SLOW: 0.005-0.008
      }

      update() {
        this.progress += this.speed;
        return this.progress < 1; // Return false when journey complete
      }

      draw(ctx) {
        const x = this.x1 + (this.x2 - this.x1) * this.progress;
        const y = this.y1 + (this.y2 - this.y1) * this.progress;

        // Draw bright yellow dot
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.fill();

        // Add subtle glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      }
    }

    // Create particles - keep at 35 for good network density
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push(new Particle());
    }

    const dataPackets = [];
    let lastPacketSpawn = 0;

    // Animation loop
    const animate = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw lines between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = (1 - distance / 200) * 0.2; // 0.1 → 0.2 (2x brighter)
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`; // Yellow lines
            ctx.lineWidth = 1;
            ctx.stroke();

            // SPAWN DATA PACKETS (rarely, only if not too many exist)
            // Spawn every 2-3 seconds, max 3 packets at once
            if (dataPackets.length < 3 && now - lastPacketSpawn > 2000 && Math.random() < 0.002) {
              dataPackets.push(new DataPacket(p1.x, p1.y, p2.x, p2.y));
              lastPacketSpawn = now;
            }
          }
        });
      });

      // Update and draw data packets
      for (let i = dataPackets.length - 1; i >= 0; i--) {
        if (!dataPackets[i].update()) {
          dataPackets.splice(i, 1); // Remove completed packets
        } else {
          dataPackets[i].draw(ctx);
        }
      }

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.7 }} // 0.5 → 0.7 (more visible)
    />
  );
};

export default AnimatedBackground;